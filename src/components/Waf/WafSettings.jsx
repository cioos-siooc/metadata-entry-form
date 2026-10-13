import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, ContentCopy, Delete, Save } from "@mui/icons-material";
import {
  getDatabase,
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  update,
} from "firebase/database";

import firebase from "../../firebase";
import { UserContext } from "../../providers/UserProvider";
import { En, Fr, I18n } from "../I18n";
import CheckBoxList from "../FormComponents/CheckBoxList";
import { paperClass } from "../FormComponents/QuestionStyles";
import {
  DEFAULT_WAF_URL,
  WAF_FORMATS,
  generateWafToken,
  getWafSettings,
  harvestURL,
  hashWafToken,
  isTrustedWafURL,
} from "../../utils/waf";

const CopyField = ({ label, value }) => (
  <TextField
    label={label}
    value={value}
    fullWidth
    margin="dense"
    slotProps={{
      input: {
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={<I18n en="Copy" fr="Copier" />}>
              <IconButton onClick={() => navigator.clipboard.writeText(value)}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      },
    }}
  />
);

// Admin page section: formats and folders of the region WAF, and the tokens
// harvesters use to read it. Only the sha256 of a token is stored.
const WafSettings = ({ region }) => {
  const { isAdmin, user } = useContext(UserContext);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(null);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState(null);
  const [revokeId, setRevokeId] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(
    () =>
      onValue(
        ref(getDatabase(firebase), `admin/${region}/waf`),
        (snapshot) => setSettings(getWafSettings(snapshot.val())),
        // without the saved settings, the form must not offer to overwrite them
        (error) => {
          setSettings(null);
          setStatus({ severity: "error", message: error.message });
        },
      ),
    [region],
  );

  // edited values, reset to the saved ones whenever they change (by content,
  // a token change must not discard unsaved edits)
  const saved =
    settings &&
    JSON.stringify({
      formats: settings.formats,
      splitByOwner: settings.splitByOwner,
      url: settings.url,
    });
  useEffect(() => setForm(saved && JSON.parse(saved)), [saved]);

  const regionRef = () => ref(getDatabase(firebase), `admin/${region}`);

  const handleSave = async () => {
    const url = form.url.trim() || DEFAULT_WAF_URL;
    if (!isTrustedWafURL(url)) {
      setStatus({
        severity: "error",
        message: `The WAF URL must be on ${new URL(DEFAULT_WAF_URL).host}, this site or localhost`,
      });
      return;
    }
    try {
      await update(regionRef(), {
        "waf/formats": form.formats,
        "waf/splitByOwner": form.splitByOwner,
        "waf/url": url,
      });
      setStatus({ severity: "success", message: "saved" });
    } catch (error) {
      setStatus({ severity: "error", message: error.message });
    }
  };

  const handleCreateToken = async () => {
    const token = generateWafToken();
    try {
      await push(ref(getDatabase(firebase), `admin/${region}/waf/tokens`), {
        name: tokenName.trim(),
        hash: await hashWafToken(token),
        createdAt: serverTimestamp(),
        createdBy: user?.email || "",
      });
      setNewToken(token);
      setTokenName("");
    } catch (error) {
      setStatus({ severity: "error", message: error.message });
    }
  };

  const handleRevoke = async () => {
    try {
      await remove(
        ref(getDatabase(firebase), `admin/${region}/waf/tokens/${revokeId}`),
      );
    } catch (error) {
      setStatus({ severity: "error", message: error.message });
    }
    setRevokeId(null);
  };

  if (!form) {
    return status?.severity === "error" ? (
      <Alert severity="error">
        <I18n
          en="Could not load the WAF settings:"
          fr="Impossible de charger les paramètres du WAF :"
        />{" "}
        {status.message}
      </Alert>
    ) : null;
  }

  const tokens = Object.entries(settings.tokens).sort(
    ([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0),
  );

  return (
    <Paper style={paperClass}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography variant="h5">
            <I18n
              en="Web Accessible Folder (WAF)"
              fr="Dossier accessible sur le Web (WAF)"
            />
          </Typography>
          <Typography variant="body2" style={{ marginTop: "10px" }}>
            <I18n>
              <En>
                Submitted and published records are served as files in a WAF,
                generated from the records when requested, where catalogues
                harvest them. Each region folder requires a token created
                below, or a login as admin or reviewer of this region.
              </En>
              <Fr>
                Les enregistrements soumis et publiés sont offerts sous forme
                de fichiers dans un WAF, générés à partir des enregistrements
                lors de la demande, où les catalogues les moissonnent. Chaque
                dossier régional exige un jeton créé ci-dessous, ou une
                connexion en tant qu'administrateur ou réviseur de cette
                région.
              </Fr>
            </I18n>
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography variant="subtitle1">
            <I18n en="File formats" fr="Formats de fichiers" />
          </Typography>
          <CheckBoxList
            name="wafFormats"
            options={WAF_FORMATS.map((format) => format.key)}
            optionLabels={WAF_FORMATS.map((format) => format.label)}
            value={form.formats}
            onChange={(formats) => setForm({ ...form, formats })}
            disabled={!isAdmin}
            labelSize={{ xs: 12, sm: 6, md: 4 }}
          />
        </Grid>
        <Grid size={12}>
          <FormControlLabel
            disabled={!isAdmin}
            control={
              <Switch
                checked={form.splitByOwner}
                onChange={(e) =>
                  setForm({ ...form, splitByOwner: e.target.checked })
                }
              />
            }
            label={
              <I18n
                en="Group records in a folder per owner organization"
                fr="Regrouper les enregistrements dans un dossier par organisation propriétaire"
              />
            }
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label={<I18n en="WAF URL" fr="URL du WAF" />}
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            disabled={!isAdmin}
            fullWidth
            helperText={`Default: ${DEFAULT_WAF_URL}`}
          />
        </Grid>
        <Grid size={12}>
          <Button
            startIcon={<Save />}
            variant="contained"
            onClick={handleSave}
            disabled={!isAdmin || form.formats.length === 0}
          >
            <I18n en="Save WAF settings" fr="Enregistrer les paramètres du WAF" />
          </Button>
          <Typography variant="body2" color="text.secondary" style={{ marginTop: 8 }}>
            <I18n
              en="Changes, including record edits, are visible in the WAF within a minute."
              fr="Les changements, y compris les modifications d'enregistrements, sont visibles dans le WAF en moins d'une minute."
            />
          </Typography>
        </Grid>
        {status && (
          <Grid size={12}>
            <Alert severity={status.severity} onClose={() => setStatus(null)}>
              {status.severity === "success" ? (
                <I18n en="WAF settings saved" fr="Paramètres du WAF enregistrés" />
              ) : (
                status.message
              )}
            </Alert>
          </Grid>
        )}

        <Grid size={12}>
          <Typography variant="subtitle1">
            <I18n en="Harvester tokens" fr="Jetons de moissonnage" />
          </Typography>
          <CopyField
            label={<I18n en="Harvest URL" fr="URL de moissonnage" />}
            value={harvestURL(settings.url, region)}
          />
          {tokens.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <I18n en="Name" fr="Nom" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Created" fr="Créé" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Created by" fr="Créé par" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map(([id, token]) => (
                  <TableRow key={id}>
                    <TableCell>{token.name}</TableCell>
                    <TableCell>
                      {token.createdAt
                        ? new Date(token.createdAt).toLocaleDateString()
                        : ""}
                    </TableCell>
                    <TableCell>{token.createdBy}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={<I18n en="Revoke" fr="Révoquer" />}>
                        <span>
                          <IconButton
                            disabled={!isAdmin}
                            onClick={() => setRevokeId(id)}
                            aria-label="revoke token"
                          >
                            <Delete />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary">
              <I18n
                en="No token yet: the WAF folders of this region cannot be harvested."
                fr="Aucun jeton : les dossiers WAF de cette région ne peuvent pas être moissonnés."
              />
            </Typography>
          )}
        </Grid>
        {isAdmin && (
          <Grid size={12} container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label={<I18n en="Token name (e.g. catalogue harvester)" fr="Nom du jeton (ex. moissonneur du catalogue)" />}
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid>
              <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={handleCreateToken}
                disabled={!tokenName.trim()}
              >
                <I18n en="Create token" fr="Créer un jeton" />
              </Button>
            </Grid>
          </Grid>
        )}
      </Grid>

      <Dialog open={Boolean(newToken)} maxWidth="md" fullWidth>
        <DialogTitle>
          <I18n en="Token created" fr="Jeton créé" />
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <I18n>
              <En>
                Copy it now, it will not be shown again. Use it as the password
                of the harvest URL, or as an &quot;Authorization: Bearer&quot;
                header.
              </En>
              <Fr>
                Copiez-le maintenant, il ne sera plus affiché. Utilisez-le comme
                mot de passe de l&apos;URL de moissonnage, ou dans un en-tête
                &quot;Authorization: Bearer&quot;.
              </Fr>
            </I18n>
          </DialogContentText>
          {newToken && (
            <>
              <CopyField label={<I18n en="Token" fr="Jeton" />} value={newToken} />
              <CopyField
                label={<I18n en="Harvest URL" fr="URL de moissonnage" />}
                value={harvestURL(settings.url, region, newToken)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewToken(null)}>
            <I18n en="Done" fr="Terminé" />
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(revokeId)} onClose={() => setRevokeId(null)}>
        <DialogTitle>
          <I18n en="Revoke token?" fr="Révoquer le jeton?" />
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <I18n
              en="Harvesters using it lose access to the WAF within a minute."
              fr="Les moissonneurs qui l'utilisent perdent l'accès au WAF d'ici une minute."
            />
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevokeId(null)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
          <Button color="error" onClick={handleRevoke}>
            <I18n en="Revoke" fr="Révoquer" />
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WafSettings;
