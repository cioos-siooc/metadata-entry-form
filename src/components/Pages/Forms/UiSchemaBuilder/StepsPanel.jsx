import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  DragIndicator,
  ExpandMore,
} from "@mui/icons-material";

import {
  addStep,
  assignFieldToStep,
  moveFieldWithinStep,
  moveStep,
  removeStep,
  setStepVisibleIf,
  updateStep,
} from "@shared/formEngine";
import SortableList, {
  SortableItem,
  DragHandle,
} from "../../../FormComponents/SortableList";
import VisibleIfEditor from "./VisibleIfEditor";
import { LANGUAGES, localized, pick } from "./language";

/**
 * Groups the schema's properties into `ui:steps` — the tabs a respondent sees.
 *
 * Every field name here comes from `jsonSchema.properties`, never from free
 * text. That is what makes the silent drop in `resolveSteps` unreachable from
 * the builder: a step cannot name a field that does not exist.
 *
 * Steps reorder by drag (reusing the app's existing SortableList); fields move
 * with explicit controls rather than a nested drag context. Two reasons: nested
 * DndContexts are fragile, and a form author reassigning a field to another tab
 * is picking from a list, not dragging across a scroll boundary.
 */

/** Nudges a field one place up or down within its step. */
function shiftField(uiSchema, stepIndex, name, delta) {
  const fields = uiSchema?.["ui:steps"]?.[stepIndex]?.fields || [];
  const from = fields.indexOf(name);
  return moveFieldWithinStep(uiSchema, stepIndex, from, from + delta);
}

function FieldRow({
  name,
  property,
  uiSchema,
  language,
  selected,
  onSelect,
  stepIndex,
  steps,
  onChange,
  canMoveUp,
  canMoveDown,
}) {
  const label = localized(
    uiSchema?.[name]?.["ui:options"]?.i18n?.title,
    language,
    ""
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1,
        py: 0.5,
        mb: 0.5,
        borderColor: selected ? "primary.main" : undefined,
        borderWidth: selected ? 2 : 1,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          component="button"
          type="button"
          onClick={() => onSelect(name)}
          sx={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            background: "none",
            border: 0,
            cursor: "pointer",
            p: 0,
            font: "inherit",
            color: "inherit",
          }}
        >
          <Typography variant="body2" noWrap sx={{ fontFamily: "monospace" }}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {label || (
              <Box component="span" sx={{ fontStyle: "italic" }}>
                {pick(language, "no label", "sans étiquette")}
              </Box>
            )}
          </Typography>
        </Box>

        <Chip size="small" variant="outlined" label={property?.type || "any"} />

        {stepIndex !== null && (
          <>
            <IconButton
              size="small"
              disabled={!canMoveUp}
              aria-label={pick(language, `Move ${name} up`, `Déplacer ${name} vers le haut`)}
              onClick={() => onChange(shiftField(uiSchema, stepIndex, name, -1))}
            >
              <ArrowUpward fontSize="inherit" />
            </IconButton>
            <IconButton
              size="small"
              disabled={!canMoveDown}
              aria-label={pick(language, `Move ${name} down`, `Déplacer ${name} vers le bas`)}
              onClick={() => onChange(shiftField(uiSchema, stepIndex, name, 1))}
            >
              <ArrowDownward fontSize="inherit" />
            </IconButton>
          </>
        )}

        {steps.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={stepIndex === null ? "" : String(stepIndex)}
              displayEmpty
              onChange={(event) =>
                onChange(
                  assignFieldToStep(
                    uiSchema,
                    name,
                    event.target.value === "" ? null : Number(event.target.value)
                  )
                )
              }
              inputProps={{
                "aria-label": pick(language, `Step for ${name}`, `Étape pour ${name}`),
              }}
            >
              <MenuItem value="">
                <em>{pick(language, "Unassigned", "Non assigné")}</em>
              </MenuItem>
              {steps.map((step, index) => (
                <MenuItem key={step.id || index} value={String(index)}>
                  {localized(step.title, language, step.id || `step-${index + 1}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Paper>
  );
}

export default function StepsPanel({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  selectedField,
  onSelectField,
}) {
  const [expanded, setExpanded] = useState(0);

  const properties = jsonSchema?.properties || {};
  const allFields = Object.keys(properties);
  const steps = Array.isArray(uiSchema?.["ui:steps"]) ? uiSchema["ui:steps"] : [];

  const claimed = new Set(steps.flatMap((step) => step.fields || []));
  const unassigned = allFields.filter((name) => !claimed.has(name));

  const handleAddStep = () =>
    onChange(
      addStep(uiSchema, {
        title: {
          en: `Step ${steps.length + 1}`,
          fr: `Étape ${steps.length + 1}`,
        },
        allFields,
      })
    );

  const fieldRowProps = (name, stepIndex) => ({
    name,
    property: properties[name],
    uiSchema,
    language,
    steps,
    onChange,
    stepIndex,
    selected: selectedField === name,
    onSelect: onSelectField,
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1">
          {pick(language, "Steps", "Étapes")}
        </Typography>
        <Tooltip
          title={pick(
            language,
            "Each step is a tab. Respondents move between them freely.",
            "Chaque étape est un onglet. Les répondants passent librement de l'une à l'autre."
          )}
        >
          <Chip size="small" label={steps.length} />
        </Tooltip>
        <Button size="small" startIcon={<Add />} onClick={handleAddStep} sx={{ ml: "auto" }}>
          {pick(language, "Add step", "Ajouter une étape")}
        </Button>
      </Stack>

      {allFields.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {pick(
            language,
            "The JSON Schema has no properties yet. Add fields there first.",
            "Le schéma JSON n'a pas encore de propriétés. Ajoutez d'abord des champs."
          )}
        </Alert>
      )}

      {steps.length === 0 && allFields.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {pick(
            language,
            "No steps declared — the form renders as a single page. Adding a step puts every current field in it.",
            "Aucune étape déclarée — le formulaire s'affiche sur une seule page. Ajouter une étape y place tous les champs actuels."
          )}
        </Alert>
      )}

      <SortableList
        items={steps}
        getItemId={(step, index) => `step-${index}`}
        onDrop={({ removedIndex, addedIndex }) => {
          onChange(moveStep(uiSchema, removedIndex, addedIndex));
          setExpanded(addedIndex);
        }}
      >
        {steps.map((step, index) => (
          <SortableItem key={`step-${index}`} id={`step-${index}`}>
            <Accordion
              expanded={expanded === index}
              onChange={(_event, isExpanded) => setExpanded(isExpanded ? index : -1)}
              disableGutters
              sx={{ mb: 0.5 }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                  <DragHandle>
                    <DragIndicator
                      fontSize="small"
                      color="action"
                      aria-label={pick(language, "Reorder step", "Réordonner l'étape")}
                    />
                  </DragHandle>
                  <Typography sx={{ flex: 1 }}>
                    {localized(step.title, language, step.id || `step-${index + 1}`)}
                  </Typography>
                  {step.visibleIf && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={pick(language, "conditional", "conditionnel")}
                    />
                  )}
                  <Chip
                    size="small"
                    label={`${(step.fields || []).length} ${pick(
                      language,
                      "fields",
                      "champs"
                    )}`}
                  />
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {LANGUAGES.map((lang) => (
                      <TextField
                        key={lang}
                        size="small"
                        fullWidth
                        label={`${pick(language, "Tab name", "Nom de l'onglet")} (${lang})`}
                        value={step.title?.[lang] || ""}
                        onChange={(event) =>
                          onChange(
                            updateStep(uiSchema, index, {
                              title: { ...(step.title || {}), [lang]: event.target.value },
                            })
                          )
                        }
                      />
                    ))}
                    <IconButton
                      aria-label={pick(language, "Delete step", "Supprimer l'étape")}
                      onClick={() => onChange(removeStep(uiSchema, index))}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>

                  <TextField
                    size="small"
                    fullWidth
                    label={pick(language, "Step id", "Identifiant d'étape")}
                    value={step.id || ""}
                    onChange={(event) =>
                      onChange(updateStep(uiSchema, index, { id: event.target.value }))
                    }
                    helperText={pick(
                      language,
                      "Stable handle used to group validation errors by tab.",
                      "Identifiant stable utilisé pour regrouper les erreurs par onglet."
                    )}
                  />

                  <VisibleIfEditor
                    jsonSchema={jsonSchema}
                    value={step.visibleIf}
                    language={language}
                    label={pick(language, "Show this tab when", "Afficher cet onglet lorsque")}
                    onChange={(rule) => onChange(setStepVisibleIf(uiSchema, index, rule))}
                  />

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      {pick(language, "Fields in this tab", "Champs de cet onglet")}
                    </Typography>
                    {(step.fields || []).length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        {pick(
                          language,
                          "Empty. A tab with no fields is not rendered.",
                          "Vide. Un onglet sans champ n'est pas affiché."
                        )}
                      </Typography>
                    ) : (
                      (step.fields || []).map((name, fieldIndex, list) => (
                        <FieldRow
                          key={name}
                          {...fieldRowProps(name, index)}
                          canMoveUp={fieldIndex > 0}
                          canMoveDown={fieldIndex < list.length - 1}
                        />
                      ))
                    )}
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </SortableItem>
        ))}
      </SortableList>

      {unassigned.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2">
              {steps.length
                ? pick(language, "Not in any tab", "Dans aucun onglet")
                : pick(language, "Fields", "Champs")}
            </Typography>
            {steps.length > 0 && (
              <Tooltip
                title={pick(
                  language,
                  'These render in a trailing "Other" tab rather than disappearing.',
                  "Ceux-ci s'affichent dans un onglet « Autre » plutôt que de disparaître."
                )}
              >
                <Chip size="small" color="warning" label={unassigned.length} />
              </Tooltip>
            )}
          </Stack>
          {unassigned.map((name) => (
            <FieldRow key={name} {...fieldRowProps(name, null)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
