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

- **Career DAG** — draggable nodes, hover-to-highlight lineage, animated particle flow.
  Auto-switches to a vertical layout below 720px.
- **Hero ambient graph** — a slow, decorative miniature of the same idea (`#ambient`).
- **Detail drawer** — click any node for the full run log.
- **Query console** — a real command surface over the résumé (`help`, `select * from experience`,
  `marketplace`, `lead`).
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

## Editing content

Everything is in `data.js`:

- `PROFILE` — name, contact, tagline, hero stats
- `NODES` — roles and projects (`kind: "role" | "project"`, `layer` sets DAG column/row)
- `EDGES` — `[fromId, toId]` pairs
- `SKILLS`, `EDUCATION` — the lists
- `TYPE_META` — node colours and legend labels
