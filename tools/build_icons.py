"""Build assets/icons/simple-icons.svg: one sprite holding only the marks the toolkit uses.

    npm pack simple-icons@16.36.0 && tar xzf simple-icons-16.36.0.tgz
    python3 tools/build_icons.py package

The slugs are read from MARKS in data.js (entries with `si: "<slug>"`). Each icon's path is
copied unchanged into a <symbol>, with no fill, so a mark takes the colour of the text
around it (currentColor). See assets/icons/README.md for the source and the licence.
"""

import json
import re
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
OUT = SITE / "assets" / "icons" / "simple-icons.svg"


def main() -> None:
    package = Path(sys.argv[1] if len(sys.argv) > 1 else "package")
    version = json.loads((package / "package.json").read_text())["version"]
    data = (SITE / "data.js").read_text()
    block = data[data.index("export const MARKS"):]
    block = block[: block.index("};")]
    slugs = sorted(set(re.findall(r'si:\s*"([a-z0-9]+)"', block)))

    symbols = []
    for slug in slugs:
        svg = (package / "icons" / f"{slug}.svg").read_text()
        path = re.search(r'<path d="([^"]+)"', svg).group(1)
        symbols.append(f'<symbol id="si-{slug}" viewBox="0 0 24 24"><path d="{path}"/></symbol>')

    OUT.write_text(
        f"<!-- Simple Icons {version} (https://simpleicons.org), CC0 1.0; some marks Apache-2.0, see README.md."
        " Brand names and marks are trademarks of their owners. -->\n"
        '<svg xmlns="http://www.w3.org/2000/svg">\n' + "\n".join(symbols) + "\n</svg>\n"
    )
    print(f"{len(slugs)} marks, {OUT.stat().st_size / 1024:.1f} KB -> {OUT.relative_to(SITE)}")


if __name__ == "__main__":
    main()
