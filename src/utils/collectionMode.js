// Helpers for the Collections metadata profile prototype.
// A record is in "Collection mode" when its ISO resource scope is "collection".

export const isCollection = (record) =>
  Boolean(record) && record.metadataScopeIso === "collection";

// Tabs that are not part of the Collections profile.
export const tabsHiddenForCollections = ["taxa", "platform"];

// MD_ProgressCode values the Collections profile allows for status.
export const collectionProgressCodes = ["onGoing", "completed"];

// The three guided lineage prompts for Collections, stored in record.collectionLineage
export const collectionLineagePrompts = [
  {
    key: "membership",
    question: {
      en: "What are the membership criteria?",
      fr: "Quels sont les critères d'appartenance?",
    },
    hint: {
      en: "Which datasets belong in this Collection, and why?",
      fr: "Quels jeux de données font partie de cette collection, et pourquoi?",
    },
  },
  {
    key: "assembly",
    question: {
      en: "How is the Collection assembled, and who decides what is included?",
      fr: "Comment la collection est-elle constituée, et qui décide de son contenu?",
    },
    hint: {
      en: "For example, a program manager reviews new datasets each quarter.",
      fr: "Par exemple, un gestionnaire de programme examine les nouveaux jeux de données chaque trimestre.",
    },
  },
  {
    key: "governance",
    question: {
      en: "What governing framework or funding is the Collection part of?",
      fr: "De quel cadre de gouvernance ou financement la collection relève-t-elle?",
    },
    hint: {
      en: "For example, a monitoring program, a project or a funding agreement.",
      fr: "Par exemple, un programme de surveillance, un projet ou une entente de financement.",
    },
  },
];

// Fields hidden when a record is a Collection. `default` values set automatically
// by the form are not counted as user data.
export const datasetOnlyFields = [
  {
    key: "eov",
    label: {
      en: "Essential Ocean Variables",
      fr: "Variables océaniques essentielles",
    },
  },
  {
    key: "taxa",
    label: { en: "Taxonomic coverage", fr: "Couverture taxonomique" },
  },
  { key: "platforms", label: { en: "Platforms", fr: "Plateformes" } },
  { key: "instruments", label: { en: "Instruments", fr: "Instruments" } },
  {
    key: "history",
    label: {
      en: "Lineage sources and processing steps",
      fr: "Sources et étapes de traitement de la généalogie",
    },
  },
];

// Fields hidden when a record is not a Collection.
export const collectionOnlyFields = [
  { key: "purpose", label: { en: "Purpose", fr: "Objectif" } },
  { key: "credit", label: { en: "Credit", fr: "Reconnaissance" } },
  {
    key: "maintenanceFrequency",
    default: "asNeeded",
    label: {
      en: "Membership update frequency",
      fr: "Fréquence de mise à jour de la composition",
    },
  },
  {
    key: "maintenanceText",
    label: {
      en: "Membership-update policy",
      fr: "Politique de mise à jour de la composition",
    },
  },
  {
    key: "maintenanceDate",
    label: {
      en: "Last membership change",
      fr: "Dernière modification de la composition",
    },
  },
  {
    key: "accessConstraint",
    default: "unrestricted",
    label: { en: "Access constraint", fr: "Contrainte d'accès" },
  },
  {
    key: "useConstraint",
    default: "licence",
    label: { en: "Use constraint", fr: "Contrainte d'utilisation" },
  },
  {
    key: "otherConstraints",
    label: { en: "Other constraints", fr: "Autres contraintes" },
  },
  {
    key: "collectionLineage",
    label: {
      en: "Collection lineage questions",
      fr: "Questions de généalogie de la collection",
    },
  },
];

// True when a value holds user-entered content: a non-empty string or array,
// or an object (e.g. bilingual {en, fr}) with any filled value.
const hasContent = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object")
    return Object.entries(value).some(
      ([k, v]) => k !== "translations" && hasContent(v),
    );
  return Boolean(value);
};

// Fields that hold data and would become hidden by switching to newScopeIso
export const filledFieldsHiddenBy = (record, newScopeIso) => {
  const toCollection = newScopeIso === "collection";
  if (toCollection === isCollection(record)) return [];
  const fields = toCollection ? datasetOnlyFields : collectionOnlyFields;
  return fields.filter(
    (field) =>
      hasContent(record[field.key]) && record[field.key] !== field.default,
  );
};
