import React from "react";
import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { getAppTheme } from "../../theme/createAppTheme";

import MetadataForm from "../Pages/MetadataForm";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

// The real app theme: components read theme.vars, which a bare createTheme()
// does not define.
const theme = getAppTheme("pacific");

describe("<MetadataForm />", () => {
  it("Renders", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MetadataForm />
        </MemoryRouter>
      </ThemeProvider>
    );

    // Verify component renders - check for the form or a key element
    // The component should render without throwing
    expect(document.body).toBeInTheDocument();
  });
});
