// ─────────────────────────────────────────────────────────────
//  CHARTS · small bar charts built from the projects' own results.
//
//  Every number here is copied from a results file in the project's repository.
//  Two series use the site's blue and orange. A single series is blue. Mint is
//  kept for "passed", which is a state, not a series. Values are always printed
//  beside the bar, so no reading depends on colour or on hovering.
// ─────────────────────────────────────────────────────────────

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function bar(kind, width, text, tip) {
  // The bar sits in its own cell so that its width is a share of the whole scale.
  return `<div class="c-track"><span class="c-scale"><i class="c-bar ${kind}" style="--w:${Math.max(width, 0.6).toFixed(1)}%" data-tip="${esc(tip)}"></i></span><em>${esc(text)}</em></div>`;
}

function frame(spec, body, legend = "") {
  const summary = `${spec.title}. ${spec.rows ? spec.rows.map((r) => r.say).join(". ") : spec.text}.`;
  return `<figure class="chart reveal" role="img" aria-label="${esc(summary)}">
    <figcaption><b>${esc(spec.title)}</b>${spec.note ? `<span>${esc(spec.note)}</span>` : ""}</figcaption>
    ${legend}${body}
  </figure>`;
}

// Two bars per row, for comparing two versions of the same thing. Values are percentages.
function pairs(spec) {
  const [a, b] = spec.series;
  const legend = `<div class="c-legend"><span><i class="c-sw a"></i>${esc(a)}</span><span><i class="c-sw b"></i>${esc(b)}</span></div>`;
  const rows = spec.rows.map((r) => `
    <div class="c-row"><div class="c-label">${esc(r.label)}</div>
      <div>${bar("a", r.a, r.ta, `${a}: ${r.ta}`)}${bar("b", r.b, r.tb, `${b}: ${r.tb}`)}</div>
    </div>`).join("");
  return frame({ ...spec, rows: spec.rows.map((r) => ({ say: `${r.label}: ${a} ${r.ta}, ${b} ${r.tb}` })) }, rows, legend);
}

// One bar per row, on a shared scale.
function single(spec) {
  const max = spec.max ?? Math.max(...spec.rows.map((r) => r.value));
  const rows = spec.rows.map((r) => `
    <div class="c-row"><div class="c-label${r.strong ? " strong" : ""}">${esc(r.label)}</div>
      <div>${bar("a", (100 * r.value) / max, r.text, `${r.label}: ${r.text}`)}</div>
    </div>`).join("");
  return frame({ ...spec, rows: spec.rows.map((r) => ({ say: `${r.label}: ${r.text}` })) }, rows);
}

// A row of marks, one per check, for "n of n passed".
function ticks(spec) {
  const marks = Array.from({ length: spec.total }, (_, i) =>
    `<i class="c-tick${i < spec.passed ? " ok" : ""}" data-tip="${esc(spec.names?.[i] ?? `check ${i + 1}`)}: ${i < spec.passed ? "holds" : "fails"}"></i>`).join("");
  return frame(spec, `<div class="c-ticks">${marks}</div><div class="c-ticktext">${esc(spec.text)}</div>`);
}

export const chart = (spec) => ({ pairs, single, ticks }[spec.type](spec));

// One floating label for whatever mark the pointer is over.
export function tooltips() {
  const tip = document.createElement("div");
  tip.className = "c-tip";
  tip.setAttribute("role", "tooltip");
  document.body.append(tip);
  document.addEventListener("pointermove", (e) => {
    const mark = e.target.closest?.("[data-tip]");
    if (!mark) { tip.classList.remove("on"); return; }
    tip.textContent = mark.dataset.tip;
    tip.classList.add("on");
    tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + "px";
    tip.style.top = e.clientY + 16 + "px";
  });
}
