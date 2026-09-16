import { describe, expect, test, vi } from "vitest";

// expo-secure-store needs a native module, so stub it. The logic under test is
// the receipt policy, which is pure.
vi.mock("expo-secure-store", () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
  AFTER_FIRST_UNLOCK: "AFTER_FIRST_UNLOCK",
}));

const { buildReceipt, receiptIsValid } = await import("../tokenStore");

const NOW = Date.parse("2026-07-30T12:00:00Z");
const identity = {
  userID: "user-1",
  email: "author@example.org",
  displayName: "Author",
  roles: {},
};

describe("identity receipt", () => {
  test("carries no credential — nothing in it can be replayed", () => {
    const receipt = buildReceipt(identity, 90, NOW);
    const serialised = JSON.stringify(receipt).toLowerCase();
    for (const forbidden of ["token", "password", "secret", "bearer"]) {
      expect(serialised, forbidden).not.toContain(forbidden);
    }
  });

  test("is valid inside its window and invalid after", () => {
    const receipt = buildReceipt(identity, 90, NOW);
    expect(receiptIsValid(receipt, NOW)).toBe(true);
    expect(receiptIsValid(receipt, NOW + 89 * 86400_000)).toBe(true);
    expect(receiptIsValid(receipt, NOW + 91 * 86400_000)).toBe(false);
  });

  test("the window is bounded, so a lost phone stops reading eventually", () => {
    const receipt = buildReceipt(identity, 90, NOW);
    const days = (Date.parse(receipt.offlineUntil) - NOW) / 86400_000;
    expect(days).toBeCloseTo(90, 5);
  });

  test("a short window can be configured for the weaker storage case", () => {
    // A browser build cannot use the keychain and is subject to storage
    // eviction, so it gets a much shorter grace period.
    const receipt = buildReceipt(identity, 7, NOW);
    expect(receiptIsValid(receipt, NOW + 8 * 86400_000)).toBe(false);
  });

  test.each([null, undefined])("treats %p as invalid", (input) => {
    expect(receiptIsValid(input as never, NOW)).toBe(false);
  });

  test("a malformed expiry is invalid rather than permanently trusted", () => {
    expect(receiptIsValid({ ...identity, issuedAt: "", offlineUntil: "junk" }, NOW)).toBe(false);
  });

  test("records per-region roles, since roles are never global", () => {
    const receipt = buildReceipt(
      {
        ...identity,
        roles: {
          pacific: { isAdmin: false, isReviewer: true, isSuperadmin: false },
          atlantic: { isAdmin: false, isReviewer: false, isSuperadmin: false },
        },
      },
      90,
      NOW,
    );
    expect(receipt.roles.pacific.isReviewer).toBe(true);
    expect(receipt.roles.atlantic.isReviewer).toBe(false);
  });
});
