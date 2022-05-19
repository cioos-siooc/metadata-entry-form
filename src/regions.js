// Copying how RA's use colors in their wordpress sites
const regions = {
  pacific: {
    title: { en: "CIOOS Pacific", fr: "SIOOC Pacifique" },
    titleFrPossessive: "du SIOOC Pacifique",
    catalogueTitle: {
      fr: "Catalogue de données du SIOOC du Pacifique",
      en: "CIOOS Pacific Data Catalogue",
    },
    colors: { primary: "#006e90", secondary: "#ffc857" },
    email: "info@cioospacific.ca",
    catalogueURL: {
      fr: "https://catalogue.cioospacific.ca/fr/",
      en: "https://catalogue.cioospacific.ca/",
    },
    introPageText: {
      en:
        "CIOOS Pacific integrates data from Canada’s west coast, from Dixon Entrance to the Strait of Juan de Fuca.",
      fr:
        "Le CIOOS Pacifique intègre les données de la côte ouest du Canada, de l'entrée Dixon au détroit de Juan de Fuca.",
    },
    showInRegionSelector: true,
  },

  stlaurent: {
    title: { en: "St. Lawrence Global Observatory", fr: "Observatoire Global du Saint-Laurent (OGSL)" },
    titleFrPossessive: "de l'Observatoire Global du Saint-Laurent (OGSL)",
    catalogueTitle: {
      fr:
        "Catalogue de données de l'Observatoire global du Saint-Laurent (OGSL)",
      en: "St. Lawrence Global Observatory Data Catalogue (SLGO)",
    },
    colors: { primary: "#00adef", secondary: "#00aeef" },
    email: "info@ogsl.ca",
    catalogueURL: {
      fr: "https://catalogue.ogsl.ca/",
      en: "https://catalogue.ogsl.ca/en/",
    },
    introPageText: {
      en:
        "SLGO integrates data from the St. Lawrence, from the Great Lakes to the Gulf.",
      fr:
        "L'Observatoire global du Saint-Laurent intègre les données du Saint-Laurent, des Grands Lacs jusqu'au Golfe",
    },
    showInRegionSelector: true,
  },
  atlantic: {
    title: { en: "CIOOS Atlantic", fr: "SIOOC Atlantique" },
    titleFrPossessive: "du SIOOC Atlantique",
    catalogueTitle: {
      fr: "Catalogue de données du SIOOC du Atlantic",
      en: "CIOOS Atlantic Data Catalogue",
    },
    colors: { primary: "#19222b", secondary: "#e55162" },
    email: "info@cioosatlantic.ca",
    catalogueURL: {
      fr: "https://cioosatlantic.ca/ckan/fr/",
      en: "https://cioosatlantic.ca/ckan/",
    },
    introPageText: {
      en:
        "CIOOS Atlantic integrates data from Canada’s east coast, from Labrador to Bay of Fundy.",
      fr:
        "Le CIOOS Atlantique intègre les données de la côte est du Canada, du Labrador à la baie de Fundy.",
    },
    showInRegionSelector: true,
  },

  iys: {
    title: { en: "IYS", fr: "IYS" },
    catalogueTitle: {
      fr: "Catalogue de données du IYS",
      en: "IYS Data Catalogue",
    },
    colors: { primary: "#006e90", secondary: "#ffc857" },
    email: "iys.data@hakai.org",
    catalogueURL: {
      fr: "https://iys.hakai.org/dataset/",
      en: "https://iys.hakai.org/dataset/",
    },
    introPageText: { en: "", fr: "" },
    showInRegionSelector: false,
  },
  hakai: {
    title: { en: "Hakai", fr: "Hakai" },
    catalogueTitle: {
      fr: "Catalogue de données du Hakai",
      en: "Hakai Data Catalogue",
    },
    colors: { primary: "#aa2025", secondary: "#459be2" },
    email: "info@hakai.org",
    catalogueURL: {
      fr: "https://catalogue.hakai.org/",
      en: "https://catalogue.hakai.org/",
    },
    introPageText: { en: "", fr: "" },
    showInRegionSelector: false,
  },
  test: {
    title: { en: "Test", fr: "Test" },
    catalogueTitle: {
      fr: "Catalogue de données du Test",
      en: "Test Data Catalogue",
    },
    colors: { primary: "#fcba03", secondary: "#2518ad" },
    email: "info@hakai.org",
    catalogueURL: {
      fr: "https://example.com/",
      en: "https://example.com/",
    },
    introPageText: { en: "This is a test region", fr: "" },
    showInRegionSelector: false,
  },
};

export default regions;
