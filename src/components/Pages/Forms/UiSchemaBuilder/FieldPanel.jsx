import React, { useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  UI_OPTIONS,
  getFieldWidget,
  setFieldI18n,
  setFieldOption,
  setFieldVisibleIf,
  setFieldWidget,
  widgetsForProperty,
} from "@shared/formEngine";
import VisibleIfEditor from "./VisibleIfEditor";
import { LANGUAGES, pick } from "./language";

/**
 * Everything a form type can say about one property.
 *
 * The widget picker is filtered through `widgetsForProperty`, so it cannot offer
 * a checkbox list for a string or a date widget for a number — the class of
 * mistake that used to render as a silent fallback to the default widget.
 *
 * Help text is markdown, matching QuestionFieldTemplate, and is previewed with
 * the same renderer so what an author sees here is what a respondent gets.
 */

function OptionControl({ name, value, onChange, language }) {
  const definition = UI_OPTIONS[name];
  if (!definition) return null;
  const label = definition.label[language] || definition.label.en;

  if (definition.type === "boolean") {
    return (
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={Boolean(value)}
            onChange={(event) =>
              onChange(event.target.checked ? true : undefined)
            }
          />
        }
        label={label}
      />
    );
  }

  if (definition.type === "integer") {
    return (
      <TextField
        size="small"
        type="number"
        label={label}
        value={value ?? ""}
        onChange={(event) => {
          const parsed = parseInt(event.target.value, 10);
          onChange(Number.isNaN(parsed) ? undefined : parsed);
        }}
        sx={{ width: 120 }}
      />
    );
  }

  if (definition.type === "string") {
    return (
      <TextField
        size="small"
        label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: 180 }}
      />
    );
  }

  // Object-valued options (optionTooltips) have no dedicated control; showing
  // the count keeps the author aware it is set rather than hiding it.
  return (
    <Chip
      size="small"
      variant="outlined"
      label={`${label}: ${Object.keys(value || {}).length}`}
    />
  );
}

export default function FieldPanel({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  field,
}) {
  const [showHelpPreview, setShowHelpPreview] = useState(false);

  if (!field) {
    return (
      <Alert severity="info">
        {pick(
          language,
          "Select a field on the left to edit its label, help text, widget, and visibility.",
          "Sélectionnez un champ à gauche pour modifier son étiquette, son aide, son widget et sa visibilité."
        )}
      </Alert>
    );
  }

  const property = jsonSchema?.properties?.[field];
  if (!property) {
    return (
      <Alert severity="warning">
        {pick(
          language,
          `"${field}" is not a property of the JSON Schema.`,
          `« ${field} » n'est pas une propriété du schéma JSON.`
        )}
      </Alert>
    );
  }

  const entry = uiSchema?.[field] || {};
  const options = entry["ui:options"] || {};
  const i18n = options.i18n || {};
  const required = (jsonSchema?.required || []).includes(field);

  const available = widgetsForProperty(property);
  const currentWidget = getFieldWidget(uiSchema, field);
  const selectedWidget = available.find((w) => w.name === currentWidget);

  return (
    <Stack spacing={2}>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="subtitle1" sx={{ fontFamily: "monospace" }}>
            {field}
          </Typography>
          <Chip size="small" label={property.type || "any"} />
          {required && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={pick(language, "required", "obligatoire")}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {pick(
            language,
            "Field names and types come from the JSON Schema tab.",
            "Les noms et types de champs proviennent de l'onglet Schéma JSON."
          )}
        </Typography>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {pick(language, "Label", "Étiquette")}
        </Typography>
        <Stack spacing={1}>
          {LANGUAGES.map((lang) => (
            <TextField
              key={`title-${lang}`}
              size="small"
              fullWidth
              label={`${pick(language, "Label", "Étiquette")} (${lang})`}
              value={i18n.title?.[lang] || ""}
              onChange={(event) =>
                onChange(setFieldI18n(uiSchema, field, "title", lang, event.target.value))
              }
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">
            {pick(language, "Help text", "Texte d'aide")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pick(language, "markdown", "markdown")}
          </Typography>
          <FormControlLabel
            sx={{ ml: "auto" }}
            control={
              <Checkbox
                size="small"
                checked={showHelpPreview}
                onChange={(event) => setShowHelpPreview(event.target.checked)}
              />
            }
            label={
              <Typography variant="caption">
                {pick(language, "Preview", "Aperçu")}
              </Typography>
            }
          />
        </Stack>
        <Stack spacing={1}>
          {LANGUAGES.map((lang) => (
            <Box key={`help-${lang}`}>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                label={`${pick(language, "Help", "Aide")} (${lang})`}
                value={i18n.help?.[lang] || ""}
                onChange={(event) =>
                  onChange(setFieldI18n(uiSchema, field, "help", lang, event.target.value))
                }
              />
              {showHelpPreview && i18n.help?.[lang] && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    mt: 0.5,
                    borderLeft: 2,
                    borderColor: "divider",
                    fontSize: 14,
                  }}
                >
                  <Markdown remarkPlugins={[remarkGfm]}>{i18n.help[lang]}</Markdown>
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <FormControl size="small" fullWidth>
          <InputLabel id={`widget-${field}`}>
            {pick(language, "Input type", "Type de saisie")}
          </InputLabel>
          <Select
            labelId={`widget-${field}`}
            label={pick(language, "Input type", "Type de saisie")}
            value={selectedWidget ? currentWidget : ""}
            onChange={(event) =>
              onChange(setFieldWidget(uiSchema, field, event.target.value))
            }
          >
            <MenuItem value="">
              {pick(language, "Default for this type", "Par défaut pour ce type")}
            </MenuItem>
            {available.map((widget) => (
              <MenuItem key={widget.name} value={widget.name}>
                {widget.label[language] || widget.label.en}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {currentWidget && !selectedWidget && (
          // A name the registry does not know, or one that cannot render this
          // property. Leave it in place and say so rather than resetting it.
          <Alert severity="warning" sx={{ mt: 1 }}>
            {pick(
              language,
              `"${currentWidget}" is set but is not a custom input this app registers for a "${
                property.type || "any"
              }" property. Clear it, or edit it in the JSON view.`,
              `« ${currentWidget} » est défini mais n'est pas une saisie personnalisée enregistrée pour une propriété « ${
                property.type || "any"
              } ». Effacez-le ou modifiez-le dans la vue JSON.`
            )}
          </Alert>
        )}

        {selectedWidget?.description && (
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {selectedWidget.description[language] || selectedWidget.description.en}
          </Typography>
        )}

        {selectedWidget?.options?.length > 0 && (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1.5 }}
          >
            {selectedWidget.options.map((name) => (
              <OptionControl
                key={name}
                name={name}
                value={options[name]}
                language={language}
                onChange={(value) =>
                  onChange(setFieldOption(uiSchema, field, name, value))
                }
              />
            ))}
          </Stack>
        )}
      </Box>

      <Divider />

      <VisibleIfEditor
        jsonSchema={jsonSchema}
        value={options.visibleIf}
        language={language}
        excludeField={field}
        onChange={(rule) => onChange(setFieldVisibleIf(uiSchema, field, rule))}
      />
    </Stack>
  );
}
