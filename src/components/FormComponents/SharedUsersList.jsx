import React, { useContext, useState } from "react";
import { Add, Delete } from "@mui/icons-material";
import {
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Box,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";

import { paperClass, SupplementalText } from "./QuestionStyles";
import { En, Fr, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";
import { validateEmail } from "../../utils/validate";

// Legacy shares were stored as { userID: true }, with the email only available by
// downloading the region's user list. New ones store the email as the value.
const shareLabel = (userID, value) =>
  typeof value === "string" ? value : `Unknown user (${userID.slice(0, 6)}…)`;

const messages = {
  shared: <I18n en="Record shared." fr="Enregistrement partagé." />,
  invited: (
    <I18n
      en="No account found for that address, so an invitation to create one has been sent. Access is granted as soon as they sign up."
      fr="Aucun compte n'est associé à cette adresse ; une invitation à en créer un a été envoyée. L'accès sera accordé dès l'inscription."
    />
  ),
  "already-shared": (
    <I18n
      en="This record is already shared with that address."
      fr="Cet enregistrement est déjà partagé avec cette adresse."
    />
  ),
  "already-invited": (
    <I18n
      en="An invitation has already been sent to that address."
      fr="Une invitation a déjà été envoyée à cette adresse."
    />
  ),
  unshared: <I18n en="Access removed." fr="Accès retiré." />,
  "invite-withdrawn": <I18n en="Invitation withdrawn." fr="Invitation retirée." />,
};

const emailFailed = (
  <I18n
    en="Saved, but the notification email could not be sent."
    fr="Enregistré, mais le courriel de notification n'a pas pu être envoyé."
  />
);

const SharedUsersList = ({ record, region }) => {
  const { shareRecord, unshareRecord } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const { recordID } = record;
  const sharedWith = record.sharedWith || {};
  const pendingShares = record.pendingShares || {};
  const emailIsValid = Boolean(email.trim()) && validateEmail(email.trim());

  // The record is kept in sync by MetadataForm's onValue listener, so there is
  // nothing to update locally once the server has written the change.
  const run = async (call, args) => {
    setBusy(true);
    try {
      const { data } = await call(args);
      const failed = data.emailSent === false;
      setFeedback({
        severity: failed ? "warning" : "success",
        message: failed ? emailFailed : messages[data.status] || null,
      });
      return true;
    } catch (e) {
      setFeedback({ severity: "error", message: e.message });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const sent = await run(shareRecord, {
      region,
      recordID,
      email: email.trim(),
      language: record.language,
    });
    if (sent) setEmail("");
  };

  return (
    <Grid>
      <Paper style={paperClass}>
        <Grid style={{ margin: "10px" }}>
          <Typography>
            <I18n>
              <En>
                To share editing access, enter the email address of the person you
                want to share this record with. If they don't have an account yet,
                they will be invited to create one.
              </En>
              <Fr>
                Pour partager l'accès en modification, saisissez l'adresse courriel
                de la personne avec qui vous souhaitez partager cet enregistrement.
                Si elle n'a pas encore de compte, elle sera invitée à en créer un.
              </Fr>
            </I18n>
          </Typography>
          <SupplementalText>
            <I18n>
              <En>
                <p>Please save the form before sharing access.</p>
              </En>
              <Fr>
                <p>Veuillez enregistrer le formulaire avant de partager l'accès.</p>
              </Fr>
            </I18n>
          </SupplementalText>
        </Grid>
        <Grid style={{ margin: "10px" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="share-with-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && recordID && emailIsValid && !busy) share();
                }}
                fullWidth
                label={<I18n en="Share with..." fr="Partager avec..." />}
                placeholder="name@example.org"
                variant="outlined"
                style={{ marginTop: "16px" }}
                error={Boolean(email) && !emailIsValid}
                helperText={
                  Boolean(email) &&
                  !emailIsValid && (
                    <I18n
                      en="Please enter a valid email address."
                      fr="Veuillez saisir une adresse courriel valide."
                    />
                  )
                }
              />
              <Button
                disabled={!recordID || !emailIsValid || busy}
                startIcon={<Add />}
                onClick={share}
                style={{
                  height: "46px",
                  justifyContent: "center",
                  marginTop: "15px",
                }}
              >
                <Typography>
                  <I18n>
                    <En>Share Record</En>
                    <Fr>Partager l'enregistrement</Fr>
                  </I18n>
                </Typography>
              </Button>
            </Grid>
            <Grid size={6} style={{ paddingLeft: "35px" }}>
              <Box style={{ margin: "10px" }}>
                <Typography style={{ fontWeight: "bold" }}>
                  {(Object.keys(sharedWith).length > 0 ||
                    Object.keys(pendingShares).length > 0) && (
                    <I18n>
                      <En>Users this record is shared with:</En>
                      <Fr>
                        Utilisateurs avec lesquels cet enregistrement est partagé :
                      </Fr>
                    </I18n>
                  )}
                </Typography>
                <List>
                  {Object.entries(sharedWith).map(([userID, value]) => (
                    <ListItem key={userID}>
                      <ListItemText
                        primary={
                          <Typography>{shareLabel(userID, value)}</Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          aria-label="delete"
                          disabled={busy}
                          style={{ marginRight: "60px" }}
                          onClick={() =>
                            run(unshareRecord, { region, recordID, uid: userID })
                          }
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {Object.entries(pendingShares).map(([inviteKey, pendingEmail]) => (
                    <ListItem key={inviteKey}>
                      <ListItemText
                        primary={<Typography>{pendingEmail}</Typography>}
                        secondary={
                          <Chip
                            size="small"
                            label={
                              <I18n en="Invitation sent" fr="Invitation envoyée" />
                            }
                          />
                        }
                        // a Chip is a div, which can't live inside <p>
                        slotProps={{ secondary: { component: "div" } }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          aria-label="delete"
                          disabled={busy}
                          style={{ marginRight: "60px" }}
                          onClick={() =>
                            run(unshareRecord, { region, recordID, inviteKey })
                          }
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
      >
        <Alert
          onClose={() => setFeedback(null)}
          severity={feedback?.severity || "info"}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default SharedUsersList;
