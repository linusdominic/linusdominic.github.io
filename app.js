import { PROFILE, NODES, EDGES, SKILLS, EDUCATION, TYPE_META } from "./data.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ══════════════════ BOOT ══════════════════ */
const BOOT = [
  ["$ airflow dags trigger portfolio_build", 90],
  ["  [scheduler] queued run_id=manual__2026", 60],
  ["  ✓ extract  · 5 roles, 6 projects", 60],
  ["  ✓ transform · resolving edges …", 70],
  ["  ✓ load     · rendering DAG", 60],
  ["  <span class='ok'>SUCCESS</span> · pipeline live", 40],
];
let booted = false;
(async function boot() {
  const line = $("#bootLine"), bar = $("#bootBar");
  if (REDUCED) { finishBoot(); return; }

  // Hard ceiling: never hold the page hostage, whatever the browser does to our timers.
  setTimeout(finishBoot, 2600);
  const skip = () => finishBoot();
  $("#boot").addEventListener("click", skip);
  window.addEventListener("keydown", skip, { once: true });

  let acc = "";
  for (let i = 0; i < BOOT.length && !booted; i++) {
    const txt = BOOT[i][0];
    const plain = txt.replace(/<[^>]+>/g, "");
    // type in chunks, one timer per chunk rather than one per character
    for (let c = 3; c <= plain.length && !booted; c += 3) {
      line.innerHTML = acc + plain.slice(0, c);
      await sleep(12);
    }
    acc += txt + "\n";
    line.innerHTML = acc;
    bar.style.width = ((i + 1) / BOOT.length) * 100 + "%";
    await sleep(40);
  }
  finishBoot();
})();

function finishBoot() {
  if (booted) return;
  booted = true;
  $("#bootBar").style.width = "100%";
  $("#boot").classList.add("done");
  document.body.classList.remove("locked");
  startHero();
}

/* ══════════════════ HERO ══════════════════ */
const ROLES = [
  "Lead Data Engineer",
  "Data Architect",
  "Team Lead, 4–6 engineers",
  "Lakehouse & Medallion design",
  "AWS platform ownership",
  "BI as code",
];
function startHero() {
  $("#tagline").textContent = PROFILE.tagline;
  $("#summary").textContent = PROFILE.summary;
  $("#statusLine").textContent = PROFILE.status;
  $("#footL").textContent = `© ${new Date().getFullYear()} ${PROFILE.name}`;
  $("#footR").textContent = `last_run ${new Date().toISOString().slice(0, 10)}`;

  if (REDUCED) { $("#typed").textContent = ROLES[0]; }
  else typeLoop();

  // stats
  $("#stats").innerHTML = PROFILE.stats
    .map((s) => `<div class="stat"><div class="num" data-to="${s.v}">0<em>${s.suffix}</em></div><div class="lbl">${s.k}</div></div>`)
    .join("");
  $$(".stat .num").forEach(countUp);
}
async function typeLoop() {
  const el = $("#typed");
  let i = 0;
  while (true) {
    const w = ROLES[i % ROLES.length];
    for (let j = 1; j <= w.length; j++) { el.textContent = w.slice(0, j); await sleep(46); }
    await sleep(1500);
    for (let j = w.length; j >= 0; j--) { el.textContent = w.slice(0, j); await sleep(22); }
    await sleep(180);
    i++;
  }
}
function countUp(el) {
  const to = +el.dataset.to, suf = el.querySelector("em").textContent;
  let t0 = null;
  const step = (t) => {
    if (!t0) t0 = t;
    const p = Math.min((t - t0) / 1100, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.innerHTML = Math.round(to * e) + `<em>${suf}</em>`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ══════════════════ DAG ══════════════════ */
const cv = $("#dag"), ctx = cv.getContext("2d");
let NW = 168, NH = 52, LAYER_STEP = 250, SLOT_STEP = 168, VERT = false;
let flowOn = true, hover = null, drag = null, moved = false;
let view = { s: 1, x: 0, y: 0 };
const particles = [];

function setMode() {
  VERT = cv.clientWidth < 720;
  if (VERT) { NW = 138; NH = 44; LAYER_STEP = 108; SLOT_STEP = 150; }
  else { NW = 168; NH = 52; LAYER_STEP = 248; SLOT_STEP = 150; }
}
function layout() {
  setMode();
  const byLayer = {};
  NODES.forEach((n) => (byLayer[n.layer] ??= []).push(n));
  Object.entries(byLayer).forEach(([L, arr]) => {
    arr.forEach((n, i) => {
      const along = +L * LAYER_STEP;
      const across = (i - (arr.length - 1) / 2) * SLOT_STEP;
      if (VERT) { n.y = along; n.x = across; }
      else { n.x = along; n.y = across; }
    });
  });
  fit();
}
function fit() {
  const pad = VERT ? 30 : 70;
  const xs = NODES.map((n) => n.x), ys = NODES.map((n) => n.y);
  const w = Math.max(...xs) - Math.min(...xs) + NW + pad * 2;
  const h = Math.max(...ys) - Math.min(...ys) + NH + pad * 2;
  const cw = cv.clientWidth, ch = cv.clientHeight;
  view.s = Math.min(cw / w, ch / h, 1.3);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  view.x = cw / 2 - cx * view.s;
  view.y = ch / 2 - cy * view.s;
}
let wasVert = null;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = cv.clientWidth * dpr;
  cv.height = cv.clientHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const prev = VERT;
  setMode();
  if (prev !== VERT || wasVert === null) { wasVert = VERT; layout(); }
  else fit();
}
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
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
  if (!flowOn || REDUCED || particles.length > 90) return;
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

let tick = 0;
function draw() {
  tick++;
  const cw = cv.clientWidth, ch = cv.clientHeight;
  ctx.clearRect(0, 0, cw, ch);

  // faint grid
  ctx.strokeStyle = "rgba(120,160,200,.05)";
  ctx.lineWidth = 1;
  const g = 40 * view.s;
  for (let x = view.x % g; x < cw; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
  for (let y = view.y % g; y < ch; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }

  const hi = hover || drag?.n;
  const linked = new Set();
  if (hi) EDGES.forEach(([s, t]) => { if (s === hi.id) linked.add(t); if (t === hi.id) linked.add(s); });

  // edges
  EDGES.forEach(([s, t]) => {
    const a = byId[s], b = byId[t];
    const p = edgePath(a, b);
    const on = hi && (s === hi.id || t === hi.id);
    ctx.beginPath();
    const [X1, Y1] = w2s(p.x1, p.y1), [C1X, C1Y] = w2s(p.c1x, p.c1y),
          [C2X, C2Y] = w2s(p.c2x, p.c2y), [X2, Y2] = w2s(p.x2, p.y2);
    ctx.moveTo(X1, Y1);
    ctx.bezierCurveTo(C1X, C1Y, C2X, C2Y, X2, Y2);
    ctx.strokeStyle = on ? TYPE_META[b.type].color : "rgba(120,160,200,.20)";
    ctx.lineWidth = on ? 1.8 : 1;
    ctx.globalAlpha = on ? 0.9 : 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // arrow
    const [ax, ay] = bez(p, 0.97), [bx2, by2] = bez(p, 1);
    const ang = Math.atan2(by2 - ay, bx2 - ax);
    const [AX, AY] = w2s(bx2, by2);
    ctx.beginPath();
    ctx.moveTo(AX, AY);
    ctx.lineTo(AX - 7 * Math.cos(ang - 0.4), AY - 7 * Math.sin(ang - 0.4));
    ctx.lineTo(AX - 7 * Math.cos(ang + 0.4), AY - 7 * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fillStyle = on ? TYPE_META[b.type].color : "rgba(120,160,200,.32)";
    ctx.fill();
  });

  // particles
  if (tick % 7 === 0) spawn();
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.t += pt.sp;
    if (pt.t >= 1) { particles.splice(i, 1); continue; }
    const p = edgePath(pt.a, pt.b);
    const [wx, wy] = bez(p, pt.t);
    const [sx, sy] = w2s(wx, wy);
    const fade = Math.sin(pt.t * Math.PI);
    ctx.globalAlpha = 0.15 + fade * 0.85;
    ctx.fillStyle = pt.c;
    ctx.shadowBlur = 10; ctx.shadowColor = pt.c;
    ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  // nodes
  NODES.forEach((n) => {
    const meta = TYPE_META[n.type];
    const [sx, sy] = w2s(n.x, n.y);
    const w = NW * view.s, h = NH * view.s;
    const x = sx - w / 2, y = sy - h / 2;
    const active = hi === n;
    const dim = hi && hi !== n && !linked.has(n.id);

    ctx.globalAlpha = dim ? 0.3 : 1;

    if (n.current || active) {
      const pulse = 0.5 + 0.5 * Math.sin(tick / 24);
      ctx.shadowBlur = (active ? 26 : 12) + pulse * 10;
      ctx.shadowColor = meta.color;
    }
    roundRect(x, y, w, h, 9 * view.s);
    ctx.fillStyle = active ? "rgba(16,24,34,.98)" : "rgba(10,15,22,.94)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = active || n.current ? meta.color : "rgba(120,160,200,.28)";
    ctx.lineWidth = active ? 1.9 : 1.1;
    ctx.stroke();

    // left accent
    ctx.save();
    roundRect(x, y, w, h, 9 * view.s); ctx.clip();
    ctx.fillStyle = meta.color;
    ctx.fillRect(x, y, 3 * view.s, h);
    ctx.restore();

    const fs = Math.max(9, 12.5 * view.s);
    ctx.fillStyle = active ? "#fff" : "#dbe6f0";
    ctx.font = `600 ${fs}px "Inter", sans-serif`;
    ctx.textBaseline = "middle";
    const lbl = (VERT && n.short) ? n.short : n.label;
    ctx.fillText(clip(lbl, w - 22 * view.s, `600 ${fs}px Inter`), x + 12 * view.s, sy - 7 * view.s);

    ctx.fillStyle = "#6f8296";
    const fs2 = Math.max(8, 9.5 * view.s);
    ctx.font = `500 ${fs2}px "JetBrains Mono", monospace`;
    ctx.fillText(clip(n.sub, w - 22 * view.s, `500 ${fs2}px monospace`), x + 12 * view.s, sy + 9 * view.s);

    if (n.current) {
      ctx.fillStyle = meta.color;
      ctx.beginPath(); ctx.arc(x + w - 10 * view.s, y + 10 * view.s, 3 * view.s, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  requestAnimationFrame(draw);
}
function clip(t, max, font) {
  ctx.font = font;
  if (ctx.measureText(t).width <= max) return t;
  let s = t;
  while (s.length > 3 && ctx.measureText(s + "…").width > max) s = s.slice(0, -1);
  return s + "…";
}

function hit(mx, my) {
  const [wx, wy] = s2w(mx, my);
  return NODES.slice().reverse().find(
    (n) => Math.abs(wx - n.x) < NW / 2 && Math.abs(wy - n.y) < NH / 2
  ) || null;
}
function pos(e) {
  const r = cv.getBoundingClientRect();
  const p = e.touches?.[0] ?? e;
  return [p.clientX - r.left, p.clientY - r.top];
}

const CLICK_SLOP = 5; // px of travel still counted as a click, not a drag

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
});
cv.addEventListener("pointerup", (e) => {
  const [mx, my] = pos(e);
  if (drag && !drag.pan && !moved) openDrawer(drag.n);
  else if (drag?.pan && !moved) { const n = hit(mx, my); if (n) openDrawer(n); }
  drag = null;
  cv.classList.remove("dragging");
});
cv.addEventListener("pointerleave", () => { hover = null; });

$("#btnRelayout").onclick = () => { layout(); };
$("#btnFlow").onclick = (e) => {
  flowOn = !flowOn;
  e.target.textContent = flowOn ? "◉ flow" : "○ flow";
  if (!flowOn) particles.length = 0;
};
window.addEventListener("resize", resize);

// legend
$("#legend").innerHTML = Object.entries(TYPE_META)
  .map(([k, v]) => `<span class="chip"><i style="background:${v.color}"></i>${v.name}</span>`)
  .join("");

layout(); resize(); draw();

/* ══════════════════ DRAWER ══════════════════ */
function openDrawer(n) {
  const meta = TYPE_META[n.type];
  $("#dKind").innerHTML = `<span style="color:${meta.color}">${meta.name}</span> <span style="color:var(--txt-faint)">· ${n.kind}</span>`;
  $("#dTitle").textContent = n.label;
  $("#dSub").textContent = n.sub;
  $("#dMeta").innerHTML = [n.period, n.place].filter(Boolean).map((x) => `<span>${x}</span>`).join("");
  $("#dBody").innerHTML = n.body.map((b) => `<li>${b}</li>`).join("");
  $("#dTags").innerHTML = (n.tags || []).map((t) => `<span>${t}</span>`).join("");
  $("#dLink").innerHTML = n.link
    ? `<a class="btn" href="${n.link}" target="_blank" rel="noopener">${n.linkLabel || "Open ↗"}</a>` : "";
  $("#drawer").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
}
$("#dClose").onclick = closeDrawer;
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); closePal(); } });

/* ══════════════════ LISTS ══════════════════ */
$("#expList").innerHTML = NODES.filter((n) => n.kind === "role")
  .slice().reverse()
  .map((n) => `<div class="exp-card" data-id="${n.id}">
      <div class="row1">
        <h3>${n.label}${n.badge ? `<span class="badge">${n.badge}</span>` : ""}</h3>
        <span class="per">${n.period}</span>
      </div>
      <div class="sb">${n.sub} · ${n.place}</div>
    </div>`).join("");
$$(".exp-card").forEach((c) => (c.onclick = () => openDrawer(byId[c.dataset.id])));

$("#skillGrid").innerHTML = SKILLS.map((s) => `
  <div class="skill-card">
    <h3><span>${s.icon}</span>${s.group}</h3>
    <ul>${s.items.map((i) => `<li>${i}</li>`).join("")}</ul>
  </div>`).join("");

$("#contactGrid").innerHTML = [
  ["email", PROFILE.email, `mailto:${PROFILE.email}`],
  ["phone", PROFILE.phone, `tel:${PROFILE.phone.replace(/\s/g, "")}`],
  ["linkedin", "in/linus-dominic", PROFILE.linkedin],
  ["github", "@linusdominic", PROFILE.github],
  ["live dashboard", "superset.altaircapitalgroup.com", "https://superset.altaircapitalgroup.com/embed/psr-v2"],
  ["location", PROFILE.location, ""],
].map(([l, v, h]) =>
  h ? `<a class="contact-card" href="${h}" target="_blank" rel="noopener"><div class="l">${l}</div><div class="v">${v}</div></a>`
    : `<div class="contact-card"><div class="l">${l}</div><div class="v">${v}</div></div>`
).join("");

/* ══════════════════ CONSOLE ══════════════════ */
const out = $("#cOut"), inp = $("#cIn");
const roles = NODES.filter((n) => n.kind === "role");
const projs = NODES.filter((n) => n.kind === "project");

function w(html, cls = "") { out.innerHTML += `<div class="${cls}">${html}</div>`; out.scrollTop = out.scrollHeight; }
function table(rows, cols) {
  const widths = cols.map((c, i) => Math.max(c.length, ...rows.map((r) => String(r[i]).length)));
  const line = (ch) => "+" + widths.map((n) => ch.repeat(n + 2)).join("+") + "+";
  const row = (cells) => "| " + cells.map((c, i) => String(c).padEnd(widths[i])).join(" | ") + " |";
  return [line("-"), row(cols), line("="), ...rows.map(row), line("-")].join("\n");
}

const CMDS = {
  help: () => w(`<span class="k">Available:</span>
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
  w(`<span class="q">❯ ${escapeHtml(cmd)}</span>`);
  const low = cmd.toLowerCase().replace(/;$/, "");
  if (CMDS[low]) return CMDS[low]();
  const m = low.match(/from\s+(\w+)/);
  if (low.startsWith("select") && m && SELECTS[m[1]]) {
    let res = SELECTS[m[1]]();
    if (/lead\s*=\s*true|where.*lead/.test(low)) return CMDS.lead();
    if (/marketplace/.test(low)) return CMDS.marketplace();
    return w(res);
  }
  if (/marketplace/.test(low)) return CMDS.marketplace();
  if (/\baws|infra|cloud|postgres|platform|portal/.test(low)) return CMDS.infra();
  if (/integration|cotality|corelogic|valuelink|zoho|twilio|telnyx|square|vendor/.test(low)) return CMDS.integrations();
  if (/\blead|team|manage/.test(low)) return CMDS.lead();
  if (low === "ls" || low === "dir") return CMDS.tables();
  w(`<span class="e">error: unknown command "${escapeHtml(cmd)}". try <b>help</b></span>`);
}
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { run(inp.value); inp.value = ""; } });
$("#cHints").innerHTML = ["help", "whoami", "select * from experience", "infra", "integrations", "marketplace", "lead", "clear"]
  .map((h) => `<button data-c="${h}">${h}</button>`).join("");
$$("#cHints button").forEach((b) => (b.onclick = () => { run(b.dataset.c); inp.focus(); }));
w(`<span class="k">career.db</span> connected · 5 roles, ${projs.length} projects, ${SKILLS.length} skill groups indexed.
type <span class="v">help</span> to begin.`);

/* ══════════════════ PALETTE ══════════════════ */
const PAL = [
  ...NODES.map((n) => ({ t: n.label, s: n.kind, go: () => openDrawer(n) })),
  { t: "The pipeline", s: "section", go: () => jump("#pipeline") },
  { t: "The stack", s: "section", go: () => jump("#skills") },
  { t: "Query console", s: "section", go: () => jump("#query") },
  { t: "Contact", s: "section", go: () => jump("#contact") },
  { t: "Download CV", s: "action", go: () => $("#cvBtn").click() },
  { t: "LinkedIn", s: "link", go: () => open(PROFILE.linkedin, "_blank") },
  { t: "GitHub", s: "link", go: () => open(PROFILE.github, "_blank") },
  { t: "Live Superset dashboard", s: "link", go: () => open("https://superset.altaircapitalgroup.com/embed/psr-v2", "_blank") },
];
const jump = (h) => document.querySelector(h).scrollIntoView({ behavior: "smooth" });
let palSel = 0, palRes = PAL;
function renderPal(q = "") {
  palRes = PAL.filter((p) => (p.t + p.s).toLowerCase().includes(q.toLowerCase()));
  palSel = 0;
  $("#palList").innerHTML = palRes.length
    ? palRes.map((p, i) => `<div class="pal-item ${i === 0 ? "sel" : ""}" data-i="${i}"><span class="t">${p.t}</span><span class="s">${p.s}</span></div>`).join("")
    : `<div class="pal-empty">no matching nodes</div>`;
  $$("#palList .pal-item").forEach((el) => (el.onclick = () => { palRes[+el.dataset.i].go(); closePal(); }));
}
function openPal() { $("#palette").classList.add("open"); $("#palInput").value = ""; renderPal(); $("#palInput").focus(); }
function closePal() { $("#palette").classList.remove("open"); }
$("#palBtn").onclick = openPal;
$("#palette").onclick = (e) => { if (e.target.id === "palette") closePal(); };
$("#palInput").addEventListener("input", (e) => renderPal(e.target.value));
$("#palInput").addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    palSel = (palSel + (e.key === "ArrowDown" ? 1 : -1) + palRes.length) % palRes.length;
    $$("#palList .pal-item").forEach((el, i) => el.classList.toggle("sel", i === palSel));
    $$("#palList .pal-item")[palSel]?.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") { palRes[palSel]?.go(); closePal(); }
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPal(); }
});

/* ══════════════════ REVEAL ══════════════════ */
const io = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && en.target.classList.add("in")), { threshold: 0.12 });
$$(".reveal").forEach((el) => io.observe(el));
