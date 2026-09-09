import React, { useState, useRef, useCallback } from "react";
import {
  TextField,
  Grid,
  Typography,
  Autocomplete,
  CircularProgress,
  Divider,
  Box,
} from "@mui/material";
import { I18n } from "../I18n";

function SectionHeader({ children }) {
  return (
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
        {children}
      </Typography>
      <Divider />
    </Grid>
  );
}

/**
 * Shared organization form fields with ROR API search.
 *
 * @param {object}   values    - Current form values (org fields)
 * @param {function} onChange  - Called with an object of updates, e.g. { orgNameEn: "X", orgCity: "Y" }
 * @param {boolean}  showSlug  - Whether to show the slug field (admin only)
 */
export default function OrganizationFormFields({ values = {}, onChange, showSlug = false }) {
  const [rorSearchQuery, setRorSearchQuery] = useState("");
  const [rorSearchResults, setRorSearchResults] = useState([]);
  const [rorSearchLoading, setRorSearchLoading] = useState(false);
  const [rorSearchOpen, setRorSearchOpen] = useState(false);
  const debounceRef = useRef(null);

  const field = (key) => values[key] || "";

  const update = (key, value) => onChange({ [key]: value });

  const searchRor = useCallback((query) => {
    if (!query || query.length < 2) {
      setRorSearchResults([]);
      return;
    }
    setRorSearchLoading(true);
    fetch(`https://api.ror.org/v2/organizations?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => setRorSearchResults(data.items || []))
      .catch((err) => {
        console.error("ROR API search error:", err);
        setRorSearchResults([]);
      })
      .finally(() => setRorSearchLoading(false));
  }, []);

  const handleRorInputChange = (event, newValue, reason) => {
    if (reason !== "input") return;
    setRorSearchQuery(newValue);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchRor(newValue), 300);
  };

  const handleRorSelect = (event, rorOrg) => {
    if (!rorOrg) return;

    const rorId = rorOrg.id?.replace("https://ror.org/", "") || "";
    const displayName =
      rorOrg.names?.find((n) => n.types?.includes("ror_display"))?.value || "";
    const enName =
      rorOrg.names?.find((n) => n.lang === "en" && n.types?.includes("label"))?.value ||
      displayName;
    const frName =
      rorOrg.names?.find((n) => n.lang === "fr" && n.types?.includes("label"))?.value || "";
    const aliases =
      rorOrg.names
        ?.filter((n) => n.types?.includes("alias") || n.types?.includes("acronym"))
        .map((n) => n.value) || [];
    const website =
      rorOrg.links?.find((l) => l.type === "website")?.value || "";
    const location = rorOrg.locations?.[0]?.geonames_details || {};

    const existingAliases = Array.isArray(values.orgAcceptedNames)
      ? values.orgAcceptedNames
      : (values.orgAcceptedNames || "")
          .split("\n")
          .map((n) => n.trim())
          .filter(Boolean);
    const mergedAliases = [...new Set([...existingAliases, ...aliases])];

    onChange({
      orgRor: rorId,
      orgNameEn: enName || values.orgNameEn || "",
      orgNameFr: frName || values.orgNameFr || "",
      orgURL: website || values.orgURL || "",
      orgCity: location.name || values.orgCity || "",
      orgCountry: location.country_name || values.orgCountry || "",
      orgAcceptedNames: mergedAliases,
    });

    setRorSearchQuery("");
    setRorSearchResults([]);
  };

  const getRorOptionLabel = (option) =>
    option.names?.find((n) => n.types?.includes("ror_display"))?.value || option.id || "";

  return (
    <Grid container spacing={2}>
      {/* ── ROR Search ── */}
      <SectionHeader>
        <I18n en="Search ROR Registry" fr="Rechercher dans le registre ROR" />
      </SectionHeader>
      <Grid size={{ xs: 12 }}>
        <Autocomplete
          open={rorSearchOpen}
          onOpen={() => setRorSearchOpen(true)}
          onClose={() => setRorSearchOpen(false)}
          options={rorSearchResults}
          loading={rorSearchLoading}
          getOptionLabel={getRorOptionLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => {
            const name = getRorOptionLabel(option);
            const loc = option.locations?.[0]?.geonames_details || {};
            const locStr = [loc.name, loc.country_name].filter(Boolean).join(", ");
            const acronyms =
              option.names
                ?.filter((n) => n.types?.includes("acronym"))
                .map((n) => n.value)
                .join(", ") || "";
            return (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">
                    {name}
                    {acronyms && (
                      <Typography component="span" variant="body2" color="textSecondary">
                        {" "}
                        ({acronyms})
                      </Typography>
                    )}
                  </Typography>
                  {locStr && (
                    <Typography variant="caption" color="textSecondary">
                      {locStr}
                    </Typography>
                  )}
                </Box>
              </li>
            );
          }}
          onChange={handleRorSelect}
          inputValue={rorSearchQuery}
          onInputChange={handleRorInputChange}
          filterOptions={(x) => x}
          noOptionsText={
            rorSearchQuery.length < 2 ? (
              <I18n
                en="Type at least 2 characters to search"
                fr="Tapez au moins 2 caractères pour rechercher"
              />
            ) : (
              <I18n en="No organizations found" fr="Aucune organisation trouvée" />
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                <I18n
                  en="Search ROR for an organization"
                  fr="Rechercher une organisation dans ROR"
                />
              }
              placeholder="e.g. Fisheries and Oceans Canada"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {rorSearchLoading ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
        <Typography variant="caption" color="textSecondary">
          <I18n
            en="Search the Research Organization Registry (ROR) to auto-fill organization details."
            fr="Recherchez dans le Research Organization Registry (ROR) pour remplir automatiquement les détails de l'organisation."
          />
        </Typography>
      </Grid>

      {/* ── Identity ── */}
      <SectionHeader>
        <I18n en="Identity" fr="Identité" />
      </SectionHeader>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Name (EN)" fr="Nom (EN)" />}
          value={field("orgNameEn")}
          onChange={(e) => update("orgNameEn", e.target.value)}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Name (FR)" fr="Nom (FR)" />}
          value={field("orgNameFr")}
          onChange={(e) => update("orgNameFr", e.target.value)}
        />
      </Grid>
      {showSlug && (
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={<I18n en="Slug (unique identifier)" fr="Slug (identifiant unique)" />}
            value={field("orgSlug")}
            onChange={(e) =>
              update("orgSlug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
            }
            helperText="Auto-generated from English name. Can be edited manually. Lowercase alphanumeric and hyphens only."
          />
        </Grid>
      )}

      {/* ── Logos ── */}
      <SectionHeader>
        <I18n en="Logos" fr="Logos" />
      </SectionHeader>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Logo URL (EN)" fr="URL du logo (EN)" />}
          value={field("orgLogoEn")}
          onChange={(e) => update("orgLogoEn", e.target.value)}
          helperText="SVG format preferred; PNG, JPG, JPEG also accepted."
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Logo URL (FR)" fr="URL du logo (FR)" />}
          value={field("orgLogoFr")}
          onChange={(e) => update("orgLogoFr", e.target.value)}
          helperText="SVG format preferred; PNG, JPG, JPEG also accepted."
        />
      </Grid>

      {/* ── URL ── */}
      <SectionHeader>URL</SectionHeader>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Website URL" fr="URL du site web" />}
          value={field("orgURL")}
          onChange={(e) => update("orgURL", e.target.value)}
          required
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Email" fr="Courriel" />}
          value={field("orgEmail")}
          onChange={(e) => update("orgEmail", e.target.value)}
        />
      </Grid>

      {/* ── Description ── */}
      <SectionHeader>
        <I18n en="Description" fr="Description" />
      </SectionHeader>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Description (EN)" fr="Description (EN)" />}
          multiline
          rows={3}
          value={field("orgDescriptionEn")}
          onChange={(e) => update("orgDescriptionEn", e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Description (FR)" fr="Description (FR)" />}
          multiline
          rows={3}
          value={field("orgDescriptionFr")}
          onChange={(e) => update("orgDescriptionFr", e.target.value)}
        />
      </Grid>

      {/* ── Aliases ── */}
      <SectionHeader>
        <I18n en="Aliases" fr="Alias" />
      </SectionHeader>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          label={<I18n en="Aliases (one per line)" fr="Alias (un par ligne)" />}
          multiline
          rows={3}
          value={
            Array.isArray(values.orgAcceptedNames)
              ? values.orgAcceptedNames.join("\n")
              : values.orgAcceptedNames || ""
          }
          onChange={(e) => update("orgAcceptedNames", e.target.value)}
          helperText="Acronyms and alternate names for this organization, e.g. DFO, MPO"
          placeholder="e.g. DFO, MPO (one per line)"
        />
      </Grid>

      {/* ── Location ── */}
      <SectionHeader>
        <I18n en="Location" fr="Emplacement" />
      </SectionHeader>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          label={<I18n en="Address" fr="Adresse" />}
          multiline
          rows={2}
          value={field("orgAddress")}
          onChange={(e) => update("orgAddress", e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="City" fr="Ville" />}
          value={field("orgCity")}
          onChange={(e) => update("orgCity", e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="Country" fr="Pays" />}
          value={field("orgCountry")}
          onChange={(e) => update("orgCountry", e.target.value)}
        />
      </Grid>

      {/* ── Identifiers ── */}
      <SectionHeader>
        <I18n en="Identifiers" fr="Identifiants" />
      </SectionHeader>
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth
          label={<I18n en="ROR ID" fr="Identifiant ROR" />}
          value={field("orgRor")}
          onChange={(e) => update("orgRor", e.target.value)}
        />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField
          fullWidth
          label={<I18n en="ROR Version" fr="Version ROR" />}
          value={field("orgRorVersion")}
          onChange={(e) => update("orgRorVersion", e.target.value)}
          helperText="Version of the ROR record, if applicable"
        />
      </Grid>
    </Grid>
  );
}
