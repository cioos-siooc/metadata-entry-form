import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Close, OpenInNew } from "@mui/icons-material";
import { accountConsoleUrl } from "../auth/keycloak";
import { En, Fr, I18n } from "./I18n";

// Provider linking/unlinking is handled by Keycloak's Account Console;
// this dialog just points there.
const ConnectedAccountsDialog = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <I18n>
        <En>Connected accounts</En>
        <Fr>Comptes connectés</Fr>
      </I18n>
      <IconButton onClick={onClose} size="small">
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2">
        <I18n>
          <En>
            Sign-in providers (Google, Microsoft, ORCID) are linked to your
            account through the account console. Open it to add or remove
            sign-in methods.
          </En>
          <Fr>
            Les fournisseurs de connexion (Google, Microsoft, ORCID) sont liés
            à votre compte via la console de compte. Ouvrez-la pour ajouter ou
            supprimer des méthodes de connexion.
          </Fr>
        </I18n>
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button
        variant="contained"
        endIcon={<OpenInNew />}
        href={accountConsoleUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        <I18n>
          <En>Open account console</En>
          <Fr>Ouvrir la console de compte</Fr>
        </I18n>
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConnectedAccountsDialog;
