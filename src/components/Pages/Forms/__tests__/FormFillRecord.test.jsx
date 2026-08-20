import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/**
 * The whole record path, end to end, without a database:
 *
 *   a route → the routed store → the generated form type → the rendered tabs
 *   → save → the record tree
 *
 * Every layer of this migration meets here, so this is the test that fails if
 * any one of them is wired up wrong.
 */

vi.mock("firebase/database", async () =>
  (await import("../../../../formEngine/__tests__/helpers/fakeRtdb"))
    .fakeDatabaseModule);
vi.mock("../../../../firebase", () => ({ default: {} }));
vi.mock("../../../../auth", () => ({
  auth: {},
  getAuth: () => ({}),
  onAuthStateChanged: () => () => {},
}));
// The cloud functions are not part of what is under test here.
vi.mock("firebase/functions", () => ({
  getFunctions: () => ({}),
  httpsCallable: () => async () => ({ data: {} }),
}));

const { resetDatabase, databaseTree } = await import(
  "../../../../formEngine/__tests__/helpers/fakeRtdb"
);
const { default: FormFill } = await import("../FormFill");
const { UserContext } = await import("../../../../providers/UserProvider");
const { METADATA_RECORD_SLUG } = await import(
  "../../../../formEngine/metadataRecordForm"
);
const recordStore = await import("../../../../formEngine/store/recordFormStore");

const REGION = "pacific";
const USER = "user-1";

const userContext = {
  user: { uid: USER, displayName: "A. Analyst", email: "a@cioos.ca" },
  loggedIn: true,
  isReviewer: false,
  isAdmin: false,
  datacitePrefix: "",
};

function renderAt(path, routePattern) {
  return render(
    <UserContext.Provider value={userContext}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={routePattern}
            element={<FormFill formTypeSlug={METADATA_RECORD_SLUG} />}
          />
        </Routes>
      </MemoryRouter>
    </UserContext.Provider>
  );
}

beforeEach(resetDatabase);

describe("editing a record through the form engine", () => {
  it("renders a new record with every tab from the schema", async () => {
    renderAt(`/en/${REGION}/new`, "/:language/:region/new");

    // The tab strip comes from x-cioos-tab in src/schema, via the generator.
    const tabs = await screen.findAllByRole("tab");
    // A blank record has outstanding fields, so tabs read "Start (3)" — the
    // per-tab error count, which the hand-written form never had.
    const labels = tabs.map((t) => t.textContent.replace(/ \(\d+\)$/, ""));

    expect(labels).toContain("Start");
    expect(labels).toContain("Contacts");
    expect(labels).toContain("Spatial");
    // The panel that is not a set of questions, added as an extra step.
    expect(labels).toContain("Submit");
  });

  it("opens an existing record at its historic owner-scoped URL", async () => {
    const created = await recordStore.createSubmission({
      region: REGION,
      userID: USER,
      data: {
        title: { en: "Salish Sea moorings", fr: "Mouillages" },
        language: "en",
      },
      user: userContext.user,
    });

    renderAt(
      `/en/${REGION}/${USER}/${created.id}`,
      "/:language/:region/:userID/:recordID"
    );

    // Old bookmarks and emailed links have to keep working.
    expect(
      await screen.findByDisplayValue("Salish Sea moorings")
    ).toBeInTheDocument();
  });

  it("lets a reviewer open a record owned by somebody else", async () => {
    const OWNER = "someone-else";
    const created = await recordStore.createSubmission({
      region: REGION,
      userID: OWNER,
      data: { title: { en: "Not mine", fr: "" }, language: "en" },
      user: { displayName: "O", email: "o@cioos.ca" },
    });

    // The owner comes from the URL, not from who is signed in — without that,
    // review and shared-record editing both break.
    renderAt(
      `/en/${REGION}/${OWNER}/${created.id}`,
      "/:language/:region/:userID/:recordID"
    );

    expect(await screen.findByDisplayValue("Not mine")).toBeInTheDocument();
  });

  it("shows how complete the record is", async () => {
    renderAt(`/en/${REGION}/new`, "/:language/:region/new");
    await screen.findAllByRole("tab");
    // percentValid drives this, the same measure the record list shows.
    expect(await screen.findByRole("progressbar")).toBeInTheDocument();
    expect(await screen.findByText(/^\d+%$/)).toBeInTheDocument();
  });

  it("does not nest every question inside a second box", async () => {
    // QuestionFieldTemplate gives each question its own Paper, and paperClass is
    // 90% wide with a 20px margin. Wrapping the form in one more put every
    // question at 81% width behind doubled margins — the "stuffed in a box"
    // look. The hand-written form used a bare Grid for exactly this reason.
    const { container } = renderAt(`/en/${REGION}/new`, "/:language/:region/new");
    await screen.findAllByRole("tab");

    const nested = [...container.querySelectorAll(".MuiPaper-root")].filter(
      (paper) => paper.parentElement?.closest(".MuiPaper-root")
    );
    expect(nested).toHaveLength(0);
  });

  it("shows each question's guidance once, not twice", async () => {
    // QuestionFieldTemplate renders the localized help itself. rjsf ALSO renders
    // the schema description as its own `help` node, so every question showed
    // the same sentence above and below its input.
    const { container } = renderAt(`/en/${REGION}/new`, "/:language/:region/new");
    await screen.findAllByRole("tab");

    const leaves = [...container.querySelectorAll("*")].filter(
      (el) => el.children.length === 0 && el.textContent.trim()
    );
    const counts = leaves.reduce((acc, el) => {
      const text = el.textContent.trim();
      if (text.length > 40) acc[text] = (acc[text] || 0) + 1;
      return acc;
    }, {});
    const duplicated = Object.entries(counts).filter(([, n]) => n > 1);
    expect(duplicated).toEqual([]);
  });

  it("labels the control that adds a row to a repeatable field", async () => {
    // rjsf-mui's default is a bare "+" icon, which on an empty array reads as an
    // empty box with a stray mark in it.
    const { container } = renderAt(`/en/${REGION}/new`, "/:language/:region/new");
    await screen.findAllByRole("tab");
    await userEvent.click(screen.getByRole("tab", { name: /^Contacts/ }));

    const add = container.querySelector('[id$="_add"]');
    expect(add?.textContent).toMatch(/Add/);
  });

  it("gives an enum its full width so the label is not clipped", async () => {
    // A bare MUI Select sizes to content: an empty enum collapsed to a ~60px box
    // showing "Rv." where "Resource type" should be.
    const { container } = renderAt(`/en/${REGION}/new`, "/:language/:region/new");
    await screen.findAllByRole("tab");

    const select = container.querySelector('[id$="_metadataScope"]');
    const control = select?.closest(".MuiFormControl-root");
    expect(control?.className).toMatch(/MuiFormControl-fullWidth/);
  });

  it("writes a saved record into the record tree", async () => {
    const created = await recordStore.createSubmission({
      region: REGION,
      userID: USER,
      data: { title: { en: "Draft", fr: "" }, language: "en" },
      user: userContext.user,
    });

    renderAt(
      `/en/${REGION}/${USER}/${created.id}`,
      "/:language/:region/:userID/:recordID"
    );
    await screen.findByDisplayValue("Draft");

    await waitFor(() => {
      const row = databaseTree()[REGION].users[USER].records[created.id];
      expect(row.title.en).toBe("Draft");
      // Not a JSON blob under `data` — everything downstream reads the fields.
      expect(row.data).toBeUndefined();
    });
  });
});
