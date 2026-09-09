import { field } from "../annotations";

/** Fields on the Taxonomic Classification tab. */
export const taxaProperties = {
  taxa: field({
    en: {
      title: "Taxonomic coverage",
      description:
        "Taxa present in the dataset, resolved against WoRMS. Required unless noTaxa is set.",
    },
    fr: {
      title: "Couverture taxonomique",
      description:
        "Taxons présents dans le jeu de données, résolus via WoRMS.",
    },
    tab: "taxa",
    error: {
      en: "Missing Taxonomic Coverage",
      fr: "Couverture taxonomique manquante.",
    },
    schema: { type: "array", items: { $ref: "#/definitions/taxon" } },
  }),

  noTaxa: field({
    en: {
      title: "No taxonomic coverage",
      description: "Set when the dataset has no taxonomic coverage; waives the field above.",
    },
    fr: {
      title: "Aucune couverture taxonomique",
      description: "Coché lorsque le jeu de données n'a pas de couverture taxonomique.",
    },
    tab: "taxa",
    schema: { type: "boolean" },
  }),
};

export default taxaProperties;
