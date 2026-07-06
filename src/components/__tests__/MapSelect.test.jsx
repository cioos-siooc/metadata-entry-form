import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

import MapSelect from "../FormComponents/MapSelect";
import { UserContext } from "../../providers/UserProvider";

// Leaflet needs a real DOM/canvas; mock the map pieces
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  FeatureGroup: ({ children }) => <div>{children}</div>,
  Polygon: () => null,
  Rectangle: () => null,
}));
vi.mock("../FormComponents/GeomanControl", () => ({ default: () => null }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ language: "en" }) };
});

function mockGeolocation(impl) {
  Object.defineProperty(global.navigator, "geolocation", {
    value: impl,
    configurable: true,
  });
}

function renderMapSelect(props = {}) {
  return render(
    <MemoryRouter>
      <UserContext.Provider value={{ translate: vi.fn() }}>
        <MapSelect updateMap={vi.fn()} mapData={{}} disabled={false} record={{}} {...props} />
      </UserContext.Provider>
    </MemoryRouter>,
  );
}

describe("<MapSelect /> use my location", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
  });

  it("fills a bounding box around the device location", async () => {
    const updateMap = vi.fn();
    mockGeolocation({
      getCurrentPosition: (success) =>
        success({ coords: { latitude: 48.42, longitude: -123.36 } }),
    });

    renderMapSelect({ updateMap });
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    await waitFor(() => expect(updateMap).toHaveBeenCalled());
    const newData = updateMap.mock.calls.at(-1)[0];
    expect(newData.north).toBeCloseTo(48.52, 2);
    expect(newData.south).toBeCloseTo(48.32, 2);
    expect(newData.east).toBeCloseTo(-123.26, 2);
    expect(newData.west).toBeCloseTo(-123.46, 2);
    expect(newData.polygon).toBe("");
  });

  it("shows a message when permission is denied", async () => {
    mockGeolocation({
      getCurrentPosition: (success, error) => error({ code: 1, message: "denied" }),
    });

    renderMapSelect();
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));

    await waitFor(() =>
      expect(screen.getByText(/Location permission denied/)).toBeInTheDocument(),
    );
  });

  it("hides the button when geolocation is unavailable", () => {
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    renderMapSelect();
    expect(screen.queryByRole("button", { name: /use my location/i })).not.toBeInTheDocument();
  });

  it("manual bounding box entry still propagates", () => {
    const updateMap = vi.fn();
    renderMapSelect({ updateMap });
    const north = screen.getByLabelText(/North/);
    fireEvent.change(north, { target: { value: "50" } });
    expect(updateMap).toHaveBeenCalledWith(expect.objectContaining({ north: "50" }));
  });
});
