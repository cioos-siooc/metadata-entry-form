import { describe, expect, it } from "vitest";

import regions, { RESERVED_REGION_IDS } from "../../regions";

describe("reserved region ids", () => {
  it("names every literal root node that shadows the $region wildcard", () => {
    // /formTypes and /admin are literal children at the root, so neither may
    // ever be usable as a region slug — a region called "formTypes" would have
    // its data interpreted as the shared form catalog.
    expect(RESERVED_REGION_IDS).toContain("admin");
    expect(RESERVED_REGION_IDS).toContain("formTypes");
  });

  it("does not collide with a real region slug", () => {
    RESERVED_REGION_IDS.forEach((id) => {
      expect(Object.keys(regions)).not.toContain(id);
    });
  });
});
