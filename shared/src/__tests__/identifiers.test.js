import { describe, expect, it } from "vitest";

import { identifierCodeIsValid, inferIdentifierAuthority } from "../identifiers.js";

describe("inferIdentifierAuthority", () => {
  it("recognises a DOI URL", () => {
    expect(inferIdentifierAuthority("https://doi.org/10.0000/abc")).toBe("DOI");
    expect(inferIdentifierAuthority("http://dx.doi.org/10.0000/abc")).toBe("DOI");
  });

  it("calls any other URL a URL", () => {
    expect(inferIdentifierAuthority("https://data.cioos.ca/dataset/x")).toBe("URL");
  });

  it("guesses nothing for a bare code", () => {
    // An ISBN, an ARK and an accession number are indistinguishable to a
    // regex; a wrong authority in a published record is worse than a blank one.
    expect(inferIdentifierAuthority("978-3-16-148410-0")).toBe("");
    expect(inferIdentifierAuthority("10.0000/abc")).toBe("");
    expect(inferIdentifierAuthority("")).toBe("");
    expect(inferIdentifierAuthority(undefined)).toBe("");
  });
});

describe("identifierCodeIsValid", () => {
  it("accepts a non-URL code", () => {
    expect(identifierCodeIsValid("978-3-16-148410-0")).toBe(true);
  });

  it("accepts a well-formed URL", () => {
    expect(identifierCodeIsValid("https://doi.org/10.0000/abc")).toBe(true);
  });

  it("rejects something that means to be a URL and is not", () => {
    expect(identifierCodeIsValid("https://")).toBe(false);
  });

  it("rejects an empty code", () => {
    expect(identifierCodeIsValid("  ")).toBe(false);
  });
});
