import React, { useId, useState } from "react";
import {
  Box,
  Card,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import RequiredMark from "../FormComponents/RequiredMark";

// FormSection — the card for one titled group of record questions.
// Stateless-by-default card with optional title/description, required marker,
// error count badge, collapsibility, and completion indicator.
export default function FormSection({
  id,
  title,
  description,
  required = false,
  errorCount = 0,
  complete = false,
  collapsible = false,
  defaultExpanded = true,
  actions,
  children,
  sx,
  contentSx,
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const titleId = useId();
  const { language } = useParams();
  const fr = language === "fr";
  const hasError = errorCount > 0;
  const hasHeader = Boolean(title || description || actions);

  return (
    <Card
      id={id}
      component="section"
      aria-labelledby={title ? titleId : undefined}
      variant="outlined"
      sx={(theme) => ({
        borderColor: hasError ? "error.main" : "divider",
        boxShadow: hasError
          ? `0 0 0 1px ${theme.vars.palette.error.main}`
          : "none",
        transition: theme.transitions.create(
          ["border-color", "box-shadow", "transform"],
          { duration: theme.transitions.duration.short },
        ),
        overflow: "visible",
        ...(typeof sx === "function" ? sx(theme) : sx),
      })}
    >
      {hasHeader && (
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={2}
          sx={{
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 2.5 },
            pb: collapsible && !open ? { xs: 2, sm: 2.5 } : 1.5,
            cursor: collapsible ? "pointer" : "default",
          }}
          onClick={collapsible ? () => setOpen((o) => !o) : undefined}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {title && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
              >
                <Typography
                  id={titleId}
                  variant="h6"
                  component="h2"
                  sx={{
                    fontSize: "1.0625rem",
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {title}
                  {required && <RequiredMark />}
                </Typography>
                {complete && !hasError && (
                  <CheckCircleOutline
                    fontSize="small"
                    sx={{ color: "success.main" }}
                  />
                )}
                {hasError && (
                  <Chip
                    size="small"
                    icon={<ErrorOutline sx={{ fontSize: 14 }} />}
                    label={errorCount}
                    sx={{
                      bgcolor: "error.main",
                      color: "error.contrastText",
                      height: 22,
                      "& .MuiChip-icon": {
                        color: "error.contrastText",
                        ml: "4px",
                      },
                      "& .MuiChip-label": { px: 0.75, fontWeight: 600 },
                    }}
                  />
                )}
              </Stack>
            )}
            {description && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: title ? 0.75 : 0,
                  lineHeight: 1.55,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
          {actions && (
            <Box sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
              {actions}
            </Box>
          )}
          {collapsible && (
            <IconButton
              size="small"
              aria-label={
                open
                  ? fr
                    ? "Réduire"
                    : "Collapse"
                  : fr
                    ? "Développer"
                    : "Expand"
              }
              aria-expanded={open}
              sx={{ mt: -0.5 }}
            >
              {open ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Stack>
      )}
      <Collapse in={!collapsible || open} timeout="auto" unmountOnExit={false}>
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: hasHeader ? 1 : { xs: 2, sm: 2.5 },
            pb: { xs: 2.5, sm: 3 },
            ...contentSx,
          }}
        >
          {children}
        </Box>
      </Collapse>
    </Card>
  );
}
