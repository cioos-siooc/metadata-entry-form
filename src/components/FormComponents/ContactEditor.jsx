import React, { useEffect, useState, useRef } from "react";

import {
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Button,
  IconButton,
  InputAdornment,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { useDebounce } from "use-debounce";
import { Clear, OpenInNew } from "@material-ui/icons";
import { getBlankContact } from "../../utils/blankRecord";

import { validateEmail, validateURL } from "../../utils/validate";
import RolePicker from "./RolePicker";
import { En, Fr, I18n } from "../I18n";

import ContactTitle from "./ContactTitle";
import { QuestionText } from "./QuestionStyles";

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

  // eslint-disable-next-line no-param-reassign
  value = { ...getBlankContact(), ...value };

  function updateRorOptions(newInputValue) {
    if (
      newInputValue.startsWith("http") &&
      !newInputValue.includes("ror.org")
    ) {
       if (mounted.current) setRorSearchActive(false);
    } else {
      fetch(`https://api.ror.org/v2/organizations?query="${newInputValue}"`)
        .then((response) => response.json())
        .then((response) => {
          if (mounted.current){
            console.log("ITEMS V2 ::: " ,response.items);
            setRorOptions(response.items)}
          if (response.number_of_results === 1){
            console.log("ITEMS V2 1 ::: " ,response.items);
            updateContactRor(response.items[0]);
          }
        })
        .then(() => {if (mounted.current) setRorSearchActive(false)});
    }
  }

  useEffect(() => {

    mounted.current = true;
    if (debouncedRorInputValue) {
      console.log("DEBOUNCED ROR INPUT VALUE ::: ", debouncedRorInputValue);
      updateRorOptions(debouncedRorInputValue);
    }

    return () => {
      mounted.current = false;
    };
  }, [debouncedRorInputValue]);

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <Typography variant="h6">
          {ContactTitle(value)}
        </Typography>
      </Grid>
      <Grid item xs>
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
          {/* Organization */}
          <Grid item xs>
            <QuestionText>
              <I18n>
                <En>Provide any information about the organization</En>
                <Fr>Identification de l'organisation</Fr>
              </I18n>
            </QuestionText>
          </Grid>
          <Grid item xs style={{ marginleft: "10px", height: "33px" }}>
            {rorSearchActive ? (
              <CircularProgress size={20} />
            ) : (
              <div style={{ height: "33px" }} />
            )}
          </Grid>
          <Grid item xs style={{ marginleft: "10px" }}>
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
                  fetch(`https://api.ror.org/v2/organizations/${organization.id}`)
                    .then((response) => response.json())
                    .then((response) => {
                      if (!response.errors) {
                        console.log("ROR ORG SELECTED ::: ", response);
                        updateContactRor(response);
                      } // todo: do some error handling here if search fails?
                    })
                    .then(() => setRorSearchActive(false))
                    .then(() => setRorInputValue(""));
                }
              }}
              freeSolo
              filterOptions={(x) => x}
              getOptionLabel={(e) => e.name}
              options={rorOptions}
              fullWidth
              renderInput={(params) => (
                <TextField
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...params}
                  label={
                    <I18n
                      en="Type to search Research Organization Registry (ROR)"
                      fr="Tapez pour rechercher le registre des organismes de recherche (ROR)
"
                    />
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n active en="ROR URL" fr="URL ROR" />}
              InputLabelProps={{ shrink: value.orgRor !== "" }}
              value={value.orgRor}
              disabled
              fullWidth
              InputProps={{
                endAdornment: value.orgRor && (
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
              // sx={{m: 2, "&.Mui-focused .MuiIconButton-root": {color: 'primary.main'}}}
            />
          </Grid>
          <Grid item xs style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n en="Organization name" fr="Nom de l'organisation" />}
              value={value.orgName}
              onChange={updateContactEvent("orgName")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              helperText={
                !orgURLValid && <I18n en="Invalid URL" fr="URL non valide" />
              }
              error={!orgURLValid}
              label={<I18n en="URL" fr="URL" />}
              value={value.orgURL}
              onChange={updateContactEvent("orgURL")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Address" fr="Adresse" />}
              value={value.orgAdress}
              onChange={updateContactEvent("orgAdress")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="City" fr="Ville" />}
              value={value.orgCity}
              onChange={updateContactEvent("orgCity")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Country" fr="Pays" />}
              value={value.orgCountry}
              onChange={updateContactEvent("orgCountry")}
              disabled={value.orgRor !== "" || disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
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
              disabled={disabled}
            />{" "}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs>
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
        <Grid item xs style={{ marginleft: "10px" }}>
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
          <Grid item xs>
            {value.givenNames && value.lastName && value.inCitation && (
              <div style={{ marginBottom: "10px" }}>
                This name will appear in the citation as:{" "}
                <b>{namesToCitation(value.givenNames, value.lastName)}</b>
              </div>
            )}
          </Grid>
          <Grid item xs>
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
          <Grid item xs>
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
          <Grid item xs>
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
          <Grid item xs>
            <TextField
              label={<I18n en="Position" fr="Poste occupé" />}
              value={value.indPosition}
              onChange={updateContactEvent("indPosition")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
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
