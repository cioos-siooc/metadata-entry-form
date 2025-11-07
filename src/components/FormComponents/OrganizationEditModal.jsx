import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  Chip,
  Paper,
} from "@material-ui/core";
import { Add, Delete, Search } from "@material-ui/icons";
import { I18n, En, Fr } from "../I18n";
import BilingualTextInput from "./BilingualTextInput";

const OrganizationEditModal = ({
  open,
  organization,
  isCreatingNew,
  onClose,
  onSave,
  onDelete,
  language,
}) => {
  const [editedOrg, setEditedOrg] = useState({ ...organization });
  const [newAlias, setNewAlias] = useState("");

  // Reusable heading style to improve form readability
  const headingStyle = {
    fontWeight: 600,
    color: '#1976d2',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const headingDecoration = <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1976d2' }} />;

  // Update state when organization prop changes
  useEffect(() => {
    if (organization) {
      setEditedOrg({ ...organization });
    }
  }, [organization]);

  const handleFieldChange = (field) => (event) => {
    setEditedOrg({
      ...editedOrg,
      [field]: event.target.value,
    });
  };

  // Adapter for BilingualTextInput's onChange synthetic event { target: { name, value } }
  const handleBilingualFieldChange = (field) => (event) => {
    const { value } = event.target;
    setEditedOrg({
      ...editedOrg,
      [field]: value,
    });
  };

  const handleUriFieldChange = (index, field) => (event) => {
    const newUri = [...(editedOrg["organization-uri"] || [])];
    if (!newUri[index]) {
      newUri[index] = { authority: "", code: "", "code-space": "", version: "" };
    }
    newUri[index][field] = event.target.value;
    setEditedOrg({
      ...editedOrg,
      "organization-uri": newUri,
    });
  };

  const handleAddAlias = () => {
    if (newAlias.trim()) {
      const aliases = [...(editedOrg.aliases || []), newAlias.trim()];
      setEditedOrg({ ...editedOrg, aliases });
      setNewAlias("");
    }
  };

  const handleRemoveAlias = (index) => {
    const aliases = [...(editedOrg.aliases || [])];
    aliases.splice(index, 1);
    setEditedOrg({ ...editedOrg, aliases });
  };

  const handleSave = () => {
    // Validate required fields
    if (!editedOrg.name || !editedOrg.title_translated?.en) {
      // eslint-disable-next-line no-alert
      alert(language === "en"
        ? "Please fill in the required fields: Name and English Title"
        : "Veuillez remplir les champs obligatoires : Nom et Titre anglais");
      return;
    }
    onSave(editedOrg);
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(
      language === "en"
        ? "Are you sure you want to delete this organization?"
        : "Êtes-vous sûr de vouloir supprimer cette organisation ?"
    )) {
      onDelete(editedOrg.name);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <I18n>
          <En>{isCreatingNew ? "Add Organization" : "Edit Organization"}</En>
          <Fr>{isCreatingNew ? "Ajouter une Organisation" : "Modifier l'Organisation"}</Fr>
        </I18n>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label={<I18n en="Name (identifier)" fr="Nom (identifiant)" />}
              value={editedOrg.name || ""}
              onChange={handleFieldChange("name")}
              disabled={!isCreatingNew}
              helperText={
                <I18n
                  en="Unique identifier (lowercase, no spaces)"
                  fr="Identifiant unique (minuscules, sans espaces)"
                />
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom style={headingStyle}>
              {headingDecoration}
              <I18n en="Title *" fr="Titre *" />
            </Typography>
            <BilingualTextInput
              name="title_translated"
              value={editedOrg.title_translated || { en: "", fr: "" }}
              onChange={handleBilingualFieldChange("title_translated")}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom style={headingStyle}>
              {headingDecoration}
              <I18n en="Description" fr="Description" />
            </Typography>
            <BilingualTextInput
              name="description_translated"
              value={editedOrg.description_translated || { en: "", fr: "" }}
              onChange={handleBilingualFieldChange("description_translated")}
              multiline
              rows={4}
            />
          </Grid>

          {/* Subtitle for contact/location section (now includes website) */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ ...headingStyle, marginTop: 8 }}>
              {headingDecoration}
              <I18n en="Organization Contact & Location" fr="Contact et localisation de l'organisation" />
            </Typography>
          </Grid>

          {/* Optional contact/location + website fields */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={<I18n en="External Website URL" fr="URL du site web externe" />}
              value={editedOrg.external_home_url || ""}
              onChange={handleFieldChange("external_home_url")}
              helperText={<I18n en="Organization's website" fr="Site web de l'organisation" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={<I18n en="Email" fr="Courriel" />}
              value={editedOrg.email || ""}
              onChange={handleFieldChange("email")}
              type="email"
              helperText={<I18n en="Optional contact email" fr="Courriel de contact facultatif" />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={<I18n en="Address" fr="Adresse" />}
              value={editedOrg.address || ""}
              onChange={handleFieldChange("address")}
              helperText={<I18n en="Street or mailing address" fr="Adresse postale ou rue" />}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label={<I18n en="City" fr="Ville" />}
              value={editedOrg.city || ""}
              onChange={handleFieldChange("city")}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label={<I18n en="Country" fr="Pays" />}
              value={editedOrg.country || ""}
              onChange={handleFieldChange("country")}
            />
          </Grid>

          {/* CKAN instance removed per request */}

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom style={headingStyle}>
              {headingDecoration}
              <I18n en="Image URL" fr="URL de l'image" />
            </Typography>
            <BilingualTextInput
              name="image_url_translated"
              value={editedOrg.image_url_translated || { en: editedOrg.image_url || "", fr: editedOrg.image_url || "" }}
              onChange={(e) => {
                const updated = e.target.value;
                // Sync english URL to legacy single image_url for backward compatibility
                setEditedOrg({
                  ...editedOrg,
                  image_url_translated: updated,
                  image_url: updated.en || editedOrg.image_url || "",
                });
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Paper style={{ padding: "15px", backgroundColor: "#f5f5f5" }}>
              <Typography variant="subtitle2" gutterBottom style={headingStyle}>
                {headingDecoration}
                <I18n en="Organization URI (ROR, etc.)" fr="URI de l'organisation (ROR, etc.)" />
              </Typography>
              <Box display="flex" justifyContent="flex-end" marginBottom={1}>
                <Button
                  size="small"
                  startIcon={<Search />}
                  variant="outlined"
                  onClick={() => {
                    const query =
                      editedOrg.title_translated?.en ||
                      editedOrg.title_translated?.fr ||
                      editedOrg.title ||
                      editedOrg.name || "";
                    const url = `https://ror.org/search?query=${encodeURIComponent(query)}`;
                    window.open(url, "_blank");
                  }}
                >
                  <I18n en="Search ROR" fr="Chercher ROR" />
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={<I18n en="Authority" fr="Autorité" />}
                    value={editedOrg["organization-uri"]?.[0]?.authority || ""}
                    onChange={handleUriFieldChange(0, "authority")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={<I18n en="Code (URL)" fr="Code (URL)" />}
                    value={editedOrg["organization-uri"]?.[0]?.code || ""}
                    onChange={handleUriFieldChange(0, "code")}
                    helperText={<I18n en="e.g., https://ror.org/..." fr="ex: https://ror.org/..." />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={<I18n en="Code Space" fr="Espace de code" />}
                    value={editedOrg["organization-uri"]?.[0]?.["code-space"] || ""}
                    onChange={handleUriFieldChange(0, "code-space")}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={<I18n en="Version" fr="Version" />}
                    value={editedOrg["organization-uri"]?.[0]?.version || ""}
                    onChange={handleUriFieldChange(0, "version")}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom style={headingStyle}>
              {headingDecoration}
              <I18n en="Aliases" fr="Alias" />
            </Typography>
            <Box display="flex" alignItems="center" marginBottom={1}>
              <TextField
                fullWidth
                size="small"
                placeholder={language === "en" ? "Add alias..." : "Ajouter un alias..."}
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddAlias();
                    e.preventDefault();
                  }
                }}
              />
              <IconButton color="primary" onClick={handleAddAlias}>
                <Add />
              </IconButton>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {editedOrg.aliases?.map((alias, index) => (
                <Chip
                  key={index}
                  label={alias}
                  onDelete={() => handleRemoveAlias(index)}
                  deleteIcon={<Delete />}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {!isCreatingNew && (
          <Button onClick={handleDelete} color="secondary" style={{ marginRight: "auto" }}>
            <I18n en="Delete" fr="Supprimer" />
          </Button>
        )}
        <Button onClick={onClose}>
          <I18n en="Cancel" fr="Annuler" />
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          <I18n en="Save" fr="Enregistrer" />
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationEditModal;
