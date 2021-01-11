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
import { camelToSentenceCase } from "../../utils/misc";
import ContactTitle from "../ContactTitle";
import translate from "../../utils/i18n";
import { QuestionText, SupplementalText } from "./QuestionStyles";

const Contact = ({ onChange, value, showRolePicker, disabled }) => {
  const { language } = useParams();
  const options = roleCodes.map(([code]) => code);
  const optionLabels = roleCodes.map(([code]) => {
    if (code === "custodian") return <b>Metadata Contact</b>;
    if (code === "owner") return <b>Data Contact</b>;
    return camelToSentenceCase(translate(code, language));
  });

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
                  required. Multiple roles may be selected for each contact. If
                  you need more specific role options you can expend the list.
                </En>
                <Fr>
                  Au moins un contact de métadonnées et un contact de données
                  sont requis. Plusieurs rôles peuvent être sélectionnés pour
                  chaque contact. Si vous avez besoin d'options de rôle plus
                  spécifiques, vous pouvez dépenser la liste.
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
              optionTooltips={roleCodes.map(([, description]) => description)}
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
                  <Fr>Afficher/masquer plus d'options de rôle</Fr>
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
                  optionTooltips={roleCodes.map(
                    ([, description]) => description
                  )}
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
              <Fr>Fournir toute information sur l'organisation ;</Fr>
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
          <Fr>Fournir toute information sur l'individual</Fr>
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
              label={<I18n en="Email" fr="Email" />}
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
