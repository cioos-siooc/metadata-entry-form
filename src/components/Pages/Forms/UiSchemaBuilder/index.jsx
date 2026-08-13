import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Collapse,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { ERROR, INFO, WARNING } from "@shared/formEngine";
import StepsPanel from "./StepsPanel";
import FieldPanel from "./FieldPanel";
import SummaryFieldsPicker from "./SummaryFieldsPicker";
import { pick } from "./language";

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
 */

const SEVERITY_LABEL = {
  [ERROR]: { en: "Problems", fr: "Problèmes" },
  [WARNING]: { en: "Warnings", fr: "Avertissements" },
};

/**
 * Reports what the renderer would quietly ignore.
 *
 * Rendered above the Builder/JSON switch rather than inside the builder, because
 * an author who has dropped into the JSON view to fix a typo needs to see the
 * same list.
 *
 * Errors and warnings show expanded; suggestions collapse behind a count. An
 * author must see a typo'd field name immediately, but should not be nagged
 * about every property still missing a French label.
 */
export function UiSchemaProblems({ problems, language = "en" }) {
  const [showInfo, setShowInfo] = useState(false);

  const groups = useMemo(() => {
    const bySeverity = { [ERROR]: [], [WARNING]: [], [INFO]: [] };
    (problems || []).forEach((problem) => {
      if (bySeverity[problem.severity]) bySeverity[problem.severity].push(problem);
    });
    return bySeverity;
  }, [problems]);

  const loud = [...groups[ERROR], ...groups[WARNING]];
  if (loud.length === 0 && groups[INFO].length === 0) return null;

  const worst = groups[ERROR].length ? ERROR : WARNING;

  const render = (problem) => (
    <Typography
      key={`${problem.severity}-${problem.path}-${problem.message.en}`}
      variant="caption"
      component="div"
    >
      {problem.path ? <code>{problem.path}</code> : null}
      {problem.path ? " — " : null}
      {problem.message[language] || problem.message.en}
    </Typography>
  );

  return (
    <Box sx={{ mb: 2 }}>
      {loud.length > 0 && (
        <Alert severity={worst === ERROR ? "error" : "warning"}>
          <AlertTitle>
            {pick(language, SEVERITY_LABEL[worst].en, SEVERITY_LABEL[worst].fr)}
          </AlertTitle>
          <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
            {pick(
              language,
              "These are ignored when the form renders. They do not block saving.",
              "Ceux-ci sont ignorés à l'affichage du formulaire. Ils n'empêchent pas l'enregistrement."
            )}
          </Typography>
          {loud.map(render)}
        </Alert>
      )}

      {groups[INFO].length > 0 && (
        <Box sx={{ mt: loud.length ? 1 : 0 }}>
          <Link
            component="button"
            type="button"
            variant="caption"
            underline="hover"
            onClick={() => setShowInfo((open) => !open)}
          >
            {showInfo
              ? pick(language, "Hide suggestions", "Masquer les suggestions")
              : pick(
                  language,
                  `${groups[INFO].length} suggestions`,
                  `${groups[INFO].length} suggestions`
                )}
          </Link>
          <Collapse in={showInfo}>
            <Box sx={{ mt: 0.5 }}>{groups[INFO].map(render)}</Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}

export default function UiSchemaBuilder({
  jsonSchema,
  value,
  onChange,
  language = "en",
}) {
  const properties = jsonSchema?.properties || {};
  const fieldNames = Object.keys(properties);

  const [selectedField, setSelectedField] = useState(null);

  // The JSON Schema tab can remove the property that was selected; fall back
  // rather than rendering a panel that looks broken.
  const activeField =
    selectedField && selectedField in properties
      ? selectedField
      : fieldNames[0] || null;

  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <StepsPanel
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
            selectedField={activeField}
            onSelectField={setSelectedField}
          />
          <Divider sx={{ my: 2 }} />
          <SummaryFieldsPicker
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
          />
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Paper
          variant="outlined"
          sx={{ p: 2, position: { md: "sticky" }, top: { md: 16 } }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              {pick(language, "Field settings", "Réglages du champ")}
            </Typography>
            <Chip size="small" label={String(fieldNames.length)} sx={{ ml: "auto" }} />
          </Stack>
          <FieldPanel
            jsonSchema={jsonSchema}
            uiSchema={value}
            onChange={onChange}
            language={language}
            field={activeField}
          />
        </Paper>
      </Grid>
    </Grid>
  );
}
