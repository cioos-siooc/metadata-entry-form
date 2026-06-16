import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { En, Fr, I18n } from "../I18n";

export default function SimpleModal({
  open,
  onClose,
  onAccept,
  modalQuestion,
}) {
  const handleAccept = () => {
    onClose();
    onAccept();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
      onKeyDown={(e) => {
        if (e.key === "y") {
          handleAccept();
        }
      }}
    >
      <DialogTitle id="simple-modal-title" sx={{ pb: modalQuestion ? 1 : 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          <I18n>
            <En>Are you sure?</En>
            <Fr>Vous êtes sûr ?</Fr>
          </I18n>
        </Typography>
      </DialogTitle>

      {modalQuestion && (
        <DialogContent>
          <DialogContentText id="simple-modal-description">
            {modalQuestion}
          </DialogContentText>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text">
          <I18n>
            <En>No</En>
            <Fr>Non</Fr>
          </I18n>
        </Button>
        <Button onClick={handleAccept} variant="contained" disableElevation>
          <I18n>
            <En>Yes</En>
            <Fr>Oui</Fr>
          </I18n>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
