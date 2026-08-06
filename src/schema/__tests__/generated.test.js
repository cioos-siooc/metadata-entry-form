import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { SCHEMA_MAJOR, SCHEMA_VERSION } from "../index";
import { ARTIFACT_FILES, buildArtifacts, serialize } from "../artifacts";

/**
 * The committed JSON under schema/v1/ is generated from src/schema/. This is
 * the guard that stops the two drifting: it rebuilds in memory and compares
 * byte-for-byte against what is on disk.
 */

const outDir = join(process.cwd(), "schema", SCHEMA_MAJOR);
const artifacts = buildArtifacts();

describe("generated schema artifacts", () => {
  Object.entries(ARTIFACT_FILES).forEach(([key, filename]) => {
    it(`${filename} matches the authoring source`, () => {
      const onDisk = readFileSync(join(outDir, filename), "utf8");
      expect(
        onDisk,
        `schema/${SCHEMA_MAJOR}/${filename} is stale — run \`npm run schema:build\``
      ).toBe(serialize(artifacts[key]));
    });
  });

  it("has no missing French translations", () => {
    // French docs silently falling back to English is the failure mode this
    // catches; the generator reports them, this makes it fatal.
    expect(artifacts.fallbacks).toEqual([]);
  });

  it("declares the current schema version in both schemas", () => {
    expect(artifacts.structural["x-cioos-schema-version"]).toBe(SCHEMA_VERSION);
    expect(artifacts.submission["x-cioos-schema-version"]).toBe(SCHEMA_VERSION);
  });

  it("emits draft-07 with a versioned $id", () => {
    expect(artifacts.structural.$schema).toBe(
      "http://json-schema.org/draft-07/schema#"
    );
    expect(artifacts.structural.$id).toContain(`/${SCHEMA_MAJOR}/`);
  });
});
