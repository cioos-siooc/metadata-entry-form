import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Link as RouterLink, useParams } from "react-router-dom";

// Every list/settings page uses the same frame so a user moving between
// "My records", the review queue and the admin settings always finds the
// title, the primary action and the content in the same places.

export function Page({ children, maxWidth = 1200 }) {
  return (
    <Box
      sx={{
        maxWidth,
        // Against the nav, like the record form, so the title sits at the
        // same place on every page whatever the page's width.
        mr: "auto",
        px: { xs: 1, sm: 2, md: 3 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 4, md: 6 },
      }}
    >
      {children}
    </Box>
  );
}

// Title, one-line description and the page's primary actions. `children`
// sits under the title row (status tabs, toggles) and belongs to the header.
export function PageHeader({ title, description, actions, children }) {
  return (
    <Box component="header" sx={{ mb: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body1"
              sx={{ color: "text.secondary", mt: 0.75, maxWidth: "70ch" }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ flexShrink: 0 }}
          >
            {actions}
          </Stack>
        )}
      </Stack>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Box>
  );
}

// What an empty list says: what goes here, and the one action that fills it.
// `headingComponent` is "h1" when the empty state is the whole page.
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  headingComponent = "h2",
}) {
  return (
    <Box
      sx={(theme) => ({
        border: `1px dashed ${theme.vars.palette.subtleBorder}`,
        borderRadius: 1.5,
        px: { xs: 2.5, md: 4 },
        py: { xs: 4, md: 6 },
        textAlign: "center",
        bgcolor: "background.paper",
      })}
    >
      {Icon && (
        <Icon
          aria-hidden
          sx={{ fontSize: 40, color: "text.secondary", mb: 1.5 }}
        />
      )}
      <Typography variant="h6" component={headingComponent}>
        {title}
      </Typography>
      {children && (
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 1, mx: "auto", maxWidth: "52ch" }}
        >
          {children}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}

// Frame for editing one saved library item (contact, instrument, platform):
// a way back to the list, the editor on a card, and Save / Cancel under it.
export function EditorPage({
  backTo,
  backLabel,
  children,
  onSave,
  onCancel,
  saveDisabled,
  saveHint,
  title,
}) {
  const { language } = useParams();
  const fr = language === "fr";
  return (
    <Page maxWidth={1040}>
      <Button
        component={RouterLink}
        to={backTo}
        variant="text"
        size="small"
        startIcon={<ArrowBack />}
        sx={{ mb: 1.5, ml: -1 }}
      >
        {backLabel}
      </Button>
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 1.5,
          bgcolor: "background.paper",
          p: { xs: 2, md: 3 },
        })}
      >
        {/* The page's one h1: the item being edited. */}
        <Typography
          component="h1"
          sx={{
            fontSize: "1.0625rem",
            fontWeight: 600,
            lineHeight: 1.4,
            overflowWrap: "anywhere",
            mb: 3,
          }}
        >
          {title}
        </Typography>
        {children}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        useFlexGap
        flexWrap="wrap"
        sx={{ mt: 2.5 }}
      >
        <Button variant="contained" onClick={onSave} disabled={saveDisabled}>
          {fr ? "Enregistrer" : "Save"}
        </Button>
        <Button variant="text" onClick={onCancel}>
          {fr ? "Annuler" : "Cancel"}
        </Button>
        {saveDisabled && saveHint && (
          <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
            {saveHint}
          </Typography>
        )}
      </Stack>
    </Page>
  );
}
