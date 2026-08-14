import React from "react";
import { Box, Drawer, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close } from "@mui/icons-material";

import { PanelCard } from "./primitives";
import { pick } from "./language";

/**
 * Where the inspector sits, as opposed to what it contains.
 *
 * THE STICKY OFFSET IS LOAD-BEARING. NavDrawer renders its AppBar
 * `position="fixed"` at a min-height of 64px, or 70px from `sm` up. A sticky
 * `top` smaller than that does not park the panel below the bar — it slides the
 * panel underneath it, which is what the `top: 16` this replaces actually did.
 *
 * BELOW `md` IT IS A DRAWER, NOT A DIALOG. The two columns stack there, which put
 * the inspector a long scroll away from whatever was selected. A Drawer is the
 * same panel undocked — same sections, same widths, one component with two shells
 * — whereas a Dialog implies a modal task with Cancel/OK semantics, and this panel
 * edits a controlled value live with no commit step. A Dialog also caps its own
 * height and scrolls internally, which nests a second scrollbar inside the page's;
 * a full-height Drawer scrolls once. Focus trapping, Escape and scroll locking
 * come free either way.
 */

/** Height of NavDrawer's fixed AppBar, which anything sticky must clear. */
export const APP_BAR_HEIGHT = { xs: 64, sm: 70 };

/** `APP_BAR_HEIGHT` plus a gap, as a responsive `top` value. */
export const stickyTop = (gap = 16) => ({
  xs: APP_BAR_HEIGHT.xs + gap,
  sm: APP_BAR_HEIGHT.sm + gap,
});

export default function InspectorShell({ open, onClose, language, children }) {
  // `useTheme` rather than useMediaQuery's callback form: the callback receives
  // the theme straight from context, which is null when there is no
  // ThemeProvider above — as in a unit test that renders this panel on its own.
  // `useTheme` falls back to MUI's default theme, whose breakpoints are the ones
  // being asked about anyway.
  //
  // `noSsr` because there is no server render here, and the default two-pass
  // behaviour would render the mobile branch first on every mount.
  const theme = useTheme();
  const docked = useMediaQuery(theme.breakpoints.up("md"), { noSsr: true });

  if (docked) {
    const top = stickyTop().sm;
    return (
      <PanelCard
        sx={{
          position: "sticky",
          top,
          // Its own scroll, so a long panel cannot outgrow the viewport and take
          // its lower sections out of reach while the canvas stays put.
          maxHeight: `calc(100vh - ${top + 16}px)`,
          overflowY: "auto",
        }}
      >
        {children}
      </PanelCard>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: "min(420px, 100%)", p: 1.5 } } }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: -1 }}>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={pick(language, "Close settings", "Fermer les réglages")}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>
      {children}
    </Drawer>
  );
}
