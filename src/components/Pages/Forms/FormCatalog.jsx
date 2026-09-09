import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Archive,
  AutoAwesome,
  Delete,
  Edit,
  UploadFile,
} from "@mui/icons-material";

import { En, Fr, I18n } from "../../I18n";
import useFormStore from "../../../formEngine/useFormStore";
import { seedFormCatalog } from "../../../formEngine/catalog";
import { formTypeLabel } from "@shared/formEngine";

/**
 * The global form type catalog — "the different forms would be managed at the
 * top level".
 *
 * Any region administrator may manage it. Form types are defined once here;
 * regions then activate the ones they want under Admin → Forms. Keeping
 * definitions global is what makes a form comparable across regions, which
 * matters for anything that aggregates submissions — and is why editing one is a
 * shared responsibility rather than a per-region setting.
 */
export default function FormCatalog() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    store
      .listCatalog({ includeDeprecated: true })
      .then((entries) => !cancelled && setCatalog(entries))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [store, reloadToken]);

  /**
   * Creates the form types bundled with the repo (currently the eDNA field and
   * lab sheets). Skips any slug that already exists, and does not publish or
   * enable them — both stay deliberate acts.
   */
  async function handleSeed() {
    setError(null);
    try {
      const { created, skipped } = await seedFormCatalog(store);
      setStatus({
        severity: created.length ? "success" : "info",
        message:
          language === "fr"
            ? `${created.length} créé(s), ${skipped.length} déjà présent(s). Publiez-les pour les rendre disponibles aux régions.`
            : `Created ${created.length}, skipped ${skipped.length} already present. Publish them to make them available to regions.`,
      });
      setReloadToken((n) => n + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirm() {
    const { entry, mode } = confirm;
    setBusy(true);
    setError(null);
    try {
      if (mode === "delete") {
        await store.deleteCatalogFormType(entry.id);
      } else {
        await store.deprecateCatalogFormType(entry.id);
      }
      setStatus({
        severity: "success",
        message:
          mode === "delete"
            ? language === "fr"
              ? "Type de formulaire supprimé."
              : "Form type deleted."
            : language === "fr"
              ? "Type de formulaire retiré."
              : "Form type retired.",
      });
      setConfirm(null);
      setReloadToken((n) => n + 1);
    } catch (err) {
      // The store refuses a delete when submissions exist, and says why.
      setError(err.message);
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      // Import creates working copies only. Publishing stays a deliberate,
      // separate action so a file drop cannot go live by itself.
      await Promise.all(
        entries.map((entry) =>
          store.saveCatalogFormType({ ...entry, id: undefined, version: 0 })
        )
      );
      setStatus({
        severity: "success",
        message:
          language === "fr"
            ? `${entries.length} type(s) importé(s) comme brouillon.`
            : `Imported ${entries.length} form type(s) as drafts.`,
      });
      setReloadToken((n) => n + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      // Allow re-selecting the same file.
      event.target.value = "";
    }
  }

  if (error && !catalog) return <Alert severity="error">{error}</Alert>;
  if (!catalog) return <CircularProgress />;

  const base = `/${language}/${region}/admin/form-catalog`;

  return (
    <div>
      <Typography variant="h5">
        <I18n en="Form catalog" fr="Catalogue de formulaires" />
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <I18n>
          <En>
            Form types are defined once here and made available to every region.
            Each region then chooses which to enable.
          </En>
          <Fr>
            Les types de formulaires sont définis une seule fois ici et rendus
            disponibles à toutes les régions. Chaque région choisit ensuite ceux
            qu'elle active.
          </Fr>
        </I18n>
      </Typography>

      {status && (
        <Alert
          severity={status.severity}
          sx={{ mb: 2 }}
          onClose={() => setStatus(null)}
        >
          {status.message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid>
          <Button startIcon={<Add />} onClick={() => navigate(`${base}/new`)}>
            <I18n en="New form type" fr="Nouveau type de formulaire" />
          </Button>
        </Grid>
        <Grid>
          <Button component="label" startIcon={<UploadFile />}>
            <I18n en="Import JSON" fr="Importer du JSON" />
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleImport}
            />
          </Button>
        </Grid>
        <Grid>
          <Button startIcon={<AutoAwesome />} onClick={handleSeed}>
            <I18n
              en="Load bundled form types"
              fr="Charger les types fournis"
            />
          </Button>
        </Grid>
      </Grid>

      {catalog.length === 0 ? (
        <Alert severity="info">
          <I18n
            en="No form types yet. Create one, or import a definition."
            fr="Aucun type de formulaire. Créez-en un ou importez une définition."
          />
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <I18n en="Form" fr="Formulaire" />
                </TableCell>
                <TableCell>
                  <I18n en="Slug" fr="Identifiant" />
                </TableCell>
                <TableCell>
                  <I18n en="Status" fr="Statut" />
                </TableCell>
                <TableCell>
                  <I18n en="Version" fr="Version" />
                </TableCell>
                <TableCell>
                  <I18n en="Fields" fr="Champs" />
                </TableCell>
                <TableCell align="right">
                  <I18n en="Actions" fr="Actions" />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalog.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{formTypeLabel(entry, language)}</TableCell>
                  <TableCell>
                    <Typography variant="caption">{entry.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={
                        entry.status === "published"
                          ? "success"
                          : entry.status === "deprecated"
                            ? "warning"
                            : "default"
                      }
                      label={entry.status}
                    />
                  </TableCell>
                  <TableCell>
                    {entry.version > 0 ? `v${entry.version}` : "—"}
                  </TableCell>
                  <TableCell>
                    {Object.keys(entry.jsonSchema?.properties || {}).length}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={<I18n en="Edit" fr="Modifier" />}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`${base}/${entry.id}`)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {entry.status !== "deprecated" && (
                      <Tooltip
                        title={
                          <I18n
                            en="Retire — hides it from regions, keeps existing submissions readable"
                            fr="Retirer — le masque aux régions, les soumissions restent lisibles"
                          />
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => setConfirm({ entry, mode: "deprecate" })}
                        >
                          <Archive fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
                      <IconButton
                        size="small"
                        onClick={() => setConfirm({ entry, mode: "delete" })}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        <DialogTitle>
          {confirm?.mode === "delete" ? (
            <I18n en="Delete this form type?" fr="Supprimer ce type de formulaire ?" />
          ) : (
            <I18n en="Retire this form type?" fr="Retirer ce type de formulaire ?" />
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            <strong>{confirm ? formTypeLabel(confirm.entry, language) : ""}</strong>
          </Typography>
          <Typography variant="body2">
            {confirm?.mode === "delete" ? (
              <I18n>
                <En>
                  Removes it permanently. This is refused if any region has
                  submissions for it — retire it instead, which keeps those
                  submissions readable.
                </En>
                <Fr>
                  Le supprime définitivement. Refusé si une région a des
                  soumissions — retirez-le plutôt, ce qui garde les soumissions
                  lisibles.
                </Fr>
              </I18n>
            ) : (
              <I18n>
                <En>
                  Hides it from every region&apos;s list of available forms.
                  Existing submissions stay readable and existing drafts keep
                  working — this is the safe way to take a form out of service.
                </En>
                <Fr>
                  Le masque dans la liste des formulaires de chaque région. Les
                  soumissions existantes restent lisibles et les brouillons
                  continuent de fonctionner.
                </Fr>
              </I18n>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>
            <I18n en="Cancel" fr="Annuler" />
          </Button>
          <Button
            variant="contained"
            color={confirm?.mode === "delete" ? "error" : "warning"}
            disabled={busy}
            onClick={handleConfirm}
          >
            {confirm?.mode === "delete" ? (
              <I18n en="Delete" fr="Supprimer" />
            ) : (
              <I18n en="Retire" fr="Retirer" />
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
