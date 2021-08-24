// Copying how RA's use colors in their wordpress sites
const regions = {
  pacific: {
    title: { en: "CIOOS Pacific", fr: "SIOOC Pacifique" },
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
      en: "CIOOS Pacific is focused on ocean data from Canada’s West Coast",
      fr:
        "SIOOC Pacifique se concentre sur les données océaniques de la côte ouest du Canada",
    },
    showInRegionSelector: true,
  },

  stlaurent: {
    title: { en: "CIOOS St. Lawrence", fr: "SIOOC Saint-Laurent" },
    catalogueTitle: {
      fr:
        "Catalogue de données de l'Observatoire global du Saint-Laurent (OGSL)",
      en: "St. Lawrence Global Observatory Data Catalogue (SLGO)",
    },
    colors: { primary: "#00adef", secondary: "#00aeef" },
    email: "info@ogsl.ca",
    catalogueURL: {
      fr: "https://catalogue.ogsl.ca",
      en: "https://catalogue.ogsl.ca/en/",
    },
    introPageText: {
      en:
        "The St. Lawrence Global Observatory integrates multidisciplinary data and information about the St. Lawrence’s global system, from the Great Lakes to the Gulf.",
      fr:
        "L'Observatoire global du Saint-Laurent intégre des données et de l'information multidisciplinaires sur l'écosystème global du Saint-Laurent, des Grands Lacs au Golfe",
    },
    showInRegionSelector: true,
  },
  atlantic: {
    title: { en: "CIOOS Atlantic", fr: "SIOOC Atlantique" },
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
        "CIOOS Atlantic is focused on the integration of oceanographic data from the Atlantic seaboard, a region spanning from Labrador to the USA.",
      fr:
        "SIOOC Atlantique intègre des données océanographiques de la côte atlantique, une région qui s’étend du Labrador aux États-Unis",
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
      fr: "https://catalogue.hakai.org",
      en: "https://catalogue.hakai.org",
    },
    introPageText: { en: "", fr: "" },
    showInRegionSelector: false,
  },
};

export default regions;
