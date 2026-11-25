// ─────────────────────────────────────────────────────────────
//  PROJECT LAB · a shell where a visitor can try the projects
//
//  Two kinds of command, and every result says which it was:
//    live      the project's own Python, unmodified, running in the visitor's browser
//              (Pyodide: Python compiled to WebAssembly). Loaded on first use.
//    recorded  real output from a run on my machine, replayed, for the parts that
//              need a database, AWS or a model.
//
//  House style: no em-dashes, no bold inside body copy.
// ─────────────────────────────────────────────────────────────

import { chart, tooltips } from "./charts.js?v=20261127a";

const PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/";
const GITHUB = "https://github.com/linusdominic/";

// Each project: where it sits on the page (tier), what it is, its headline result and
// caveat, commands to try, and for the featured ones a short story, a screenshot and a
// chart. Every figure in a chart is copied from that repository's results.
export const PROJECTS = [
  {
    repo: "outbound-call-agent", prog: "callagent", kind: "live", tier: "big",
    what: "An AI agent that makes follow-up calls for a lender, with consent and do-not-call rules enforced in code.",
    metric: "199 / 200", label: "simulated calls passed every check",
    caveat: "Simulated contacts. No real calls are placed.",
    story: [
      "The model holds the conversation. Code decides whether the call may be placed, says the opening disclosure, honours a request to stop, and validates every booking.",
      "Tested on 200 held-out simulated contacts. Twenty of them push for a rate, a promise of approval, or a claim to be human.",
      "The same model with the rules only in its prompt passed 193. That gap is not statistically significant (p = 0.07), and the README says so.",
    ],
    shot: { src: "assets/agent-shell.jpg", w: 1400, h: 1020, alt: "The demo page: a call in which the contact asks for a rate, is refused, answers the questions and books a time, with the recorded answers beside it" },
    chart: {
      type: "pairs", title: "Held-out calls passing each check", note: "200 simulated contacts, both versions on the same contacts",
      series: ["Rules enforced in code", "Rules in the prompt only"],
      rows: [
        { label: "Every check passed", a: 99.5, b: 96.5, ta: "199 / 200", tb: "193 / 200" },
        { label: "No stage directions read aloud", a: 100, b: 96.5, ta: "200 / 200", tb: "193 / 200" },
        { label: "Approved voicemail, word for word", a: 100, b: 75, ta: "8 / 8", tb: "6 / 8" },
        { label: "Requests to stop calling honoured", a: 100, b: 100, ta: "20 / 20", tb: "20 / 20" },
      ],
    },
    tries: ['callagent gate --time 07:30 --tz America/Los_Angeles', 'callagent guard "You will get about 6.25% today."', "callagent replay pushy", "callagent evaluate"],
  },
  {
    repo: "sales-call-qa", prog: "callqa", kind: "live", tier: "big",
    what: "Grades recorded sales calls against a script, with a quote and a timestamp behind every verdict.",
    metric: "160 / 160", label: "held-out call outcomes graded correctly",
    caveat: "Synthetic calls and text-to-speech voices.",
    story: [
      "Each side of the call is transcribed on the same machine, personal details are masked, and a model marks every script step with a quote as evidence. Code checks the quotes and applies the rule for a meaningful call.",
      "The first version raised a false compliance flag four times in ten. Measuring it is how I found out.",
      "On held-out calls every remaining false flag traced to one speech-recognition slip: \"can't guarantee\" heard as \"can guarantee\".",
    ],
    shot: { src: "assets/callqa-dashboard.jpg", w: 1400, h: 1257, alt: "The dashboard: headline counts, a row per loan officer with meaningful and not meaningful calls, and coverage of each script step" },
    shot2: { src: "assets/callqa-call.jpg", text: "one call, with the quote behind each verdict" },
    chart: {
      type: "pairs", title: "First version against the second", note: "development set, 160 calls, speech-recognition transcripts",
      series: ["Second version", "First version"],
      rows: [
        { label: "Compliance flags that were real", a: 93.8, b: 60, ta: "15 / 16", tb: "15 / 25" },
        { label: "Personal details masked", a: 100, b: 85.5, ta: "62 / 62", tb: "53 / 62" },
        { label: "Calls sent to a person for review", a: 16.2, b: 34.2, ta: "26 / 160", tb: "54 / 158" },
      ],
    },
    tries: ['callqa mask "My social is 512-44-7166, call me on 555-0142"', "callqa replay call_013", "callqa evaluate"],
  },
  {
    repo: "ask-the-warehouse", prog: "askwh", kind: "recorded", tier: "big",
    what: "Answers sales and production questions from governed metric definitions, in place of dashboards.",
    metric: "46 / 46", label: "questions right; schema-only text-to-SQL got 40",
    caveat: "Simulated data on PostgreSQL. Not deployed.",
    story: [
      "A stakeholder asks in plain language. The answer comes from a governed metric definition, with the SQL and the freshness of the data shown beside it.",
      "Evaluated on 46 hand-written questions, each with reference SQL, against two text-to-SQL baselines.",
      "Text-to-SQL given the same definitions also scored 46. The definitions are what matter, more than the interface.",
    ],
    shot: { src: "assets/warehouse-chat.jpg", w: 1400, h: 985, alt: "The chat page answering a comparison and a breakdown, with an active digest and alert" },
    chart: {
      type: "single", title: "Questions answered correctly", note: "46 hand-written questions, first run", max: 46,
      rows: [
        { label: "Governed metric definitions", value: 46, text: "46 / 46", strong: true },
        { label: "Text-to-SQL, given the definitions", value: 46, text: "46 / 46" },
        { label: "Text-to-SQL, schema only", value: 40, text: "40 / 46" },
      ],
    },
    tries: ["askwh questions", "askwh ask 1"],
  },
  {
    repo: "vectorless-rag-benchmark", prog: "vrbench", kind: "none", tier: "compact",
    what: "RAG where a model navigates a document's outline instead of searching a vector index, measured.",
    metric: "95% vs 75%", label: "right paragraph ranked first, against hybrid search",
    caveat: "60 model-written questions, ten checked by hand.",
    chart: {
      type: "single", title: "Right paragraph ranked first", note: "60 questions on Regulation Z", max: 100,
      rows: [
        { label: "Vectorless + summaries", value: 95, text: "95%", strong: true },
        { label: "Vectorless", value: 82, text: "82%" },
        { label: "Hybrid search", value: 75, text: "75%" },
        { label: "Dense vectors", value: 72, text: "72%" },
        { label: "BM25 keywords", value: 70, text: "70%" },
      ],
    },
    tries: ["open vectorless-rag-benchmark"],
  },
  {
    repo: "airflow-migration-template", prog: "platform", kind: "recorded", tier: "compact",
    what: "A data platform template for moving legacy ETL jobs to Airflow. The same pipeline runs on DuckDB, PostgreSQL or Redshift.",
    metric: "8 / 8", label: "self-test checks pass on DuckDB and on PostgreSQL",
    caveat: "Redshift and cloud storage adapters were not run live.",
    chart: {
      type: "ticks", title: "Self-test checks in a fresh environment", note: "connections, the write path, the object store and every SQL template",
      total: 8, passed: 8, text: "8 of 8 pass",
    },
    tries: ["platform selftest"],
  },
  {
    repo: "reconkit", prog: "reconkit", kind: "recorded", tier: "compact",
    what: "Diffs tables across databases by checksum bisection, so only the disagreeing key ranges are downloaded.",
    metric: "2,880 of 50,000", label: "rows downloaded to find every difference",
    caveat: "Postgres and DuckDB tested. Cloud warehouses not run live.",
    chart: {
      type: "single", title: "Rows downloaded to compare two tables", note: "the bundled example: 50,000 rows, 26 differences", max: 50000,
      rows: [
        { label: "Download and compare everything", value: 50000, text: "50,000" },
        { label: "Checksum bisection", value: 2880, text: "2,880", strong: true },
      ],
    },
    tries: ["reconkit demo"],
  },
  {
    repo: "serverless-webhook-ingestion", prog: "webhooks", kind: "recorded", tier: "compact",
    what: "Serverless ingestion of vendor webhooks on AWS that does not lose, duplicate or reorder anything.",
    metric: "18 / 18", label: "invariants hold after a seeded load test",
    caveat: "Verified on an AWS emulator. Never deployed to real AWS.",
    chart: {
      type: "ticks", title: "Invariants checked after the load test", note: "3,502 requests sent, including duplicates and poison messages",
      total: 18, passed: 18, text: "18 of 18 hold",
    },
    tries: ["webhooks demo"],
  },
  {
    repo: "pipeline-triage-bench", prog: "triage", kind: "none", tier: "compact",
    what: "A benchmark for agents answering data-pipeline alerts: rerun, backfill, fix, escalate, or leave it alone.",
    metric: "31 / 33", label: "incidents resolved by Claude Opus 5.5; best naive agent: 9",
    caveat: "Simulated lender. One run per model.",
    chart: {
      type: "single", title: "Incidents resolved", note: "33 incidents on a simulated lender's platform, one run each", max: 33,
      rows: [
        { label: "Claude Opus 5.5", value: 31, text: "31 / 33", strong: true },
        { label: "Claude Sonnet 5.5", value: 28, text: "28 / 33" },
        { label: "Close every alert", value: 9, text: "9 / 33" },
        { label: "Re-run everything", value: 5, text: "5 / 33" },
      ],
    },
    tries: ["open pipeline-triage-bench"],
  },
  {
    repo: "de-trap-drills", prog: "drills", kind: "site", tier: "compact",
    site: "https://linusdominic.github.io/de-trap-drills/",
    what: "Interview prep for data engineers: drills in SQL, Python, Spark and Airflow where the obvious answer fails.",
    metric: "40 drills", label: "on 9 learning paths, with 47 concept pages",
    caveat: "Checked in Chrome only. Spark and Airflow answers recorded on one version each.",
    chart: {
      type: "single", title: "Time to count one day out of 100", note: "100 million rows of Parquet, DuckDB, median of 5 runs", max: 417,
      rows: [
        { label: "Text formatting on the column", value: 417, text: "417 ms" },
        { label: "date_trunc on the column", value: 13, text: "13 ms" },
        { label: "Half-open range", value: 12, text: "12 ms" },
        { label: "Partition column", value: 2.5, text: "2.5 ms", strong: true },
      ],
    },
    tries: ["open de-trap-drills"],
  },
  {
    repo: "mortgage-metrics-platform", prog: "metrics", kind: "none", tier: "more",
    what: "Batch platform on public mortgage data, with metrics defined once for both people and AI agents.",
    metric: "One definition", label: "per metric, for people and for AI agents over MCP",
    caveat: "Runs on a laptop against DuckDB. Not deployed.",
    tries: ["open mortgage-metrics-platform"],
  },
  {
    repo: "lakehouse-cdc-streaming", prog: "cdc", kind: "none", tier: "more",
    what: "Change data capture from Postgres into Iceberg, with a harness that proves the lake still matches the source.",
    metric: "5 failure modes", label: "duplicates, reordering, schema change, deletes, crashes",
    caveat: "Runs locally with docker compose. Not deployed.",
    tries: ["open lakehouse-cdc-streaming"],
  },
  {
    repo: "agentic-docs-assistant", prog: "docs-agent", kind: "none", tier: "more",
    what: "A support agent that answers from documentation and files a ticket only after a person approves it.",
    metric: "Human in the loop", label: "the agent pauses, a person approves, it resumes",
    caveat: "The Cloud Run deployment is a reference, not run.",
    tries: ["open agentic-docs-assistant"],
  },
  {
    repo: "open-lending-data", prog: "hmda", kind: "none", tier: "more",
    what: "US mortgage public data on one schema: HMDA 2007-2025, joined to FDIC bank financials and CFPB complaints.",
    metric: "325,140,977", label: "HMDA records, 19 years, row counts equal the raw files",
    caveat: "Full build run on one Mac; 13 GB of Parquet released.",
    tries: ["open open-lending-data"],
  },
  {
    repo: "nosql-for-data-engineers", prog: "nosql", kind: "none", tier: "big",
    what: "A course in NoSQL for data engineers who know SQL, with a local lesson studio wired to five real databases.",
    metric: "48 exercises", label: "checked live against MongoDB, Redis, Cassandra, DynamoDB and Neo4j",
    caveat: "Runs locally in Docker. Single-node databases, no cloud services.",
    story: [
      "make studio starts a local web app: the lesson on one side, a console on the other, connected to the databases running in Docker. Learners type mongosh, redis-cli, CQL, PartiQL, Cypher or DuckDB SQL and check each answer against the database itself.",
      "Every exercise has hints and a reference answer. Integration tests run every reference answer and a set of wrong ones against the real databases on each push, so the checks cannot drift.",
      "The capstone copies four of the stores into a Parquet lake and DuckDB marts, then reconciles: 6 of 6 checks pass, and a re-run and a backfill change nothing.",
    ],
    shot: { src: "assets/nosql-studio.jpg", w: 1400, h: 875, alt: "The lesson studio: a MongoDB exercise passed on the left, with the expected and actual results side by side, and the live console on the right" },
    shot2: { src: "https://linusdominic.github.io/nosql-for-data-engineers/media/studio-demo.mp4", text: "the 3-minute demo video" },
    chart: {
      type: "single", title: "Checked exercises per chapter", note: "plus 13 quiz questions in chapters 1 and 8", max: 10,
      rows: [
        { label: "MongoDB", value: 10, text: "10" },
        { label: "Cassandra", value: 9, text: "9" },
        { label: "DynamoDB", value: 9, text: "9" },
        { label: "Redis", value: 8, text: "8" },
        { label: "Neo4j", value: 7, text: "7" },
        { label: "Capstone (DuckDB)", value: 5, text: "5" },
      ],
    },
    tries: ["open nosql-for-data-engineers"],
  },
];

export const STARTERS = [
  "lab",
  "callagent campaign",
  'callagent guard "You will get about 6.25% today."',
  'callagent hear "honestly, lose my number"',
  "callagent replay pushy",
  'callqa mask "My social is 512-44-7166, call me on 555-0142"',
  "callqa replay call_013",
  "askwh ask 1",
  "reconkit demo",
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KIND = {
  live: '<span class="lab-kind live">live</span>',
  recorded: '<span class="lab-kind rec">recorded</span>',
  none: '<span class="lab-kind none">repo only</span>',
  site: '<span class="lab-kind site">own site</span>',
};

// Colour the words that carry a verdict, at the start of a line only.
const GOOD = /^(\s*)(CALL|allowed|pass|covered|MEANINGFUL|PASS)\b/;
const BAD = /^(\s*)(SKIP|WITHHELD|FAIL|REFUSED|STOP|AI\?|FLAG|MISSING|NOT MEANINGFUL)\b/;
function paint(text) {
  return esc(text)
    .split("\n")
    .map((line) => line
      .replace(GOOD, '$1<span class="k">$2</span>')
      .replace(BAD, '$1<span class="warn">$2</span>'))
    .join("\n");
}

/* ── the Python runtime, started the first time a live command is used ── */
let runtime = null;
let manifest = null;
let recorded = null;

const json = (path) => fetch(path).then((r) => { if (!r.ok) throw new Error(path + " " + r.status); return r.json(); });
const getManifest = () => (manifest ??= json("lab/manifest.json"));
const getRecorded = () => (recorded ??= json("lab/recorded.json"));

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error("could not load " + src));
    document.head.append(tag);
  });
}

// The page listens for this to show the runtime's state beside the shell.
const status = (state, text) => document.dispatchEvent(new CustomEvent("lab:python", { detail: { state, text } }));

function python(say) {
  if (runtime) return runtime;
  runtime = (async () => {
    say('<span class="dim">starting Python in your browser. About 13 MB, the first time only…</span>');
    status("loading", "python loading · about 13 MB, first time only");
    const started = performance.now();
    await loadScript(PYODIDE + "pyodide.js");
    const quiet = () => {};
    const py = await window.loadPyodide({ indexURL: PYODIDE, stdout: quiet, stderr: quiet });
    await py.loadPackage(["pyyaml", "sqlite3", "tzdata"], { messageCallback: quiet, errorCallback: quiet });
    const bundle = await (await fetch("lab/py.zip")).arrayBuffer();
    py.FS.mkdirTree("/lab");
    py.unpackArchive(bundle, "zip", { extractDir: "/lab" });
    py.runPython("import sys\nsys.path.insert(0, '/lab')\nimport labmain");
    const run = py.globals.get("labmain").run;
    const version = py.runPython("sys.version.split()[0]");
    const secs = ((performance.now() - started) / 1000).toFixed(1);
    say(`<span class="dim">ready in ${secs} s. Python ${version}, WebAssembly.</span>`);
    status("ready", `python ${version} · running in your browser`);
    return (line) => run(line);
  })();
  runtime.catch(() => { runtime = null; status("error", "python could not start here"); });
  return runtime;
}

/* ── commands ── */
const project = (name) => PROJECTS.find((p) => p.repo === name || p.prog === name);

function listing() {
  const rows = PROJECTS.map((p) => `  <span class="v">${p.prog.padEnd(11)}</span>${KIND[p.kind]}  ${esc(p.metric.padEnd(17))} ${esc(p.repo)}`);
  return `<span class="k">Fourteen projects.</span> Type a program name to see what it can do here.
${rows.join("\n")}

  <span class="lab-kind live">live</span>      the project's own Python, unmodified, running in your browser
  <span class="lab-kind rec">recorded</span>  real output from a run on my machine, replayed
  <span class="lab-kind site">own site</span>  runs in your browser on its own page: <span class="v">open &lt;name&gt;</span> for the link
  <span class="lab-kind none">repo only</span> needs a database or a model: <span class="v">open &lt;name&gt;</span> for the result and the link`;
}

function describe(p) {
  return `<span class="k">${esc(p.repo)}</span>  ${KIND[p.kind]}
${esc(p.what)}
result:  <span class="v">${esc(p.metric)}</span>  ${esc(p.label)}
caveat:  ${esc(p.caveat)}
code:    <a href="${GITHUB}${p.repo}" target="_blank" rel="noopener">github.com/linusdominic/${esc(p.repo)}</a>${p.site ? `
site:    <a href="${p.site}" target="_blank" rel="noopener">${esc(p.site.replace("https://", ""))}</a>` : ""}
try:     ${p.tries.map((t) => `<span class="v">${esc(t)}</span>`).join("   ")}`;
}

async function footer(kind, repo, what) {
  const commits = await getManifest().catch(() => ({}));
  const at = commits[repo] ? `@${commits[repo]}` : "";
  return kind === "live"
    ? `<span class="dim">● live: ${esc(what)} from ${esc(repo)}${at}, run in your browser just now.</span>`
    : `<span class="dim">○ recorded: real output from a run of ${esc(repo)}${at} on my machine. ${esc(what)}</span>`;
}

async function warehouse(args, say) {
  const questions = (await getRecorded()).warehouse;
  if (args[0] === "questions" || args.length === 0) {
    const rows = questions.map((q, i) => `  ${String(i + 1).padStart(2)}  ${esc(q.question)}`);
    return say(`<span class="k">Questions from the evaluation.</span> Replay one with <span class="v">askwh ask &lt;n&gt;</span>.\n${rows.join("\n")}`);
  }
  const q = questions[Number(args[1] ?? args[0]) - 1];
  if (!q) return say(`<span class="e">give a number from 1 to ${questions.length}: askwh ask 1</span>`);
  let text = `question:  <span class="v">${esc(q.question)}</span>`;
  if (q.request) text += `\nthe model asked the semantic layer for:  ${esc(JSON.stringify(q.request.input))}`;
  text += `\nanswer:    ${esc(q.answer)}\n           ${q.right ? '<span class="k">matches the hand-written reference SQL</span>' : '<span class="warn">does not match the reference</span>'}`;
  if (q.baseline) text += `\n\nthe same question to a model writing SQL from the schema alone:\n           ${esc(q.baseline.answer)}\n           <span class="warn">does not match the reference</span>`;
  say(text);
  say(await footer("recorded", "ask-the-warehouse", "It needs PostgreSQL and a model, so it is replayed."));
}

async function replay(key, repo, needs, say) {
  say(paint((await getRecorded())[key]));
  say(await footer("recorded", repo, needs));
}

const HANDLERS = {
  lab: (args, say) => say(listing()),
  projects: (args, say) => say(listing()),
  open: (args, say) => {
    const p = project(args[0]);
    say(p ? describe(p) : `<span class="e">open what? One of: ${PROJECTS.map((x) => x.repo).join(", ")}</span>`);
  },
  askwh: warehouse,
  reconkit: (args, say) => args[0] === "demo"
    ? replay("reconkit", "reconkit", "It needs two databases, so it is replayed.", say)
    : say(describe(project("reconkit"))),
  platform: (args, say) => args[0] === "selftest"
    ? replay("platform", "airflow-migration-template", "It tests a warehouse and a file store, so it is replayed.", say)
    : say(describe(project("platform"))),
  webhooks: (args, say) => args[0] === "demo"
    ? replay("webhooks", "serverless-webhook-ingestion", "It needs an AWS emulator, so it is replayed.", say)
    : say(describe(project("webhooks"))),
  vrbench: (args, say) => say(describe(project("vrbench"))),
  "docs-agent": (args, say) => say(describe(project("docs-agent"))),
  cdc: (args, say) => say(describe(project("cdc"))),
  metrics: (args, say) => say(describe(project("metrics"))),
  triage: (args, say) => say(describe(project("triage"))),
  hmda: (args, say) => say(describe(project("hmda"))),
  nosql: (args, say) => say(describe(project("nosql"))),
  drills: (args, say) => say(describe(project("drills"))),
};

async function live(line, prog, say) {
  let run;
  try {
    run = await python(say);
  } catch (error) {
    return say(`<span class="e">Python could not start here (${esc(error.message)}). The same command works from a clone: ${GITHUB}${project(prog).repo}</span>`);
  }
  const started = performance.now();
  let out;
  try {
    out = run(line);
  } catch (error) {
    return say(`<span class="e">${esc(String(error).split("\n").slice(-2).join(" "))}</span>`);
  }
  say(paint(out));
  const p = project(prog);
  const sub = line.trim().split(/\s+/)[1] || "";
  const ms = Math.round(performance.now() - started);
  say(await footer("live", p.repo, `${prog} ${sub}`.trim() + ` (${ms} ms)`));
}

export const lab = {
  handles(line) {
    const first = line.trim().split(/\s+/)[0].toLowerCase();
    return first in HANDLERS || first === "callagent" || first === "callqa";
  },
  // say(html) appends one block to the console.
  async run(line, say) {
    const words = line.trim().split(/\s+/);
    const first = words[0].toLowerCase();
    try {
      if (first === "callagent" || first === "callqa") return await live(line.trim(), first, say);
      return await HANDLERS[first](words.slice(1), say);
    } catch (error) {
      say(`<span class="e">${esc(error.message)}</span>`);
    }
  },
};


/* ── the page: three results in the hero, an overview grid, then four cases ── */
const tier = (name) => PROJECTS.filter((p) => p.tier === name);
const pad = (n) => String(n).padStart(2, "0");
const link = (p) => `${GITHUB}${p.repo}`;
const caveat = (p, cls = "caveat") => `<p class="${cls}"><span class="sr-only">Caveat: </span>${esc(p.caveat)}</p>`;
const tries = (p) => `<div class="tries">${p.tries.map((t) => `
  <button type="button" data-c="${esc(t)}"><span class="tri-p" aria-hidden="true">❯</span><code>${esc(t)}</code><span class="tri-run" aria-hidden="true">run</span></button>`).join("")}</div>`;
// "199 / 200" reads as a share; anything else draws no meter.
const share = (metric) => {
  const m = metric.match(/^([\d,]+)\s*\/\s*([\d,]+)$/);
  return m ? (100 * +m[1].replace(/,/g, "")) / +m[2].replace(/,/g, "") : null;
};

export function renderProof(target) {
  // The three headline results only; later features are on the page, not in the hero.
  target.innerHTML = tier("big").slice(0, 3).map((p) => {
    const v = share(p.metric);
    return `
    <a class="ro-row" href="#p-${p.repo}">
      <span class="ro-metric">${esc(p.metric)}</span>
      ${v === null ? "" : `<span class="ro-meter" aria-hidden="true"><i style="--v:${v.toFixed(1)}%"></i></span>`}
      <span class="ro-label">${esc(p.label)}</span>
      ${caveat(p, "ro-caveat")}
      <span class="ro-repo">${esc(p.repo)} <span aria-hidden="true">↓</span></span>
    </a>`;
  }).join("");
}

// Order on the page: the four featured, the six with a chart, then the four others.
const ORDER = [...tier("big"), ...tier("compact"), ...tier("more")];
const index = (p) => `P-${pad(ORDER.indexOf(p) + 1)}`;
const top = (p) => `<div class="tile-top"><span class="tile-idx">${index(p)}</span>${KIND[p.kind]}</div>`;

const featureTile = (p) => `
  <article class="tile tile-feature reveal scan hud">
    ${top(p)}
    <div class="tile-head">
      <h3 class="tile-name"><a class="stretch" href="#p-${p.repo}">${esc(p.repo)}</a></h3>
      <span class="tile-more" aria-hidden="true">case study ↓</span>
    </div>
    <p class="tile-what">${esc(p.what)}</p>
    <p class="tile-metric">${esc(p.metric)}</p>
    <p class="tile-label">${esc(p.label)}</p>
    ${caveat(p)}
    <div class="tile-thumb"><img src="${p.shot.src}" alt="" width="${p.shot.w}" height="${p.shot.h}" loading="lazy" decoding="async" /></div>
  </article>`;

const compactTile = (p) => `
  <article class="tile tile-compact reveal scan hud" id="p-${p.repo}">
    ${top(p)}
    <h3 class="tile-name"><a href="${link(p)}" target="_blank" rel="noopener">${esc(p.repo)} <span aria-hidden="true">↗</span></a></h3>
    <p class="tile-what">${esc(p.what)}</p>
    <p class="tile-metric">${esc(p.metric)}</p>
    <p class="tile-label">${esc(p.label)}</p>
    ${caveat(p)}
    ${chart(p.chart)}
    ${tries(p)}
    ${p.site ? `<a class="tile-site" href="${p.site}" target="_blank" rel="noopener">Open the live site <span aria-hidden="true">↗</span></a>` : ""}
  </article>`;

const smallTile = (p) => `
  <article class="tile tile-small reveal scan hud" id="p-${p.repo}">
    ${top(p)}
    <h3 class="tile-name"><a class="stretch" href="${link(p)}" target="_blank" rel="noopener">${esc(p.repo)} <span aria-hidden="true">↗</span></a></h3>
    <p class="tile-what">${esc(p.what)}</p>
    <p class="tile-metric">${esc(p.metric)}</p>
    <p class="tile-label">${esc(p.label)}</p>
    ${caveat(p)}
  </article>`;

const liveTile = () => {
  const cmds = ['callagent guard "You will get about 6.25% today."', 'callqa mask "My social is 512-44-7166, call me on 555-0142"'];
  return `
  <aside class="tile tile-cta reveal scan hud" aria-label="Try a project live">
    <div class="cta-a">
      <p class="tile-idx">Try it live</p>
      <p class="cta-title">Two of these run their real Python in your browser.</p>
      <p class="cta-sub">Others replay recorded runs, and every result says which it was.</p>
      <a class="cta-link" href="#lab">Open the shell <span aria-hidden="true">↓</span></a>
    </div>
    <ul class="cta-progs">
      <li><code>callagent</code><span>the calling agent's rules</span></li>
      <li><code>callqa</code><span>the call grader's masking and scoring</span></li>
    </ul>
    <div class="cta-cmds">${cmds.map((c) => `<button type="button" class="cta-cmd" data-c="${esc(c)}"><span aria-hidden="true">❯</span><code>${esc(c)}</code></button>`).join("")}</div>
  </aside>`;
};

function caseStudy(p, i) {
  const second = p.shot2 ? `<a href="${p.shot2.src}" target="_blank" rel="noopener">Also: ${esc(p.shot2.text)} <span aria-hidden="true">↗</span></a>` : "";
  return `
  <article class="case" id="p-${p.repo}">
    <div class="case-text reveal">
      <div class="tile-top"><span class="tile-idx">Case ${pad(i + 1)} · ${index(p)}</span>${KIND[p.kind]}</div>
      <h4 class="case-name">${esc(p.repo)}</h4>
      <p class="case-what">${esc(p.what)}</p>
      <dl class="case-readout">
        <div class="ro-result"><dt>Result</dt><dd><span class="metric">${esc(p.metric)}</span><span class="label">${esc(p.label)}</span></dd></div>
        <div class="ro-cav"><dt>Caveat</dt><dd>${esc(p.caveat)}</dd></div>
      </dl>
      <ol class="story">${p.story.map((line) => `<li>${esc(line)}</li>`).join("")}</ol>
      <p class="tries-title">Run it here</p>
      ${tries(p)}
      <p class="case-links"><a href="${link(p)}" target="_blank" rel="noopener">Code on GitHub <span aria-hidden="true">↗</span></a>${second}</p>
    </div>
    <div class="case-media">
      <figure class="shot reveal scan">
        <div class="shot-bar" aria-hidden="true"><i></i><i></i><i></i><span>${esc(p.repo)}</span></div>
        <a href="${p.shot.src}" target="_blank" rel="noopener" aria-label="Open the screenshot at full size">
          <img src="${p.shot.src}" alt="${esc(p.shot.alt)}" width="${p.shot.w}" height="${p.shot.h}" loading="lazy" decoding="async" />
        </a>
      </figure>
      ${chart(p.chart)}
    </div>
  </article>`;
}

export function renderProjects(grid, cases, runInShell) {
  grid.innerHTML =
    tier("big").map(featureTile).join("") +
    tier("compact").map(compactTile).join("") +
    liveTile() +
    tier("more").map(smallTile).join("");
  cases.innerHTML = tier("big").map(caseStudy).join("");
  [grid, cases].forEach((root) =>
    root.querySelectorAll("button[data-c]").forEach((b) => (b.onclick = () => runInShell(b.dataset.c))));
  tooltips();
}
