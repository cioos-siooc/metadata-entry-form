import React from "react";
import { useParams } from "react-router-dom";

import {
  TextField,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import { validateEmail, validateURL } from "../../utils/validate";
import CheckBoxList from "./CheckBoxList";
import RequiredMark from "./RequiredMark";

import { En, Fr, I18n } from "../I18n";
import { roleCodes } from "../../isoCodeLists";

import ContactTitle from "./ContactTitle";
import { QuestionText, SupplementalText } from "./QuestionStyles";

const EditContact = ({
  value,
  showRolePicker,
  disabled,
  updateContact,
  updateContactEvent,
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const { language } = useParams();
  const roleCodeKeys = Object.keys(roleCodes);
  const roleLabels = Object.values(roleCodes).map(
    ({ title, includeInCitation }) =>
      `${title[language]}${includeInCitation ? "*" : ""}`
  );
  const citationRoleText = {
    en: "This role is included in the citation.",
    fr: "Ce rôle est inclus dans la citation.",
  };
  const tooltips = Object.values(roleCodes).map(
    ({ text, includeInCitation }) =>
      `${text[language]}${
        includeInCitation ? `.  ${citationRoleText[language]}` : ""
      }`
  );

  // the first 3 roles are show more prominently
  const numSpecialRoles = 3;
  const selectOptionIsInExpandedList =
    (value.role || []).filter(
      (role) => roleCodeKeys.indexOf(role) > numSpecialRoles - 1
    ).length > 0;

  const orgEmailValid = validateEmail(value.orgEmail);
  const indEmailValid = validateEmail(value.indEmail);
  const orgURLValid = validateURL(value.orgURL);

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <Typography variant="h6">
          <ContactTitle contact={value} />
        </Typography>
      </Grid>
      <Grid item xs>
        {showRolePicker && (
          <Grid item xs>
            <QuestionText>
              <I18n>
                <En>
                  What is the role of this contact?{" "}
                  {selectOptionIsInExpandedList}
                </En>
                <Fr>Quel est son rôle?</Fr>
              </I18n>
              <RequiredMark passes={value.role?.length} />
              <SupplementalText>
                {" "}
                <I18n>
                  <En>
                    At least one Metadata Custodian and one Data Owner are
                    required. Multiple roles can be selected for each contact.
                    Expand the list below for additional role.
                  </En>
                  <Fr>
                    Au moins un dépositaire de métadonnées et un propriétaire de
                    données sont requis. Plusieurs rôles peuvent être
                    sélectionnés par personne. Si vous avez besoin de rôles plus
                    spécifiques, vous pouvez étendre la liste.
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>

            <CheckBoxList
              value={value.role || []}
              onChange={updateContact("role")}
              options={roleCodeKeys.slice(0, numSpecialRoles)}
              roleLabels={roleLabels.slice(0, numSpecialRoles)}
              disabled={disabled}
              optionTooltips={tooltips.slice(0, numSpecialRoles)}
            />

            <Accordion
              onChange={() => setExpanded(!expanded)}
              expanded={expanded || selectOptionIsInExpandedList}
            >
              <AccordionSummary
                expandIcon={
                  <Tooltip title="Show/Hide more options">
                    <ExpandMore />
                  </Tooltip>
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <I18n>
                  <En>Show/Hide more role options</En>
                  <Fr>Afficher/masquer les rôles</Fr>
                </I18n>
              </AccordionSummary>
              <AccordionDetails>
                <CheckBoxList
                  value={value.role || []}
                  onChange={updateContact("role")}
                  options={roleCodeKeys.slice(numSpecialRoles)}
                  roleLabels={roleLabels.slice(numSpecialRoles)}
                  disabled={disabled}
                  optionTooltips={tooltips.slice(numSpecialRoles)}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>
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
            <TextField
              label={<I18n en="Individual Name" fr="Nom de l'individu" />}
              value={value.indName}
              onChange={updateContactEvent("indName")}
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

export default EditContact;
