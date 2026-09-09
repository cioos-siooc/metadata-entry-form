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

const ecvLabelsById = Object.fromEntries(
  ecvs.flatMap(([prefix, , , labels]) =>
    labels.map((label) => [`ecv:${prefix}-${normalise(label)}`, label]),
  ),
);

const ecvIconBaseUrl =
  "https://gcos.wmo.int/themes/custom/server_theme/dist/images/climate_variables/";

const ecvIconFileNames = {
  Precipitation: "precipitation.svg",
  "Surface Pressure": "surface_pressure.svg",
  "Surface Radiation Budget": "surface_radiation_budget.svg",
  "Surface Temperature": "surface_temperature.svg",
  "Surface Water Vapour": "surface_and_upperair_water_vapour.svg",
  "Surface Wind Speed and Direction": "surface_wind_speed.svg",
  "Upper-air Temperature": "upperair_temperature.svg",
  "Earth Radiation Budget": "earth_radiation_budget.svg",
  Lightning: "lightning.svg",
  "Upper-air Water Vapour": "upperair_water_vapour.svg",
  "Upper-air Wind Speed and Direction": "upperair_windspeed.svg",
  Clouds: "clouds.svg",
  Aerosols: "aerosol.svg",
  "Carbon Dioxide, Methane & Other Greenhouse Gases": "greenhouse_gases.svg",
  Ozone: "ozone.svg",
  "Precursors for Aerosols and Ozone": "precursors.svg",
  Groundwater: "groundwater.svg",
  Lakes: "lakes.svg",
  "River Discharge": "river_discharge.svg",
  "Terrestrial Water Storage": "ecv_terrestrial_water_storage.svg",
  "Evaporation from Land": "evaporation_from_land.svg",
  "Soil Moisture": "soil_moisture.svg",
  Glaciers: "glaciers.svg",
  "Ice Sheets and Ice Shelves": "ice_sheets_and_ice_shelves.svg",
  Permafrost: "permafrost.svg",
  Snow: "snow.svg",
  "Above-ground Biomass": "above_ground_biomass.svg",
  Albedo: "albedo.svg",
  Fire: "fire.svg",
  "Fraction of Absorbed Photosynthetically Active Radiation": "fapar.svg",
  "Land Cover": "landcover.svg",
  "Land Surface Temperature": "land_surface_temperature.svg",
  "Leaf Area Index": "leaf_area_index.svg",
  "Soil Carbon": "soil_carbon.svg",
  "Anthropogenic Greenhouse Gas Emissions": "anthropogenic_ghg_fluxes.svg",
  "Anthropogenic Water Use": "anthropogenic_water_use.svg",
  "Ocean Surface Heat Flux": "ocean_surface_heat_flux.svg",
  "Sea Ice": "sea_ice.svg",
  "Sea Level": "sea_level.svg",
  "Sea State": "sea_state.svg",
  "Surface Currents": "sea_surface_currents.svg",
  "Sea Surface Salinity": "sea_surface_salinity.svg",
  "Surface Stress": "sea_surface_stress.svg",
  "Sea Surface Temperature": "sea_surface_temperature.svg",
  "Subsurface Currents": "subsurface_currents.svg",
  "Subsurface Salinity": "subsurface_salinity.svg",
  "Subsurface Temperature": "subsurface_temperature.svg",
  "Inorganic Carbon": "inorganic_carbon.svg",
  "Nitrous Oxide": "nitrous_oxide.svg",
  Nutrients: "nutrients.svg",
  "Ocean Colour": "ocean_colour.svg",
  Oxygen: "oxygen.svg",
  "Transient Tracers": "transient_tracers.svg",
  "Marine Habitats": "marine_habitat.svg",
  Plankton: "plankton.svg",
};

const ecvIconUrlsById = Object.fromEntries(
  Object.entries(ecvLabelsById).map(([id, label]) => [
    id,
    ecvIconFileNames[label]
      ? `${ecvIconBaseUrl}${ecvIconFileNames[label]}`
      : null,
  ]),
);

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
  hardCoralCoverAndComposition: "marine-habitats",
  seagrassCoverAndComposition: "marine-habitats",
  macroalgalCanopyCoverAndComposition: "marine-habitats",
  phytoplanktonBiomassAndDiversity: "plankton",
  zooplanktonBiomassAndDiversity: "plankton",
};

const coveredEcvIds = new Set(Object.values(eovEcvMappings));

const eovDisplayLabels = {
  inorganicCarbon: {
    en: "Dissolved inorganic carbon",
    fr: "Carbone inorganique dissous",
  },
};

// Official GOOS EOV artwork supplied in public/goos-eov-icons.
const goosIconFileNames = {
  oxygen: "Oxygen.png",
  nutrients: "Nutrients.png",
  inorganicCarbon: "Inorganic-carbon.png",
  dissolvedOrganicCarbon: "Dissolved-organic-carbon.png",
  seaSurfaceHeight: "Surface-height.png",
  seaIce: "Sea-ice.png",
  seaState: "Sea-state.png",
  seaSurfaceSalinity: "Surface-salinity.png",
  seaSurfaceTemperature: "Surface-temperature.png",
  subSurfaceSalinity: "Subsurface-salinity.png",
  subSurfaceTemperature: "Subsurface-temperature.png",
  surfaceCurrents: "Surface-currents.png",
  subSurfaceCurrents: "Subsurface-currents.png",
  transientTracers: "Transient-tracers.png",
  particulateMatter: "Particulate-matter.png",
  nitrousOxide: "Nitrous-oxide.png",
  stableCarbonIsotopes: "Stable-carbon-isotopes.png",
  phytoplanktonBiomassAndDiversity: "Phytoplankton.png",
  zooplanktonBiomassAndDiversity: "Zooplankton.png",
  fishAbundanceAndDistribution: "Fish.png",
  seaTurtlesAbundanceAndDistribution: "Sea-turtles.png",
  seabirdsAbundanceAndDistribution: "Seabirds.png",
  marineMammalsAbundanceAndDistribution: "Marine-mammals.png",
  hardCoralCoverAndComposition: "Hard-coral.png",
  seagrassCoverAndComposition: "Seagrass.png",
  macroalgalCanopyCoverAndComposition: "Macroalgae.png",
  invertebrateAbundanceAndDistribution: "Invertebrates.png",
  microbeBiomassAndDiversity: "Microbes.png",
  oceanColour: "Ocean-colour.png",
  oceanSound: "Ocean-sound.png",
  marineDebris: "Marine-debris.png",
  oceanSurfaceHeatFlux: "Surface-heat-flux.png",
  oceanSurfaceStress: "Surface-stress.png",
  oceanBottomPressure: "Bottom-pressure.png",
};

const getMappedEcvId = (eovId) => {
  const ecvName = eovEcvMappings[eovId];
  return ecvName
    ? Object.keys(ecvLabelsById).find((id) => id.endsWith(`-${ecvName}`))
    : null;
};

const eovVariables = eovs.map((eov) => {
  const ecvId = getMappedEcvId(eov.value);

  return {
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
    standards: ecvId ? ["EOV", "ECV"] : ["EOV"],
    ecvId,
    standardNames: {
      EOV: {
        en: eov["label EN"],
        fr: eov["label FR"],
      },
      ...(ecvId
        ? {
            ECV: {
              en: ecvLabelsById[ecvId],
              fr: ecvLabelsById[ecvId],
            },
          }
        : {}),
    },
    standardIconUrls: {
      ...(ecvId ? { ECV: ecvIconUrlsById[ecvId] } : {}),
    },
    icon: eov.icon || null,
    goosIcon: goosIconFileNames[eov.value] || null,
    url: eov.url,
    deprecated: eov.deprecated,
    emerging: eov.emerging,
  };
});

const ecvVariables = ecvs.flatMap(([prefix, domain, category, labels]) =>
  labels
    .filter((label) => {
      const id = normalise(label);
      return !coveredEcvIds.has(id);
    })
    .map((label) => ({
      id: `ecv:${prefix}-${normalise(label)}`,
      label: { en: label, fr: label },
      definition: { en: "", fr: "" },
      path: [domain, category],
      standards: ["ECV"],
      standardNames: { ECV: { en: label, fr: label } },
      standardIconUrls: {
        ECV: ecvIconUrlsById[`ecv:${prefix}-${normalise(label)}`],
      },
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
