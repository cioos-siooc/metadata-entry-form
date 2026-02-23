#!/usr/bin/env node
/**
 * Ensures src/data/githubReleases.json exists with a skeleton structure.
 * Runs as a postinstall hook to support vite dev without needing to fetch first.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../src/data/githubReleases.json");

function ensureDataFile() {
  try {
    // If file exists, leave it alone (could be fresh from a fetch)
    if (fs.existsSync(OUTPUT_PATH)) {
      return;
    }

    // Create the directory if needed
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

    // Write skeleton
    fs.writeFileSync(
      OUTPUT_PATH,
      JSON.stringify(
        { fetchedAt: null, releases: [] },
        null,
        2
      )
    );

    console.log(`[ensure-data-file] Created skeleton at ${OUTPUT_PATH}`);
  } catch (err) {
    // Non-fatal: if this fails, the build will still work (user can run prebuild manually)
    console.warn(`[ensure-data-file] Warning: ${err.message}`);
  }
}

ensureDataFile();
