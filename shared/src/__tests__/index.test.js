import { describe, expect, test } from "vitest";
import * as shared from "../index.js";

describe("shared barrel", () => {
  test("exposes the validation gate", () => {
    for (const name of ["validators", "validateField", "percentValid", "recordIsValid", "getErrorsByTab"]) {
      expect(shared, name).toHaveProperty(name);
    }
  });

  test("exposes the record model and vocabularies", () => {
    expect(typeof shared.getBlankRecord).toBe("function");
    expect(Object.keys(shared.roleCodes).length).toBe(19);
    expect(Object.keys(shared.regions).length).toBeGreaterThan(0);
    expect(shared.eovs.length).toBe(36);
  });
});
