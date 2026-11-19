import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { UserContext } from "../../../providers/UserProvider";
import RecordActions from "../RecordActions";
import { reviewerConfig } from "../config";

vi.mock("../../../utils/validate", async (importOriginal) => ({
  ...(await importOriginal()),
  recordIsValid: () => true,
}));

const openPublishingMenu = async (status) => {
  const user = userEvent.setup();
  render(
    <UserContext.Provider value={{}}>
      <RecordActions
        record={{ identifier: "abc", status }}
        recordID="rec1"
        userID="owner1"
        status={status}
        actions={reviewerConfig.actions}
        language="en"
        region="pacific"
      />
    </UserContext.Provider>,
  );
  await user.click(screen.getByRole("button"));
  await user.click(screen.getByText("Publishing"));
};

describe("RecordActions with reviewerConfig (#578)", () => {
  it("offers Submit for review on a draft", async () => {
    await openPublishingMenu("");
    expect(screen.getByText("Submit for review")).toBeInTheDocument();
  });

  it("shows exactly one Return to draft on a submitted record", async () => {
    await openPublishingMenu("submitted");
    expect(screen.getAllByText("Return to draft")).toHaveLength(1);
  });

  it("shows no Return to draft on a published record", async () => {
    await openPublishingMenu("published");
    expect(screen.queryByText("Return to draft")).not.toBeInTheDocument();
  });
});
