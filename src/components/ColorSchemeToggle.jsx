import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import { LightModeOutlined, DarkModeOutlined } from "@mui/icons-material";
import { useColorScheme } from "@mui/material/styles";
import { I18n } from "./I18n";

// Light/dark switch for the app bar. Two states only: "system" is the initial
// default, and the first click moves the user to an explicit choice, which
// MUI persists to localStorage.
export default function ColorSchemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();

  // Nothing is resolved during the first server/hydration pass.
  if (!mode) return null;

  const resolved = mode === "system" ? systemMode : mode;
  const next = resolved === "dark" ? "light" : "dark";

  return (
    <Tooltip
      title={
        next === "dark" ? (
          <I18n en="Dark mode" fr="Mode sombre" />
        ) : (
          <I18n en="Light mode" fr="Mode clair" />
        )
      }
    >
      <IconButton
        onClick={() => setMode(next)}
        size="small"
        sx={{ color: "primary.contrastText" }}
        aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {resolved === "dark" ? (
          <LightModeOutlined fontSize="small" />
        ) : (
          <DarkModeOutlined fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}
