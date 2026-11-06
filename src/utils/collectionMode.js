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
