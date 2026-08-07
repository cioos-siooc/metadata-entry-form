import { field } from "../annotations";
import {
  resourceTypeValues,
  metadataScopeValues,
  metadataScopeIsoValues,
  doiCreationStatusValues,
} from "../enums";

/** Fields on the Start tab. */
export const startProperties = {
  title: field({
    en: { title: "Title", description: "Dataset title, in both languages." },
    fr: { title: "Titre", description: "Titre du jeu de données, dans les deux langues." },
    tab: "start",
    error: {
      en: "Missing title in French or English",
      fr: "Titre manquant en français ou en anglais",
    },
    schema: { $ref: "#/definitions/bilingualText" },
  }),

  resourceType: field({
    en: {
      title: "Topic category",
      description:
        "ISO 19115 MD_TopicCategoryCode values. Legacy records may store the pre-ISO names 'oceanographic' and 'biological', or a bare string instead of an array.",
    },
    fr: {
      title: "Catégorie thématique",
      description:
        "Valeurs ISO 19115 MD_TopicCategoryCode. Les enregistrements existants peuvent contenir les anciens noms « oceanographic » et « biological ».",
    },
    tab: "start",
    error: {
      en: "Please select a theme for this record",
      fr: "Veuillez sélectionner une discipline scientifique pour cet enregistrement",
    },
    schema: {
      type: ["array", "string"],
      items: { enum: resourceTypeValues },
    },
  }),

  metadataScope: field({
    en: {
      title: "Resource type",
      description: "The kind of resource being described, e.g. Dataset or Book.",
    },
    fr: {
      title: "Type de ressource",
      description: "Le type de ressource décrite, par exemple Jeu de données ou Livre.",
    },
    tab: "start",
    error: {
      en: "Please select a resource type",
      fr: "Veuillez sélectionner un type de ressources",
    },
    schema: { type: "string", enum: ["", ...metadataScopeValues] },
  }),

  metadataScopeIso: field({
    en: {
      title: "Resource type (ISO)",
      description: "The ISO scope code corresponding to metadataScope.",
    },
    fr: {
      title: "Type de ressource (ISO)",
      description: "Le code ISO correspondant à metadataScope.",
    },
    tab: "start",
    schema: { type: "string", enum: ["", ...metadataScopeIsoValues] },
  }),

  datasetIdentifier: field({
    en: {
      title: "DOI",
      description:
        "Digital Object Identifier as a full https://doi.org/ URL. Bare DOIs are rejected — see schema README §11.",
    },
    fr: {
      title: "DOI",
      description:
        "Identifiant d'objet numérique sous forme d'URL https://doi.org/ complète.",
    },
    tab: "start",
    error: { en: "Invalid DOI", fr: "DOI non valide" },
    schema: {
      type: "string",
      anyOf: [
        { const: "" },
        {
          pattern:
            "^https://doi\\.org/10\\.\\d{4,9}/[-._;()/:A-Za-z0-9]+$",
        },
      ],
    },
  }),

  doiCreationStatus: field({
    en: {
      title: "DOI state",
      description: "DataCite lifecycle state. Empty when no DOI has been minted.",
    },
    fr: {
      title: "État du DOI",
      description: "État du cycle de vie DataCite. Vide si aucun DOI n'a été créé.",
    },
    tab: "start",
    schema: { type: "string", enum: doiCreationStatusValues },
  }),

  sharedWith: field({
    en: {
      title: "Shared with",
      description: "Map of user IDs this record has been shared with.",
    },
    fr: {
      title: "Partagé avec",
      description: "Liste des identifiants d'utilisateurs avec qui l'enregistrement est partagé.",
    },
    tab: "start",
    schema: { type: "object", additionalProperties: { type: "boolean" } },
  }),
};

export default startProperties;
