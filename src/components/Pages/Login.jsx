import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { En, Fr, I18n } from "../I18n";
import {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithOrcid,
} from "../../auth";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "../Icons";

const Login = () => {
  const [error, setError] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleLogin = async (loginMethod, key) => {
    try {
      setLoadingProvider(key);
      await loginMethod();
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code !== "auth/cancelled-popup-request") {
        setError(err.message);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const providers = [
    { key: "google", icon: <GoogleIcon />, label: <I18n en="Continue with Google" fr="Continuer avec Google" />, fn: signInWithGoogle },
    { key: "microsoft", icon: <MicrosoftIcon />, label: <I18n en="Continue with Microsoft" fr="Continuer avec Microsoft" />, fn: signInWithMicrosoft },
    { key: "orcid", icon: <OrcidIcon />, label: <I18n en="Continue with ORCID" fr="Continuer avec ORCID" />, fn: signInWithOrcid },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: { xs: 4, md: 8 },
        px: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={(theme) => ({
          maxWidth: 460,
          width: "100%",
          boxShadow: theme.shadows[2],
          borderRadius: 3,
        })}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1} sx={{ mb: 3, textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              <I18n>
                <En>Welcome back</En>
                <Fr>Bienvenue</Fr>
              </I18n>
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              <I18n>
                <En>Sign in to manage your metadata records.</En>
                <Fr>
                  Connectez-vous pour accéder à vos enregistrements de
                  métadonnées.
                </Fr>
              </I18n>
            </Typography>
          </Stack>

          <Stack spacing={1.5}>
            {providers.map(({ key, icon, label, fn }) => (
              <Button
                key={key}
                variant="outlined"
                size="large"
                fullWidth
                startIcon={icon}
                disabled={loadingProvider && loadingProvider !== key}
                onClick={() => handleLogin(fn, key)}
                sx={{
                  justifyContent: "center",
                  py: 1.25,
                  borderColor: "divider",
                  color: "text.primary",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primarySurface",
                  },
                }}
              >
                {loadingProvider === key ? (
                  <I18n en="Signing in…" fr="Connexion…" />
                ) : (
                  label
                )}
              </Button>
            ))}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: "text.secondary",
              mt: 3,
              lineHeight: 1.5,
            }}
          >
            <I18n
              en="By signing in you agree to the terms of your CIOOS regional association."
              fr="En vous connectant, vous acceptez les conditions de votre association régionale du SIOOC."
            />
          </Typography>
        </CardContent>
      </Card>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
