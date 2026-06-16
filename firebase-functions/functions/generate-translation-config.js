#!/usr/bin/env node

/**
 * Pre-deploy script that fetches translation assets from the cioos-commons
 * GitHub repository and generates a translation-meta.json with version
 * provenance info.
 *
 * By default fetches from the main branch HEAD. Pass a commit SHA or tag
 * as the first argument to pin a specific version, or use --branch to fetch
 * the latest commit from a specific branch:
 *
 *   node generate-translation-config.js              # latest main
 *   node generate-translation-config.js --branch foo # latest commit on branch foo
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
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;

const FUNCTIONS_DIR = __dirname;
const PROMPT_DEST = path.join(FUNCTIONS_DIR, "translation-prompt-template.txt");
const META_DEST = path.join(FUNCTIONS_DIR, "translation-meta.json");

const DEST_MAP = {
  "prompt-template.txt": PROMPT_DEST,
};

function printUsage() {
  console.log(`Usage:
  node generate-translation-config.js
  node generate-translation-config.js --branch <branch>
  node generate-translation-config.js [commit-or-tag-or-ref]

Examples:
  node generate-translation-config.js
  node generate-translation-config.js --branch feat/new-prompt
  node generate-translation-config.js abc1234
  node generate-translation-config.js v1.2.0

Environment:
  GITHUB_TOKEN or GH_TOKEN  Required for private repos`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let ref = "main";
  let refType = "branch";
  let positionalRef = null;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    if (arg === "--branch") {
      ref = args[index + 1];
      refType = "branch";
      index++;
      if (!ref) {
        throw new Error("Missing branch name after --branch");
      }
      continue;
    }

    if (arg.startsWith("--branch=")) {
      ref = arg.slice("--branch=".length);
      refType = "branch";
      if (!ref) {
        throw new Error("Missing branch name after --branch=");
      }
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown option '${arg}'`);
    }

    if (positionalRef !== null) {
      throw new Error("Only one positional ref is supported");
    }

    positionalRef = arg;
  }

  if (positionalRef !== null) {
    ref = positionalRef;
    refType = "ref";
  }

  return { ref, refType };
}

function getHeaders() {
  const headers = {
    "User-Agent": "cioos-metadata-entry-form",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  return headers;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: getHeaders() }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrl(res.headers.location).then(resolve, reject);
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");

          if (res.statusCode !== 200) {
            let details = "";

            try {
              const parsed = JSON.parse(body);
              if (parsed.message) {
                details = `: ${parsed.message}`;
              }
            } catch {
              if (body) {
                details = `: ${body}`;
              }
            }

            return reject(new Error(`HTTP ${res.statusCode} for ${url}${details}`));
          }

          resolve(body);
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function fetchJson(url) {
  const body = await fetchUrl(url);
  return JSON.parse(body);
}

async function getCommitInfo(ref) {
  const url = `https://api.github.com/repos/${REPO}/commits/${ref}`;
  const data = await fetchJson(url);
  return {
    full: data.sha,
    short: data.sha.substring(0, 7),
  };
}

async function fetchFile(ref, filePath) {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const encodedRef = encodeURIComponent(ref);
  const url = `https://api.github.com/repos/${REPO}/contents/${encodedPath}?ref=${encodedRef}`;
  const data = await fetchJson(url);

  if (!data.content) {
    throw new Error(`No content returned for ${filePath}`);
  }

  const normalized = data.content.replace(/\n/g, "");
  return Buffer.from(normalized, "base64").toString("utf8");
}

async function main() {
  let ref;
  let refType;

  try {
    ({ ref, refType } = parseArgs(process.argv));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    printUsage();
    process.exit(1);
  }

  console.log(`Fetching translation assets from ${REPO}@${ref}...`);

  // Resolve the actual commit SHA for this ref
  let commitInfo;
  try {
    commitInfo = await getCommitInfo(ref);
  } catch (err) {
    if (!GITHUB_TOKEN) {
      console.error("Hint: set GITHUB_TOKEN or GH_TOKEN when fetching from a private GitHub repository.");
    }
    console.error(`Error resolving ref '${ref}': ${err.message}`);
    process.exit(1);
  }

  console.log(`Resolved ${refType} '${ref}' to commit ${commitInfo.short}`);

  // Fetch each file
  for (const file of FILES) {
    const remotePath = `${BASE_PATH}/${file}`;
    try {
      const content = await fetchFile(commitInfo.full, remotePath);
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
    commonsVersion: commitInfo.short,
    commonsCommit: commitInfo.full,
    commonsRef: ref,
    commonsRefType: refType,
    commonsRepo: `https://github.com/${REPO}`,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(META_DEST, JSON.stringify(meta, null, 2) + "\n");
  console.log(
    `Generated translation-meta.json (cioos-commons@${commitInfo.short})`
  );
}

main();
