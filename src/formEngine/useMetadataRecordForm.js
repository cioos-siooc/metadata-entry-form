import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { UserContext } from "../providers/UserProvider";
import regions from "../regions";
import { getRegionProjects } from "../utils/firebaseRecordFunctions";
import { getErrorsByTab, percentValid, validateField } from "../utils/validate";
import { buildMetadataRecordForm, METADATA_RECORD_KIND } from "./metadataRecordForm";
import useRecordLibraries from "./useRecordLibraries";

/**
 * Everything the metadata record needs that a generic form does not.
 *
 * Returns null for any other kind of form, so FormFill carries ONE branch
 * instead of a record-shaped concern in every handler. That split is the reason
 * the generic editor can stay generic: the record's tabs, validation, progress
 * bar, saved libraries and DOI plumbing all arrive through here.
 *
 * @param {object} args
 * @param {string} args.kind        the form type's kind
 * @param {object} args.formData    the record being edited
 * @param {(next: object) => void} args.onChange
 * @param {boolean} args.canEdit
 * @returns {null | {jsonSchema, uiSchema, context, errorsByStep, percentComplete}}
 */
export default function useMetadataRecordForm({
  kind,
  formData,
  onChange,
  canEdit,
}) {
  const { region, language } = useParams();
  const { user, isReviewer, datacitePrefix } = useContext(UserContext);
  const [projects, setProjects] = useState([]);

  const isRecord = kind === METADATA_RECORD_KIND;
  const libraries = useRecordLibraries({ region, enabled: isRecord });

  useEffect(() => {
    if (!isRecord || !region) return undefined;
    let cancelled = false;
    getRegionProjects(region)
      .then((list) => {
        if (!cancelled) setProjects(list);
      })
      // A region with no project list is normal, not an error.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isRecord, region]);

  // Memoized on its real inputs: FormShell memoizes on object identity and rjsf
  // rebuilds its schema utils whenever the schema differs, so a fresh object
  // every render would defeat both.
  const built = useMemo(
    () =>
      isRecord
        ? buildMetadataRecordForm({
            language,
            regionInfo: regions[region],
            projects,
          })
        : null,
    [isRecord, language, region, projects]
  );

  // The two setter shapes the existing FormComponents expect. Several of them
  // write a SIBLING field (DOIInput writes doiCreationStatus, the topic
  // categories write eov), which rjsf's onChange cannot express.
  const updateRecord = useMemo(
    () => (key) => (value) => onChange({ ...formData, [key]: value }),
    [formData, onChange]
  );
  const handleUpdateRecord = useMemo(
    () => (key) => (event) => onChange({ ...formData, [key]: event.target.value }),
    [formData, onChange]
  );

  const context = useMemo(
    () => ({
      region,
      language,
      projects,
      canEdit,
      // Only the owner may share, and a record being created has no owner yet.
      canShare: Boolean(
        canEdit && (!formData?.userID || formData.userID === user?.uid)
      ),
      isReviewer,
      datacitePrefix,
      updateRecord,
      handleUpdateRecord,
      // RequiredMark asks this rather than importing validate.js, which pulls
      // firebase into the form engine.
      isFieldValid: (name) => validateField(formData || {}, name),
      ...libraries,
    }),
    [
      region,
      language,
      projects,
      canEdit,
      formData,
      user,
      isReviewer,
      datacitePrefix,
      updateRecord,
      handleUpdateRecord,
      libraries,
    ]
  );

  if (!isRecord) return null;

  return {
    jsonSchema: built.jsonSchema,
    uiSchema: built.uiSchema,
    context,
    // getErrorsByTab is keyed by the same x-cioos-tab values the generator uses
    // as step ids, so this needs no adapter — and the tabs gain per-tab error
    // counts the hand-written form never had.
    errorsByStep: getErrorsByTab(formData || {}),
    percentComplete: percentValid(formData || {}),
  };
}
