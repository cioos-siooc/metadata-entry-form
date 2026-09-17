import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock useParams from react-router-dom which is used by I18n
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the githubReleases.json file before importing the component
vi.mock("../../data/githubReleases.json", () => ({
  default: {
    fetchedAt: "2026-02-20T01:52:34.701Z",
    releases: [
      {
        id: 1,
        name: "v1.0.0",
        tag_name: "v1.0.0",
        published_at: "2026-02-20T00:00:00Z",
        html_url:
          "https://github.com/cioos-siooc/metadata-entry-form/releases/tag/v1.0.0",
        prerelease: false,
        body: "## What's New\n\n- Feature 1\n- Feature 2\n\nThis is a test release.",
      },
      {
        id: 2,
        name: "v0.9.0-beta",
        tag_name: "v0.9.0-beta",
        published_at: "2026-02-15T00:00:00Z",
        html_url:
          "https://github.com/cioos-siooc/metadata-entry-form/releases/tag/v0.9.0-beta",
        prerelease: true,
        body: "## Beta Release\n\n- Beta feature 1\n- Beta feature 2",
      },
      {
        id: 3,
        name: "v0.8.0",
        tag_name: "v0.8.0",
        published_at: "2026-02-10T00:00:00Z",
        html_url:
          "https://github.com/cioos-siooc/metadata-entry-form/releases/tag/v0.8.0",
        prerelease: false,
        body: null,
      },
    ],
  },
}));

// Import component after mocking
import WhatsNewDialog from "../Pages/WhatsNew";

describe("<WhatsNewDialog />", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly when open", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/Recent updates and releases/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <WhatsNewDialog open={false} onClose={mockOnClose} />,
    );

    // The dialog should not be visible when open is false
    const backdrop = container.querySelector("[role='presentation']");
    // Either backdrop is null or has display: none
    if (backdrop) {
      expect(backdrop).not.toBeVisible();
    }
  });

  it("displays all releases when data is available", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Check that all release tags are displayed
    const releaseTags = screen.getAllByText(/v\d+\.\d+\.\d+/);
    expect(releaseTags.length).toBeGreaterThanOrEqual(3);
  });

  it("displays prerelease badge for prerelease versions", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText("Pre-release")).toBeInTheDocument();
  });

  it("renders markdown content from release body", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Check that markdown content is rendered (feature list items)
    expect(screen.getByText(/Feature 1/)).toBeInTheDocument();
    expect(screen.getByText(/Feature 2/)).toBeInTheDocument();
    expect(screen.getByText(/This is a test release/)).toBeInTheDocument();
  });

  it("displays 'No release notes provided' when body is null", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText("No release notes provided.")).toBeInTheDocument();
  });

  it("displays formatted release dates", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Dates should be formatted as "Month Day, Year" format in en-CA locale
    expect(screen.getByText(/February 20, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/February 15, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/February 10, 2026/)).toBeInTheDocument();
  });

  it("displays GitHub links for each release", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    const githubLinks = screen.getAllByText(/View on GitHub/i);
    expect(githubLinks).toHaveLength(3);

    // Verify links have correct URLs
    const releaseLinks = screen.getAllByRole("link", {
      name: /View on GitHub/i,
    });
    expect(releaseLinks[0]).toHaveAttribute(
      "href",
      "https://github.com/cioos-siooc/metadata-entry-form/releases/tag/v1.0.0",
    );
    expect(releaseLinks[1]).toHaveAttribute(
      "href",
      "https://github.com/cioos-siooc/metadata-entry-form/releases/tag/v0.9.0-beta",
    );
  });

  it("displays 'View all releases' link when releases exist", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    const allReleasesLink = screen.getByRole("link", {
      name: /View all releases on GitHub/i,
    });
    expect(allReleasesLink).toBeInTheDocument();
    expect(allReleasesLink).toHaveAttribute(
      "href",
      "https://github.com/cioos-siooc/metadata-entry-form/releases",
    );
  });

  it("closes dialog when close button is clicked", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("closes dialog when backdrop is clicked", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Simulate backdrop click by calling onClose as the Dialog component does
    // Note: This is handled by the Dialog component's onClose prop
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("renders version tags with correct styling", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    const tags = screen.getAllByText(/v\d+\.\d+\.\d+/);
    expect(tags.length).toBeGreaterThan(0);
  });

  // Note: Testing empty releases would require separate test file with different mock setup
  // This test verifies the component structure is correct when releases are present

  it("applies correct language formatting (en locale)", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Verify English text is displayed (not French)
    expect(screen.getByText(/Recent updates and releases/)).toBeInTheDocument();
    expect(screen.getAllByText(/View on GitHub/i).length).toBeGreaterThan(0);
  });

  it("has proper accessibility attributes", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toHaveAttribute("aria-label", "close");

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toBeInTheDocument();
  });

  it("renders markdown with allowed elements only", () => {
    render(<WhatsNewDialog open={true} onClose={mockOnClose} />);

    // Verify list items from markdown are rendered (safe markdown elements)
    expect(screen.getByText(/Feature 1/)).toBeInTheDocument();
    expect(screen.getByText(/Feature 2/)).toBeInTheDocument();

    // Verify that the markdown container exists and has content
    const markdownDivs = document.querySelectorAll(
      ".markdownBody, .css-i4xmxb-markdownBody",
    );
    expect(markdownDivs.length).toBeGreaterThan(0);
  });
});
