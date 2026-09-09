#!/usr/bin/env node
/**
 * Stages the JSON Schema and its generated documentation into public/schema/
 * so Vite copies them verbatim into build/, and the existing GitHub Pages
 * deploy publishes them with no workflow change.
 *
 * Deliberately pure Node. The deploy workflow runs `npm ci && npm run build`
 * with no Python available, so it cannot run the docs generator — the docs are
 * generated on demand by `npm run schema:docs` and committed. This script only
 * copies.
 *
 * Published layout (relative to the site base):
 *   /schema/index.html                    language picker
 *   /schema/en/, /schema/fr/              field reference + conditional rules
 *   /schema/assets/                       shared css, js, fonts
 *   /schema/record.schema.json            the schema itself
 *   /schema/record.submission.schema.json
 *
 * Links inside the generated pages are all relative, so this works under any
 * base path (the app deploys under /metadata-entry-form/ on GitHub Pages).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SCHEMA_V1 = path.join(REPO_ROOT, "schema", "v1");
const DOCS_BUILD = path.join(REPO_ROOT, "schema", "docs", "build");
const TARGET = path.join(REPO_ROOT, "public", "schema");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(source, target);
    else fs.copyFileSync(source, target);
  }
}

function main() {
  if (!fs.existsSync(SCHEMA_V1)) {
    console.warn(
      "[schema] schema/v1 not found — run `npm run schema:build`. Skipping."
    );
    return;
  }

  // Rebuilt from scratch so a renamed or deleted artifact doesn't linger.
  fs.rmSync(TARGET, { recursive: true, force: true });
  fs.mkdirSync(TARGET, { recursive: true });

  const schemaFiles = fs
    .readdirSync(SCHEMA_V1)
    .filter((name) => name.endsWith(".json"));
  schemaFiles.forEach((name) =>
    fs.copyFileSync(path.join(SCHEMA_V1, name), path.join(TARGET, name))
  );

  if (fs.existsSync(DOCS_BUILD)) {
    copyDir(DOCS_BUILD, TARGET);
    console.log(
      `[schema] staged ${schemaFiles.length} schema file(s) and the generated docs into public/schema/`
    );
  } else {
    // Not fatal: the schema itself is still published and fetchable. Only the
    // browsable docs are missing, and regenerating them needs Python.
    console.warn(
      `[schema] staged ${schemaFiles.length} schema file(s), but schema/docs/build is missing — ` +
        "run `npm run schema:docs` to generate the browsable documentation."
    );
  }
}

main();
