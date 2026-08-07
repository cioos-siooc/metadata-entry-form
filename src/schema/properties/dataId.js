import { field } from "../annotations";
import { eovValues, progressValues, licenseValues } from "../enums";

/** Fields on the Resource Identification tab. */
export const dataIdProperties = {
  abstract: field({
    en: { title: "Abstract", description: "Dataset abstract, in both languages." },
    fr: { title: "Résumé", description: "Résumé du jeu de données, dans les deux langues." },
    tab: "dataID",
    error: {
      en: "Missing abstract in French or English",
      fr: "Résumé manquant en français ou en anglais",
    },
    schema: { $ref: "#/definitions/bilingualText" },
  }),

  keywords: field({
    en: { title: "Keywords", description: "Free-text keywords, per language." },
    fr: { title: "Mots-clés", description: "Mots-clés libres, par langue." },
    tab: "dataID",
    error: {
      en: "At least one keyword is required",
      fr: "Au moins un mot clé est requis",
    },
    schema: { $ref: "#/definitions/bilingualKeywords" },
  }),

  eov: field({
    en: {
      title: "Essential Ocean Variables",
      description:
        "GOOS Essential Ocean Variables present in the dataset. Deprecated values remain valid structurally but block submission.",
    },
    fr: {
      title: "Variables océaniques essentielles",
      description:
        "Variables océaniques essentielles du GOOS présentes dans le jeu de données.",
    },
    tab: "dataID",
    error: {
      en: "At least one EOV is required",
      fr: "Au moins une variable océanique essentielle est requise",
    },
    schema: { type: "array", items: { enum: eovValues } },
  }),

  progress: field({
    en: { title: "Dataset status", description: "ISO 19115 MD_ProgressCode." },
    fr: { title: "Statut du jeu de données", description: "Code ISO 19115 MD_ProgressCode." },
    tab: "dataID",
    error: {
      en: "Please select a dataset status",
      fr: "Veuillez définir le statut du jeu de données",
    },
    schema: { type: "string", enum: ["", ...progressValues] },
  }),

  language: field({
    en: { title: "Primary language", description: "The dataset's primary language." },
    fr: { title: "Langue principale", description: "La langue principale du jeu de données." },
    tab: "dataID",
    error: { en: "Language field is missing", fr: "Le champ de langue est vide" },
    schema: { type: "string", enum: ["", "en", "fr"] },
  }),

  license: field({
    en: { title: "Licence", description: "Licence under which the dataset is released." },
    fr: { title: "Licence", description: "Licence sous laquelle le jeu de données est publié." },
    tab: "dataID",
    error: {
      en: "Please select a license for the dataset",
      fr: "Veuillez sélectionner une licence pour le jeu de données",
    },
    schema: { type: "string", enum: ["", ...licenseValues] },
  }),

  projects: field({
    en: { title: "Projects", description: "Project names, from the region's admin-managed list." },
    fr: { title: "Projets", description: "Noms de projets, issus de la liste gérée par la région." },
    tab: "dataID",
    schema: { type: "array", items: { type: "string" } },
  }),

  dateStart: field({
    en: { title: "Start date", description: "Start of the dataset's temporal extent." },
    fr: { title: "Date de début", description: "Début de l'étendue temporelle du jeu de données." },
    tab: "dataID",
    schema: { $ref: "#/definitions/isoDateTime" },
  }),

  dateEnd: field({
    en: { title: "End date", description: "End of the dataset's temporal extent." },
    fr: { title: "Date de fin", description: "Fin de l'étendue temporelle du jeu de données." },
    tab: "dataID",
    schema: { $ref: "#/definitions/isoDateTime" },
  }),

  datePublished: field({
    en: { title: "Date published", description: "Publication date." },
    fr: { title: "Date de publication", description: "Date de publication." },
    tab: "dataID",
    schema: { $ref: "#/definitions/isoDateTime" },
  }),

  dateRevised: field({
    en: { title: "Date revised", description: "Most recent revision date." },
    fr: { title: "Date de révision", description: "Date de la révision la plus récente." },
    tab: "dataID",
    schema: { $ref: "#/definitions/isoDateTime" },
  }),

  edition: field({
    en: { title: "Edition", description: "Dataset edition or version label." },
    fr: { title: "Édition", description: "Édition ou version du jeu de données." },
    tab: "dataID",
    schema: { type: "string" },
  }),

  limitations: field({
    en: { title: "Limitations", description: "Limitations on use, beyond the licence." },
    fr: { title: "Limitations", description: "Limitations d'utilisation, au-delà de la licence." },
    tab: "dataID",
    schema: { type: "string" },
  }),
};

export default dataIdProperties;
