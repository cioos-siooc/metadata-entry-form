import React, { useState } from "react";
import {
  Alert,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { alpha } from "@mui/material/styles";

import FieldPanel from "./FieldPanel";
import StepSettingsPanel from "./StepSettingsPanel";
import InspectorPreview from "./InspectorPreview";
import { FieldName, MetaTag, segmentedSx } from "./primitives";
import { stepIndexOfField } from "./selection";
import { localized, pick } from "./language";

/**
 * The right-hand panel: settings for whatever is selected.
 *
 * WHY A BREADCRUMB AND NOT A TOGGLE. A Field|Step toggle would imply two states
 * that are always both available, and they are not: an unassigned field has no
 * parent step, and a step has no "current field" until one is picked. A
 * two-crumb path states the relationship instead of hiding it, and doubles as
 * the way back — clicking the step crumb selects the step, clicking the field
 * crumb returns to the field, one click each.
 */

/** One crumb. A button when it leads somewhere, plain text when it does not. */
function Crumb({ label, mono, active, onClick, disabled }) {
  const content = mono ? (
    <FieldName sx={{ color: "inherit" }}>{label}</FieldName>
  ) : (
    <Typography component="span" variant="body2" noWrap sx={{ whiteSpace: "nowrap" }}>
      {label}
    </Typography>
  );

  if (disabled) {
    return (
      <Box
        component="span"
        sx={{ px: 0.5, color: "text.disabled", minWidth: 0, display: "flex" }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      sx={(t) => ({
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        px: 0.5,
        py: 0.25,
        borderRadius: 0.75,
        border: 0,
        cursor: "pointer",
        font: "inherit",
        bgcolor: active ? alpha(t.palette.text.primary, 0.07) : "transparent",
        color: active ? t.palette.text.primary : t.palette.text.secondary,
        fontWeight: active ? 700 : 400,
        "&:hover": { bgcolor: alpha(t.palette.text.primary, 0.05) },
      })}
    >
      {content}
    </Box>
  );
}

/**
 * Settings or Preview.
 *
 * Preview REPLACES the settings rather than appending to them, so there is no
 * scroll hunt for the thing you just changed — and, since the settings unmount,
 * no chance of typing into the preview's copy of an input by mistake.
 */
function ModeSwitch({ mode, setMode, language }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={mode}
        onChange={(_event, next) => next && setMode(next)}
        sx={segmentedSx}
        aria-label={pick(language, "Panel mode", "Mode du panneau")}
      >
        <ToggleButton value="settings">
          {pick(language, "Settings", "Réglages")}
        </ToggleButton>
        <ToggleButton value="preview">
          {pick(language, "Preview", "Aperçu")}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}

export default function Inspector({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  selection,
  lastField,
  onSelectField,
  onSelectStep,
  onRekeyStep,
}) {
  // Settings is the default, and Preview is only MOUNTED when chosen — rjsf is a
  // heavy tree, and this panel already re-renders on every keystroke.
  const [mode, setMode] = useState("settings");

  const properties = jsonSchema?.properties || {};
  const steps = Array.isArray(uiSchema?.["ui:steps"]) ? uiSchema["ui:steps"] : [];

  if (!selection) {
    return (
      <Alert severity="info">
        {pick(
          language,
          "This form has no fields yet. Add them in the JSON Schema tab.",
          "Ce formulaire n'a pas encore de champs. Ajoutez-les dans l'onglet Schéma JSON."
        )}
      </Alert>
    );
  }

  const isStep = selection.kind === "step";
  const fieldName = isStep ? lastField : selection.name;

  // Which step to point the first crumb at: the selected one, or the one holding
  // the selected field.
  const stepIndex = isStep ? selection.index : stepIndexOfField(steps, selection.name);
  const step = stepIndex === null ? null : steps[stepIndex];

  const stepLabel = step
    ? localized(step.title, language, step.id || `step-${stepIndex + 1}`)
    : pick(language, "Not in any tab", "Dans aucun onglet");

  const property = fieldName ? properties[fieldName] : null;
  const type = property?.type;
  const typeLabel = Array.isArray(type) ? type.join(" | ") : type || "any";
  const required = (jsonSchema?.required || []).includes(fieldName);
  const label = localized(
    uiSchema?.[fieldName]?.["ui:options"]?.i18n?.title,
    language,
    ""
  );

  return (
    <Box>
      {/*
        A `nav` landmark, not a bare row. Both crumbs are named after things that
        appear elsewhere on screen — a step's title is also a "Move to" menu item,
        a field's name is also a chip in the step's field list — so the landmark
        is what makes "the crumb called depth" addressable, for a screen reader
        user and a test alike.
      */}
      <Box
        component="nav"
        aria-label={pick(language, "Selection", "Sélection")}
        sx={{ display: "flex", alignItems: "center", minWidth: 0, mb: 0.5, ml: -0.5 }}
      >
        <Crumb
          label={stepLabel}
          active={isStep}
          disabled={!step}
          onClick={() => onSelectStep(stepIndex)}
        />
        {fieldName && (
          <>
            <ChevronRight sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }} />
            <Crumb
              label={fieldName}
              mono
              active={!isStep}
              onClick={() => onSelectField(fieldName)}
            />
          </>
        )}
      </Box>

      {isStep ? (
        <>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.3, mb: 1 }}>
            {stepLabel}
          </Typography>
          <ModeSwitch mode={mode} setMode={setMode} language={language} />
          {mode === "preview" ? (
            <InspectorPreview
              jsonSchema={jsonSchema}
              uiSchema={uiSchema}
              language={language}
              selection={selection}
              steps={steps}
            />
          ) : (
          <StepSettingsPanel
            jsonSchema={jsonSchema}
            uiSchema={uiSchema}
            onChange={onChange}
            language={language}
            index={selection.index}
            onSelectField={onSelectField}
            onRekey={onRekeyStep}
            // The step is gone; the shell falls back to a field on its own, but
            // saying so explicitly keeps that from depending on a re-resolve.
            onDeleted={() => onSelectField(lastField)}
          />
          )}
        </>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.3 }}>
            {label || selection.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              mt: 0.25,
              mb: 1,
              minWidth: 0,
            }}
          >
            <MetaTag label={typeLabel} title={typeLabel} />
            {required && (
              <MetaTag
                tone="required"
                label={pick(language, "required", "obligatoire")}
                title={pick(language, "required", "obligatoire")}
              />
            )}
          </Box>
          <ModeSwitch mode={mode} setMode={setMode} language={language} />
          {mode === "preview" ? (
            <InspectorPreview
              jsonSchema={jsonSchema}
              uiSchema={uiSchema}
              language={language}
              selection={selection}
              steps={steps}
            />
          ) : (
            <FieldPanel
              jsonSchema={jsonSchema}
              uiSchema={uiSchema}
              onChange={onChange}
              language={language}
              field={selection.name}
              onSelectStep={onSelectStep}
            />
          )}
        </>
      )}
    </Box>
  );
}
