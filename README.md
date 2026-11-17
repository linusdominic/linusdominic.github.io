# linusdominic.github.io

Interactive portfolio for **Linus Dominic Nathaniel** — Lead Data Engineer / Data Architect.

The site renders a career **DAG**: every role and system is a node, every edge a real
progression, with live particle flow along the pipeline. Built as a zero-dependency
static site — no framework, no build step, no trackers.

## Stack

- Vanilla ES modules, HTML5 Canvas (2D), CSS custom properties
- All content lives in `data.js` — edit that file, nothing else
- Three categorical node colours only (`TYPE_META`), validated all-pairs for
  colour-vision deficiency against the dark surface. The current role is marked
  by state (a mint ring plus motion), never by a fourth hue.
- Deployed to GitHub Pages from `main` / root

## Features

- **Project lab** — a shell over nine open-source projects (`lab.js`). Commands marked
  *live* run the project's own Python, unmodified, in the visitor's browser (Pyodide,
  loaded from a CDN the first time a live command is used). Commands marked *recorded*
  replay real output for the parts that need a database, AWS or a model. Every result says
  which it was and which commit the code came from. `/?run=callagent%20campaign` opens the
  page and runs a command.
- **Career DAG** — draggable nodes, hover-to-highlight lineage, animated particle flow.
  Auto-switches to a vertical layout below 720px.
- **Hero ambient graph** — a slow, decorative miniature of the same idea (`#ambient`).
- **Detail drawer** — click any node for the full run log.
- **Résumé queries** — the same shell answers `whoami`, `select * from experience`,
  `marketplace`, `lead`.
- **Command palette** — `⌘K` / `Ctrl+K` to jump anywhere.
- **Boot sequence** — an Airflow-style DAG trigger on load.
- Respects `prefers-reduced-motion`.

## Local dev

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Push to `main`. GitHub Pages serves from `main` / root — **Settings → Pages → Source: Deploy from a branch**.

## Rebuilding the lab

The lab's files are built from the project repositories cloned next to this one:

```bash
uv run --no-project --python 3.12 python tools/build_lab.py   # lab/py.zip, recorded.json, manifest.json
uv run --no-project --python 3.12 --with pyyaml python tools/check_lab.py
```

`tools/labmain.py` is the only Python written for the site: it parses a command and calls
the project's own modules. `tools/check_lab.py` runs every live command against the built
bundle, and CI runs it on each push. To add a project, add it to `PROJECTS` in `lab.js`.

## Editing content

Everything is in `data.js`:

- `PROFILE` — name, contact, tagline, hero stats
- `NODES` — roles and projects (`kind: "role" | "project"`, `layer` sets DAG column/row)
- `EDGES` — `[fromId, toId]` pairs
- `SKILLS`, `EDUCATION` — the lists
- `TYPE_META` — node colours and legend labels
