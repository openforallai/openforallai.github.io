// Reads data/*.csv from this repository and draws the three charts and the
// tables. No libraries: the site has to keep working untouched for years.

const REPO = "openforallai/openforallai.github.io";

const TABLES = [
  { file: "open_models", title: "Open models" },
  { file: "decentralized_compute", title: "Decentralized compute" },
  { file: "token_vs_usage", title: "Token emissions vs usage" },
  { file: "korean_sovereign_ai", title: "Korean sovereign AI" },
  { file: "funding_events", title: "Open-source funding events" },
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

const FUNDING_ORDER = ["corporate", "state", "crypto", "donation"];

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
            "data-tip": `${capitalize(src)} · ${c.name}: ${models.length} (${models.join(", ")})`,
          });
        });
      return el("div", { class: "row" },
        el("div", { class: "row-label" }, capitalize(src)),
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
  const half = 42; // % of the track each arm may use, leaving room for labels
  const rows = items.map(({ r, p, d, c }) => {
    const w = (Math.abs(p) / max) * half;
    const neg = p < 0;
    const tipText =
      `${r.gpu_type} on ${r.network || "?"}: ${formatPct(p)}` +
      (d != null && c != null ? ` ($${d}/h vs $${c}/h at ${r.centralized_provider || "centralized"})` : "") +
      (r.date ? `, ${r.date}` : "");
    return el("div", { class: "row" },
      el("div", { class: "row-label" }, r.gpu_type, el("small", {}, r.network || "")),
      el("div", { class: "track div" },
        el("span", { class: "zero" }),
        el("span", {
          class: `dbar ${neg ? "neg" : "pos"}`,
          style: neg
            ? { right: "50%", width: `${w}%`, background: cssVar("--cheaper") }
            : { left: "50%", width: `${w}%`, background: cssVar("--pricier") },
          "data-tip": tipText,
        }),
        el("span", {
          class: "dval",
          style: neg ? { right: `calc(50% + ${w}% + 6px)` } : { left: `calc(50% + ${w}% + 6px)` },
        }, formatPct(p))
      )
    );
  });
  target.replaceChildren(...rows);
}

// ---------- chart 3: Korea's sovereign AI budgets ----------

function chartKorea(data) {
  const target = document.getElementById("c3");
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
        el("div", { class: "row-label" }, r.program || "(unnamed)", el("small", {}, r.recipient || "")),
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

// ---------- tables ----------

const NUMERIC = /(_usd|_krw|_pct|usd_per|params|value|amount)/;

function table(spec, data) {
  const head = el("div", { class: "table-head" },
    el("h3", {}, `${spec.title} `, el("span", { class: "meta" }, `(${data.rows.length} rows)`)),
    el("a", { href: `data/${spec.file}.csv`, download: "" }, "Download CSV")
  );
  let body;
  if (!data.rows.length) {
    body = empty("No rows yet.");
  } else {
    const cols = data.columns;
    body = el("table", {},
      el("thead", {}, el("tr", {}, cols.map((c) => el("th", { scope: "col" }, c.replace(/_/g, " "))))),
      el("tbody", {}, data.rows.map((r) =>
        el("tr", {}, cols.map((c) => {
          const v = r[c];
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
        }))
      ))
    );
  }
  return el("div", { class: "table-block" }, head, el("div", { class: "table-wrap" }, body));
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
  const results = await Promise.allSettled(TABLES.map((t) => load(t.file)));
  const data = Object.fromEntries(
    TABLES.map((t, i) => [t.file, results[i].status === "fulfilled" ? results[i].value : { columns: [], rows: [], error: results[i].reason }])
  );

  chartFunding(data.open_models);
  chartCompute(data.decentralized_compute);
  chartKorea(data.korean_sovereign_ai);
  document.getElementById("tables").replaceChildren(...TABLES.map((t) => table(t, data[t.file])));

  const total = TABLES.reduce((n, t) => n + data[t.file].rows.length, 0);
  const failed = TABLES.filter((t) => data[t.file].error).map((t) => t.file);
  const updated = await lastUpdated();
  meta.textContent =
    `${total} sourced rows across ${TABLES.length} tables` +
    (updated ? ` · data last changed ${updated}` : "") +
    (failed.length ? ` · could not load: ${failed.join(", ")}` : "");
})();
