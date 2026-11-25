import { PROFILE, NODES, EDGES, SKILLS, MARKS, CORE_STACK, EDUCATION, TYPE_META } from "./data.js?v=20261126a";
import { lab, renderProof, renderProjects, STARTERS, PROJECTS } from "./lab.js?v=20261126a";
import { decode, countUp, onEnter, boot, pauseOffscreen } from "./motion.js?v=20261126a";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const reduced = () => MOTION.matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
const roles = NODES.filter((n) => n.kind === "role");
const projs = NODES.filter((n) => n.kind === "project");
const current = NODES.find((n) => n.current);
const HERO_TRY = 'callagent guard "You will get about 6.25% today."';

/* ══════════════════ THEME ══════════════════ */
// The head script has already set data-theme. A saved choice wins; otherwise follow the system.
const root = document.documentElement;
const themeBtn = $("#themeBtn");
function paintThemeButton() {
  const dark = root.dataset.theme === "dark";
  themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  themeBtn.title = dark ? "Light theme" : "Dark theme";
}
function setTheme(theme, save) {
  const apply = () => {
    root.dataset.theme = theme;
    paintThemeButton();
    graphColors();
  };
  if (save) { try { localStorage.setItem("theme", theme); } catch {} }
  if (!document.startViewTransition || reduced()) return apply();
  // A scan wipe: the new theme is revealed top to bottom behind one travelling line.
  const scan = document.createElement("div");
  scan.className = "theme-scan";
  scan.setAttribute("aria-hidden", "true");
  root.classList.add("vt-scan");
  const vt = document.startViewTransition(() => { document.body.append(scan); apply(); });
  vt.finished.finally(() => { scan.remove(); root.classList.remove("vt-scan"); });
}
themeBtn.onclick = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch {}
  if (!saved) setTheme(e.matches ? "dark" : "light", false);
});
paintThemeButton();

/* ══════════════════ HERO + COPY ══════════════════ */
$("#heroRole").textContent = `${PROFILE.status} · ${PROFILE.location}`;
$("#tagline").innerHTML = esc(PROFILE.tagline).replace("how each one was measured", "<em>how each one was measured</em>");
$("#heroNow").innerHTML =
  `<span class="now-tag">Now</span><span>${esc(current.sub)} at <b>${esc(current.label)}</b> <span class="now-place">${esc(current.place)}</span></span>`;
$("#tryCmd").textContent = HERO_TRY;
$("#summary").textContent = PROFILE.summary;
$("#statusLine").textContent = `${PROFILE.status}. Based in ${PROFILE.location}.`;
$("#footL").textContent = `© ${new Date().getFullYear()} ${PROFILE.name}`;
$("#footR").textContent = `last_run ${new Date().toISOString().slice(0, 10)}`;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
$("#palKey").textContent = isMac ? "⌘K" : "Ctrl K";

/* ══════════════════ DAG ══════════════════ */
const cv = $("#dag"), ctx = cv.getContext("2d");
let NW = 168, NH = 52, LAYER_STEP = 250, SLOT_STEP = 168, VERT = false;
let flowOn = !reduced(), hover = null, focusNode = null, drag = null, moved = false, visible = false, running = false;
let view = { s: 1, x: 0, y: 0 };
const particles = [];
const G = {};

// Canvas colours come from the theme's tokens, read again whenever the theme changes.
function graphColors() {
  Object.assign(G, {
    node: css("--g-node"), nodeOn: css("--g-node-on"), text: css("--ink"), sub: css("--ink-3"),
    edge: css("--g-edge"), arrow: css("--g-arrow"), grid: css("--g-grid"), border: css("--g-border"),
    accent: css("--accent"), focus: css("--focus"),
    sans: css("--sans"), mono: css("--mono"),
  });
  if (!running) draw(true);
}

// Narrow screens get a top-to-bottom layout; a layer wider than the screen wraps onto
// a second row, so nodes stay at full size instead of shrinking to fit.
let PER = 99, ROWS = 0;
const dagWrap = cv.parentElement;
const byLayer = {};
NODES.forEach((n) => (byLayer[n.layer] ??= []).push(n));
const LAYERS = Object.keys(byLayer).map(Number).sort((a, b) => a - b);
function setMode() {
  const cw = cv.clientWidth;
  VERT = cw < 720;
  if (VERT) {
    PER = cw < 560 ? 2 : 3;
    NW = Math.max(120, Math.min(176, (cw - 48 - 14 * (PER - 1)) / PER));
    NH = 46; SLOT_STEP = NW + 14; LAYER_STEP = NH + 34;
    ROWS = LAYERS.reduce((r, L) => r + Math.ceil(byLayer[L].length / PER), 0);
  } else { PER = 99; NW = 182; NH = 54; LAYER_STEP = 258; SLOT_STEP = 152; }
}
function layout() {
  setMode();
  let row = 0;
  LAYERS.forEach((L) => {
    const arr = byLayer[L];
    for (let i = 0; i < arr.length; i += PER) {
      const chunk = arr.slice(i, i + PER);
      chunk.forEach((n, j) => {
        const across = (j - (chunk.length - 1) / 2) * SLOT_STEP;
        if (VERT) { n.x = across; n.y = row * LAYER_STEP; }
        else { n.x = L * LAYER_STEP; n.y = across; }
      });
      row++;
    }
  });
  fit();
}
function fit() {
  const pad = VERT ? 24 : 56;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y);
  const w = Math.max(...xs) - Math.min(...xs) + NW + pad * 2;
  const h = Math.max(...ys) - Math.min(...ys) + NH + pad * 2;
  const cw = cv.clientWidth, ch = cv.clientHeight;
  view.s = Math.min(cw / w, ch / h, VERT ? 1 : 1.3);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  view.x = cw / 2 - cx * view.s;
  view.y = ch / 2 - cy * view.s;
}
let lastMode = null;
function resize() {
  setMode();
  // In the narrow layout the panel is as tall as the graph needs.
  dagWrap.style.height = VERT ? `${ROWS * LAYER_STEP - (LAYER_STEP - NH) + 64}px` : "";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.clientWidth * dpr;
  cv.height = cv.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mode = `${VERT}-${PER}-${Math.round(NW)}`;
  if (mode !== lastMode) { lastMode = mode; layout(); }
  else fit();
  if (!running) draw(true);
}
const w2s = (x, y) => [x * view.s + view.x, y * view.s + view.y];
const s2w = (x, y) => [(x - view.x) / view.s, (y - view.y) / view.s];

function edgePath(a, b) {
  if (VERT) {
    const x1 = a.x, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y - NH / 2;
    const dy = Math.max(30, (y2 - y1) * 0.5);
    return { x1, y1, x2, y2, c1x: x1, c1y: y1 + dy, c2x: x2, c2y: y2 - dy };
  }
  const x1 = a.x + NW / 2, y1 = a.y, x2 = b.x - NW / 2, y2 = b.y;
  const dx = Math.max(60, (x2 - x1) * 0.5);
  return { x1, y1, x2, y2, c1x: x1 + dx, c1y: y1, c2x: x2 - dx, c2y: y2 };
}
function bez(p, t) {
  const u = 1 - t;
  return [
    u * u * u * p.x1 + 3 * u * u * t * p.c1x + 3 * u * t * t * p.c2x + t * t * t * p.x2,
    u * u * u * p.y1 + 3 * u * u * t * p.c1y + 3 * u * t * t * p.c2y + t * t * t * p.y2,
  ];
}
function spawn() {
  if (!flowOn || reduced() || particles.length > 90) return;
  const e = EDGES[(Math.random() * EDGES.length) | 0];
  const a = byId[e[0]], b = byId[e[1]];
  if (!a || !b) return;
  particles.push({ a, b, t: 0, sp: 0.0035 + Math.random() * 0.004, c: TYPE_META[b.type].color });
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clip(t, max, font) {
  ctx.font = font;
  if (ctx.measureText(t).width <= max) return t;
  let s = t;
  while (s.length > 3 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

let tick = 0;
// once = a single still frame (theme change, resize, reduced motion, off screen)
function draw(once = false) {
  if (!G.node) return;
  tick++;
  const cw = cv.clientWidth, ch = cv.clientHeight;
  ctx.clearRect(0, 0, cw, ch);

  ctx.strokeStyle = G.grid;
  ctx.lineWidth = 1;
  const g = 40 * view.s;
  for (let x = view.x % g; x < cw; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
  for (let y = view.y % g; y < ch; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

  const hi = hover || drag?.n || focusNode;
  const linked = new Set();
  if (hi) EDGES.forEach(([s, t]) => { if (s === hi.id) linked.add(t); if (t === hi.id) linked.add(s); });

  EDGES.forEach(([s, t]) => {
    const a = byId[s], b = byId[t];
    const p = edgePath(a, b);
    const on = hi && (s === hi.id || t === hi.id);
    ctx.beginPath();
    const [X1, Y1] = w2s(p.x1, p.y1), [C1X, C1Y] = w2s(p.c1x, p.c1y),
          [C2X, C2Y] = w2s(p.c2x, p.c2y), [X2, Y2] = w2s(p.x2, p.y2);
    ctx.moveTo(X1, Y1);
    ctx.bezierCurveTo(C1X, C1Y, C2X, C2Y, X2, Y2);
    ctx.strokeStyle = on ? TYPE_META[b.type].color : G.edge;
    ctx.lineWidth = on ? 1.8 : 1.1;
    ctx.stroke();
    const [ax, ay] = bez(p, 0.97), [bx2, by2] = bez(p, 1);
    const ang = Math.atan2(by2 - ay, bx2 - ax);
    const [AX, AY] = w2s(bx2, by2);
    ctx.beginPath();
    ctx.moveTo(AX, AY);
    ctx.lineTo(AX - 7 * Math.cos(ang - 0.4), AY - 7 * Math.sin(ang - 0.4));
    ctx.lineTo(AX - 7 * Math.cos(ang + 0.4), AY - 7 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fillStyle = on ? TYPE_META[b.type].color : G.arrow;
    ctx.fill();
  });

  if (!once) {
    if (tick % 7 === 0) spawn();
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.t += pt.sp;
      if (pt.t >= 1) { particles.splice(i, 1); continue; }
      const [wx, wy] = bez(edgePath(pt.a, pt.b), pt.t);
      const [sx, sy] = w2s(wx, wy);
      ctx.globalAlpha = 0.15 + Math.sin(pt.t * Math.PI) * 0.85;
      ctx.fillStyle = pt.c;
      ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  NODES.forEach((n) => {
    const meta = TYPE_META[n.type];
    const [sx, sy] = w2s(n.x, n.y);
    const w = NW * view.s, h = NH * view.s;
    const x = sx - w / 2, y = sy - h / 2;
    const active = hi === n;
    const dim = hi && hi !== n && !linked.has(n.id);
    ctx.globalAlpha = dim ? 0.32 : 1;

    roundRect(x, y, w, h, 8 * view.s);
    ctx.fillStyle = active ? G.nodeOn : G.node;
    ctx.fill();
    ctx.strokeStyle = n.current ? G.accent : active ? meta.color : G.border;
    ctx.lineWidth = active || n.current ? 1.8 : 1;
    ctx.stroke();

    ctx.save();
    roundRect(x, y, w, h, 8 * view.s); ctx.clip();
    ctx.fillStyle = meta.color;
    ctx.fillRect(x, y, 3.5 * view.s, h);
    ctx.restore();

    const fs = Math.max(10, 12.5 * view.s);
    ctx.fillStyle = G.text;
    ctx.textBaseline = "middle";
    const lbl = (VERT && n.short) ? n.short : n.label;
    const f1 = `600 ${fs}px ${G.sans}`;
    ctx.fillText(clip(lbl, w - 24 * view.s, f1), x + 13 * view.s, sy - 7 * view.s);
    const fs2 = Math.max(9, 9.5 * view.s);
    const f2 = `500 ${fs2}px ${G.mono}`;
    ctx.fillStyle = G.sub;
    ctx.fillText(clip(n.sub, w - 24 * view.s, f2), x + 13 * view.s, sy + 9 * view.s);

    if (n.current) {
      const r = 3 * view.s, cx = x + w - 11 * view.s, cy = y + 10 * view.s;
      ctx.fillStyle = G.accent;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      if (!once && !reduced()) {
        ctx.globalAlpha = (dim ? 0.32 : 1) * (0.3 + 0.3 * Math.sin(tick / 22));
        ctx.beginPath(); ctx.arc(cx, cy, r + 3.5 * view.s, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // keyboard focus: a ring outside the node, drawn in the focus colour
    if (focusNode === n && document.activeElement === cv) {
      roundRect(x - 4, y - 4, w + 8, h + 8, 11 * view.s);
      ctx.strokeStyle = G.focus;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}
function loop() {
  if (!visible || reduced()) { running = false; draw(true); return; }
  running = true;
  draw();
  requestAnimationFrame(loop);
}
// Animate only while the graph is on screen.
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible && !running) loop();
}).observe(cv);
MOTION.addEventListener("change", () => { flowOn = !reduced(); paintFlow(); if (visible && !running) loop(); });

function hit(mx, my) {
  const [wx, wy] = s2w(mx, my);
  return NODES.slice().reverse().find(
    (n) => Math.abs(wx - n.x) < NW / 2 && Math.abs(wy - n.y) < NH / 2
  ) || null;
}
function pos(e) {
  const r = cv.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
const CLICK_SLOP = 5; // px of travel still counted as a click, not a drag
const redraw = () => { if (!running) draw(true); };

cv.addEventListener("pointerdown", (e) => {
  const [mx, my] = pos(e);
  const n = hit(mx, my);
  moved = false;
  const [wx, wy] = s2w(mx, my);
  drag = n
    ? { n, ox: wx - n.x, oy: wy - n.y, sx: mx, sy: my }
    : { pan: true, px: mx, py: my, sx: mx, sy: my };
  cv.classList.add("dragging");
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", (e) => {
  const [mx, my] = pos(e);
  if (drag) {
    if (Math.hypot(mx - drag.sx, my - drag.sy) > CLICK_SLOP) moved = true;
    if (drag.pan) { view.x += mx - drag.px; view.y += my - drag.py; drag.px = mx; drag.py = my; }
    else { const [wx, wy] = s2w(mx, my); drag.n.x = wx - drag.ox; drag.n.y = wy - drag.oy; }
  } else {
    const n = hit(mx, my);
    hover = n;
    cv.style.cursor = n ? "pointer" : "grab";
  }
  redraw();
});
cv.addEventListener("pointerup", (e) => {
  const [mx, my] = pos(e);
  if (drag && !drag.pan && !moved) openDrawer(drag.n, cv);
  else if (drag?.pan && !moved) { const n = hit(mx, my); if (n) openDrawer(n, cv); }
  drag = null;
  cv.classList.remove("dragging");
  redraw();
});
cv.addEventListener("pointerleave", () => { hover = null; redraw(); });

// Keyboard: arrows move between nodes in reading order of the layout, Enter opens one.
function nearest(from, dx, dy) {
  let best = null, score = Infinity;
  NODES.forEach((n) => {
    if (n === from) return;
    const vx = n.x - from.x, vy = n.y - from.y;
    const along = vx * dx + vy * dy;
    if (along <= 0) return;
    const off = Math.abs(vx * dy - vy * dx);
    const s = along + off * 2.2;
    if (s < score) { score = s; best = n; }
  });
  return best;
}
function focusOn(n) {
  focusNode = n;
  $("#dagLive").textContent = `${n.label}, ${n.sub}. ${n.kind}. Press Enter for the detail.`;
  redraw();
}
cv.addEventListener("focus", () => focusOn(focusNode || current));
cv.addEventListener("blur", () => { focusNode = null; redraw(); });
cv.addEventListener("keydown", (e) => {
  const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
  if (dir) {
    e.preventDefault();
    const next = nearest(focusNode || current, ...dir);
    if (next) focusOn(next);
  } else if ((e.key === "Enter" || e.key === " ") && focusNode) {
    e.preventDefault();
    openDrawer(focusNode, cv);
  } else if (e.key === "Home") { e.preventDefault(); focusOn(NODES[0]); }
  else if (e.key === "End") { e.preventDefault(); focusOn(NODES[NODES.length - 1]); }
});
cv.setAttribute("aria-label", `Career graph: ${roles.length} roles and ${projs.length} systems, connected by what led to what.`);

$("#btnRelayout").onclick = () => { layout(); redraw(); };
function paintFlow() {
  const b = $("#btnFlow");
  b.setAttribute("aria-pressed", String(flowOn));
  b.textContent = flowOn ? "Flow on" : "Flow off";
  b.disabled = reduced();
}
$("#btnFlow").onclick = () => {
  flowOn = !flowOn;
  if (!flowOn) particles.length = 0;
  paintFlow();
};
paintFlow();
window.addEventListener("resize", resize);

$("#legend").innerHTML =
  Object.values(TYPE_META)
    .map((v) => `<span class="chip"><i style="background:${v.color}"></i>${v.name.toLowerCase()}</span>`)
    .join("") +
  `<span class="chip state"><i></i>current</span>`;

$("#sysList").innerHTML = projs.map((n) =>
  `<button type="button" data-id="${n.id}"><i style="background:${TYPE_META[n.type].color}" aria-hidden="true"></i>${esc(n.label)}</button>`).join("");
$$("#sysList button").forEach((b) => (b.onclick = () => openDrawer(byId[b.dataset.id], b)));

layout();
resize();
graphColors();

/* ══════════════════ DRAWER ══════════════════ */
const drawer = $("#drawer"), scrim = $("#scrim");
let drawerReturn = null;
function openDrawer(n, from) {
  const meta = TYPE_META[n.type];
  const colour = n.current ? "var(--accent)" : meta.color;
  $("#dKind").innerHTML =
    `<i style="background:${colour}"></i><span>${n.current ? "current role" : meta.name.toLowerCase()}</span><span class="d-kind-sub">· ${n.kind}</span>`;
  $("#dTitle").textContent = n.label;
  $("#dSub").textContent = n.sub;
  $("#dMeta").innerHTML = [n.period, n.place].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join("");
  $("#dBody").innerHTML = n.body.map((b) => `<li>${b}</li>`).join("");
  $("#dTags").innerHTML = (n.tags || []).map((t) => `<span>${esc(t)}</span>`).join("");
  $("#dLink").innerHTML = n.link
    ? `<a class="btn" href="${n.link}" target="_blank" rel="noopener">${n.linkLabel || "Open ↗"}</a>` : "";
  drawerReturn = from || document.activeElement;
  scrim.hidden = false;
  drawer.inert = false;
  drawer.classList.add("open");
  requestAnimationFrame(() => scrim.classList.add("open"));
  document.body.classList.add("locked");
  $("#dClose").focus({ preventScroll: true });
}
function closeDrawer() {
  if (!drawer.classList.contains("open")) return;
  drawer.classList.remove("open");
  scrim.classList.remove("open");
  drawer.inert = true;
  document.body.classList.remove("locked");
  setTimeout(() => { scrim.hidden = true; }, 300);
  drawerReturn?.focus?.({ preventScroll: true });
}
$("#dClose").onclick = closeDrawer;
scrim.onclick = closeDrawer;
// Keep Tab inside an open dialog.
function trap(e, box) {
  if (e.key !== "Tab") return;
  const f = [...box.querySelectorAll("a[href], button:not([disabled]), input, [tabindex='0']")].filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
drawer.addEventListener("keydown", (e) => trap(e, drawer));

/* ══════════════════ LISTS ══════════════════ */
$("#expList").innerHTML = roles.slice().reverse().map((n) => `
  <li class="tl-item${n.current ? " now" : ""}">
    <button type="button" data-id="${n.id}">
      <span class="tl-per">${esc(n.period)}</span>
      <span class="tl-main">
        <span class="tl-org">${esc(n.label)}${n.current ? `<span class="tl-now">now</span>` : ""}</span>
        <span class="tl-role">${esc(n.sub)}</span>
        <span class="tl-place">${esc(n.place)}</span>
      </span>
      ${n.badge ? `<span class="badge">${esc(n.badge)}</span>` : ""}
      <span class="tl-go" aria-hidden="true">→</span>
    </button>
  </li>`).join("");
$$(".tl-item button").forEach((b) => (b.onclick = () => openDrawer(byId[b.dataset.id], b)));

// Tools carry a monochrome mark in the text colour; practices and patterns are plain tags.
// The name is always the visible text and every mark is aria-hidden.
const mark = (name) => {
  const m = MARKS[name];
  if (!m) return "";
  return m.si
    ? `<svg class="mk" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><use href="#si-${m.si}"/></svg>`
    : `<span class="mk mk-mono" data-len="${m.mono.length}" aria-hidden="true">${esc(m.mono)}</span>`;
};
$("#kitCore").innerHTML = CORE_STACK.map((c) => `
  <li class="core-card reveal scan hud">${mark(c.name)}<span class="core-name">${esc(c.name)}</span><span class="core-note">${esc(c.note)}</span></li>`).join("");
$("#skillGrid").innerHTML = SKILLS.map((s, i) => `
  <div class="kit-row reveal"><dt><span class="kit-idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="kit-name">${esc(s.group)}</span><span class="kit-n" aria-hidden="true">${s.items.length}</span></dt>
  <dd><ul class="kit-items">${s.items.map((it) => MARKS[it]
    ? `<li class="tool">${mark(it)}<span>${esc(it)}</span></li>`
    : `<li class="tag">${esc(it)}</li>`).join("")}</ul></dd></div>`).join("");
// One sprite holding only the marks used, fetched once and inlined so <use> follows
// currentColor. If it does not load, every name is still there.
fetch("assets/icons/simple-icons.svg?v=20261126a")
  .then((r) => (r.ok ? r.text() : ""))
  .then((svg) => {
    if (!svg) return;
    const box = document.createElement("div");
    box.className = "sprite";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML = svg;
    document.body.prepend(box);
  })
  .catch(() => {});

$("#edu").innerHTML = `
  <div><h3>Education</h3><p><b>${esc(EDUCATION.degree)}</b></p><p>${esc(EDUCATION.school)}</p><p class="mono">${esc(EDUCATION.period)}</p></div>
  <div><h3>Certifications</h3><ul>${EDUCATION.certs.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
  <div><h3>Languages</h3><ul>${EDUCATION.languages.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>`;

$("#mailBig").href = `mailto:${PROFILE.email}`;
$("#mailBig").innerHTML = `${esc(PROFILE.email)} <span aria-hidden="true">↗</span>`;
$("#contactGrid").innerHTML = [
  ["phone", PROFILE.phone, `tel:${PROFILE.phone.replace(/\s/g, "")}`],
  ["linkedin", "in/linus-dominic", PROFILE.linkedin],
  ["github", "@linusdominic", PROFILE.github],
  ["cv", "linus-nathaniel-resume.pdf", "linus-nathaniel-resume.pdf"],
  ["location", PROFILE.location, ""],
].map(([l, v, h]) => {
  if (!h) return `<div class="contact-card"><span class="l">${l}</span><span class="v">${esc(v)}</span></div>`;
  const ext = /^https?:/.test(h);
  const attrs = l === "cv" ? "download" : ext ? `target="_blank" rel="noopener"` : "";
  return `<a class="contact-card hud" href="${h}" ${attrs}><span class="l">${l}</span><span class="v">${esc(v)}</span><span class="go" aria-hidden="true">${l === "cv" ? "↓" : ext ? "↗" : "→"}</span></a>`;
}).join("");

/* ══════════════════ CONSOLE ══════════════════ */
const out = $("#cOut"), inp = $("#cIn");

function w(html, cls = "") { out.insertAdjacentHTML("beforeend", `<div class="${cls}">${html}</div>`); out.scrollTop = out.scrollHeight; }
function table(rows, cols) {
  const widths = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)));
  const line = (ch) => "+" + widths.map((n) => ch.repeat(n + 2)).join("+") + "+";
  const row = (cells) => "| " + cells.map((c, i) => String(c).padEnd(widths[i])).join(" | ") + " |";
  return [line("-"), row(cols), line("="), ...rows.map(row), line("-")].join("\n");
}

const CMDS = {
  help: () => w(`<span class="k">Try the projects:</span>
  <span class="v">lab</span>               the fourteen projects and what runs here
  <span class="v">callagent</span>         the calling agent's rules, live in your browser
  <span class="v">callqa</span>            the call grader's masking and scoring, live
  <span class="v">askwh</span>             recorded answers from the warehouse assistant
  <span class="v">reconkit demo</span>     recorded run of the table diff
  <span class="v">webhooks demo</span>     recorded run of the 18 invariants
  <span class="v">platform selftest</span> recorded self-test of the Airflow platform template
  <span class="v">open &lt;project&gt;</span>    the result, the caveat and the link

<span class="k">Query the résumé:</span>
  <span class="v">help</span>              this message
  <span class="v">tables</span>            list queryable tables
  <span class="v">select * from X</span>   X ∈ experience | projects | skills | leadership | education
  <span class="v">whoami</span>            the short version
  <span class="v">marketplace</span>       marketplace platform experience
  <span class="v">lead</span>              team leadership detail
  <span class="v">infra</span>             AWS and platform ownership
  <span class="v">integrations</span>      third-party vendor integrations
  <span class="v">contact</span>           how to reach me
  <span class="v">clear</span>             wipe the console`),

  tables: () => w(table(
    [["experience", roles.length], ["projects", projs.length], ["skills", SKILLS.length], ["leadership", 1], ["infra", 1], ["integrations", 1], ["education", 1]],
    ["table_name", "rows"])),

  whoami: () => w(`<span class="k">${PROFILE.name}</span>
${PROFILE.role} · ${PROFILE.location}
${PROFILE.tagline}
<span class="v">${PROFILE.status}</span>`),

  marketplace: () => w(`<span class="k">marketplace_experience</span>
<span class="v">Connection Cloud Marketplace</span> · Arpatech (Pvt) Ltd, 2022-2023
  A multi-vendor cloud-services marketplace. I engineered the Custom Data
  Insights platform on top of it: ingestion of vendor + buyer transaction
  data, spend analytics, and comparative analysis visualisations used by
  both sides of the marketplace to price and compare offerings.

<span class="k">adjacent / transferable</span>
  Altair Capital Group: two-sided funnel modeling across ~2M entities,
  high-volume listing-style inventory, event-level dialer + CRM streams.
  The shape of the problem is the same as a vehicle marketplace: many
  supply-side listings, many demand-side events, one journey to reconcile.`),

  lead: () => w(`<span class="k">leadership</span>
<span class="v">Altair Capital Group</span> · Lead Data Engineer / Data Architect
  team_size        : 4–6 engineers
  scope            : data platform, BI, integrations
  responsibilities : architecture ownership, sprint planning, code review,
                     technical standards, mentorship, hiring input
  outcomes         : unified customer-journey model (~2M entities),
                     re-architected S3 data lake (~29 jobs),
                     programmatic Superset BI platform

<span class="v">VentureDive</span> · Senior Data Engineer
  ran the Talend to Airflow platform migration; mentored juniors;
  codified team-wide Airflow / dbt / Terraform standards.

<span class="v">Bleed AI</span> · Lead Support Engineer and Data Analyst
  ran data analysis for computer-vision delivery.`),

  infra: () => w(`<span class="k">aws_and_platform</span>
<span class="v">I own the whole AWS footprint at Altair.</span>
  compute      : EC2 behind nginx, Lambda, ECS / Fargate
  data         : RDS PostgreSQL, S3 (documents + data lake), Athena, Redshift
  edge         : CloudFront, API Gateway
  ops          : CloudWatch, SNS, Secrets Manager, SSM, IAM
  deploy       : guarded publish-to-EC2, boot migrations, readiness vs
                 liveness endpoints, drain-aware restarts, restore from S3

<span class="k">measured_results</span>
  hydration payload   7.75MB  ->  124KB   (per-domain version vectors)
  audit query (267k)  seq scan ->  0.06ms  (the right expression index)
  search              PostgreSQL pg_trgm + tsvector, no extra engine

Also built and run the borrower portal itself: Node + PostgreSQL with a
React 19 / TypeScript front end migrated in as a strangler, covering
onboarding, loans, documents, e-sign, underwriting and realtime sync.`),

  integrations: () => w(`<span class="k">vendor_integrations</span>
<span class="v">first wave</span>
  Zoho CRM     deal-to-loan field + picklist mapping into the portal
  Zoho Mail    OAuth transactional mail
  Twilio       voice, recordings, browser softphone
  Telnyx       dialer origination
  Square       bookings and payments

<span class="v">then the Cotality (ex-CoreLogic) suite</span>
  Instant Merge   credit reports
  SSA-89          SSN verification
  LoanSafe        fraud checks
  ValueLink       appraisal ordering, 1004 / 1025 / 1014, UAD 3.6

<span class="v">the SSA-89 callback edge</span>
  Its own Lambda behind API Gateway: validates the vendor token and source
  CIDR, archives each payload to S3 with server-side encryption, relays to
  the portal over short-lived HMAC headers, and lets the portal do an
  idempotent order update before returning the vendor ACK.

<span class="v">house rule</span>
  A visible failure beats a silent one. Irreversible paid actions are never
  auto-retried; they land in an ambiguous state a human must reconcile.`),

  contact: () => w(`<span class="k">sinks</span>
  email    <span class="v">${PROFILE.email}</span>
  phone    <span class="v">${PROFILE.phone}</span>
  linkedin <span class="v">${PROFILE.linkedin}</span>
  github   <span class="v">${PROFILE.github}</span>`),

  clear: () => (out.innerHTML = ""),
};

const SELECTS = {
  experience: () => table(roles.map((r) => [r.label, r.sub, r.period]), ["company", "title", "period"]),
  projects: () => table(projs.map((p) => [p.label, p.period, (p.tags || []).slice(0, 2).join(", ")]), ["project", "org", "stack"]),
  skills: () => table(SKILLS.map((s) => [s.group, s.items.length]), ["group", "n"]),
  leadership: () => table([["Altair Capital Group", "4–6", "platform / BI / integrations"], ["VentureDive", "mentorship", "Airflow migration"], ["Bleed AI", "support team", "CV delivery"]], ["org", "team", "scope"]),
  education: () => table([[EDUCATION.degree, EDUCATION.school, EDUCATION.period]], ["degree", "school", "period"]),
};

function run(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  w(`<span class="q">❯ ${esc(cmd)}</span>`);
  const low = cmd.toLowerCase().replace(/;$/, "");
  if (CMDS[low]) return CMDS[low]();
  if (lab.handles(cmd)) return lab.run(cmd, (html) => w(html));
  const m = low.match(/from\s+(\w+)/);
  if (low.startsWith("select") && m && SELECTS[m[1]]) {
    const res = SELECTS[m[1]]();
    if (/lead\s*=\s*true|where.*lead/.test(low)) return CMDS.lead();
    if (/marketplace/.test(low)) return CMDS.marketplace();
    return w(res);
  }
  if (/marketplace/.test(low)) return CMDS.marketplace();
  if (/\baws|infra|cloud|postgres|platform|portal/.test(low)) return CMDS.infra();
  if (/integration|cotality|corelogic|valuelink|zoho|twilio|telnyx|square|vendor/.test(low)) return CMDS.integrations();
  if (/\blead|team|manage/.test(low)) return CMDS.lead();
  if (low === "ls" || low === "dir") return CMDS.tables();
  w(`<span class="e">error: unknown command "${esc(cmd)}". try <b>help</b></span>`);
}

// Up and down recall earlier commands, like a real shell.
const history = [];
let hIdx = 0;
inp.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    if (inp.value.trim()) history.push(inp.value);
    hIdx = history.length;
    run(inp.value);
    inp.value = "";
  } else if (e.key === "ArrowUp" && history.length) {
    e.preventDefault();
    hIdx = Math.max(0, hIdx - 1);
    inp.value = history[hIdx];
  } else if (e.key === "ArrowDown" && history.length) {
    e.preventDefault();
    hIdx = Math.min(history.length, hIdx + 1);
    inp.value = history[hIdx] ?? "";
  }
});

// Hint buttons, grouped by what they do.
const liveProgs = new Set(PROJECTS.filter((p) => p.kind === "live").map((p) => p.prog));
const HINTS = [
  { title: "Live in your browser", tag: "live", items: STARTERS.filter((c) => liveProgs.has(c.split(" ")[0])) },
  { title: "Recorded runs", tag: "rec", items: [...STARTERS.filter((c) => c !== "lab" && !liveProgs.has(c.split(" ")[0])), "webhooks demo", "platform selftest"] },
  { title: "Start here", tag: "", items: ["lab", "help"] },
  { title: "Query the résumé", tag: "", items: ["whoami", "select * from experience", "tables", "clear"] },
];
$("#cHints").innerHTML = HINTS.map((g) => `
  <div class="hint-group">
    <p class="hint-title">${g.tag === "live" ? '<span class="lab-kind live">live</span>' : g.tag === "rec" ? '<span class="lab-kind rec">recorded</span>' : ""}${g.title}</p>
    <div class="hint-list">${g.items.map((h) => `<button type="button" data-c="${esc(h)}"><code>${esc(h)}</code></button>`).join("")}</div>
  </div>`).join("");
$$("#cHints button").forEach((b) => (b.onclick = () => { run(b.dataset.c); inp.focus({ preventScroll: true }); }));

// One line per span, so the boot can type them in one after another.
w(`<span class="bl"><span class="k">lab</span> ready · 14 projects. Two run their real code here, in your browser. Others replay recorded runs.</span>`
  + `<span class="bl"><span class="k">career.db</span> connected · 5 roles, ${projs.length} projects, ${SKILLS.length} skill groups indexed.</span>`
  + `<span class="bl">type <span class="v">lab</span> or click a command. <span class="v">help</span> lists everything.</span>`, "boot");
boot(out.firstElementChild);

document.addEventListener("lab:python", (e) => {
  const s = $("#pyStatus");
  s.dataset.state = e.detail.state;
  s.querySelector("span").textContent = e.detail.text;
});

const runInShell = (c) => {
  $("#query").scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  run(c);
};
$("#tryLine").onclick = () => runInShell(HERO_TRY);
renderProof($("#heroProof"));
renderProjects($("#projectGrid"), $("#projectCases"), runInShell);
// A link can carry a command: /?run=callagent%20campaign opens the shell and runs it.
const linked = new URLSearchParams(location.search).get("run");
if (linked) setTimeout(() => { $("#query").scrollIntoView({ block: "center" }); run(linked.slice(0, 200)); }, 700);

/* ══════════════════ PALETTE ══════════════════ */
const jump = (h) => document.querySelector(h).scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
const PAL = [
  { t: "Work: fourteen projects", s: "section", go: () => jump("#projects") },
  { t: "Try it live: the shell", s: "section", go: () => jump("#lab") },
  { t: "Experience", s: "section", go: () => jump("#experience") },
  { t: "Toolkit", s: "section", go: () => jump("#skills") },
  { t: "Contact", s: "section", go: () => jump("#contact") },
  ...PROJECTS.map((p) => ({ t: p.repo, s: "project", go: () => jump(`#p-${p.repo}`) })),
  ...NODES.map((n) => ({ t: n.label, s: n.kind, go: () => openDrawer(n) })),
  { t: `Run: ${HERO_TRY}`, s: "command", go: () => runInShell(HERO_TRY) },
  { t: "Run: lab", s: "command", go: () => runInShell("lab") },
  { t: "Switch theme", s: "action", go: () => themeBtn.click() },
  { t: "Download CV", s: "action", go: () => $("#cvBtn").click() },
  { t: "LinkedIn", s: "link", go: () => open(PROFILE.linkedin, "_blank", "noopener") },
  { t: "GitHub", s: "link", go: () => open(PROFILE.github, "_blank", "noopener") },
];
const pal = $("#palette"), palInput = $("#palInput"), palList = $("#palList");
let palSel = 0, palRes = PAL, palReturn = null;
function paintSel() {
  $$("#palList .pal-item").forEach((el, i) => {
    el.classList.toggle("sel", i === palSel);
    el.setAttribute("aria-selected", String(i === palSel));
  });
  const el = $$("#palList .pal-item")[palSel];
  if (el) { palInput.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); }
  else palInput.removeAttribute("aria-activedescendant");
}
function renderPal(q = "") {
  const ql = q.toLowerCase();
  palRes = PAL.filter((p) => (p.t + " " + p.s).toLowerCase().includes(ql));
  palSel = 0;
  palList.innerHTML = palRes.length
    ? palRes.map((p, i) => `<div class="pal-item" id="pal-${i}" role="option" data-i="${i}"><span class="t">${esc(p.t)}</span><span class="s">${p.s}</span></div>`).join("")
    : `<div class="pal-empty">no matching nodes</div>`;
  $$("#palList .pal-item").forEach((el) => (el.onclick = () => choose(+el.dataset.i)));
  paintSel();
}
function choose(i) { const p = palRes[i]; closePal(); p?.go(); }
function openPal() {
  palReturn = document.activeElement;
  pal.hidden = false;
  palInput.value = "";
  renderPal();
  palInput.focus();
  document.body.classList.add("locked");
}
function closePal(restore = true) {
  if (pal.hidden) return;
  pal.hidden = true;
  document.body.classList.remove("locked");
  if (restore) palReturn?.focus?.({ preventScroll: true });
}
$("#palBtn").onclick = openPal;
pal.onclick = (e) => { if (e.target === pal) closePal(); };
palInput.addEventListener("input", (e) => renderPal(e.target.value));
palInput.addEventListener("keydown", (e) => {
  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && palRes.length) {
    e.preventDefault();
    palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + palRes.length) % palRes.length;
    paintSel();
  } else if (e.key === "Enter") { e.preventDefault(); choose(palSel); }
  else if (e.key === "Tab") e.preventDefault();
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
  else if (e.key === "Escape") { closePal(); closeDrawer(); }
});

/* ══════════════════ SCROLL: progress, section spy, reveal ══════════════════ */
const bar = $("#progress");
const spyLinks = $$(".sections a");
const spied = spyLinks.map((a) => document.getElementById(a.dataset.spy));
let ticking = false;
function onScroll() {
  ticking = false;
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  const line = innerHeight * 0.35;
  let on = -1;
  spied.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) on = i; });
  spyLinks.forEach((a, i) => {
    if (i === on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  $("#bar").classList.toggle("scrolled", scrollY > 8);
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

const io = new IntersectionObserver((es) => es.forEach((en) => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el) => io.observe(el));

/* ══════════════════ MOTION: decode, count up, pause ══════════════════ */
// The hero name decodes and the three headline figures count up on load; each section
// heading decodes the first time it is on screen. All of it is skipped under reduced motion.
decode($("#heroName"), { duration: 480 });
$$("#heroProof .ro-metric").forEach((el, i) => countUp(el, { duration: 440, delay: 80 + i * 40 }));
onEnter($$(".sec-head h2"), (el) => decode(el, { duration: 400 }));
$$("#heroProof .ro-row").forEach((el) => el.classList.add("hud"));
pauseOffscreen($(".hero"));
