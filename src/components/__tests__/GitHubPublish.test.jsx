import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { onValue } from "firebase/database";

import GitHubPublishDialog from "../Dialogs/GitHubPublishDialog";

// Mock useParams from react-router-dom which is used by I18n
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

// Mock Firebase onValue to return environments
vi.mock("firebase/database", async () => {
  const actual = await vi.importActual("firebase/database");
  return {
    ...actual,
    getDatabase: vi.fn(),
    ref: vi.fn(),
    onValue: vi.fn(),
  };
});

vi.mock("../../firebase", () => ({ default: {} }));

describe("<GitHubPublishDialog />", () => {
  const mockOnClose = vi.fn();
  const mockOnPublish = vi.fn();
  const region = "hakai";
  const environments = ["prod", "dev", "test"];

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup onValue mock to return our environments immediately
    onValue.mockImplementation((ref, callback) => {
      callback({
        val: () => ({ environments }),
        exists: () => true,
      });
      return vi.fn(); // unsubscribe function
    });
  });

  it("renders correctly when open", () => {
    render(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />,
    );

    expect(screen.getByText("Publish to GitHub")).toBeInTheDocument();
  });

  it("displays checkboxes for each environment fetched from firebase", async () => {
    render(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />,
    );

    await waitFor(() => {
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(environments.length);
    });
  });

  it("updates selected environments state on change", async () => {
    render(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(environments.length);
    });

    // Click the first checkbox (prod)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Click the Publish button
    const publishButton = screen.getByRole("button", { name: /Publish/i });
    fireEvent.click(publishButton);

    // Expected: ['prod'] and the default commit message
    expect(mockOnPublish).toHaveBeenCalledWith(
      ["prod"],
      expect.stringContaining("Publish metadata record"),
    );
  });

  it("calls onPublish with custom commit message", async () => {
    render(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("checkbox")).toHaveLength(environments.length);
    });

    // Select an environment (dev - second checkbox)
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);

    // Type a commit message - find the textbox
    const textField = screen.getByRole("textbox");
    fireEvent.change(textField, { target: { value: "fix: updated metadata" } });

    // Click the Publish button
    const publishButton = screen.getByRole("button", { name: /Publish/i });
    fireEvent.click(publishButton);

    expect(mockOnPublish).toHaveBeenCalledWith(
      ["dev"],
      "fix: updated metadata",
    );
  });

  it("shows loading state when loading is true", () => {
    render(
      <GitHubPublishDialog
        open={true}
        onClose={mockOnClose}
        onPublish={mockOnPublish}
        region={region}
        loading={true}
      />,
    );

    // Should show CircularProgress (via the progressbar role)
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    // Should NOT show checkboxes
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
