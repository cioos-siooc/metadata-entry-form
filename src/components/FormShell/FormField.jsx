import React, { createContext, useContext, useId, useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { CheckCircle, HelpOutline, Close } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useGuidance } from "./GuidanceContext";
import { HEADER_HEIGHT } from "../NavDrawer/styles";
import { FORM_HEADER_HEIGHT_MD } from "./FormHeader";

// Lets a control inside a FormField take its accessible name from the visible
// label (and its description from the hint) instead of repeating it.
const FieldContext = createContext(null);
export const useFieldContext = () => useContext(FieldContext);

// Required / done marker beside a field label. Text, not colour alone:
// "Required" until the field validates, then a check with an accessible name.
export function FieldStatus({ required, complete }) {
  const { language } = useParams();
  const fr = language === "fr";
  if (required && complete) {
    return (
      <CheckCircle
        titleAccess={fr ? "Complété" : "Complete"}
        sx={{ fontSize: 18, color: "success.main", flexShrink: 0 }}
      />
    );
  }
  if (required) {
    return (
      <Box
        component="span"
        sx={(theme) => ({
          flexShrink: 0,
          fontSize: "0.75rem",
          fontWeight: 600,
          lineHeight: "20px",
          px: 1,
          borderRadius: 999,
          color: "text.secondary",
          border: `1px solid ${theme.vars.palette.divider}`,
          whiteSpace: "nowrap",
        })}
      >
        {fr ? "Obligatoire" : "Required"}
      </Box>
    );
  }
  return null;
}

// Guidance text sits in a quiet panel so a returning user's eye can skip it
// and land on the control; new users get the full explanation in place.
export const guidancePanelSx = (theme) => ({
  bgcolor: "background.subtle",
  border: `1px solid ${theme.vars.palette.subtleBorder}`,
  borderRadius: 1,
  px: 2,
  py: 1.5,
  color: "text.secondary",
  fontSize: "0.875rem",
  lineHeight: 1.6,
  maxWidth: "75ch",
  "& p": { my: 0.75 },
  "& > :first-of-type, & > * > :first-of-type": { mt: 0 },
  "& > :last-child, & > * > :last-child": { mb: 0 },
  "& ul": { pl: 2.5, my: 0.75 },
  "& li + li": { mt: 0.25 },
  "& b, & strong": { color: "text.primary", fontWeight: 600 },
});

// One question in the record form.
//  label     short name, always shown — what a returning user scans for
//  hint      one short constraint that matters every time (always shown)
//  guidance  the full question and explanation; shown under the control
//            while guidance is on, or on demand per field when it's off.
//            Below, not above, so controls line up across a row and sit
//            straight under their label in both modes.
// `id` keeps the `field-<key>` anchors the reviewer panel scrolls to.
export default function FormField({
  id,
  label,
  required = false,
  complete = false,
  hint,
  guidance,
  children,
  sx,
}) {
  const { language } = useParams();
  const { showGuidance } = useGuidance();
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const guidanceId = useId();
  const hintId = useId();
  const fr = language === "fr";
  const guidanceVisible = Boolean(guidance) && (showGuidance || open);

  const toggleLabel = open
    ? fr
      ? "Masquer l'aide"
      : "Hide guidance"
    : fr
      ? "Afficher l'aide"
      : "Show guidance";

  return (
    <Box
      id={id}
      role="group"
      aria-labelledby={labelId}
      sx={{
        scrollMarginTop: HEADER_HEIGHT + FORM_HEADER_HEIGHT_MD + 16,
        borderRadius: 1,
        minWidth: 0,
        ...sx,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ minHeight: 32, mb: hint ? 0.25 : 0.75 }}
      >
        <Typography
          id={labelId}
          component="h3"
          sx={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.4 }}
        >
          {label}
        </Typography>
        <FieldStatus required={required} complete={complete} />
        {guidance && !showGuidance && (
          <Tooltip title={toggleLabel}>
            <IconButton
              size="small"
              aria-label={toggleLabel}
              aria-expanded={open}
              aria-controls={guidanceId}
              onClick={() => setOpen((o) => !o)}
              sx={{ my: -0.5, color: open ? "primaryText" : "text.secondary" }}
            >
              {open ? (
                <Close fontSize="small" />
              ) : (
                <HelpOutline fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
      {hint && (
        <Typography
          id={hintId}
          variant="body2"
          component="div"
          sx={{ color: "text.secondary", mb: 1, maxWidth: "75ch" }}
        >
          {hint}
        </Typography>
      )}
      <FieldContext.Provider
        value={{ labelId, hintId: hint ? hintId : undefined }}
      >
        {children}
      </FieldContext.Provider>
      {guidance && (
        <Collapse in={guidanceVisible} timeout={180}>
          <Box
            id={guidanceId}
            sx={(theme) => ({ ...guidancePanelSx(theme), mt: 1.25 })}
          >
            {guidance}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
