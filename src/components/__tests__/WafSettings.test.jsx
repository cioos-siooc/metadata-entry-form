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
      expect(update).toHaveBeenCalledWith(undefined, {
        "admin/pacific/waf/formats": ["xml", "erddap"],
        "admin/pacific/waf/splitByOwner": true,
        "admin/pacific/waf/url": "https://forms.cioos.ca/api/",
        "admin/pacific/waf/ckan/url": null,
        "admin/pacific/waf/ckan/harvestSource": null,
        "wafSecrets/pacific/ckanToken": null,
        "admin/pacific/waf/ckan/tokenUpdatedAt": null,
      }),
    );
  });

  const fillCkan = ({ url, source, token }) => {
    if (url !== undefined)
      fireEvent.change(screen.getByLabelText(/^CKAN URL/), { target: { value: url } });
    if (source !== undefined)
      fireEvent.change(screen.getByLabelText(/Harvest source/), { target: { value: source } });
    if (token !== undefined)
      fireEvent.change(screen.getByLabelText(/CKAN API token/), { target: { value: token } });
    fireEvent.click(screen.getByRole("button", { name: /Save WAF settings/ }));
  };

  it("stores the CKAN token apart from the settings reviewers can read", async () => {
    renderSettings();
    fillCkan({ url: "https://catalogue.example", source: "forms-waf", token: "ckan-secret" });

    await waitFor(() => expect(update).toHaveBeenCalled());
    const changes = update.mock.calls[0][1];
    expect(changes).toMatchObject({
      "admin/pacific/waf/ckan/url": "https://catalogue.example",
      "admin/pacific/waf/ckan/harvestSource": "forms-waf",
      "admin/pacific/waf/ckan/tokenUpdatedAt": "SERVER_TIMESTAMP",
      "wafSecrets/pacific/ckanToken": "ckan-secret",
    });
    const visible = Object.entries(changes).filter(([path]) => path.startsWith("admin/"));
    expect(JSON.stringify(visible)).not.toContain("ckan-secret");
  });

  it("keeps the saved CKAN token for the same catalogue only", async () => {
    onValue.mockImplementation((path, callback) => {
      callback({
        val: () => ({
          ckan: {
            url: "https://catalogue.example",
            harvestSource: "forms-waf",
            tokenUpdatedAt: 1,
          },
        }),
      });
      return () => {};
    });
    renderSettings();

    fillCkan({ source: "other-source" });
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][1]).not.toHaveProperty("wafSecrets/pacific/ckanToken");

    update.mockClear();
    fillCkan({ url: "https://elsewhere.example" });
    expect(await screen.findByText(/Enter the CKAN API token/)).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a CKAN URL without https", async () => {
    renderSettings();
    fillCkan({ url: "http://catalogue.example", source: "waf", token: "t" });
    expect(await screen.findByText(/must start with https/)).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("is read-only for reviewers", () => {
    renderSettings(false);
    expect(screen.getByRole("button", { name: /Save WAF settings/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Create token/ })).not.toBeInTheDocument();
  });

  it("refuses a WAF URL on another host", async () => {
    renderSettings();
    fireEvent.change(screen.getByLabelText(/WAF URL/), {
      target: { value: "https://attacker.example/" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save WAF settings/ }));

    expect(await screen.findByText(/must be on forms\.cioos\.ca/)).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("shows no form when the settings cannot be read", () => {
    onValue.mockImplementation((path, callback, onError) => {
      onError(new Error("permission_denied"));
      return () => {};
    });
    renderSettings();

    expect(screen.getByText(/permission_denied/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Save WAF settings/ })).not.toBeInTheDocument();
  });
});
