import React, { useMemo, useState } from "react";
import { Alert, AlertTitle, Box, Collapse, Link, Typography } from "@mui/material";

import { ERROR, INFO, WARNING } from "@shared/formEngine";
import { pick } from "./language";

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

const SEVERITY_LABEL = {
  [ERROR]: { en: "Problems", fr: "Problèmes" },
  [WARNING]: { en: "Warnings", fr: "Avertissements" },
};

export default function UiSchemaProblems({ problems, language = "en" }) {
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
