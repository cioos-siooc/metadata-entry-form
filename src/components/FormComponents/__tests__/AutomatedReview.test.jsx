import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import AutomatedReview from "../AutomatedReview";
import { UserContext } from "../../../providers/UserProvider";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific", userID: "u1", recordID: "r1" }),
  };
});

const renderWith = (reviewRecord) =>
  render(
    <UserContext.Provider value={{ reviewRecord }}>
      <AutomatedReview record={{ title: { en: "t" } }} />
    </UserContext.Provider>
  );

describe("<AutomatedReview />", () => {
  it("sends the record and renders each finding", async () => {
    const reviewRecord = vi.fn().mockResolvedValue({
      data: {
        findings: [
          { id: "a", severity: "medium", field: "license", description: "Dataset has no license.", recommendation: "Set a license." },
          { id: "b", severity: "high", field: "https://x.test", description: "URL unreachable.", recommendation: "Fix it." },
        ],
      },
    });
    renderWith(reviewRecord);
    fireEvent.click(screen.getByRole("button", { name: /run automated review/i }));

    expect(await screen.findByText("Dataset has no license.")).toBeTruthy();
    expect(screen.getByText("URL unreachable.")).toBeTruthy();
    expect(reviewRecord).toHaveBeenCalledWith({
      record: { title: { en: "t" } },
      region: "pacific",
      userID: "u1",
      recordID: "r1",
    });
  });

  it("shows an error when the review fails", async () => {
    renderWith(vi.fn().mockRejectedValue(new Error("down")));
    fireEvent.click(screen.getByRole("button", { name: /run automated review/i }));
    expect(await screen.findByText(/could not be completed/i)).toBeTruthy();
  });
});
