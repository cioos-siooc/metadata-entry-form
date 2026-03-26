#!/usr/bin/env node

/**
 * Pre-deploy script that fetches translation assets from the cioos-commons
 * GitHub repository and generates a translation-meta.json with version
 * provenance info.
 *
 * By default fetches from the main branch HEAD. Pass a commit SHA or tag
 * as the first argument to pin a specific version:
 *
 *   node generate-translation-config.js              # latest main
 *   node generate-translation-config.js abc1234      # specific commit
 *   node generate-translation-config.js v1.2.0       # specific tag
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const REPO = "cioos-siooc/cioos-commons";
const BASE_PATH = "translation/cohere/default";
// Only need the rendered prompt template (glossary is already baked in by cioos-commons CI)
const FILES = ["prompt-template.txt"];

const FUNCTIONS_DIR = __dirname;
const PROMPT_DEST = path.join(FUNCTIONS_DIR, "translation-prompt-template.txt");
const META_DEST = path.join(FUNCTIONS_DIR, "translation-meta.json");

const DEST_MAP = {
  "prompt-template.txt": PROMPT_DEST,
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "cioos-metadata-entry-form" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function getCommitSha(ref) {
  const url = `https://api.github.com/repos/${REPO}/commits/${ref}`;
  const body = await fetchUrl(url);
  const data = JSON.parse(body);
  return data.sha.substring(0, 7);
}

async function fetchFile(ref, filePath) {
  const url = `https://raw.githubusercontent.com/${REPO}/${ref}/${filePath}`;
  return fetchUrl(url);
}

async function main() {
  const ref = process.argv[2] || "main";

  console.log(`Fetching translation assets from ${REPO}@${ref}...`);

  // Resolve the actual commit SHA for this ref
  let commonsVersion;
  try {
    commonsVersion = await getCommitSha(ref);
  } catch (err) {
    console.error(`Error resolving ref '${ref}': ${err.message}`);
    process.exit(1);
  }

  // Fetch each file
  for (const file of FILES) {
    const remotePath = `${BASE_PATH}/${file}`;
    try {
      const content = await fetchFile(ref, remotePath);
      const dest = DEST_MAP[file];
      fs.writeFileSync(dest, content);
      console.log(`Fetched ${remotePath} -> ${path.basename(dest)}`);
    } catch (err) {
      console.error(`Error fetching ${remotePath}: ${err.message}`);
      process.exit(1);
    }
  }

  // Write version metadata
  const meta = {
    commonsVersion,
    commonsRef: ref,
    commonsRepo: `https://github.com/${REPO}`,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(META_DEST, JSON.stringify(meta, null, 2) + "\n");
  console.log(
    `Generated translation-meta.json (cioos-commons@${commonsVersion})`
  );
}

main();
