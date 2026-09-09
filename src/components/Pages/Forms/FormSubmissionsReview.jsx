import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ArrowBack,
  DataObject,
  TableChart,
  Visibility,
} from "@mui/icons-material";

import { En, Fr, I18n } from "../../I18n";
import useFormStore from "../../../formEngine/useFormStore";
import { downloadCsv, downloadJson } from "../../../formEngine/downloadFile";
import {
  buildExportTable,
  exportFilename,
  formTypeLabel,
  summaryColumns,
  summaryHeader,
  summaryValue,
  toCsv,
  toJson,
} from "@shared/formEngine";

/**
 * Reviewer view of every submission for one form type, with export.
 *
 * This is the "export the study metadata" deliverable. Columns are derived from
 * the form's schema rather than from the data, so the CSV has the same shape
 * every time and includes fields nobody filled in — which is what makes it
 * usable as a template as well as a data dump.
 *
 * Export runs client-side: the rows are already loaded to render the preview,
 * so pushing this through a cloud function would only add latency and a second
 * place for the format to drift.
 */
export default function FormSubmissionsReview() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [formTypes, setFormTypes] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubmissions] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    store
      .listFormTypes({ includeDisabled: true })
      .then((types) => {
        if (cancelled) return;
        setFormTypes(types);
        if (types.length) setSelectedId((current) => current || types[0].id);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [store]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    setSubmissions(null);
    store
      .listSubmissions({ formTypeId: selectedId })
      .then((rows) => !cancelled && setSubmissions(rows))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [store, selectedId]);

  const formType = useMemo(
    () => (formTypes || []).find((t) => t.id === selectedId),
    [formTypes, selectedId]
  );

  const filtered = useMemo(
    () =>
      (submissions || []).filter(
        (s) => statusFilter === "all" || s.status === statusFilter
      ),
    [submissions, statusFilter]
  );

  // A few identifying columns, not the whole export. A 25-field form produces a
  // 30-column table nobody can read; the full shape belongs in the download.
  const columns = useMemo(
    () =>
      formType
        ? summaryColumns(formType.jsonSchema, formType.uiSchema)
        : [],
    [formType]
  );

  // Only used to report how wide the export will be.
  const exportWidth = useMemo(() => {
    if (!formType || !filtered.length) return 0;
    return buildExportTable({
      jsonSchema: formType.jsonSchema,
      submissions: filtered,
      language,
    }).headers.length;
  }, [formType, filtered, language]);

  function stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function handleCsv() {
    downloadCsv(
      toCsv({ jsonSchema: formType.jsonSchema, submissions: filtered, language }),
      exportFilename({
        slug: formType.slug,
        region,
        stamp: stamp(),
        extension: "csv",
      })
    );
  }

  function handleJson() {
    downloadJson(
      toJson({ formType, submissions: filtered, region }),
      exportFilename({
        slug: formType.slug,
        region,
        stamp: stamp(),
        extension: "json",
      })
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!formTypes) return <CircularProgress />;

  if (!formTypes.length) {
    return (
      <Alert severity="info">
        <I18n
          en="No form types exist yet."
          fr="Aucun type de formulaire n'existe encore."
        />
      </Alert>
    );
  }

  return (
    <div>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/${language}/${region}/forms`)}
        sx={{ mb: 2 }}
      >
        <I18n en="All forms" fr="Tous les formulaires" />
      </Button>

      <Typography variant="h5" sx={{ mb: 2 }}>
        <I18n en="Form submissions" fr="Soumissions de formulaires" />
      </Typography>

      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="form-type-label">
              <I18n en="Form" fr="Formulaire" />
            </InputLabel>
            <Select
              labelId="form-type-label"
              value={selectedId}
              label={language === "fr" ? "Formulaire" : "Form"}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {formTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {formTypeLabel(type, language)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="status-label">
              <I18n en="Status" fr="Statut" />
            </InputLabel>
            <Select
              labelId="status-label"
              value={statusFilter}
              label={language === "fr" ? "Statut" : "Status"}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="all">
                <I18n en="All" fr="Tous" />
              </MenuItem>
              <MenuItem value="submitted">
                <I18n en="Submitted" fr="Soumis" />
              </MenuItem>
              <MenuItem value="draft">
                <I18n en="Draft" fr="Brouillon" />
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid>
          <Button
            startIcon={<TableChart />}
            disabled={!formType || !filtered.length}
            onClick={handleCsv}
          >
            <I18n en="Export CSV" fr="Exporter en CSV" />
          </Button>
        </Grid>
        <Grid>
          <Button
            startIcon={<DataObject />}
            disabled={!formType || !filtered.length}
            onClick={handleJson}
          >
            <I18n en="Export JSON" fr="Exporter en JSON" />
          </Button>
        </Grid>
      </Grid>

      {!submissions ? (
        <CircularProgress />
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          <I18n>
            <En>No submissions match this filter.</En>
            <Fr>Aucune soumission ne correspond à ce filtre.</Fr>
          </I18n>
        </Alert>
      ) : (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {filtered.length} <I18n en="submission(s)" fr="soumission(s)" />
            {" · "}
            <I18n
              en={`export has ${exportWidth} columns`}
              fr={`l'export contient ${exportWidth} colonnes`}
            />
          </Typography>

          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ whiteSpace: "nowrap" }}>
                      {summaryHeader(column, language)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <I18n en="Status" fr="Statut" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Submitted by" fr="Soumis par" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Updated" fr="Mis à jour" />
                  </TableCell>
                  <TableCell align="right">
                    <I18n en="Actions" fr="Actions" />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.slice(0, 100).map((submission) => (
                  <TableRow
                    key={submission.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() =>
                      navigate(
                        `/${language}/${region}/forms/review/${submission.id}`
                      )
                    }
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{
                          whiteSpace: "nowrap",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {summaryValue(submission, column)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          submission.status === "submitted"
                            ? "success"
                            : "default"
                        }
                        label={
                          submission.status === "submitted" ? (
                            <I18n en="Submitted" fr="Soumis" />
                          ) : (
                            <I18n en="Draft" fr="Brouillon" />
                          )
                        }
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {submission.lastEditedBy?.email || submission.userID}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {String(submission.updatedAt || "")
                        .slice(0, 16)
                        .replace("T", " ")}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={<I18n en="Open" fr="Ouvrir" />}
                      >
                        <IconButton size="small">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {filtered.length > 100 && (
            <Typography variant="caption" color="text.secondary">
              <I18n
                en="Showing the first 100. The export includes all of them."
                fr="Affichage des 100 premières. L'export contient toutes les soumissions."
              />
            </Typography>
          )}
        </>
      )}
    </div>
  );
}
