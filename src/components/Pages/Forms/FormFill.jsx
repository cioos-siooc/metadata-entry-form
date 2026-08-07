import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { ArrowBack, Save, Send, Undo } from "@mui/icons-material";
import validator from "@rjsf/validator-ajv8";

import { I18n } from "../../I18n";
import FormShell from "../../../formEngine/FormShell";
import useFormStore from "../../../formEngine/useFormStore";
import { formTypeLabel, resolveSteps } from "@shared/formEngine";
import { paperClass } from "../../FormComponents/QuestionStyles";

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
export default function FormFill() {
  const { language, region, formTypeSlug, submissionID } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

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
            ? await store.getSubmission(submissionIdRef.current)
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
        setFormData(existing?.data || {});
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store, formTypeSlug, language]);

  const handleChange = useCallback((next) => {
    setFormData(next);
    setDirty(true);
  }, []);

  async function persist(nextStatus) {
    setBusy(true);
    setStatus(null);
    try {
      let saved;
      if (submissionIdRef.current) {
        saved = await store.saveSubmission(
          submissionIdRef.current,
          formData,
          nextStatus
        );
      } else {
        saved = await store.createSubmission(formType.id, formData);
        submissionIdRef.current = saved.id;
        if (nextStatus && nextStatus !== "draft") {
          saved = await store.saveSubmission(saved.id, formData, nextStatus);
        }
        // Replace the URL so a refresh reopens the saved draft rather than a
        // second blank one.
        navigate(`/${language}/${region}/forms/${formTypeSlug}/${saved.id}`, {
          replace: true,
        });
      }

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

  const readOnly = submission?.status === "submitted";

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/${language}/${region}/forms`)}
        >
          <I18n en="All forms" fr="Tous les formulaires" />
        </Button>
      </Grid>

      <Grid container alignItems="center" spacing={2}>
        <Typography variant="h5">{formTypeLabel(formType, language)}</Typography>
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
        <Typography variant="caption" color="text.secondary">
          <I18n en="Version" fr="Version" />{" "}
          {submission?.formTypeVersion ?? formType.resolvedVersion}
        </Typography>
      </Grid>

      {status && (
        <Grid>
          <Alert severity={status.severity} onClose={() => setStatus(null)}>
            {status.message}
          </Alert>
        </Grid>
      )}

      {readOnly && (
        <Grid>
          <Alert severity="info">
            <I18n
              en="This form has been submitted and is read-only. Return it to draft to make changes."
              fr="Ce formulaire a été soumis et est en lecture seule. Remettez-le en brouillon pour le modifier."
            />
          </Alert>
        </Grid>
      )}

      <Grid>
        <Paper style={paperClass}>
          <FormShell
            jsonSchema={formType.jsonSchema}
            uiSchema={formType.uiSchema}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            disabled={readOnly || busy}
            language={language}
            errorsByStep={errorsByStep}
            context={{ canEdit: !readOnly }}
            actions={
              <Grid container spacing={1} sx={{ mt: 2, mx: 1 }}>
                {!readOnly && (
                  <>
                    <Grid>
                      <Button
                        startIcon={
                          busy ? <CircularProgress size={18} /> : <Save />
                        }
                        disabled={busy || !dirty}
                        onClick={() => persist("draft")}
                      >
                        <I18n
                          en="Save draft"
                          fr="Enregistrer le brouillon"
                        />
                      </Button>
                    </Grid>
                    <Grid>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Send />}
                        disabled={busy}
                      >
                        <I18n en="Submit" fr="Soumettre" />
                      </Button>
                    </Grid>
                  </>
                )}
                {readOnly && (
                  <Grid>
                    <Button
                      startIcon={<Undo />}
                      disabled={busy}
                      onClick={() => persist("draft")}
                    >
                      <I18n
                        en="Return to draft"
                        fr="Remettre en brouillon"
                      />
                    </Button>
                  </Grid>
                )}
              </Grid>
            }
          />
        </Paper>
      </Grid>
    </Grid>
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
