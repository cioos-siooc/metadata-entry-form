import React from "react";

import { TextField, Typography } from "@material-ui/core";
import { I18n, En, Fr } from "../I18n";
import { roleCodes } from "../../isoCodeLists";
import { camelToSentenceCase } from "../../utils/misc";
import SelectInput from "./SelectInput";

const Contact = ({ onChange, value, showRolePicker, disabled }) => {
  return (
    <div>
      {showRolePicker && (
        <div>
          <Typography>
            <En>What is their role?</En>
            <Fr>Quel est leur rôle ?</Fr>
          </Typography>
          <SelectInput
            name="role"
            value={value.role}
            onChange={(e) => onChange(e)}
            options={roleCodes}
            optionLabels={roleCodes.map(camelToSentenceCase)}
            disabled={disabled}
          />
        </div>
      )}
      <div>
        {/* Organization */}
        <Typography>
          <En>Organization</En>
          <Fr>Organisation</Fr>
        </Typography>
        <TextField
          label={<I18n en="Name" fr="Nom" />}
          name="orgName"
          value={value.orgName}
          onChange={onChange}
          disabled={disabled}
          fullWidth
        />
        <TextField
          label={<I18n en="URL" fr="URL" />}
          name="orgURL"
          value={value.orgURL}
          onChange={onChange}
          fullWidth
        />
        <TextField
          label={<I18n en="Address" fr="Adresse" />}
          name="orgAdress"
          value={value.orgAdress}
          onChange={onChange}
          disabled={disabled}
          fullWidth
        />
        <TextField
          label={<I18n en="City" fr="Ville" />}
          name="orgCity"
          value={value.orgCity}
          onChange={onChange}
          fullWidth
        />
        <TextField
          label={<I18n en="Country" fr="Pays" />}
          name="orgCountry"
          value={value.orgCountry}
          onChange={onChange}
          disabled={disabled}
          fullWidth
        />
        <TextField
          label={<I18n en="Email" fr="Email" />}
          name="orgEmail"
          value={value.orgEmail}
          onChange={onChange}
          fullWidth
        />
      </div>
      <div>
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
      </div>
    </div>
  );
};

export default Contact;
