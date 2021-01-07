import React from "react";
import { useParams } from "react-router-dom";

import { TextField, Typography, Grid } from "@material-ui/core";
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
    if (code === "custodian") return "Metadata Contact";
    if (code === "owner") return "Data Contact";
    return camelToSentenceCase(translate(code, language));
  });
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
              <En>What is the role of this contact?</En>
              <Fr>Quel est leur rôle?</Fr>
              <SupplementalText>
                <En>
                  At least one Metadata Contact and one Data Contact are
                  required. Multiple roles may be selected for each contact.
                </En>
                <Fr>
                  Au moins un contact de métadonnées et un contact de données
                  sont requis.
                </Fr>
                <a
                  href="http://registry.it.csiro.au/def/isotc211/CI_RoleCode"
                  // eslint-disable-next-line react/jsx-no-target-blank
                  target="_blank"
                >
                  <En>here</En>
                  <Fr>ici</Fr>
                </a>
              </SupplementalText>
            </QuestionText>

            <CheckBoxList
              name="role"
              value={value.role || []}
              onChange={onChange}
              options={options}
              optionLabels={optionLabels}
              disabled={disabled}
              optionTooltips={roleCodes.map(([, description]) => description)}
            />
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
