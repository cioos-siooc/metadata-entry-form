import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

import SchemaForm from "../SchemaForm/SchemaForm";
import { UserContext } from "../../providers/UserProvider";

// Smoke test doubling as the RJSF v6 + React 19 + MUI v7 compatibility canary.

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", title: "Station name" },
    kind: { type: "string", title: "Kind", enum: ["buoy", "glider"] },
    summary: {
      type: "object",
      title: "Summary",
      properties: {
        en: { type: "string" },
        fr: { type: "string" },
      },
    },
  },
  required: ["name"],
};

const UI_SCHEMA = {
  summary: { "ui:field": "bilingualText" },
};

function renderForm(props = {}) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{ translate: vi.fn() }}>
        <SchemaForm jsonSchema={SCHEMA} uiSchema={UI_SCHEMA} {...props} />
      </UserContext.Provider>
    </MemoryRouter>,
  );
}

describe("<SchemaForm />", () => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders fields from the JSON Schema", () => {
    renderForm();
    expect(screen.getByLabelText(/Station name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kind/)).toBeInTheDocument();
  });

  it("propagates typing through onChange", () => {
    renderForm({ onChange });
    fireEvent.change(screen.getByLabelText(/Station name/), {
      target: { value: "Buoy 7" },
    });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)[0];
    expect(lastCall.name).toBe("Buoy 7");
  });

  it("blocks submit and shows an error when a required field is missing", async () => {
    renderForm({ onSubmit });
    fireEvent.submit(screen.getByRole("button", { name: /submit/i }).closest("form"));
    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThan(0);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data", async () => {
    renderForm({ onSubmit, formData: { name: "Buoy 7" } });
    fireEvent.submit(screen.getByRole("button", { name: /submit/i }).closest("form"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "Buoy 7" });
  });

  it("renders the bilingual custom field for ui:field bilingualText", () => {
    renderForm();
    // BilingualTextInput renders EN and FR adornments
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("FR")).toBeInTheDocument();
  });
});
