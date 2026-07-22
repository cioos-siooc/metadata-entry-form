import { useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { resetPassword } from "../../auth/session";
import { En, Fr, I18n } from "../I18n";

// Landing page for the password-reset link emailed on request.
const ResetPassword = () => {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("form"); // form | done | error
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = params.get("token");
    try {
      await resetPassword({ token, newPassword: password });
      setStatus("done");
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8, px: 2 }}>
      <Card sx={{ maxWidth: 450, width: "100%" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            <I18n>
              <En>Set a new password</En>
              <Fr>Définir un nouveau mot de passe</Fr>
            </I18n>
          </Typography>

          {status === "done" ? (
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2">
                <I18n>
                  <En>Your password has been reset. You can now sign in.</En>
                  <Fr>Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.</Fr>
                </I18n>
              </Typography>
              <Button component={RouterLink} to="/en/region-select" variant="contained">
                <I18n>
                  <En>Continue</En>
                  <Fr>Continuer</Fr>
                </I18n>
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {status === "error" && message && <Alert severity="error">{message}</Alert>}
                <TextField
                  type="password"
                  label={<I18n><En>New password</En><Fr>Nouveau mot de passe</Fr></I18n>}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" fullWidth>
                  <I18n>
                    <En>Reset password</En>
                    <Fr>Réinitialiser</Fr>
                  </I18n>
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPassword;
