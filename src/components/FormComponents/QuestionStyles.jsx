import React from "react";
import { Typography } from "@mui/material";

export const SupplementalText = ({ children, sx }) => (
  <Typography
    variant="body2"
    component="div"
    sx={{ mt: 1.25, color: "text.secondary", lineHeight: 1.6, ...sx }}
  >
    {children}
  </Typography>
);

export const QuestionText = ({ children, sx }) => (
  <Typography
    variant="body1"
    component="div"
    sx={{ mb: 1.25, lineHeight: 1.55, ...sx }}
  >
    {children}
  </Typography>
);

export const HeadingText = ({ children, sx }) => (
  <Typography
    variant="h6"
    component="div"
    sx={{ fontSize: "1.0625rem", fontWeight: 600, lineHeight: 1.4, ...sx }}
  >
    {children}
  </Typography>
);
