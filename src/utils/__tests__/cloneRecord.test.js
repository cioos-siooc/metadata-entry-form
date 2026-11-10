import { describe, it, expect, vi } from "vitest";
import { get, push } from "firebase/database";
import { cloneRecord } from "../firebaseRecordFunctions";

vi.mock("../../firebase", () => ({ default: {} }));

describe("cloneRecord", () => {
  it("drops the original's review results (the rules reject client writes to qa)", async () => {
    get.mockResolvedValue({
      val: () => ({
        title: { en: "T", fr: "T" },
        status: "published",
        qa: { findings: [{ id: "a" }], inputHash: "h", generated: "now" },
      }),
    });

    await cloneRecord("r1", "u1", "u2", "pacific");

    const copy = push.mock.calls.at(-1)[1];
    expect(copy).not.toHaveProperty("qa");
    expect(copy.title.en).toBe("T (Copy)");
  });
});
