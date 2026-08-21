import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import { validateEmail } from "../../utils/validate";

import { En, Fr, I18n } from "../I18n";

export default function TransferModal({
  open,
  onClose,
  onAccept,
  email,
  setEmail,
}) {
  // false once a transfer comes back reporting the target user doesn't exist
  const [transferResult, setTransferResult] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  const emailIsValid = validateEmail(email);

  const handleClose = () => {
    setTransferResult(true);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="transfer-modal-title"
    >
      <DialogTitle id="transfer-modal-title">
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          <I18n>
            <En>Transfer Record</En>
            <Fr>Enregistrement de transfert</Fr>
          </I18n>
        </Typography>
      </DialogTitle>

      <DialogContent>
        {isTransferring ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
            <CircularProgress size={20} />
            <Typography>
              <I18n>
                <En>Transferring…</En>
                <Fr>Transfert en cours…</Fr>
              </I18n>
            </Typography>
          </Stack>
        ) : (
          <>
            <DialogContentText sx={{ mb: 2 }}>
              <I18n>
                <En>
                  Enter the email address of the user to transfer this record
                  to. The user must have logged into this region at least once:
                </En>
                <Fr>
                  Entrez l'adresse e-mail de l'utilisateur vers lequel
                  transférer cet enregistrement. L'utilisateur doit s'être
                  connecté à cette région au moins une fois:
                </Fr>
              </I18n>
            </DialogContentText>

            <TextField
              type="email"
              label={<I18n en="Email" fr="Courriel" />}
              helperText={
                (!transferResult && (
                  <I18n
                    en={`User ${email} not found`}
                    fr={`L'utilisateur ${email} n'a pas été trouvé`}
                  />
                )) ||
                (!emailIsValid && (
                  <I18n en="Invalid email" fr="E-mail non valide" />
                ))
              }
              error={!emailIsValid || !transferResult}
              value={email}
              onChange={(e) => {
                setTransferResult(true);
                setEmail(e.target.value);
              }}
              fullWidth
            />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isTransferring}>
          <I18n>
            <En>Cancel</En>
            <Fr>Annuler</Fr>
          </I18n>
        </Button>
        <Button
          variant="contained"
          disabled={!email || !emailIsValid || isTransferring}
          onClick={async () => {
            setIsTransferring(true);
            const res = await onAccept();

            setTransferResult(res);
            setIsTransferring(false);
            if (res) onClose();
          }}
        >
          <I18n>
            <En>Transfer</En>
            <Fr>Transfert</Fr>
          </I18n>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
