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

// Each source is asked for a different thing and carries its own caveats, so the
// dialog's copy is per-source rather than one blurb covering all three.
const sources = {
  doi: {
    label: <I18n en="DOI (DataCite)" fr="DOI (DataCite)" />,
    title: (
      <I18n en="Create a record from a DOI" fr="Créer un enregistrement à partir d'un DOI" />
    ),
    fieldLabel: <I18n en="DOI" fr="DOI" />,
    placeholder: "https://doi.org/10.5281/zenodo.19077076",
    description: (
      <I18n>
        <En>
          Paste a DOI, with or without the <code>https://doi.org/</code> prefix. The
          title, abstract, authors, keywords, licence and related identifiers will be
          taken from its DataCite registration.
        </En>
        <Fr>
          Collez un DOI, avec ou sans le préfixe <code>https://doi.org/</code>. Le
          titre, le résumé, les auteurs, les mots-clés, la licence et les identifiants
          associés proviendront de son enregistrement DataCite.
        </Fr>
      </I18n>
    ),
    caveat: (
      <I18n
        en="Only DOIs registered with DataCite can be read. Journal DOIs registered with Crossref will not be found."
        fr="Seuls les DOI enregistrés auprès de DataCite peuvent être lus. Les DOI de revues enregistrés auprès de Crossref ne seront pas trouvés."
      />
    ),
  },
  obis: {
    label: <I18n en="OBIS dataset" fr="Jeu de données OBIS" />,
    title: (
      <I18n
        en="Create a record from an OBIS dataset"
        fr="Créer un enregistrement à partir d'un jeu de données OBIS"
      />
    ),
    fieldLabel: <I18n en="OBIS dataset ID or URL" fr="Identifiant ou URL du jeu de données OBIS" />,
    placeholder: "https://obis.org/dataset/5422689c-d83d-44e8-87f4-a4b0a5117181",
    description: (
      <I18n>
        <En>
          Paste an OBIS dataset URL, or just its ID. Alongside the title, abstract and
          contacts, the essential ocean variables and platforms are inferred from the
          dataset&apos;s occurrence records.
        </En>
        <Fr>
          Collez l&apos;URL d&apos;un jeu de données OBIS, ou simplement son
          identifiant. En plus du titre, du résumé et des contacts, les variables
          océaniques essentielles et les plateformes sont déduites des enregistrements
          d&apos;occurrence du jeu de données.
        </Fr>
      </I18n>
    ),
    caveat: (
      <I18n
        en="The inferred variables and platforms are a starting point — check them before saving. This lookup can take up to a minute."
        fr="Les variables et plateformes déduites sont un point de départ : vérifiez-les avant d'enregistrer. Cette recherche peut prendre jusqu'à une minute."
      />
    ),
  },
  pdc: {
    label: (
      <I18n
        en="Polar Data Catalogue (CCIN)"
        fr="Catalogue de données polaires (CCIN)"
      />
    ),
    title: (
      <I18n
        en="Create a record from a Polar Data Catalogue record"
        fr="Créer un enregistrement à partir d'un enregistrement du Catalogue de données polaires"
      />
    ),
    fieldLabel: <I18n en="CCIN reference number" fr="Numéro de référence CCIN" />,
    placeholder: "13172",
    description: (
      <I18n>
        <En>
          Enter the CCIN reference number of the Polar Data Catalogue record, for
          example <code>13172</code>. Its ISO 19139 metadata will be read from
          polardata.ca.
        </En>
        <Fr>
          Saisissez le numéro de référence CCIN de l&apos;enregistrement du Catalogue de
          données polaires, par exemple <code>13172</code>. Ses métadonnées ISO 19139
          seront lues depuis polardata.ca.
        </Fr>
      </I18n>
    ),
    caveat: (
      <I18n
        en="PDC records carry no vertical extent or taxonomic coverage; those sections will be left empty."
        fr="Les enregistrements du CDDP ne comportent ni étendue verticale ni couverture taxonomique ; ces sections resteront vides."
      />
    ),
  },
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

  // sourceType is null while the dialog is closed, and the copy should follow what
  // the user actually typed once detection disagrees with the menu item they picked.
  const source = sources[effectiveType] || sources[sourceType] || sources.doi;

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
      <DialogTitle>{source.title}</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {source.description}{" "}
          <I18n
            en="Nothing is saved until you review the form and click save."
            fr="Rien n'est enregistré tant que vous n'avez pas vérifié le formulaire et cliqué sur enregistrer."
          />
        </DialogContentText>

        <TextField
          autoFocus
          fullWidth
          disabled={loading}
          value={value}
          placeholder={source.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) handleSubmit();
          }}
          label={source.fieldLabel}
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
                    {sources[detected].label}
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

        <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
          {source.caveat}
        </Alert>

        {loading && (
          <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mt: 2 }}>
            <I18n en="Retrieving the record…" fr="Récupération de l'enregistrement…" />
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
