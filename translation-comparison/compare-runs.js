const fs = require("fs");
const path = require("path");

const RESULTS_DIR = path.resolve(__dirname, "results");

// --- CLI args: node compare-runs.js <run1> <run2> [run3...] ---
const runNames = process.argv.slice(2).filter((a) => !a.startsWith("--"));

if (runNames.length < 2) {
  console.error("Usage: node compare-runs.js <run1> <run2> [run3...]");
  console.error("Example: node compare-runs.js v1 v2");

  // List available runs
  if (fs.existsSync(RESULTS_DIR)) {
    const available = fs.readdirSync(RESULTS_DIR)
      .filter((d) => fs.existsSync(path.join(RESULTS_DIR, d, "intermediate.json")));
    if (available.length > 0) {
      console.error(`\nAvailable runs: ${available.join(", ")}`);
    }
  }
  process.exit(1);
}

// Load runs
const runs = runNames.map((name) => {
  const dir = path.join(RESULTS_DIR, name);
  const intermediatePath = path.join(dir, "intermediate.json");
  const metaPath = path.join(dir, "run-meta.json");

  if (!fs.existsSync(intermediatePath)) {
    console.error(`Error: ${intermediatePath} not found`);
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(intermediatePath, "utf-8"));
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, "utf-8"))
    : { name, model: "unknown", timestamp: "unknown" };

  // Index by unique key
  const index = new Map();
  for (const entry of entries) {
    index.set(`${entry.id}:${entry.field}:${entry.targetLang}`, entry);
  }

  return { name, meta, entries, index };
});

// Collect all unique keys across runs
const allKeys = new Set();
for (const run of runs) {
  for (const key of run.index.keys()) {
    allKeys.add(key);
  }
}

// Build comparison data
const comparisons = [];
for (const key of allKeys) {
  const firstRun = runs.find((r) => r.index.has(key));
  const base = firstRun.index.get(key);

  const translations = {};
  for (const run of runs) {
    const entry = run.index.get(key);
    translations[run.name] = entry
      ? { text: entry.cohereTranslation, model: entry.model || run.meta.model }
      : null;
  }

  comparisons.push({
    id: base.id,
    region: base.region,
    recordId: base.recordId,
    displayTitle: base.displayTitle,
    field: base.field,
    sourceLang: base.sourceLang,
    targetLang: base.targetLang,
    sourceText: base.sourceText,
    awsTranslation: base.awsTranslation,
    translations,
  });
}

// Compute stats
function computeRunStats(run) {
  const total = run.entries.length;
  const errors = run.entries.filter((e) => e.cohereTranslation?.startsWith("[ERROR:")).length;
  return { total, errors, translated: total - errors };
}

// Generate HTML
function esc(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateHtml() {
  const runHeaders = runs.map((r) =>
    `<th>${esc(r.name)}<br><small>${esc(r.meta.model)}</small></th>`
  ).join("");

  const runStats = runs.map((r) => {
    const s = computeRunStats(r);
    return `<div class="stat"><span class="stat-value">${s.translated}</span><span class="stat-label">${esc(r.name)} translated</span></div>
    <div class="stat"><span class="stat-value">${s.errors}</span><span class="stat-label">${esc(r.name)} errors</span></div>`;
  }).join("");

  // Count how many entries differ between runs
  let differCount = 0;
  let identicalCount = 0;
  for (const comp of comparisons) {
    const texts = runs.map((r) => comp.translations[r.name]?.text?.trim() || "").filter(Boolean);
    if (texts.length >= 2 && new Set(texts).size === 1) identicalCount++;
    else if (texts.length >= 2) differCount++;
  }

  const rows = comparisons.map((comp) => {
    const texts = runs.map((r) => comp.translations[r.name]?.text?.trim() || "");
    const allSame = texts.length >= 2 && new Set(texts.filter(Boolean)).size <= 1;
    const rowClass = allSame ? "row-identical" : "row-different";

    const cells = runs.map((r) => {
      const t = comp.translations[r.name];
      if (!t) return `<td class="missing">N/A</td>`;
      if (t.text?.startsWith("[ERROR:")) return `<td class="error">${esc(t.text)}</td>`;
      return `<td>${esc(t.text)}</td>`;
    }).join("");

    return `<tr class="${rowClass}" data-region="${esc(comp.region)}" data-field="${comp.field}" data-direction="${comp.sourceLang}2${comp.targetLang}">
      <td class="meta-cell">
        <strong>${esc(comp.displayTitle)}</strong><br>
        <small>${comp.field} (${comp.sourceLang} &rarr; ${comp.targetLang})</small><br>
        <small class="region-label">${esc(comp.region)}</small>
      </td>
      <td class="source-cell">${esc(comp.sourceText?.substring(0, 200))}${comp.sourceText?.length > 200 ? "..." : ""}</td>
      ${cells}
    </tr>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Translation Run Comparison | CIOOS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --cioos-navy: #152F37;
    --cioos-primary: #52A79B;
    --cioos-teal-light: #C6E3DF;
    --cioos-sand: #F3F0EC;
    --cioos-white: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Montserrat', sans-serif; font-size: 14px; background: var(--cioos-sand); color: var(--cioos-navy); }
  h1, h2 { font-family: 'Sora', sans-serif; }

  .page-header { background: var(--cioos-navy); color: var(--cioos-white); padding: 24px 32px; margin-bottom: 24px; }
  .page-header h1 { color: var(--cioos-white); font-size: 1.5rem; }
  .page-header .subtitle { color: var(--cioos-teal-light); font-size: 0.85rem; margin-top: 4px; }

  .page-content { padding: 0 32px 32px; }

  .summary { background: var(--cioos-white); border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(21,47,55,0.08); border: 1px solid var(--cioos-teal-light); display: flex; flex-wrap: wrap; gap: 12px 24px; }
  .stat { display: flex; flex-direction: column; }
  .stat-value { font-family: 'Sora', sans-serif; font-size: 1.3em; font-weight: 700; color: var(--cioos-primary); }
  .stat-label { font-size: 0.8em; color: var(--cioos-navy); opacity: 0.6; }

  .filters { margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .filters label { font-weight: 600; margin-right: 4px; }
  .filter-btn { padding: 5px 12px; border: 1px solid var(--cioos-teal-light); border-radius: 4px; background: var(--cioos-white); cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.85em; }
  .filter-btn:hover { border-color: var(--cioos-primary); }
  .filter-btn.active { background: var(--cioos-primary); color: var(--cioos-white); border-color: var(--cioos-primary); }

  table { width: 100%; border-collapse: collapse; background: var(--cioos-white); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(21,47,55,0.08); }
  th { background: var(--cioos-navy); color: var(--cioos-white); padding: 12px; text-align: left; font-size: 0.85em; position: sticky; top: 0; z-index: 1; }
  th small { font-weight: 400; opacity: 0.7; }
  td { padding: 10px 12px; vertical-align: top; border-bottom: 1px solid var(--cioos-teal-light); font-size: 0.85em; line-height: 1.5; }
  .meta-cell { min-width: 180px; max-width: 220px; }
  .source-cell { max-width: 250px; color: var(--cioos-navy); opacity: 0.6; }
  .missing { color: #999; font-style: italic; }
  .error { color: #A3232F; background: #FDEDEF; }
  .region-label { padding: 2px 6px; border-radius: 3px; background: var(--cioos-teal-light); }

  .row-identical { background: var(--cioos-white); }
  .row-different { background: #FFFBF0; }
  tr.hidden { display: none; }

  .page-footer { background: var(--cioos-navy); color: var(--cioos-white); padding: 20px 32px; margin-top: 32px; text-align: center; font-size: 0.85em; opacity: 0.8; }
</style>
</head>
<body>

<div class="page-header">
  <h1>Translation Run Comparison</h1>
  <div class="subtitle">Comparing: ${runs.map((r) => esc(r.name)).join(" vs ")} &mdash; ${comparisons.length} fields</div>
</div>

<div class="page-content">

<div class="summary">
  <div class="stat"><span class="stat-value">${comparisons.length}</span><span class="stat-label">Total fields</span></div>
  <div class="stat"><span class="stat-value">${identicalCount}</span><span class="stat-label">Identical across runs</span></div>
  <div class="stat"><span class="stat-value">${differCount}</span><span class="stat-label">Different across runs</span></div>
  ${runStats}
</div>

<div class="filters">
  <label>Show:</label>
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn" data-filter="different">Different only</button>
  <button class="filter-btn" data-filter="identical">Identical only</button>
</div>

<table>
<thead><tr>
  <th>Record</th>
  <th>Source</th>
  ${runHeaders}
</tr></thead>
<tbody>
${rows}
</tbody>
</table>

</div>

<div class="page-footer">CIOOS | SIOOC</div>

<script>
document.querySelectorAll('.filter-btn[data-filter]').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.filter-btn[data-filter]').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var filter = btn.dataset.filter;
    document.querySelectorAll('tbody tr').forEach(function(row) {
      if (filter === 'all') { row.classList.remove('hidden'); return; }
      if (filter === 'different') { row.classList.toggle('hidden', row.classList.contains('row-identical')); return; }
      if (filter === 'identical') { row.classList.toggle('hidden', row.classList.contains('row-different')); return; }
    });
  });
});
</script>

</body>
</html>`;
}

// --- Main ---
console.log(`Comparing runs: ${runNames.join(", ")}`);
runs.forEach((r) => {
  const s = computeRunStats(r);
  console.log(`  ${r.name}: ${s.total} entries, ${s.errors} errors (model: ${r.meta.model})`);
});
console.log(`  ${allKeys.size} unique fields across all runs\n`);

const html = generateHtml();
const outputPath = path.join(RESULTS_DIR, `comparison-${runNames.join("-vs-")}.html`);
fs.writeFileSync(outputPath, html);
console.log(`Comparison report saved to: ${outputPath}`);
console.log(`Serve with: npx serve results`);
