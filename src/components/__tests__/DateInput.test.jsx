import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";

import DateInput from "../FormComponents/DateInput";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({
      language: "en",
    }),
  };
});

describe("<DateInput />", () => {
  const mockOnChange = vi.fn();
  const mockEventValue = new Date("2021-10-08T12:00:00.000");
  const mockComponentName = "date";

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2021-10-08T12:00:00.000"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Renders the date picker component", () => {
    render(
      <DateInput
        value={mockEventValue}
        name={mockComponentName}
        onChange={mockOnChange}
      />
    );

    // Check that the date picker rendered
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
