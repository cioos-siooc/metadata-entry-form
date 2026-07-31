import { describe, expect, test } from "vitest";
import { getBlankRecord } from "../blankRecord.js";
import { validators, validateField, percentValid } from "../validate.js";

// These tests exist to pin the submit gate. `blankRecord` is spread over every
// record on save (MetadataForm.handleSaveClick does
// `{ ...getBlankRecord(), ...record }`), so adding a default here can silently
// flip a validator: several validators are bare truthiness checks, and `[]` is
// truthy in JS. A record that has an empty `taxa` array genuinely has no
// taxonomic coverage and must still fail.

const failingValidators = (record) =>
  Object.keys(validators)
    .filter((field) => !validateField(record, field))
    .sort();

describe("blankRecord / submit gate", () => {
  test("a blank record is not submittable", () => {
    expect(percentValid(getBlankRecord())).toBeLessThan(1);
  });

  test("exactly these validators fail on a blank record", () => {
    // Locked deliberately, and measured against the pre-extraction code so the
    // shared/ move and the blankRecord fix are provably behaviour-preserving.
    // If this list changes, the submit gate changed — decide whether that was
    // intended before updating the expectation.
    expect(failingValidators(getBlankRecord())).toEqual([
      "abstract",
      "contacts",
      "distribution",
      "eov",
      "keywords",
      "language",
      "license",
      "metadataScope",
      "progress",
      "resourceType",
      "taxa",
      "title",
      "verticalExtentDirection",
      "verticalExtentMax",
      "verticalExtentMin",
    ]);
  });

  test("a blank record scores 6/21, not 20/21", () => {
    // 28.6%. Recorded because it is easy to assume the opposite: six
    // validators pass *vacuously* on an empty record — map, platforms,
    // instruments, history, associated_resources and eovDeprecated — so
    // those sections can look complete while holding nothing.
    expect(percentValid(getBlankRecord())).toBeCloseTo(6 / 21, 5);

    const vacuous = ["map", "platforms", "instruments", "history", "associated_resources", "eovDeprecated"];
    for (const field of vacuous) {
      expect(validateField(getBlankRecord(), field), `${field} should pass vacuously`).toBeTruthy();
    }
  });

  test("empty arrays do not satisfy truthiness-based validators", () => {
    const record = getBlankRecord();
    expect(validateField(record, "taxa")).toBeFalsy();
    expect(validateField(record, "resourceType")).toBeFalsy();

    // ...and the documented escape hatches still work
    expect(validateField({ ...record, noTaxa: true }, "taxa")).toBeTruthy();
  });

  test("every field a tab writes is declared, so the shape is honest", () => {
    const record = getBlankRecord();
    // Written by the tabs but historically absent from blankRecord.
    for (const field of [
      "resourceType",
      "metadataScope",
      "metadataScopeIso",
      "projects",
      "taxa",
      "noTaxa",
      "noVerticalExtent",
      "verticalExtentEPSG",
    ]) {
      expect(record, `missing ${field}`).toHaveProperty(field);
    }
  });

  test("limitations is bilingual, matching every consumer", () => {
    expect(getBlankRecord().limitations).toEqual({ en: "", fr: "" });
  });
});
