import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import TransferModal from "../TransferModal";

// <En>/<Fr> render based on the :language route param.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

const onAccept = vi.fn();
const onClose = vi.fn();

const regionOptions = [
  { value: "pacific", label: "CIOOS Pacific" },
  { value: "atlantic", label: "CIOOS Atlantic" },
];

function Harness({ initialEmail }) {
  const [email, setEmail] = useState(initialEmail);
  const [destinationRegion, setDestinationRegion] = useState("pacific");
  return (
    <TransferModal
      open
      onClose={onClose}
      onAccept={() => onAccept(destinationRegion)}
      email={email}
      setEmail={setEmail}
      region="pacific"
      regionOptions={regionOptions}
      destinationRegion={destinationRegion}
      setDestinationRegion={setDestinationRegion}
    />
  );
}

const renderModal = (initialEmail = "new@cioos.ca") =>
  render(
    <ThemeProvider theme={createTheme()}>
      <MemoryRouter>
        <Harness initialEmail={initialEmail} />
      </MemoryRouter>
    </ThemeProvider>,
  );

const chooseAtlantic = async (user) => {
  await user.click(screen.getByRole("combobox"));
  await user.click(screen.getByRole("option", { name: "CIOOS Atlantic" }));
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("<TransferModal />", () => {
  it("transfers to the chosen region and closes", async () => {
    const user = userEvent.setup();
    onAccept.mockResolvedValue({ success: true });
    renderModal();

    await chooseAtlantic(user);
    expect(
      screen.getByText(/sent to that region's reviewers/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(onAccept).toHaveBeenCalledWith("atlantic");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("keeps the owner when moving region without an email", async () => {
    const user = userEvent.setup();
    onAccept.mockResolvedValue({ success: true });
    renderModal("");

    const transferButton = screen.getByRole("button", { name: "Transfer" });
    expect(transferButton).toBeDisabled();

    await chooseAtlantic(user);
    expect(screen.getByText(/keep the current owner/)).toBeInTheDocument();
    await user.click(transferButton);

    expect(onAccept).toHaveBeenCalledWith("atlantic");
  });

  it("explains why a record with a DOI can't move", async () => {
    const user = userEvent.setup();
    onAccept.mockResolvedValue({ success: false, reason: "has-doi" });
    renderModal();

    await chooseAtlantic(user);
    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(
      await screen.findByText(/has a DOI from this region's DataCite/),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the error of a refused transfer", async () => {
    const user = userEvent.setup();
    onAccept.mockRejectedValue(
      new Error("User must be an admin or reviewer of atlantic."),
    );
    renderModal();

    await user.click(screen.getByRole("button", { name: "Transfer" }));

    expect(
      await screen.findByText("User must be an admin or reviewer of atlantic."),
    ).toBeInTheDocument();
  });
});
