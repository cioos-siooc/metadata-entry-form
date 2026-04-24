import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import Submissions from "../Pages/Submissions";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ region: "pacific", language: "en" }),
  };
});

vi.mock("../../providers/UserProvider", () => ({
  UserContext: React.createContext({ user: { displayName: "Test" } }),
  default: ({ children }) => children,
}));

const theme = createTheme();

describe("<Submissions />", () => {
  it("Renders the dashboard entry point", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Submissions match={{ params: { region: "pacific", language: "en" } }} />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Dashboard surfaces a primary "New record" CTA and a welcome heading.
    expect(
      screen.getByRole("button", { name: /new record/i })
    ).toBeInTheDocument();
  });
});
