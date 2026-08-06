import { field } from "../annotations";
import { recordStatusValues, regionValues } from "../enums";

/**
 * Bookkeeping fields. Not rendered as questions — they are set by the app, the
 * database path, or the publishing pipeline. They are still part of the record
 * and so must be described, or conformance runs flag them as undeclared.
 */
export const systemProperties = {
  identifier: field({
    en: { title: "Identifier", description: "UUID v4 assigned when the record is created." },
    fr: { title: "Identifiant", description: "UUID v4 attribué à la création de l'enregistrement." },
    schema: { type: "string" },
  }),

  recordID: field({
    en: { title: "Record ID", description: "Realtime Database key for this record." },
    fr: { title: "ID d'enregistrement", description: "Clé de la base de données pour cet enregistrement." },
    schema: { type: "string" },
  }),

  userID: field({
    en: { title: "User ID", description: "Owning user's Firebase auth UID." },
    fr: { title: "ID utilisateur", description: "UID Firebase du propriétaire." },
    schema: { type: "string" },
  }),

  region: field({
    en: { title: "Region", description: "CIOOS region the record belongs to." },
    fr: { title: "Région", description: "Région du SIOOC à laquelle appartient l'enregistrement." },
    schema: { type: "string", enum: ["", ...regionValues] },
  }),

  status: field({
    en: {
      title: "Status",
      description: 'Record lifecycle. An empty string means draft.',
    },
    fr: {
      title: "Statut",
      description: "Cycle de vie de l'enregistrement. Une chaîne vide signifie brouillon.",
    },
    schema: { type: "string", enum: recordStatusValues },
  }),

  created: field({
    en: { title: "Created", description: "ISO-8601 timestamp of record creation." },
    fr: { title: "Créé le", description: "Horodatage ISO-8601 de la création." },
    schema: { type: "string" },
  }),

  timeFirstPublished: field({
    en: { title: "First published", description: "ISO-8601 timestamp of first publication." },
    fr: { title: "Première publication", description: "Horodatage ISO-8601 de la première publication." },
    schema: { type: "string" },
  }),

  lastEditedBy: field({
    en: { title: "Last edited by", description: "The user who last saved the record." },
    fr: { title: "Dernière modification par", description: "Le dernier utilisateur ayant enregistré." },
    schema: { $ref: "#/definitions/lastEditedBy" },
  }),

  userinfo: field({
    en: { title: "User info", description: "Denormalized owner display name and email." },
    fr: { title: "Infos utilisateur", description: "Nom et courriel du propriétaire, dénormalisés." },
    schema: { $ref: "#/definitions/userinfo" },
  }),

  filename: field({
    en: { title: "Filename", description: "Generated filename used when publishing." },
    fr: { title: "Nom de fichier", description: "Nom de fichier généré lors de la publication." },
    schema: { type: "string" },
  }),

  organization: field({
    en: { title: "Organization", description: "Publishing organization." },
    fr: { title: "Organisme", description: "Organisme de publication." },
    schema: { type: "string" },
  }),

  comment: field({
    en: { title: "Comment", description: "Reviewer comment attached to the record." },
    fr: { title: "Commentaire", description: "Commentaire d'un réviseur." },
    schema: { type: "string" },
  }),

  category: field({
    en: {
      title: "Category (deprecated)",
      description:
        "Superseded by resourceType. Still read as a fallback by the Python converter.",
    },
    fr: {
      title: "Catégorie (obsolète)",
      description: "Remplacé par resourceType.",
    },
    schema: { type: "string" },
  }),

  schemaVersion: field({
    en: {
      title: "Schema version",
      description:
        "Version of this schema the record was written against. Absent on records predating the schema.",
    },
    fr: {
      title: "Version du schéma",
      description:
        "Version du schéma utilisée lors de l'écriture de l'enregistrement.",
    },
    schema: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
  }),
};

export default systemProperties;
