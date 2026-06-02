import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { I18n, En, Fr } from "../I18n";

const DOI_STATE_LABELS = {
  draft: { en: "Draft", fr: "Brouillon" },
  registered: { en: "Registered", fr: "Enregistré" },
  findable: { en: "Findable", fr: "Trouvable" },
};

function DoiStateChip({ state }) {
  const colorMap = { draft: "default", registered: "warning", findable: "success" };
  const label = DOI_STATE_LABELS[state];
  if (!label) return null;
  return (
    <Chip
      size="small"
      color={colorMap[state] || "default"}
      label={<I18n en={label.en} fr={label.fr} />}
      style={{ marginLeft: 8 }}
    />
  );
}

/**
 * Dialog for managing DataCite DOI state transitions during publish/unpublish.
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void  (cancel / close without action)
 *   onSelect      — (choice: "findable" | "registered" | "skip") => void
 *   mode          — "publish" | "unpublish"
 *   currentDoiState — "draft" | "registered" | "findable"
 *   loading       — boolean (show spinner while transition is in progress)
 */
export default function DataciteStatusDialog({
  open,
  onClose,
  onSelect,
  mode,
  currentDoiState,
  loading = false,
}) {
  const isPublish = mode === "publish";

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} aria-labelledby="datacite-status-title" fullWidth maxWidth="sm">
      <DialogTitle id="datacite-status-title">
        <I18n>
          <En>Set DOI Status</En>
          <Fr>Définir le statut du DOI</Fr>
        </I18n>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20 }}>
            <CircularProgress />
            <Typography variant="body2" color="textSecondary" style={{ marginTop: 12 }}>
              <I18n>
                <En>Updating DOI status in DataCite…</En>
                <Fr>Mise à jour du statut du DOI dans DataCite…</Fr>
              </I18n>
            </Typography>
          </div>
        ) : (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <I18n>
                <En>Current DOI status:</En>
                <Fr>Statut actuel du DOI :</Fr>
              </I18n>
              <DoiStateChip state={currentDoiState} />
            </Typography>

            {isPublish ? (
              <Typography variant="body1" style={{ marginTop: 8 }}>
                <I18n>
                  <En>
                    Would you like to update the DOI status in DataCite?
                  </En>
                  <Fr>
                    Souhaitez-vous mettre à jour le statut du DOI dans DataCite ?
                  </Fr>
                </I18n>
              </Typography>
            ) : (
              <Typography variant="body1" style={{ marginTop: 8 }}>
                <I18n>
                  <En>
                    This DOI is currently <strong>findable</strong> (publicly discoverable). Would you like to demote it to <strong>registered</strong> (hidden from public discovery)?
                  </En>
                  <Fr>
                    Ce DOI est actuellement <strong>trouvable</strong> (accessible publiquement). Souhaitez-vous le rétrograder à <strong>enregistré</strong> (masqué de la découverte publique) ?
                  </Fr>
                </I18n>
              </Typography>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          <I18n>
            <En>Cancel</En>
            <Fr>Annuler</Fr>
          </I18n>
        </Button>

        <Button onClick={() => onSelect("skip")} disabled={loading}>
          <I18n>
            <En>Skip</En>
            <Fr>Ignorer</Fr>
          </I18n>
        </Button>

        {isPublish && (
          <>
            {currentDoiState !== "findable" && (
              <Button
                onClick={() => onSelect("registered")}
                color="warning"
                variant="outlined"
                disabled={loading}
              >
                <I18n>
                  <En>Set to Registered</En>
                  <Fr>Définir comme enregistré</Fr>
                </I18n>
              </Button>
            )}
            <Button
              onClick={() => onSelect("findable")}
              color="success"
              variant="contained"
              disabled={loading}
            >
              <I18n>
                <En>Set to Findable</En>
                <Fr>Définir comme trouvable</Fr>
              </I18n>
            </Button>
          </>
        )}

        {!isPublish && (
          <Button
            onClick={() => onSelect("registered")}
            color="warning"
            variant="contained"
            disabled={loading}
          >
            <I18n>
              <En>Demote to Registered</En>
              <Fr>Rétrograder à enregistré</Fr>
            </I18n>
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
