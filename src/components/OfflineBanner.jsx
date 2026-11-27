import React, { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { I18n } from "./I18n";

// Persistent banner while the browser is offline. The PWA app shell loads
// offline, but records can't be read or saved until the connection returns.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <Snackbar open anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <Alert severity="warning">
        <I18n
          en="You are offline — the form cannot save or load records until you reconnect."
          fr="Vous êtes hors ligne — le formulaire ne peut pas enregistrer ni charger de données tant que vous n'êtes pas reconnecté."
        />
      </Alert>
    </Snackbar>
  );
}
