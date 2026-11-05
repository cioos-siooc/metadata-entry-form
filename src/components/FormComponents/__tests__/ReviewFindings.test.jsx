import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import {
  ReviewButton,
  ReviewPanel,
  findingTab,
  flattenPatch,
  mergeSuggested,
  scrollToField,
  useRunReview,
} from "../ReviewFindings";
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
      field: "distribution",
      description: "URL unreachable.",
      suggested: { distribution: { 1: { url: "https://new.test" } } },
    },
    2: { id: "c", severity: "critical", field: "title", description: "Rejected earlier." },
  },
  statuses: { c: { status: "rejected", note: "intentional" } },
};
const record = {
  qa,
  created: "2026-10-06T00:00:00Z",
  distribution: [{ url: "a" }, { url: "https://old.test" }],
};

// What FormShellWrapper does: one useRunReview shared by the header button and the panel
const Harness = (props) => {
  const run = useRunReview();
  return (
    <>
      <ReviewButton record={props.record || record} open loading={run.loading} onToggle={() => {}} />
      <ReviewPanel
        record={record}
        unsaved={false}
        loading={run.loading}
        error={run.error}
        onRun={run.run}
        canRun={run.canRun}
        onApplySuggested={() => {}}
        onClose={() => {}}
        {...props}
      />
    </>
  );
};

const renderWith = (props = {}, reviewRecord = vi.fn().mockResolvedValue({})) => {
  render(
    <UserContext.Provider value={{ reviewRecord }}>
      <Harness {...props} />
    </UserContext.Provider>
  );
  return reviewRecord;
};

describe("<ReviewButton /> + <ReviewPanel /> summary", () => {
  beforeEach(() => set.mockClear());

  it("shows the open-finding count on the header button", () => {
    renderWith();
    expect(screen.getByRole("button", { name: /^review 2$/i })).toBeTruthy();
  });

  it("counts open findings by severity, excluding resolved ones", () => {
    renderWith();
    expect(screen.getByText(/1 high/)).toBeTruthy();
    expect(screen.getByText(/1 medium/)).toBeTruthy();
    expect(screen.queryByText(/critical/)).toBeNull();
    expect(screen.queryByText("Outdated")).toBeNull();
  });

  it("flags results older than the last save", () => {
    renderWith({ record: { ...record, created: "2026-10-08T00:00:00Z" } });
    expect(screen.getByText("Outdated")).toBeTruthy();
    expect(screen.getByText("The record changed since this review.")).toBeTruthy();
  });

  it("runs the review by path, only once the record is saved", async () => {
    const reviewRecord = renderWith();
    fireEvent.click(screen.getByRole("button", { name: /re-run review/i }));
    await screen.findByRole("button", { name: /re-run review/i }); // spinner gone
    expect(reviewRecord).toHaveBeenCalledWith({ region: "pacific", userID: "u1", recordID: "r1" });
  });

  it("disables the review while there are unsaved changes", () => {
    renderWith({ unsaved: true });
    expect(screen.getByRole("button", { name: /re-run review/i }).disabled).toBe(true);
  });
});

describe("<ReviewPanel /> findings", () => {
  beforeEach(() => set.mockClear());

  it("groups open findings by the tab their field is on", () => {
    renderWith();
    const headings = screen
      .getAllByText(/\(\d\)$/)
      .map((el) => el.textContent)
      .filter((t) => !/resolved/i.test(t));
    expect(headings).toEqual(["Resource Identification (1)", "Data and Documentation (1)"]);
    expect(screen.queryByText("Rejected earlier.")).toBeNull(); // under "Show resolved"
  });

  it("goes to the field's tab", () => {
    const onGoToTab = vi.fn();
    renderWith({ onGoToTab });
    fireEvent.click(screen.getAllByRole("button", { name: /go to field/i })[0]);
    expect(onGoToTab).toHaveBeenCalledWith("identification", "license");
  });

  it("scrolls to a field's section, or its shared anchor", () => {
    document.body.innerHTML = '<div id="field-dateStart"></div>';
    const el = document.getElementById("field-dateStart");
    el.scrollIntoView = vi.fn();
    scrollToField("dateEnd");
    expect(el.scrollIntoView).toHaveBeenCalled();
    expect(() => scrollToField("nowhere")).not.toThrow();
  });

  it("writes a rejection with its note", () => {
    renderWith();
    fireEvent.click(screen.getAllByRole("button", { name: /reject/i })[0]);
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "fine as is" } });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(set).toHaveBeenCalledWith("pacific/users/u1/records/r1/qa/statuses/a", {
      status: "rejected",
      note: "fine as is",
    });
  });

  it("restores a resolved finding", () => {
    renderWith();
    fireEvent.click(screen.getByRole("button", { name: /show resolved/i }));
    expect(screen.getByText(/intentional/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /restore/i }));
    expect(set).toHaveBeenCalledWith("pacific/users/u1/records/r1/qa/statuses/c", null);
  });

  it("previews a fix, then applies it without writing a status (that happens on save)", () => {
    const onApplySuggested = vi.fn();
    renderWith({ onApplySuggested });
    const preview = screen.getAllByRole("button", { name: /preview fix/i });
    expect(preview).toHaveLength(1); // only "b" has a fix
    fireEvent.click(preview[0]);
    expect(screen.getByText("https://old.test")).toBeTruthy(); // current
    expect(screen.getByText("https://new.test")).toBeTruthy(); // suggested
    fireEvent.click(screen.getByRole("button", { name: /^apply$/i }));
    expect(onApplySuggested).toHaveBeenCalledWith(qa.findings[1]);
    expect(set).not.toHaveBeenCalled();
  });

  it("marks fixes applied in the form but not saved", () => {
    renderWith({ pendingApplied: ["b"] });
    expect(screen.getByText("Applied, unsaved")).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: /preview fix/i })).toHaveLength(0);
  });
});

describe("findingTab / flattenPatch", () => {
  it("maps a field path's first segment to its tab", () => {
    expect(findingTab({ field: "contacts.0.email" })).toBe("contact");
    expect(findingTab({ field: "https://x.test" })).toBe("other");
  });

  it("lists the leaves a patch changes, skipping holes", () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(flattenPatch({ title: { en: "T" }, distribution: [, { url: "u" }] })).toEqual([
      [["title", "en"], "T"],
      [["distribution", "1", "url"], "u"],
    ]);
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
  it("counts open findings by severity, worst first", () => {
    expect(qaSummary(qa)).toEqual({
      count: 2,
      worst: "high",
      bySeverity: { high: 1, medium: 1 },
      outdated: false,
      generated: qa.generated,
    });
    expect(qaSummary(undefined)).toBeNull();
  });

  it("treats ignored and applied findings as resolved, and flags outdated results", () => {
    const summary = qaSummary(
      { ...qa, statuses: { ...qa.statuses, a: { status: "deferred" } } },
      "2026-10-08T00:00:00Z"
    );
    expect(summary).toMatchObject({ count: 1, worst: "high", outdated: true });
  });
});
