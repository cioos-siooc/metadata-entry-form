import metadataRecordHooks from "./metadataRecordHooks";

/**
 * Side effects that belong to one KIND of form, kept out of the pages.
 *
 * A metadata record has to regenerate its catalogue XML and keep its DataCite
 * draft in step; an eDNA form has neither concern. Putting that in FormFill
 * would make the generic editor grow a `if (kind === "metadataRecord")` branch
 * for every record-specific behaviour, which is how the hand-written form got
 * to 729 lines. Registering by kind keeps FormFill generic.
 *
 * A hook must NEVER fail a save. The record is already written by the time
 * afterSave runs, and a catalogue regeneration that 500s is not a reason to
 * tell the user their work was lost. Failures are returned, not thrown.
 */
const REGISTRY = {
  metadataRecord: metadataRecordHooks,
};

export function hooksFor(kind) {
  return REGISTRY[kind] || {};
}

/**
 * Runs one hook, swallowing whatever it throws.
 *
 * @returns {Promise<{ok: boolean, value?: unknown, error?: Error}>}
 */
export async function runHook(kind, name, args) {
  const hook = hooksFor(kind)[name];
  if (!hook) return { ok: true };

  try {
    return { ok: true, value: await hook(args) };
  } catch (error) {
    console.error(`form hook ${kind}.${name} failed:`, error);
    return { ok: false, error };
  }
}

export default REGISTRY;
