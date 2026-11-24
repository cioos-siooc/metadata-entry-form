import React from "react";
import { Box, Tooltip } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { I18n } from "../I18n";
import visuallyHidden from "../../theme/visuallyHidden";

// Inline required marker for sub-editors (platforms, instruments, lineage…).
// Record-level questions use <FormField required complete> instead.
function RequiredMark({ passes }) {
  const { language } = useParams();
  const fr = language === "fr";
  if (passes)
    return (
      <CheckCircle
        titleAccess={fr ? "Complété" : "Complete"}
        sx={{
          fontSize: 16,
          color: "success.main",
          verticalAlign: "-3px",
          ml: 0.75,
        }}
      />
    );
  // The asterisk is visual; screen readers get the word.
  return (
    <Tooltip title={<I18n en="Required" fr="Obligatoire" />}>
      <Box
        component="span"
        sx={{ color: "error.main", fontWeight: 700, ml: 0.5 }}
      >
        <span aria-hidden>*</span>
        <Box component="span" sx={visuallyHidden}>
          {fr ? "Obligatoire" : "Required"}
        </Box>
      </Box>
    </Tooltip>
  );
}
export default RequiredMark;
