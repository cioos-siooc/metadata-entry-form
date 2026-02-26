import React, { useEffect, useState, useRef } from "react";

import {
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  InputAdornment,
  Autocomplete,
  Link,
  Alert,
  Box,
} from "@mui/material";
import { useDebounce } from "use-debounce";
import { Clear, OpenInNew, Warning } from "@mui/icons-material";
import { getBlankContact } from "../../utils/blankRecord";

import { validateEmail, validateURL } from "../../utils/validate";
import RolePicker from "./RolePicker";
import { En, Fr, I18n } from "../I18n";

import ContactTitle from "./ContactTitle";
import { QuestionText } from "./QuestionStyles";
import RequestOrganizationDialog from "../Dialogs/RequestOrganizationDialog";
import { findMatchingOrganization } from "../../utils/organizationUtils";

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
  organizations = {},
  showRolePicker,
  disabled,
  handleClear,
  updateContact,
  updateContactEvent,
  updateContactRor,
  updateContactOrcid,
  language,
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
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  // eslint-disable-next-line no-param-reassign
  value = { ...getBlankContact(), ...value };

  const orgList = Object.values(organizations);
  const selectedOrg = value.orgSlug ? organizations[value.orgSlug] : null;

  // Check if current orgName matches an approved org (for historical data)
  const suggestedOrg = !value.orgSlug && value.orgName ? findMatchingOrganization(value.orgName, organizations) : null;

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
          if (mounted.current){
            setRorOptions(response.items)}
          if (response.number_of_results === 1){
            updateContactRor(response.items[0]);
          }
        })
        .then(() => {if (mounted.current) setRorSearchActive(false)});
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

  function handleSelectRegistryOrg(org) {
    if (!org) {
      updateContact("orgSlug")("");
      return;
    }

    const updates = {
      orgSlug: org.orgSlug,
      orgName: language === "fr" ? org.orgNameFr || org.orgNameEn : org.orgNameEn,
      orgNameEn: org.orgNameEn || "",
      orgNameFr: org.orgNameFr || "",
      orgLogoEn: org.orgLogoEn || "",
      orgLogoFr: org.orgLogoFr || "",
      orgAcceptedNames: org.orgAcceptedNames || [],
      orgEmail: org.orgEmail || "",
      orgURL: org.orgURL || "",
      orgAddress: org.orgAddress || "",
      orgCity: org.orgCity || "",
      orgCountry: org.orgCountry || "",
      orgRor: org.orgRor || "",
    };

    Object.entries(updates).forEach(([key, val]) => {
      updateContact(key)(val);
    });
  }

  return (
    <Grid container direction="column" spacing={2}>
      <Grid >
        <Typography variant="h6">
          {ContactTitle(value)}
        </Typography>
      </Grid>
      <Grid >
        {showRolePicker && (
          <RolePicker
            value={value}
            updateContact={updateContact}
            disabled={disabled}
          />
        )}
        <Grid
          container
          direction="column"
          spacing={1}
          style={{ marginTop: "10px" }}
        >
          {/* Organization Registry Search */}
          <Grid >
            <QuestionText>
              <I18n>
                <En>Search Organization Registry</En>
                <Fr>Rechercher dans le registre des organisations</Fr>
              </I18n>
            </QuestionText>
          </Grid>
          <Grid >
            <Autocomplete
              disabled={disabled}
              value={selectedOrg || null}
              onChange={(e, org) => handleSelectRegistryOrg(org)}
              options={orgList}
              getOptionLabel={(org) => language === "fr" ? (org.orgNameFr || org.orgNameEn) : org.orgNameEn}
              filterOptions={(options, { inputValue }) => {
                const search = inputValue.toLowerCase();
                return options.filter(o => 
                  o.orgNameEn?.toLowerCase().includes(search) || 
                  o.orgNameFr?.toLowerCase().includes(search) ||
                  o.orgAcceptedNames?.some(name => name.toLowerCase().includes(search))
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={<I18n en="Registry Organization" fr="Organisation du registre" />}
                />
              )}
              fullWidth
            />
            {!selectedOrg && (
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                <I18n en="Can't find your organization?" fr="Vous ne trouvez pas votre organisation ?" />{" "}
                <Link component="button" variant="caption" onClick={() => setRequestDialogOpen(true)}>
                  <I18n en="Request to add it" fr="Demander à l'ajouter" />
                </Link>
              </Typography>
            )}
            {selectedOrg && (
              <Box mt={1} display="flex" alignItems="center">
                <Button size="small" startIcon={<Clear />} onClick={() => handleSelectRegistryOrg(null)}>
                  <I18n en="Unlink from Registry" fr="Dissocier du registre" />
                </Button>
              </Box>
            )}
          </Grid>

          {suggestedOrg && (
            <Grid >
              <Alert severity="warning" icon={<Warning />}>
                <I18n 
                  en={`"${value.orgName}" matches an approved organization: `} 
                  fr={`"${value.orgName}" correspond à une organisation approuvée : `} 
                />
                <Link component="button" onClick={() => handleSelectRegistryOrg(suggestedOrg)}>
                  {language === "fr" ? suggestedOrg.orgNameFr : suggestedOrg.orgNameEn}
                </Link>
              </Alert>
            </Grid>
          )}

          {/* ROR Search */}
          {!selectedOrg && (
            <>
              <Grid >
                <QuestionText>
                  <I18n>
                    <En>Or search Research Organization Registry (ROR)</En>
                    <Fr>Ou rechercher dans le registre des organismes de recherche (ROR)</Fr>
                  </I18n>
                </QuestionText>
              </Grid>
              <Grid  style={{ marginLeft: "10px", height: "33px" }}>
                {rorSearchActive ? (
                  <CircularProgress size={20} />
                ) : (
                  <div style={{ height: "33px" }} />
                )}
              </Grid>
              <Grid  style={{ marginleft: "10px" }}>
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
                          }
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
                      label={
                        <I18n
                          en="Search ROR"
                          fr="Rechercher ROR"
                        />
                      }
                    />
                  )}
                />
              </Grid>
            </>
          )}

          <Grid  style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n active en="ROR URL" fr="URL ROR" />}
              InputLabelProps={{ shrink: value.orgRor !== "" }}
              value={value.orgRor}
              disabled
              fullWidth
              InputProps={{
                endAdornment: value.orgRor && !selectedOrg && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        handleClear("orgRor");
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid  style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n en="Organization name" fr="Nom de l'organisation" />}
              value={value.orgName}
              onChange={updateContactEvent("orgName")}
              disabled={value.orgRor !== "" || selectedOrg !== null || disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              helperText={
                !orgURLValid && <I18n en="Invalid URL" fr="URL non valide" />
              }
              error={!orgURLValid}
              label={<span><I18n en="URL" fr="URL" /> *</span>}
              value={value.orgURL}
              onChange={updateContactEvent("orgURL")}
              disabled={value.orgRor !== "" || selectedOrg !== null || disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              label={<I18n en="Address" fr="Adresse" />}
              value={value.orgAddress}
              onChange={updateContactEvent("orgAddress")}
              disabled={selectedOrg !== null || disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              label={<I18n en="City" fr="Ville" />}
              value={value.orgCity}
              onChange={updateContactEvent("orgCity")}
              disabled={value.orgRor !== "" || selectedOrg !== null || disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              label={<I18n en="Country" fr="Pays" />}
              value={value.orgCountry}
              onChange={updateContactEvent("orgCountry")}
              disabled={value.orgRor !== "" || selectedOrg !== null || disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              helperText={
                !orgEmailValid && (
                  <I18n en="Invalid email" fr="E-mail non valide" />
                )
              }
              error={!orgEmailValid}
              label={<I18n en="Email" fr="Courriel" />}
              value={value.orgEmail}
              onChange={updateContactEvent("orgEmail")}
              fullWidth
              disabled={selectedOrg !== null || disabled}
            />{" "}
          </Grid>
        </Grid>
      </Grid>

      <Grid >
        <RequestOrganizationDialog 
          open={requestDialogOpen} 
          onClose={() => setRequestDialogOpen(false)} 
          initialName={value.orgName}
        />
        {/* Individual */}
        <Typography>
          <I18n>
            <En>Provide any information about the individual</En>
            <Fr>Identification de l'individu</Fr>
          </I18n>
        </Typography>
        <Typography>
          <Button
            href="https://orcid.org/orcid-search/search"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: "10px", marginBottom: "10px" }}
          >
            <I18n>
              <En>ORCID search </En>
              <Fr>Rechercher ORCID </Fr>
            </I18n>
            <OpenInNew style={{ verticalAlign: "middle" }} />
          </Button>
        </Typography>
        <Grid  style={{ marginleft: "10px" }}>
          <TextField
            label={
              <I18n
                en="Paste ORCID identifier here to populate personal data"
                fr="Collez l'identifiant ORCID ici pour remplir les données personnelles"
              />
            }
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
        <Grid container direction="column" spacing={1}>
          <Grid >
            {value.givenNames && value.lastName && value.inCitation && (
              <div style={{ marginBottom: "10px" }}>
                This name will appear in the citation as:{" "}
                <b>{namesToCitation(value.givenNames, value.lastName)}</b>
              </div>
            )}
          </Grid>
          <Grid >
            <TextField
              label={<I18n en="ORCID URL" fr="URL ORCID" />}
              InputLabelProps={{ shrink: value.indOrcid !== "" }}
              value={value.indOrcid}
              InputProps={{
                endAdornment: value.indOrcid && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        handleClear("indOrcid");
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled
              fullWidth
            />
          </Grid>
          <Grid >
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
          <Grid >
            <TextField
              // style={{ margin: "25px" }}
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
          <Grid >
            <TextField
              label={<I18n en="Position" fr="Poste occupé" />}
              value={value.indPosition}
              onChange={updateContactEvent("indPosition")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid >
            <TextField
              helperText={
                !indEmailValid && (
                  <I18n en="Invalid email" fr="E-mail non valide" />
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
      </Grid>
    </Grid>
  );
};

export default ContactEditor;
