import { describe, expect, it } from "vitest";

import { bareDoi, buildDataCitePayload, draftDoiPayload } from "../datacite.js";

const base = {
  dataciteObject: { titles: [{ title: "Sea surface temperature" }] },
  catalogueUrl: "https://catalogue.cioos.ca/",
  identifier: "abc-123",
  datacitePrefix: "10.0000",
};

describe("buildDataCitePayload", () => {
  it("wraps a create with type and prefix", () => {
    expect(buildDataCitePayload(base)).toEqual({
      data: {
        type: "dois",
        attributes: {
          titles: [{ title: "Sea surface temperature" }],
          url: "https://catalogue.cioos.ca/dataset/ca-cioos_abc-123",
          prefix: "10.0000",
        },
      },
    });
  });

  it("omits type and prefix on an update, which DataCite rejects on a PUT", () => {
    const payload = buildDataCitePayload({ ...base, forUpdate: true });
    expect(payload.data.type).toBeUndefined();
    expect(payload.data.attributes.prefix).toBeUndefined();
    expect(payload.data.attributes.url).toBe(
      "https://catalogue.cioos.ca/dataset/ca-cioos_abc-123",
    );
  });

  it("does not mutate the converted object it was given", () => {
    const dataciteObject = { titles: [] };
    buildDataCitePayload({ ...base, dataciteObject });
    expect(dataciteObject).toEqual({ titles: [] });
  });

  it("rejects a non-object conversion result", () => {
    expect(() => buildDataCitePayload({ ...base, dataciteObject: [] })).toThrow();
    expect(() => buildDataCitePayload({ ...base, dataciteObject: null })).toThrow();
  });

  it("rejects a create with no prefix rather than sending one DataCite will refuse", () => {
    expect(() => buildDataCitePayload({ ...base, datacitePrefix: "" })).toThrow();
    // An update legitimately has none — the DOI already exists.
    expect(() =>
      buildDataCitePayload({ ...base, datacitePrefix: "", forUpdate: true }),
    ).not.toThrow();
  });

  it("rejects a missing catalogue URL rather than building a broken one", () => {
    expect(() => buildDataCitePayload({ ...base, catalogueUrl: undefined })).toThrow();
  });
});

describe("bareDoi", () => {
  it("strips every URL form the record might hold", () => {
    expect(bareDoi("https://doi.org/10.0000/abc")).toBe("10.0000/abc");
    expect(bareDoi("http://doi.org/10.0000/abc")).toBe("10.0000/abc");
    expect(bareDoi("https://dx.doi.org/10.0000/abc")).toBe("10.0000/abc");
    expect(bareDoi("10.0000/abc")).toBe("10.0000/abc");
  });

  it("survives an absent identifier", () => {
    expect(bareDoi(undefined)).toBe("");
  });
});

describe("draftDoiPayload", () => {
  it("carries the prefix and nothing else", () => {
    expect(draftDoiPayload("10.0000")).toEqual({
      data: { type: "dois", attributes: { prefix: "10.0000" } },
    });
  });
});
