const fs = require("fs");
const path = require("path");

// --- CLI args ---
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

function findLatestRun() {
  const resultsDir = path.resolve(__dirname, "results");
  if (!fs.existsSync(resultsDir)) return null;
  const runs = fs.readdirSync(resultsDir)
    .filter((d) => fs.existsSync(path.join(resultsDir, d, "run-meta.json")))
    .map((d) => ({
      name: d,
      meta: JSON.parse(fs.readFileSync(path.join(resultsDir, d, "run-meta.json"), "utf-8")),
    }))
    .sort((a, b) => b.meta.timestamp.localeCompare(a.meta.timestamp));
  return runs.length > 0 ? runs[0].name : null;
}

const runName = getArg("run") || findLatestRun();
if (!runName) {
  console.error("Error: no runs found. Run compare.js first, or specify --run <name>.");
  process.exit(1);
}

const RUN_DIR = path.resolve(__dirname, "results", runName);
const INTERMEDIATE_PATH = path.join(RUN_DIR, "intermediate.json");
const REPORT_PATH = path.join(RUN_DIR, "index.html");
const RUN_META_PATH = path.join(RUN_DIR, "run-meta.json");

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function computeStats(entries) {
  const total = entries.length;
  const titleCount = entries.filter((e) => e.field === "title").length;
  const abstractCount = entries.filter((e) => e.field === "abstract").length;
  const enToFr = entries.filter((e) => e.targetLang === "fr").length;
  const frToEn = entries.filter((e) => e.targetLang === "en").length;
  const identical = entries.filter(
    (e) =>
      e.cohereTranslation &&
      !e.cohereTranslation.startsWith("[ERROR:") &&
      e.awsTranslation.trim() === e.cohereTranslation.trim()
  ).length;
  const errors = entries.filter((e) =>
    e.cohereTranslation?.startsWith("[ERROR:")
  ).length;
  const verified = entries.filter((e) => e.verified).length;

  return { total, titleCount, abstractCount, enToFr, frToEn, identical, different: total - identical - errors, errors, verified };
}

function groupByRecord(entries) {
  const grouped = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.id)) {
      grouped.set(entry.id, {
        id: entry.id,
        region: entry.region,
        recordId: entry.recordId,
        displayTitle: entry.displayTitle,
        fields: [],
      });
    }
    grouped.get(entry.id).fields.push(entry);
  }
  return Array.from(grouped.values());
}

function generateHtml(entries, runMeta, promptContent) {
  const stats = computeStats(entries);
  const records = groupByRecord(entries);
  const regions = [...new Set(entries.map((e) => e.region))].sort();
  const promptLabel = runMeta.promptTemplateCopy || "Prompt";
  const promptBase64 = Buffer.from(
    promptContent || "Prompt snapshot not available for this run.",
    "utf-8"
  ).toString("base64");
  const serializedPromptBase64 = JSON.stringify(promptBase64)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const promptSummary = runMeta.promptHash
    ? `Prompt hash ${escapeHtml(runMeta.promptHash)}`
    : "Prompt snapshot";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AWS vs Cohere Translation Comparison | CIOOS</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&family=Sora:wght@600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --cioos-navy: #152F37;
    --cioos-primary: #52A79B;
    --cioos-teal-light: #C6E3DF;
    --cioos-sand: #F3F0EC;
    --cioos-white: #FFFFFF;
    --cioos-atlantic: #E25563;
    --cioos-pacific: #0F6D8E;
    --cioos-slgo: #1DACEA;
  }

  html, body { width: 100%; max-width: none; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Montserrat', sans-serif; font-size: 16px; background: var(--cioos-sand); color: var(--cioos-navy); padding: 0; margin: 0; }
  body, main, .container, .container-sm, .container-md, .container-lg, .container-xl, .content, .content-wrapper, .page, .page-wrapper, .wrapper, .inner {
    width: 100% !important;
    max-width: none !important;
  }
  h1, h2, h3, h4 { font-family: 'Sora', sans-serif; color: var(--cioos-navy); }

  .page-shell { width: 100%; max-width: none; margin: 0; }
  .page-header { background: var(--cioos-navy); color: var(--cioos-white); padding: 24px 32px; margin-bottom: 24px; }
  .header-bar { display: flex; gap: 16px; align-items: flex-start; justify-content: space-between; }
  .header-copy { min-width: 0; }
  .page-header h1 { color: var(--cioos-white); font-size: 1.75rem; font-weight: 700; margin: 0; }
  .page-header .subtitle { color: var(--cioos-teal-light); font-size: 0.9rem; margin-top: 4px; font-weight: 400; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
  .prompt-toggle {
    background: var(--cioos-white);
    color: var(--cioos-navy);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 4px;
    padding: 10px 16px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  .prompt-toggle:hover { background: var(--cioos-teal-light); }

  .page-content { width: 100%; max-width: none; padding: 0 32px 32px; margin: 0; }

  .summary { background: var(--cioos-white); border-radius: 8px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(21,47,55,0.08); border: 1px solid var(--cioos-teal-light); display: flex; flex-wrap: wrap; gap: 16px 32px; }
  .stat { display: flex; flex-direction: column; }
  .stat-value { font-family: 'Sora', sans-serif; font-size: 1.5em; font-weight: 700; color: var(--cioos-primary); }
  .stat-label { font-size: 0.85em; color: var(--cioos-navy); opacity: 0.6; font-weight: 500; }

  .filters { margin-bottom: 24px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .filters label { font-weight: 600; margin-right: 4px; color: var(--cioos-navy); }
  .filter-btn { padding: 6px 16px; border: 1px solid var(--cioos-teal-light); border-radius: 4px; background: var(--cioos-white); cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.9em; font-weight: 500; color: var(--cioos-navy); transition: all 0.15s; }
  .filter-btn:hover { border-color: var(--cioos-primary); color: var(--cioos-primary); }
  .filter-btn.active { background: var(--cioos-primary); color: var(--cioos-white); border-color: var(--cioos-primary); }
  .filter-separator { width: 1px; height: 24px; background: var(--cioos-teal-light); margin: 0 8px; }

  .record-card { background: var(--cioos-white); border-radius: 8px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(21,47,55,0.08); border: 1px solid var(--cioos-teal-light); overflow: hidden; }
  .record-header { display: flex; align-items: center; gap: 12px; padding: 16px 24px; background: var(--cioos-navy); flex-wrap: wrap; }
  .record-title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 0.95em; flex: 1; min-width: 200px; color: var(--cioos-white); }
  .record-id { font-family: 'Courier New', monospace; font-size: 0.8em; color: var(--cioos-teal-light); }

  .region-badge { padding: 4px 12px; border-radius: 4px; font-size: 0.8em; font-weight: 600; color: var(--cioos-white); }
  .region-atlantic { background: var(--cioos-atlantic); }
  .region-pacific, .region-hakai, .region-iys { background: var(--cioos-pacific); }
  .region-stlaurent { background: var(--cioos-slgo); }
  .region-amundsen, .region-canwin { background: var(--cioos-primary); }
  ${regions.map((r) => {
    // Only generate fallback for regions not already covered above
    const known = ['atlantic','pacific','hakai','iys','stlaurent','amundsen','canwin'];
    if (known.includes(r)) return '';
    return `.region-${r} { background: var(--cioos-primary); }`;
  }).filter(Boolean).join("\n  ")}

  .field-comparison { padding: 16px 24px; border-top: 1px solid var(--cioos-teal-light); width: 100%; }
  .field-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .field-header h3 { font-size: 0.95em; color: var(--cioos-navy); font-weight: 600; }

  .diff-badge { padding: 4px 12px; border-radius: 4px; font-size: 0.75em; font-weight: 600; }
  .diff-identical { background: var(--cioos-teal-light); color: var(--cioos-navy); }
  .diff-different { background: #FFF0E0; color: #B45300; }
  .diff-error { background: #FDEDEF; color: #A3232F; }
  .verified-badge { padding: 4px 10px; border-radius: 4px; font-size: 0.75em; font-weight: 600; background: var(--cioos-teal-light); color: var(--cioos-navy); }
  .unverified-badge { padding: 4px 10px; border-radius: 4px; font-size: 0.75em; font-weight: 500; background: var(--cioos-sand); color: var(--cioos-navy); opacity: 0.5; }
  .truncated-badge { padding: 4px 10px; border-radius: 4px; font-size: 0.75em; font-weight: 600; background: #FFF6D6; color: #8A6D00; }

  .comparison-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .comparison-table th, .comparison-table td { width: 33.33%; }
  .comparison-table th { text-align: left; padding: 12px 16px; font-size: 0.85em; font-weight: 600; color: var(--cioos-navy); background: var(--cioos-sand); border-bottom: 2px solid var(--cioos-teal-light); }
  .comparison-table td { padding: 12px 16px; vertical-align: top; font-size: 0.9em; line-height: 1.7; word-wrap: break-word; border-bottom: 1px solid var(--cioos-teal-light); }
  .source-cell { color: var(--cioos-navy); opacity: 0.7; }

  .diff-highlight-aws { background: #FFF6D6; padding: 1px 3px; border-radius: 2px; }
  .diff-highlight-cohere { background: var(--cioos-teal-light); padding: 1px 3px; border-radius: 2px; }

  .pagination { display: flex; align-items: center; gap: 8px; margin: 24px 0; justify-content: center; flex-wrap: wrap; }
  .pagination button { padding: 8px 16px; border: 1px solid var(--cioos-teal-light); border-radius: 4px; background: var(--cioos-white); cursor: pointer; font-family: 'Montserrat', sans-serif; font-size: 0.9em; font-weight: 500; color: var(--cioos-navy); }
  .pagination button:hover:not(:disabled) { border-color: var(--cioos-primary); color: var(--cioos-primary); }
  .pagination button:disabled { opacity: 0.4; cursor: default; }
  .pagination .page-info { font-size: 0.9em; color: var(--cioos-navy); opacity: 0.6; }

  .page-footer { background: var(--cioos-navy); color: var(--cioos-white); padding: 24px 32px; margin-top: 32px; text-align: center; font-size: 0.85em; opacity: 0.8; }

  .prompt-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(21, 47, 55, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 20;
  }
  .prompt-sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: min(44rem, 92vw);
    height: 100vh;
    background: var(--cioos-white);
    border-left: 1px solid var(--cioos-teal-light);
    box-shadow: -12px 0 36px rgba(21,47,55,0.18);
    transform: translateX(100%);
    transition: transform 0.24s ease;
    z-index: 30;
    display: flex;
    flex-direction: column;
  }
  .prompt-sidebar.is-open { transform: translateX(0); }
  .prompt-backdrop.is-open {
    opacity: 1;
    pointer-events: auto;
  }
  .prompt-sidebar-header {
    padding: 24px 24px 16px;
    border-bottom: 1px solid var(--cioos-teal-light);
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }
  .prompt-sidebar-title { font-size: 1.1rem; }
  .prompt-sidebar-subtitle { color: var(--cioos-primary); font-size: 0.85rem; margin-top: 6px; font-weight: 600; }
  .prompt-close {
    border: 1px solid var(--cioos-teal-light);
    background: var(--cioos-white);
    color: var(--cioos-navy);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .prompt-close:hover { background: var(--cioos-sand); }
  .prompt-sidebar-body {
    padding: 24px;
    overflow: auto;
    background: linear-gradient(180deg, var(--cioos-white) 0%, var(--cioos-sand) 100%);
  }
  .prompt-code {
    margin: 0;
    padding: 20px;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: 'Courier New', monospace;
    font-size: 0.88rem;
    line-height: 1.65;
    color: var(--cioos-navy);
    background: var(--cioos-white);
    border: 1px solid var(--cioos-teal-light);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(21,47,55,0.08);
  }

  body.prompt-open { overflow: hidden; }

  @media (max-width: 768px) {
    .page-header { padding: 20px 20px; }
    .page-content { padding: 0 20px 24px; }
    .header-bar { flex-direction: column; }
    .header-actions { width: 100%; }
    .prompt-toggle { width: 100%; }
    .prompt-sidebar { width: 100vw; }
  }

  .hidden { display: none !important; }
</style>
</head>
<body>

<div class="page-shell">

<div class="page-header">
  <div class="header-bar">
    <div class="header-copy">
      <h1>AWS vs Cohere Translation Comparison</h1>
      <div class="subtitle">CIOOS | SIOOC &mdash; Metadata Translation Quality Review</div>
    </div>
    <div class="header-actions">
      <button id="prompt-toggle" class="prompt-toggle" type="button">View Prompt</button>
    </div>
  </div>
</div>

<div id="prompt-backdrop" class="prompt-backdrop"></div>
<aside id="prompt-sidebar" class="prompt-sidebar" aria-hidden="true">
  <div class="prompt-sidebar-header">
    <div>
      <h2 class="prompt-sidebar-title">Translation Prompt</h2>
      <div class="prompt-sidebar-subtitle">${promptSummary} · ${escapeHtml(promptLabel)}</div>
    </div>
    <button id="prompt-close" class="prompt-close" type="button">Close</button>
  </div>
  <div class="prompt-sidebar-body">
    <pre id="prompt-code" class="prompt-code"></pre>
  </div>
</aside>

<div class="page-content">

<div class="summary">
  <div class="stat"><span class="stat-value">${stats.total}</span><span class="stat-label">Fields compared</span></div>
  <div class="stat"><span class="stat-value">${stats.titleCount}</span><span class="stat-label">Titles</span></div>
  <div class="stat"><span class="stat-value">${stats.abstractCount}</span><span class="stat-label">Abstracts</span></div>
  <div class="stat"><span class="stat-value">${stats.enToFr}</span><span class="stat-label">EN &rarr; FR</span></div>
  <div class="stat"><span class="stat-value">${stats.frToEn}</span><span class="stat-label">FR &rarr; EN</span></div>
  <div class="stat"><span class="stat-value">${stats.identical}</span><span class="stat-label">Identical</span></div>
  <div class="stat"><span class="stat-value">${stats.different}</span><span class="stat-label">Different</span></div>
  <div class="stat"><span class="stat-value">${stats.errors}</span><span class="stat-label">Errors</span></div>
  <div class="stat"><span class="stat-value">${stats.verified}</span><span class="stat-label">Verified</span></div>
</div>

<div class="filters">
  <label>Show:</label>
  <button class="filter-btn active" data-filter="all">All</button>
  <button class="filter-btn" data-filter="title">Title only</button>
  <button class="filter-btn" data-filter="abstract">Abstract only</button>
  <div class="filter-separator"></div>
  <button class="filter-btn" data-filter="different">Different only</button>
  <button class="filter-btn" data-filter="identical">Identical only</button>
  <div class="filter-separator"></div>
  <label>Direction:</label>
  <button class="filter-btn active" data-direction="all">All</button>
  <button class="filter-btn" data-direction="en2fr">EN &rarr; FR</button>
  <button class="filter-btn" data-direction="fr2en">FR &rarr; EN</button>
  <div class="filter-separator"></div>
  <label>Region:</label>
  <button class="filter-btn active" data-region="all">All</button>
  ${regions.map((r) => `<button class="filter-btn" data-region="${r}">${r}</button>`).join("\n  ")}
</div>

<div id="pagination-top" class="pagination"></div>
<div id="records"><p style="padding:40px;text-align:center;color:#888;">Loading data...</p></div>
<div id="pagination-bottom" class="pagination"></div>

<script>
(function() {
  var promptBase64 = ${serializedPromptBase64};
  var PAGE_SIZE = 25;
  var currentPage = 0;
  var activeFilter = 'all';
  var activeRegion = 'all';
  var activeDirection = 'all';
  var DATA = [];
  var filtered = [];

  function esc(s) {
    if (!s) return '';
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  function isIdentical(f) {
    return f.awsTranslation && f.cohereTranslation &&
      !f.cohereTranslation.startsWith('[ERROR:') &&
      f.awsTranslation.trim() === f.cohereTranslation.trim();
  }

  function isError(f) {
    return f.cohereTranslation && f.cohereTranslation.startsWith('[ERROR:');
  }

  function fieldMatchesDirection(f) {
    if (activeDirection === 'all') return true;
    if (activeDirection === 'en2fr') return f.targetLang === 'fr';
    if (activeDirection === 'fr2en') return f.targetLang === 'en';
    return true;
  }

  function matchesFilter(record) {
    if (activeRegion !== 'all' && record.region !== activeRegion) return false;
    return record.fields.some(function(f) {
      if (!fieldMatchesDirection(f)) return false;
      if (activeFilter === 'all') return true;
      if (activeFilter === 'title' && f.field !== 'title') return false;
      if (activeFilter === 'abstract' && f.field !== 'abstract') return false;
      if (activeFilter === 'different' && isIdentical(f)) return false;
      if (activeFilter === 'identical' && !isIdentical(f)) return false;
      return true;
    });
  }

  function filterFields(fields) {
    return fields.filter(function(f) {
      if (!fieldMatchesDirection(f)) return false;
      if (activeFilter === 'title' && f.field !== 'title') return false;
      if (activeFilter === 'abstract' && f.field !== 'abstract') return false;
      if (activeFilter === 'different' && isIdentical(f)) return false;
      if (activeFilter === 'identical' && !isIdentical(f)) return false;
      return true;
    });
  }

  // --- Word-level diff ---
  function wordDiff(textA, textB) {
    var wordsA = textA.split(/\\s+/);
    var wordsB = textB.split(/\\s+/);
    var m = wordsA.length, n = wordsB.length;

    // For very long texts, skip diff to avoid freezing
    if (m * n > 500000) return null;

    var dp = [];
    for (var i = 0; i <= m; i++) { dp[i] = new Array(n + 1).fill(0); }
    for (var i = 1; i <= m; i++) {
      for (var j = 1; j <= n; j++) {
        dp[i][j] = wordsA[i-1] === wordsB[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    var commonA = new Set(), commonB = new Set();
    var i = m, j = n;
    while (i > 0 && j > 0) {
      if (wordsA[i-1] === wordsB[j-1]) { commonA.add(i-1); commonB.add(j-1); i--; j--; }
      else if (dp[i-1][j] > dp[i][j-1]) i--;
      else j--;
    }
    return {
      a: wordsA.map(function(w, idx) { return commonA.has(idx) ? esc(w) : '<span class="diff-highlight-aws">' + esc(w) + '</span>'; }).join(' '),
      b: wordsB.map(function(w, idx) { return commonB.has(idx) ? esc(w) : '<span class="diff-highlight-cohere">' + esc(w) + '</span>'; }).join(' ')
    };
  }

  function renderField(f) {
    var srcLabel = f.sourceLang === 'en' ? 'English' : 'French';
    var tgtLabel = f.targetLang === 'en' ? 'English' : 'French';
    var identical = isIdentical(f);
    var error = isError(f);
    var diffClass = error ? 'diff-error' : identical ? 'diff-identical' : 'diff-different';
    var diffLabel = error ? 'Error' : identical ? 'Identical' : 'Different';
    var truncNote = f.truncated ? ' <span class="truncated-badge">truncated</span>' : '';
    var verifiedBadge = f.verified ? '<span class="verified-badge">verified</span>' : '<span class="unverified-badge">unverified</span>';

    var awsHtml = esc(f.awsTranslation);
    var cohereHtml = esc(f.cohereTranslation || 'N/A');

    if (!identical && !error && f.awsTranslation && f.cohereTranslation) {
      var diff = wordDiff(f.awsTranslation, f.cohereTranslation);
      if (diff) {
        awsHtml = diff.a;
        cohereHtml = diff.b;
      }
    }

    return '<div class="field-comparison">' +
      '<div class="field-header">' +
        '<h3>' + f.field.charAt(0).toUpperCase() + f.field.slice(1) + ' (' + srcLabel + ' &rarr; ' + tgtLabel + ')</h3>' +
        '<span class="diff-badge ' + diffClass + '">' + diffLabel + '</span> ' +
        verifiedBadge + truncNote +
      '</div>' +
      '<table class="comparison-table"><thead><tr>' +
        '<th>Source (' + srcLabel + ')</th><th>AWS Translation</th><th>Cohere Translation</th>' +
      '</tr></thead><tbody><tr>' +
        '<td class="source-cell">' + esc(f.sourceText) + '</td>' +
        '<td class="aws-cell">' + awsHtml + '</td>' +
        '<td class="cohere-cell">' + cohereHtml + '</td>' +
      '</tr></tbody></table></div>';
  }

  function renderRecord(rec) {
    var fields = filterFields(rec.fields);
    return '<div class="record-card">' +
      '<div class="record-header">' +
        '<span class="region-badge region-' + rec.region + '">' + esc(rec.region) + '</span>' +
        '<span class="record-title">' + esc(rec.displayTitle) + '</span>' +
        '<span class="record-id">' + esc(rec.recordId) + '</span>' +
      '</div>' +
      fields.map(renderField).join('') +
    '</div>';
  }

  function applyFilters() {
    filtered = DATA.filter(matchesFilter);
    currentPage = 0;
    renderPage();
  }

  function renderPagination(container) {
    var totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
    var html = '<button id="prev-' + container.id + '" ' + (currentPage === 0 ? 'disabled' : '') + '>&laquo; Prev</button>';
    html += '<span class="page-info">Page ' + (currentPage + 1) + ' of ' + totalPages + ' (' + filtered.length + ' records)</span>';
    html += '<button id="next-' + container.id + '" ' + (currentPage >= totalPages - 1 ? 'disabled' : '') + '>Next &raquo;</button>';
    container.innerHTML = html;

    document.getElementById('prev-' + container.id).addEventListener('click', function() {
      if (currentPage > 0) { currentPage--; renderPage(); window.scrollTo(0, 0); }
    });
    document.getElementById('next-' + container.id).addEventListener('click', function() {
      if (currentPage < totalPages - 1) { currentPage++; renderPage(); window.scrollTo(0, 0); }
    });
  }

  function renderPage() {
    var start = currentPage * PAGE_SIZE;
    var page = filtered.slice(start, start + PAGE_SIZE);
    document.getElementById('records').innerHTML = page.map(renderRecord).join('');
    renderPagination(document.getElementById('pagination-top'));
    renderPagination(document.getElementById('pagination-bottom'));
  }

  // --- Filter buttons ---
  document.querySelectorAll('.filter-btn[data-filter]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilters();
    });
  });

  document.querySelectorAll('.filter-btn[data-region]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn[data-region]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeRegion = btn.dataset.region;
      applyFilters();
    });
  });

  document.querySelectorAll('.filter-btn[data-direction]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn[data-direction]').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      activeDirection = btn.dataset.direction;
      applyFilters();
    });
  });

  var promptToggle = document.getElementById('prompt-toggle');
  var promptClose = document.getElementById('prompt-close');
  var promptSidebar = document.getElementById('prompt-sidebar');
  var promptBackdrop = document.getElementById('prompt-backdrop');
  var promptCode = document.getElementById('prompt-code');

  function decodeBase64Utf8(value) {
    var binary = atob(value);
    var bytes = Uint8Array.from(binary, function(char) {
      return char.charCodeAt(0);
    });
    return new TextDecoder('utf-8').decode(bytes);
  }

  promptCode.textContent = decodeBase64Utf8(promptBase64);

  function setPromptOpen(isOpen) {
    promptSidebar.classList.toggle('is-open', isOpen);
    promptBackdrop.classList.toggle('is-open', isOpen);
    promptSidebar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    document.body.classList.toggle('prompt-open', isOpen);
  }

  promptToggle.addEventListener('click', function() {
    setPromptOpen(true);
  });

  promptClose.addEventListener('click', function() {
    setPromptOpen(false);
  });

  promptBackdrop.addEventListener('click', function() {
    setPromptOpen(false);
  });

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      setPromptOpen(false);
    }
  });

  // Load data from separate file, then render
  fetch('data.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      DATA = data;
      filtered = DATA;
      applyFilters();
    })
    .catch(function(err) {
      document.getElementById('records').innerHTML =
        '<p style="padding:40px;text-align:center;color:#c62828;">Failed to load data.json. Make sure you are serving the results/ directory (npx serve results).</p>';
    });
})();
</script>

</div><!-- .page-content -->

<div class="page-footer">CIOOS | SIOOC</div>

</div>

</body>
</html>`;
}

// --- Main ---
function main() {
  if (!fs.existsSync(INTERMEDIATE_PATH)) {
    console.error(`Error: ${INTERMEDIATE_PATH} not found. Run compare.js first.`);
    process.exit(1);
  }

  const runMeta = fs.existsSync(RUN_META_PATH)
    ? JSON.parse(fs.readFileSync(RUN_META_PATH, "utf-8"))
    : {};
  const promptPath = runMeta.promptTemplateCopy
    ? path.join(RUN_DIR, runMeta.promptTemplateCopy)
    : null;
  const promptSourcePath = runMeta.promptTemplate || null;
  const promptContent = promptPath && fs.existsSync(promptPath)
    ? fs.readFileSync(promptPath, "utf-8")
    : promptSourcePath && fs.existsSync(promptSourcePath)
      ? fs.readFileSync(promptSourcePath, "utf-8")
      : "Prompt snapshot not available for this run.";

  console.log(`Run: ${runName}`);
  console.log("Loading comparison data...");
  const entries = JSON.parse(fs.readFileSync(INTERMEDIATE_PATH, "utf-8"));
  console.log(`Loaded ${entries.length} entries`);

  const records = groupByRecord(entries);

  // Write data as separate JSON file so the HTML stays small
  const DATA_PATH = path.join(RUN_DIR, "data.json");
  fs.writeFileSync(DATA_PATH, JSON.stringify(records));
  console.log(`Data written to: ${DATA_PATH} (${(fs.statSync(DATA_PATH).size / 1024 / 1024).toFixed(1)}MB)`);

  console.log("Generating HTML report...");
  const html = generateHtml(entries, runMeta, promptContent);
  fs.writeFileSync(REPORT_PATH, html);
  console.log(`Report saved to: ${REPORT_PATH}`);
}

main();
