import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Modal,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Fade,
  Backdrop,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { validateEmail } from "../../utils/validate";

import { En, Fr, I18n } from "../I18n";

const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[24],
    padding: theme.spacing(4),
    minWidth: 500,
    maxWidth: 600,
    outline: "none",
  },
  title: {
    marginBottom: theme.spacing(3),
    fontWeight: 600,
  },
  description: {
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
  },
  textField: {
    marginBottom: theme.spacing(2),
  },
  buttonContainer: {
    display: "flex",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    justifyContent: "flex-end",
  },
  errorAlert: {
    marginBottom: theme.spacing(2),
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

export default function TransferModal({
  open,
  onClose,
  onAccept,
  email,
  setEmail,
}) {
  const [transferResult, setTransferResult] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const classes = useStyles();

  const emailIsValid = validateEmail(email);

  const handleClose = () => {
    setTransferResult(true);
    onClose();
  };

  const handleTransfer = async () => {
    setIsTransferring(true);
    const res = await onAccept();

    setTransferResult(res);
    setIsTransferring(false);
    if (res) handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      className={classes.modal}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
      aria-labelledby="transfer-modal-title"
      aria-describedby="transfer-modal-description"
    >
      <Fade in={open}>
        <Paper className={classes.paper}>
          <Typography
            variant="h5"
            id="transfer-modal-title"
            className={classes.title}
          >
            <I18n>
              <En>Transfer Record</En>
              <Fr>Transférer l'enregistrement</Fr>
            </I18n>
          </Typography>

          {isTransferring ? (
            <Box className={classes.loadingContainer}>
              <CircularProgress size={24} />
              <Typography variant="body1">
                <I18n>
                  <En>Transferring...</En>
                  <Fr>Transfert en cours...</Fr>
                </I18n>
              </Typography>
            </Box>
          ) : (
            <>
              {!transferResult && (
                <Alert severity="error" className={classes.errorAlert}>
                  <I18n>
                    <En>User {email} not found in this region</En>
                    <Fr>L'utilisateur {email} n'a pas été trouvé dans cette région</Fr>
                  </I18n>
                </Alert>
              )}

              <Typography
                variant="body1"
                id="transfer-modal-description"
                className={classes.description}
              >
                <I18n>
                  <En>
                    Enter the email address of the user to transfer this record
                    to. The user must have logged into this region at least
                    once.
                  </En>
                  <Fr>
                    Entrez l'adresse e-mail de l'utilisateur vers lequel
                    transférer cet enregistrement. L'utilisateur doit s'être
                    connecté à cette région au moins une fois.
                  </Fr>
                </I18n>
              </Typography>

              <TextField
                label={
                  <I18n>
                    <En>User Email</En>
                    <Fr>E-mail de l'utilisateur</Fr>
                  </I18n>
                }
                placeholder="user@example.com"
                helperText={
                  !emailIsValid && email && (
                    <I18n en="Invalid email address" fr="Adresse e-mail non valide" />
                  )
                }
                error={!emailIsValid && email.length > 0}
                value={email}
                onChange={(e) => {
                  setTransferResult(true);
                  setEmail(e.target.value);
                }}
                fullWidth
                variant="outlined"
                className={classes.textField}
                autoFocus
              />

              <Box className={classes.buttonContainer}>
                <Button variant="outlined" onClick={handleClose}>
                  <I18n>
                    <En>Cancel</En>
                    <Fr>Annuler</Fr>
                  </I18n>
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!email || !emailIsValid || isTransferring}
                  onClick={handleTransfer}
                >
                  <I18n>
                    <En>Transfer</En>
                    <Fr>Transférer</Fr>
                  </I18n>
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Fade>
    </Modal>
  );
}
