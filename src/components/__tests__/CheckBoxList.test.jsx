import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import CheckBoxList from "../FormComponents/CheckBoxList";

describe("<CheckBoxList />", () => {
  const mockOnChange = vi.fn();
  const checkboxInputs = ["theOneRing", "Narya", "Nenya", "Vilya"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Changes the checkbox when clicked", () => {
    render(
      <CheckBoxList
        value={["theOneRing", "Narya"]}
        options={checkboxInputs}
        optionLabels={checkboxInputs}
        onChange={mockOnChange}
      />,
    );

    // Find all checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(4);

    // Click on the first checkbox (theOneRing - which is currently checked)
    fireEvent.click(checkboxes[0]);

    // Since theOneRing was checked and we clicked it, it should be removed
    expect(mockOnChange).toHaveBeenCalledWith(["Narya"]);
  });
});
