// Copying how RA's use colors in their wordpress sites
const regions = {
  stlaurent: {
    title: { en: "CIOOS St Lawrence", fr: "SIOOC Saint-Laurent" },
    catalogueTitle: {
      fr:
        "Catalogue de données de l'Observatoire Global du Saint-Laurent (OGSL)",
      en: "SLGO Data Catalogue",
    },
    colors: { primary: "#00adef", secondary: "#00aeef" },
    email: "info@ogsl.ca",
    catalogueURL: "https://catalogue.ogsl.ca/en/",
  },
  atlantic: {
    title: { en: "CIOOS Atlantic", fr: "SIOOC Atlantique" },
    catalogueTitle: {
      fr: "Catalogue de données du SIOOC du Atlantic",
      en: "CIOOS Atlantic Data Catalogue",
    },
    colors: { primary: "#19222b", secondary: "#e55162" },
    email: "info@cioosatlantic.ca",
    catalogueURL: "https://cioosatlantic.ca/ckan/",
  },
  pacific: {
    title: { en: "CIOOS Pacific", fr: "SIOOC Pacifique" },
    catalogueTitle: {
      fr: "Catalogue de données du SIOOC du Pacifique",
      en: "CIOOS Pacific Data Catalogue",
    },
    colors: { primary: "#006e90", secondary: "#ffc857" },
    email: "info@cioospacific.ca",
    catalogueURL: "https://cioospacific.ca/ckan/",
  },
};

export default regions;
