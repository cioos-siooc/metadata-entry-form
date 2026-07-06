import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import RegionsProvider, { useRegions } from "../RegionsProvider";
import regions from "../../regions";
import * as regionsApi from "../../api/regions";

vi.mock("../../api/regions", () => ({
  getRegions: vi.fn(),
}));

function Probe() {
  const { regions: contextRegions, regionsLoaded } = useRegions();
  return (
    <div>
      <span data-testid="loaded">{String(regionsLoaded)}</span>
      <span data-testid="pacific-title">{contextRegions.pacific?.title?.en}</span>
      <span data-testid="new-region">{contextRegions["api-only"]?.title?.en || "none"}</span>
    </div>
  );
}

describe("<RegionsProvider />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete regions["api-only"];
  });

  it("blocks children until the fetch settles, then merges API config", async () => {
    regionsApi.getRegions.mockResolvedValue({
      regions: {
        pacific: { title: { en: "CIOOS Pacific (API)" } },
        "api-only": { title: { en: "Brand New Region" }, showInRegionSelector: true },
      },
    });

    render(
      <RegionsProvider>
        <Probe />
      </RegionsProvider>,
    );

    // gated behind a spinner until the fetch resolves
    expect(screen.queryByTestId("loaded")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    expect(screen.getByTestId("pacific-title")).toHaveTextContent("CIOOS Pacific (API)");
    expect(screen.getByTestId("new-region")).toHaveTextContent("Brand New Region");
    // static imports observe the same object
    expect(regions["api-only"].title.en).toBe("Brand New Region");
    // untouched static keys survive the merge
    expect(regions.pacific.colors.primary).toBeTruthy();
  });

  it("falls back to the bundled config when the API fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    regionsApi.getRegions.mockRejectedValue(new Error("network down"));

    render(
      <RegionsProvider>
        <Probe />
      </RegionsProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loaded")).toHaveTextContent("true"));
    expect(screen.getByTestId("new-region")).toHaveTextContent("none");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
