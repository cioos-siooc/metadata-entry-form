/**
 * Form type definitions kept in the repo.
 *
 * These are DATA, not code — the engine renders whatever schema it is handed, so
 * adding a form type means adding a JSON file here (or authoring one in the
 * catalog UI), never writing a component.
 *
 * They live in git so that form definitions are code-reviewable. A schema with
 * 20+ fields and bilingual guidance for each is exactly the kind of thing that
 * should show up in a diff rather than only in a database.
 *
 * Import them into a live database from the catalog page ("Import JSON"), or in
 * bulk with `seedFormCatalog`.
 */

import ednaField from "./edna-field.formtype.json";
import ednaLab from "./edna-lab.formtype.json";

export const seedFormTypes = [ednaField, ednaLab];

/**
 * Creates any missing seed form types in the global catalog, leaving existing
 * ones alone.
 *
 * Deliberately does NOT publish them: publishing freezes a version that regions
 * can then pin, so it stays an explicit act by a human who has reviewed the
 * preview. Nor does it enable them anywhere — activation is each region's call.
 *
 * @param {Object} store   a FormStore (see useFormStore)
 * @param {Object} [options]
 * @param {boolean} [options.publish] also publish version 1 of each new type
 * @returns {Promise<{created: string[], skipped: string[], published: string[]}>}
 */
export async function seedFormCatalog(store, { publish = false } = {}) {
  const existing = await store.listCatalog({ includeDeprecated: true });
  const bySlug = new Set(existing.map((entry) => entry.slug));

  const created = [];
  const skipped = [];
  const published = [];

  // Sequential rather than parallel: saveCatalogFormType checks slug
  // uniqueness by reading the catalog, so concurrent writes could both pass.
  for (const definition of seedFormTypes) {
    if (bySlug.has(definition.slug)) {
      skipped.push(definition.slug);
      continue;
    }
    const saved = await store.saveCatalogFormType(definition);
    created.push(definition.slug);

    if (publish) {
      await store.publishCatalogFormType(saved.id, { confirmBreaking: false });
      published.push(definition.slug);
    }
  }

  return { created, skipped, published };
}

export default seedFormTypes;
