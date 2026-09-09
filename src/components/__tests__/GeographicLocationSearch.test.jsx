import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import GeographicLocationSearch from "../FormComponents/GeographicLocationSearch";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("axios", () => ({
  default: { get: vi.fn(() => Promise.resolve({ data: { features: [] } })) },
}));

const britishColumbia = {
  en: "British Columbia",
  fr: "Colombie-Britannique",
  source: "predefined",
  type: "province",
};

describe("<GeographicLocationSearch />", () => {
  let updateMap;

  beforeEach(() => {
    updateMap = vi.fn();
  });

  async function selectBritishColumbia(mapData = {}) {
    render(
      <GeographicLocationSearch
        updateMap={updateMap}
        mapData={mapData}
        disabled={false}
      />
    );
    const input = screen.getByRole("combobox", {
      name: /location by name/i,
    });
    await userEvent.type(input, "British Colum");
    await userEvent.click(await screen.findByText("British Columbia"));
    return input;
  }

  it("keeps the selected location name in the field after blur", async () => {
    const input = await selectBritishColumbia();
    await userEvent.tab();

    expect(input).toHaveValue("British Columbia");
  });

  it("saves the selection and prefills the geographic description", async () => {
    await selectBritishColumbia();

    expect(updateMap).toHaveBeenCalled();
    const newMapData = updateMap.mock.calls.at(-1)[0];
    expect(newMapData.selectedLocation).toEqual(britishColumbia);
    expect(newMapData.description.en).toBe("British Columbia");
    expect(newMapData.description.fr).toBe("Colombie-Britannique");
    expect(newMapData.north).toBe(60.0);
  });

  it("does not overwrite a description the user wrote", async () => {
    await selectBritishColumbia({
      description: { en: "Coastal waters off Vancouver Island", fr: "" },
    });

    const newMapData = updateMap.mock.calls.at(-1)[0];
    expect(newMapData.description.en).toBe("Coastal waters off Vancouver Island");
  });

  it("replaces a description left over from a previous selection", async () => {
    await selectBritishColumbia({
      selectedLocation: {
        en: "Alberta",
        fr: "Alberta",
        source: "predefined",
        type: "province",
      },
      description: { en: "Alberta", fr: "Alberta" },
    });

    const newMapData = updateMap.mock.calls.at(-1)[0];
    expect(newMapData.description.en).toBe("British Columbia");
  });

  it("restores a saved location name and its filter", () => {
    render(
      <GeographicLocationSearch
        updateMap={updateMap}
        mapData={{ selectedLocation: britishColumbia }}
        disabled={false}
      />
    );

    expect(
      screen.getByRole("combobox", { name: /location by name/i })
    ).toHaveValue("British Columbia");
    expect(
      screen.getByRole("combobox", { name: /Filter by type/i })
    ).toHaveTextContent("Provinces and Territories");
  });

  it("clears the saved location without touching the geometry", async () => {
    render(
      <GeographicLocationSearch
        updateMap={updateMap}
        mapData={{ selectedLocation: britishColumbia, north: 60, south: 48 }}
        disabled={false}
      />
    );

    await userEvent.click(screen.getByTitle("Clear"));

    expect(updateMap).toHaveBeenCalledWith({ north: 60, south: 48 });
  });
});
