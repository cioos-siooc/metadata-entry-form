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

import { I18n, En, Fr } from "../I18n";
import { roleCodes } from "../../isoCodeLists";

import ContactTitle from "./ContactTitle";
import { QuestionText, SupplementalText } from "./QuestionStyles";

const Contact = ({ onChange, value, showRolePicker, disabled }) => {
  const { language } = useParams();
  const options = Object.keys(roleCodes);
  const optionLabels = Object.values(roleCodes).map(
    ({ title }) => title[language]
  );

  const [expanded, setExpanded] = React.useState(false);

  const selectOptionIsInExpandedList =
    (value.role || []).filter((role) => options.indexOf(role) > 2).length > 0;
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
              <En>
                What is the role of this contact? {selectOptionIsInExpandedList}
              </En>
              <Fr>Quel est leur rôle?</Fr>
              <SupplementalText>
                <En>
                  At least one Metadata Contact and one Data Contact are
                  required. Multiple roles can be selected for each contact.
                  Expand the list below for additional role.
                </En>
                <Fr>
                  Au moins une personne-contact pour les métadonnées et une
                  personne-contact pour les données sont requises. Plusieurs
                  rôles peuvent être sélectionnés pour chaque contact. Si vous
                  avez besoin de rôles plus spécifiques, vous pouvez étendre la
                  liste.
                </Fr>
              </SupplementalText>
            </QuestionText>

            <CheckBoxList
              name="role"
              value={value.role || []}
              onChange={onChange}
              options={options.slice(0, 3)}
              optionLabels={optionLabels.slice(0, 3)}
              disabled={disabled}
              optionTooltips={Object.values(roleCodes)
                .map(({ text }) => text[language])
                .slice(0, 3)}
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
                <span>
                  <En>Show/Hide more role options</En>
                  <Fr>Afficher/masquer les rôles</Fr>
                </span>
              </AccordionSummary>
              <AccordionDetails>
                <CheckBoxList
                  name="role"
                  value={value.role || []}
                  onChange={onChange}
                  options={options.slice(3)}
                  optionLabels={optionLabels.slice(3)}
                  disabled={disabled}
                  optionTooltips={Object.values(roleCodes)
                    .map(({ text }) => text[language])
                    .slice(3)}
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
              <En>Provide any information about the organization</En>
              <Fr>Identification de l'organisation</Fr>
            </QuestionText>
          </Grid>
          <Grid item xs style={{ marginleft: "10px" }}>
            <TextField
              label={<I18n en="Organization name" fr="Nom de l'organisation" />}
              name="orgName"
              value={value.orgName}
              onChange={onChange}
              onBlur={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="URL" fr="URL" />}
              name="orgURL"
              value={value.orgURL}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Address" fr="Adresse" />}
              name="orgAdress"
              value={value.orgAdress}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="City" fr="Ville" />}
              name="orgCity"
              value={value.orgCity}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Country" fr="Pays" />}
              name="orgCountry"
              value={value.orgCountry}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Email" fr="Courriel" />}
              name="orgEmail"
              value={value.orgEmail}
              onChange={onChange}
              fullWidth
              disabled={disabled}
            />{" "}
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs>
        {/* Individual */}
        <Typography>
          <En>Provide any information about the individual</En>
          <Fr>Identification de l'individu</Fr>
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
              name="indName"
              value={value.indName}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Position" fr="Position" />}
              name="indPosition"
              value={value.indPosition}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Email" fr="Courriel" />}
              name="indEmail"
              value={value.indEmail}
              onChange={onChange}
              disabled={disabled}
              fullWidth
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Contact;
