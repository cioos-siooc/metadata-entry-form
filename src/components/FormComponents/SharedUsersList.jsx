import React, { useEffect, useMemo, useState } from "react";
import {
  PersonAdd,
  Delete,
  Group,
  Lock,
} from "@mui/icons-material";
import {
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Box,
  Stack,
  Divider,
  Autocomplete,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";

import firebase from "../../firebase";
import { paperClass } from "./QuestionStyles";
import { En, Fr, I18n } from "../I18n";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialFor = (text) => {
  const t = (text || "").trim();
  return t ? t[0].toUpperCase() : "?";
};

const SharedUsersList = ({ record, updateRecord, region }) => {
  const authorID = record.userID;
  const [contacts, setContacts] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pendingUid, setPendingUid] = useState(null);

  const recordSaved = Boolean(record.recordID);

  // Subscribe to the author's own contacts list (the same list used for
  // citations). No directory of other users is ever fetched.
  useEffect(() => {
    if (!authorID || !region) return undefined;
    const database = getDatabase(firebase);
    const contactsRef = ref(database, `${region}/users/${authorID}/contacts`);
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      setContacts(snapshot.val() || {});
    });
    return () => {
      off(contactsRef);
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [authorID, region]);

  const contactSuggestions = useMemo(() => {
    const seen = new Set();
    return Object.values(contacts)
      .map((contact) => {
        const email = (contact && contact.indEmail ? contact.indEmail : "").trim();
        if (!email || !EMAIL_RE.test(email)) return null;
        const name = [contact.givenNames, contact.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const org = contact.orgName ? String(contact.orgName).trim() : "";
        const lowered = email.toLowerCase();
        return {
          email: lowered,
          name: name || email,
          org,
          searchKey: `${name} ${lowered} ${org}`.toLowerCase(),
        };
      })
      .filter((entry) => {
        if (!entry) return false;
        if (seen.has(entry.email)) return false;
        seen.add(entry.email);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts]);

  const typedEmail = (
    typeof inputValue === "string" ? inputValue : ""
  )
    .trim()
    .toLowerCase();
  const typedEmailValid = EMAIL_RE.test(typedEmail);
  const showInvalidEmail = Boolean(typedEmail) && !typedEmailValid;

  const handleShare = async () => {
    if (!typedEmailValid || !recordSaved || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const functions = getFunctions();
      const shareRecord = httpsCallable(functions, "shareRecord");
      await shareRecord({
        region,
        recordID: record.recordID,
        recipientEmail: typedEmail,
      });
      setInputValue("");
      setFeedback({ kind: "success" });
    } catch (err) {
      setFeedback({ kind: "error", message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleUnshare = async (recipientUid) => {
    if (busy) return;
    setBusy(true);
    setPendingUid(recipientUid);
    setFeedback(null);
    try {
      const functions = getFunctions();
      const unshareRecord = httpsCallable(functions, "unshareRecord");
      await unshareRecord({
        region,
        recordID: record.recordID,
        recipientUid,
      });
      const updated = { ...(record.sharedWith || {}) };
      delete updated[recipientUid];
      updateRecord("sharedWith")(updated);
      setFeedback({ kind: "removed" });
    } catch (err) {
      setFeedback({ kind: "error", message: err.message });
    } finally {
      setBusy(false);
      setPendingUid(null);
    }
  };

  const sharedWithEntries = Object.entries(record.sharedWith || {})
    .map(([recipientUid, value]) => {
      if (value && typeof value === "object") {
        return {
          recipientUid,
          displayName: value.displayName || "",
          email: value.email || "",
          legacy: false,
        };
      }
      return { recipientUid, displayName: "", email: "", legacy: true };
    })
    .sort((a, b) => {
      const an = a.displayName || a.email || "";
      const bn = b.displayName || b.email || "";
      return an.localeCompare(bn);
    });

  const sharedCount = sharedWithEntries.length;

  return (
    <Paper style={paperClass} elevation={2}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Group color="primary" />
          <Typography variant="h6" component="div">
            <I18n>
              <En>Share editing access</En>
              <Fr>Partager l'accès en modification</Fr>
            </I18n>
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <I18n>
            <En>
              Enter an email address to invite a collaborator. Suggestions are
              drawn from your saved contacts. We never reveal whether the email
              matches an existing CIOOS account &mdash; if it doesn't, the
              recipient is emailed an invitation and gains access automatically
              when they sign in.
            </En>
            <Fr>
              Saisissez une adresse e-mail pour inviter un collaborateur. Les
              suggestions proviennent de vos contacts enregistrés. Nous ne
              révélons jamais si l'adresse correspond à un compte CIOOS
              existant &mdash; si ce n'est pas le cas, le destinataire reçoit
              une invitation par courriel et obtient l'accès automatiquement
              dès sa connexion.
            </Fr>
          </I18n>
        </Typography>

        {!recordSaved && (
          <Alert
            severity="info"
            icon={<Lock fontSize="inherit" />}
            sx={{ mb: 2 }}
          >
            <I18n
              en="Save the form before sharing access."
              fr="Enregistrez le formulaire avant de partager l'accès."
            />
          </Alert>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
        >
          <Autocomplete
            id="share-with-email"
            freeSolo
            disableClearable
            disabled={!recordSaved || busy}
            options={contactSuggestions}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.email
            }
            isOptionEqualToValue={(option, value) =>
              option.email === (typeof value === "string" ? value : value?.email)
            }
            filterOptions={(options, state) => {
              const q = state.inputValue.trim().toLowerCase();
              const filtered = q
                ? options.filter((o) => o.searchKey.includes(q))
                : options;
              return filtered.slice(0, 8);
            }}
            inputValue={inputValue}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            onChange={(_, newValue) => {
              if (!newValue) return;
              if (typeof newValue === "string") {
                setInputValue(newValue);
              } else {
                setInputValue(newValue.email);
              }
            }}
            renderOption={(props, option) => {
              const liProps = { ...props };
              delete liProps.key;
              return (
                <li key={option.email} {...liProps}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                      {initialFor(option.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" noWrap>
                        {option.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="div"
                        noWrap
                      >
                        {option.email}
                        {option.org ? ` · ${option.org}` : ""}
                      </Typography>
                    </Box>
                  </Stack>
                </li>
              );
            }}
            sx={{ flex: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  <I18n
                    en="Email address"
                    fr="Adresse e-mail"
                  />
                }
                placeholder="name@example.org"
                variant="outlined"
                type="email"
                size="small"
                error={showInvalidEmail}
                helperText={
                  showInvalidEmail ? (
                    <I18n
                      en="Enter a valid email address."
                      fr="Saisissez une adresse e-mail valide."
                    />
                  ) : null
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && typedEmailValid && !busy) {
                    event.preventDefault();
                    handleShare();
                  }
                }}
              />
            )}
          />
          <Button
            variant="contained"
            disabled={!recordSaved || !typedEmailValid || busy}
            startIcon={
              busy ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <PersonAdd />
              )
            }
            onClick={handleShare}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-start" },
              minWidth: 140,
              height: 40,
              flexShrink: 0,
            }}
          >
            <I18n>
              <En>Share</En>
              <Fr>Partager</Fr>
            </I18n>
          </Button>
        </Stack>

        {sharedCount > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              <I18n>
                <En>{`People with access (${sharedCount})`}</En>
                <Fr>{`Personnes ayant accès (${sharedCount})`}</Fr>
              </I18n>
            </Typography>
            <List disablePadding>
              {sharedWithEntries.map(
                ({ recipientUid, displayName, email, legacy }, idx) => {
                  const isPending = pendingUid === recipientUid;
                  const primary = legacy
                    ? null
                    : displayName || email || recipientUid;
                  return (
                    <ListItem
                      key={recipientUid}
                      divider={idx < sharedWithEntries.length - 1}
                      secondaryAction={
                        <Tooltip
                          title={
                            <I18n
                              en="Remove access"
                              fr="Retirer l'accès"
                            />
                          }
                        >
                          <span>
                            <IconButton
                              edge="end"
                              aria-label="remove access"
                              disabled={busy}
                              onClick={() => handleUnshare(recipientUid)}
                            >
                              {isPending ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Delete />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      }
                      sx={{ px: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {legacy ? "?" : initialFor(primary)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          legacy ? (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontStyle="italic"
                            >
                              <I18n
                                en="Unknown user — remove and re-share to refresh"
                                fr="Utilisateur inconnu — retirez et repartagez pour rafraîchir"
                              />
                            </Typography>
                          ) : (
                            <Typography variant="body1">{primary}</Typography>
                          )
                        }
                        secondary={
                          legacy
                            ? null
                            : (
                              <Typography variant="caption" color="text.secondary">
                                {email ? `${email} · ` : ""}
                                <I18n en="Editor" fr="Éditeur" />
                              </Typography>
                            )
                        }
                      />
                    </ListItem>
                  );
                }
              )}
            </List>
          </>
        )}
      </Box>

      <Snackbar
        open={feedback?.kind === "success"}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setFeedback(null)}>
          <I18n
            en="Share request sent. The recipient will be notified by email."
            fr="Demande de partage envoyée. Le destinataire sera averti par courriel."
          />
        </Alert>
      </Snackbar>

      <Snackbar
        open={feedback?.kind === "removed"}
        autoHideDuration={3000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" variant="filled" onClose={() => setFeedback(null)}>
          <I18n en="Access removed." fr="Accès retiré." />
        </Alert>
      </Snackbar>

      <Snackbar
        open={feedback?.kind === "error"}
        autoHideDuration={6000}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" onClose={() => setFeedback(null)}>
          <I18n
            en={`Could not complete the request: ${feedback?.message || ""}`}
            fr={`Impossible de traiter la demande : ${feedback?.message || ""}`}
          />
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SharedUsersList;
