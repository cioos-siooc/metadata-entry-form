import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import ReviewFindings, { mergeSuggested } from "../ReviewFindings";
import { qaSummary } from "../../RecordList/config";
import { UserContext } from "../../../providers/UserProvider";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific", userID: "u1", recordID: "r1" }),
  };
});

const set = vi.fn();
vi.mock("firebase/database", () => ({
  getDatabase: () => ({}),
  ref: (_db, path) => path,
  set: (...args) => set(...args),
  onValue: () => () => {},
}));
vi.mock("../../../firebase", () => ({ default: {} }));

const qa = {
  generated: "2026-10-07T00:00:00Z",
  findings: {
    0: { id: "a", severity: "medium", field: "license", description: "Dataset has no license." },
    1: {
      id: "b",
      severity: "high",
      field: "https://x.test",
      description: "URL unreachable.",
      suggested: { distribution: { 1: { url: "https://new.test" } } },
    },
    2: { id: "c", severity: "critical", field: "title", description: "Rejected earlier." },
  },
  statuses: { c: { status: "rejected" } },
};

const renderWith = (props = {}, reviewRecord = vi.fn().mockResolvedValue({})) => {
  render(
    <UserContext.Provider value={{ reviewRecord }}>
      <ReviewFindings record={{ qa }} unsaved={false} onApplySuggested={() => {}} {...props} />
    </UserContext.Provider>
  );
  return reviewRecord;
};

describe("<ReviewFindings />", () => {
  it("lists findings worst first and hides rejected ones", () => {
    renderWith();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toMatch("URL unreachable.");
    expect(items[1]).toMatch("Dataset has no license.");
    expect(screen.queryByText("Rejected earlier.")).toBeNull();
  });

  it("runs the review by path, only once the record is saved", async () => {
    const reviewRecord = renderWith();
    fireEvent.click(screen.getByRole("button", { name: /run review/i }));
    await screen.findByRole("button", { name: /run review/i }); // spinner gone
    expect(reviewRecord).toHaveBeenCalledWith({ region: "pacific", userID: "u1", recordID: "r1" });
  });

  it("disables the review while there are unsaved changes", () => {
    renderWith({ unsaved: true });
    expect(screen.getByRole("button", { name: /run review/i }).disabled).toBe(true);
  });

  it("writes a rejection with its note", () => {
    renderWith();
    fireEvent.click(screen.getAllByRole("button", { name: /reject/i })[0]);
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "fine as is" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(set).toHaveBeenCalledWith("pacific/users/u1/records/r1/qa/statuses/b", {
      status: "rejected",
      note: "fine as is",
    });
  });
});

describe("<ReviewFindings /> Apply", () => {
  it("applies only that finding's fix and marks it applied", () => {
    const onApplySuggested = vi.fn();
    renderWith({ onApplySuggested });
    const apply = screen.getAllByRole("button", { name: /^apply$/i });
    expect(apply).toHaveLength(1); // only "b" has a fix
    fireEvent.click(apply[0]);
    expect(onApplySuggested).toHaveBeenCalledWith(qa.findings[1].suggested);
    expect(set).toHaveBeenCalledWith("pacific/users/u1/records/r1/qa/statuses/b", {
      status: "applied",
    });
  });
});

describe("mergeSuggested", () => {
  it("keeps sibling languages when patching one", () => {
    const out = mergeSuggested({ title: { en: "Old", fr: "Ancien" } }, { title: { en: "New" } });
    expect(out.title).toEqual({ en: "New", fr: "Ancien" });
  });

  it("skips holes when RTDB returns an index patch as a sparse array", () => {
    const record = { distribution: [{ url: "a" }, { url: "b", name: "B" }] };
    // eslint-disable-next-line no-sparse-arrays
    const out = mergeSuggested(record, { distribution: [, { url: "new" }] });
    expect(out.distribution).toEqual([{ url: "a" }, { url: "new", name: "B" }]);
    expect(mergeSuggested(record, { distribution: [null, { url: "new" }] }).distribution[0]).toEqual({ url: "a" });
  });


  it("patches array entries addressed by RTDB index keys", () => {
    const record = { title: "t", distribution: [{ url: "a", name: "A" }, { url: "b", name: "B" }] };
    const out = mergeSuggested(record, qa.findings[1].suggested);
    expect(out.distribution).toEqual([{ url: "a", name: "A" }, { url: "https://new.test", name: "B" }]);
    expect(Array.isArray(out.distribution)).toBe(true);
    expect(record.distribution[1].url).toBe("b"); // not mutated
  });
});

describe("qaSummary", () => {
  it("counts open findings and their worst severity", () => {
    expect(qaSummary(qa)).toEqual({ count: 2, worst: "high" });
    expect(qaSummary(undefined)).toBeNull();
  });
});
