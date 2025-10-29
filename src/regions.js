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
    logo: { en: "cioos-pacific-en.png", fr: "cioos-pacific-fr.png" },
  },

  stlaurent: {
    title: {
      en: "St. Lawrence Global Observatory",
      fr: "Observatoire global du Saint-Laurent (OGSL)",
    },
    titleFrPossessive: "de l'Observatoire global du Saint-Laurent (OGSL)",
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
    logo: { en: "cioos-stlaurent-en.png", fr: "cioos-stlaurent-fr.png" },
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
    logo: { en: "cioos-atlantic-en.png", fr: "cioos-atlantic-fr.png" },
  },
  amundsen: {
    title: { en: "Amundsen Science", fr: "Amundsen Science" },
    titleFrPossessive: "de Amundsen Science",
    catalogueTitle: {
      fr: "Catalogue de données de Amundsen Science",
      en: "Amundsen Science Data Catalogue",
    },
    colors: { primary: "#E31837", secondary: "#77777A" },
    email: "info@as.ulaval.ca",
    catalogueURL: {
      fr: "https://catalogue.amundsenscience.ca/fr/",
      en: "https://catalogue.amundsenscience.ca/",
    },
    introPageText: {
      en:
        "Amundsen Science is the nonprofit organization responsible for the scientific mandate of the research icebreaker CCGS Amundsen.",
      fr:
        "Amundsen Science est l’organisme à but non-lucratif responsable du mandat scientifique du brise-glace de recherche NGCC Amundsen.",
    },
    showInRegionSelector: true,
    logo: { en: "cioos-amundsen-en.png", fr: "cioos-amundsen-fr.png" },
  },
  canwin: {
    title: { en: "Canadian Watershed Information Network", fr: "Réseau canadien d'information sur les bassins versants" },
    titleFrPossessive: "du Réseau canadien d'information sur les bassins versants",
    catalogueTitle: {
      fr: "Catalogue de données du Réseau canadien d'information sur les bassins versants (CanWIN)",
      en: "Canadian Watershed Information Network Data Catalogue",
    },
    colors: { primary: "#385e9d", secondary: "#1ca8e1" },
    email: "portalco@umanitoba.ca",
    catalogueURL: {
      fr: "https://canwin-datahub.ad.umanitoba.ca/",
      en: "https://canwin-datahub.ad.umanitoba.ca/",
    },
    introPageText: {
      en:
        "CanWIN is the data centre for the Centre for Earth Observation Science (CEOS). We support research and education, and inform management, policy and evidence based decision-making from the Nelson River Watershed to the Arctic.",
      fr:
        "CanWIN est le centre de données du Centre for Earth Observation Science (CEOS). Nous soutenons la recherche et l’éducation, et nous contribuons à la gestion, aux politiques et à la prise de décision fondée sur des données probantes, du bassin versant de la rivière Nelson jusqu’à l’Arctique.",
    },
    showInRegionSelector: false,
    logo: { en: "cioos-canwin-en.png", fr: "cioos-canwin-fr.png" },
  },
  tca: {
    title: { en: "Transforming Climate Action", fr: "Transformer l'action pour le climat" },
    titleFrPossessive: "de Transformer l'action pour le climat",
    catalogueTitle: {
      fr: "Catalogue de données de Transformer l'action pour le climat",
      en: "Transforming Climate Action Data Catalogue",
    },
    colors: { primary: "rgb(254, 187, 18)", secondary: "#4e472fff" },
    email: "tca.data@cioos.ca",
    catalogueURL: {
      fr: "https://catalogue.cioos.ca/",
      en: "https://catalogue.cioos.ca/",
    },
    introPageText: {
      en:
        "Transforming Climate Action is a collaborative network focused on accelerating climate action in Canada through data, tools, and knowledge sharing.",
      fr:
        "Transformer l'action pour le climat est un réseau collaboratif axé sur l'accélération de l'action climatique au Canada grâce aux données, aux outils et au partage des connaissances.",
    },
    showInRegionSelector: true,
    logo: { en: "", fr: "" },
  },
  test: {
    title: { en: "Test", fr: "Test" },
    catalogueTitle: {
      fr: "Catalogue de données du Test",
      en: "Test Data Catalogue",
    },
    colors: { primary: "#fcba03", secondary: "#2518ad" },
    email: "data@hakai.org",
    catalogueURL: {
      fr: "https://example.com/",
      en: "https://example.com/",
    },
    introPageText: { en: "This is a test region", fr: "" },
    showInRegionSelector: false,
    logo: { en: "cioos-en.png", fr: "cioos-fr.png" }, // fallback test region logo
  },
};

// Helper to get logo path by language with graceful fallbacks
// getRegionLogo resolves the bilingual logo file path. Regions may omit one language; it will fall back to the other.
export function getRegionLogo(regionId, language = 'en') {
  const r = regions[regionId];
  if (!r) return null;
  const logoObj = r.logo || {};
  const file = logoObj[language] || logoObj.en || logoObj.fr;
  if (!file) return null;
  return `${process.env.PUBLIC_URL}/${file}`;
}

export default regions;
