import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ArrowBack, Download, Publish, Save } from "@mui/icons-material";
import validator from "@rjsf/validator-ajv8";

import { En, Fr, I18n } from "../../I18n";
import FormShell from "../../../formEngine/FormShell";
import useFormStore from "../../../formEngine/useFormStore";
import { downloadJson } from "../../../formEngine/downloadFile";
import { schemaDiff, BREAKING, ERROR, validateUiSchema } from "@shared/formEngine";
import UiSchemaBuilder, { UiSchemaProblems } from "./UiSchemaBuilder";

const BLANK = {
  slug: "",
  kind: "generic",
  title: { en: "", fr: "" },
  description: { en: "", fr: "" },
  jsonSchema: { type: "object", properties: {} },
  uiSchema: {},
  status: "draft",
  version: 0,
};

/**
 * Authors one form type: JSON Schema, UI Schema, and a live preview.
 *
 * Editing changes only the WORKING COPY. Publishing freezes it as an immutable
 * version, which is what lets existing submissions keep rendering against the
 * schema they were filled in under.
 *
 * The preview renders through FormShell — the same component members use — so an
 * author sees tabs and conditional steps exactly as a respondent will. Previewing
 * through a bare form would hide the whole `ui:steps` layer.
 */
export default function FormTypeEditor() {
  const { language, region, formTypeId } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const isNew = !formTypeId || formTypeId === "new";

  const [formType, setFormType] = useState(isNew ? BLANK : null);
  const [schemaText, setSchemaText] = useState(
    isNew ? JSON.stringify(BLANK.jsonSchema, null, 2) : ""
  );
  const [uiText, setUiText] = useState(isNew ? "{}" : "");
  const [versions, setVersions] = useState([]);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [breakingDialog, setBreakingDialog] = useState(null);
  const [usage, setUsage] = useState(null);
  const [previewData, setPreviewData] = useState({});
  const [uiView, setUiView] = useState("builder");

  const idRef = useRef(isNew ? null : formTypeId);

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;

    Promise.all([
      store.getCatalogFormType(formTypeId),
      store.listVersions(formTypeId),
      // Who else depends on this form type. Since any region administrator can
      // publish, making cross-region impact visible is what limits blast radius.
      store.getUsage(formTypeId),
    ])
      .then(([entry, versionList, usageReport]) => {
        if (cancelled) return;
        if (!entry) {
          setError("Form type not found");
          return;
        }
        setFormType(entry);
        setSchemaText(JSON.stringify(entry.jsonSchema || {}, null, 2));
        setUiText(JSON.stringify(entry.uiSchema || {}, null, 2));
        setVersions(versionList);
        setUsage(usageReport);
      })
      .catch((err) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [store, formTypeId, isNew]);

  /** Parses both editors, reporting which one is malformed. */
  const parsed = useMemo(() => {
    try {
      const jsonSchema = JSON.parse(schemaText || "{}");
      try {
        const uiSchema = JSON.parse(uiText || "{}");
        return { jsonSchema, uiSchema, error: null };
      } catch (err) {
        return { error: `UI Schema: ${err.message}` };
      }
    } catch (err) {
      return { error: `JSON Schema: ${err.message}` };
    }
  }, [schemaText, uiText]);

  /** Compiling here surfaces a broken schema before it can be saved. */
  const compileError = useMemo(() => {
    if (!parsed.jsonSchema) return null;
    try {
      validator.validateFormData({}, parsed.jsonSchema);
      return null;
    } catch (err) {
      return err.message;
    }
  }, [parsed.jsonSchema]);

  /**
   * What the renderer would silently ignore in the UI Schema.
   *
   * Advisory only — it never gates `canSave`. Form types that shipped before
   * this check existed must keep saving, and every problem it reports is one the
   * renderer already tolerates at runtime.
   */
  const uiProblems = useMemo(() => {
    if (!parsed.uiSchema) return [];
    return validateUiSchema(parsed.jsonSchema, parsed.uiSchema);
  }, [parsed.jsonSchema, parsed.uiSchema]);

  const uiErrorCount = uiProblems.filter(
    (problem) => problem.severity === ERROR
  ).length;

  const pendingDiff = useMemo(() => {
    if (!parsed.jsonSchema || !versions.length) return null;
    return schemaDiff(versions[0].jsonSchema, parsed.jsonSchema);
  }, [parsed.jsonSchema, versions]);

  // Regions other than the one being browsed from. Publishing affects them too,
  // which is the thing a single-region admin would not otherwise see.
  const affectedRegions = usage?.regions || [];
  const otherRegions = affectedRegions.filter((name) => name !== region);

  function update(patch) {
    setFormType((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    if (parsed.error || compileError) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await store.saveCatalogFormType({
        ...formType,
        id: idRef.current || undefined,
        jsonSchema: parsed.jsonSchema,
        uiSchema: parsed.uiSchema,
      });
      idRef.current = saved.id;
      setFormType(saved);
      setStatus({
        severity: "success",
        message: language === "fr" ? "Enregistré." : "Saved.",
      });
      if (isNew) {
        navigate(
          `/${language}/${region}/admin/form-catalog/${saved.id}`,
          { replace: true }
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(confirmBreaking = false) {
    setBusy(true);
    setError(null);
    try {
      // Save first so the published version matches what is on screen.
      const saved = await store.saveCatalogFormType({
        ...formType,
        id: idRef.current || undefined,
        jsonSchema: parsed.jsonSchema,
        uiSchema: parsed.uiSchema,
      });
      idRef.current = saved.id;

      const published = await store.publishCatalogFormType(saved.id, {
        confirmBreaking,
      });
      const [entry, versionList, usageReport] = await Promise.all([
        store.getCatalogFormType(saved.id),
        store.listVersions(saved.id),
        store.getUsage(saved.id),
      ]);

      setFormType(entry);
      setVersions(versionList);
      setUsage(usageReport);
      setBreakingDialog(null);
      setStatus({
        severity: "success",
        message:
          language === "fr"
            ? `Version ${published.version} publiée.`
            : `Published version ${published.version}.`,
      });
    } catch (err) {
      if (err.changeClass === BREAKING) {
        setBreakingDialog({ changes: err.changes });
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (error && !formType) return <Alert severity="error">{error}</Alert>;
  if (!formType) return <CircularProgress />;

  const canSave = !parsed.error && !compileError && formType.slug;

  return (
    <div>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/${language}/${region}/admin/form-catalog`)}
        sx={{ mb: 2 }}
      >
        <I18n en="Form catalog" fr="Catalogue de formulaires" />
      </Button>

      <Grid container alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h5">
          {formType.title?.[language] ||
            formType.title?.en ||
            (language === "fr" ? "Nouveau formulaire" : "New form type")}
        </Typography>
        <Chip size="small" label={formType.status} />
        {formType.version > 0 && (
          <Chip size="small" label={`v${formType.version}`} color="success" />
        )}
      </Grid>

      {status && (
        <Alert severity={status.severity} sx={{ mb: 2 }} onClose={() => setStatus(null)}>
          {status.message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {(parsed.error || compileError) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {parsed.error || compileError}
        </Alert>
      )}
      {otherRegions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>
            <I18n
              en="This form type is in use by other regions"
              fr="Ce type de formulaire est utilisé par d'autres régions"
            />
          </AlertTitle>
          {otherRegions
            .map(
              (name) =>
                `${name} (${usage.submissionCounts?.[name] ?? 0} ${
                  language === "fr" ? "soumissions" : "submissions"
                })`
            )
            .join(", ")}
        </Alert>
      )}
      {pendingDiff?.changeClass === BREAKING && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>
            <I18n en="Unpublished breaking change" fr="Changement incompatible non publié" />
          </AlertTitle>
          <I18n
            en="Existing submissions may not validate against this schema. Drafts will stay pinned to their current version."
            fr="Les soumissions existantes pourraient ne pas être valides. Les brouillons resteront à leur version actuelle."
          />
        </Alert>
      )}

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid>
          <Button startIcon={<Save />} disabled={!canSave || busy} onClick={handleSave}>
            <I18n en="Save draft" fr="Enregistrer le brouillon" />
          </Button>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<Publish />}
            disabled={!canSave || busy}
            onClick={() => handlePublish(false)}
          >
            <I18n en="Publish" fr="Publier" />
          </Button>
        </Grid>
        <Grid>
          <Button
            startIcon={<Download />}
            onClick={() =>
              downloadJson(
                JSON.stringify(
                  {
                    slug: formType.slug,
                    kind: formType.kind,
                    title: formType.title,
                    description: formType.description,
                    jsonSchema: parsed.jsonSchema ?? formType.jsonSchema,
                    uiSchema: parsed.uiSchema ?? formType.uiSchema,
                  },
                  null,
                  2
                ),
                `${formType.slug || "form-type"}.formtype.json`
              )
            }
          >
            <I18n en="Export definition" fr="Exporter la définition" />
          </Button>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(event, next) => setTab(next)} sx={{ mb: 2 }}>
        <Tab label={<I18n en="Details" fr="Détails" />} />
        <Tab label={<I18n en="JSON Schema" fr="Schéma JSON" />} />
        <Tab
          label={
            <Grid container spacing={1} alignItems="center" wrap="nowrap">
              <I18n en="UI Schema" fr="Schéma d'interface" />
              {uiErrorCount > 0 && (
                <Chip size="small" color="error" label={uiErrorCount} />
              )}
            </Grid>
          }
        />
        <Tab label={<I18n en="Preview" fr="Aperçu" />} />
        <Tab label={<I18n en="Versions" fr="Versions" />} />
      </Tabs>

      {tab === 0 && (
        <Grid container direction="column" spacing={2} sx={{ maxWidth: 640 }}>
          <Grid>
            <TextField
              fullWidth
              required
              label={<I18n en="Slug (global, URL-safe)" fr="Identifiant (global)" />}
              value={formType.slug}
              onChange={(event) =>
                update({ slug: event.target.value.toLowerCase().trim() })
              }
              helperText="edna-field"
            />
          </Grid>
          {["en", "fr"].map((lang) => (
            <Grid key={`title-${lang}`}>
              <TextField
                fullWidth
                label={`${language === "fr" ? "Titre" : "Title"} (${lang})`}
                value={formType.title?.[lang] || ""}
                onChange={(event) =>
                  update({ title: { ...formType.title, [lang]: event.target.value } })
                }
              />
            </Grid>
          ))}
          {["en", "fr"].map((lang) => (
            <Grid key={`desc-${lang}`}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={`${language === "fr" ? "Description" : "Description"} (${lang})`}
                value={formType.description?.[lang] || ""}
                onChange={(event) =>
                  update({
                    description: {
                      ...formType.description,
                      [lang]: event.target.value,
                    },
                  })
                }
              />
            </Grid>
          ))}
        </Grid>
      )}

      {tab === 1 && (
        <TextField
          fullWidth
          multiline
          minRows={24}
          value={schemaText}
          onChange={(event) => setSchemaText(event.target.value)}
          slotProps={{ input: { style: { fontFamily: "monospace", fontSize: 13 } } }}
        />
      )}

      {tab === 2 && (
        <>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <I18n>
              <En>
                Controls presentation only — which tab a field appears in, its
                bilingual label and help, how it is typed in, and when it is
                shown. What is <em>valid</em> stays the JSON Schema&apos;s job.
              </En>
              <Fr>
                Contrôle uniquement la présentation — l&apos;onglet où apparaît un
                champ, son étiquette et son aide bilingues, son mode de saisie et
                sa visibilité. La <em>validité</em> reste du ressort du schéma
                JSON.
              </Fr>
            </I18n>
          </Typography>

          <UiSchemaProblems problems={uiProblems} language={language} />

          <ToggleButtonGroup
            size="small"
            exclusive
            value={uiView}
            onChange={(event, next) => next && setUiView(next)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="builder">
              <I18n en="Builder" fr="Générateur" />
            </ToggleButton>
            <ToggleButton value="json">
              <I18n en="JSON" fr="JSON" />
            </ToggleButton>
          </ToggleButtonGroup>

          {uiView === "json" || parsed.error ? (
            <>
              {parsed.error && uiView === "builder" && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <I18n
                    en="The builder needs both schemas to parse. Fix the JSON below to go back to it."
                    fr="Le générateur a besoin que les deux schémas soient valides. Corrigez le JSON ci-dessous pour y revenir."
                  />
                </Alert>
              )}
              <TextField
                fullWidth
                multiline
                minRows={22}
                value={uiText}
                onChange={(event) => setUiText(event.target.value)}
                slotProps={{
                  input: { style: { fontFamily: "monospace", fontSize: 13 } },
                }}
              />
            </>
          ) : (
            <UiSchemaBuilder
              jsonSchema={parsed.jsonSchema}
              value={parsed.uiSchema}
              language={language}
              // The text stays the single source of truth, so the JSON view,
              // Save, Publish, Export, and the breaking-change diff all keep
              // reading exactly one place.
              onChange={(next) => setUiText(JSON.stringify(next, null, 2))}
            />
          )}
        </>
      )}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          {parsed.error ? (
            <Alert severity="warning">{parsed.error}</Alert>
          ) : (
            <FormShell
              jsonSchema={parsed.jsonSchema}
              uiSchema={parsed.uiSchema}
              formData={previewData}
              onChange={setPreviewData}
              language={language}
              context={{ canEdit: true }}
            />
          )}
        </Paper>
      )}

      {tab === 4 && (
        <Box>
          {versions.length === 0 ? (
            <Alert severity="info">
              <I18n
                en="Not published yet. Publishing freezes the current schema as version 1."
                fr="Pas encore publié. La publication gèle le schéma actuel comme version 1."
              />
            </Alert>
          ) : (
            versions.map((version) => (
              <Paper key={version.version} variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Grid container spacing={2} alignItems="center">
                  <Chip size="small" label={`v${version.version}`} />
                  <Typography variant="body2">
                    {String(version.publishedAt || "").slice(0, 16).replace("T", " ")}
                  </Typography>
                  {version.changeClass && (
                    <Chip
                      size="small"
                      variant="outlined"
                      color={version.changeClass === BREAKING ? "warning" : "default"}
                      label={version.changeClass}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {Object.keys(version.jsonSchema?.properties || {}).length}{" "}
                    <I18n en="fields" fr="champs" />
                  </Typography>
                </Grid>
              </Paper>
            ))
          )}
        </Box>
      )}

      <Dialog open={Boolean(breakingDialog)} onClose={() => setBreakingDialog(null)}>
        <DialogTitle>
          <I18n en="Publish a breaking change?" fr="Publier un changement incompatible ?" />
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <I18n>
              <En>
                Existing submissions may no longer validate. Drafts stay pinned to
                the version they were started with, so nobody loses data — but new
                submissions will use this schema.
              </En>
              <Fr>
                Les soumissions existantes pourraient ne plus être valides. Les
                brouillons restent à leur version d'origine, donc aucune donnée
                n'est perdue — mais les nouvelles soumissions utiliseront ce schéma.
              </Fr>
            </I18n>
          </Typography>
          {affectedRegions.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>
                <I18n en="Regions affected" fr="Régions touchées" />
              </AlertTitle>
              {affectedRegions
                .map(
                  (name) =>
                    `${name} (${usage.submissionCounts?.[name] ?? 0} ${
                      language === "fr" ? "soumissions" : "submissions"
                    })`
                )
                .join(", ")}
            </Alert>
          )}
          {(breakingDialog?.changes || [])
            .filter((change) => change.kind === BREAKING)
            .map((change) => (
              <Typography
                key={`${change.path}-${change.detail}`}
                variant="caption"
                component="div"
              >
                <code>{change.path || "/"}</code> — {change.detail}
              </Typography>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakingDialog(null)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={busy}
            onClick={() => handlePublish(true)}
          >
            <I18n en="Publish anyway" fr="Publier quand même" />
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
