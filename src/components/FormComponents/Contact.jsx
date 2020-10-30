import React from "react";

import { TextField, Typography, Grid } from "@material-ui/core";
import { I18n, En, Fr } from "../I18n";
import { roleCodes } from "../../isoCodeLists";
import { camelToSentenceCase } from "../../utils/misc";
import SelectMultipleInput from "./SelectMultipleInput";

const Contact = ({ onChange, value, showRolePicker, disabled }) => {
  return (
    <Grid container direction="column" spacing={1}>
      {showRolePicker && (
        <Grid item xs>
          <Typography>
            <En>
              What is their role? A list of roles with descriptions can be found{" "}
            </En>
            <Fr>
              Quel est leur rôle ? Une liste de rôles avec des descriptions peut
              être trouvée{" "}
            </Fr>
            <a
              href="http://registry.it.csiro.au/def/isotc211/CI_RoleCode"
              // eslint-disable-next-line react/jsx-no-target-blank
              target="_blank"
            >
              <En>here</En>
              <Fr>ici</Fr>
            </a>
            .
          </Typography>
          <SelectMultipleInput
            name="role"
            value={value.role || []}
            onChange={(e) => onChange(e)}
            options={roleCodes}
            optionLabels={roleCodes.map(camelToSentenceCase)}
            disabled={disabled}
          />
        </Grid>
      )}

      <Grid item xs>
        <Grid container direction="column" spacing={1}>
          {/* Organization */}
          <Grid item xs>
            <Typography>
              <En>Organization</En>
              <Fr>Organisation</Fr>
            </Typography>
          </Grid>
          <Grid item xs>
            <TextField
              label={<I18n en="Name" fr="Nom" />}
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
              label={<I18n en="Email" fr="Email" />}
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
          <En>Individual</En>
          <Fr>Individuel</Fr>
        </Typography>
        <TextField
          label={<I18n en="Name" fr="Nom" />}
          name="indName"
          value={value.indName}
          onChange={onChange}
          disabled={disabled}
          fullWidth
        />

        <TextField
          label={<I18n en="Position" fr="Position" />}
          name="indPosition"
          value={value.indPosition}
          onChange={onChange}
          disabled={disabled}
          fullWidth
        />
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
  );
};

export default Contact;
