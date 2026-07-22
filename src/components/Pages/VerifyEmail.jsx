import { useEffect, useState } from "react";
import { useSearchParams, Link as RouterLink } from "react-router-dom";
import { Box, Card, CardContent, Typography, CircularProgress, Button } from "@mui/material";
import { verifyEmail } from "../../auth/session";
import { En, Fr, I18n } from "../I18n";

// Landing page for the verification link emailed on registration.
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("pending"); // pending | ok | error

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail(token)
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 8, px: 2 }}>
      <Card sx={{ maxWidth: 450, width: "100%" }}>
        <CardContent sx={{ textAlign: "center" }}>
          {status === "pending" && <CircularProgress />}
          {status === "ok" && (
            <>
              <Typography variant="h6" gutterBottom>
                <I18n>
                  <En>Email verified</En>
                  <Fr>Courriel vérifié</Fr>
                </I18n>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <I18n>
                  <En>Your email is confirmed. You can now sign in.</En>
                  <Fr>Votre courriel est confirmé. Vous pouvez maintenant vous connecter.</Fr>
                </I18n>
              </Typography>
              <Button component={RouterLink} to="/en/region-select" variant="contained">
                <I18n>
                  <En>Continue</En>
                  <Fr>Continuer</Fr>
                </I18n>
              </Button>
            </>
          )}
          {status === "error" && (
            <Typography variant="body2" color="error">
              <I18n>
                <En>This verification link is invalid or has expired.</En>
                <Fr>Ce lien de vérification est invalide ou a expiré.</Fr>
              </I18n>
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyEmail;
