import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

import RecordActions from "../RecordActions";
import { reviewerConfig } from "../config";
import { UserContext } from "../../../providers/UserProvider";

vi.mock("../../../firebase", () => ({ default: {} }));
vi.mock("../../../utils/validate", () => ({ recordIsValid: () => true }));

const openPublishingMenu = (status) => {
  render(
    <UserContext.Provider value={{}}>
      <RecordActions
        record={{ identifier: "abc" }}
        recordID="r1"
        userID="u1"
        status={status}
        actions={reviewerConfig.actions}
        language="en"
        region="pacific"
      />
    </UserContext.Provider>,
  );
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(screen.getByText("Publishing"));
};

describe("RecordActions with reviewerConfig", () => {
  it("offers Submit for review on a draft", () => {
    openPublishingMenu("");
    expect(screen.getByText("Submit for review")).toBeInTheDocument();
    expect(screen.queryByText("Return to draft")).not.toBeInTheDocument();
  });

  it("shows exactly one Return to draft on a submitted record", () => {
    openPublishingMenu("submitted");
    expect(screen.getAllByText("Return to draft")).toHaveLength(1);
    expect(screen.queryByText("Submit for review")).not.toBeInTheDocument();
  });

  it("shows no Return to draft on a published record", () => {
    openPublishingMenu("published");
    expect(screen.queryByText("Return to draft")).not.toBeInTheDocument();
  });
});
