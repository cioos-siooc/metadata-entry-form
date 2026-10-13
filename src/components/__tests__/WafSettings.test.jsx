import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { onValue, push, update } from "firebase/database";

import WafSettings from "../Waf/WafSettings";
import { UserContext } from "../../providers/UserProvider";
import { hashWafToken } from "../../utils/waf";

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(),
  ref: vi.fn((db, path) => path),
  onValue: vi.fn(),
  push: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
  update: vi.fn(async () => {}),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}));

const renderSettings = (isAdmin = true) =>
  render(
    <UserContext.Provider value={{ isAdmin, user: { email: "admin@example.com" } }}>
      <WafSettings region="pacific" />
    </UserContext.Provider>,
  );

describe("WafSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onValue.mockImplementation((path, callback) => {
      callback({
        val: () => ({
          formats: ["xml"],
          tokens: { t1: { name: "ckan", hash: "h", createdBy: "a@b.c" } },
        }),
      });
      return () => {};
    });
  });

  it("stores only the hash of a new token and shows the token once", async () => {
    renderSettings();
    expect(screen.getByText("ckan")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Token name/), { target: { value: "catalogue" } });
    fireEvent.click(screen.getByRole("button", { name: /Create token/ }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    const [path, entry] = push.mock.calls[0];
    expect(path).toEqual("admin/pacific/waf/tokens");
    expect(entry).toMatchObject({ name: "catalogue", createdBy: "admin@example.com" });

    const token = (await screen.findByDisplayValue(/^waf_/)).value;
    expect(entry.hash).toEqual(await hashWafToken(token));
    expect(JSON.stringify(entry)).not.toContain(token);
  });

  it("saves formats and owner folders", async () => {
    renderSettings();
    fireEvent.click(screen.getByLabelText("ERDDAP"));
    fireEvent.click(screen.getByLabelText(/folder per owner organization/));
    fireEvent.click(screen.getByRole("button", { name: /Save WAF settings/ }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("admin/pacific", {
        "waf/formats": ["xml", "erddap"],
        "waf/splitByOwner": true,
        "waf/url": "https://forms.cioos.ca/api/",
      }),
    );
  });

  it("is read-only for reviewers", () => {
    renderSettings(false);
    expect(screen.getByRole("button", { name: /Save WAF settings/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Create token/ })).not.toBeInTheDocument();
  });
});
