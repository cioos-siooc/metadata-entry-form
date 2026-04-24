import React from "react";
import {
  Box,
  Button,
  Slide,
  Stack,
  Typography,
  Paper,
} from "@mui/material";
import { I18n } from "../I18n";

// Sticky bottom bar. Appears when the record is dirty, or whenever `alwaysShow`
// is true (e.g. the user is on the Submit section and needs the Submit CTA).
export default function ActionBar({
  dirty,
  saving,
  saveDisabled,
  onSave,
  onCancel,
  secondaryAction,
  alwaysShow = false,
  lastSavedLabel,
}) {
  const visible = alwaysShow || dirty;

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={(theme) => ({
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar - 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
          px: { xs: 2, md: 3 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        })}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
          {dirty ? (
            <>
              <Box
                sx={(theme) => ({
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: theme.palette.warning.main,
                  animation: "pulse-dot 1.5s ease-in-out infinite",
                  flexShrink: 0,
                })}
              />
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                <I18n en="Unsaved changes" fr="Modifications non enregistrées" />
              </Typography>
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary" }}
            >
              {lastSavedLabel || (
                <I18n
                  en="All changes saved"
                  fr="Toutes les modifications sont enregistrées"
                />
              )}
            </Typography>
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{ flexShrink: 0, ml: "auto" }}
        >
          {onCancel && (
            <Button variant="text" color="inherit" onClick={onCancel}>
              <I18n en="Cancel" fr="Annuler" />
            </Button>
          )}
          {secondaryAction}
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saveDisabled || saving}
          >
            {saving ? (
              <I18n en="Saving…" fr="Enregistrement…" />
            ) : (
              <I18n en="Save" fr="Enregistrer" />
            )}
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
}
