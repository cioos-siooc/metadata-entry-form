// EOV data is synced from cioos-commons. Keep the ECV additions and mappings in
// this module until the combined vocabulary is published in cioos-commons.
import { eovs } from "./eovs";

const ecvs = [
  [
    "atmosphere-surface",
    "Atmosphere",
    "Surface",
    [
      "Precipitation",
      "Surface Pressure",
      "Surface Radiation Budget",
      "Surface Temperature",
      "Surface Water Vapour",
      "Surface Wind Speed and Direction",
      "Upper-air Temperature",
    ],
  ],
  [
    "atmosphere-upper",
    "Atmosphere",
    "Upper Atmosphere",
    [
      "Earth Radiation Budget",
      "Lightning",
      "Upper-air Water Vapour",
      "Upper-air Wind Speed and Direction",
    ],
  ],
  [
    "atmosphere-composition",
    "Atmosphere",
    "Atmospheric Composition",
    [
      "Clouds",
      "Aerosols",
      "Carbon Dioxide, Methane & Other Greenhouse Gases",
      "Ozone",
      "Precursors for Aerosols and Ozone",
    ],
  ],
  [
    "land-hydrology",
    "Land",
    "Hydrology",
    [
      "Groundwater",
      "Lakes",
      "River Discharge",
      "Terrestrial Water Storage",
      "Evaporation from Land",
      "Soil Moisture",
    ],
  ],
  [
    "land-cryosphere",
    "Land",
    "Cryosphere",
    ["Glaciers", "Ice Sheets and Ice Shelves", "Permafrost", "Snow"],
  ],
  [
    "land-biology",
    "Land",
    "Biology",
    [
      "Above-ground Biomass",
      "Albedo",
      "Fire",
      "Fraction of Absorbed Photosynthetically Active Radiation",
      "Land Cover",
      "Land Surface Temperature",
      "Leaf Area Index",
      "Soil Carbon",
    ],
  ],
  [
    "land-human-use",
    "Land",
    "Human Use of Natural Resources",
    ["Anthropogenic Greenhouse Gas Emissions", "Anthropogenic Water Use"],
  ],
  [
    "ocean-physical",
    "Ocean",
    "Physical",
    [
      "Ocean Surface Heat Flux",
      "Sea Ice",
      "Sea Level",
      "Sea State",
      "Surface Currents",
      "Sea Surface Salinity",
      "Surface Stress",
      "Sea Surface Temperature",
      "Subsurface Currents",
      "Subsurface Salinity",
      "Subsurface Temperature",
    ],
  ],
  [
    "ocean-biogeochemistry",
    "Ocean",
    "Biogeochemistry",
    [
      "Inorganic Carbon",
      "Nitrous Oxide",
      "Nutrients",
      "Ocean Colour",
      "Oxygen",
      "Transient Tracers",
    ],
  ],
  [
    "ocean-biology",
    "Ocean",
    "Biological/Ecosystems",
    ["Marine Habitats", "Plankton"],
  ],
];

const normalise = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const eovEcvMappings = {
  seaSurfaceHeight: "sea-level",
  seaIce: "sea-ice",
  seaState: "sea-state",
  seaSurfaceSalinity: "sea-surface-salinity",
  seaSurfaceTemperature: "sea-surface-temperature",
  subSurfaceSalinity: "subsurface-salinity",
  subSurfaceTemperature: "subsurface-temperature",
  surfaceCurrents: "surface-currents",
  subSurfaceCurrents: "subsurface-currents",
  oceanSurfaceHeatFlux: "ocean-surface-heat-flux",
  oceanSurfaceStress: "surface-stress",
  inorganicCarbon: "inorganic-carbon",
  nitrousOxide: "nitrous-oxide",
  nutrients: "nutrients",
  oceanColour: "ocean-colour",
  oxygen: "oxygen",
  transientTracers: "transient-tracers",
};

const coveredEcvIds = new Set(Object.values(eovEcvMappings));
const planktonEovIds = new Set([
  "phytoplanktonBiomassAndDiversity",
  "zooplanktonBiomassAndDiversity",
]);

const eovDisplayLabels = {
  inorganicCarbon: {
    en: "Dissolved inorganic carbon",
    fr: "Carbone inorganique dissous",
  },
};

const eovVariables = eovs.map((eov) => ({
  id: eov.value === "other" ? "other" : `eov:${eov.value}`,
  legacyEovIds: [eov.value],
  label: eovDisplayLabels[eov.value] || {
    en: eov["label EN"],
    fr: eov["label FR"],
  },
  aliases: eov.value === "inorganicCarbon" ? ["Inorganic carbon", "DIC"] : [],
  definition: {
    en: eov["definition EN"],
    fr: eov["definition FR"],
  },
  path: [
    "Ocean",
    eov.category === "Biogeochemical" ? "Biogeochemistry" : eov.category,
  ],
  standards: eovEcvMappings[eov.value] ? ["EOV", "ECV"] : ["EOV"],
  ecvId: eovEcvMappings[eov.value]
    ? `ecv:ocean-${eovEcvMappings[eov.value]}`
    : null,
  url: eov.url,
  deprecated: eov.deprecated,
  emerging: eov.emerging,
}));

const ecvVariables = ecvs.flatMap(([prefix, domain, category, labels]) =>
  labels
    .filter((label) => {
      const id = normalise(label);
      return (
        !coveredEcvIds.has(id) && !(id === "plankton" && planktonEovIds.size)
      );
    })
    .map((label) => ({
      id: `ecv:${prefix}-${normalise(label)}`,
      label: { en: label, fr: label },
      definition: { en: "", fr: "" },
      path: [domain, category],
      standards: ["ECV"],
      url: "https://gcos.wmo.int/site/global-climate-observing-system-gcos/essential-climate-variables",
    })),
);

export const essentialVariables = [...eovVariables, ...ecvVariables];

export const legacyEovToEssentialVariable = Object.fromEntries(
  eovVariables.flatMap((variable) =>
    variable.legacyEovIds.map((legacyId) => [legacyId, variable.id]),
  ),
);

export const getRecordEssentialVariables = (record) => {
  if (
    Array.isArray(record.essentialVariables) &&
    record.essentialVariables.length
  ) {
    return record.essentialVariables;
  }
  return (record.eov || [])
    .map((legacyId) => legacyEovToEssentialVariable[legacyId])
    .filter(Boolean);
};

export const getLegacyEovs = (variableIds) =>
  essentialVariables
    .filter((variable) => variableIds.includes(variable.id))
    .flatMap((variable) => variable.legacyEovIds || []);
