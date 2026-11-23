import React, { useEffect, useState, useRef } from "react";

import {
  Box,
  Divider,
  Stack,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { useDebounce } from "use-debounce";
import { Clear, OpenInNew } from "@mui/icons-material";
import { getBlankContact } from "../../utils/blankRecord";

import { validateEmail, validateURL } from "../../utils/validate";
import RolePicker from "./RolePicker";
import { I18n } from "../I18n";

import ContactTitle from "./ContactTitle";

function givenNamesFormat(givenNames) {
  return givenNames
    .split(" ")
    .filter((e) => e)
    .map((e) => `${e[0].toUpperCase()}. `)
    .join(" ");
}

function namesToCitation(givenNames, lastname) {
  if (!givenNames || !lastname) return "";

  return `${lastname}, ${givenNamesFormat(givenNames)}`;
}

const ContactEditor = ({
  value,
  showRolePicker,
  disabled,
  handleClear,
  updateContact,
  updateContactEvent,
  updateContactRor,
  updateContactOrcid,
  updateContactFromAccount,
  language,
  // The saved-contact page shows the name as its h1 instead.
  showTitle = true,
}) => {
  const mounted = useRef(false);
  const orgEmailValid = validateEmail(value.orgEmail);
  const indEmailValid = validateEmail(value.indEmail);
  const orgURLValid = validateURL(value.orgURL);
  const givenNamesValid = !value.givenNames?.includes(",");
  const lastNameValid = !value.lastName?.includes(",");
  const [rorInputValue, setRorInputValue] = useState(value.orgRor);
  const [orcidInputValue, setOrcidInputValue] = useState("");
  const [debouncedRorInputValue] = useDebounce(rorInputValue, 500);
  const [rorOptions, setRorOptions] = useState([]);
  const [rorSearchActive, setRorSearchActive] = useState(false);

  value = { ...getBlankContact(), ...value };

  function updateRorOptions(newInputValue) {
    if (
      newInputValue.startsWith("http") &&
      !newInputValue.includes("ror.org")
    ) {
      if (mounted.current) setRorSearchActive(false);
    } else {
      fetch(`https://api.ror.org/organizations?query="${newInputValue}"`)
        .then((response) => response.json())
        .then((response) => {
          if (mounted.current) {
            setRorOptions(response.items);
          }
          if (response.number_of_results === 1) {
            updateContactRor(response.items[0]);
          }
        })
        .then(() => {
          if (mounted.current) setRorSearchActive(false);
        });
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (debouncedRorInputValue) {
      updateRorOptions(debouncedRorInputValue);
    }

    return () => {
      mounted.current = false;
    };
  }, [debouncedRorInputValue]);

  const fr = language === "fr";
  const half = { xs: 12, sm: 6 };
  // One level under the editor's title: h4 under the record's h3, h2 under
  // the saved-contact page's h1.
  const groupHeading = (en, frText) => (
    <Typography
      component={showTitle ? "h4" : "h2"}
      sx={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.4 }}
    >
      {fr ? frText : en}
    </Typography>
  );

  return (
    <Stack spacing={3}>
      {showTitle && (
        <Typography
          component="h3"
          sx={{
            fontSize: "1.0625rem",
            fontWeight: 600,
            overflowWrap: "anywhere",
          }}
        >
          {ContactTitle(value) || (
            <I18n en="New contact" fr="Nouveau contact" />
          )}
        </Typography>
      )}

      {showRolePicker && (
        <RolePicker
          value={value}
          updateContact={updateContact}
          disabled={disabled}
        />
      )}

      <Divider />

      {/* Organization */}
      <Box component="section">
        {groupHeading("Organization", "Organisation")}
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 0.25, mb: 1.5 }}
        >
          <I18n
            en="Search the Research Organization Registry (ROR) to fill this in, or type the details."
            fr="Recherchez dans le registre des organismes de recherche (ROR) pour remplir ces champs, ou saisissez les informations."
          />
        </Typography>
        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid size={12}>
            <Autocomplete
              inputValue={rorInputValue}
              onInputChange={(e, newInputValue) => {
                setRorInputValue(newInputValue);
                if (newInputValue === "") {
                  setRorSearchActive(false);
                } else {
                  setRorSearchActive(true);
                }
              }}
              disabled={disabled}
              onChange={(e, organization) => {
                if (organization !== null) {
                  fetch(`https://api.ror.org/organizations/${organization.id}`)
                    .then((response) => response.json())
                    .then((response) => {
                      if (!response.errors) {
                        updateContactRor(response);
                      } // todo: do some error handling here if search fails?
                    })
                    .then(() => setRorSearchActive(false))
                    .then(() => setRorInputValue(""));
                }
              }}
              freeSolo
              filterOptions={(x) => x}
              getOptionLabel={(e) => {
                const match = e.names.find((n) => n.lang === language);
                return match ? match.value : e.names[0]?.value || "";
              }}
              options={rorOptions}
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={<I18n en="Search ROR" fr="Rechercher dans ROR" />}
                  placeholder={
                    fr ? "Nom de l'organisation" : "Organization name"
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {rorSearchActive && (
                          <CircularProgress
                            size={18}
                            aria-label={fr ? "Recherche…" : "Searching…"}
                          />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="Organization name" fr="Nom de l'organisation" />}
              value={value.orgName}
              onChange={updateContactEvent("orgName")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="ROR URL" fr="URL ROR" />}
              value={value.orgRor}
              disabled
              fullWidth
              InputProps={{
                endAdornment: value.orgRor && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={fr ? "Effacer le ROR" : "Clear ROR"}
                      onClick={() => {
                        handleClear("orgRor");
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={half}>
            <TextField
              helperText={
                !orgURLValid && <I18n en="Invalid URL" fr="URL non valide" />
              }
              error={!orgURLValid}
              label={<I18n en="Website" fr="Site Web" />}
              value={value.orgURL}
              onChange={updateContactEvent("orgURL")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              helperText={
                !orgEmailValid && (
                  <I18n en="Invalid email" fr="Courriel non valide" />
                )
              }
              error={!orgEmailValid}
              label={<I18n en="Email" fr="Courriel" />}
              value={value.orgEmail}
              onChange={updateContactEvent("orgEmail")}
              fullWidth
              disabled={disabled}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={<I18n en="Address" fr="Adresse" />}
              value={value.orgAdress}
              onChange={updateContactEvent("orgAdress")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="City" fr="Ville" />}
              value={value.orgCity}
              onChange={updateContactEvent("orgCity")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="Country" fr="Pays" />}
              value={value.orgCountry}
              onChange={updateContactEvent("orgCountry")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Individual */}
      <Box component="section">
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          columnGap={1}
          rowGap={1}
        >
          {groupHeading("Individual", "Personne")}
          <Box sx={{ flexGrow: 1 }} />
          {updateContactFromAccount && (
            <Button
              variant="outlined"
              size="small"
              onClick={updateContactFromAccount}
              disabled={disabled}
            >
              <I18n en="Use my details" fr="Utiliser mes informations" />
            </Button>
          )}
          <Button
            variant="text"
            size="small"
            href="https://orcid.org/orcid-search/search"
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
          >
            <I18n en="Find an ORCID iD" fr="Trouver un identifiant ORCID" />
          </Button>
        </Stack>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 0.25, mb: 1.5 }}
        >
          <I18n
            en="Paste an ORCID iD to fill in the person's details, or type them."
            fr="Collez un identifiant ORCID pour remplir les informations de la personne, ou saisissez-les."
          />
        </Typography>
        <Grid container columnSpacing={2} rowSpacing={2}>
          <Grid size={half}>
            <TextField
              label={
                <I18n en="Paste ORCID iD" fr="Coller l'identifiant ORCID" />
              }
              placeholder="0000-0000-0000-0000"
              value={orcidInputValue}
              onChange={(e) => {
                setOrcidInputValue(e.target.value);
                const regex = /\w{4}-\w{4}-\w{4}-\w{4}/g;
                const orcid = e.target.value.match(regex);
                if (orcid) {
                  fetch(`https://pub.orcid.org/v3.0/${orcid}/record`, {
                    headers: {
                      accept: "application/json",
                    },
                  })
                    .then((response) => response.json())
                    .then((response) => updateContactOrcid(response))
                    .then(() => {
                      setTimeout(() => setOrcidInputValue(""), 100);
                    });
                }
              }}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="ORCID URL" fr="URL ORCID" />}
              value={value.indOrcid}
              InputProps={{
                endAdornment: value.indOrcid && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={fr ? "Effacer l'ORCID" : "Clear ORCID"}
                      onClick={() => {
                        handleClear("indOrcid");
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="Given name(s)" fr="Prénom" />}
              value={value.givenNames}
              helperText={
                !givenNamesValid && (
                  <I18n
                    en="No commas allowed"
                    fr="Aucune virgule n'est autorisée"
                  />
                )
              }
              error={!givenNamesValid}
              onChange={updateContactEvent("givenNames")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="Last name" fr="Nom de famille" />}
              value={value.lastName}
              helperText={
                !lastNameValid && (
                  <I18n
                    en="No commas allowed"
                    fr="Aucune virgule n'est autorisée"
                  />
                )
              }
              error={!lastNameValid}
              onChange={updateContactEvent("lastName")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              label={<I18n en="Position" fr="Poste occupé" />}
              value={value.indPosition}
              onChange={updateContactEvent("indPosition")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid size={half}>
            <TextField
              helperText={
                !indEmailValid && (
                  <I18n en="Invalid email" fr="Courriel non valide" />
                )
              }
              error={!indEmailValid}
              label={<I18n en="Email" fr="Courriel" />}
              value={value.indEmail}
              onChange={updateContactEvent("indEmail")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
        </Grid>
        {value.givenNames && value.lastName && value.inCitation && (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
            <I18n
              en="This name will appear in the citation as: "
              fr="Ce nom apparaîtra dans la citation sous la forme : "
            />
            <Box component="b" sx={{ color: "text.primary" }}>
              {namesToCitation(value.givenNames, value.lastName)}
            </Box>
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default ContactEditor;
