import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Snackbar,
} from "@mui/material";
import Alert from "@mui/material/Alert";
import { makeStyles } from "../../tss-cache";
import { En, Fr, I18n } from "../I18n";
import { signInWithGoogle, signInWithMicrosoft, signInWithOrcid } from "../../auth";
import { GoogleIcon, MicrosoftIcon, OrcidIcon } from "../Icons";

const useStyles = makeStyles()((theme) => ({
  root: {
    maxWidth: 600,
    margin: "0 auto",
    marginTop: theme.spacing(4),
  },
  button: {
    marginTop: theme.spacing(2),
    justifyContent: "center",
    padding: theme.spacing(1.5),
    textTransform: "none",
    fontSize: "1.1rem",
  },
  divider: {
    margin: theme.spacing(3, 0),
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
    <div className={classes.root}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            <I18n>
              <En>Welcome</En>
              <Fr>Bienvenue</Fr>
            </I18n>
          </Typography>

          <Typography
            variant="body1"
            color="textSecondary"
            align="center"
            paragraph
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

          <Grid container direction="column" spacing={1}>
            <Grid>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                className={classes.button}
                startIcon={<GoogleIcon />}
                onClick={() => handleLogin(signInWithGoogle)}
              >
                <I18n>
                  <En>Sign in with Google</En>
                  <Fr>Se connecter avec Google</Fr>
                </I18n>
              </Button>
            </Grid>
            {enableMicrosoft && (
            <Grid>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                className={classes.button}
                startIcon={<MicrosoftIcon />}
                onClick={() => handleLogin(signInWithMicrosoft)}
              >
                <I18n>
                  <En>Sign in with Microsoft</En>
                  <Fr>Se connecter avec Microsoft</Fr>
                </I18n>
              </Button>
            </Grid>
            )}
            {enableOrcid && (
            <Grid>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                className={classes.button}
                startIcon={<OrcidIcon />}
                onClick={() => handleLogin(signInWithOrcid)}
              >
                <I18n>
                  <En>Sign in with ORCID</En>
                  <Fr>Se connecter avec ORCID</Fr>
                </I18n>
              </Button>
            </Grid>
            )}
          </Grid>
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
    </div>
  );
};

export default Login;
