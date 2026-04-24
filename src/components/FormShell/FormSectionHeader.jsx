import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import RequiredMark from "../FormComponents/RequiredMark";

// FormSectionHeader — for subsection headings inside a FormSection body.
// Use sparingly; prefer FormSection's own title prop for top-level sections.
export default function FormSectionHeader({
  title,
  description,
  required,
  level = 6,
  actions,
  sx,
}) {
  return (
    <Box sx={{ mb: 1.5, ...sx }}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Typography
          variant={`h${level}`}
          sx={{ fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}
        >
          {title}
          {required && <RequiredMark />}
        </Typography>
        {actions && <Box sx={{ ml: "auto" }}>{actions}</Box>}
      </Stack>
      {description && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 0.5, lineHeight: 1.55 }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}
