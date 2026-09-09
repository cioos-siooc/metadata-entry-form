import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import Submissions from "../Pages/Submissions";
import { getAppTheme } from "../../theme/createAppTheme";

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

// The real app theme: components read theme.vars, which a bare createTheme()
// does not define.
const theme = getAppTheme("pacific");

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
