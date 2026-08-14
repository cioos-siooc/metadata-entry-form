import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline } from "@mui/icons-material";

import {
  assignFieldToStep,
  removeStep,
  setStepVisibleIf,
  updateStep,
} from "@shared/formEngine";
import VisibleIfEditor from "./VisibleIfEditor";
import {
  FieldName,
  SectionHeader,
  quietButtonProps,
} from "./primitives";
import { LANGUAGES, localized, pick } from "./language";

/**
 * Everything a form type can say about one step.
 *
 * These controls used to live in the step's own body, mixed in with its field
 * list, which had two costs: the card could not be read as a list of fields at a
 * glance, and the two `visibleIf` editors on screen at once — one for the step,
 * one for the selected field — were identical stacks of dropdowns distinguished
 * only by their heading.
 *
 * Moving them here means exactly one rule editor is ever on screen, and the
 * canvas becomes what it should be: structure, not settings.
 */
export default function StepSettingsPanel({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  index,
  onDeleted,
  onSelectField,
  onRekey,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addAnchor, setAddAnchor] = useState(null);

  const steps = Array.isArray(uiSchema?.["ui:steps"]) ? uiSchema["ui:steps"] : [];
  const step = steps[index];
  const properties = jsonSchema?.properties || {};

  if (!step) {
    return (
      <Alert severity="info">
        {pick(
          language,
          "This step no longer exists.",
          "Cette étape n'existe plus."
        )}
      </Alert>
    );
  }

  const fields = step.fields || [];
  const claimed = new Set(steps.flatMap((s) => s.fields || []));
  const available = Object.keys(properties).filter((name) => !claimed.has(name));
  const title = localized(step.title, language, step.id || `step-${index + 1}`);

  const patch = (next) => onChange(updateStep(uiSchema, index, next));

  return (
    <Stack spacing={2}>
      <Box>
        <SectionHeader title={pick(language, "Tab name", "Nom de l'onglet")} />
        <Stack spacing={1}>
          {LANGUAGES.map((lang) => (
            <TextField
              key={`title-${lang}`}
              size="small"
              fullWidth
              label={`${pick(language, "Tab name", "Nom de l'onglet")} (${lang})`}
              value={step.title?.[lang] || ""}
              onChange={(event) =>
                patch({ title: { ...(step.title || {}), [lang]: event.target.value } })
              }
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <SectionHeader
          title={pick(language, "Description", "Description")}
          hint={pick(
            language,
            "Optional. Shown under the tab bar, above the tab's first question.",
            "Facultatif. Affiché sous la barre d'onglets, au-dessus de la première question."
          )}
        />
        <Stack spacing={1}>
          {LANGUAGES.map((lang) => (
            <TextField
              key={`description-${lang}`}
              size="small"
              fullWidth
              multiline
              minRows={2}
              label={`${pick(language, "Description", "Description")} (${lang})`}
              value={step.description?.[lang] || ""}
              onChange={(event) =>
                patch({
                  description: {
                    ...(step.description || {}),
                    [lang]: event.target.value,
                  },
                })
              }
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <SectionHeader title={pick(language, "Step id", "Identifiant d'étape")} />
        <TextField
          size="small"
          fullWidth
          label={pick(language, "Step id", "Identifiant d'étape")}
          value={step.id || ""}
          onChange={(event) => {
            patch({ id: event.target.value });
            // The id IS this step's UI-state key, so changing it has to re-point
            // the selection or the panel would deselect itself as it is typed in.
            onRekey(index, event.target.value);
          }}
          helperText={pick(
            language,
            "Stable handle used to group validation errors by tab.",
            "Identifiant stable utilisé pour regrouper les erreurs par onglet."
          )}
        />
      </Box>

      <VisibleIfEditor
        jsonSchema={jsonSchema}
        value={step.visibleIf}
        language={language}
        label={pick(language, "Show this tab when", "Afficher cet onglet lorsque")}
        onChange={(rule) => onChange(setStepVisibleIf(uiSchema, index, rule))}
      />

      <Box>
        <SectionHeader
          title={pick(language, "Fields", "Champs")}
          action={
            available.length > 0 ? (
              <>
                <Button
                  {...quietButtonProps}
                  startIcon={<Add />}
                  aria-haspopup="menu"
                  onClick={(event) => setAddAnchor(event.currentTarget)}
                >
                  {pick(language, "Add a field", "Ajouter un champ")}
                </Button>
                <Menu
                  anchorEl={addAnchor}
                  open={Boolean(addAnchor)}
                  onClose={() => setAddAnchor(null)}
                >
                  {available.map((name) => (
                    <MenuItem
                      key={name}
                      onClick={() => {
                        setAddAnchor(null);
                        onChange(assignFieldToStep(uiSchema, name, index));
                      }}
                    >
                      {name}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : null
          }
        />
        {fields.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            {pick(
              language,
              "No fields yet. A tab with no fields is not rendered.",
              "Aucun champ. Un onglet sans champ n'est pas affiché."
            )}
          </Typography>
        ) : (
          // Read-only, and in order. Reordering is a canvas gesture: the rows
          // there show a field's type and label, which is what you need in order
          // to decide where it goes.
          <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ gap: 0.5 }}>
            {fields.map((name) => (
              <Box
                key={name}
                component="button"
                type="button"
                onClick={() => onSelectField(name)}
                sx={(t) => ({
                  border: "1px solid",
                  borderColor: t.palette.divider,
                  borderRadius: 0.75,
                  bgcolor: "transparent",
                  px: 0.75,
                  py: 0.25,
                  cursor: "pointer",
                  "&:hover": { bgcolor: t.palette.action.hover },
                })}
              >
                <FieldName>{name}</FieldName>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Box>
        <SectionHeader title={pick(language, "Danger zone", "Zone sensible")} />
        <Button
          size="small"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => setConfirmDelete(true)}
        >
          {pick(language, "Delete step", "Supprimer l'étape")}
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ mt: 0.5 }}
        >
          {pick(
            language,
            "Its fields are not deleted — they move to the trailing \"Other\" tab, keeping their labels, help and widgets.",
            "Ses champs ne sont pas supprimés — ils passent dans l'onglet « Autre », en conservant étiquettes, aide et widgets."
          )}
        </Typography>
      </Box>

      {/*
        Deleting a step is cheap to undo in principle (the fields survive) but
        expensive to notice, because the card simply vanishes from a list of
        cards. A confirmation is the difference between "I meant that" and
        "where did my tab go".
      */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>
          {pick(language, `Delete "${title}"?`, `Supprimer « ${title} » ?`)}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {pick(
              language,
              `${fields.length} field(s) will move to the trailing "Other" tab. Nothing about how they are presented changes.`,
              `${fields.length} champ(s) passeront dans l'onglet « Autre ». Rien ne change à leur présentation.`
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>
            {pick(language, "Cancel", "Annuler")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              setConfirmDelete(false);
              onChange(removeStep(uiSchema, index));
              onDeleted();
            }}
          >
            {pick(language, "Delete step", "Supprimer l'étape")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
