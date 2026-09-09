import React, { useEffect, useState } from "react";
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
import { ArrowBack, DataObject, Print, TableChart } from "@mui/icons-material";

import { I18n } from "../../I18n";
import FormShell from "../../../formEngine/FormShell";
import useFormStore from "../../../formEngine/useFormStore";
import { downloadCsv, downloadJson } from "../../../formEngine/downloadFile";
import {
  exportFilename,
  formTypeLabel,
  toCsv,
  toJson,
} from "@shared/formEngine";
import { paperClass } from "../../FormComponents/QuestionStyles";

/**
 * One submission, read-only, rendered through the same FormShell used to fill it
 * in — so a reviewer sees the author's answers laid out under the same steps and
 * labels rather than as a row of a wide table.
 *
 * Two things this deliberately does differently from FormFill:
 *
 *   It fetches WITHOUT an owner id, resolving the submission through the region
 *   index, because a reviewer is reading somebody else's work.
 *
 *   It renders against the submission's own pinned formTypeVersion. Showing a
 *   completed form against a newer schema would misrepresent what the author
 *   actually filled in.
 */
export default function FormSubmissionDetail() {
  const { language, region, submissionID } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [submission, setSubmission] = useState(null);
  const [formType, setFormType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // No ownerId: reviewers read submissions they do not own.
        const found = await store.getSubmission(submissionID, {
          ownerId: undefined,
        });
        if (cancelled) return;
        if (!found) {
          setError(
            language === "fr" ? "Soumission introuvable." : "Submission not found."
          );
          return;
        }

        const type = await store.getFormType(found.formTypeId, {
          version: found.formTypeVersion,
        });
        if (cancelled) return;
        setSubmission(found);
        setFormType(type);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store, submissionID, language]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!submission || !formType) return <CircularProgress />;

  const stamp = new Date().toISOString().slice(0, 10);
  const identifier =
    submission.data?.sampleId || submission.id.slice(0, 8);

  function handleCsv() {
    downloadCsv(
      toCsv({
        jsonSchema: formType.jsonSchema,
        submissions: [submission],
        language,
      }),
      exportFilename({
        slug: `${formType.slug}-${identifier}`,
        region,
        stamp,
        extension: "csv",
      })
    );
  }

  function handleJson() {
    downloadJson(
      toJson({ formType, submissions: [submission], region }),
      exportFilename({
        slug: `${formType.slug}-${identifier}`,
        region,
        stamp,
        extension: "json",
      })
    );
  }

  return (
    <Grid container direction="column" spacing={2}>
      <Grid>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/${language}/${region}/forms/review`)}
        >
          <I18n en="All submissions" fr="Toutes les soumissions" />
        </Button>
      </Grid>

      <Grid container alignItems="center" spacing={2}>
        <Typography variant="h5">{formTypeLabel(formType, language)}</Typography>
        <Chip
          size="small"
          color={submission.status === "submitted" ? "success" : "default"}
          label={
            submission.status === "submitted" ? (
              <I18n en="Submitted" fr="Soumis" />
            ) : (
              <I18n en="Draft" fr="Brouillon" />
            )
          }
        />
        <Typography variant="caption" color="text.secondary">
          <I18n en="Version" fr="Version" /> {submission.formTypeVersion}
        </Typography>
      </Grid>

      <Grid>
        <Typography variant="body2" color="text.secondary">
          <I18n en="Submitted by" fr="Soumis par" />{" "}
          {submission.lastEditedBy?.email || submission.userID}
          {" · "}
          <I18n en="Last updated" fr="Dernière mise à jour" />{" "}
          {String(submission.updatedAt || "").slice(0, 16).replace("T", " ")}
        </Typography>
      </Grid>

      <Grid container spacing={1}>
        <Grid>
          <Button startIcon={<TableChart />} onClick={handleCsv}>
            <I18n en="Export CSV" fr="Exporter en CSV" />
          </Button>
        </Grid>
        <Grid>
          <Button startIcon={<DataObject />} onClick={handleJson}>
            <I18n en="Export JSON" fr="Exporter en JSON" />
          </Button>
        </Grid>
        <Grid>
          <Button startIcon={<Print />} onClick={() => window.print()}>
            <I18n en="Print" fr="Imprimer" />
          </Button>
        </Grid>
      </Grid>

      <Grid>
        <Paper style={paperClass}>
          {/* Disabled rather than a bespoke read-only renderer: the author's
              answers appear in exactly the layout they were entered in. */}
          <FormShell
            jsonSchema={formType.jsonSchema}
            uiSchema={formType.uiSchema}
            formData={submission.data || {}}
            disabled
            readonly
            language={language}
            context={{ canEdit: false }}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
