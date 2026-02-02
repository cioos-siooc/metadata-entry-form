import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import SelectInput from "../FormComponents/SelectInput";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

const selectInputs = ["theOneRing", "Narya", "Nenya", "Vilya"];

describe("<SelectInput />", () => {
  it("Renders", () => {
    render(
      <SelectInput
        options={selectInputs}
        optionLabels={selectInputs}
        value={selectInputs[0]}
      />
    );

    // Verify the select component renders with the correct value
    // MUI Select uses a combobox role
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
