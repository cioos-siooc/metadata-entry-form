import React from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Clear,
  Search,
  Tune,
  UnfoldLess,
  UnfoldMore,
  ViewAgenda,
} from "@mui/icons-material";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { addStep } from "@shared/formEngine";
import StepCard from "./StepCard";
import UnassignedTray from "./UnassignedTray";
import FieldRowGhost from "./FieldRowGhost";
import StepsDndProvider from "./dnd/StepsDndProvider";
import { stepDragId } from "./dnd/ids";
import {
  EmptyState,
  MetaTag,
  SectionHeader,
  quietButtonProps,
} from "./primitives";
import { renderedOpenKeys, stepKey } from "./selection";
import { pick, plural } from "./language";

/**
 * The canvas: how the schema's properties are grouped into `ui:steps`.
 *
 * Every field name here comes from `jsonSchema.properties`, never from free
 * text. That is what makes the silent drop in `resolveSteps` unreachable from
 * the builder: a step cannot name a field that does not exist.
 *
 * Steps AND fields both drag, through the single DndContext in
 * ./dnd/StepsDndProvider.jsx — see that file for why one context is forced rather
 * than merely preferred. This replaces an earlier note here claiming fields could
 * not be dragged because "nested DndContexts are fragile": that is still true, and
 * is not what this does.
 *
 * Drag is never the only path. Every field keeps its arrow buttons for moving
 * within a step and its "Move to" menu for moving between steps, which is the
 * guaranteed keyboard route and the only one jsdom can exercise.
 *
 * Which cards are open is a Set of `stepKey`s rather than an index, and the
 * rendered set is DERIVED (see `renderedOpenKeys`). Keying by id means a reorder
 * or a delete needs no remapping — the key travels with the step — and deriving
 * means the card holding the selection cannot be closed out from under it.
 */
export default function StepsPanel({
  jsonSchema,
  uiSchema,
  onChange,
  language,
  selection,
  onSelectField,
  onSelectStep,
  open,
  onToggleStep,
  onExpandAll,
  onCollapseAll,
  filter,
  onOpenInspector,
}) {
  const { visibleFields } = filter;
  const properties = jsonSchema?.properties || {};
  const allFields = Object.keys(properties);
  const steps = Array.isArray(uiSchema?.["ui:steps"]) ? uiSchema["ui:steps"] : [];
  const required = jsonSchema?.required || [];

  const claimed = new Set(steps.flatMap((step) => step.fields || []));
  const unassigned = allFields.filter((name) => !claimed.has(name));
  const shownUnassigned = visibleFields
    ? unassigned.filter((name) => visibleFields.has(name))
    : unassigned;

  const openKeys = renderedOpenKeys({
    steps,
    open,
    selection,
    matchedFields: visibleFields,
  });

  const selectedField = selection?.kind === "field" ? selection.name : null;

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

  return (
    <Box>
      <SectionHeader
        title={pick(language, "Steps", "Étapes")}
        hint={pick(
          language,
          "Each step is a tab. Respondents move between them freely.",
          "Chaque étape est un onglet. Les répondants passent librement de l'une à l'autre."
        )}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <MetaTag
              tone="strong"
              label={String(steps.length)}
              title={plural(language, steps.length, "step", "steps", "étape", "étapes")}
            />
            <Button {...quietButtonProps} startIcon={<Add />} onClick={handleAddStep}>
              {pick(language, "Add step", "Ajouter une étape")}
            </Button>
          </Stack>
        }
      />

      {allFields.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TextField
            size="small"
            value={filter.query}
            onChange={(event) => filter.setQuery(event.target.value)}
            placeholder={pick(language, "Filter fields…", "Filtrer les champs…")}
            inputProps={{
              "aria-label": pick(language, "Filter fields", "Filtrer les champs"),
            }}
            sx={{ flex: 1, maxWidth: 260 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
                endAdornment: filter.active ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={filter.clear}
                      aria-label={pick(
                        language,
                        "Clear search",
                        "Effacer la recherche"
                      )}
                    >
                      <Clear fontSize="inherit" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {filter.active && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              {pick(
                language,
                `${filter.matchCount} of ${filter.totalCount} fields`,
                `${filter.matchCount} sur ${filter.totalCount} champs`
              )}
            </Typography>
          )}

          {/*
            An explicit spacer rather than `ml: "auto"` on the group: Stack
            implements its own `spacing` as a margin-left on every child but the
            first, and that generated rule wins over an `sx` margin.
          */}
          <Box sx={{ flex: 1 }} />

          {/*
            Below `md` the inspector is a Drawer, and Escape closes it. Without a
            way back the panel would be unreachable until something else was
            selected. Harmless above `md`, where the panel is always docked.
          */}
          <Tooltip
            title={pick(language, "Edit the selection", "Modifier la sélection")}
          >
            <IconButton
              size="small"
              onClick={onOpenInspector}
              aria-label={pick(
                language,
                "Edit the selection",
                "Modifier la sélection"
              )}
              sx={{ display: { md: "none" } }}
            >
              <Tune fontSize="small" />
            </IconButton>
          </Tooltip>

          {steps.length > 1 && (
            <Stack direction="row">
              <Tooltip title={pick(language, "Expand all", "Tout développer")}>
                <IconButton
                  size="small"
                  onClick={onExpandAll}
                  aria-label={pick(language, "Expand all", "Tout développer")}
                >
                  <UnfoldMore fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={pick(language, "Collapse all", "Tout réduire")}>
                <IconButton
                  size="small"
                  onClick={onCollapseAll}
                  aria-label={pick(language, "Collapse all", "Tout réduire")}
                >
                  <UnfoldLess fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Stack>
      )}

      {filter.active && filter.matchCount === 0 && (
        <EmptyState
          icon={<Search fontSize="inherit" />}
          title={pick(language, "No field matches", "Aucun champ correspondant")}
          body={pick(
            language,
            `Nothing in this form is called "${filter.query}". The filter searches property names and both halves of each bilingual label.`,
            `Rien dans ce formulaire ne s'appelle « ${filter.query} ». Le filtre cherche dans les noms de propriétés et les deux moitiés de chaque étiquette bilingue.`
          )}
          action={
            // Named for its outcome, not for the mechanism: the input's own X is
            // already called "Clear search", and two controls sharing an
            // accessible name is ambiguous for a screen reader.
            <Button {...quietButtonProps} startIcon={<Clear />} onClick={filter.clear}>
              {pick(language, "Show all fields", "Afficher tous les champs")}
            </Button>
          }
          sx={{ mb: 2 }}
        />
      )}

      {allFields.length === 0 && (
        <EmptyState
          icon={<ViewAgenda fontSize="inherit" />}
          title={pick(language, "No fields to lay out yet", "Aucun champ à disposer")}
          body={pick(
            language,
            "This form's properties are defined in the JSON Schema tab. Add some there and they will appear here.",
            "Les propriétés de ce formulaire sont définies dans l'onglet Schéma JSON. Ajoutez-en et elles apparaîtront ici."
          )}
        />
      )}

      {steps.length === 0 && allFields.length > 0 && (
        <EmptyState
          icon={<ViewAgenda fontSize="inherit" />}
          title={pick(
            language,
            "This form renders as a single page",
            "Ce formulaire s'affiche sur une seule page"
          )}
          body={pick(
            language,
            "Steps split it into tabs. Adding the first one puts every field below into it, and you can move them around from there.",
            "Les étapes le divisent en onglets. La première créée y place tous les champs ci-dessous, que vous pourrez ensuite déplacer."
          )}
          // Deliberately no button: "Add step" sits in the toolbar directly
          // above, and a second button with that accessible name would be
          // ambiguous for a screen reader and for a test.
          sx={{ mb: 2 }}
        />
      )}

      <StepsDndProvider
        uiSchema={uiSchema}
        onChange={onChange}
        steps={steps}
        unassigned={unassigned}
        language={language}
        renderOverlay={(activeDrag, width) => (
          <FieldRowGhost
            activeDrag={activeDrag}
            width={width}
            steps={steps}
            properties={properties}
            uiSchema={uiSchema}
            required={required}
            language={language}
          />
        )}
      >
        <SortableContext
          items={steps.map((_step, index) => stepDragId(index))}
          strategy={verticalListSortingStrategy}
        >
          {steps.map((step, index) => (
            <StepCard
              key={stepKey(step, index)}
              step={step}
              index={index}
              open={openKeys.has(stepKey(step, index))}
              onToggle={onToggleStep}
              selected={selection?.kind === "step" && selection.index === index}
              onSelectStep={onSelectStep}
              jsonSchema={jsonSchema}
              uiSchema={uiSchema}
              onChange={onChange}
              language={language}
              steps={steps}
              selectedField={selectedField}
              onSelectField={onSelectField}
              required={required}
              properties={properties}
              visibleFields={visibleFields}
            />
          ))}
        </SortableContext>

        {/*
          Rendered whenever there are steps, even when empty: dropping a field
          here is how it gets taken out of every tab, and there has to be
          somewhere to drop it. Hidden only when a filter has emptied it, where a
          bare header would promise rows that are not there.
        */}
        {(unassigned.length > 0 || steps.length > 0) &&
          (!filter.active || shownUnassigned.length > 0) && (
            <UnassignedTray
              names={unassigned}
              shown={shownUnassigned}
              hasSteps={steps.length > 0}
              properties={properties}
              required={required}
              uiSchema={uiSchema}
              onChange={onChange}
              language={language}
              steps={steps}
              selectedField={selectedField}
              onSelectField={onSelectField}
              filtering={filter.active}
              draggable={steps.length > 0}
            />
          )}
      </StepsDndProvider>

    </Box>
  );
}
