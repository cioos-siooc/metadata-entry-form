import React, { useEffect, useRef, useState } from "react";
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
import { Save, Send, Undo } from "@mui/icons-material";
import { I18n } from "../../I18n";
import SchemaForm from "../../SchemaForm/SchemaForm";
import { getFormType } from "../../../api/formTypes";
import { getFormSubmission, saveFormSubmission } from "../../../api/formSubmissions";
import { paperClass } from "../../FormComponents/QuestionStyles";

// Fill/edit one schema-driven form submission. Drafts save without
// validation; Submit validates client-side (RJSF/ajv) and server-side.
export default function FormFill() {
  const { language, region, formTypeId, submissionId } = useParams();
  const navigate = useNavigate();

  const [formType, setFormType] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [status, setStatus] = useState(null); // {severity, message, details?}
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(null);
  // RJSF owns the live form data between saves
  const dataRef = useRef({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFormType(region, formTypeId), getFormSubmission(region, submissionId)])
      .then(([type, sub]) => {
        if (cancelled) return;
        dataRef.current = sub.data || {};
        setFormType(type);
        setSubmission(sub);
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [region, formTypeId, submissionId]);

  if (loadError) return <Typography color="error">{loadError}</Typography>;
  if (!formType || !submission) return <CircularProgress />;

  const readOnly = submission.status === "submitted";

  async function save(newStatus) {
    setBusy(true);
    setStatus(null);
    try {
      const updated = await saveFormSubmission(region, submissionId, dataRef.current, newStatus);
      setSubmission(updated);
      setStatus({
        severity: "success",
        message:
          newStatus === "submitted"
            ? language === "fr"
              ? "Formulaire soumis."
              : "Form submitted."
            : language === "fr"
              ? "Brouillon enregistré."
              : "Draft saved.",
      });
    } catch (err) {
      setStatus({
        severity: "error",
        message: err.message,
        details: err.body?.validationErrors,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Grid container direction="column" spacing={2}>
      <Grid container alignItems="center" spacing={2}>
        <Typography variant="h5">
          {formType.title?.[language] || formType.title?.en || formType.slug}
        </Typography>
        <Chip
          label={
            submission.status === "submitted" ? (
              <I18n en="Submitted" fr="Soumis" />
            ) : (
              <I18n en="Draft" fr="Brouillon" />
            )
          }
          color={submission.status === "submitted" ? "success" : "default"}
          size="small"
        />
      </Grid>

      {status && (
        <Grid>
          <Alert severity={status.severity} onClose={() => setStatus(null)}>
            {status.message}
            {status.details?.length > 0 && (
              <ul>
                {status.details.map((e) => (
                  <li key={`${e.instancePath}-${e.message}`}>
                    {e.instancePath || "(root)"} {e.message}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        </Grid>
      )}

      <Grid>
        <Paper style={paperClass}>
          <SchemaForm
            jsonSchema={formType.jsonSchema}
            uiSchema={formType.uiSchema}
            formData={submission.data}
            disabled={readOnly || busy}
            onChange={(data) => {
              dataRef.current = data;
            }}
            onSubmit={() => save("submitted")}
          >
            <Grid container spacing={1} style={{ marginTop: "16px" }}>
              {!readOnly && (
                <>
                  <Grid>
                    <Button
                      startIcon={busy ? <CircularProgress size={20} /> : <Save />}
                      disabled={busy}
                      onClick={() => save("draft")}
                    >
                      <I18n en="Save draft" fr="Enregistrer le brouillon" />
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
                  <Button startIcon={<Undo />} disabled={busy} onClick={() => save("draft")}>
                    <I18n en="Return to draft" fr="Remettre en brouillon" />
                  </Button>
                </Grid>
              )}
              <Grid>
                <Button
                  disabled={busy}
                  onClick={() => navigate(`/${language}/${region}/forms/mine`)}
                >
                  <I18n en="Back to my submissions" fr="Retour à mes soumissions" />
                </Button>
              </Grid>
            </Grid>
          </SchemaForm>
        </Paper>
      </Grid>
    </Grid>
  );
}
