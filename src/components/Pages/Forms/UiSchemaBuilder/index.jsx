import React, { useCallback, useMemo, useState } from "react";
import { Divider, Grid } from "@mui/material";

import StepsPanel from "./StepsPanel";
import Inspector from "./Inspector";
import SummaryFieldsPicker from "./SummaryFieldsPicker";
import InspectorShell from "./InspectorShell";
import { PanelCard } from "./primitives";
import { resolveSelection, stepKey, stepKeys } from "./selection";
import useFieldFilter from "./useFieldFilter";

/**
 * A visual editor for the UI Schema.
 *
 * It is a LENS over the JSON, not a replacement for it: every edit goes through
 * the pure operations in `@shared/formEngine/uiSchemaOps`, which preserve keys
 * the builder has no control for, and the JSON view remains the escape hatch for
 * anything outside the vocabulary. Turning the raw textarea into a builder does
 * not narrow what a form type can express.
 *
 * The JSON Schema is read-only here — it decides what is VALID and what fields
 * exist; the UI Schema only decides how they are presented. Sourcing every field
 * selector from `jsonSchema.properties` is what makes it impossible to reference
 * a field that does not exist, which was the loudest silent failure of the
 * textarea this replaces.
 *
 * This file is the shell. It owns exactly three pieces of local state — what is
 * selected, which step cards the author opened, and the last field visited — and
 * lays out the canvas and the inspector. All three are UI state only: nothing
 * here can reach the uiSchema except through a child's `onChange`.
 */

export { default as UiSchemaProblems } from "./UiSchemaProblems";

export default function UiSchemaBuilder({
  jsonSchema,
  value,
  onChange,
  language = "en",
}) {
  // A REQUEST, not a resolved selection: the JSON Schema tab can delete the
  // property this names and the step it names can be reordered away, so it is
  // re-resolved against the current schema on every render rather than patched
  // whenever something else changes.
  const [requested, setRequested] = useState(null);
  const [open, setOpen] = useState(() => new Set());
  // Below `md` the inspector is a Drawer, so selecting something has to open it.
  // Above `md` this is ignored — the panel is always docked and visible.
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Memoised because the `[]` fallback would otherwise be a fresh reference on
  // every render, invalidating everything downstream that depends on it.
  const steps = useMemo(
    () => (Array.isArray(value?.["ui:steps"]) ? value["ui:steps"] : []),
    [value]
  );

  const selection = useMemo(
    () => resolveSelection(requested, jsonSchema, steps),
    [requested, jsonSchema, steps]
  );

  // Remembered so the breadcrumb can walk back to a field after a step has been
  // selected. Reads through `selection`, so it is never a name the schema lost.
  const [lastFieldRequest, setLastFieldRequest] = useState(null);
  const lastField =
    selection?.kind === "field"
      ? selection.name
      : resolveSelection({ kind: "field", name: lastFieldRequest }, jsonSchema, steps)
          ?.name || null;

  const selectField = useCallback((name) => {
    setRequested({ kind: "field", name });
    setLastFieldRequest(name);
    setInspectorOpen(true);
  }, []);

  const selectStep = useCallback(
    (index) => {
      const step = steps[index];
      if (!step) return;
      setRequested({ kind: "step", key: stepKey(step, index), index });
      setInspectorOpen(true);
    },
    [steps]
  );

  /**
   * Re-points the request after the selected step's id has been edited.
   *
   * The index fallback in `resolveSelection` already keeps the right step
   * selected, but the stale key would then win against the WRONG step after a
   * later reorder. Re-keying from the id that was just typed keeps the request
   * honest without an effect, because the caller knows the new value before the
   * parent has re-rendered with it.
   */
  const rekeyStep = useCallback((index, id) => {
    setRequested({ kind: "step", key: id ? `id:${id}` : `#${index}`, index });
  }, []);

  const toggleStep = useCallback(
    (index) => {
      const key = stepKey(steps[index], index);
      setOpen((current) => {
        const next = new Set(current);
        // A card forced open by the selection is not in `open`, so the first
        // click on its toggle would "open" what is already open. Selecting the
        // step instead of the field is what closes it — handled by the caller.
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [steps]
  );

  const expandAll = useCallback(
    () => setOpen(new Set(stepKeys(steps))),
    [steps]
  );
  const collapseAll = useCallback(() => setOpen(new Set()), []);

  const filter = useFieldFilter(jsonSchema, value);

  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 7 }}>
        <PanelCard>
          <StepsPanel
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
            selection={selection}
            onSelectField={selectField}
            onSelectStep={selectStep}
            open={open}
            onToggleStep={toggleStep}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            filter={filter}
            onOpenInspector={() => setInspectorOpen(true)}
          />
          <Divider sx={{ my: 2 }} />
          <SummaryFieldsPicker
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
          />
        </PanelCard>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <InspectorShell
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          language={language}
        >
          <Inspector
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
            selection={selection}
            lastField={lastField}
            onSelectField={selectField}
            onSelectStep={selectStep}
            onRekeyStep={rekeyStep}
          />
        </InspectorShell>
      </Grid>
    </Grid>
  );
}
