import { describe, expect, it } from "vitest";

import { buildPublishPayload, publishFilenameBase } from "../publishPayload.js";

const record = {
  id: "abcdef-1234",
  identifier: "abcdef-1234",
  language: "en",
  title: { en: "Sea surface temperature", fr: "Température de surface" },
};

const base = {
  record,
  environments: ["prod"],
  commitMessage: "",
  config: { fileTemplate: "" },
  region: "pacific",
  xmlContent: "<xml/>",
  yamlContent: "yaml: true",
};

describe("publishFilenameBase", () => {
  it("substitutes {filename} with the record filename", () => {
    expect(publishFilenameBase(record, "metadata/{filename}")).toBe(
      "metadata/sea_surface_temperature_abcde",
    );
  });

  it("substitutes {uuid} and {title}", () => {
    expect(publishFilenameBase(record, "{uuid}-{title}")).toBe(
      "abcdef-1234-Sea-surface-temperature",
    );
  });

  it("falls back to the bare filename with no template", () => {
    expect(publishFilenameBase(record, "")).toBe("sea_surface_temperature_abcde");
  });
});

describe("buildPublishPayload", () => {
  it("writes xml, yaml and json per environment plus one records copy", () => {
    const payload = buildPublishPayload({ ...base, environments: ["prod", "dev"] });
    expect(payload.files).toHaveLength(7);
    expect(payload.files.map((f) => f.path)).toEqual([
      "forms/pacific/prod/sea_surface_temperature_abcde.xml",
      "forms/pacific/prod/sea_surface_temperature_abcde.yaml",
      "forms/pacific/prod/sea_surface_temperature_abcde.json",
      "forms/pacific/dev/sea_surface_temperature_abcde.xml",
      "forms/pacific/dev/sea_surface_temperature_abcde.yaml",
      "forms/pacific/dev/sea_surface_temperature_abcde.json",
      "records/sea_surface_temperature_abcde.json",
    ]);
  });

  it("drops userinfo, which is a database join and not metadata", () => {
    const payload = buildPublishPayload({
      ...base,
      record: { ...record, userinfo: { email: "someone@example.org" } },
    });
    const json = payload.files.find((f) => f.path.endsWith(".json"));
    expect(json.content).not.toContain("someone@example.org");
  });

  it("defaults the commit message to the record title", () => {
    expect(buildPublishPayload(base).commitMessage).toBe(
      "Publish metadata record: Sea surface temperature",
    );
  });

  it("keeps a supplied commit message", () => {
    expect(buildPublishPayload({ ...base, commitMessage: "fix: paths" }).commitMessage).toBe(
      "fix: paths",
    );
  });

  it("omits the region directory when there is no region", () => {
    const payload = buildPublishPayload({ ...base, region: undefined });
    expect(payload.files[0].path).toBe("forms/prod/sea_surface_temperature_abcde.xml");
  });

  it("survives a record with no dataset language set", () => {
    // `language` is the dataset's own language and is often unset; a publish
    // must not throw on it.
    const payload = buildPublishPayload({
      ...base,
      record: { ...record, language: undefined },
    });
    expect(payload.files[0].path).toContain("sea_surface_temperature_abcde");
  });
});
