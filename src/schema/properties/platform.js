import { field } from "../annotations";

/** Fields on the Platform tab. */
export const platformProperties = {
  platforms: field({
    en: {
      title: "Platforms",
      description:
        "Platforms the data was collected from. Each needs a type and an ID, unless the dataset has no platform or is a model.",
    },
    fr: {
      title: "Plateformes",
      description:
        "Plateformes à partir desquelles les données ont été recueillies.",
    },
    tab: "platform",
    error: {
      en: "Missing platform type or ID",
      fr: "Type ou ID de plateforme manquant.",
    },
    schema: { type: "array", items: { $ref: "#/definitions/platform" } },
  }),

  instruments: field({
    en: {
      title: "Instruments",
      description:
        "Instruments used to collect the data. Each needs an ID; when two or more platforms are defined, each instrument must also name its platform.",
    },
    fr: {
      title: "Instruments",
      description: "Instruments utilisés pour recueillir les données.",
    },
    tab: "platformInstruments",
    error: {
      en:
        "Instrument ID is required. When multiple platforms are defined, each instrument must be associated to a platform.",
      fr:
        "L'identifiant de l'instrument est requis. Lorsque plusieurs plates-formes sont définies, chaque instrument doit être associé à une plate-forme.",
    },
    schema: { type: "array", items: { $ref: "#/definitions/instrument" } },
  }),

  noPlatform: field({
    en: {
      title: "No platform",
      description: "Set when the dataset was not collected from a platform.",
    },
    fr: {
      title: "Aucune plateforme",
      description: "Coché lorsque les données ne proviennent pas d'une plateforme.",
    },
    tab: "platform",
    schema: { type: "boolean" },
  }),
};

export default platformProperties;
