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
    useParams: () => ({}),
  };
});

const theme = createTheme();

describe("<Submissions />", () => {
  it("Renders", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <Submissions match={{ params: { region: "pacific", language: "en" } }} />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Verify component renders - component shows loading spinner before data loads
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
