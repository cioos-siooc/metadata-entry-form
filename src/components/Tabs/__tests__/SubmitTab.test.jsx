import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { UserContext } from "../../../providers/UserProvider";
import SubmitTab from "../SubmitTab";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

// Treat the record as complete so the Submit button's visibility depends only on who is viewing.
vi.mock("../../../utils/validate", () => ({
  getErrorsByTab: () => ({}),
  recordIsValid: () => true,
  warnings: {},
  validateFieldWarning: async () => false,
}));

const renderAs = (userID, context = {}) =>
  render(
    <UserContext.Provider
      value={{ isReviewer: false, isAdmin: false, ...context }}
    >
      <MemoryRouter>
        <SubmitTab
          record={{ userID: "owner1", status: "" }}
          submitRecord={vi.fn()}
          userID={userID}
        />
      </MemoryRouter>
    </UserContext.Provider>,
  );

const submitButton = () => screen.queryByRole("button", { name: /^submit$/i });

describe("SubmitTab submit button (#578)", () => {
  it("shows for the owner", () => {
    renderAs("owner1");
    expect(submitButton()).toBeInTheDocument();
  });

  it("shows for a reviewer", () => {
    renderAs("someoneElse", { isReviewer: true });
    expect(submitButton()).toBeInTheDocument();
  });

  it("shows for an admin", () => {
    renderAs("someoneElse", { isAdmin: true });
    expect(submitButton()).toBeInTheDocument();
  });

  it("is hidden from other users", () => {
    renderAs("someoneElse");
    expect(submitButton()).not.toBeInTheDocument();
  });
});
