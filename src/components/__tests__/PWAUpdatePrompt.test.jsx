import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

const setNeedRefresh = vi.fn();
const updateServiceWorker = vi.fn();
let needRefresh = true;

// factory form: vitest never resolves the real virtual module
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

import PWAUpdatePrompt from "../PWAUpdatePrompt";

describe("<PWAUpdatePrompt />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    needRefresh = true;
  });

  it("offers a reload when a new version is waiting", () => {
    render(
      <MemoryRouter initialEntries={["/en/region-select"]}>
        <PWAUpdatePrompt />
      </MemoryRouter>,
    );

    expect(screen.getByText(/new version is available/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reload/i }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("renders nothing when no update is waiting", () => {
    needRefresh = false;
    render(
      <MemoryRouter initialEntries={["/en/region-select"]}>
        <PWAUpdatePrompt />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/new version is available/)).not.toBeInTheDocument();
  });
});
