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
import CheckBoxList from "./CheckBoxList";
import RequiredMark from "../FormComponents/RequiredMark";

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
  const { language } = useParams();
  const options = Object.keys(roleCodes);
  const optionLabels = Object.values(roleCodes).map(
    ({ title }) => title[language]
  );
  const numSpecialRoles = 3;
  const [expanded, setExpanded] = React.useState(false);

  const selectOptionIsInExpandedList =
    (value.role || []).filter(
      (role) => options.indexOf(role) > numSpecialRoles - 1
    ).length > 0;

  // function updateContact() {}
  // function updateContactEvent() {}
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
                <Fr>Quel est leur rôle?</Fr>
              </I18n>
              <RequiredMark passes={value.role && value.role.length} />
              <SupplementalText>
                {" "}
                <I18n>
                  <En>
                    At least one Metadata Contact and one Data Contact are
                    required. Multiple roles can be selected for each contact.
                    Expand the list below for additional role.
                  </En>
                  <Fr>
                    Au moins une personne-contact pour les métadonnées et une
                    personne-contact pour les données sont requises. Plusieurs
                    rôles peuvent être sélectionnés pour chaque contact. Si vous
                    avez besoin de rôles plus spécifiques, vous pouvez étendre
                    la liste.
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>

            <CheckBoxList
              value={value.role || []}
              onChange={updateContact("role")}
              options={options.slice(0, numSpecialRoles)}
              optionLabels={optionLabels.slice(0, numSpecialRoles)}
              disabled={disabled}
              optionTooltips={Object.values(roleCodes)
                .map(({ text }) => text[language])
                .slice(0, numSpecialRoles)}
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
                  options={options.slice(numSpecialRoles)}
                  optionLabels={optionLabels.slice(numSpecialRoles)}
                  disabled={disabled}
                  optionTooltips={Object.values(roleCodes)
                    .map(({ text }) => text[language])
                    .slice(numSpecialRoles)}
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
              label={<I18n en="Position" fr="Position" />}
              value={value.indPosition}
              onChange={updateContactEvent("indPosition")}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
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
