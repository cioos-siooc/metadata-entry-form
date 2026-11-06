// Prototype sample data shaped like CKAN `package_search` results.
// Stands in for a live CIOOS catalogue search. Only Bedford Basin is real
// (from bedford_basin_collection_b3028.yaml); the rest are made up.

export const sampleCatalogue = [
  {
    id: "b30289fc-fcbd-4624-a44b-eb3a703c4e32",
    type: "collection",
    title_translated: {
      en: "Bedford Basin Collection",
      fr: "Collection du bassin de Bedford",
    },
    organization: { title: "CIOOS Atlantic" },
    doi: "10.60622/v6nn-kw50",
    url: "https://catalogue.cioos.ca/dataset/ca-cioos_b30289fc-fcbd-4624-a44b-eb3a703c4e32",
  },
  {
    id: "4f1c2e7a-9b3d-4c6e-8a21-5d7f0e9b1c34",
    type: "collection",
    title_translated: {
      en: "Salish Sea Ferry Observations Collection",
      fr: "Collection des observations par traversier de la mer des Salish",
    },
    organization: { title: "CIOOS Pacific" },
    doi: "10.60622/abcd-1234",
    url: "https://catalogue.cioos.ca/dataset/ca-cioos_4f1c2e7a-9b3d-4c6e-8a21-5d7f0e9b1c34",
  },
  {
    id: "7a8e3d21-6c4b-4f9a-b1e2-3c5d7f9a0b12",
    type: "collection",
    title_translated: {
      en: "St. Lawrence Estuary Monitoring Collection",
      fr: "Collection de surveillance de l'estuaire du Saint-Laurent",
    },
    organization: { title: "SLGO" },
    doi: null,
    url: "https://catalogue.cioos.ca/dataset/ca-cioos_7a8e3d21-6c4b-4f9a-b1e2-3c5d7f9a0b12",
  },
  {
    id: "c2d4e6f8-1a3b-4c5d-9e7f-0a2b4c6d8e10",
    type: "dataset",
    title_translated: {
      en: "Bedford Basin Compass Buoy Station",
      fr: "Station de la bouée Compass du bassin de Bedford",
    },
    organization: { title: "CIOOS Atlantic" },
    doi: "10.60622/efgh-5678",
    url: "https://catalogue.cioos.ca/dataset/ca-cioos_c2d4e6f8-1a3b-4c5d-9e7f-0a2b4c6d8e10",
  },
  {
    id: "e1f3a5b7-2c4d-4e6f-8a0b-1c3d5e7f9a21",
    type: "dataset",
    title_translated: {
      en: "Bedford Basin Plankton Monitoring Program",
      fr: "Programme de surveillance du plancton du bassin de Bedford",
    },
    organization: { title: "Fisheries and Oceans Canada" },
    doi: null,
    url: "https://catalogue.cioos.ca/dataset/ca-cioos_e1f3a5b7-2c4d-4e6f-8a0b-1c3d5e7f9a21",
  },
];
