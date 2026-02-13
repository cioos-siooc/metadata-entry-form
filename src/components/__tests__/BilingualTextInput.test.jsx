import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

import BilingualTextInput from "../FormComponents/BilingualTextInput";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({
      language: "en",
    }),
  };
});

describe("<BilingualTextInput />", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Updates the text when it is typed in", () => {
    render(
      <MemoryRouter>
        <BilingualTextInput onChange={mockOnChange} />
      </MemoryRouter>
    );

    // Find the English text input field
    const textFields = screen.getAllByRole("textbox");
    expect(textFields.length).toBeGreaterThan(0);

    // Simulate typing in the first text field
    fireEvent.change(textFields[0], { target: { value: "test", name: "en" } });
    expect(mockOnChange).toHaveBeenCalled();
  });
});
