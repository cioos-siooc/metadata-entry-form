import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Save } from "@mui/icons-material";
import { I18n, En, Fr } from "../../I18n";
import SchemaForm from "../../SchemaForm/SchemaForm";
import {
  loadFormTypes,
  createFormType,
  saveFormType,
  deleteFormType,
} from "../../../api/formTypes";
import { paperClass } from "../../FormComponents/QuestionStyles";

const NEW_TYPE = "__new__";

const STARTER_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string", title: "Name" },
  },
  required: ["name"],
};

const emptyForm = {
  slug: "",
  titleEn: "",
  titleFr: "",
  descriptionEn: "",
  descriptionFr: "",
  jsonSchemaText: JSON.stringify(STARTER_SCHEMA, null, 2),
  uiSchemaText: "{}",
  enabled: true,
};

function typeToForm(formType) {
  return {
    slug: formType.slug,
    titleEn: formType.title?.en || "",
    titleFr: formType.title?.fr || "",
    descriptionEn: formType.description?.en || "",
    descriptionFr: formType.description?.fr || "",
    jsonSchemaText: JSON.stringify(formType.jsonSchema, null, 2),
    uiSchemaText: JSON.stringify(formType.uiSchema, null, 2),
    enabled: formType.enabled,
  };
}

function parseJson(text) {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (err) {
    return { value: null, error: err.message };
  }
}

// Admin editor for form types: JSON Schema + UI Schema with a live preview.
export default function FormTypeEditor() {
  const { region } = useParams();

  const [formTypes, setFormTypes] = useState(null);
  const [selected, setSelected] = useState(null); // form type id or NEW_TYPE
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(
    () =>
      loadFormTypes(region, true)
        .then(setFormTypes)
        .catch((err) => setStatus({ severity: "error", message: err.message })),
    [region],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const jsonSchema = useMemo(() => parseJson(form.jsonSchemaText), [form.jsonSchemaText]);
  const uiSchema = useMemo(() => parseJson(form.uiSchemaText), [form.uiSchemaText]);

  if (!formTypes) return <CircularProgress />;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const select = (id) => {
    setStatus(null);
    setSelected(id);
    setForm(
      id === NEW_TYPE ? emptyForm : typeToForm(formTypes.find((formType) => formType.id === id)),
    );
  };

  async function handleSave() {
    if (jsonSchema.error || uiSchema.error) return;
    setSaving(true);
    setStatus(null);
    const payload = {
      title: { en: form.titleEn, fr: form.titleFr },
      description: { en: form.descriptionEn, fr: form.descriptionFr },
      jsonSchema: jsonSchema.value,
      uiSchema: uiSchema.value,
      enabled: form.enabled,
    };
    try {
      if (selected === NEW_TYPE) {
        const created = await createFormType(region, { ...payload, slug: form.slug.trim() });
        setSelected(created.id);
      } else {
        await saveFormType(region, selected, payload);
      }
      await reload();
      setStatus({ severity: "success", message: "Form type saved." });
    } catch (err) {
      setStatus({ severity: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setStatus(null);
    try {
      await deleteFormType(region, selected);
      setSelected(null);
      await reload();
    } catch (err) {
      setStatus({ severity: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Grid container direction="column" spacing={3}>
      <Grid>
        <Typography variant="h5">
          <I18n>
            <En>Form types</En>
            <Fr>Types de formulaires</Fr>
          </I18n>
        </Typography>
        <Typography variant="body2">
          <I18n
            en="Define forms with a JSON Schema (data) and UI Schema (presentation)."
            fr="Définissez des formulaires avec un schéma JSON (données) et un schéma d'interface (présentation)."
          />
        </Typography>
      </Grid>

      {status && (
        <Grid>
          <Alert severity={status.severity} onClose={() => setStatus(null)}>
            {status.message}
          </Alert>
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper style={paperClass}>
            <List dense>
              {formTypes.map((formType) => (
                <ListItemButton
                  key={formType.id}
                  selected={selected === formType.id}
                  onClick={() => select(formType.id)}
                >
                  <ListItemText
                    primary={formType.title?.en || formType.slug}
                    secondary={`${formType.slug} · v${formType.version}${formType.enabled ? "" : " · disabled"}`}
                  />
                </ListItemButton>
              ))}
            </List>
            <Button startIcon={<Add />} onClick={() => select(NEW_TYPE)}>
              <I18n en="New form type" fr="Nouveau type de formulaire" />
            </Button>
          </Paper>
        </Grid>

        {selected && (
          <>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper style={paperClass}>
                <Grid container spacing={2}>
                  {selected === NEW_TYPE && (
                    <Grid size={12}>
                      <TextField
                        name="slug"
                        label="Slug (URL key, e.g. cruise-report)"
                        value={form.slug}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Grid>
                  )}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="titleEn"
                      label="Title (EN)"
                      value={form.titleEn}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="titleFr"
                      label="Titre (FR)"
                      value={form.titleFr}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="descriptionEn"
                      label="Description (EN)"
                      value={form.descriptionEn}
                      onChange={handleChange}
                      fullWidth
                      multiline
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      name="descriptionFr"
                      label="Description (FR)"
                      value={form.descriptionFr}
                      onChange={handleChange}
                      fullWidth
                      multiline
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      name="jsonSchemaText"
                      label="JSON Schema"
                      value={form.jsonSchemaText}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      minRows={10}
                      error={Boolean(jsonSchema.error)}
                      helperText={jsonSchema.error}
                      slotProps={{ input: { style: { fontFamily: "monospace" } } }}
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      name="uiSchemaText"
                      label="UI Schema"
                      value={form.uiSchemaText}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      minRows={4}
                      error={Boolean(uiSchema.error)}
                      helperText={uiSchema.error}
                      slotProps={{ input: { style: { fontFamily: "monospace" } } }}
                    />
                  </Grid>
                  <Grid size={12} container alignItems="center" spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox name="enabled" checked={form.enabled} onChange={handleChange} />
                      }
                      label={<I18n en="Enabled" fr="Activé" />}
                    />
                    <Button
                      startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                      variant="contained"
                      disabled={
                        saving ||
                        Boolean(jsonSchema.error || uiSchema.error) ||
                        (selected === NEW_TYPE && !form.slug.trim())
                      }
                      onClick={handleSave}
                    >
                      <I18n en="Save" fr="Enregistrer" />
                    </Button>
                    {selected !== NEW_TYPE && (
                      <Button
                        startIcon={<Delete />}
                        color="error"
                        disabled={saving}
                        onClick={handleDelete}
                      >
                        <I18n en="Delete" fr="Supprimer" />
                      </Button>
                    )}
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper style={paperClass}>
                <Typography variant="h6" gutterBottom>
                  <I18n en="Preview" fr="Aperçu" />
                </Typography>
                {jsonSchema.error || uiSchema.error ? (
                  <Typography variant="body2" color="error">
                    <I18n
                      en="Fix the JSON above to see the preview."
                      fr="Corrigez le JSON ci-dessus pour voir l'aperçu."
                    />
                  </Typography>
                ) : (
                  <SchemaForm jsonSchema={jsonSchema.value} uiSchema={uiSchema.value}>
                    {/* hide the submit button in preview */}
                    <span />
                  </SchemaForm>
                )}
              </Paper>
            </Grid>
          </>
        )}
      </Grid>
    </Grid>
  );
}
