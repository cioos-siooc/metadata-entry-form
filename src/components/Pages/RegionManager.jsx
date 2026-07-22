import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Save } from "@mui/icons-material";
import { I18n, En, Fr } from "../I18n";
import { UserContext } from "../../providers/UserProvider";
import { useRegions } from "../../providers/RegionsProvider";
import {
  createRegion,
  updateRegion,
  getSuperadmins,
  saveSuperadmins,
} from "../../api/regions";
import NotFound from "./NotFound";
import { paperClass } from "../FormComponents/QuestionStyles";
import { unique } from "../../utils/misc";

const NEW_REGION = "__new__";

const emptyForm = {
  id: "",
  titleEn: "",
  titleFr: "",
  titleFrPossessive: "",
  catalogueTitleEn: "",
  catalogueTitleFr: "",
  colorPrimary: "#52a79b",
  colorSecondary: "#1976d2",
  email: "",
  catalogueURLEn: "",
  catalogueURLFr: "",
  introPageTextEn: "",
  introPageTextFr: "",
  logoEn: "",
  logoFr: "",
  showInRegionSelector: true,
  isRA: false,
};

function configToForm(id, config = {}) {
  return {
    id,
    titleEn: config.title?.en || "",
    titleFr: config.title?.fr || "",
    titleFrPossessive: config.titleFrPossessive || "",
    catalogueTitleEn: config.catalogueTitle?.en || "",
    catalogueTitleFr: config.catalogueTitle?.fr || "",
    colorPrimary: config.colors?.primary || "#52a79b",
    colorSecondary: config.colors?.secondary || "#1976d2",
    email: config.email || "",
    catalogueURLEn: config.catalogueURL?.en || "",
    catalogueURLFr: config.catalogueURL?.fr || "",
    introPageTextEn: config.introPageText?.en || "",
    introPageTextFr: config.introPageText?.fr || "",
    logoEn: config.logo?.en || "",
    logoFr: config.logo?.fr || "",
    showInRegionSelector: Boolean(config.showInRegionSelector),
    isRA: Boolean(config.isRA),
  };
}

function formToConfig(form) {
  return {
    title: { en: form.titleEn, fr: form.titleFr },
    ...(form.titleFrPossessive && { titleFrPossessive: form.titleFrPossessive }),
    catalogueTitle: { en: form.catalogueTitleEn, fr: form.catalogueTitleFr },
    colors: { primary: form.colorPrimary, secondary: form.colorSecondary },
    email: form.email,
    catalogueURL: { en: form.catalogueURLEn, fr: form.catalogueURLFr },
    introPageText: { en: form.introPageTextEn, fr: form.introPageTextFr },
    logo: { en: form.logoEn, fr: form.logoFr },
    showInRegionSelector: form.showInRegionSelector,
    isRA: form.isRA,
  };
}

const bilingualPair = (form, handleChange, baseName, labelEn, labelFr, extra = {}) => (
  <>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        name={`${baseName}En`}
        label={`${labelEn} (EN)`}
        value={form[`${baseName}En`]}
        onChange={handleChange}
        fullWidth
        {...extra}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        name={`${baseName}Fr`}
        label={`${labelFr} (FR)`}
        value={form[`${baseName}Fr`]}
        onChange={handleChange}
        fullWidth
        {...extra}
      />
    </Grid>
  </>
);

export default function RegionManager() {
  const { loggedIn, authIsLoading, isSuperadmin } = useContext(UserContext);
  const { regions } = useRegions();
  const navigate = useNavigate();
  const { language = "en" } = useParams();

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [superadmins, setSuperadmins] = useState([]);
  const [envSuperadmins, setEnvSuperadmins] = useState([]);
  const [status, setStatus] = useState(null); // {severity, message}
  const [saving, setSaving] = useState(false);
  // local copy so newly created regions show up without a full reload
  const [regionList, setRegionList] = useState(() => ({ ...regions }));

  useEffect(() => {
    if (loggedIn && isSuperadmin) {
      getSuperadmins()
        .then((data) => {
          setSuperadmins(data.superadmins || []);
          setEnvSuperadmins(data.envSuperadmins || []);
        })
        .catch((err) => setStatus({ severity: "error", message: err.message }));
    }
  }, [loggedIn, isSuperadmin]);

  if (authIsLoading) return <CircularProgress />;
  if (!loggedIn) {
    return (
      <Grid container direction="column" spacing={2} alignItems="center">
        <Grid>
          <Typography>
            <I18n en="Sign in to manage regions." fr="Connectez-vous pour gérer les régions." />
          </Typography>
        </Grid>
        <Grid>
          <Button
            variant="contained"
            onClick={() => navigate(`/${language}/region-select`)}
          >
            <I18n en="Sign in" fr="Se connecter" />
          </Button>
        </Grid>
      </Grid>
    );
  }
  if (!isSuperadmin) return <NotFound />;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const selectRegion = (id) => {
    setStatus(null);
    setSelected(id);
    setForm(id === NEW_REGION ? emptyForm : configToForm(id, regionList[id]));
  };

  const handleSaveRegion = async () => {
    const isNew = selected === NEW_REGION;
    const id = form.id.trim();
    if (isNew && !/^[a-z0-9-]+$/.test(id)) {
      setStatus({
        severity: "error",
        message: "Region id must contain only lowercase letters, digits, and hyphens.",
      });
      return;
    }
    setSaving(true);
    setStatus(null);
    const config = formToConfig(form);
    try {
      if (isNew) {
        await createRegion(id, config);
      } else {
        await updateRegion(selected, config);
      }
      setRegionList((prev) => ({
        ...prev,
        [isNew ? id : selected]: { ...prev[isNew ? id : selected], ...config },
      }));
      if (isNew) setSelected(id);
      setStatus({ severity: "success", message: `Region ${isNew ? id : selected} saved.` });
    } catch (err) {
      setStatus({ severity: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSuperadmins = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const cleaned = unique(superadmins.map((e) => e.trim()).filter(Boolean));
      await saveSuperadmins(cleaned);
      setSuperadmins(cleaned);
      setStatus({ severity: "success", message: "Superadmins saved." });
    } catch (err) {
      setStatus({ severity: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Grid container direction="column" spacing={3}>
      <Grid>
        <Typography variant="h5">
          <I18n>
            <En>Service administration</En>
            <Fr>Administration du service</Fr>
          </I18n>
        </Typography>
        <Typography variant="body2">
          <I18n>
            <En>Create and edit organizations/regions, and manage superadmins.</En>
            <Fr>Créez et modifiez des organisations/régions et gérez les superadministrateurs.</Fr>
          </I18n>
        </Typography>
      </Grid>

      {status && (
        <Grid>
          <Alert severity={status.severity} onClose={() => setStatus(null)}>
            {status.message}
          </Alert>
        </Grid>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper style={paperClass}>
            <Typography variant="h6">
              <I18n en="Regions" fr="Régions" />
            </Typography>
            <List dense>
              {Object.keys(regionList)
                .sort()
                .map((id) => (
                  <ListItemButton
                    key={id}
                    selected={selected === id}
                    onClick={() => selectRegion(id)}
                  >
                    <ListItemText
                      primary={regionList[id]?.title?.en || id}
                      secondary={id}
                    />
                  </ListItemButton>
                ))}
            </List>
            <Button startIcon={<Add />} onClick={() => selectRegion(NEW_REGION)}>
              <I18n en="New region" fr="Nouvelle région" />
            </Button>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {selected && (
            <Paper style={paperClass}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Typography variant="h6">
                    {selected === NEW_REGION ? (
                      <I18n en="New region" fr="Nouvelle région" />
                    ) : (
                      selected
                    )}
                  </Typography>
                </Grid>
                {selected === NEW_REGION && (
                  <Grid size={12}>
                    <TextField
                      name="id"
                      label="ID (URL key, e.g. pacific)"
                      value={form.id}
                      onChange={handleChange}
                      fullWidth
                    />
                  </Grid>
                )}
                {bilingualPair(form, handleChange, "title", "Title", "Titre")}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="titleFrPossessive"
                    label="Titre possessif (FR, e.g. du SIOOC Pacifique)"
                    value={form.titleFrPossessive}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="email"
                    label="Contact email"
                    value={form.email}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                {bilingualPair(form, handleChange, "catalogueTitle", "Catalogue title", "Titre du catalogue")}
                {bilingualPair(form, handleChange, "catalogueURL", "Catalogue URL", "URL du catalogue")}
                {bilingualPair(form, handleChange, "introPageText", "Intro text", "Texte d'introduction", {
                  multiline: true,
                })}
                {bilingualPair(form, handleChange, "logo", "Logo URL", "URL du logo")}
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    name="colorPrimary"
                    label="Primary color"
                    value={form.colorPrimary}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <TextField
                    name="colorSecondary"
                    label="Secondary color"
                    value={form.colorSecondary}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} container alignItems="center">
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="showInRegionSelector"
                        checked={form.showInRegionSelector}
                        onChange={handleChange}
                      />
                    }
                    label={<I18n en="Show in region selector" fr="Afficher dans le sélecteur" />}
                  />
                  <FormControlLabel
                    control={<Checkbox name="isRA" checked={form.isRA} onChange={handleChange} />}
                    label={<I18n en="Regional Association" fr="Association régionale" />}
                  />
                </Grid>
                <Grid size={12}>
                  <Button
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    variant="contained"
                    disabled={saving || (selected === NEW_REGION && !form.id.trim())}
                    onClick={handleSaveRegion}
                  >
                    <I18n en="Save region" fr="Enregistrer la région" />
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Grid>
        <Paper style={paperClass}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="h6">
                <I18n en="Superadmins" fr="Superadministrateurs" />
              </Typography>
              <Typography variant="body2">
                <I18n
                  en="One email address per line. Superadmins are admins of all regions."
                  fr="Une adresse e-mail par ligne. Les superadministrateurs sont administrateurs de toutes les régions."
                />
              </Typography>
              {envSuperadmins.length > 0 && (
                <Typography variant="caption" color="textSecondary">
                  <I18n
                    en={`Configured via environment (not editable here): ${envSuperadmins.join(", ")}`}
                    fr={`Configurés via l'environnement (non modifiables ici) : ${envSuperadmins.join(", ")}`}
                  />
                </Typography>
              )}
            </Grid>
            <Grid size={12}>
              <TextField
                multiline
                fullWidth
                minRows={2}
                value={superadmins.join("\n")}
                onChange={(e) => setSuperadmins(e.target.value.split("\n"))}
              />
            </Grid>
            <Grid size={12}>
              <Button
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                variant="contained"
                disabled={saving}
                onClick={handleSaveSuperadmins}
              >
                <I18n en="Save superadmins" fr="Enregistrer les superadministrateurs" />
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
}
