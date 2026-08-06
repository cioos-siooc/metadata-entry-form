/**
 * Emits the committed JSON Schema artifacts from the authoring source in
 * src/schema/.
 *
 * Run with `npm run schema:build`. Runs under vite-node rather than plain node
 * because the authoring modules import from src/ — ES modules in .js files, plus
 * .json imports — which needs Vite's resolution. A Vitest test regenerates and
 * deep-equals the output so the committed files cannot drift from the source.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SCHEMA_MAJOR, SCHEMA_VERSION } from "../src/schema/index.js";
import {
  ARTIFACT_FILES,
  buildArtifacts,
  serialize,
} from "../src/schema/artifacts.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "schema", SCHEMA_MAJOR);

mkdirSync(outDir, { recursive: true });

const artifacts = buildArtifacts();

Object.entries(ARTIFACT_FILES).forEach(([key, filename]) => {
  const path = join(outDir, filename);
  writeFileSync(path, serialize(artifacts[key]));
  console.log(`wrote ${path.replace(`${repoRoot}/`, "")}`);
});

console.log(
  `\nschema version ${SCHEMA_VERSION}, ` +
    `${Object.keys(artifacts.structural.properties).length} properties, ` +
    `${Object.keys(artifacts.structural.definitions).length} definitions`
);

if (artifacts.fallbacks.length) {
  // Surfaced rather than silently emitting English into the French docs.
  console.warn(
    `\n${artifacts.fallbacks.length} missing French translation(s) — ` +
      `French docs will show English for:`
  );
  artifacts.fallbacks.forEach(({ pointer, key }) =>
    console.warn(`  ${pointer} .${key}`)
  );
}
