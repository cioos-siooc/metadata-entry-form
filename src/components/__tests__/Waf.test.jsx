import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import FileSaver from "file-saver";

import Waf from "../Pages/Waf";

vi.mock("file-saver", () => ({ default: { saveAs: vi.fn() } }));
vi.mock("../../auth", () => ({
  auth: { currentUser: { getIdToken: vi.fn(async () => "id-token") } },
}));

const files = {
  published: [
    { owner: "org-b", basename: "zeta", title: { en: "Zeta survey", fr: "Relevé zêta" }, files: { yaml: "pacific/org-b/zeta.yaml", xml: "pacific/org-b/zeta.xml" }, modified: 1 },
    { owner: "", basename: "loose", files: { xml: "pacific/loose.xml" }, modified: 1 },
    { owner: "org-a", basename: "alpha", files: { erddap: "pacific/org-a/alpha_erddap.xml" }, modified: 1 },
  ],
  unpublished: [
    { owner: "", basename: "draft", files: { xml: "unpublished/pacific/draft.xml" }, modified: 1 },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/en/pacific/waf"]}>
      <Routes>
        <Route path="/:language/:region/waf" element={<Waf />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Waf page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onValue.mockImplementation((ref, callback) => {
      callback({
        val: () => ({ url: "http://localhost:5001/api/" }),
      });
      return () => {};
    });
    global.fetch = vi.fn(async (url) => ({
      ok: true,
      json: async () => files,
      blob: async () => new Blob(["x"]),
      url,
    }));
  });

  it("lists the region files grouped by owner folder with the user's token", async () => {
    renderPage();

    expect(await screen.findByText("Zeta survey")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:5001/api/pacific/?format=records", {
      headers: { Authorization: "Bearer id-token" },
    });
    // owner folders sorted, region folder last
    const folders = screen.getAllByText(/http:\/\/localhost:5001\/api\/pacific\//);
    expect(folders.map((f) => f.textContent)).toEqual([
      "http://localhost:5001/api/pacific/org-a/",
      "http://localhost:5001/api/pacific/org-b/",
      "http://localhost:5001/api/pacific/",
    ]);
    expect(screen.queryByText("draft")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Submitted/ }));
    expect(await screen.findByText("draft")).toBeInTheDocument();
  });

  it("downloads a file with the user's token", async () => {
    renderPage();
    fireEvent.click(await screen.findByText("ERDDAP"));

    await waitFor(() =>
      expect(FileSaver.saveAs).toHaveBeenCalledWith(expect.any(Blob), "alpha_erddap.xml"),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5001/api/pacific/org-a/alpha_erddap.xml",
      { headers: { Authorization: "Bearer id-token" } },
    );
  });

  it("filters by file name", async () => {
    renderPage();
    await screen.findByText("Zeta survey");
    fireEvent.change(screen.getByLabelText(/Filter by title or file name/), {
      target: { value: "ALP" },
    });
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.queryByText("Zeta survey")).not.toBeInTheDocument();
  });

  it("does not send the user's token to an untrusted WAF URL", async () => {
    onValue.mockImplementation((ref, callback) => {
      callback({ val: () => ({ url: "https://attacker.example/" }) });
      return () => {};
    });
    renderPage();

    expect(await screen.findByText(/untrusted WAF URL/)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reads only the WAF settings of the region", () => {
    renderPage();
    expect(ref).toHaveBeenCalledWith(undefined, "admin/pacific/waf");
  });

  it("offers a CKAN harvest only once it is set up", async () => {
    renderPage();
    await screen.findByText("Zeta survey");
    expect(screen.queryByRole("button", { name: /Harvest now/ })).not.toBeInTheDocument();
  });

  it("starts a CKAN harvest and shows the last result", async () => {
    const harvestNow = vi.fn(async () => ({ data: { ok: true } }));
    httpsCallable.mockReturnValue(harvestNow);
    onValue.mockImplementation((ref, callback) => {
      callback({
        val: () => ({
          url: "http://localhost:5001/api/",
          ckan: {
            url: "https://catalogue.example",
            harvestSource: "forms-waf",
            lastHarvest: { ok: false, message: "harvest_job_create: HTTP 403" },
          },
        }),
      });
      return () => {};
    });
    renderPage();

    expect(screen.getByText(/HTTP 403/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Harvest now/ }));
    await waitFor(() => expect(harvestNow).toHaveBeenCalledWith({ region: "pacific" }));
    expect(httpsCallable).toHaveBeenCalledWith(undefined, "harvest_now");
  });
});
