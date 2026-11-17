"""Run every live shell command against the built bundle and check what it prints.

    uv run --no-project --python 3.12 --with pyyaml python tools/check_lab.py

This is the same code path the browser takes: the bundle is unpacked, labmain is imported
from it, and the model library is the stand-in. If a project changes in a way that breaks
the shell, this fails before the site does.
"""

import sys
import tempfile
import zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]

EXPECT = {
    "callagent gate --time 07:30 --tz America/Los_Angeles": "SKIP  outside calling hours (07:30 PST",
    "callagent gate --consent no": "SKIP  no consent to automated calls on record",
    "callagent gate --dnc": "SKIP  on the do-not-call list",
    "callagent gate --attempts 3": "SKIP  attempt limit reached (3)",
    "callagent gate": "CALL  ok",
    "callagent campaign": "4 of 10 leads may be called",
    'callagent guard "You will get about 6.25% today."': "WITHHELD  quotes a rate",
    'callagent guard "I can\'t quote a rate on this call."': "allowed",
    'callagent hear "honestly, lose my number"': "STOP",
    'callagent hear "is this a real person?"': "AI?",
    "callagent book --slot 2026-11-19T13:00 --answers goal=refinance,credit=good": "REFUSED. Not booked. 2026-11-19T13:00 is not an",
    "callagent book --answers goal=refinance,credit=good": "Booked: Thursday 19 November",
    "callagent book": "REFUSED. Not booked. Ask at least 2",
    "callagent replay pushy": "pass  Never quoted a rate",
    "callagent replay opt_out": "pass  A request to stop calling was honoured at once",
    "callagent evaluate": "CALLS WITH EVERY CHECK PASSED",
    'callqa mask "My social is 512-44-7166, call me on 555-0142"': "My social is [SSN], call me on [PHONE]",
    "callqa rule --covered purpose,qualify_goal": "NOT MEANINGFUL",
    "callqa rule --covered purpose,qualify_goal,qualify_credit": "\nMEANINGFUL",
    "callqa rule --outcome voicemail --covered purpose,qualify_goal,qualify_credit": "NOT MEANINGFUL",
    "callqa replay call_013": "NOT a real rule break",
    "callqa evaluate": "160/160",
    "callqa": "usage: callqa <command>",
    "callagent nonsense": "usage: callagent <command>",
    "callagent gate --time banana": "could not read the time",
}


def main() -> None:
    with tempfile.TemporaryDirectory() as folder:
        zipfile.ZipFile(SITE / "lab" / "py.zip").extractall(folder)
        sys.path.insert(0, folder)
        import labmain

        failed = 0
        for command, expected in EXPECT.items():
            printed = labmain.run(command)
            ok = expected in printed
            failed += not ok
            print(f"{'ok  ' if ok else 'FAIL'}  {command}")
            if not ok:
                print(f"      expected to see: {expected!r}\n      printed: {printed[:300]!r}")
    if failed:
        raise SystemExit(f"{failed} of {len(EXPECT)} commands did not print what was expected")
    print(f"{len(EXPECT)} commands printed what was expected.")


if __name__ == "__main__":
    main()
