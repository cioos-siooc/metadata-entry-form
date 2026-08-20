import firebaseFormStore from "./firebaseFormStore";
import recordFormStore from "./recordFormStore";
import {
  METADATA_RECORD_SLUG,
  METADATA_RECORD_KIND,
} from "../metadataRecordForm";

/**
 * The metadata record's catalog entry, synthesized rather than stored.
 *
 * It deliberately does NOT live in /formTypes, and is not something a region
 * opts into. The record IS the application; requiring someone to seed a form
 * type and enable it per region before anybody could write a record would make
 * the core function of the app fail closed on a missing database row.
 *
 * jsonSchema and uiSchema are empty here because they are generated per render
 * from src/schema/ — see metadataRecordForm.js. resolvedVersion is null for the
 * same reason: there is no published snapshot to pin a submission to.
 */
const METADATA_RECORD_FORM_TYPE = {
  id: METADATA_RECORD_SLUG,
  slug: METADATA_RECORD_SLUG,
  kind: METADATA_RECORD_KIND,
  title: {
    en: "Metadata record",
    fr: "Enregistrement de métadonnées",
  },
  description: {
    en: "A CIOOS metadata record describing a dataset.",
    fr: "Un enregistrement de métadonnées du SIOOC décrivant un jeu de données.",
  },
  jsonSchema: {},
  uiSchema: {},
  status: "published",
  version: 0,
  resolvedVersion: null,
  enabled: true,
  sortOrder: -1,
};

const isRecordType = (slugOrId) =>
  slugOrId === METADATA_RECORD_SLUG ||
  slugOrId?.slugOrId === METADATA_RECORD_SLUG;

/**
 * Routes submission calls to the adapter that owns that kind of row.
 *
 * Metadata records live in their own RTDB tree and predate the engine by years;
 * generic form submissions live under `formSubmissions` with a cross-user index.
 * Everything ABOVE this line — the pages, FormShell, the catalog — is written
 * against one FormStore and does not know which it is talking to.
 *
 * Catalog, version and activation calls are not routed: there is one catalog,
 * and the record's entry lives in it like any other.
 */

function storeFor(formTypeId) {
  return formTypeId === METADATA_RECORD_SLUG
    ? recordFormStore
    : firebaseFormStore;
}

/**
 * Submission ids are unique within their own tree but carry no marker saying
 * which tree that is, so a call that knows only an id has to find the row.
 * Records are checked first: they are the common case, and a generic lookup
 * against the record tree is a cheap miss.
 */
async function locate(args) {
  const record = await recordFormStore.getSubmission(args).catch(() => null);
  if (record) return { store: recordFormStore, submission: record };

  const generic = await firebaseFormStore.getSubmission(args).catch(() => null);
  if (generic) return { store: firebaseFormStore, submission: generic };

  return { store: null, submission: null };
}

export const routedFormStore = {
  ...firebaseFormStore,

  getFormType: async (args) => {
    if (isRecordType(args) || isRecordType(args?.slugOrId)) {
      return METADATA_RECORD_FORM_TYPE;
    }
    return firebaseFormStore.getFormType(args);
  },

  listFormTypes: async (args = {}) => {
    const stored = await firebaseFormStore.listFormTypes(args);
    // First in the list: it is what most people came here to fill in.
    return [METADATA_RECORD_FORM_TYPE, ...stored];
  },

  listSubmissions: async (args = {}) => {
    if (args.formTypeId) return storeFor(args.formTypeId).listSubmissions(args);
    // No form type named: both trees, so "everything I have" means everything.
    const [records, generic] = await Promise.all([
      args.ownerId ? recordFormStore.listSubmissions(args) : [],
      firebaseFormStore.listSubmissions(args),
    ]);
    return [...records, ...generic];
  },

  getSubmission: async (args) => {
    if (args.formTypeId) return storeFor(args.formTypeId).getSubmission(args);
    const { submission } = await locate(args);
    return submission;
  },

  createSubmission: (args) => storeFor(args.formTypeId).createSubmission(args),

  saveSubmission: async (args) => {
    if (args.formTypeId) return storeFor(args.formTypeId).saveSubmission(args);
    const { store } = await locate(args);
    if (!store) throw new Error(`Submission ${args.id} not found`);
    return store.saveSubmission(args);
  },

  deleteSubmission: async (args) => {
    if (args.formTypeId) return storeFor(args.formTypeId).deleteSubmission(args);
    const { store } = await locate(args);
    if (!store) throw new Error(`Submission ${args.id} not found`);
    return store.deleteSubmission(args);
  },
};

export default routedFormStore;
