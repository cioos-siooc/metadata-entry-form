import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Snackbar,
  Box,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import { makeStyles } from "../../tss-cache";
import { En, Fr, I18n } from "../I18n";
import { signInWithGoogle, signInWithMicrosoft, signInWithOrcid } from "../../auth";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "../Icons";

const useStyles = makeStyles()((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    padding: theme.spacing(2),
    boxSizing: "border-box",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.5),
    },
  },
  card: {
    width: "100%",
    maxWidth: 450,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    borderRadius: 16,
    [theme.breakpoints.down("sm")]: {
      maxWidth: "100%",
      borderRadius: 12,
    },
  },
  cardContent: {
    padding: theme.spacing(2.5),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1.5),
      "&:last-child": {
        paddingBottom: theme.spacing(1.5),
      },
    },
  },
  regionLogo: {
    maxHeight: 120,
    width: "auto",
    display: "block",
    [theme.breakpoints.down("sm")]: {
      maxHeight: 90,
    },
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.5rem",
      marginBottom: theme.spacing(0.25),
    },
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
    fontSize: "0.9rem",
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.8rem",
      marginBottom: theme.spacing(1.5),
    },
  },
  buttonStack: {
    gap: theme.spacing(0.6),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(0.4),
    },
  },
  button: {
    padding: theme.spacing(1, 1.5),
    textTransform: "none",
    fontSize: "0.9rem",
    fontWeight: 600,
    borderRadius: 10,
    transition: "all 0.3s ease",
    border: `2px solid ${theme.palette.divider}`,
    minHeight: 44,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(0.75, 1.25),
      fontSize: "0.85rem",
      minHeight: 40,
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
      borderColor: theme.palette.primary.main,
    },
    "&:active": {
      transform: "translateY(0)",
    },
  },
  footer: {
    marginTop: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(0.5),
    [theme.breakpoints.down("sm")]: {
      marginTop: theme.spacing(1.5),
      paddingTop: theme.spacing(1),
    },
  },
  footerLogo: {
    maxHeight: 40,
    width: "auto",
    opacity: 0.7,
    [theme.breakpoints.down("sm")]: {
      maxHeight: 32,
    },
  },
  footerText: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.7rem",
    },
  },
}));

const enableMicrosoft = import.meta.env.VITE_AUTH_MICROSOFT !== "false";
const enableOrcid = import.meta.env.VITE_AUTH_ORCID !== "false";

const Login = () => {
  const { classes } = useStyles();
  const [error, setError] = useState(null);

  const handleLogin = async (loginMethod) => {
    try {
      await loginMethod();
    } catch (err) {
      console.error("Login Error:", err);
      if (err.code !== "auth/cancelled-popup-request") {
        setError(err.message);
      }
    }
  };

  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography variant="h4" component="h1" className={classes.title} align="center">
            <I18n>
              <En>Welcome</En>
              <Fr>Bienvenue</Fr>
            </I18n>
          </Typography>

          <Typography
            variant="body2"
            className={classes.subtitle}
            align="center"
          >
            <I18n>
              <En>
                Please sign in to access your metadata records.
              </En>
              <Fr>
                Veuillez vous connecter pour accéder à vos enregistrements de
                métadonnées.
              </Fr>
            </I18n>
          </Typography>

          <Stack className={classes.buttonStack}>
            <Button
              variant="outlined"
              fullWidth
              className={classes.button}
              startIcon={<GoogleIcon />}
              onClick={() => handleLogin(signInWithGoogle)}
            >
              <I18n>
                <En>Google</En>
                <Fr>Google</Fr>
              </I18n>
            </Button>
            {enableMicrosoft && (
              <Button
                variant="outlined"
                fullWidth
                className={classes.button}
                startIcon={<MicrosoftIcon />}
                onClick={() => handleLogin(signInWithMicrosoft)}
              >
                <I18n>
                  <En>Microsoft</En>
                  <Fr>Microsoft</Fr>
                </I18n>
              </Button>
            )}
            {enableOrcid && (
              <Button
                variant="outlined"
                fullWidth
                className={classes.button}
                startIcon={<OrcidIcon />}
                onClick={() => handleLogin(signInWithOrcid)}
              >
                <I18n>
                  <En>ORCID</En>
                  <Fr>ORCID</Fr>
                </I18n>
              </Button>
            )}
          </Stack>

          <Box className={classes.footer}>
            <img
              src={new URL("../../static/cioos-national_EN_FR_min.svg", import.meta.url).href}
              alt="CIOOS"
              className={classes.footerLogo}
            />
            <Typography className={classes.footerText}>
              <I18n>
                <En>Managed by CIOOS</En>
                <Fr>Géré par SIOOC</Fr>
              </I18n>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
