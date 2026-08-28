import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SharedUsersList from "../SharedUsersList";
import { UserContext } from "../../../providers/UserProvider";

// <En>/<Fr> render based on the :language route param.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

const theme = createTheme();

const shareRecord = vi.fn();
const unshareRecord = vi.fn();

const renderList = (record) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <UserContext.Provider value={{ shareRecord, unshareRecord }}>
          <SharedUsersList
            region="pacific"
            record={{ recordID: "rec1", language: "en", ...record }}
          />
        </UserContext.Provider>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  shareRecord.mockResolvedValue({ data: { status: "shared", emailSent: true } });
  unshareRecord.mockResolvedValue({ data: { status: "unshared" } });
});

describe("<SharedUsersList />", () => {
  it("rejects an invalid address without calling the server", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByRole("textbox"), "not-an-email");

    expect(screen.getByText("Please enter a valid email address.")).toBeVisible();
    expect(screen.getByRole("button", { name: /Share Record/ })).toBeDisabled();
    expect(shareRecord).not.toHaveBeenCalled();
  });

  it("shares with a valid address", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByRole("textbox"), " Editor@cioos.ca ");
    await user.click(screen.getByRole("button", { name: /Share Record/ }));

    expect(shareRecord).toHaveBeenCalledWith({
      region: "pacific",
      recordID: "rec1",
      email: "Editor@cioos.ca",
      language: "en",
    });
    await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
  });

  it("cannot share a record that hasn't been saved yet", async () => {
    const user = userEvent.setup();
    renderList({ recordID: "" });

    await user.type(screen.getByRole("textbox"), "editor@cioos.ca");

    expect(screen.getByRole("button", { name: /Share Record/ })).toBeDisabled();
  });

  it("lists current editors, pending invitations, and legacy shares", () => {
    renderList({
      sharedWith: { uid1: "editor@cioos.ca", legacyuid456: true },
      pendingShares: { "newcomer@example,org": "newcomer@example.org" },
    });

    expect(screen.getByText("editor@cioos.ca")).toBeVisible();
    expect(screen.getByText("newcomer@example.org")).toBeVisible();
    expect(screen.getByText("Invitation sent")).toBeVisible();
    expect(screen.getByText("Unknown user (legacy…)")).toBeVisible();
  });

  it("removes an editor by user ID and an invitation by key", async () => {
    const user = userEvent.setup();
    renderList({
      sharedWith: { uid1: "editor@cioos.ca" },
      pendingShares: { "newcomer@example,org": "newcomer@example.org" },
    });

    const [removeEditor, removeInvite] = screen.getAllByRole("button", {
      name: "delete",
    });

    await user.click(removeEditor);
    expect(unshareRecord).toHaveBeenCalledWith({
      region: "pacific",
      recordID: "rec1",
      uid: "uid1",
    });

    await user.click(removeInvite);
    expect(unshareRecord).toHaveBeenCalledWith({
      region: "pacific",
      recordID: "rec1",
      inviteKey: "newcomer@example,org",
    });
  });
});
