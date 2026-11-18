"""Build what the shell on the site needs from the project repositories next to this one.

    uv run --no-project --python 3.12 python tools/build_lab.py

Writes lab/py.zip (the two packages that run in the browser, with their config and the
held-out records), lab/recorded.json (real output of runs that need a database or a
model, to replay) and lab/manifest.json (which commit of each repository was used).
"""

import json
import re
import subprocess
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
REPOS = SITE.parent
LAB = SITE / "lab"

PYTHON = {  # repository -> the files the shell imports or reads
    "outbound-call-agent": [
        "src/callagent/__init__.py", "src/callagent/playbook.py", "src/callagent/book.py",
        "src/callagent/gate.py", "src/callagent/guard.py", "src/callagent/tools.py",
        "src/callagent/personas.py", "src/callagent/scoring.py", "src/callagent/report.py",
        "src/callagent/store.py", "config/playbook.yml", "data/leads.csv",
        "data/heldout/personas.jsonl", "results/flag_review.json",
        "results/heldout/calls.guarded.haiku-5-5.jsonl",
        "results/heldout/calls.prompt_only.haiku-5-5.jsonl",
    ],
    "sales-call-qa": [
        "src/callqa/__init__.py", "src/callqa/rubric.py", "src/callqa/synth.py",
        "src/callqa/audio.py", "src/callqa/redact.py", "src/callqa/grader.py",
        "src/callqa/llm.py", "src/callqa/report.py", "src/callqa/store.py",
        "config/script.yml", "data/heldout/calls.jsonl", "data/heldout/transcripts.jsonl",
        "results/heldout/scorecards.asr.haiku-5-5.jsonl",
        "results/heldout/scorecards.asr.sonnet-5-5.jsonl",
        "results/heldout/scorecards.clean.haiku-5-5.jsonl",
    ],
}  # fmt: skip

# The model client is imported by one module but never called here, so the browser gets a
# stand-in with the names that import needs and nothing else.
ANTHROPIC_STUB = '''"""Stand-in for the anthropic package. The shell never calls a model."""


class _Error(Exception):
    pass


APIConnectionError = RateLimitError = InternalServerError = _Error


class AsyncAnthropic:
    def __init__(self, *args, **kwargs):
        raise RuntimeError("No model is available in the browser.")
'''


def commit(repo: str) -> str:
    out = subprocess.run(["git", "-C", str(REPOS / repo), "rev-parse", "--short", "HEAD"],
                         capture_output=True, text=True, check=True)  # fmt: skip
    return out.stdout.strip()


def first_block(readme: Path, starts_with: str) -> str:
    """The first fenced block in a README whose first line starts with ``starts_with``."""
    for block in re.findall(r"```[a-z]*\n(.*?)```", readme.read_text(), flags=re.S):
        if block.lstrip().startswith(starts_with):
            return block.rstrip()
    raise SystemExit(f"no block starting with {starts_with!r} in {readme}")


def warehouse_questions() -> list[dict]:
    """A few evaluated questions, with the governed answer beside the schema-only baseline's."""
    by_id: dict[str, dict] = {}
    for line in (REPOS / "ask-the-warehouse" / "results" / "records.jsonl").read_text().splitlines():
        row = json.loads(line)
        by_id.setdefault(row["id"], {})[row["mode"]] = row
    picked = []
    for qid, modes in by_id.items():
        if "semantic" not in modes:
            continue
        other = next((modes[m] for m in modes if m != "semantic" and not modes[m].get("result_match", True)), None)
        semantic = modes["semantic"]
        picked.append({
            "id": qid,
            "question": semantic["question"],
            "request": semantic["tool_calls"][0] if semantic["tool_calls"] else None,
            "answer": semantic["answer"],
            "right": bool(semantic.get("result_match")),
            "baseline": {"mode": other["mode"], "answer": other["answer"]} if other else None,
        })  # fmt: skip
    wrong_first = sorted(picked, key=lambda q: q["baseline"] is None)
    return wrong_first[:12]


def main() -> None:
    LAB.mkdir(exist_ok=True)
    manifest = {}
    with zipfile.ZipFile(LAB / "py.zip", "w", zipfile.ZIP_DEFLATED) as bundle:
        for repo, files in PYTHON.items():
            manifest[repo] = commit(repo)
            for name in files:
                bundle.write(REPOS / repo / name, f"{repo}/{name}")
        bundle.writestr("anthropic/__init__.py", ANTHROPIC_STUB)
        bundle.write(SITE / "tools" / "labmain.py", "labmain.py")

    recorded = {
        "reconkit": first_block(REPOS / "reconkit" / "README.md", "$ reconkit run"),
        "platform": first_block(REPOS / "airflow-migration-template" / "README.md", "$ dp selftest"),
        "webhooks": first_block(REPOS / "serverless-webhook-ingestion" / "README.md", "$ make demo"),
        "warehouse": warehouse_questions(),
    }
    for repo in ("reconkit", "serverless-webhook-ingestion", "ask-the-warehouse", "airflow-migration-template"):
        manifest[repo] = commit(repo)
    (LAB / "recorded.json").write_text(json.dumps(recorded, indent=1) + "\n")
    (LAB / "manifest.json").write_text(json.dumps(manifest, indent=1, sort_keys=True) + "\n")
    size = (LAB / "py.zip").stat().st_size
    print(f"lab/py.zip {size / 1024:.0f} KB, {len(recorded['warehouse'])} warehouse questions, commits {manifest}")


if __name__ == "__main__":
    main()
