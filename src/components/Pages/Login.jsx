import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Snackbar,
  Box,
  TextField,
  Divider,
  Link,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import { makeStyles } from "../../tss-cache";
import { En, Fr, I18n } from "../I18n";
import {
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithOrcid,
  signInWithPassword,
  register,
} from "../../auth/session";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "../Icons";
import regions from "../../regions";

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
    paddingTop: theme.spacing(3),
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
  supportText: {
    fontSize: "0.85rem",
    color: theme.palette.text.secondary,
    lineHeight: 1.5,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.75rem",
    },
  },
  supportEmail: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: 500,
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

const enableMicrosoft = import.meta.env.VITE_AUTH_MICROSOFT !== "false";
const enableOrcid = import.meta.env.VITE_AUTH_ORCID !== "false";
// Local email+password accounts (self-hosted deployments without OAuth
// providers, and the seeded dev users). Toggles the email/password form.
const enableLocal = import.meta.env.VITE_AUTH_LOCAL === "true";

const Login = () => {
  const { classes } = useStyles();
  const { region } = useParams();
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [mode, setMode] = useState("signin"); // "signin" | "register"
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [submitting, setSubmitting] = useState(false);
  const regionEmail = regions[region]?.email;

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

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

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register({ email: form.email, password: form.password, name: form.name });
        setInfo("Account created — check your email for a verification link.");
        setMode("signin");
      } else {
        await signInWithPassword({ email: form.email, password: form.password });
        // Reload so UserProvider re-initialises with the new session.
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography
            variant="h4"
            component="h1"
            className={classes.title}
            align="center"
          >
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
              <En>Please sign in to access your metadata records.</En>
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

          {enableLocal && (
            <Box component="form" onSubmit={handleLocalSubmit} sx={{ marginTop: 2 }}>
              <Divider sx={{ marginBottom: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  <I18n>
                    <En>or use an email address</En>
                    <Fr>ou utilisez une adresse courriel</Fr>
                  </I18n>
                </Typography>
              </Divider>
              <Stack spacing={1.5}>
                {mode === "register" && (
                  <TextField
                    label={<I18n><En>Name</En><Fr>Nom</Fr></I18n>}
                    value={form.name}
                    onChange={setField("name")}
                    size="small"
                    fullWidth
                  />
                )}
                <TextField
                  type="email"
                  label={<I18n><En>Email</En><Fr>Courriel</Fr></I18n>}
                  value={form.email}
                  onChange={setField("email")}
                  size="small"
                  required
                  fullWidth
                />
                <TextField
                  type="password"
                  label={<I18n><En>Password</En><Fr>Mot de passe</Fr></I18n>}
                  value={form.password}
                  onChange={setField("password")}
                  size="small"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  className={classes.button}
                >
                  {mode === "register" ? (
                    <I18n><En>Create account</En><Fr>Créer un compte</Fr></I18n>
                  ) : (
                    <I18n><En>Sign in</En><Fr>Se connecter</Fr></I18n>
                  )}
                </Button>
                <Box sx={{ textAlign: "center" }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => {
                      setMode(mode === "register" ? "signin" : "register");
                      setError(null);
                    }}
                  >
                    {mode === "register" ? (
                      <I18n>
                        <En>Already have an account? Sign in</En>
                        <Fr>Vous avez déjà un compte ? Se connecter</Fr>
                      </I18n>
                    ) : (
                      <I18n>
                        <En>Need an account? Register</En>
                        <Fr>Besoin d&apos;un compte ? S&apos;inscrire</Fr>
                      </I18n>
                    )}
                  </Link>
                </Box>
              </Stack>
            </Box>
          )}

          {regionEmail && (
            <Box sx={{ marginTop: 2, textAlign: "center" }}>
              <Typography className={classes.supportText}>
                <I18n>
                  <En>For any issues, contact </En>
                  <Fr>En cas de problème, contactez </Fr>
                </I18n>
                <a
                  href={`mailto:${regionEmail}`}
                  className={classes.supportEmail}
                >
                  {regionEmail}
                </a>
              </Typography>
            </Box>
          )}

          <Box className={classes.footer}>
            <img
              src={
                new URL(
                  "../../static/cioos-national_EN_FR_min.svg",
                  import.meta.url,
                ).href
              }
              alt="CIOOS"
              className={classes.footerLogo}
            />
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

      <Snackbar
        open={!!info}
        autoHideDuration={8000}
        onClose={() => setInfo(null)}
      >
        <Alert onClose={() => setInfo(null)} severity="success">
          {info}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
