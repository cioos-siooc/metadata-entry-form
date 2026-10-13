import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { CloudDownload, Folder, Refresh } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { getDatabase, onValue, ref } from "firebase/database";
import FileSaver from "file-saver";

import firebase from "../../firebase";
import { auth } from "../../auth";
import { En, Fr, I18n } from "../I18n";
import { WAF_FORMATS, getWafSettings, wafFormatLabel } from "../../utils/waf";

const formatOrder = WAF_FORMATS.map((format) => format.key);

const recordTitle = (record, language) =>
  record.title?.[language] || record.title?.en || record.title?.fr || record.basename;

// records grouped by owner folder, root folder last
const groupByOwner = (records, filter, language) => {
  const groups = {};
  records
    .filter((record) =>
      `${record.basename} ${recordTitle(record, language)}`
        .toLowerCase()
        .includes(filter),
    )
    .forEach((record) => {
      (groups[record.owner] = groups[record.owner] || []).push(record);
    });
  return Object.entries(groups)
    .map(([owner, items]) => [
      owner,
      items.sort((a, b) => a.basename.localeCompare(b.basename)),
    ])
    .sort(([a], [b]) => (a === "") - (b === "") || a.localeCompare(b));
};

const authHeaders = async () => ({
  Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
});

// Files of the region WAF, for its admins and reviewers
const Waf = () => {
  const { region, language } = useParams();
  const [settings, setSettings] = useState(null);
  const [files, setFiles] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("published");
  const [filter, setFilter] = useState("");

  useEffect(
    () =>
      onValue(ref(getDatabase(firebase), `admin/${region}`), (snapshot) =>
        setSettings(getWafSettings(snapshot.val())),
      ),
    [region],
  );

  const wafURL = settings?.url;

  const loadFiles = useCallback(async () => {
    if (!wafURL) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${wafURL}${region}/?format=records`, {
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      setFiles(await response.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [wafURL, region]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const download = async (path) => {
    try {
      const response = await fetch(`${wafURL}${path}`, {
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      FileSaver.saveAs(await response.blob(), path.split("/").pop());
    } catch (e) {
      setError(e.message);
    }
  };

  const groups = useMemo(
    () => groupByOwner(files?.[tab] || [], filter.trim().toLowerCase(), language),
    [files, tab, filter, language],
  );

  const folderURL = (owner) =>
    `${wafURL}${tab === "unpublished" ? "unpublished/" : ""}${region}/${
      owner ? `${owner}/` : ""
    }`;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h5">
          <I18n en="Web Accessible Folder (WAF)" fr="Dossier accessible sur le Web (WAF)" />
        </Typography>
        <Typography>
          <I18n>
            <En>
              Files generated from the submitted and published records of this
              region, as harvested by the catalogues. Formats, folders and
              harvester tokens are set on the Admin page.
            </En>
            <Fr>
              Fichiers générés à partir des enregistrements soumis et publiés de
              cette région, tels que moissonnés par les catalogues. Les formats,
              dossiers et jetons de moissonnage se configurent dans la page
              Admin.
            </Fr>
          </I18n>
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          size="small"
          label={<I18n en="Filter by title or file name" fr="Filtrer par titre ou nom de fichier" />}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Button startIcon={<Refresh />} onClick={loadFiles} disabled={loading}>
          <I18n en="Refresh" fr="Actualiser" />
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          <I18n
            en="Could not reach the WAF:"
            fr="Impossible de joindre le WAF :"
          />{" "}
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, value) => setTab(value)}>
        <Tab
          value="published"
          label={
            <span>
              <I18n en="Published" fr="Publiés" /> ({files?.published.length ?? "…"})
            </span>
          }
        />
        <Tab
          value="unpublished"
          label={
            <span>
              <I18n en="Submitted" fr="Soumis" /> ({files?.unpublished.length ?? "…"})
            </span>
          }
        />
      </Tabs>

      {loading && !files && <CircularProgress />}
      {files && groups.length === 0 && (
        <Typography color="text.secondary">
          <I18n en="No files." fr="Aucun fichier." />
        </Typography>
      )}

      {groups.map(([owner, records]) => (
        <Paper key={owner} variant="outlined">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1.5 }}>
            <Folder color="action" />
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {owner || <I18n en="Region folder" fr="Dossier de la région" />} (
              {records.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
              {folderURL(owner)}
            </Typography>
          </Stack>
          <Divider />
          <List dense disablePadding>
            {records.map((record) => (
              <ListItem key={record.basename} divider>
                <ListItemText
                  primary={recordTitle(record, language)}
                  secondary={`${record.basename} · ${new Date(
                    record.modified * 1000,
                  ).toLocaleString()}`}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {Object.entries(record.files)
                    .sort(([a], [b]) => formatOrder.indexOf(a) - formatOrder.indexOf(b))
                    .map(([format, path]) => (
                      <Chip
                        key={format}
                        size="small"
                        icon={<CloudDownload />}
                        label={wafFormatLabel(format)}
                        onClick={() => download(path)}
                      />
                    ))}
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Stack>
  );
};

export default Waf;
