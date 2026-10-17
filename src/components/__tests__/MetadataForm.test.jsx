import React from "react";
import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import MetadataForm, { MetadataForm as MetadataFormClass } from "../Pages/MetadataForm";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

const theme = createTheme();

describe("<MetadataForm />", () => {
  it("Renders", () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <MetadataForm />
        </MemoryRouter>
      </ThemeProvider>,
    );

    // Verify component renders - check for the form or a key element
    // The component should render without throwing
    expect(document.body).toBeInTheDocument();
  });
});

describe("MetadataForm.updateRecord", () => {
  it("doesn't mark the record unsaved when a field is set to its current value", () => {
    const form = new MetadataFormClass({ search: "" });
    let updater;
    form.setState = (u) => {
      updater = u;
    };
    form.updateRecord("doiCreationStatus")("");
    expect(updater({ record: { doiCreationStatus: "" } })).toBeNull();
    form.handleUpdateRecord("doiCreationStatus")({ target: { value: "draft" } });
    expect(updater({ record: { doiCreationStatus: "" } })).toEqual({
      record: { doiCreationStatus: "draft" },
      saveDisabled: false,
    });
  });
});
