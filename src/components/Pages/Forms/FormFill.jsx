import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Box,
  LinearProgress,
  Typography,
} from "@mui/material";
import { ArrowBack, Save, Send, Undo } from "@mui/icons-material";
import validator from "@rjsf/validator-ajv8";

import { I18n } from "../../I18n";
import FormShell from "../../../formEngine/FormShell";
import useFormStore from "../../../formEngine/useFormStore";
import useMetadataRecordForm from "../../../formEngine/useMetadataRecordForm";
import { runHook } from "../../../formEngine/hooks";
import { formTypeLabel, resolveSteps } from "@shared/formEngine";
import {
  METADATA_RECORD_KIND,
  METADATA_RECORD_SLUG,
} from "../../../formEngine/metadataRecordForm";
import { getBlankRecord } from "../../../utils/blankRecord";
import SubmitPanel from "../../FormComponents/SubmitPanel";
import { UserContext } from "../../../providers/UserProvider";

/**
 * Fills in or edits one submission.
 *
 * Two behaviours worth calling out:
 *
 *   The submission row is created on the first SAVE, not on arrival. Creating it
 *   when the page opens — as the earlier prototype did — leaves an empty draft
 *   behind every time somebody clicks a form out of curiosity.
 *
 *   Drafts save without validation; Submit validates first. Half-finished
 *   drafts are the normal state of a form being filled in over days.
 */
export default function FormFill({ formTypeSlug: fixedSlug }) {
  const params = useParams();
  const { language, region, submissionID: submissionParam } = params;
  // The record keeps its historic URL, /{language}/{region}/{userID}/{recordID},
  // so old bookmarks and emailed links keep working — and so a reviewer or a
  // shared-with user can open a record they do not own. On that route the form
  // type is fixed by the route rather than named in it.
  const formTypeSlug =
    fixedSlug || params.formTypeSlug || METADATA_RECORD_SLUG;
  const submissionID = submissionParam ?? params.recordID;
  const ownerID = params.userID;
  const navigate = useNavigate();
  const store = useFormStore();
  const cloudFunctions = useContext(UserContext);

  const [formType, setFormType] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState(null);
  const [errorsByStep, setErrorsByStep] = useState({});
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Holds the created submission id between the first save and a re-render.
  const submissionIdRef = useRef(submissionID === "new" ? null : submissionID);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const existing =
          submissionIdRef.current && submissionIdRef.current !== "new"
            ? await store.getSubmission(submissionIdRef.current, {
                ...(ownerID ? { ownerId: ownerID } : {}),
              })
            : null;

        // An existing submission renders against the version it was started
        // with, never "latest" — that is the whole point of pinning.
        const type = await store.getFormType(
          existing?.formTypeId || formTypeSlug,
          existing ? { version: existing.formTypeVersion } : {}
        );

        if (cancelled) return;
        if (!type) {
          setLoadError(
            language === "fr" ? "Formulaire introuvable." : "Form not found."
          );
          return;
        }

        setFormType(type);
        setSubmission(existing);
        // A new record starts from the blank record, exactly as the
        // hand-written form did: validate.js walks arrays like contacts and
        // distribution without guarding, so an empty {} throws before the first
        // tab can render.
        setFormData(
          existing?.data ||
            (type.kind === METADATA_RECORD_KIND ? getBlankRecord() : {})
        );
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store, formTypeSlug, language, ownerID]);

  const handleChange = useCallback((next) => {
    setFormData(next);
    setDirty(true);
  }, []);

  const readOnly = submission?.status === "submitted";

  // Null for every form except the metadata record. Everything record-shaped —
  // the generated schema, the tab validation, the saved libraries, the DOI
  // plumbing — arrives through here so this page stays generic.
  const record = useMetadataRecordForm({
    kind: formType?.kind,
    formData,
    onChange: handleChange,
    canEdit: !readOnly,
  });

  async function persist(nextStatus) {
    setBusy(true);
    setStatus(null);
    try {
      // A status change may need to happen elsewhere first — the record keeps
      // its DataCite draft in step. This runs BEFORE the write so a rejected
      // DOI update is visible before the record claims to be submitted.
      if (nextStatus && nextStatus !== submission?.status) {
        await runHook(formType.kind, "beforeStatusChange", {
          region,
          language,
          datacitePrefix: cloudFunctions?.datacitePrefix,
          submission: { id: submissionIdRef.current, data: formData },
        });
      }

      let saved;
      if (submissionIdRef.current) {
        saved = await store.saveSubmission(
          submissionIdRef.current,
          formData,
          nextStatus,
          ownerID ? { ownerId: ownerID } : {}
        );
      } else {
        saved = await store.createSubmission(formType.id, formData);
        submissionIdRef.current = saved.id;
        if (nextStatus && nextStatus !== "draft") {
          saved = await store.saveSubmission(saved.id, formData, nextStatus);
        }
        // Replace the URL so a refresh reopens the saved draft rather than a
        // second blank one.
        // A record goes to its historic owner-scoped URL; anything else keeps
        // the generic /forms/{slug}/{id} shape.
        navigate(
          formType.kind === METADATA_RECORD_KIND
            ? `/${language}/${region}/${saved.userID}/${saved.id}`
            : `/${language}/${region}/forms/${formTypeSlug}/${saved.id}`,
          { replace: true }
        );
      }

      // Never allowed to fail the save: the row is already written.
      await runHook(formType.kind, "afterSave", {
        region,
        userID: saved.userID,
        submission: saved,
        cloudFunctions,
      });

      setSubmission(saved);
      setDirty(false);
      setStatus({
        severity: "success",
        message:
          nextStatus === "submitted"
            ? language === "fr"
              ? "Formulaire soumis."
              : "Form submitted."
            : language === "fr"
              ? "Brouillon enregistré."
              : "Draft saved.",
      });
    } catch (err) {
      setStatus({ severity: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit() {
    // The record keeps its own validator: src/utils/validate.js drives the
    // progress bar, the record list and the submit panel, so running rjsf's
    // validation as well would show two disagreeing sets of errors.
    if (record) {
      persist("submitted");
      return;
    }

    // Validate against the UNFILTERED schema: cross-field rules span steps, so
    // the per-step subschema cannot see them.
    const { errors } = validator.validateFormData(formData, formType.jsonSchema);
    if (errors.length) {
      setErrorsByStep(groupErrorsByStep(errors, formType));
      setStatus({
        severity: "error",
        message:
          language === "fr"
            ? `${errors.length} champ(s) à corriger avant la soumission.`
            : `${errors.length} field(s) need attention before submitting.`,
      });
      return;
    }
    setErrorsByStep({});
    persist("submitted");
  }

  if (loadError) return <Alert severity="error">{loadError}</Alert>;
  if (!formType) return <CircularProgress />;

  return (
    // A plain flex column with `gap`, NOT <Grid container spacing>. MUI
    // implements Grid gutters as NEGATIVE MARGINS on the container plus padding
    // on the children, which makes the container wider than its parent by the
    // spacing amount — so a Grid container can never be constrained to its
    // parent's width. `gap` adds space between children without resizing
    // anything.
    //
    // minWidth: 0 is also load-bearing: a flex child defaults to
    // `min-width: auto` and refuses to shrink below its content's intrinsic
    // width, and a scrollable <Tabs> reports the full width of all eleven step
    // names. Without it the column cannot shrink to the viewport.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
        width: "100%",
        maxWidth: "min(1100px, 100%)",
        pr: 2,
      }}
    >
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() =>
            navigate(
              record
                ? `/${language}/${region}/submissions`
                : `/${language}/${region}/forms`
            )
          }
        >
          {record ? (
            <I18n en="My Records" fr="Mes enregistrements" />
          ) : (
            <I18n en="All forms" fr="Tous les formulaires" />
          )}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          minWidth: 0,
        }}
      >
        <Typography variant="h5">
          {record ? (
            formData?.title?.[language] ||
            formData?.title?.en ||
            formData?.title?.fr || <I18n en="New Record" fr="Nouvel enregistrement" />
          ) : (
            formTypeLabel(formType, language)
          )}
        </Typography>
        <Chip
          size="small"
          color={readOnly ? "success" : "default"}
          label={
            readOnly ? (
              <I18n en="Submitted" fr="Soumis" />
            ) : (
              <I18n en="Draft" fr="Brouillon" />
            )
          }
        />
        {/* The record's schema is generated per render, so it has no pinned
            version to show — printing "Version" with nothing after it is worse
            than printing nothing. */}
        {!record && (
          <Typography variant="caption" color="text.secondary">
            <I18n en="Version" fr="Version" />{" "}
            {submission?.formTypeVersion ?? formType.resolvedVersion}
          </Typography>
        )}
      </Box>

      {status && (
        <Alert severity={status.severity} onClose={() => setStatus(null)}>
          {status.message}
        </Alert>
      )}

      {readOnly && (
        <Alert severity="info">
          <I18n
            en="This form has been submitted and is read-only. Return it to draft to make changes."
            fr="Ce formulaire a été soumis et est en lecture seule. Remettez-le en brouillon pour le modifier."
          />
        </Alert>
      )}

      {record && <CompletenessBar value={record.percentComplete} />}

      <Box sx={{ minWidth: 0 }}>
        {/* No wrapping Paper: QuestionFieldTemplate gives every question its
            own, and paperClass is 90% wide with a 20px margin — nesting them
            puts each question at 81% behind doubled margins. The hand-written
            form wrapped its tabs in a bare Grid for exactly this reason. */}
        <FormShell
            jsonSchema={record?.jsonSchema ?? formType.jsonSchema}
            uiSchema={record?.uiSchema ?? formType.uiSchema}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            disabled={readOnly || busy}
            language={language}
            errorsByStep={record?.errorsByStep ?? errorsByStep}
            context={{ canEdit: !readOnly, ...(record?.context || {}) }}
            extraSteps={
              record
                ? [
                    {
                      id: "submit",
                      title: { en: "Submit", fr: "Soumettre" },
                      // Not a set of questions, so it cannot be schema
                      // properties — resolveSteps drops a step with no fields.
                      render: () => (
                        <SubmitPanel
                          record={formData}
                          submitRecord={() => persist("submitted")}
                          userID={formData?.userID || cloudFunctions?.user?.uid}
                        />
                      ),
                    },
                  ]
                : []
            }
            actions={
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {!readOnly && (
                  <>
                    <Button
                      startIcon={busy ? <CircularProgress size={18} /> : <Save />}
                      disabled={busy || !dirty}
                      onClick={() => persist("draft")}
                    >
                      <I18n en="Save draft" fr="Enregistrer le brouillon" />
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Send />}
                      disabled={busy}
                    >
                      <I18n en="Submit" fr="Soumettre" />
                    </Button>
                  </>
                )}
                {readOnly && (
                  <Button
                    startIcon={<Undo />}
                    disabled={busy}
                    onClick={() => persist("draft")}
                  >
                    <I18n en="Return to draft" fr="Remettre en brouillon" />
                  </Button>
                )}
              </Box>
            }
        />
      </Box>
    </Box>
  );
}

/** How complete the record is, by the same measure the record list shows. */
function CompletenessBar({ value }) {
  const percent = Math.round((value || 0) * 100);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <LinearProgress variant="determinate" value={percent} />
      </Box>
      <Typography variant="body2" color="text.secondary">{`${percent}%`}</Typography>
    </Box>
  );
}

/**
 * Buckets ajv errors by the step that owns the offending field, so each tab can
 * show a count. Errors on fields no step claims land on the first step rather
 * than disappearing.
 */
export function groupErrorsByStep(errors, formType) {
  const steps = resolveSteps(formType.jsonSchema, formType.uiSchema);
  const owner = {};
  steps.forEach((step) => {
    step.fields.forEach((field) => {
      owner[field] = step.id;
    });
  });

  return errors.reduce((acc, error) => {
    // "/siteName/en" and a root-level "must have required property 'x'" both
    // need to resolve to a top-level property name.
    const fromPath = String(error.property || error.instancePath || "")
      .replace(/^[./]/, "")
      .split(/[./[]/)[0];
    const field = fromPath || error.params?.missingProperty;
    const stepId = owner[field] || steps[0]?.id;
    if (!stepId) return acc;
    acc[stepId] = [...(acc[stepId] || []), error];
    return acc;
  }, {});
}
