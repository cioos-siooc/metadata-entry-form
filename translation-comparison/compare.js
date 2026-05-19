const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { CohereClientV2 } = require("cohere-ai");

// --- CLI args ---
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const isProduction = process.argv.includes("--production");
const MODEL = "command-a-03-2025";

const EXPORT_PATH = path.resolve(
  __dirname,
  "../cioos-metadata-form-dev-258dc-default-rtdb-export (2).json"
);
const PROMPT_TEMPLATE_PATH = path.resolve(
  __dirname,
  "../firebase-functions/functions/translation-prompt-template.txt"
);

// Prompt template with glossary already baked in (synced from cioos-commons)
const promptTemplate = fs.readFileSync(PROMPT_TEMPLATE_PATH, "utf-8");

// Generate run name from model + prompt hash
const promptHash = crypto.createHash("sha1").update(promptTemplate).digest("hex").slice(0, 7);
const runName = getArg("run") || `${MODEL}-${promptHash}`;

// Per-run output directory
const RUN_DIR = path.resolve(__dirname, "results", runName);
const INTERMEDIATE_PATH = path.join(RUN_DIR, "intermediate.json");
const TEXT_CACHE_PATH = path.join(RUN_DIR, "text-cache.json");
const RUN_META_PATH = path.join(RUN_DIR, "run-meta.json");
const PROMPT_SNAPSHOT_PATH = path.join(RUN_DIR, "prompt-template.txt");

const MAX_TRANSLATE_SIZE = 5000;
const SAVE_EVERY = 10;
const CONCURRENCY = isProduction ? 10 : 3;
const MAX_REQUESTS_PER_MIN = isProduction ? 450 : 18;

// --- Cohere setup ---

const client = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
  clientName: "cioos-translation-comparison",
});

async function translateWithCohere(text, sourceLang, targetLang) {
  const sourceName = sourceLang === "en" ? "Canadian English" : "Canadian French";
  const targetName = targetLang === "en" ? "Canadian English" : "Canadian French";

  let truncated = false;
  let input = text;
  if (input.length > MAX_TRANSLATE_SIZE) {
    input = input.slice(0, MAX_TRANSLATE_SIZE);
    truncated = true;
  }

  const prompt = promptTemplate
    .replace("{{sourceLang}}", sourceName)
    .replace("{{targetLang}}", targetName)
    .replace("{{originalText}}", input);

  const response = await client.chat({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  if (
    response.message &&
    response.message.content &&
    response.message.content.length > 0
  ) {
    return { text: response.message.content[0].text, truncated };
  }
  throw new Error("No translation received from Cohere API");
}

// --- Data extraction ---

const FIELDS_TO_COMPARE = ["title", "abstract"];

// Skip known non-region keys at the top level
const SKIP_TOP_LEVEL = new Set(["admin", "organizations", "test"]);

function extractTranslatedFields(data) {
  const entries = [];

  for (const [region, regionData] of Object.entries(data)) {
    if (SKIP_TOP_LEVEL.has(region)) continue;
    if (!regionData?.users) continue;

    for (const [userId, userData] of Object.entries(regionData.users)) {
      if (!userData?.records) continue;

      for (const [recordId, record] of Object.entries(userData.records)) {
        for (const field of FIELDS_TO_COMPARE) {
          const fieldData = record[field];
          if (!fieldData || !fieldData.translations) continue;

          for (const [targetLang, translationMeta] of Object.entries(
            fieldData.translations
          )) {
            // Only include AWS translations
            if (
              !translationMeta?.message ||
              !translationMeta.message.toLowerCase().includes("amazon")
            ) {
              continue;
            }

            const sourceLang = targetLang === "fr" ? "en" : "fr";
            const sourceText = fieldData[sourceLang];
            const awsTranslation = fieldData[targetLang];

            if (!sourceText || !awsTranslation) continue;

            const displayTitle =
              record.title?.en || record.title?.fr || recordId;

            entries.push({
              id: `${region}/${userId}/${recordId}`,
              region,
              recordId,
              displayTitle,
              field,
              sourceLang,
              targetLang,
              sourceText,
              awsTranslation,
              verified: translationMeta.verified || false,
            });
          }
        }
      }
    }
  }

  return entries;
}

// --- Main comparison runner ---

function textCacheKey(sourceLang, targetLang, text) {
  const hash = crypto.createHash("sha1").update(text).digest("hex");
  return `${sourceLang}:${targetLang}:${hash}`;
}

function loadTextCache() {
  if (fs.existsSync(TEXT_CACHE_PATH)) {
    return new Map(Object.entries(JSON.parse(fs.readFileSync(TEXT_CACHE_PATH, "utf-8"))));
  }
  return new Map();
}

function saveTextCache(textCache) {
  fs.writeFileSync(TEXT_CACHE_PATH, JSON.stringify(Object.fromEntries(textCache), null, 2));
}

function loadCache() {
  if (fs.existsSync(INTERMEDIATE_PATH)) {
    return JSON.parse(fs.readFileSync(INTERMEDIATE_PATH, "utf-8"));
  }
  return [];
}

function saveCache(results) {
  fs.writeFileSync(INTERMEDIATE_PATH, JSON.stringify(results, null, 2));
}

function buildCacheIndex(cached) {
  const index = new Map();
  for (const entry of cached) {
    index.set(`${entry.id}:${entry.field}:${entry.targetLang}`, entry);
  }
  return index;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sliding-window rate limiter with auto-throttle on 429s
class RateLimiter {
  constructor(maxPerMinute) {
    this.maxPerMinute = maxPerMinute;
    this.timestamps = [];
  }

  throttle() {
    const prev = this.maxPerMinute;
    this.maxPerMinute = Math.max(5, Math.floor(this.maxPerMinute * 0.6));
    process.stdout.write(`\n  THROTTLE: rate limit hit, reducing from ${prev} to ${this.maxPerMinute} req/min\n`);
  }

  async acquire() {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 60000);

    if (this.timestamps.length >= this.maxPerMinute) {
      const waitUntil = this.timestamps[0] + 60000;
      const waitMs = waitUntil - now;
      if (waitMs > 0) {
        await sleep(waitMs);
      }
      return this.acquire();
    }

    this.timestamps.push(Date.now());
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m${s.toString().padStart(2, "0")}s`;
}

function drawProgressBar(current, total, startTime, errors) {
  const pct = total === 0 ? 100 : Math.round((current / total) * 100);
  const barWidth = 30;
  const filled = Math.round((pct / 100) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  const elapsed = (Date.now() - startTime) / 1000;
  let eta = "";
  if (current > 0 && current < total) {
    const remaining = (elapsed / current) * (total - current);
    eta = ` ETA ${formatTime(remaining)}`;
  }

  const errStr = errors > 0 ? ` ${errors} err` : "";
  const line = `\r  ${bar} ${pct}% (${current}/${total})${eta}${errStr}  `;
  process.stdout.write(line);
}

async function runComparison() {
  if (!process.env.COHERE_API_KEY) {
    console.error("Error: COHERE_API_KEY environment variable is required");
    process.exit(1);
  }

  // Create run directory
  fs.mkdirSync(RUN_DIR, { recursive: true });
  fs.writeFileSync(PROMPT_SNAPSHOT_PATH, promptTemplate);

  console.log(`Run: ${runName}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${RUN_DIR}\n`);

  console.log("Loading Firebase export...");
  const data = JSON.parse(fs.readFileSync(EXPORT_PATH, "utf-8"));

  console.log("Extracting translated fields...");
  const entries = extractTranslatedFields(data);
  console.log(`Found ${entries.length} translated fields to compare`);

  const cached = loadCache();
  const cacheIndex = buildCacheIndex(cached);
  console.log(`Cache has ${cached.length} existing entries`);

  const textCache = loadTextCache();
  console.log(`Text cache has ${textCache.size} unique translations`);

  const results = [...cached];
  let newCount = 0;
  let errorCount = 0;

  // Count how many actually need translating
  const toTranslate = entries.filter((entry) => {
    const key = `${entry.id}:${entry.field}:${entry.targetLang}`;
    const existing = cacheIndex.get(key);
    return !existing || existing.cohereTranslation?.startsWith("[ERROR:");
  });

  if (toTranslate.length === 0) {
    console.log("All fields already cached, nothing to translate.");
  } else {
    const tier = isProduction ? "production" : "trial";
    console.log(`Translating ${toTranslate.length} fields (${tier} tier: ${CONCURRENCY} concurrent, ${MAX_REQUESTS_PER_MIN} req/min)...`);
    console.log(`Tip: use --production flag if you have a production API key.\n`);
    const startTime = Date.now();
    let completed = 0;
    let lastSaveAt = 0;
    const limiter = new RateLimiter(MAX_REQUESTS_PER_MIN);
    drawProgressBar(0, toTranslate.length, startTime, 0);

    // Worker pool: each worker pulls from a shared queue
    let nextIdx = 0;

    async function worker() {
      while (nextIdx < toTranslate.length) {
        const idx = nextIdx++;
        const entry = toTranslate[idx];
        const key = `${entry.id}:${entry.field}:${entry.targetLang}`;
        const existing = cacheIndex.get(key);
        const MAX_RETRIES = 3;
        let success = false;

        const textKey = textCacheKey(entry.sourceLang, entry.targetLang, entry.sourceText);
        if (textCache.has(textKey)) {
          const cached = textCache.get(textKey);
          const completeEntry = { ...entry, cohereTranslation: cached.text, truncated: cached.truncated, model: cached.model || MODEL };
          if (existing) {
            results[results.indexOf(existing)] = completeEntry;
          } else {
            results.push(completeEntry);
          }
          cacheIndex.set(key, completeEntry);
          newCount++;
          success = true;
        }

        for (let attempt = 0; !success && attempt <= MAX_RETRIES; attempt++) {
          await limiter.acquire();

          try {
            const result = await translateWithCohere(
              entry.sourceText,
              entry.sourceLang,
              entry.targetLang
            );

            const completeEntry = {
              ...entry,
              cohereTranslation: result.text,
              truncated: result.truncated,
              model: MODEL,
            };

            if (existing) {
              const i = results.indexOf(existing);
              results[i] = completeEntry;
            } else {
              results.push(completeEntry);
            }
            cacheIndex.set(key, completeEntry);
            textCache.set(textKey, { text: result.text, truncated: result.truncated, model: MODEL });
            saveTextCache(textCache);
            newCount++;
            success = true;
            break;
          } catch (err) {
            const statusCode = err.statusCode || err.status || err.response?.status;
            const is429 = statusCode === 429 ||
              (err.message && err.message.includes("429")) ||
              (err.message && /rate.?limit/i.test(err.message)) ||
              (err.message && /too many requests/i.test(err.message));

            process.stdout.write(`\n  [attempt ${attempt + 1}] ${is429 ? "RATE LIMIT" : "ERROR"} (status=${statusCode ?? "n/a"}): ${err.message}\n`);

            if (is429 && attempt < MAX_RETRIES) {
              limiter.throttle();
              const backoff = 60000;
              process.stdout.write(`  Waiting 60s before retry...\n`);
              await sleep(backoff);
              continue;
            }

            errorCount++;
            process.stdout.write(`\n  ERROR [${entry.field}] ${entry.id}: ${err.message}\n`);
            const errorEntry = {
              ...entry,
              cohereTranslation: `[ERROR: ${err.message}]`,
              truncated: false,
              model: MODEL,
            };

            if (existing) {
              const i = results.indexOf(existing);
              results[i] = errorEntry;
            } else {
              results.push(errorEntry);
            }
            cacheIndex.set(key, errorEntry);
            break;
          }
        }

        completed++;
        drawProgressBar(completed, toTranslate.length, startTime, errorCount);

        // Periodic save
        if (completed - lastSaveAt >= SAVE_EVERY) {
          lastSaveAt = completed;
          saveCache(results);
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);

    process.stdout.write("\n\n");
  }

  saveCache(results);

  // Write run metadata
  const runMeta = {
    name: runName,
    model: MODEL,
    promptTemplate: PROMPT_TEMPLATE_PATH,
    promptTemplateCopy: path.basename(PROMPT_SNAPSHOT_PATH),
    promptHash,
    timestamp: new Date().toISOString(),
    total: results.length,
    errors: errorCount,
    newTranslations: newCount,
  };
  fs.writeFileSync(RUN_META_PATH, JSON.stringify(runMeta, null, 2) + "\n");

  console.log("Done!");
  console.log(`  Run: ${runName}`);
  console.log(`  Total entries: ${results.length}`);
  console.log(`  New translations: ${newCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Results saved to: ${RUN_DIR}`);
  console.log(`\nRun 'node report.js --run ${runName}' to generate the HTML report.`);
}

runComparison().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
