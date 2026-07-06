import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Submissions from "../Pages/Submissions";
import { UserContext } from "../../providers/UserProvider";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ region: "pacific", language: "en" }),
  };
});

vi.mock("../../api/records", async () => {
  // Records from the API arrive pre-standardized (all blank-record fields
  // filled in), so build the fixture the same way.
  const { getBlankRecord } = await import("../../utils/blankRecord");
  const fixtureRecord = {
    ...getBlankRecord(),
    recordID: "record-1",
    status: "",
    title: { en: "My test record", fr: "Mon dossier de test" },
    created: "2024-01-01T00:00:00.000Z",
    userinfo: {
      userID: "test-user",
      email: "test@example.org",
      displayName: "Test User",
    },
  };
  return {
    loadUserRecords: vi.fn().mockResolvedValue([fixtureRecord]),
    cloneRecord: vi.fn().mockResolvedValue({}),
    deleteRecord: vi.fn().mockResolvedValue({}),
    submitRecord: vi.fn().mockResolvedValue({}),
    returnRecordToDraft: vi.fn().mockResolvedValue({}),
  };
});

const theme = createTheme();

const userContextValue = {
  user: { uid: "test-user", email: "test@example.org" },
  authIsLoading: false,
  loggedIn: true,
};

describe("<Submissions />", () => {
  it("Renders", async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <UserContext.Provider value={userContextValue}>
            <Submissions
              match={{ params: { region: "pacific", language: "en" } }}
            />
          </UserContext.Provider>
        </MemoryRouter>
      </ThemeProvider>,
    );

    // Verify component renders - check for "My Records" heading
    expect(
      screen.getByRole("heading", { name: /my records/i }),
    ).toBeInTheDocument();

    // Records loaded via the API mock are rendered
    expect(await screen.findByText(/my test record/i)).toBeInTheDocument();
  });
});
