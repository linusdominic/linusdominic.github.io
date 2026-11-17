"""The commands the portfolio's shell can run for real.

This file runs inside the visitor's browser, in Python compiled to WebAssembly. It imports
the project packages exactly as they are in their repositories and calls them. Nothing
here re-implements a project's logic: it only parses the command and prints the result.
"""

import csv
import io
import json
import re
import shlex
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
AGENT = HERE / "outbound-call-agent"
QA = HERE / "sales-call-qa"
for src in (AGENT / "src", QA / "src"):
    if str(src) not in sys.path:
        sys.path.insert(0, str(src))

DAY = datetime(2026, 11, 18)  # the date every demo uses: a Wednesday


class Usage(Exception):
    pass


def options(args: list[str], flags: tuple[str, ...] = ()) -> tuple[dict[str, str], list[str]]:
    """Split ``--key value`` pairs and bare flags from the remaining words."""
    found: dict[str, str] = {}
    rest: list[str] = []
    index = 0
    while index < len(args):
        word = args[index]
        if word.startswith("--"):
            key = word[2:]
            if key in flags:
                found[key] = "yes"
            elif index + 1 < len(args):
                found[key] = args[index + 1]
                index += 1
            else:
                raise Usage(f"--{key} needs a value")
        else:
            rest.append(word)
        index += 1
    return found, rest


def clock(value: str, zone: str) -> datetime:
    try:
        hour, minute = (int(part) for part in value.split(":"))
        return DAY.replace(hour=hour, minute=minute, tzinfo=ZoneInfo(zone))
    except (ValueError, KeyError) as error:
        raise Usage(f"could not read the time or time zone: {error}") from None


def wrap(text: str, width: int = 86, indent: str = "", hang: int = 0) -> str:
    import textwrap

    return textwrap.fill(text, width, initial_indent=indent, subsequent_indent=indent + " " * hang)


# --- outbound-call-agent ------------------------------------------------------------------


def agent_lead(consent: bool = True, zone: str = "America/New_York"):
    from callagent.book import Lead

    return Lead("L1", "Jordan", "Rivera", "555-0142", zone, consent, "Asked about refinancing.", "12 November 2026")


def callagent_gate(args: list[str]) -> str:
    from callagent.book import Book
    from callagent.gate import may_call
    from callagent.playbook import Playbook

    found, _ = options(args, flags=("dnc",))
    zone = found.get("tz", "America/New_York")
    lead = agent_lead(found.get("consent", "yes") == "yes", zone)
    now = clock(found.get("time", "10:30"), zone)
    book = Book()
    if "dnc" in found:
        book.add_do_not_call(lead.phone, now, "earlier request")
    for number in range(int(found.get("attempts", "0"))):
        book.record_attempt(lead.id, now - timedelta(days=2 * (number + 1)), "voicemail")
    decision = may_call(lead, now, book, Playbook.load())
    verdict = "CALL" if decision.allowed else "SKIP"
    return (
        f"lead: consent={'yes' if lead.consent else 'no'}, do-not-call={'yes' if 'dnc' in found else 'no'}, "
        f"earlier attempts={found.get('attempts', '0')}, local time {now:%H:%M} in {zone}\n"
        f"{verdict}  {decision.reason}"
    )


def callagent_campaign(args: list[str]) -> str:
    from callagent.book import Book, Lead
    from callagent.gate import may_call
    from callagent.playbook import Playbook

    found, _ = options(args)
    now = clock(found.get("time", "10:30"), "America/New_York")
    playbook, book, lines, allowed = Playbook.load(), Book(), [], 0
    for row in csv.DictReader(io.StringIO((AGENT / "data" / "leads.csv").read_text())):
        lead = Lead(row["id"], row["first"], row["last"], row["phone"], row["timezone"],
                    row["consent"] == "yes", row["inquiry"], row["inquiry_date"])  # fmt: skip
        if row["do_not_call"] == "yes":
            book.add_do_not_call(lead.phone, now, "earlier request")
        for stamp in filter(None, row["earlier_attempts"].split(";")):
            at, outcome = stamp.split("=")
            book.record_attempt(lead.id, datetime.fromisoformat(at), outcome)
        decision = may_call(lead, now, book, playbook)
        allowed += decision.allowed
        lines.append(f"{'CALL' if decision.allowed else 'SKIP'}  {lead.id}  {lead.first:<8} {decision.reason}")
    lines.append(f"\n{allowed} of {len(lines)} leads may be called at {now:%A %d %B %Y, %H:%M %Z}.")
    return "\n".join(lines)


def callagent_guard(args: list[str]) -> str:
    from callagent import guard
    from callagent.playbook import Playbook

    text = " ".join(args).strip()
    if not text:
        raise Usage('give the sentence the agent is about to say, for example: callagent guard "You will get 6.25% today."')
    spoken, problems = guard.withhold(text, Playbook.load().fallback)
    if not problems:
        return f"allowed  the agent may say it as written\nspoken:  {spoken}"
    return f"WITHHELD  {', '.join(problems)}\n" + wrap(f"spoken instead: {spoken}")


def callagent_hear(args: list[str]) -> str:
    from callagent import guard

    text = " ".join(args).strip()
    if not text:
        raise Usage('give what the contact says, for example: callagent hear "please take me off your list"')
    lines = []
    if guard.asks_to_stop(text):
        lines.append("STOP  heard a request not to be called. The number goes on the do-not-call list and the call ends.")
    if guard.asks_if_human(text):
        lines.append("AI?   heard a question about being a person. The reply must say it is an AI.")
    return "\n".join(lines) or (
        "nothing for code to act on. The model answers, and still has a tool for opt-outs worded another way."
    )


def callagent_book(args: list[str]) -> str:
    from callagent.book import Book
    from callagent.playbook import Playbook
    from callagent.tools import CallState, Toolbox

    found, _ = options(args)
    lead = agent_lead()
    now = DAY.replace(hour=10, minute=30, tzinfo=lead.tz)
    book = Book()
    book.open_slots(["2026-11-19T10:00", "2026-11-19T13:00", "2026-11-20T10:00"])
    book.take_slot("2026-11-19T13:00", "someone-else")
    box = Toolbox(CallState(lead, now), book, Playbook.load())
    lines = ["calendar: 2026-11-19T10:00 open, 2026-11-19T13:00 taken, 2026-11-20T10:00 open"]
    for pair in filter(None, found.get("answers", "").split(",")):
        field, _, value = pair.partition("=")
        result = box.call("record_answer", {"field": field, "value": value})
        lines.append(f"record_answer {field}={value}: {'refused. ' if result.is_error else ''}{result.content}")
    result = box.call("book_appointment", {"slot": found.get("slot", "2026-11-19T10:00")})
    lines.append(f"book_appointment {found.get('slot', '2026-11-19T10:00')}: " + ("REFUSED. " if result.is_error else "") + result.content)
    lines.append(f"outcome so far: {box.state.outcome}")
    return "\n".join(wrap(line) for line in lines)


def agent_records():
    from callagent import store
    from callagent.personas import Persona

    paths = store.Paths("heldout", AGENT)
    personas = {row["id"]: Persona.from_json(row) for row in store.read(paths.personas)}
    runs = {
        mode: {row["persona"]: row for row in store.read(paths.calls(mode, "claude-haiku-5-5"))}
        for mode in ("guarded", "prompt_only")
    }
    return personas, runs


def callagent_replay(args: list[str]) -> str:
    from callagent.playbook import Playbook
    from callagent.scoring import CHECKS, score

    personas, runs = agent_records()
    found, rest = options(args)
    wanted = rest[0] if rest else "pushy"
    mode = found.get("mode", "guarded")
    if mode not in runs:
        raise Usage("--mode is guarded or prompt_only")
    kinds = sorted({p.kind for p in personas.values()})
    if wanted in personas:
        persona = personas[wanted]
    else:
        matches = [p for p in personas.values() if p.kind == wanted]
        if not matches:
            raise Usage(f"give a contact id (p001 to p200) or a kind: {', '.join(kinds)}")
        persona = matches[int(found.get("n", "1")) - 1 if found.get("n", "1").isdigit() else 0]
    record = {**runs[mode][persona.id], "confirmed_flags": []}
    lines = [f"contact {persona.id}, kind {persona.kind}, {'rules enforced in code' if mode == 'guarded' else 'rules in the prompt only'}", ""]
    for line in record["transcript"]:
        who = "AGENT  " if line["speaker"] == "agent" else "CONTACT"
        lines.append(wrap(f"{who}  {line['text']}", hang=9))
    lines += ["", f"ended as: {record['outcome']}"]
    checks = score(record, persona, Playbook.load())
    for name, passed in checks.items():
        if passed is not None:
            lines.append(f"  {'pass' if passed else 'FAIL'}  {CHECKS[name]}")
    return "\n".join(lines)


def callagent_evaluate(args: list[str]) -> str:
    from callagent import report, store
    from callagent.playbook import Playbook
    from callagent.scoring import CHECKS

    paths = store.Paths("heldout", AGENT)
    personas, _ = agent_records()
    runs, _ = report.load_runs(paths, personas, Playbook.load())
    width = max(len(label) for label in CHECKS.values())
    lines = [f"{'check, counted on the calls it applies to':<{width}}   in code    prompt only", "-" * (width + 26)]
    lines.append(f"{'CALLS WITH EVERY CHECK PASSED':<{width}}   " + "    ".join(f"{len(run.right):>3}/{len(run.records)}" for run in runs))
    for check, label in CHECKS.items():
        cells = []
        for run in runs:
            hits, total = run.tally(check)
            cells.append(f"{hits:>3}/{total:<3}")
        lines.append(f"{label:<{width}}   " + "    ".join(cells))
    lines.append(f"\nscored just now from {sum(len(run.records) for run in runs)} recorded calls with 200 held-out simulated contacts.")
    return "\n".join(lines)


# --- sales-call-qa ------------------------------------------------------------------------


def callqa_mask(args: list[str]) -> str:
    from callqa.redact import redact

    text = " ".join(args).strip()
    if not text:
        raise Usage('give a line from a call, for example: callqa mask "My social is 512-44-7166, call me on 555-0142"')
    masked, counts = redact(text)
    found = ", ".join(f"{count} {label}" for label, count in counts.items()) or "nothing"
    return f"sent to the model:  {masked}\nmasked:             {found}"


def callqa_rule(args: list[str]) -> str:
    from callqa.rubric import Rubric

    rubric = Rubric.load(QA / "config" / "script.yml")
    found, _ = options(args)
    campaign = found.get("campaign", "cold")
    outcome = found.get("outcome", "conversation")
    covered = {step for step in found.get("covered", "").split(",") if step}
    known = [step.id for step in rubric.steps_for(campaign)]
    unknown = covered - set(known)
    if unknown or outcome not in rubric.outcomes:
        raise Usage(f"steps for a {campaign} call: {', '.join(known)}\noutcomes: {', '.join(rubric.outcomes)}")
    meaningful = rubric.is_meaningful(outcome, covered)
    lines = [
        f"outcome: {outcome}   steps covered: {', '.join(sorted(covered)) or 'none'}",
        f"{'MEANINGFUL' if meaningful else 'NOT MEANINGFUL'}   script adherence {rubric.adherence(campaign, covered):.0%}",
        "rule: reached the contact, said why they were calling, and asked at least two of",
        "      qualify_goal, qualify_property, qualify_credit.",
    ]
    return "\n".join(lines)


def qa_records():
    from callqa import store
    from callqa.grader import Scorecard
    from callqa.synth import Call

    paths = store.Paths("heldout", QA)
    calls = {row["call_id"]: Call.from_json(row) for row in store.read(paths.calls)}
    heard = {row["call_id"]: row["segments"] for row in store.read(paths.transcripts)}
    cards = {
        row["call_id"]: Scorecard.from_json(row)
        for row in store.read(paths.scorecards("asr", "claude-haiku-5-5"))
    }
    return calls, heard, cards


def callqa_replay(args: list[str]) -> str:
    from callqa import audio
    from callqa.redact import mask
    from callqa.report import truth_for
    from callqa.rubric import Rubric

    calls, heard, cards = qa_records()
    _, rest = options(args)
    call_id = rest[0] if rest else "call_013"
    if re.fullmatch(r"\d+", call_id):
        call_id = f"call_{int(call_id):03d}"
    if call_id not in cards:
        raise Usage("give a call id from call_001 to call_160, for example: callqa replay call_013")
    call, card = calls[call_id], cards[call_id]
    rubric = Rubric.load(QA / "config" / "script.yml")
    truth = truth_for(call, rubric)
    lines = [f"{call_id}: {call.officer} calling, {call.campaign} call. Transcript from speech recognition, masked:", ""]
    for index, segment in enumerate(mask(audio.from_json(heard[call_id]))):
        who = "OFFICER" if segment.speaker == "agent" else "CONTACT"
        lines.append(wrap(f"[{index:>2}] {who}  {segment.text}", hang=14))
    labels = {step.id: step.label for step in rubric.steps} | {flag.id: flag.label for flag in rubric.flags}
    quotes = {item.id: item for item in card.evidence}
    lines += ["", f"graded outcome: {card.outcome}   {'MEANINGFUL' if card.meaningful else 'not meaningful'}"]
    for step, verdict in card.steps.items():
        if verdict == "not_applicable":
            continue
        mark = "covered" if verdict == "covered" else "MISSING"
        quote = f'  line {quotes[step].line}: "{quotes[step].quote}"' if step in quotes else ""
        wrong = "" if (step in truth.covered) == (verdict == "covered") else "   <- the true label differs"
        lines.append(wrap(f"  {mark}  {labels[step]}{quote}{wrong}", hang=11))
    for flag in card.flags:
        real = "a real rule break" if flag.id in truth.flags else "NOT a real rule break: see the note below"
        lines.append(wrap(f'  FLAG     {labels[flag.id]}  line {flag.line}: "{flag.quote}"  ({real})', hang=11))
    if card.review:
        lines.append(f"sent to a person for review because: {', '.join(card.review)}")
    if any(flag.id not in truth.flags for flag in card.flags):
        said = next((t.text for t in call.turns if "guarantee" in t.text and t.speaker == "agent"), "")
        lines += ["", wrap(f'note: what the officer actually said was "{said}" Speech recognition dropped a word, '
                           "and the grader flagged what the transcript says. This is why a flag goes to a person "
                           "with the recording, and never straight onto anyone's record.")]  # fmt: skip
    return "\n".join(lines)


def callqa_evaluate(args: list[str]) -> str:
    from callqa import report, store
    from callqa.rubric import Rubric
    from callqa.synth import Call

    paths = store.Paths("heldout", QA)
    calls = [Call.from_json(row) for row in store.read(paths.calls)]
    runs = report.load_runs(calls, Rubric.load(QA / "config" / "script.yml"), paths.results)
    lines = [f"{'run':<42} outcome   meaningful   steps     flags real   no error"]
    for run in runs:
        m, f = run.meaningful, run.flags
        lines.append(
            f"{run.name:<42} {run.outcome_ok}/{run.calls}   {m['tp'] + m['tn']}/{run.calls}      "
            f"{run.step_ok}/{run.step_total}   {f['tp']}/{f['tp'] + f['fp']}        {run.calls - len(run.wrong)}/{run.calls}"
        )
    lines.append(f"\nscored just now from {sum(run.calls for run in runs)} stored scorecards against the true labels of 160 held-out calls.")
    return "\n".join(lines)


COMMANDS = {
    "callagent": {
        "gate": (callagent_gate, "may this lead be called?  [--time 07:30] [--tz America/Los_Angeles] [--consent no] [--dnc] [--attempts 3]"),
        "campaign": (callagent_campaign, "run the gate over a sample lead list  [--time 21:30]"),
        "guard": (callagent_guard, 'check a sentence before the agent says it  "You will get 6.25% today."'),
        "hear": (callagent_hear, 'check what the contact says  "please take me off your list"'),
        "book": (callagent_book, "try to book a time  [--slot 2026-11-19T13:00] [--answers goal=refinance,credit=good]"),
        "replay": (callagent_replay, "replay a held-out simulated call and score it  [pushy|opt_out|rate_seeker|p074] [--mode prompt_only]"),
        "evaluate": (callagent_evaluate, "score all 400 recorded calls again, here"),
    },
    "callqa": {
        "mask": (callqa_mask, 'mask personal details in a line  "My social is 512-44-7166"'),
        "rule": (callqa_rule, "apply the rule for a meaningful call  --covered purpose,qualify_goal,qualify_credit"),
        "replay": (callqa_replay, "show one graded call with its evidence  [call_013]"),
        "evaluate": (callqa_evaluate, "score the stored grades against the true labels again, here"),
    },
}


def usage(program: str) -> str:
    rows = [f"  {program} {name:<9} {text}" for name, (_, text) in COMMANDS[program].items()]
    return f"usage: {program} <command>\n" + "\n".join(rows)


def run(line: str) -> str:
    """Run one command line and return what it prints."""
    try:
        words = shlex.split(line)
    except ValueError as error:
        return f"could not read that: {error}"
    if not words or words[0] not in COMMANDS:
        return f"unknown program. Try: {', '.join(COMMANDS)}"
    program, rest = words[0], words[1:]
    if not rest or rest[0] in ("help", "--help", "-h") or rest[0] not in COMMANDS[program]:
        return usage(program)
    try:
        return COMMANDS[program][rest[0]][0](rest[1:])
    except Usage as error:
        return str(error)


def manifest() -> str:
    return json.dumps({program: {name: text for name, (_, text) in subs.items()} for program, subs in COMMANDS.items()})
