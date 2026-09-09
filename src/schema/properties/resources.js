import { field } from "../annotations";

/** Fields on the Resources tab: distribution, related works, and lineage. */
export const resourcesProperties = {
  distribution: field({
    en: {
      title: "Resources",
      description:
        "Links to the data itself and to supporting material. At least one resource with a name and a valid URL is required to submit.",
    },
    fr: {
      title: "Ressources",
      description:
        "Liens vers les données et vers la documentation associée.",
    },
    tab: "resources",
    error: {
      en: "Must have at least one resource. If a URL is included it must be valid.",
      fr: "Doit avoir au moins une ressource. Vérifiez si votre URL est valide.",
    },
    schema: {
      type: "array",
      items: { $ref: "#/definitions/distributionResource" },
    },
  }),

  associated_resources: field({
    en: {
      title: "Related works",
      description:
        "Other works related to this dataset. Each needs a bilingual title, an identifier, an identifier type, and a relation type.",
    },
    fr: {
      title: "Ressources connexes",
      description:
        "Autres travaux liés à ce jeu de données.",
    },
    tab: "relatedworks",
    error: {
      en:
        "Related works must contain a Title, Identifier, Identifier Type, and a Relation Type to be valid.",
      fr:
        "Les ressources connexes doivent contenir un titre, un identifiant, un type d'identifiant et un type de relation pour être valides.",
    },
    schema: {
      type: "array",
      items: { $ref: "#/definitions/relatedWork" },
    },
  }),

  history: field({
    en: {
      title: "Lineage",
      description:
        "How the data came to be. Each processing step and source needs a title and description; a step scoped to data collection also needs a bilingual statement.",
    },
    fr: {
      title: "Généalogie des données",
      description: "Comment les données ont été produites.",
    },
    tab: "lineage",
    error: {
      en:
        "Lineage must contain a title and description for each processing step and source. If lineage scope is set to 'data collection' then lineage statement is required",
      fr:
        "La généalogie des données doit contenir un titre et une description pour chaque étape de traitement. Si le cadre est défini sur « collecte de données », alors une déclaration de généalogie des données est requise",
    },
    schema: {
      type: "array",
      items: { $ref: "#/definitions/lineageStep" },
    },
  }),
};

export default resourcesProperties;
