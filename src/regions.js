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
    ror: "https://ror.org/00vz8a291",
    email: "info@cioospacific.ca",
    catalogueURL: {
      fr: "https://catalogue.cioospacific.ca/fr/",
      en: "https://catalogue.cioospacific.ca/",
    },
    introPageText: {
      en: "CIOOS Pacific integrates data from Canada’s west coast, from Dixon Entrance to the Strait of Juan de Fuca.",
      fr: "Le CIOOS Pacifique intègre les données de la côte ouest du Canada, de l'entrée Dixon au détroit de Juan de Fuca.",
    },
    showInRegionSelector: true,
    logo: { en: "cioos-pacific-en.svg", fr: "cioos-pacific-fr.svg" },
    // Show the logo flat white on the header block instead of on a white
    // plate. Needs artwork on a transparent background.
    monochromeLogo: true,
  },

  stlaurent: {
    title: {
      en: "St. Lawrence Global Observatory",
      fr: "Observatoire global du Saint-Laurent (OGSL)",
    },
    titleFrPossessive: "de l'Observatoire global du Saint-Laurent (OGSL)",
    catalogueTitle: {
      fr: "Catalogue de données de l'Observatoire global du Saint-Laurent (OGSL)",
      en: "St. Lawrence Global Observatory Data Catalogue (SLGO)",
    },
    colors: { primary: "#00adef", secondary: "#00aeef" },
    ror: "https://ror.org/03wfagk22",
    email: "info@ogsl.ca",
    catalogueURL: {
      fr: "https://catalogue.ogsl.ca/",
      en: "https://catalogue.ogsl.ca/en/",
    },
    introPageText: {
      en: "SLGO integrates data from the St. Lawrence, from the Great Lakes to the Gulf.",
      fr: "L'Observatoire global du Saint-Laurent intègre les données du Saint-Laurent, des Grands Lacs jusqu'au Golfe",
    },
    showInRegionSelector: true,
    logo: { en: "cioos-stlaurent-en.png", fr: "cioos-stlaurent-fr.png" },
    // Light artwork for the coloured header block (see monochromeLogo).
    logoOnColor: {
      en: "cioos-stlaurent-white-en.svg",
      fr: "cioos-stlaurent-white-fr.svg",
    },
    monochromeLogo: true,
  },
  atlantic: {
    title: { en: "CIOOS Atlantic", fr: "SIOOC Atlantique" },
    titleFrPossessive: "du SIOOC Atlantique",
    catalogueTitle: {
      fr: "Catalogue de données du SIOOC Atlantique",
      en: "CIOOS Atlantic Data Catalogue",
    },
    colors: { primary: "#19222b", secondary: "#e55162" },
    ror: "",
    email: "info@cioosatlantic.ca",
    catalogueURL: {
      fr: "https://cioosatlantic.ca/ckan/fr/",
      en: "https://cioosatlantic.ca/ckan/",
    },
    introPageText: {
      en: "CIOOS Atlantic integrates data from Canada’s east coast, from Labrador to Bay of Fundy.",
      fr: "Le CIOOS Atlantique intègre les données de la côte est du Canada, du Labrador à la baie de Fundy.",
    },
    showInRegionSelector: true,
    logo: { en: "cioos-atlantic-en.svg", fr: "cioos-atlantic-fr.svg" },
    monochromeLogo: true,
  },
  amundsen: {
    title: { en: "Amundsen Science", fr: "Amundsen Science" },
    titleFrPossessive: "d'Amundsen Science",
    catalogueTitle: {
      fr: "Catalogue de données d'Amundsen Science",
      en: "Amundsen Science Data Catalogue",
    },
    colors: { primary: "#E31837", secondary: "#77777A" },
    ror: "https://ror.org/02s3xv195",
    email: "info@as.ulaval.ca",
    catalogueURL: {
      fr: "https://catalogue.amundsenscience.com/fr/",
      en: "https://catalogue.amundsenscience.com/",
    },
    introPageText: {
      en: "Amundsen Science is the nonprofit organization responsible for the scientific mandate of the research icebreaker CCGS Amundsen.",
      fr: "Amundsen Science est l’organisme à but non-lucratif responsable du mandat scientifique du brise-glace de recherche NGCC Amundsen.",
    },
    showInRegionSelector: true,
    logo: { en: "cioos-amundsen-en.png", fr: "cioos-amundsen-fr.png" },
    monochromeLogo: true,
  },
  canwin: {
    title: {
      en: "Canadian Watershed Information Network",
      fr: "Réseau canadien d'information sur les bassins versants",
    },
    titleFrPossessive:
      "du Réseau canadien d'information sur les bassins versants",
    catalogueTitle: {
      fr: "Catalogue de données du Réseau canadien d'information sur les bassins versants (CanWIN)",
      en: "Canadian Watershed Information Network Data Catalogue",
    },
    colors: { primary: "#385e9d", secondary: "#1ca8e1" },
    ror: "",
    email: "portalco@umanitoba.ca",
    catalogueURL: {
      fr: "https://canwin-datahub.ad.umanitoba.ca/",
      en: "https://canwin-datahub.ad.umanitoba.ca/",
    },
    introPageText: {
      en: "CanWIN is the data centre for the Centre for Earth Observation Science (CEOS). We support research and education, and inform management, policy and evidence based decision-making from the Nelson River Watershed to the Arctic.",
      fr: "CanWIN est le centre de données du Centre for Earth Observation Science (CEOS). Nous soutenons la recherche et l’éducation, et nous contribuons à la gestion, aux politiques et à la prise de décision fondée sur des données probantes, du bassin versant de la rivière Nelson jusqu’à l’Arctique.",
    },
    showInRegionSelector: false,
    logo: { en: "cioos-canwin-en.png", fr: "cioos-canwin-fr.png" },
    monochromeLogo: true,
  },
  test: {
    title: { en: "Test", fr: "Test" },
    catalogueTitle: {
      fr: "Catalogue de données du Test",
      en: "Test Data Catalogue",
    },
    colors: { primary: "#fcba03", secondary: "#2518ad" },
    ror: "",
    email: "data@hakai.org",
    catalogueURL: {
      fr: "https://catalogue.dev.cioos.com/",
      en: "https://catalogue.dev.cioos.com/",
    },
    introPageText: { en: "This is a test region", fr: "" },
    showInRegionSelector: false,
    logo: { en: "cioos-en.png", fr: "cioos-fr.png" },
    monochromeLogo: true,
  },
};

// The region's logo file path in the page's language. Regions may omit one
// language; it falls back to the other. `onColor` asks for the light artwork
// drawn for a coloured background (`logoOnColor`), when the region has one.
export function getRegionLogo(
  regionId,
  language = "en",
  { onColor = false } = {},
) {
  const r = regions[regionId];
  if (!r) return null;
  const logoObj = (onColor && r.logoOnColor) || r.logo || {};
  const file = logoObj[language] || logoObj.en || logoObj.fr;
  if (!file) return null;
  return `${import.meta.env.BASE_URL}${file}`;
}

// The national CIOOS logo in the page's language.
const nationalLogos = {
  en: new URL("./static/cioos-national-en.png", import.meta.url).href,
  fr: new URL("./static/cioos-national-fr.png", import.meta.url).href,
};
export function getNationalLogo(language = "en") {
  return nationalLogos[language] || nationalLogos.en;
}

export default regions;
