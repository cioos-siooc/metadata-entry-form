import React from "react";
import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import StartTab from "../StartTab";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ language: "en", region: "pacific" }),
  };
});

// SharedUsersList fetches region users from Firebase, which is unavailable in
// jsdom. Stub it out so the test focuses on the resource-scope defaulting logic.
vi.mock("../../FormComponents/SharedUsersList", () => ({
  default: () => null,
}));

const theme = createTheme();

const renderStartTab = (record) => {
  const handleUpdateRecord = vi.fn(() => vi.fn());
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <StartTab
          disabled={false}
          record={record}
          updateRecord={() => () => {}}
          handleUpdateRecord={handleUpdateRecord}
          userID="user1"
        />
      </MemoryRouter>
    </ThemeProvider>
  );
  return handleUpdateRecord;
};

// Collect the values passed to handleUpdateRecord(key)(event) for a given key.
const valuesFor = (handleUpdateRecord, key) =>
  handleUpdateRecord.mock.results
    .filter((_, i) => handleUpdateRecord.mock.calls[i][0] === key)
    .flatMap((res) => res.value.mock.calls.map((c) => c[0].target.value));

describe("<StartTab /> metadata scope defaults", () => {
  it("sets metadataScopeIso to 'dataset' when no scope is present", () => {
    const handleUpdateRecord = renderStartTab({ eov: [], map: {} });

    expect(valuesFor(handleUpdateRecord, "metadataScope")).toContain("Dataset");
    expect(valuesFor(handleUpdateRecord, "metadataScopeIso")).toContain(
      "dataset"
    );
  });

  it("backfills metadataScopeIso from metadataScope for legacy records", () => {
    const handleUpdateRecord = renderStartTab({
      metadataScope: "Model",
      eov: [],
      map: {},
    });

    expect(valuesFor(handleUpdateRecord, "metadataScopeIso")).toContain("model");
  });

  it("does not overwrite an existing metadataScopeIso", () => {
    const handleUpdateRecord = renderStartTab({
      metadataScope: "Dataset",
      metadataScopeIso: "dataset",
      eov: [],
      map: {},
    });

    expect(valuesFor(handleUpdateRecord, "metadataScopeIso")).toEqual([]);
  });
});
