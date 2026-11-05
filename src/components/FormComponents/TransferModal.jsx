import React, { useState } from "react";
import { makeStyles } from "../../tss-cache";
import { MenuItem, Modal, TextField } from "@mui/material";
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

const useStyles = makeStyles()((theme) => ({
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
  region,
  regionOptions = [],
  destinationRegion = region,
  setDestinationRegion,
}) {
  // why the last transfer failed: "user-not-found", "has-doi" or an error message
  const [failure, setFailure] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { classes } = useStyles();

  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);

  const emailIsValid = validateEmail(email);
  const changesRegion = destinationRegion !== region;

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
              {failure === "user-not-found" && (
                <h3>
                  <I18n>
                    <En>User {email} not found</En>
                    <Fr>L'utilisateur {email} n'a pas été trouvé</Fr>
                  </I18n>
                </h3>
              )}
              {failure === "has-doi" && (
                <h3>
                  <I18n>
                    <En>
                      This record has a DOI from this region's DataCite account.
                      Ask the DataCite consortium to move the DOI to the other
                      region's repository before moving the record.
                    </En>
                    <Fr>
                      Cet enregistrement a un DOI du compte DataCite de cette
                      région. Demandez au consortium DataCite de déplacer le DOI
                      vers le dépôt de l'autre région avant de déplacer
                      l'enregistrement.
                    </Fr>
                  </I18n>
                </h3>
              )}
              {failure && !["user-not-found", "has-doi"].includes(failure) && (
                <h3>{failure}</h3>
              )}

              <div>
                {changesRegion ? (
                  <I18n>
                    <En>
                      To also change the owner, enter the email address of the
                      new owner. Leave it empty to keep the current owner:
                    </En>
                    <Fr>
                      Pour changer aussi de propriétaire, entrez l'adresse
                      e-mail du nouveau propriétaire. Laissez-la vide pour
                      garder le propriétaire actuel :
                    </Fr>
                  </I18n>
                ) : (
                  <I18n>
                    <En>
                      Enter the email address of the user to transfer this
                      record to. The user must already have an account:
                    </En>
                    <Fr>
                      Entrez l'adresse e-mail de l'utilisateur vers lequel
                      transférer cet enregistrement. L'utilisateur doit déjà
                      avoir un compte :
                    </Fr>
                  </I18n>
                )}
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
                    setFailure("");
                    setEmail(e.target.value);
                  }}
                  fullWidth
                />
              </div>

              {regionOptions.length > 1 && (
                <div>
                  <TextField
                    select
                    label={<I18n en="Region" fr="Région" />}
                    helperText={
                      changesRegion && (
                        <I18n
                          en="If you review that region too, the record keeps its status. Otherwise it is sent to that region's reviewers as submitted, and leaves this region's catalogue."
                          fr="Si vous révisez aussi cette région, l'enregistrement garde son statut. Sinon, il est envoyé aux réviseurs de cette région comme soumis et quitte le catalogue de cette région."
                        />
                      )
                    }
                    value={destinationRegion}
                    onChange={(e) => {
                      setFailure("");
                      setDestinationRegion(e.target.value);
                    }}
                    fullWidth
                    margin="normal"
                  >
                    {regionOptions.map(({ value, label }) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              )}

              <button
                type="button"
                disabled={
                  (!email && !changesRegion) || !emailIsValid || isTransferring
                }
                onClick={async () => {
                  setIsTransferring(true);
                  try {
                    const { success, reason } = await onAccept();
                    setFailure(success ? "" : reason);
                    if (success) onClose();
                  } catch (error) {
                    setFailure(error.message);
                  }
                  setIsTransferring(false);
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
                  setFailure("");
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
