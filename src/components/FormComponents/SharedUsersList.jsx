import React, { useContext, useState } from "react";
import { Add, Delete } from "@mui/icons-material";
import {
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Snackbar,
  Stack,
  Alert,
} from "@mui/material";
import { useParams } from "react-router-dom";

import FormSection from "../FormShell/FormSection";
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
  "invite-withdrawn": (
    <I18n en="Invitation withdrawn." fr="Invitation retirée." />
  ),
};

const emailFailed = (
  <I18n
    en="Saved, but the notification email could not be sent."
    fr="Enregistré, mais le courriel de notification n'a pas pu être envoyé."
  />
);

const SharedUsersList = ({ record, region }) => {
  const { language } = useParams();
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

  const hasShares =
    Object.keys(sharedWith).length > 0 || Object.keys(pendingShares).length > 0;

  return (
    <>
      <FormSection
        title={<I18n en="Sharing" fr="Partage" />}
        description={
          <I18n>
            <En>
              Give someone else editing access. If they don't have an account
              yet, they will be invited to create one. Save the record before
              sharing.
            </En>
            <Fr>
              Donnez accès en modification à une autre personne. Si elle n'a pas
              encore de compte, elle sera invitée à en créer un. Veuillez
              enregistrer le formulaire avant de partager l'accès.
            </Fr>
          </I18n>
        }
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
          sx={{ maxWidth: 640 }}
        >
          <TextField
            id="share-with-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && recordID && emailIsValid && !busy)
                share();
            }}
            fullWidth
            label={<I18n en="Email address" fr="Adresse courriel" />}
            placeholder="name@example.org"
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
            variant="outlined"
            disabled={!recordID || !emailIsValid || busy}
            startIcon={<Add />}
            onClick={share}
            sx={{ flexShrink: 0, minHeight: 41, whiteSpace: "nowrap" }}
          >
            <I18n>
              <En>Share record</En>
              <Fr>Partager l'enregistrement</Fr>
            </I18n>
          </Button>
        </Stack>
        {hasShares && (
          <Box sx={{ mt: 2.5 }}>
            <Typography
              component="h3"
              sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.5 }}
            >
              <I18n>
                <En>Shared with</En>
                <Fr>Partagé avec</Fr>
              </I18n>
            </Typography>
            <List dense disablePadding sx={{ maxWidth: 640 }}>
              {Object.entries(sharedWith).map(([userID, value]) => (
                <ListItem
                  key={userID}
                  disableGutters
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={
                        language === "fr" ? "Retirer l'accès" : "Remove access"
                      }
                      disabled={busy}
                      onClick={() =>
                        run(unshareRecord, {
                          region,
                          recordID,
                          uid: userID,
                        })
                      }
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText primary={shareLabel(userID, value)} />
                </ListItem>
              ))}
              {Object.entries(pendingShares).map(
                ([inviteKey, pendingEmail]) => (
                  <ListItem
                    key={inviteKey}
                    disableGutters
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label={
                          language === "fr"
                            ? "Annuler l'invitation"
                            : "Cancel invitation"
                        }
                        disabled={busy}
                        onClick={() =>
                          run(unshareRecord, {
                            region,
                            recordID,
                            inviteKey,
                          })
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={pendingEmail}
                      secondary={
                        <Chip
                          size="small"
                          label={
                            <I18n
                              en="Invitation sent"
                              fr="Invitation envoyée"
                            />
                          }
                          sx={{ mt: 0.5 }}
                        />
                      }
                      // a Chip is a div, which can't live inside <p>
                      slotProps={{ secondary: { component: "div" } }}
                    />
                  </ListItem>
                ),
              )}
            </List>
          </Box>
        )}
      </FormSection>
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
    </>
  );
};

export default SharedUsersList;
