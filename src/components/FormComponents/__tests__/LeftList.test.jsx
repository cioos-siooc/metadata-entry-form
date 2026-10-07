import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import LeftList from "../LeftList";
import ContactTitle from "../ContactTitle";

// <En>/<Fr> render based on the :language route param.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

const theme = createTheme();

// Firebase push keys are chronological, so this is the order the app receives.
const savedContacts = {
  key1: { lastName: "Zhang", givenNames: "Wei" },
  key2: { orgName: "Acme Oceanography" },
  key3: {},
  key4: { lastName: "Martin", givenNames: "Ana", orgName: "DFO" },
};

const renderLeftList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <LeftList
          items={[]}
          updateItems={vi.fn()}
          activeItem={0}
          setActiveItem={vi.fn()}
          savedUserItems={savedContacts}
          getBlankItem={() => ({})}
          itemTitle={ContactTitle}
          uidFields={["lastName", "orgName"]}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("<LeftList />", () => {
  it("lists saved items alphabetically, blank entries first", async () => {
    const user = userEvent.setup();
    renderLeftList();

    await user.click(screen.getByRole("combobox"));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    // First option is the "ADD SAVED ITEM" placeholder.
    expect(options.slice(1).map((o) => o.textContent)).toEqual([
      "New contact",
      "Acme Oceanography",
      "Martin, Ana - DFO",
      "Zhang, Wei",
    ]);
  });
});
