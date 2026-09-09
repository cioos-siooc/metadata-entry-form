import React, { useState } from "react";

import {
  TextField,
  Typography,
  Grid,
  Button,
  IconButton,
  InputAdornment,
  Autocomplete,
  Link,
  Alert,
  Box,
  Chip,
  Snackbar,
} from "@mui/material";
import { Clear, OpenInNew, Warning } from "@mui/icons-material";
import { getBlankContact } from "../../utils/blankRecord";

import { validateEmail } from "../../utils/validate";
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
  updateContactOrcid,
  language,
}) => {
  const [orcidInputValue, setOrcidInputValue] = useState("");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const contact = { ...getBlankContact(), ...value };

  const indEmailValid = validateEmail(contact.indEmail);
  const givenNamesValid = !contact.givenNames?.includes(",");
  const lastNameValid = !contact.lastName?.includes(",");

  const orgList = Object.values(organizations);
  const selectedOrg = contact.orgSlug ? organizations[contact.orgSlug] : null;

  // Check if current orgName matches an approved org (for historical data)
  const suggestedOrg = !contact.orgSlug && contact.orgName ? findMatchingOrganization(contact.orgName, organizations) : null;

  function handleSelectRegistryOrg(org) {
    if (!org) {
      // Clear all org fields when unlinking
      const clearFields = [
        "orgSlug", "orgName", "orgNameEn", "orgNameFr",
        "orgDescriptionEn", "orgDescriptionFr",
        "orgLogoEn", "orgLogoFr", "orgAcceptedNames",
        "orgEmail", "orgURL", "orgAddress", "orgCity",
        "orgCountry", "orgRor", "orgRorVersion",
      ];
      clearFields.forEach((key) => {
        updateContact(key)(key === "orgAcceptedNames" ? [] : "");
      });
      return;
    }

    const updates = {
      orgSlug: org.orgSlug,
      orgName: language === "fr" ? org.orgNameFr || org.orgNameEn : org.orgNameEn,
      orgNameEn: org.orgNameEn || "",
      orgNameFr: org.orgNameFr || "",
      orgDescriptionEn: org.orgDescriptionEn || "",
      orgDescriptionFr: org.orgDescriptionFr || "",
      orgLogoEn: org.orgLogoEn || "",
      orgLogoFr: org.orgLogoFr || "",
      orgAcceptedNames: org.orgAcceptedNames || [],
      orgEmail: org.orgEmail || "",
      orgURL: org.orgURL || "",
      orgAddress: org.orgAddress || "",
      orgCity: org.orgCity || "",
      orgCountry: org.orgCountry || "",
      orgRor: org.orgRor || "",
      orgRorVersion: org.orgRorVersion || "",
    };

    Object.entries(updates).forEach(([key, val]) => {
      updateContact(key)(val);
    });
  }

  return (
    <Grid container direction="column" spacing={2}>
      <Grid >
        <Typography variant="h6">
          {ContactTitle(contact)}
        </Typography>
      </Grid>
      <Grid >
        {showRolePicker && (
          <RolePicker
            value={contact}
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
                <En>Organization</En>
                <Fr>Organisation</Fr>
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
                  label={<I18n en="Search organizations" fr="Rechercher des organisations" />}
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
          </Grid>

          {selectedOrg && (
            <Grid >
              <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "action.hover" }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2">
                      {language === "fr" ? selectedOrg.orgNameFr || selectedOrg.orgNameEn : selectedOrg.orgNameEn}
                    </Typography>
                    {selectedOrg.orgCity && selectedOrg.orgCountry && (
                      <Typography variant="caption" color="textSecondary">
                        {selectedOrg.orgCity}, {selectedOrg.orgCountry}
                      </Typography>
                    )}
                    {selectedOrg.orgURL && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {selectedOrg.orgURL}
                      </Typography>
                    )}
                    {selectedOrg.orgRor && (
                      <Chip label={`ROR: ${selectedOrg.orgRor}`} size="small" sx={{ mt: 0.5 }} />
                    )}
                  </Box>
                  <Button size="small" startIcon={<Clear />} onClick={() => handleSelectRegistryOrg(null)}>
                    <I18n en="Unlink" fr="Dissocier" />
                  </Button>
                </Box>
              </Box>
            </Grid>
          )}

          {suggestedOrg && (
            <Grid >
              <Alert severity="warning" icon={<Warning />}>
                <I18n 
                  en={`"${contact.orgName}" matches an approved organization: `} 
                  fr={`"${contact.orgName}" correspond à une organisation approuvée : `} 
                />
                <Link component="button" onClick={() => handleSelectRegistryOrg(suggestedOrg)}>
                  {language === "fr" ? suggestedOrg.orgNameFr : suggestedOrg.orgNameEn}
                </Link>
              </Alert>
            </Grid>
          )}

        </Grid>
      </Grid>

      <Grid >
        <RequestOrganizationDialog 
          open={requestDialogOpen} 
          onClose={() => setRequestDialogOpen(false)} 
          onSuccess={() => {
            setSnackbarMessage("Organization request submitted. An admin will review it shortly.");
            setSnackbarOpen(true);
          }}
          initialName={contact.orgName}
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
            {contact.givenNames && contact.lastName && contact.inCitation && (
              <div style={{ marginBottom: "10px" }}>
                This name will appear in the citation as:{" "}
                <b>{namesToCitation(contact.givenNames, contact.lastName)}</b>
              </div>
            )}
          </Grid>
          <Grid >
            <TextField
              label={<I18n en="ORCID URL" fr="URL ORCID" />}
              InputLabelProps={{ shrink: contact.indOrcid !== "" }}
              value={contact.indOrcid}
              InputProps={{
                endAdornment: contact.indOrcid && (
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
              value={contact.givenNames}
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
              value={contact.lastName}
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
              value={contact.indPosition}
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
              value={contact.indEmail}
              onChange={updateContactEvent("indEmail")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" variant="filled" elevation={6}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default ContactEditor;
