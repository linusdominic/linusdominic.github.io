# Design notes

How the November 2026 redesign was arrived at: what was looked at, what was taken from it
as an idea, and the direction that came out of it. No code or assets were copied from any
of the sites below.

## Research

Each site was opened in a browser and screenshotted at 1440 wide.

### Galleries and round-ups

| Source | What it showed | Taken as an idea |
| --- | --- | --- |
| [Awwwards, portfolio category](https://www.awwwards.com/websites/portfolio/) | Award winners lean on oversized type, full-bleed media and heavy motion. | Large display type works. Most of the motion is for designers, not for an engineer who has to be read in ten seconds, so it was left out. |
| [Godly](https://godly.website) | A dense masonry of dark, product-led sites; many share mono metadata and soft gradients. | Mono labels for metadata. Gradients kept to one quiet glow. |
| [siteinspire](https://www.siteinspire.com) | Its top pick at the time was Stripe Press: editorial serif on warm paper. | Warm paper rather than pure white for the light theme; a serif for headings. |
| [Minimal Gallery](https://minimal.gallery) | Typographic, grid-led sites with a lot of white space. | Hierarchy carried by size and weight, not by boxes. |
| [Land-book](https://land-book.com) | Behind a bot check from a headless browser, so not reviewed. | |
| [Colorlib, developer portfolios](https://colorlib.com/wp/developer-portfolios/) and [Elementor, web developer portfolios](https://elementor.com/blog/best-web-developer-portfolio-examples/) | 2026 round-ups. The memorable ones have one strong idea; the forgettable ones are templates. | One idea, carried through: a lab report. |

### Engineers' and designers' own sites

| Source | Taken as an idea |
| --- | --- |
| [Brittany Chiang](https://brittanychiang.com) | Experience as a list with a fixed date column, and a section nav that tracks where you are. |
| [Lee Robinson](https://leerob.com) | Restraint: a serif name, short bio, lists. Seniority reads as calm. |
| [Rauno Freiberg](https://rauno.me) | One large typographic statement can be the whole hero. |
| [Paco Coursey](https://paco.me) | Small type, columns of short entries, nothing decorative. Also the author of a well-known command menu. |
| [Emil Kowalski](https://emilkowal.ski) | Title plus one-line description per project scans quickly. |
| [Julia Evans](https://jvns.ca) | Density is fine when the content is real. |
| [The Pudding](https://pudding.cool) | Data journalism puts the number first and the method next to it. |

### Product sites known for craft

| Source | Taken as an idea |
| --- | --- |
| [Linear](https://linear.app) | Muted surfaces, thin hairlines, mono captions, one accent. |
| [Vercel](https://vercel.com) | Geist type family; big, short headline; a grid underlay. |
| [Raycast](https://www.raycast.com) | The command menu as the product. Here it is the way to jump anywhere on a phone. |
| [Stripe docs](https://docs.stripe.com) | "Try it out": a list of runnable examples beside a dark console, on a light page. The shell section follows this layout directly. |
| [Tailwind CSS](https://tailwindcss.com) | Mono annotations above headings. |

### Trend write-ups

- [Line25, web design trends 2026](https://line25.com/articles/web-design-trends-2026/): typography as the hero, fluid `clamp()` type, accessible-first colour tokens, bento grids, scroll-linked motion that explains rather than decorates.
- Bento grids (search summaries of [SaaSFrame's 2026 guide](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide) and others): use one only when items differ in importance, and size cells by importance. Thirteen projects with four featured fits that.
- Scroll-driven and view-transition CSS ([Chrome for Developers](https://developer.chrome.com/blog/scroll-triggered-animations), [Codrops](https://tympanus.net/codrops/2024/01/17/a-practical-introduction-to-scroll-driven-animations-with-css-scroll-and-view)): support is uneven, so anything scroll-linked must degrade to a finished, visible state.

What reads as senior rather than gimmicky, across all of it: real content first, one typeface
idea, one accent, motion that confirms an action, and numbers that are allowed to be the
biggest thing on the page.

## Direction: a lab report

The site's claim is that every number comes from a run and every caveat is stated. The
design makes that claim structural instead of decorative.

- **Two state colours, nothing else.** Green means verified or live. Amber means a caveat.
  Every result on the page has an amber-dotted caveat next to it, in the hero, in the grid
  and in each case study. Chart series are cobalt (the result) and stone (the comparison),
  so they never compete with the state colours.
- **Numbers as the headline.** Results are set large in Geist at weight 600 with tight
  tracking, so the figures carry the page. Labels, repo names and metadata are in Geist Mono.
  (A display serif was tried first and dropped: next to the grotesk and the mono it read as
  a third voice rather than an accent. One family, three weights, reads as one system.)
- **Paper and graphite.** The light theme is warm paper (`#f3f1ea`) with graphite ink; the
  dark theme is graphite (`#0e0f11`), not blue-black. A faint grain and a graph-paper grid
  in the hero are the only texture.
- **The shell stays a terminal.** It is dark in both themes, sits beside grouped example
  commands (live, recorded, résumé), and shows whether Python is idle, loading or ready.
- **Overview, then depth.** A 12-column bento shows all thirteen projects: the four
  featured ones large with a screenshot, the five with charts medium, the four others
  small, plus one tile that invites you to run something. Four case studies follow, each
  with result, caveat, notes, commands, screenshot and chart.

### Typography

| Role | Face | Licence | File |
| --- | --- | --- | --- |
| Display, headings, figures, text and interface | Geist, variable weight (450 to 650) | OFL 1.1 | `assets/fonts/geist-latin-wght-normal.woff2` (29 KB) |
| Code, labels, metadata | Geist Mono, variable weight | OFL 1.1 | `assets/fonts/geist-mono-latin-wght-normal.woff2` (23 KB) |

About 52 KB in total, Latin subset, self-hosted, `font-display: swap`, with metric-matched
local fallbacks (`size-adjust`, `ascent-override`) so the swap does not move the layout.
Licences are in `assets/fonts/OFL-*.txt`.

### Motion

- Hero lines rise in once on load; tiles and charts fade up as they enter; bars grow.
- The theme toggle crossfades with a view transition where supported.
- The career graph animates only while it is on screen.
- `prefers-reduced-motion` turns all of it off, including the graph's particles.

### Accessibility

- Skip link, landmarks, one `h1`, a heading per section, visible focus everywhere.
- Drawer and palette are modal dialogs: focus moves in, Tab is kept inside, Escape closes
  and focus returns to what opened them. The palette is a combobox with a listbox.
- The career graph takes keyboard focus: arrow keys move between nodes, Enter opens one,
  and a live region names the focused node. Every system in it is also a plain button.
- Text contrast is checked with a script against the composited background of every text
  node, in both themes, at 1440 and 390: all pass WCAG AA.
