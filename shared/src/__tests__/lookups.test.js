import { describe, expect, it } from "vitest";

import { extractOrcid, orcidToContact, rorName, rorToContact } from "../lookups.js";

// Trimmed from a real api.ror.org response — the shape that matters is the
// several-names-per-organisation one.
const dfo = {
  id: "https://ror.org/02qa1x782",
  names: [
    { lang: null, types: ["acronym"], value: "DFO" },
    { lang: "en", types: ["alias"], value: "Department of Fisheries and Oceans" },
    { lang: "en", types: ["ror_display", "label"], value: "Fisheries and Oceans Canada" },
    { lang: "fr", types: ["label"], value: "Pêches et Océans Canada" },
  ],
  links: [
    { type: "wikipedia", value: "http://en.wikipedia.org/wiki/Fisheries_and_Oceans_Canada" },
    { type: "website", value: "https://www.dfo-mpo.gc.ca" },
  ],
  locations: [
    { geonames_details: { name: "Ottawa", country_name: "Canada", country_code: "CA" } },
  ],
};

describe("rorName", () => {
  it("prefers the display name over an alias in the same language", () => {
    // The web app takes the first name whose lang matches, which lands on
    // "Department of Fisheries and Oceans" — an alias, not what the
    // organisation calls itself.
    expect(rorName(dfo, "en")).toBe("Fisheries and Oceans Canada");
  });

  it("uses the French label for a French record", () => {
    expect(rorName(dfo, "fr")).toBe("Pêches et Océans Canada");
  });

  it("falls back to the display name when the language has no label", () => {
    expect(rorName(dfo, "es")).toBe("Fisheries and Oceans Canada");
  });

  it("falls back to any name rather than returning nothing", () => {
    expect(rorName({ names: [{ lang: null, types: ["acronym"], value: "DFO" }] })).toBe("DFO");
  });

  it("survives a payload with no names at all", () => {
    expect(rorName({})).toBe("");
    expect(rorName(undefined)).toBe("");
  });
});

describe("rorToContact", () => {
  it("fills organisation, website and location", () => {
    expect(rorToContact(dfo, "en")).toEqual({
      orgRor: "https://ror.org/02qa1x782",
      orgName: "Fisheries and Oceans Canada",
      orgURL: "https://www.dfo-mpo.gc.ca",
      orgCity: "Ottawa",
      orgCountry: "Canada",
    });
  });

  it("picks the website link, not whichever link comes first", () => {
    expect(rorToContact(dfo, "en").orgURL).not.toContain("wikipedia");
  });

  it("returns empty strings for an organisation with no location or links", () => {
    expect(rorToContact({ id: "https://ror.org/x", names: [] })).toEqual({
      orgRor: "https://ror.org/x",
      orgName: "",
      orgURL: "",
      orgCity: "",
      orgCountry: "",
    });
  });
});

describe("extractOrcid", () => {
  it("reads an identifier out of a pasted URL", () => {
    expect(extractOrcid("https://orcid.org/0000-0002-1825-0097")).toBe("0000-0002-1825-0097");
  });

  it("accepts a bare identifier", () => {
    expect(extractOrcid("0000-0002-1825-0097")).toBe("0000-0002-1825-0097");
  });

  it("accepts the X check digit ORCID uses", () => {
    expect(extractOrcid("0000-0002-1694-233x")).toBe("0000-0002-1694-233X");
  });

  it("returns null for anything else, rather than a half-match", () => {
    expect(extractOrcid("0000-0002-1825")).toBeNull();
    expect(extractOrcid("")).toBeNull();
    expect(extractOrcid(undefined)).toBeNull();
  });
});

describe("orcidToContact", () => {
  const record = {
    "orcid-identifier": { uri: "https://orcid.org/0000-0002-1825-0097" },
    person: {
      name: { "given-names": { value: "Josiah" }, "family-name": { value: "Carberry" } },
      emails: { email: [{ email: "josiah@example.org" }] },
    },
  };

  it("fills the person's name, email and identifier", () => {
    expect(orcidToContact(record)).toEqual({
      indOrcid: "https://orcid.org/0000-0002-1825-0097",
      givenNames: "Josiah",
      lastName: "Carberry",
      indEmail: "josiah@example.org",
    });
  });

  it("handles a profile with no public email", () => {
    const noEmail = { ...record, person: { ...record.person, emails: { email: [] } } };
    expect(orcidToContact(noEmail).indEmail).toBe("");
    expect(orcidToContact(noEmail).givenNames).toBe("Josiah");
  });

  it("handles a profile with no family name", () => {
    // ORCID allows it, and the web app throws on exactly this.
    const mononym = {
      ...record,
      person: { ...record.person, name: { "given-names": { value: "Prince" } } },
    };
    expect(orcidToContact(mononym).lastName).toBe("");
    expect(orcidToContact(mononym).givenNames).toBe("Prince");
  });

  it("handles a profile with the name hidden entirely", () => {
    expect(orcidToContact({ person: {} })).toEqual({
      indOrcid: "",
      givenNames: "",
      lastName: "",
      indEmail: "",
    });
  });
});
