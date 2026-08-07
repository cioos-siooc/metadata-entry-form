import { field } from "../annotations";
import { depthDirectionValues } from "../enums";

/** Fields on the Spatial tab. */
export const spatialProperties = {
  map: field({
    en: {
      title: "Geographic extent",
      description:
        "A bounding box, a polygon, or a text description. Which of those is sufficient depends on the topic category — see the conditional requirements page.",
    },
    fr: {
      title: "Étendue géographique",
      description:
        "Un cadre de délimitation, un polygone, ou une description textuelle.",
    },
    tab: "spatial",
    error: {
      en: "Spatial information is missing",
      fr: "L'état du jeu de données n'est pas spécifié",
    },
    schema: { $ref: "#/definitions/mapExtent" },
  }),

  verticalExtentMin: field({
    en: { title: "Vertical extent minimum", description: "Shallowest depth or lowest height." },
    fr: { title: "Étendue verticale minimale", description: "Profondeur la plus faible ou hauteur la plus basse." },
    tab: "spatial",
    error: {
      en: "Missing Vertical Extent Min",
      fr: "Étendue verticale manquante Min",
    },
    schema: { type: ["string", "number"] },
  }),

  verticalExtentMax: field({
    en: { title: "Vertical extent maximum", description: "Deepest depth or greatest height." },
    fr: { title: "Étendue verticale maximale", description: "Profondeur la plus grande ou hauteur la plus élevée." },
    tab: "spatial",
    error: {
      en: "Missing Vertical Extent Max",
      fr: "Étendue verticale manquante Max",
    },
    schema: { type: ["string", "number"] },
  }),

  verticalExtentDirection: field({
    en: {
      title: "Vertical extent direction",
      description: "Whether the values are positive downward (depth) or upward (height).",
    },
    fr: {
      title: "Direction de l'étendue verticale",
      description: "Indique si les valeurs sont positives vers le bas (profondeur) ou vers le haut (hauteur).",
    },
    tab: "spatial",
    error: {
      en: "Missing Vertical Extent Direction",
      fr: "Direction de l'étendue verticale manquante",
    },
    schema: { type: "string", enum: ["", ...depthDirectionValues] },
  }),

  verticalExtentEPSG: field({
    en: { title: "Vertical CRS", description: "EPSG code for the vertical coordinate reference system." },
    fr: { title: "SRC vertical", description: "Code EPSG du système de référence de coordonnées vertical." },
    tab: "spatial",
    schema: { type: ["string", "number"] },
  }),

  noVerticalExtent: field({
    en: {
      title: "No vertical extent",
      description: "Set when the dataset has no meaningful vertical extent; waives the three fields above.",
    },
    fr: {
      title: "Aucune étendue verticale",
      description: "Coché lorsque le jeu de données n'a pas d'étendue verticale pertinente.",
    },
    tab: "spatial",
    schema: { type: "boolean" },
  }),
};

export default spatialProperties;
