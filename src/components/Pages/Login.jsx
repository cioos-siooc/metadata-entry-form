import { useState } from "react";
import { useParams } from "react-router-dom";
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
import regions from "../../regions";

const enableMicrosoft = import.meta.env.VITE_AUTH_MICROSOFT !== "false";
const enableOrcid = import.meta.env.VITE_AUTH_ORCID !== "false";

const Login = () => {
  const { region } = useParams();
  const regionEmail = regions[region]?.email;
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
    enableMicrosoft && { key: "microsoft", icon: <MicrosoftIcon />, label: <I18n en="Continue with Microsoft" fr="Continuer avec Microsoft" />, fn: signInWithMicrosoft },
    enableOrcid && { key: "orcid", icon: <OrcidIcon />, label: <I18n en="Continue with ORCID" fr="Continuer avec ORCID" />, fn: signInWithOrcid },
  ].filter(Boolean);

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

          {regionEmail && (
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "text.secondary",
                mt: 2.5,
                lineHeight: 1.5,
              }}
            >
              <I18n>
                <En>For any issues, contact </En>
                <Fr>En cas de problème, contactez </Fr>
              </I18n>
              <Box
                component="a"
                href={`mailto:${regionEmail}`}
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {regionEmail}
              </Box>
            </Typography>
          )}

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

          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={new URL("../../static/cioos-national_EN_FR_min.svg", import.meta.url).href}
              alt="CIOOS"
              sx={{ maxHeight: 40, width: "auto", opacity: 0.7 }}
            />
          </Box>
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
