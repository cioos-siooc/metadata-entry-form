import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Stack,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import { Close, CheckCircle, LinkOff } from "@mui/icons-material";
import { auth, linkProvider, unlinkProvider, providerLabels } from "../auth";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "./Icons";
import { En, Fr, I18n } from "./I18n";

const PROVIDER_IDS = ["google.com", "microsoft.com", "oidc.orcid"];

const iconFor = (id) => {
  if (id === "google.com") return <GoogleIcon />;
  if (id === "microsoft.com") return <MicrosoftIcon />;
  if (id === "oidc.orcid") return <OrcidIcon />;
  return null;
};

const ConnectedAccountsDialog = ({ open, onClose }) => {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0);

  const user = auth.currentUser;
  const providerData = user?.providerData || [];
  const linkedIds = new Set(providerData.map((p) => p.providerId));
  const emailByProvider = Object.fromEntries(
    providerData.map((p) => [p.providerId, p.email])
  );

  const refresh = async () => {
    await auth.currentUser?.reload();
    setTick((t) => t + 1);
  };

  const handleLink = async (id) => {
    setError(null);
    setBusy(id);
    try {
      await linkProvider(id);
      await refresh();
    } catch (err) {
      if (
        err?.code !== "auth/cancelled-popup-request" &&
        err?.code !== "auth/popup-closed-by-user"
      ) {
        setError(err.message || String(err));
      }
    } finally {
      setBusy(null);
    }
  };

  const handleUnlink = async (id) => {
    setError(null);
    setBusy(id);
    try {
      await unlinkProvider(id);
      await refresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          <I18n>
            <En>Connected accounts</En>
            <Fr>Comptes connectés</Fr>
          </I18n>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          <I18n>
            <En>
              Link providers so you can sign in to this account with any of them.
            </En>
            <Fr>
              Liez des fournisseurs pour pouvoir vous connecter à ce compte avec
              l&apos;un d&apos;entre eux.
            </Fr>
          </I18n>
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={1.5}>
          {PROVIDER_IDS.map((id) => {
            const linked = linkedIds.has(id);
            const onlyOneLinked = linkedIds.size <= 1;
            const isBusy = busy === id;
            const email = emailByProvider[id];

            return (
              <Box
                key={id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  backgroundColor: (theme) =>
                    linked ? theme.palette.action.hover : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: (theme) => theme.palette.primary.main,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: (theme) => theme.palette.background.paper,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    flexShrink: 0,
                  }}
                >
                  {iconFor(id)}
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {providerLabels[id]}
                    </Typography>
                    {linked && (
                      <Chip
                        size="small"
                        icon={<CheckCircle sx={{ fontSize: 14 }} />}
                        label={
                          <I18n>
                            <En>Connected</En>
                            <Fr>Connecté</Fr>
                          </I18n>
                        }
                        color="success"
                        variant="outlined"
                        sx={{ height: 22 }}
                      />
                    )}
                  </Stack>
                  {linked && email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {email}
                    </Typography>
                  )}
                  {!linked && (
                    <Typography variant="body2" color="text.secondary">
                      <I18n>
                        <En>Not connected</En>
                        <Fr>Non connecté</Fr>
                      </I18n>
                    </Typography>
                  )}
                </Box>

                <Box sx={{ flexShrink: 0 }}>
                  {isBusy ? (
                    <CircularProgress size={22} />
                  ) : linked ? (
                    <Tooltip
                      title={
                        onlyOneLinked ? (
                          <I18n>
                            <En>You must keep at least one provider linked</En>
                            <Fr>Vous devez garder au moins un fournisseur lié</Fr>
                          </I18n>
                        ) : (
                          ""
                        )
                      }
                    >
                      <span>
                        <Button
                          size="small"
                          color="error"
                          variant="text"
                          startIcon={<LinkOff />}
                          disabled={onlyOneLinked}
                          onClick={() => handleUnlink(id)}
                        >
                          <I18n>
                            <En>Unlink</En>
                            <Fr>Délier</Fr>
                          </I18n>
                        </Button>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      disableElevation
                      onClick={() => handleLink(id)}
                    >
                      <I18n>
                        <En>Connect</En>
                        <Fr>Connecter</Fr>
                      </I18n>
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="text">
          <I18n>
            <En>Close</En>
            <Fr>Fermer</Fr>
          </I18n>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectedAccountsDialog;
