import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";

import OfflineBanner from "../OfflineBanner";

describe("<OfflineBanner />", () => {
  it("appears when the browser goes offline and hides when back online", () => {
    render(
      <MemoryRouter initialEntries={["/en/region-select"]}>
        <OfflineBanner />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByText(/You are offline/)).not.toBeInTheDocument();
  });
});
