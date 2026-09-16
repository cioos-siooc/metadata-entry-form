import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { MyLocation } from "@mui/icons-material";
import { I18n } from "../I18n";
import {
  getCurrentPosition,
  isGeolocationAvailable,
} from "../../utils/geolocation";

// Fills spatial coverage from the device's GPS. Hidden when geolocation is
// unavailable (no API, or insecure context — geolocation needs HTTPS or
// localhost). onLocated receives { latitude, longitude }; onError a code of
// "denied" | "unavailable".
export default function UseMyLocationButton({ onLocated, onError, disabled }) {
  const [busy, setBusy] = useState(false);

  if (!isGeolocationAvailable()) return null;

  return (
    <Button
      startIcon={busy ? <CircularProgress size={20} /> : <MyLocation />}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          onLocated(await getCurrentPosition());
        } catch (err) {
          if (onError) onError(err.code);
        } finally {
          setBusy(false);
        }
      }}
    >
      <I18n en="Use my location" fr="Utiliser ma position" />
    </Button>
  );
}
