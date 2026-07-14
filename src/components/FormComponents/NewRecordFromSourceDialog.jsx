import React, { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

import { En, Fr, I18n } from "../I18n";
import {
  createRecordFromSource,
  detectSourceType,
} from "../../utils/createRecordFromSource";

const sourceLabels = {
  doi: <I18n en="DOI (DataCite)" fr="DOI (DataCite)" />,
  obis: <I18n en="OBIS dataset" fr="Jeu de données OBIS" />,
  pdc: <I18n en="Polar Data Catalogue (CCIN)" fr="Catalogue de données polaires (CCIN)" />,
};

const placeholders = {
  doi: "https://doi.org/10.21963/13172",
  obis: "https://obis.org/dataset/8c39a3f7-4b78-4d5a-9d4c-1f5e2a3b6c7d",
  pdc: "13172",
};

/**
 * Fetches an existing record from DataCite, OBIS or the Polar Data Catalogue and
 * hands it back to the caller so a new form can be opened prefilled with it.
 *
 * @param {boolean} open
 * @param {"doi"|"obis"|"pdc"} sourceType - Preselected from the menu; the field
 *   still auto-detects, so a pasted value that clearly disagrees wins.
 * @param {Function} onClose
 * @param {Function} onRecordLoaded - Called with the fetched (raw) record
 */
const NewRecordFromSourceDialog = ({
  open,
  sourceType,
  onClose,
  onRecordLoaded,
}) => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset whenever the dialog is reopened, so a previous error or identifier
  // doesn't reappear under a newly chosen source.
  useEffect(() => {
    if (open) {
      setValue("");
      setError("");
      setLoading(false);
    }
  }, [open, sourceType]);

  const detected = detectSourceType(value);
  const effectiveType = detected || sourceType;
  const canSubmit = Boolean(value.trim()) && Boolean(effectiveType) && !loading;

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const record = await createRecordFromSource(effectiveType, value.trim());
      onRecordLoaded(record);
    } catch (e) {
      setError(e.message || "Failed to retrieve the record. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <I18n
          en="Create a record from an existing source"
          fr="Créer un enregistrement à partir d'une source existante"
        />
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          <I18n>
            <En>
              Enter a DOI, an OBIS dataset ID or URL, or a Polar Data Catalogue
              CCIN number. The new form will open with the fields from that record
              already filled in. Nothing is saved until you review it and click
              save.
            </En>
            <Fr>
              Saisissez un DOI, un identifiant ou une URL de jeu de données OBIS,
              ou un numéro CCIN du Catalogue de données polaires. Le nouveau
              formulaire s'ouvrira avec les champs de cet enregistrement déjà
              remplis. Rien n'est enregistré tant que vous ne l'avez pas vérifié
              et sauvegardé.
            </Fr>
          </I18n>
        </DialogContentText>

        <TextField
          autoFocus
          fullWidth
          disabled={loading}
          value={value}
          placeholder={placeholders[sourceType]}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) handleSubmit();
          }}
          label={<I18n en="Identifier" fr="Identifiant" />}
        />

        {value.trim() && (
          <div style={{ marginTop: "10px" }}>
            {detected ? (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={
                  <>
                    <I18n en="Detected: " fr="Détecté : " />
                    {sourceLabels[detected]}
                  </>
                }
              />
            ) : (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={
                  <I18n
                    en="Unrecognized identifier"
                    fr="Identifiant non reconnu"
                  />
                }
              />
            )}
          </div>
        )}

        {loading && (
          <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mt: 2 }}>
            <I18n
              en="Retrieving the record. OBIS datasets can take up to a minute."
              fr="Récupération de l'enregistrement. Les jeux de données OBIS peuvent prendre jusqu'à une minute."
            />
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          <I18n en="Cancel" fr="Annuler" />
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} variant="contained">
          <I18n en="Fetch and create" fr="Récupérer et créer" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewRecordFromSourceDialog;
