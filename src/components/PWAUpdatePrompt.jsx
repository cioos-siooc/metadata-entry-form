import React from "react";
import { Alert, Button, Snackbar } from "@mui/material";
import { useRegisterSW } from "virtual:pwa-register/react";
import { I18n } from "./I18n";

// Service-worker update flow: registerType is "prompt" (vite.config.js), so a
// new version waits until the user opts in — never reload someone out of a
// half-filled form.
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        severity="info"
        onClose={() => setNeedRefresh(false)}
        action={
          <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
            <I18n en="Reload" fr="Recharger" />
          </Button>
        }
      >
        <I18n
          en="A new version is available."
          fr="Une nouvelle version est disponible."
        />
      </Alert>
    </Snackbar>
  );
}
