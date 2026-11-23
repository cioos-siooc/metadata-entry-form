import { useState } from "react";
import LogoPlate from "../Layout/LogoPlate";
import { useParams } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Box, Typography, Button, Stack, Snackbar, Alert } from "@mui/material";
import { En, Fr, I18n } from "../I18n";
import {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithOrcid,
} from "../../auth";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "../Icons";
import regions, { getNationalLogo } from "../../regions";
import { HEADER_HEIGHT } from "../NavDrawer/styles";

const enableMicrosoft = import.meta.env.VITE_AUTH_MICROSOFT !== "false";
const enableOrcid = import.meta.env.VITE_AUTH_ORCID !== "false";

const Login = () => {
  const { region, language } = useParams();
  const regionEmail = regions[region]?.email;
  const [error, setError] = useState(null);
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleLogin = async (loginMethod, key) => {
    try {
      setLoadingProvider(key);
      await loginMethod();
    } catch (err) {
      console.error("Login Error:", err.code, err.customData, err);
      if (err.code !== "auth/cancelled-popup-request") {
        Sentry.captureException(err, {
          tags: { auth_code: err.code, auth_provider: key },
          extra: { customData: err.customData },
        });
        setError(`${err.message} (${err.code})`);
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const providers = [
    {
      key: "google",
      icon: <GoogleIcon />,
      label: <I18n en="Continue with Google" fr="Continuer avec Google" />,
      fn: signInWithGoogle,
    },
    enableMicrosoft && {
      key: "microsoft",
      icon: <MicrosoftIcon />,
      label: (
        <I18n en="Continue with Microsoft" fr="Continuer avec Microsoft" />
      ),
      fn: signInWithMicrosoft,
    },
    enableOrcid && {
      key: "orcid",
      icon: <OrcidIcon />,
      label: <I18n en="Continue with ORCID" fr="Continuer avec ORCID" />,
      fn: signInWithOrcid,
    },
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        // Centred in the space under the app header (main's 8px bottom padding
        // included, so it never scrolls); on short screens the padding keeps
        // it off the edges and the page scrolls as usual.
        alignItems: "center",
        minHeight: `calc(100dvh - ${HEADER_HEIGHT + 8}px)`,
        px: { xs: 1, sm: 2, md: 3 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 4, md: 6 },
      }}
    >
      {/* Flat bordered card, as EditorPage frames its editor. */}
      <Box
        sx={(theme) => ({
          maxWidth: 460,
          width: "100%",
          border: `1px solid ${theme.vars.palette.divider}`,
          borderRadius: 1.5,
          bgcolor: "background.paper",
          p: { xs: 3, md: 4 },
        })}
      >
        <Stack spacing={1} sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="h4" component="h1">
            <I18n en="Sign in" fr="Connexion" />
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", textWrap: "pretty" }}
          >
            <I18n
              en="Use the same account each time: your records and saved contacts belong to it."
              fr="Utilisez toujours le même compte : vos enregistrements et contacts y sont rattachés."
            />
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
                color: "primaryText",
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
          <LogoPlate>
            <Box
              component="img"
              src={getNationalLogo(language)}
              alt={language === "fr" ? "SIOOC" : "CIOOS"}
              sx={{ height: 40, width: "auto", maxWidth: "100%" }}
            />
          </LogoPlate>
        </Box>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
