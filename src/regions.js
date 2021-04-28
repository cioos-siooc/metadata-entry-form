// Copying how RA's use colors in their wordpress sites
const regions = {
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
  },
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
  },
};

export default regions;
