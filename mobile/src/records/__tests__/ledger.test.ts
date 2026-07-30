import { getBlankRecord } from "@cioos/shared/blankRecord.js";
import { describe, expect, test } from "vitest";

import { buildLedger, fieldIsFilled, SECTION_ORDER } from "../ledger";

const section = (record: Record<string, unknown>, id: string) =>
  buildLedger(record).sections.find((s) => s.id === id)!;

describe("buildLedger", () => {
  test("covers every validator exactly once", () => {
    // A validator assigned to no section would be invisible in the UI while
    // still blocking submit — the worst possible failure of this screen.
    const ledger = buildLedger(getBlankRecord());
    // 21 required validators; datasetIdentifier is the one optional.
    expect(ledger.requiredTotal).toBe(21);
  });

  test("reports the submit gate verbatim", () => {
    const ledger = buildLedger(getBlankRecord());
    expect(ledger.percent).toBeCloseTo(6 / 21, 5);
    expect(ledger.submittable).toBe(false);
  });

  test("has a section for every id, in order", () => {
    const ledger = buildLedger(getBlankRecord());
    expect(ledger.sections.map((s) => s.id)).toEqual(SECTION_ORDER);
  });
});

describe("vacuous passes are not reported as done", () => {
  // The reason the ledger carries a filled count at all. Six validators pass on
  // an empty record, so a validator-only ledger would show these sections
  // complete while they hold nothing.
  test("Platform is fully vacuous on a blank record, and reads empty not complete", () => {
    // Both its validators (platforms, instruments) pass on an empty record, so
    // this is the section a validator-only ledger would most clearly lie about.
    const s = section(getBlankRecord(), "platform");
    expect(s.satisfied).toBe(s.required);
    expect(s.required).toBeGreaterThan(0);
    expect(s.filled).toBe(0);
    expect(s.touched).toBe(false);
    expect(s.state).toBe("empty");
  });

  test("Where is only partly vacuous — map passes, vertical extent does not", () => {
    // Worth pinning: the vacuous-pass problem is per-validator, not
    // per-section, so Where is outstanding from the start even though its
    // headline `map` validator passes.
    const s = section(getBlankRecord(), "where");
    expect(s.required).toBe(4);
    expect(s.satisfied).toBe(1);
    expect(s.state).toBe("attention");
  });

  test("Where flips to attention once a theme makes spatial required", () => {
    // `map` short-circuits on `!resourceType?.length`; picking a theme removes
    // the short-circuit, so the section becomes required *reactively* while
    // still empty. "attention" wins over "empty" here because the section now
    // blocks submission, and the UI has to say so.
    const record = { ...getBlankRecord(), resourceType: ["oceanographic"] };
    const where = section(record, "where");
    expect(where.satisfied).toBeLessThan(where.required);
    expect(where.state).toBe("attention");
    expect(where.touched).toBe(false); // still nothing entered
    expect(where.errors.length).toBeGreaterThan(0);
  });

  test("a section with a failing validator asks for attention even when untouched", () => {
    // `taxa` fails on a blank record, so Species is outstanding from the start.
    // `touched` is what lets the UI render this more quietly than a section the
    // user started and abandoned.
    const species = section(getBlankRecord(), "species");
    expect(species.state).toBe("attention");
    expect(species.touched).toBe(false);
  });
});

describe("the When section", () => {
  test("has no required validators, because dates are not validated", () => {
    expect(section(getBlankRecord(), "when").required).toBe(0);
  });

  test("reads empty when blank and filled once dated — never 'complete'", () => {
    expect(section(getBlankRecord(), "when").state).toBe("empty");

    const dated = { ...getBlankRecord(), dateStart: "2026-07-01T12:00:00.000Z" };
    const when = section(dated, "when");
    expect(when.state).toBe("filled");
    expect(when.filled).toBe(1);
    expect(when.total).toBe(5);
  });
});

describe("sections reach complete when their requirements are met", () => {
  test("Identification", () => {
    const record = {
      ...getBlankRecord(),
      title: { en: "Hakai nearshore CTD", fr: "CTD côtier Hakai" },
      resourceType: ["oceanographic"],
      metadataScope: "Dataset",
    };
    const s = section(record, "identification");
    expect(s.satisfied).toBe(s.required);
    expect(s.state).toBe("complete");
    expect(s.errors).toEqual([]);
  });

  test("a half-filled section is attention, not complete", () => {
    // Title in one language only — the validator requires both.
    const record = { ...getBlankRecord(), title: { en: "English only", fr: "" } };
    const s = section(record, "identification");
    expect(s.state).toBe("attention");
    expect(s.filled).toBeGreaterThan(0);
  });

  test("Species completes via the explicit noTaxa escape hatch", () => {
    const record = { ...getBlankRecord(), noTaxa: true };
    const s = section(record, "species");
    expect(s.satisfied).toBe(s.required);
    // noTaxa is a real answer, so this is filled rather than empty.
    expect(s.state).toBe("complete");
  });
});

describe("fieldIsFilled", () => {
  test("ignores a translation mark left behind by cleared text", () => {
    const stale = {
      en: "",
      fr: "",
      translations: { fr: { verified: false, message: "text translated using Cohere" } },
    };
    expect(fieldIsFilled({ title: stale }, "title")).toBe(false);
    expect(fieldIsFilled({ title: { ...stale, en: "Sea surface" } }, "title")).toBe(true);
  });

  test("treats blank bilingual text as empty", () => {
    expect(fieldIsFilled({ title: { en: "", fr: "" } }, "title")).toBe(false);
    expect(fieldIsFilled({ title: { en: "x", fr: "" } }, "title")).toBe(true);
  });

  test("handles keywords, which are {en: [], fr: []} rather than a text pair", () => {
    expect(fieldIsFilled({ keywords: { en: [], fr: [] } }, "keywords")).toBe(false);
    expect(fieldIsFilled({ keywords: { en: ["Hartley Bay"], fr: [] } }, "keywords")).toBe(true);
  });

  test("handles the nested map object", () => {
    const empty = { north: "", south: "", east: "", west: "", polygon: "" };
    expect(fieldIsFilled({ map: empty }, "map")).toBe(false);
    expect(fieldIsFilled({ map: { ...empty, north: "49.2" } }, "map")).toBe(true);
  });

  test("an empty array is not filled, whatever JS truthiness says", () => {
    // The trap that would have let an empty record pass its own submit gate.
    expect(fieldIsFilled({ taxa: [] }, "taxa")).toBe(false);
    expect(fieldIsFilled({ taxa: [{ scientificName: "Gadus" }] }, "taxa")).toBe(true);
  });

  test("a false boolean is not filled, a true one is", () => {
    expect(fieldIsFilled({ noTaxa: false }, "noTaxa")).toBe(false);
    expect(fieldIsFilled({ noTaxa: true }, "noTaxa")).toBe(true);
  });

  test.each([null, undefined, ""])("treats %p as empty", (value) => {
    expect(fieldIsFilled({ field: value }, "field")).toBe(false);
  });

  test("counts zero as filled — a depth of 0 m is a real answer", () => {
    expect(fieldIsFilled({ verticalExtentMin: 0 }, "verticalExtentMin")).toBe(true);
  });
});

describe("a fully valid record", () => {
  const complete = {
    ...getBlankRecord(),
    title: { en: "Hakai nearshore CTD", fr: "CTD côtier Hakai" },
    abstract: { en: "Casts from 2024.", fr: "Profils de 2024." },
    keywords: { en: ["Hartley Bay"], fr: ["Baie Hartley"] },
    eov: ["oxygen"],
    progress: "onGoing",
    language: "en",
    license: "CC-BY-4.0",
    resourceType: ["oceanographic"],
    metadataScope: "Dataset",
    map: { north: "51", south: "49", east: "-122", west: "-128", polygon: "" },
    verticalExtentMin: "0",
    verticalExtentMax: "250",
    verticalExtentDirection: "depthPositive",
    noTaxa: true,
    noPlatform: true,
    contacts: [
      {
        role: ["custodian", "owner"],
        orgName: "Hakai Institute",
        orgEmail: "data@hakai.org",
        inCitation: true,
        givenNames: "",
        lastName: "",
        indEmail: "",
        orgURL: "",
      },
    ],
    distribution: [
      { url: "https://example.org/data.csv", name: { en: "CSV", fr: "CSV" }, description: { en: "", fr: "" } },
    ],
  };

  test("is submittable and every section is accounted for", () => {
    const ledger = buildLedger(complete);
    expect(ledger.submittable).toBe(true);
    expect(ledger.percent).toBe(1);
    expect(ledger.requiredSatisfied).toBe(ledger.requiredTotal);
  });

  test("no section is left in attention", () => {
    const stuck = buildLedger(complete).sections.filter((s) => s.state === "attention");
    expect(stuck.map((s) => s.id)).toEqual([]);
  });
});
