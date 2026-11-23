import React, { useId } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { I18n } from "../I18n";

// Confirmation for an action that changes or removes a record. The question is
// the title and the confirm button names the action, so "Delete" never sits
// behind a generic "Yes".
export default function SimpleModal({
  open,
  onClose,
  onAccept,
  modalQuestion,
  detail,
  confirmLabel,
  destructive = false,
}) {
  const titleId = useId();
  const descriptionId = useId();
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
      aria-labelledby={titleId}
      aria-describedby={detail ? descriptionId : undefined}
      onKeyDown={(e) => {
        if (e.key === "y") {
          handleAccept();
        }
      }}
    >
      <DialogTitle id={titleId} sx={{ fontSize: "1.125rem" }}>
        {modalQuestion || <I18n en="Are you sure?" fr="Êtes-vous sûr ?" />}
      </DialogTitle>

      {detail && (
        <DialogContent>
          <DialogContentText id={descriptionId}>{detail}</DialogContentText>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2.5, pt: detail ? 0 : 1 }}>
        <Button onClick={onClose}>
          <I18n en="Cancel" fr="Annuler" />
        </Button>
        <Button
          onClick={handleAccept}
          variant="contained"
          color={destructive ? "error" : "primary"}
          autoFocus={!destructive}
        >
          {confirmLabel || <I18n en="Confirm" fr="Confirmer" />}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
