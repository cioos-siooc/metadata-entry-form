import { describe, it, expect } from "vitest";
import { isListedEmail } from "../UserProvider";

describe("isListedEmail", () => {
  const list = " Colton.Booth@cioos.ca, admin@cioos.ca";

  it("matches a whole entry, ignoring case and spaces", () => {
    expect(isListedEmail(list, "colton.booth@cioos.ca")).toBe(true);
    expect(isListedEmail(list, "ADMIN@cioos.ca")).toBe(true);
  });

  it("does not match part of an entry", () => {
    expect(isListedEmail(list, "booth@cioos.ca")).toBe(false);
    expect(isListedEmail("colton.booth@cioos.ca", "n.booth@cioos.ca")).toBe(
      false,
    );
  });

  it("handles missing lists and emails", () => {
    expect(isListedEmail(undefined, "admin@cioos.ca")).toBe(false);
    expect(isListedEmail("", "admin@cioos.ca")).toBe(false);
    expect(isListedEmail(list, null)).toBe(false);
  });
});
