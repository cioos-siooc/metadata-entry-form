import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { I18n, En, Fr } from "../I18n";

// Two of the three admin dialogs only need acknowledging, so they share this.
function AcknowledgeDialog({ id, open, onClose, title, children }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${id}-description`}>
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminDialogs({
  showDeletionDialog,
  onCloseDeletion,
  onConfirmDeletion,
  showCredentialsMissingDialog,
  onCloseCredentialsMissing,
  showErrorDialog,
  onCloseError,
  errorMessage,
}) {
  return (
    <>
      <Dialog
        open={showDeletionDialog}
        onClose={onCloseDeletion}
        aria-labelledby="delete-credentials-title"
        aria-describedby="delete-credentials-description"
      >
        <DialogTitle id="delete-credentials-title">
          Delete Datacite Credentials?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-credentials-description">
            Disabling DOI creation will delete the stored credentials. Are you
            sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeletion} color="primary">
            Cancel
          </Button>
          <Button onClick={onConfirmDeletion} color="error" autoFocus>
            Delete Credentials
          </Button>
        </DialogActions>
      </Dialog>

      <AcknowledgeDialog
        id="credentials-missing-dialog"
        open={showCredentialsMissingDialog}
        onClose={onCloseCredentialsMissing}
        title={
          <I18n>
            <En>Missing DataCite Credentials</En>
            <Fr>Informations d&apos;identification DataCite manquantes</Fr>
          </I18n>
        }
      >
        <I18n
          en="Nothing was saved. To enable DOI creation, please fill in the DataCite Prefix, Account ID, and Password."
          fr="Rien n'a été enregistré. Pour activer la création de DOI, veuillez renseigner le préfixe DataCite, l'identifiant de compte et le mot de passe."
        />
      </AcknowledgeDialog>

      <AcknowledgeDialog
        id="error-dialog"
        open={showErrorDialog}
        onClose={onCloseError}
        title="Error"
      >
        {errorMessage}
      </AcknowledgeDialog>
    </>
  );
}
