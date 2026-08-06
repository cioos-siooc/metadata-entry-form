import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AlertTitle,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

import { En, Fr, I18n } from "../../I18n";
import useFormStore from "../../../formEngine/useFormStore";
import { formTypeLabel } from "@shared/formEngine";

/**
 * Per-region activation — "each region will be able to activate or not the
 * different form types available".
 *
 * Region admins see every PUBLISHED form type in the global catalog and choose
 * which to switch on. The definitions themselves live in the shared catalog, so
 * a form type means the same thing in every region that enables it.
 *
 * A separate page rather than another section of Admin.jsx, which is already
 * ~1100 lines.
 */
export default function RegionFormTypes() {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const store = useFormStore();

  const [catalog, setCatalog] = useState(null);
  const [activations, setActivations] = useState({});
  const [versions, setVersions] = useState({});
  const [usage, setUsage] = useState({});
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [entries, current] = await Promise.all([
          store.listCatalog(),
          store.getRegionActivations(),
        ]);
        if (cancelled) return;

        const published = entries.filter((e) => e.version > 0);
        setCatalog(published);
        setActivations(current);

        // Version lists drive the "pin to version" selector.
        const versionLists = await Promise.all(
          published.map(async (entry) => [
            entry.id,
            await store.listVersions(entry.id),
          ])
        );
        if (cancelled) return;
        setVersions(Object.fromEntries(versionLists));

        const counts = await Promise.all(
          published.map(async (entry) => {
            const rows = await store.listSubmissions({ formTypeId: entry.id });
            return [entry.id, rows.length];
          })
        );
        if (!cancelled) setUsage(Object.fromEntries(counts));
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [store]);

  async function patch(formTypeId, changes) {
    setSavingId(formTypeId);
    setError(null);
    try {
      const saved = await store.setRegionActivation(formTypeId, {
        ...activations[formTypeId],
        ...changes,
      });
      setActivations((current) => ({ ...current, [formTypeId]: saved }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const enabledCount = useMemo(
    () => Object.values(activations).filter((a) => a.enabled).length,
    [activations]
  );

  if (error && !catalog) return <Alert severity="error">{error}</Alert>;
  if (!catalog) return <CircularProgress />;

  return (
    <div>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/${language}/${region}/admin`)}
        sx={{ mb: 2 }}
      >
        <I18n en="Admin" fr="Admin" />
      </Button>

      <Typography variant="h5">
        <I18n en="Forms for this region" fr="Formulaires pour cette région" />
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        <I18n>
          <En>
            Choose which of the available form types your region offers. Form
            definitions are managed centrally, so a form means the same thing in
            every region that enables it.
          </En>
          <Fr>
            Choisissez les types de formulaires que votre région propose. Les
            définitions sont gérées de façon centralisée, de sorte qu'un
            formulaire a la même signification dans toutes les régions qui
            l'activent.
          </Fr>
        </I18n>
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {catalog.length === 0 ? (
        <Alert severity="info">
          <AlertTitle>
            <I18n
              en="No published form types are available yet."
              fr="Aucun type de formulaire publié n'est encore disponible."
            />
          </AlertTitle>
          <I18n>
            <En>
              Form types are defined centrally, then published, and only then can
              a region enable them. To get started:
            </En>
            <Fr>
              Les types de formulaires sont définis de façon centralisée, puis
              publiés, et seulement ensuite une région peut les activer. Pour
              commencer :
            </Fr>
          </I18n>
          <ol style={{ marginTop: 8, marginBottom: 8, paddingLeft: 20 }}>
            <li>
              <I18n
                en="Open the global form catalog."
                fr="Ouvrez le catalogue global de formulaires."
              />
            </li>
            <li>
              <I18n
                en={'Choose "Load bundled form types" to create the eDNA field and lab sheets, or "New form type" to author your own.'}
                fr={"Choisissez « Charger les types fournis » pour créer les fiches ADNe de terrain et de laboratoire, ou « Nouveau type de formulaire » pour en rédiger un."}
              />
            </li>
            <li>
              <I18n
                en="Open each one and press Publish — a form type must be published before any region can offer it."
                fr="Ouvrez chacun et appuyez sur Publier — un type doit être publié avant qu'une région puisse le proposer."
              />
            </li>
            <li>
              <I18n
                en="Come back here and switch it on."
                fr="Revenez ici et activez-le."
              />
            </li>
          </ol>

          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => navigate(`/${language}/${region}/admin/form-catalog`)}
          >
            <I18n
              en="Open the form catalog"
              fr="Ouvrir le catalogue de formulaires"
            />
          </Button>
        </Alert>
      ) : (
        <>
          <Typography variant="caption" color="text.secondary">
            {enabledCount} / {catalog.length}{" "}
            <I18n en="enabled" fr="activé(s)" />
          </Typography>

          <Paper variant="outlined" sx={{ mt: 1, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <I18n en="Enabled" fr="Activé" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Form" fr="Formulaire" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Latest" fr="Dernière" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Serve version" fr="Version servie" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Order" fr="Ordre" />
                  </TableCell>
                  <TableCell>
                    <I18n en="Submissions" fr="Soumissions" />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalog.map((entry) => {
                  const activation = activations[entry.id] || {};
                  const enabled = Boolean(activation.enabled);
                  return (
                    <TableRow key={entry.id} hover selected={enabled}>
                      <TableCell>
                        <Switch
                          checked={enabled}
                          disabled={savingId === entry.id}
                          onChange={(event) =>
                            patch(entry.id, { enabled: event.target.checked })
                          }
                          inputProps={{
                            "aria-label": `${formTypeLabel(entry, language)} enabled`,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formTypeLabel(entry, language)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={`v${entry.version}`} />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <Select
                            value={activation.pinnedVersion ?? ""}
                            displayEmpty
                            disabled={!enabled || savingId === entry.id}
                            onChange={(event) =>
                              patch(entry.id, {
                                pinnedVersion:
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                          >
                            <MenuItem value="">
                              <I18n en="Always latest" fr="Toujours la dernière" />
                            </MenuItem>
                            {(versions[entry.id] || []).map((v) => (
                              <MenuItem key={v.version} value={v.version}>
                                {`v${v.version}`}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          sx={{ width: 80 }}
                          value={activation.sortOrder ?? 0}
                          disabled={!enabled || savingId === entry.id}
                          onChange={(event) =>
                            patch(entry.id, {
                              sortOrder: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>{usage[entry.id] ?? 0}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </div>
  );
}
