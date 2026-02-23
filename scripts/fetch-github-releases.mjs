#!/usr/bin/env node
/**
 * Fetches GitHub releases at build time and writes them to
 * src/data/githubReleases.json so Vite can bundle them statically.
 *
 * Usage:
 *   node scripts/fetch-github-releases.mjs
 *
 * Environment:
 *   GITHUB_TOKEN  - Optional. Personal access token to avoid rate limiting.
 */

import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../src/data/githubReleases.json");
const API_URL =
  "https://api.github.com/repos/cioos-siooc/metadata-entry-form/releases?per_page=20";

function fetch(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "cioos-metadata-entry-form-build",
      Accept: "application/vnd.github+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    https
      .get(url, { headers }, (res) => {
        // Handle GitHub redirects (rare but possible)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetch(res.headers.location));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`GitHub API error: ${res.statusCode}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("[fetch-github-releases] Fetching releases from GitHub API...");

  try {
    const data = await fetch(API_URL);

    // Filter out drafts at build time; pre-releases are kept (filtered display is UI concern)
    const releases = data.filter((r) => !r.draft);

    // Pick only the fields WhatsNew.jsx actually uses to keep bundle small
    const trimmed = releases.map((r) => ({
      id: r.id,
      tag_name: r.tag_name,
      name: r.name,
      published_at: r.published_at,
      html_url: r.html_url,
      prerelease: r.prerelease,
      body: r.body,
    }));

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        { fetchedAt: new Date().toISOString(), releases: trimmed },
        null,
        2
      )
    );

    console.log(
      `[fetch-github-releases] Wrote ${trimmed.length} releases to ${OUTPUT_PATH}`
    );
  } catch (err) {
    console.warn(`[fetch-github-releases] WARNING: ${err.message}`);
    console.warn(
      "[fetch-github-releases] Build will continue with existing data file."
    );
    // Non-zero exit would break the build; we intentionally exit 0
    process.exit(0);
  }
}

main();
