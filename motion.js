// ─────────────────────────────────────────────────────────────
//  MOTION · the small amount of script behind the motion layer.
//
//  Most of the motion is CSS (styles.css, "motion layer"). This file only does what CSS
//  cannot: text that decodes from scrambled glyphs, figures that count up, and the shell's
//  boot. While a text animates, the real text stays in the element for assistive tech
//  (a visually hidden copy) and the animated copy is aria-hidden; when it finishes, the
//  element's original nodes are put back exactly. Nothing here runs under
//  prefers-reduced-motion, and if this file fails to load, every text is simply there.
// ─────────────────────────────────────────────────────────────

const MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
export const reduced = () => MOTION.matches;

const SETS = {
  upper: "ABCDEFGHJKLMNPRSTUVXYZ",
  lower: "abcdeghknopqrsuvxyz",
  digit: "0123456789",
};
const setFor = (ch) => (/[A-Z]/.test(ch) ? SETS.upper : /[a-z]/.test(ch) ? SETS.lower : /[0-9]/.test(ch) ? SETS.digit : null);
const pick = (set) => set[(Math.random() * set.length) | 0];

// Swap the element's content for a hidden real copy plus an aria-hidden copy whose
// characters are separate spans. Returns the spans and a function that restores the original.
function split(el, only = () => true) {
  const original = [...el.childNodes];
  const shown = document.createElement("span");
  shown.className = "dec";
  shown.setAttribute("aria-hidden", "true");
  shown.append(...original.map((n) => n.cloneNode(true)));
  const texts = [];
  const walk = document.createTreeWalker(shown, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) texts.push(walk.currentNode);
  const cells = [];
  let index = 0;
  texts.forEach((node) => {
    const frag = document.createDocumentFragment();
    for (const ch of node.data) {
      const set = setFor(ch);
      const at = index++;
      if (!set || !only(ch, at)) { frag.append(ch); continue; }
      const span = document.createElement("span");
      span.className = "dc";
      span.textContent = ch;
      span.dataset.g = pick(set);
      frag.append(span);
      cells.push({ span, set, ch });
    }
    node.replaceWith(frag);
  });
  const real = document.createElement("span");
  real.className = "sr-only";
  real.textContent = el.textContent;
  el.replaceChildren(real, shown);
  return { cells, restore: () => el.replaceChildren(...original) };
}

// Scrambled glyphs that settle left to right. The text is readable throughout (only its
// glyphs change, about every 50 ms) and exact by `duration`.
export function decode(el, { duration = 520, delay = 0 } = {}) {
  if (!el || reduced() || el.dataset.motion) return;
  el.dataset.motion = "decode";
  const { cells, restore } = split(el);
  const n = cells.length;
  if (!n) { restore(); return; }
  let start = null, last = 0;
  const frame = (now) => {
    start ??= now + delay;
    const t = now - start;
    const swap = now - last > 48;
    if (swap) last = now;
    let settled = 0;
    cells.forEach((c, i) => {
      const at = duration * (0.3 + 0.7 * (i / Math.max(1, n - 1)));
      if (t >= at) {
        if (!c.ok) { c.ok = true; c.span.classList.add("ok"); }
        settled++;
      } else if (swap) c.span.dataset.g = pick(c.set);
    });
    if (settled < n) requestAnimationFrame(frame);
    else { restore(); el.dataset.motion = "done"; }
  };
  requestAnimationFrame(frame);
}

// "199 / 200" counts its first figure up from zero, padded to its final width, so the
// layout never moves. Anything that is not a leading figure is left alone.
export function countUp(el, { duration = 520, delay = 0 } = {}) {
  if (!el || reduced() || el.dataset.motion) return;
  const m = el.textContent.match(/^\s*([\d,]+)/);
  if (!m) return decode(el, { duration, delay });
  el.dataset.motion = "count";
  const digits = m[1].replace(/,/g, "");
  const target = Number(digits);
  const { cells, restore } = split(el, (ch, i) => i < m[0].length && /\d/.test(ch));
  let start = null;
  const frame = (now) => {
    start ??= now + delay;
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    const eased = 1 - Math.pow(1 - p, 3);
    const shown = String(Math.round(target * eased)).padStart(digits.length, "0");
    cells.forEach((c, i) => { c.span.dataset.g = shown[i] ?? c.ch; });
    if (p < 1) requestAnimationFrame(frame);
    else { restore(); el.dataset.motion = "done"; }
  };
  requestAnimationFrame(frame);
}

// Run `fn` once for each element, the first time it is mostly on screen.
export function onEnter(els, fn, threshold = 0.6) {
  if (reduced()) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
  }), { threshold });
  els.forEach((el) => io.observe(el));
}

// The shell's first lines type in when it first scrolls into view. If they are already on
// screen when the page loads (a reload, a ?run= link), they are left as they are.
export function boot(block) {
  if (!block || reduced()) return;
  let first = true;
  const io = new IntersectionObserver(([e]) => {
    const wasFirst = first;
    first = false;
    if (!e.isIntersecting) return;
    io.disconnect();
    if (wasFirst) return;
    if (block.parentElement?.firstElementChild === block && block.parentElement.children.length === 1) block.classList.add("booting");
  });
  io.observe(block);
}

// Pause the hero's grid while it is off screen.
export function pauseOffscreen(el) {
  new IntersectionObserver(([e]) => el.classList.toggle("off", !e.isIntersecting)).observe(el);
}
