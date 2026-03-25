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
    minHeight: "100vh",
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
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2),
      "&:last-child": {
        paddingBottom: theme.spacing(2),
      },
    },
  },
  logo: {
    maxHeight: 80,
    width: "auto",
    marginBottom: theme.spacing(2),
    display: "block",
    [theme.breakpoints.down("sm")]: {
      maxHeight: 60,
      marginBottom: theme.spacing(1.5),
    },
  },
  title: {
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.5rem",
      marginBottom: theme.spacing(0.5),
    },
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    fontSize: "0.95rem",
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.85rem",
      marginBottom: theme.spacing(2),
    },
  },
  buttonStack: {
    gap: theme.spacing(0.8),
    [theme.breakpoints.down("sm")]: {
      gap: theme.spacing(0.6),
    },
  },
  button: {
    padding: theme.spacing(1.25, 2),
    textTransform: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    borderRadius: 10,
    transition: "all 0.3s ease",
    border: `2px solid ${theme.palette.divider}`,
    minHeight: 48,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1, 1.5),
      fontSize: "0.9rem",
      minHeight: 44,
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
          <Box display="flex" justifyContent="center" mb={2}>
            <img
              src={new URL("../../static/cioos-national_EN_FR.svg", import.meta.url).href}
              alt="CIOOS"
              className={classes.logo}
            />
          </Box>

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
