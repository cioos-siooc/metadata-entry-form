import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import SavedItemSelect from "../SavedItemSelect";
import ContactTitle from "../ContactTitle";

// <En>/<Fr> render based on the :language route param.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

// Firebase push keys are chronological, so this is the order the app receives.
const savedContacts = {
  key1: { lastName: "Zhang", givenNames: "Wei", role: ["owner"] },
  key2: { orgName: "Acme Oceanography" },
  key3: {},
  key4: { lastName: "Martin", givenNames: "Ana", orgName: "DFO" },
};

const renderSelect = (onAdd = vi.fn()) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <SavedItemSelect
          savedItems={savedContacts}
          itemTitle={ContactTitle}
          getBlankItem={() => ({ inCitation: false, role: [] })}
          onAdd={onAdd}
          ariaLabel="Search saved contacts"
        />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("<SavedItemSelect />", () => {
  it("lists saved items alphabetically, blank entries first", async () => {
    const user = userEvent.setup();
    renderSelect();

    await user.click(
      screen.getByRole("combobox", { name: "Search saved contacts" }),
    );
    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options.map((o) => o.textContent)).toEqual([
      "New contact",
      "Acme Oceanography",
      "Martin, Ana - DFO",
      "Zhang, Wei",
    ]);
  });

  it("adds a copy over the blank item, without the saved role", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderSelect(onAdd);

    // Typing narrows the list.
    await user.type(screen.getByRole("combobox"), "zha");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "Zhang, Wei" }));

    expect(onAdd).toHaveBeenCalledWith({
      inCitation: false,
      role: [],
      lastName: "Zhang",
      givenNames: "Wei",
    });
  });
});
