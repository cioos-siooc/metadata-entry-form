import React from "react";

import { Typography, Paper, TextField } from "@material-ui/core";
import Instruments from "./Instruments";
import ContactPicker from "./ContactPicker";


import BilingualTextInput from "./BilingualTextInput";
import SelectInput from "./SelectInput";
import { roleCodes } from "../../isoCodeLists";

import { En, Fr, I18n } from "../I18n";
import { camelToSentenceCase } from "../../utils/misc";

const PlatformTab = ({ disabled, record, handleInputChange, paperClass }) => (
  <div>
    <Paper className={paperClass}>
      <div>
        <Typography>
          <En>What is the name of the platform?</En>
          <Fr>Quel est le nom de la plate-forme?</Fr>
        </Typography>
        <TextField
          label={<I18n en="Name" fr="Nom" />}
          name="platformName"
          value={record.platformName}
          onChange={handleInputChange}
          fullWidth
          disabled={disabled}
        />
      </div>
      <div>
        <Typography>
          <En>What is platform ID?</En>
          <Fr>Qu'est-ce que l'ID de plateforme?</Fr>
        </Typography>
        <TextField
          label={<I18n en="Platform ID" fr="ID de plateforme" />}
          name="platformID"
          value={record.platformID}
          onChange={handleInputChange}
          fullWidth
          disabled={disabled}
        />
      </div>

      <div>
        <Typography>
          <En>What is the role of the platform?</En>
          <Fr>Quel est le rôle de la plateforme?</Fr>
        </Typography>
        <SelectInput
          name="platformRole"
          value={record.platformRole}
          onChange={(e) => handleInputChange(e)}
          options={roleCodes}
          optionLabels={roleCodes.map(camelToSentenceCase)}
          disabled={disabled}
        />
      </div>
      <div>
        <Typography>
          <En>Describe the platform</En>
          <Fr>Décrire la plateforme</Fr>
        </Typography>

        <BilingualTextInput
          name="platformDescription"
          value={record.platformDescription}
          onChange={handleInputChange}
          multiline
          disabled={disabled}
        />
      </div>
      <div>
        <Typography>
          <En>Who is charge of the platform?</En>
          <Fr>Qui est le responsable de la plate-forme?</Fr>
        </Typography>
        <ContactPicker
          contactList={record.userContacts}
          value={record.platformAuthority}
          name="platformAuthority"
          onChange={handleInputChange}
        />
      </div>
      <div>
        <Instruments
          value={record.instruments}
          onChange={handleInputChange}
          name="instruments"
          disabled={disabled}
        />
      </div>
    </Paper>
  </div >
);

export default PlatformTab;
