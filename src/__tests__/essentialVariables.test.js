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

  test("links marine habitat EOVs to their shared broader ECV", () => {
    [
      "hardCoralCoverAndComposition",
      "seagrassCoverAndComposition",
      "macroalgalCanopyCoverAndComposition",
    ].forEach((eovId) => {
      expect(
        essentialVariables.find((variable) => variable.id === `eov:${eovId}`),
      ).toMatchObject({
        standards: ["EOV", "ECV"],
        standardNames: {
          ECV: { en: "Marine Habitats", fr: "Marine Habitats" },
        },
      });
    });

    expect(
      essentialVariables.find(
        (variable) => variable.id === "ecv:ocean-biology-marine-habitats",
      ),
    ).toBeUndefined();
  });

  test("links plankton EOVs to their shared broader ECV", () => {
    [
      "phytoplanktonBiomassAndDiversity",
      "zooplanktonBiomassAndDiversity",
    ].forEach((eovId) => {
      expect(
        essentialVariables.find((variable) => variable.id === `eov:${eovId}`),
      ).toMatchObject({
        standards: ["EOV", "ECV"],
        standardNames: {
          ECV: { en: "Plankton", fr: "Plankton" },
        },
      });
    });

    expect(
      essentialVariables.find(
        (variable) => variable.id === "ecv:ocean-biology-plankton",
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
