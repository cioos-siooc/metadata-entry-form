import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { onValue, ref } from "firebase/database";
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
});
