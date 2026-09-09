import { describe, expect, test } from "vitest";

import {
  essentialVariables,
  getLegacyEovs,
  getRecordEssentialVariables,
} from "../essentialVariables";

describe("essential variables vocabulary", () => {
  test("uses EOVs instead of duplicate ECV choices where an EOV covers an ECV", () => {
    expect(
      essentialVariables.find(
        (variable) => variable.id === "eov:inorganicCarbon",
      ),
    ).toMatchObject({
      path: ["Ocean", "Biogeochemistry"],
      standards: ["EOV", "ECV"],
    });
    expect(
      essentialVariables.find(
        (variable) =>
          variable.id === "ecv:ocean-biogeochemistry-inorganic-carbon",
      ),
    ).toBeUndefined();
  });

  test("migrates legacy EOV values and derives them when saving", () => {
    const selection = getRecordEssentialVariables({
      eov: ["seaIce", "oxygen"],
    });

    expect(selection).toEqual(["eov:seaIce", "eov:oxygen"]);
    expect(getLegacyEovs(selection)).toEqual(["oxygen", "seaIce"]);
  });

  test("offers ECV-only variables", () => {
    expect(
      essentialVariables.find(
        (variable) => variable.id === "ecv:land-hydrology-lakes",
      ),
    ).toMatchObject({ standards: ["ECV"] });
  });

  test("retains the EOV icon and the mapped ECV name for details views", () => {
    expect(
      essentialVariables.find((variable) => variable.id === "eov:oxygen"),
    ).toMatchObject({
      icon: "dissolved-oxygen.svg",
      goosIcon: "Oxygen.png",
      standardNames: {
        EOV: { en: "Oxygen", fr: "Oxygène" },
        ECV: { en: "Oxygen", fr: "Oxygen" },
      },
    });
  });
});
