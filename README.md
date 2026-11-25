# linusdominic.github.io

Interactive portfolio for **Linus Dominic Nathaniel**, Lead Data Engineer / Data Architect.

One page, in this order: a name, one sentence and three headline results, each with its
caveat; all fourteen projects in an overview grid, then four in depth (result, caveat,
notes, commands, screenshot and a chart drawn from its results); a shell where a visitor
can try the projects; experience as a timeline, with the same history as a draggable
graph below it; tools and education; contact. A zero-dependency static site: no
framework, no build step, no trackers.

Design rationale and the research behind it are in [`DESIGN.md`](DESIGN.md).

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | The page skeleton: landmarks, section headings, drawer, palette. |
| `styles.css` | Design tokens for both themes, then every component. |
| `data.js` | Profile, roles, systems, edges, skills and their marks, the core stack, education, graph colours. |
| `lab.js` | `PROJECTS` (the fourteen projects), the shell's project commands, and the hero results, overview grid and case studies. |
| `charts.js` | Small bar and tick charts drawn from each project's results files. |
| `app.js` | Theme, hero copy, career graph, drawer, timeline, toolkit, contact, the shell's résumé queries, palette, scroll progress and section highlighting. |
| `motion.js` | The scripted part of the motion layer: text that decodes, figures that count up, the shell's boot. |
| `lab/` | The Python bundle (`py.zip`), recorded runs and commit manifest. |
| `tools/` | `build_lab.py`, `check_lab.py`, `labmain.py`, `build_icons.py`. |
| `assets/` | Screenshots, `fonts/` with the OFL licences, and `icons/` (the toolkit's mark sprite, with its source and licence). |

## Stack

- Vanilla ES modules, HTML5 Canvas (2D), CSS custom properties
- Fonts, self-hosted (about 52 KB, `font-display: swap`, metric-matched fallbacks): one
  family throughout. Geist (variable weight) for headings, figures and text, Geist Mono for
  code and labels. Both are under the SIL Open Font License; see `assets/fonts/OFL-*.txt`.
- Pyodide from its CDN, loaded only when a live command is first used
- Deployed to GitHub Pages from `main` / root

## Theme

Light ("paper") and dark ("graphite") are both designed. The first visit follows the
system setting (`prefers-color-scheme`); the sun/moon button in the top bar switches and
remembers the choice in `localStorage`. All colours are tokens at the top of
`styles.css`, defined once per theme:

- green (`--accent`) means verified or live, and amber (`--caveat-dot`) marks a caveat.
  Nothing else uses either.
- charts use cobalt for the result and stone for the comparison (`--chart-a`, `--chart-b`).
- the shell is dark in both themes.
- the career graph keeps the three validated category colours in `TYPE_META`; its
  surfaces and text are read from the theme tokens and redrawn when the theme changes.

Text contrast passes WCAG AA in both themes.

## Features

- **Project lab**: a shell over fourteen open-source projects (`lab.js`). Commands marked
  *live* run the project's own Python, unmodified, in the visitor's browser (Pyodide,
  loaded from a CDN the first time a live command is used); the shell's title bar shows
  whether Python is idle, loading or ready. Commands marked *recorded* replay real output
  for the parts that need a database, AWS or a model. Every result says which it was and
  which commit the code came from. Example commands sit beside the shell, grouped into
  live, recorded and résumé queries; Up and Down recall earlier commands.
  `/?run=callagent%20campaign` opens the page and runs a command.
- **Overview grid**: all fourteen projects in a 12-column grid, sized by importance. Each
  tile shows its result, its caveat and a badge (live, recorded, own site, repo only). The
  six mid-sized tiles carry their chart and commands; the four featured ones link to their
  case study. A full-width strip between the mid-sized and the small tiles invites the
  visitor to run a command. A project with its own live site (`site` in `PROJECTS`) gets
  the "own site" badge and a link to it.
- **Charts**: `charts.js` draws small bar charts from numbers copied out of each project's
  results files. Values are printed beside every bar.
- **Career graph**: draggable nodes, hover to highlight lineage, a top-to-bottom layout on
  narrow screens. It takes keyboard focus: arrow keys move between nodes and Enter opens
  one. Every system is also listed as a button below it. It animates only while on
  screen.
- **Detail drawer**: select any role or system for the full run log.
- **Résumé queries**: the same shell answers `whoami`, `select * from experience`,
  `tables`, `marketplace`, `lead`, `infra`, `integrations`, `contact`.
- **Command palette**: `⌘K` / `Ctrl+K` (or the search button) to jump to any section,
  project, role or system, run a command, switch theme or download the CV.
- **Toolkit**: a core-stack row of eight larger cards, then every group as a row of a spec
  sheet. Tools carry a monochrome brand mark from Simple Icons in the theme's ink colour
  (about 47 KB as one sprite, 20 KB gzipped, fetched once and inlined); brands without a
  mark get a monogram; practices are dashed tags. Source, licence and the fallback list
  are in `assets/icons/README.md`.
- **Motion layer**: the hero name and section headings decode from scrambled glyphs, the
  headline figures count up, cards get a scan sweep as they appear and corner brackets on
  hover and focus, tiles and buttons settle from a brief colour split on hover, the hero
  grid drifts with occasional pulses, the shell boots, the theme switch is a scan wipe,
  and link underlines draw like a signal trace. See `DESIGN.md` for the rules it keeps.
- **Navigation**: a sticky top bar with the five sections, the current one highlighted,
  and a reading-progress line.
- **Accessibility**: skip link, landmarks, visible focus, modal dialogs that keep and
  return focus, alt text on every screenshot, brand marks aria-hidden beside their names,
  real text kept for screen readers while a heading decodes, and `prefers-reduced-motion`
  respected (no motion layer, no entrance motion, no graph animation).

## Local dev

```bash
python3 -m http.server 8090
# → http://localhost:8090
```

## Deploy

Push to `main`. GitHub Pages serves from `main` / root: **Settings → Pages → Source: Deploy from a branch**.

GitHub Pages lets browsers cache files for ten minutes, so the stylesheet and the scripts are
loaded with a version query (`styles.css?v=20261127a`, and the same on `app.js` and its imports
of `data.js`, `lab.js`, `motion.js` and `charts.js`, and on the icon sprite). Change that date in
`index.html`, `app.js` and `lab.js` whenever one of those files changes, or returning visitors may
get new HTML with old CSS.

## Rebuilding the lab

The lab's files are built from the project repositories cloned next to this one:

```bash
uv run --no-project --python 3.12 python tools/build_lab.py   # lab/py.zip, recorded.json, manifest.json
uv run --no-project --python 3.12 --with pyyaml python tools/check_lab.py
```

`tools/labmain.py` is the only Python written for the site: it parses a command and calls
the project's own modules. `tools/check_lab.py` runs every live command against the built
bundle, and CI runs it on each push. To add a project, add it to `PROJECTS` in `lab.js`
with a `tier`: `big` (overview tile plus a case study; needs `story`, `shot` and `chart`),
`compact` (a tile with its chart) or `more` (a small tile).

## Editing content

Project content is in `PROJECTS` in `lab.js`. Everything else is in `data.js`:

- `PROFILE`: name, contact, tagline, status, summary
- `NODES`: roles and systems (`kind: "role" | "project"`, `layer` sets the graph column)
- `EDGES`: `[fromId, toId]` pairs
- `SKILLS`, `EDUCATION`: the lists
- `TYPE_META`: node colours and legend labels
