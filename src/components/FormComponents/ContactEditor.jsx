import React from "react";

import { TextField, Typography, Grid } from "@material-ui/core";

import { validateEmail, validateURL } from "../../utils/validate";
import RolePicker from "./RolePicker";
import { En, Fr, I18n } from "../I18n";

import ContactTitle from "./ContactTitle";
import { QuestionText } from "./QuestionStyles";

function givenNamesFormat(givenNames) {
  return givenNames
    .split(" ")
    .filter((e) => e)
    .map((e) => `${e[0].toUpperCase()  }. `)
    .join(" ");
}
function namesToCitation(givenNames, lastname) {
  if (!givenNames || !lastname) return "";

  return `${lastname  }, ${  givenNamesFormat(givenNames)}`;
}

const ContactEditor = ({
  value,
  showRolePicker,
  disabled,
  updateContact,
  updateContactEvent,
}) => {
  const orgEmailValid = validateEmail(value.orgEmail);
  const indEmailValid = validateEmail(value.indEmail);
  const orgURLValid = validateURL(value.orgURL);
  const givenNamesValid = !value.givenNames?.includes(",");
  const lastNameValid = !value.lastName?.includes(",");

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <Typography variant="h6">
          <ContactTitle contact={value} />
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
          <Grid item xs style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n en="Organization name" fr="Nom de l'organisation" />}
              value={value.orgName}
              onChange={updateContactEvent("orgName")}
              disabled={disabled}
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
              disabled={disabled}
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
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Country" fr="Pays" />}
              value={value.orgCountry}
              onChange={updateContactEvent("orgCountry")}
              disabled={disabled}
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

        <Grid
          container
          direction="column"
          spacing={1}
          style={{ marginTop: "10px" }}
        >
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
              label={<I18n en="Last name" fr="nom de famille" />}
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
