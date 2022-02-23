import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Modal, TextField } from "@material-ui/core";
import { validateEmail } from "../../utils/validate";

import { En, Fr, I18n } from "../I18n";

function rand() {
  return Math.round(Math.random() * 20) - 10;
}

function getModalStyle() {
  const top = 50 + rand();
  const left = 50 + rand();

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

export default function TransferModal({
  open,
  onClose,
  onAccept,
  email,
  setEmail,
}) {
  // result of the transger
  const [transferResult, setTransferResult] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const classes = useStyles();

  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);

  const emailIsValid = validateEmail(email);

  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        <div style={modalStyle} className={classes.paper}>
          <h2 id="simple-modal-title">
            <I18n>
              <En>Transfer Record</En>
              <Fr>Enregistrement de transfert</Fr>
            </I18n>
          </h2>
          {isTransferring ? (
            <h3>
              <I18n>
                <En>Transferring...</En>
                <Fr>Transfert en cours...</Fr>
              </I18n>
            </h3>
          ) : (
            <div>
              {!transferResult && (
                <h3>
                  <I18n>
                    <En>User {email} not found</En>
                    <Fr>L'utilisateur {email} n'a pas été trouvé</Fr>
                  </I18n>
                </h3>
              )}

              <div>
                <I18n>
                  <En>
                    Enter the email address of the user to transfer this record
                    to. The user must have logged into this region at least
                    once:
                  </En>
                  <Fr>
                    Entrez l'adresse e-mail de l'utilisateur vers lequel
                    transférer cet enregistrement. L'utilisateur doit s'être
                    connecté à cette région au moins une fois:
                  </Fr>
                </I18n>
              </div>

              {/* naterosenstock@gmail.com */}
              <div>
                <TextField
                  helperText={
                    !emailIsValid && (
                      <I18n en="Invalid email" fr="E-mail non valide" />
                    )
                  }
                  error={!emailIsValid}
                  value={email}
                  onChange={(e) => {
                    setTransferResult(true);
                    setEmail(e.target.value);
                  }}
                  fullWidth
                />
              </div>

              <button
                type="button"
                disabled={!email || !emailIsValid || isTransferring}
                onClick={async () => {
                  setIsTransferring(true);
                  const transferResult = await onAccept();

                  setTransferResult(transferResult);
                  setIsTransferring(false);
                  if (transferResult) onClose();
                }}
              >
                <I18n>
                  <En>Transfer</En>
                  <Fr>Transfert</Fr>
                </I18n>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransferResult(true);
                  onClose();
                }}
              >
                <I18n>
                  <En>Cancel</En>
                  <Fr>Annuler</Fr>
                </I18n>
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
