// Reads data/*.csv from this repository and draws the charts and tables on
// whichever page loaded it. Each page lists the tables it needs in
// <main data-tables="..."> ("*" for all) and the ones to show in
// <div id="tables" data-show="...">. No libraries: the site has to keep
// working untouched for years.

const REPO = "openforallai/openforallai.github.io";

const TABLES = [
  { file: "open_models", title: "Open models" },
  { file: "decentralized_compute", title: "Decentralized compute" },
  { file: "token_vs_usage", title: "Token emissions vs usage" },
  { file: "korean_sovereign_ai", title: "Korean sovereign AI" },
  { file: "funding_events", title: "Open-source funding events" },
  { file: "benchmarks", title: "Benchmarks" },
  { file: "model_releases", title: "Model release dates" },
  { file: "agent_run_costs", title: "Agent run costs" },
];

// Countries get fixed colors so a country keeps its color as rows are added.
// Anything not listed here is drawn as "Other".
const COUNTRIES = [
  { name: "United States", color: "--s1", aliases: ["us", "usa", "united states", "united states of america", "미국"] },
  { name: "China", color: "--s2", aliases: ["cn", "china", "prc", "중국"] },
  { name: "South Korea", color: "--s3", aliases: ["kr", "korea", "south korea", "republic of korea", "한국", "대한민국"] },
  { name: "France", color: "--s4", aliases: ["fr", "france", "프랑스"] },
  { name: "UAE", color: "--s5", aliases: ["ae", "uae", "united arab emirates", "아랍에미리트"] },
  { name: "Canada", color: "--s6", aliases: ["ca", "canada", "캐나다"] },
];
const OTHER = { name: "Other", color: "--other" };

const FUNDING_ORDER = ["corporate", "corporate_gov", "state", "crypto", "donation"];
const FUNDING_LABELS = { corporate_gov: "Corporate, government programme" };
const fundingLabel = (s) => FUNDING_LABELS[s] || capitalize(s);

// ---------- CSV ----------

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header = [], ...body] = rows;
  return {
    columns: header.map((h) => h.trim()),
    rows: body
      .filter((r) => r.some((v) => v.trim() !== ""))
      .map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()]))),
  };
}

async function load(file) {
  const res = await fetch(`data/${file}.csv`, { cache: "no-cache" });
  // A table that doesn't exist yet is empty, not broken.
  if (res.status === 404) return { columns: [], rows: [] };
  if (!res.ok) throw new Error(`${file}.csv: HTTP ${res.status}`);
  return parseCSV(await res.text());
}

// ---------- helpers ----------

const num = (s) => {
  if (s == null) return null;
  const v = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(v) ? v : null;
};

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") Object.assign(node.style, v);
    else if (k === "class") node.className = v;
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

const cssVar = (name) => `var(${name})`;

function empty(message) {
  return el("div", { class: "empty" }, message);
}

function country(raw) {
  const key = (raw || "").trim().toLowerCase();
  return COUNTRIES.find((c) => c.aliases.includes(key)) || OTHER;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function formatKRW(v) {
  const abs = Math.abs(v);
  const short = (x) => String(+x.toFixed(1));
  if (abs >= 1e12) return `₩${short(v / 1e12)}T`;
  if (abs >= 1e9) return `₩${short(v / 1e9)}B`;
  if (abs >= 1e6) return `₩${(v / 1e6).toFixed(0)}M`;
  return `₩${Math.round(v).toLocaleString("en-US")}`;
}

// Chart labels drop the Korean name in brackets and anything after it, and
// stop at 48 characters; the table and tooltip keep the full name.
function shortLabel(s) {
  const t = s.split(" (")[0].trim();
  return t.length > 48 ? `${t.slice(0, 46).trimEnd()}…` : t;
}

function formatPct(v) {
  const r = Math.round(v);
  return `${r > 0 ? "+" : ""}${r}%`;
}

function legend(target, items) {
  target.replaceChildren(
    ...items.map((it) =>
      el("span", { class: "key" }, el("span", { class: "swatch", style: { background: cssVar(it.color) } }), it.name)
    )
  );
}

// ---------- tooltip (hover on desktop, tap on phones) ----------

const tip = document.getElementById("tip");
function showTip(target, x, y) {
  tip.textContent = target.dataset.tip;
  tip.hidden = false;
  const pad = 12;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let left = x + pad, top = y + pad;
  if (left + w > window.innerWidth - 8) left = x - w - pad;
  if (top + h > window.innerHeight - 8) top = y - h - pad;
  tip.style.left = `${Math.max(8, left)}px`;
  tip.style.top = `${Math.max(8, top)}px`;
}
document.addEventListener("pointermove", (e) => {
  const t = e.target.closest("[data-tip]");
  if (t && e.pointerType === "mouse") showTip(t, e.clientX, e.clientY);
  else if (e.pointerType === "mouse") tip.hidden = true;
});
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tip]");
  if (t) showTip(t, e.clientX, e.clientY);
  else tip.hidden = true;
});
window.addEventListener("scroll", () => { tip.hidden = true; }, { passive: true });

// ---------- chart 1: who pays for open models ----------

function chartFunding(data) {
  const target = document.getElementById("c1");
  if (!target) return;
  const rows = data.rows.filter((r) => r.funding_source);
  if (!rows.length) {
    target.replaceChildren(empty("No models yet. The first rows go in on 1 October 2026."));
    return;
  }
  const groups = new Map();
  for (const r of rows) {
    const src = r.funding_source.toLowerCase();
    const c = country(r.country);
    if (!groups.has(src)) groups.set(src, new Map());
    const g = groups.get(src);
    if (!g.has(c.name)) g.set(c.name, { c, models: [] });
    g.get(c.name).models.push(r.name || "(unnamed)");
  }
  const order = [...groups.keys()].sort((a, b) => {
    const ia = FUNDING_ORDER.indexOf(a), ib = FUNDING_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  const totals = order.map((s) => [...groups.get(s).values()].reduce((n, x) => n + x.models.length, 0));
  const max = Math.max(...totals);
  const present = [...COUNTRIES, OTHER].filter((c) =>
    order.some((s) => groups.get(s).has(c.name))
  );

  legend(document.getElementById("c1-legend"), present);
  target.replaceChildren(
    ...order.map((src, i) => {
      const g = groups.get(src);
      const segs = present
        .filter((c) => g.has(c.name))
        .map((c) => {
          const { models } = g.get(c.name);
          return el("span", {
            class: "seg",
            style: { flexGrow: models.length, flexBasis: 0, background: cssVar(c.color) },
            "data-tip": `${fundingLabel(src)} · ${c.name}: ${models.length} (${models.join(", ")})`,
          });
        });
      return el("div", { class: "row" },
        el("div", { class: "row-label" }, fundingLabel(src)),
        el("div", { class: "track" },
          el("div", { class: "bar", style: { width: `calc((100% - 3rem) * ${totals[i] / max})` } }, segs),
          el("span", { class: "bar-value" }, totals[i])
        )
      );
    })
  );
}

// ---------- chart 2: decentralized vs centralized GPU prices ----------

function chartCompute(data) {
  const target = document.getElementById("c2");
  if (!target) return;
  const latest = new Map();
  for (const r of data.rows) {
    let p = num(r.premium_pct);
    const d = num(r.usd_per_hour), c = num(r.centralized_usd_per_hour);
    if (p == null && d != null && c) p = (d / c - 1) * 100;
    if (p == null || !r.gpu_type) continue;
    const key = `${r.gpu_type}|${r.network}`;
    const prev = latest.get(key);
    if (!prev || (r.date || "") >= (prev.r.date || "")) latest.set(key, { r, p, d, c });
  }
  const items = [...latest.values()].sort((a, b) => a.p - b.p);
  if (!items.length) {
    target.replaceChildren(empty("No prices yet."));
    return;
  }
  legend(document.getElementById("c2-legend"), [
    { name: "Cheaper than centralized", color: "--cheaper" },
    { name: "More expensive", color: "--pricier" },
  ]);
  const max = Math.max(10, ...items.map((x) => Math.abs(x.p)));
  const rows = items.map(({ r, p, d, c }) => {
    // Each arm is half the track minus 3rem, so the value label always fits outside the bar.
    const arm = `(50% - 3rem) * ${Math.abs(p) / max}`;
    const neg = p < 0;
    const avail = num(r.available), total = num(r.total);
    const free = avail != null && total != null ? `${avail} of ${total} free` : "";
    const tipText =
      `${r.gpu_type} on ${r.network || "?"}: ${formatPct(p)}` +
      (d != null && c != null ? ` ($${d}/h vs $${c}/h at ${r.centralized_provider || "centralized"})` : "") +
      (r.date ? `, ${r.date}` : "") +
      (free ? `. ${free} when read` : "") +
      (r.notes ? `. ${r.notes}` : "");
    return el("div", { class: "row" },
      el("div", { class: "row-label" }, r.gpu_type, el("small", {}, [r.network, free].filter(Boolean).join(" · "))),
      el("div", { class: "track div" },
        el("span", { class: "zero" }),
        el("span", {
          class: `dbar ${neg ? "neg" : "pos"}`,
          style: neg
            ? { right: "50%", width: `calc(${arm})`, background: cssVar("--cheaper") }
            : { left: "50%", width: `calc(${arm})`, background: cssVar("--pricier") },
          "data-tip": tipText,
        }),
        el("span", {
          class: "dval",
          style: neg ? { right: `calc(50% + ${arm} + 6px)` } : { left: `calc(50% + ${arm} + 6px)` },
        }, formatPct(p))
      )
    );
  });
  target.replaceChildren(...rows);
}

// ---------- chart 3: Korea's sovereign AI budgets ----------

function chartKorea(data) {
  const target = document.getElementById("c3");
  if (!target) return;
  const items = data.rows
    .map((r) => ({ r, v: num(r.budget_krw) }))
    .filter((x) => x.v != null && x.v > 0)
    .sort((a, b) => b.v - a.v);
  if (!items.length) {
    target.replaceChildren(empty("No programs yet."));
    return;
  }
  const max = items[0].v;
  target.replaceChildren(
    ...items.map(({ r, v }) =>
      el("div", { class: "row" },
        el("div", { class: "row-label", title: r.program }, shortLabel(r.program || "(unnamed)"), el("small", {}, r.recipient || "")),
        el("div", { class: "track" },
          el("div", {
            class: "bar",
            style: { width: `calc((100% - 4.5rem) * ${v / max})`, background: cssVar("--bar") },
            "data-tip": `${r.program}${r.recipient ? ` → ${r.recipient}` : ""}: ${formatKRW(v)}${r.date ? `, ${r.date}` : ""}`,
          }),
          el("span", { class: "bar-value" }, formatKRW(v))
        )
      )
    )
  );
}

// ---------- chart 4: how far behind are open models ----------

// [benchmark in the data, label, unit, group heading, run length if the benchmark states it]
// Run lengths: DeepSWE median 15-20 min per trial (deepswe.datacurve.ai/blog/deepswe);
// FrontierSWE 20-hour budget, average 8.6 to ~17 h per trial by model (frontierswe.com/blog/v2).
const BENCH_ORDER = [
  ["Epoch Capabilities Index", "Epoch Capabilities Index", "points", "Overall"],
  ["GPQA Diamond", "GPQA Diamond", "%", "Knowledge and reasoning"],
  ["Humanity's Last Exam (no tools)", "Humanity's Last Exam (no tools)", "%", "Knowledge and reasoning"],
  ["OTIS Mock AIME 2024-2025", "Mock AIME (Epoch)", "%", "Knowledge and reasoning"],
  ["Terminal-Bench 2.1", "Terminal-Bench 2.1", "%", "Agentic coding"],
  ["DeepSWE", "DeepSWE", "%", "Agentic coding", "runs of under an hour"],
  ["FrontierSWE", "FrontierSWE", "%", "Agentic coding", "runs of up to 20 hours"],
  ["APEX-Agents", "APEX-Agents (professional tasks)", "%", "Agentic tasks"],
  ["Vending-Bench 2", "Vending-Bench 2 (runs a business, final balance)", "$", "Agentic tasks"],
];
const GROUPS = [
  { key: "closed", name: "Best closed", color: "--s1", test: (r) => r.weights === "closed" },
  { key: "open", name: "Best open", color: "--s2", test: (r) => r.weights === "open" },
  { key: "korea", name: "Best Korean", color: "--s3", test: (r) => r.country === "South Korea" },
];

function pickBest(rows) {
  // Independent scores win; a self-reported score is used only if a group has nothing else.
  const indep = rows.filter((r) => r.measured_by !== "self-reported");
  const pool = indep.length ? indep : rows;
  return pool.reduce((a, b) => (num(b.score) > num(a.score) ? b : a), pool[0]);
}

// A closed model with an empty release date in model_releases.csv has been
// announced but isn't publicly available (CONTRIBUTING.md). It doesn't count
// as "best closed", because nobody can use it yet; the gap chart shows it on
// its own line when it would otherwise lead.
function notYetPublic(releases) {
  return new Set(releases.rows.filter((r) => r.weights === "closed" && !r.release_date).map((r) => r.model));
}

function chartGap(data, releases) {
  const target = document.getElementById("c4");
  if (!target) return;
  const unreleased = notYetPublic(releases);
  const rows = data.rows.filter((r) => num(r.score) != null);
  const PREVIEW = { key: "preview", name: "Closed, not yet public", color: "--other", test: (r) => unreleased.has(r.model) };
  if (!rows.length) {
    target.replaceChildren(empty("No scores yet."));
    return;
  }
  const isPublic = (r) => !unreleased.has(r.model);
  let previewShown = false;
  const blocks = [];
  let heading = null;
  for (const [bench, label, unit, group, runLength] of BENCH_ORDER) {
    const inBench = rows.filter((r) => r.benchmark === bench);
    if (!inBench.length) continue;
    const best = GROUPS.map((g) => {
      const pool = inBench.filter((r) => g.test(r) && isPublic(r));
      return pool.length ? { g, r: pickBest(pool) } : null;
    }).filter(Boolean);
    // An unreleased closed model is shown only where it beats every public one.
    const previews = inBench.filter(PREVIEW.test);
    const pc = best.find((b) => b.g.key === "closed");
    if (previews.length) {
      const p = pickBest(previews);
      if (!pc || num(p.score) > num(pc.r.score)) {
        best.splice(1, 0, { g: PREVIEW, r: p });
        previewShown = true;
      }
    }
    const max = Math.max(...best.map((b) => num(b.r.score)));
    if (group !== heading) {
      blocks.push(el("h3", { class: "bench-group" }, group));
      heading = group;
    }
    const money = (v) => `$${Math.round(v).toLocaleString("en-US")}`;
    const closed = best.find((b) => b.g.key === "closed");
    const open = best.find((b) => b.g.key === "open");
    let gap = "";
    if (closed && open) {
      const d = num(closed.r.score) - num(open.r.score);
      const pts = Math.abs(d).toFixed(1);
      const amount = unit === "$" ? money(Math.abs(d)) : `${pts} ${unit === "%" ? "points" : unit}`;
      gap = Math.abs(d) < 0.05 ? "Open level with closed" : d > 0 ? `Open trails by ${amount}` : `Open leads by ${amount}`;
    }
    // Only the closed-vs-open gap is stated, so only that pair decides the warning.
    const mixed = closed && open && (closed.r.measured_by === "self-reported") !== (open.r.measured_by === "self-reported");
    if (mixed) gap += `${gap ? " · " : ""}mixes self-reported and independent scores`;
    const fmt = (r) =>
      `${unit === "$" ? money(num(r.score)) : num(r.score).toFixed(1)}${unit === "%" ? "%" : ""}${r.measured_by === "self-reported" ? "*" : ""}`;
    blocks.push(
      el("div", { class: "bench" },
        el("div", { class: "bench-head" }, el("strong", {}, label, runLength ? el("small", {}, runLength) : null), el("span", {}, gap)),
        best.map(({ g, r }) =>
          el("div", { class: "row" },
            el("div", { class: "row-label" }, g.name, el("small", {}, r.model)),
            el("div", { class: "track" },
              el("div", {
                class: "bar",
                style: { width: `calc((100% - 4.5rem) * ${Math.max(0, num(r.score)) / max})`, background: cssVar(g.color) },
                "data-tip": `${r.model} (${r.org}): ${fmt(r)} on ${label}. Measured by ${r.measured_by}${r.setting ? `, ${r.setting}` : ""}.${r.notes ? ` ${r.notes}` : ""}`,
              }),
              el("span", { class: "bar-value" }, fmt(r))
            )
          )
        )
      )
    );
  }
  legend(document.getElementById("c4-legend"), [...GROUPS.filter((g) => rows.some((r) => g.test(r) && isPublic(r))), ...(previewShown ? [PREVIEW] : [])]);
  target.replaceChildren(...blocks);
}

// ---------- chart 5: how many months behind ----------

const DAY = 864e5;
const MONTH = 30.44 * DAY;
const toTime = (s) => Date.parse(`${s}T00:00:00Z`);
const monthName = (t) => new Date(t).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const dayName = (t) => new Date(t).toISOString().slice(0, 10);

const SVGNS = "http://www.w3.org/2000/svg";
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") Object.assign(node.style, v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

// For one benchmark: every scored model with a release date, split closed/open.
// Like the gap chart, independent scores win and self-reported ones are used
// only where a side has nothing else.
function lagSeries(rows, dates) {
  const side = (w) => {
    let pool = rows.filter((r) => r.weights === w && dates.has(r.model));
    const indep = pool.filter((r) => r.measured_by !== "self-reported");
    if (indep.length) pool = indep;
    return pool
      .map((r) => ({ r, x: toTime(dates.get(r.model)), y: num(r.score) }))
      .sort((a, b) => a.x - b.x || b.y - a.y);
  };
  const closed = side("closed"), open = side("open");
  if (!closed.length || !open.length) return null;
  // The best open score, and the first open model to reach it.
  const best = open.reduce((a, p) => (p.y > a.y || (p.y === a.y && p.x < a.x) ? p : a));
  // The first closed model to reach that score.
  const first = closed.find((p) => p.y >= best.y) || null;
  const lag = first ? (best.x - first.x) / MONTH : null;
  // If the first closed model to reach it is also the earliest closed model with
  // a score here, an earlier closed model may have got there without being tested,
  // so the lag is a floor, not a measurement.
  const atLeast = !!first && first === closed[0] && lag > 0;
  // The best closed score, which open may not have reached at all.
  const top = closed.reduce((a, p) => (p.y > a.y || (p.y === a.y && p.x < a.x) ? p : a));
  return { closed, open, best, first, lag, top, atLeast };
}

function lagText(s) {
  if (!s.first) return "Open leads: no closed model in the table has reached the best open score";
  const m = Math.abs(s.lag);
  const n = m < 0.95 ? `${Math.round(m * 30.44)} days` : `${m.toFixed(1)} months`;
  if (s.atLeast) return `Open is at least ${n} behind: ${s.first.r.model} is the earliest closed model tested here, and an older one may have got there first`;
  if (s.lag >= 0) return `Open is ${n} behind`;
  return `Open got there ${n} first`;
}

// Best-so-far as a step line, carried on to the right edge.
function stepPath(points, sx, sy, xEnd) {
  let d = "", max = -Infinity;
  for (const p of points) {
    if (p.y <= max) continue;
    d += d ? ` H${sx(p.x)} V${sy(p.y)}` : `M${sx(p.x)} ${sy(p.y)}`;
    max = p.y;
  }
  return d ? `${d} H${sx(xEnd)}` : "";
}

function lagPlot(s, unit, label, width) {
  const h = 190, m = { t: 14, r: 12, b: 26, l: 44 };
  const all = [...s.closed, ...s.open];
  const x0 = Math.min(...all.map((p) => p.x)), x1 = Math.max(Date.now(), ...all.map((p) => p.x));
  const pad = Math.max((x1 - x0) * 0.04, 10 * DAY);
  const dx0 = x0 - pad, dx1 = x1 + pad;
  // The axis covers the scores, not zero to the top: the steps are what matter.
  const lo = Math.min(...all.map((p) => p.y)), hi = Math.max(...all.map((p) => p.y));
  const span = Math.max(hi - lo, Math.abs(hi) * 0.05, 1);
  const ymin = lo - span * 0.15;
  const ymax = unit === "%" ? Math.max(hi, Math.min(100, hi + span * 0.15)) : hi + span * 0.15;
  const sx = (t) => m.l + ((t - dx0) / (dx1 - dx0)) * (width - m.l - m.r);
  const sy = (v) => h - m.b - ((v - ymin) / (ymax - ymin)) * (h - m.t - m.b);
  const fmtY = (v) => (unit === "$" ? `$${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);
  const fmtScore = (v) => (unit === "$" ? `$${Math.round(v).toLocaleString("en-US")}` : `${v.toFixed(1)}${unit === "%" ? "%" : ""}`);

  const kids = [];
  // Horizontal grid: four lines.
  for (let i = 0; i <= 3; i++) {
    const v = ymin + ((ymax - ymin) * i) / 3;
    kids.push(svg("line", { x1: m.l, x2: width - m.r, y1: sy(v), y2: sy(v), style: { stroke: "var(--grid)" } }));
    kids.push(svg("text", { x: m.l - 6, y: sy(v) + 4, "text-anchor": "end", class: "ax" }, fmtY(v)));
  }
  // Time ticks: every 3 months, or every month on a short span; fewer on a phone.
  const spanMonths = (dx1 - dx0) / MONTH;
  let step = spanMonths > 18 ? 6 : spanMonths > 6 ? 3 : 1;
  if (width < 420 && step < 6 && spanMonths / step > 4) step *= 2;
  const d = new Date(dx0);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  while (t < dx1) {
    const md = new Date(t);
    if (md.getUTCMonth() % step === 0) {
      kids.push(svg("line", { x1: sx(t), x2: sx(t), y1: h - m.b, y2: h - m.b + 4, style: { stroke: "var(--axis)" } }));
      kids.push(svg("text", { x: sx(t), y: h - 8, "text-anchor": "middle", class: "ax" }, monthName(t)));
    }
    t = Date.UTC(md.getUTCFullYear(), md.getUTCMonth() + 1, 1);
  }
  kids.push(svg("line", { x1: m.l, x2: width - m.r, y1: h - m.b, y2: h - m.b, style: { stroke: "var(--axis)" } }));

  // The lag: a dashed line at the best open score, from the closed model that
  // first reached it to the open model that did.
  if (s.first) {
    const a = sx(Math.min(s.first.x, s.best.x)), b = sx(Math.max(s.first.x, s.best.x)), y = sy(s.best.y);
    kids.push(svg("line", { x1: a, x2: b, y1: y, y2: y, class: "lagline" }));
  }
  for (const [pts, color] of [[s.closed, "--s1"], [s.open, "--s2"]]) {
    kids.push(svg("path", { d: stepPath(pts, sx, sy, x1), fill: "none", style: { stroke: `var(${color})`, strokeWidth: "2" } }));
  }
  for (const [pts, color, name] of [[s.closed, "--s1", "closed"], [s.open, "--s2", "open"]]) {
    for (const p of pts) {
      kids.push(svg("circle", {
        cx: sx(p.x), cy: sy(p.y), r: 4.5,
        style: { fill: `var(${color})`, stroke: "var(--surface)", strokeWidth: "1.5" },
        "data-tip": `${p.r.model} (${p.r.org}, ${name}): ${fmtScore(p.y)}${p.r.measured_by === "self-reported" ? "*" : ""} on ${label}. Released ${dayName(p.x)}.`,
      }));
    }
  }
  return svg("svg", { width, height: h, viewBox: `0 0 ${width} ${h}`, role: "img", "aria-label": `${label}: ${lagText(s)}` }, kids);
}

function chartLag(bench, releases) {
  const target = document.getElementById("c5");
  if (!target) return;
  const summary = document.getElementById("c5-summary");
  const dates = new Map(releases.rows.filter((r) => r.release_date).map((r) => [r.model, r.release_date]));
  if (!dates.size) {
    summary.replaceChildren();
    target.replaceChildren(empty("Release dates for every model are being added. The chart fills in when they are."));
    return;
  }
  const items = [];
  const fmtScore = (v, unit) => (unit === "$" ? `$${Math.round(v).toLocaleString("en-US")}` : `${v.toFixed(1)}${unit === "%" ? "%" : ""}`);
  for (const [b, label, unit] of BENCH_ORDER) {
    const s = lagSeries(bench.rows.filter((r) => r.benchmark === b && num(r.score) != null), dates);
    if (s) items.push({ label, unit, s });
  }
  if (!items.length) {
    summary.replaceChildren();
    target.replaceChildren(empty("No benchmark has release dates on both sides yet."));
    return;
  }

  // If every model came out within a short window, no longer lag can show up.
  // Say so above the numbers rather than let them look like a finding.
  // The lag is measured back to a closed model, so the closed models' dates
  // set the limit.
  const times = releases.rows.filter((r) => r.release_date && r.weights === "closed").map((r) => toTime(r.release_date));
  const t0 = times.length ? Math.min(...times) : Date.now(), t1 = times.length ? Math.max(...times) : Date.now();
  const windowMonths = (t1 - t0) / MONTH;
  const note = document.getElementById("c5-note");
  if (note) {
    note.replaceChildren(
      windowMonths < 18
        ? el("p", { class: "warn" },
            `Read with care: every closed model in the table came out between ${monthName(t0)} and ${monthName(t1)}, `,
            `so no lag longer than about ${Math.max(1, Math.round(windowMonths))} months can show up here. `,
            "Older models are being added; until then these numbers say more about which models are listed than about the real lag.")
        : ""
    );
  }

  // Summary: months behind per benchmark.
  const behind = items.filter((it) => it.s.first && it.s.lag > 0);
  const max = Math.max(1, ...behind.map((it) => it.s.lag));
  summary.replaceChildren(
    ...items.map(({ label, s }) => {
      const on = s.first && s.lag > 0;
      return el("div", { class: "row" },
        el("div", { class: "row-label" }, label),
        el("div", { class: "track" },
          on ? el("div", {
            class: "bar",
            style: { width: `calc((100% - 7rem) * ${s.lag / max})`, background: cssVar("--bar") },
            "data-tip": `${label}: best open ${s.best.r.model} (${dayName(s.best.x)}); closed first reached it with ${s.first.r.model} (${dayName(s.first.x)}).${s.atLeast ? " That is the earliest closed model tested here, so the real lag may be longer." : ""}`,
          }) : null,
          el("span", { class: "bar-value" }, on ? `${s.atLeast ? "≥ " : ""}${s.lag.toFixed(1)} months` : lagText(s).replace(/:.*/, ""))
        )
      );
    })
  );

  legend(document.getElementById("c5-legend"), [
    { name: "Closed, best so far", color: "--s1" },
    { name: "Open, best so far", color: "--s2" },
  ]);
  const draw = () => {
    const width = Math.max(280, target.clientWidth);
    target.replaceChildren(
      ...items.map(({ label, unit, s }) =>
        el("div", { class: "bench" },
          el("div", { class: "bench-head" }, el("strong", {}, label), el("span", {}, lagText(s))),
          s.best.y < s.top.y
            ? el("p", { class: "lag-note" },
                `Not yet reached by any open model: ${s.top.r.model}'s ${fmtScore(s.top.y, unit)}, `,
                `released ${dayName(s.top.x)} (${Math.max(0, Math.round((Date.now() - s.top.x) / DAY))} days ago).`)
            : null,
          el("div", { class: "plot" }, lagPlot(s, unit, label, width))
        )
      )
    );
  };
  draw();
  let last = target.clientWidth;
  window.addEventListener("resize", () => {
    if (Math.abs(target.clientWidth - last) < 8) return;
    last = target.clientWidth;
    draw();
  });
}

// ---------- chart 6: what one agent run costs ----------

// One block per benchmark, in the gap chart's order; inside it, every model
// the benchmark's authors costed, most expensive first, open and closed in
// the gap chart's colors. All blocks share one scale, so a short run and a
// long one can be compared at a glance; the dollar value is printed on each bar.
function chartRunCosts(data) {
  const target = document.getElementById("c6");
  if (!target) return;
  const rows = data.rows.filter((r) => num(r.usd_per_run) != null);
  if (!rows.length) {
    target.replaceChildren(empty("No run costs yet."));
    return;
  }
  const sides = GROUPS.filter((g) => g.key !== "korea");
  legend(document.getElementById("c6-legend"), sides.filter((g) => rows.some(g.test)));
  const known = BENCH_ORDER.map(([b]) => b);
  const benches = [...new Set(rows.map((r) => r.benchmark))].sort((a, b) => {
    const i = known.indexOf(a), j = known.indexOf(b);
    return (i < 0 ? 99 : i) - (j < 0 ? 99 : j) || a.localeCompare(b);
  });
  const max = Math.max(...rows.map((r) => num(r.usd_per_run)));
  const money = (v) => (v < 10 ? `$${v.toFixed(2).replace(/\.?0+$/, "")}` : `$${Math.round(v).toLocaleString("en-US")}`);
  target.replaceChildren(
    ...benches.map((b) => {
      const [, label = b, , , runLength] = BENCH_ORDER.find(([n]) => n === b) || [];
      const inBench = rows.filter((r) => r.benchmark === b).sort((x, y) => num(y.usd_per_run) - num(x.usd_per_run));
      const stat = [...new Set(inBench.map((r) => r.statistic))].join(" / ");
      return el("div", { class: "bench" },
        el("div", { class: "bench-head" },
          el("strong", {}, label, runLength ? el("small", {}, runLength) : null),
          el("span", {}, `${capitalize(stat)} cost per run`)
        ),
        inBench.map((r) => {
          const g = sides.find((s) => s.test(r)) || sides[0];
          const score = num(r.score) != null ? ` · scored ${num(r.score)}%` : "";
          return el("div", { class: "row" },
            el("div", { class: "row-label" }, r.model, el("small", {}, capitalize(r.weights))),
            el("div", { class: "track" },
              el("div", {
                class: "bar",
                style: { width: `calc((100% - 7rem) * ${num(r.usd_per_run) / max})`, background: cssVar(g.color) },
                "data-tip": `${r.model} (${r.org}): ${money(num(r.usd_per_run))} ${r.statistic} per run on ${label}${score}${r.hours_per_run ? `, ${r.hours_per_run} hours per run` : ""}.${r.notes ? ` ${r.notes}` : ""}`,
              }),
              el("span", { class: "bar-value" }, `${money(num(r.usd_per_run))}${score ? ` · ${num(r.score)}%` : ""}`)
            )
          );
        })
      );
    })
  );
}

// Benchmarks table: grouped by benchmark in the chart's order, best score first.
function sortBenchmarks(rows) {
  const order = (b) => {
    const i = BENCH_ORDER.findIndex(([name]) => name === b);
    return i < 0 ? 99 : i;
  };
  return [...rows].sort((a, b) => order(a.benchmark) - order(b.benchmark) || a.benchmark.localeCompare(b.benchmark) || num(b.score) - num(a.score));
}

// ---------- tables ----------

const NUMERIC = /(_usd|_krw|_pct|usd_per|hours_per|params|value|amount)/;

function cell(c, v) {
  if (c.endsWith("source_url") && /^https?:\/\//.test(v)) {
    let host = v;
    try { host = new URL(v).hostname.replace(/^www\./, ""); } catch {}
    return el("td", {}, el("a", { href: v, rel: "noopener" }, host));
  }
  if (NUMERIC.test(c)) {
    // Long plain integers get separators; anything else is shown as typed.
    const shown = /^\d{5,}$/.test(v) ? Number(v).toLocaleString("en-US") : v;
    return el("td", { class: "num" }, shown);
  }
  return el("td", {}, v);
}

function grid(cols, rows) {
  return el("table", {},
    el("thead", {}, el("tr", {}, cols.map((c) => el("th", { scope: "col" }, c.replace(/_/g, " "))))),
    el("tbody", {}, rows.map((r) => el("tr", {}, cols.map((c) => cell(c, r[c])))))
  );
}

// Benchmarks: one tab per benchmark, in the chart's order, best score first.
function benchmarkTabs(data) {
  const names = [...new Set(sortBenchmarks(data.rows).map((r) => r.benchmark))];
  const label = (b) => (BENCH_ORDER.find(([n]) => n === b) || [b, b])[1];
  const cols = ["score", "model", "weights", "org", "country", "measured_by", "setting", "date", "source_url", "notes"]
    .filter((c) => data.columns.includes(c));
  const panel = el("div", { class: "table-wrap", role: "tabpanel" });
  const tabs = names.map((b, i) =>
    el("button", { class: "tab", role: "tab", type: "button", "aria-selected": i === 0 ? "true" : "false", "data-b": b }, label(b))
  );
  const show = (b) => {
    for (const t of tabs) t.setAttribute("aria-selected", t.dataset.b === b ? "true" : "false");
    const rows = data.rows.filter((r) => r.benchmark === b).sort((x, y) => num(y.score) - num(x.score));
    panel.replaceChildren(grid(cols, rows));
    panel.setAttribute("aria-label", label(b));
  };
  const bar = el("div", { class: "tabs", role: "tablist", "aria-label": "Benchmark" }, tabs);
  bar.addEventListener("click", (e) => {
    const t = e.target.closest(".tab");
    if (t) show(t.dataset.b);
  });
  show(names[0]);
  return [bar, panel];
}

function table(spec, data) {
  const head = el("div", { class: "table-head" },
    el("h3", {}, `${spec.title} `, el("span", { class: "meta" }, `(${data.rows.length} ${data.rows.length === 1 ? "row" : "rows"})`)),
    el("a", { href: `data/${spec.file}.csv`, download: "" }, "Download CSV")
  );
  if (!data.rows.length) {
    return el("div", { class: "table-block" }, head, el("div", { class: "table-wrap" }, empty("No rows yet.")));
  }
  if (spec.file === "benchmarks") {
    return el("div", { class: "table-block" }, head, ...benchmarkTabs(data));
  }
  return el("div", { class: "table-block" }, head, el("div", { class: "table-wrap" }, grid(data.columns, data.rows)));
}

// ---------- boot ----------

async function lastUpdated() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/commits?path=data&per_page=1`);
    if (!res.ok) return null;
    const [c] = await res.json();
    return c ? c.commit.committer.date.slice(0, 10) : null;
  } catch {
    return null;
  }
}

(async function main() {
  const meta = document.getElementById("meta");
  const want = (document.querySelector("main").dataset.tables || "*").split(",").map((x) => x.trim()).filter(Boolean);
  const specs = want.includes("*") ? TABLES : TABLES.filter((t) => want.includes(t.file));
  const results = await Promise.allSettled(specs.map((t) => load(t.file)));
  const data = Object.fromEntries(
    specs.map((t, i) => [t.file, results[i].status === "fulfilled" ? results[i].value : { columns: [], rows: [], error: results[i].reason }])
  );
  const none = { columns: [], rows: [] };

  if (data.open_models) chartFunding(data.open_models);
  if (data.decentralized_compute) chartCompute(data.decentralized_compute);
  if (data.korean_sovereign_ai) chartKorea(data.korean_sovereign_ai);
  if (data.agent_run_costs) chartRunCosts(data.agent_run_costs);
  if (data.benchmarks) {
    chartGap(data.benchmarks, data.model_releases || none);
    chartLag(data.benchmarks, data.model_releases || none);
  }

  const tables = document.getElementById("tables");
  if (tables) {
    const show = (tables.dataset.show || "*").split(",").map((x) => x.trim());
    const list = show.includes("*") ? specs : specs.filter((t) => show.includes(t.file));
    tables.replaceChildren(...list.map((t) => table(t, data[t.file])));
  }

  const total = specs.reduce((n, t) => n + data[t.file].rows.length, 0);
  const failed = specs.filter((t) => data[t.file].error).map((t) => t.file);
  const updated = await lastUpdated();
  meta.textContent =
    `${total} sourced ${total === 1 ? "row" : "rows"}` +
    (specs.length > 1 ? ` across ${specs.length} tables` : "") +
    (updated ? ` · data last changed ${updated}` : "") +
    (failed.length ? ` · could not load: ${failed.join(", ")}` : "");
})();
