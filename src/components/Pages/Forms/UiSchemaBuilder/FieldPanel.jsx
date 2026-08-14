import React from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  getFieldWidget,
  setFieldI18n,
  setFieldVisibleIf,
  setFieldWidget,
  widgetsForProperty,
} from "@shared/formEngine";
import VisibleIfEditor from "./VisibleIfEditor";
import HelpTextEditor from "./HelpTextEditor";
import WidgetOptionsGroup from "./WidgetOptionsGroup";
import { SectionHeader, quietButtonProps } from "./primitives";
import { stepIndexOfField } from "./selection";
import { LANGUAGES, localized, pick } from "./language";

/**
 * Everything a form type can say about one property.
 *
 * The widget picker is filtered through `widgetsForProperty`, so it cannot offer
 * a checkbox list for a string or a date widget for a number — the class of
 * mistake that used to render as a silent fallback to the default widget.
 *
 * Sections are ordered by how often they are edited: a label is what almost every
 * visit is for, and where a field SITS is read-only here because moving it is a
 * canvas gesture — the rows there show type and label, which is what you need in
 * order to decide where it belongs.
 */
export default function FieldPanel({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  field,
  onSelectStep,
}) {
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

  const available = widgetsForProperty(property);
  const currentWidget = getFieldWidget(uiSchema, field);
  const selectedWidget = available.find((w) => w.name === currentWidget);

  const steps = Array.isArray(uiSchema?.["ui:steps"]) ? uiSchema["ui:steps"] : [];
  const stepIndex = stepIndexOfField(steps, field);

  return (
    <Stack spacing={2}>
      {/*
        The field's name, type and required marker are drawn by the Inspector,
        which owns the panel's identity line. Repeating them here would put the
        same property name on screen twice.
      */}
      <Typography variant="caption" color="text.secondary">
        {pick(
          language,
          "Field names and types come from the JSON Schema tab.",
          "Les noms et types de champs proviennent de l'onglet Schéma JSON."
        )}
      </Typography>

      <Box role="group" aria-label={pick(language, "Label", "Étiquette")}>
        <SectionHeader title={pick(language, "Label", "Étiquette")} />
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

      <HelpTextEditor
        uiSchema={uiSchema}
        onChange={onChange}
        language={language}
        field={field}
      />

      <Box>
        <SectionHeader title={pick(language, "Input", "Saisie")} />
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
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{ mt: 0.5 }}
          >
            {selectedWidget.description[language] || selectedWidget.description.en}
          </Typography>
        )}

        <WidgetOptionsGroup
          options={selectedWidget?.options}
          uiSchema={uiSchema}
          onChange={onChange}
          language={language}
          field={field}
          values={options}
        />
      </Box>

      <VisibleIfEditor
        jsonSchema={jsonSchema}
        value={options.visibleIf}
        language={language}
        excludeField={field}
        onChange={(rule) => onChange(setFieldVisibleIf(uiSchema, field, rule))}
      />

      {steps.length > 0 && (
        <Box>
          <SectionHeader title={pick(language, "Placement", "Emplacement")} />
          {stepIndex === null ? (
            <Typography variant="caption" color="text.secondary" component="div">
              {pick(
                language,
                'In no tab, so it renders in the trailing "Other" tab.',
                "Dans aucun onglet ; il s'affiche donc dans l'onglet « Autre »."
              )}
            </Typography>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary">
                {pick(language, "In tab", "Dans l'onglet")}
              </Typography>
              <Button
                {...quietButtonProps}
                onClick={() => onSelectStep(stepIndex)}
                sx={{ ...quietButtonProps.sx, textTransform: "none" }}
              >
                {localized(
                  steps[stepIndex].title,
                  language,
                  steps[stepIndex].id || `step-${stepIndex + 1}`
                )}
              </Button>
            </Stack>
          )}
          <Typography
            variant="caption"
            color="text.disabled"
            component="div"
            sx={{ mt: 0.5 }}
          >
            {pick(
              language,
              "Move it with the row's controls on the left.",
              "Déplacez-le avec les contrôles de la ligne à gauche."
            )}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
