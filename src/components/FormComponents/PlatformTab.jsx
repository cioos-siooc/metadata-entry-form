import React from "react";

import { Typography, Paper, TextField, Grid } from "@material-ui/core";
import Instruments from "./Instruments";

import BilingualTextInput from "./BilingualTextInput";
import SelectInput from "./SelectInput";
import { roleCodes } from "../../isoCodeLists";

import { En, Fr, I18n } from "../I18n";
import { camelToSentenceCase } from "../../utils/misc";

const PlatformTab = ({ disabled, record, handleInputChange, paperClass }) => (
  <>
    <Paper style={paperClass}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
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
        </Grid>
        <Grid item xs>
          {" "}
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
        </Grid>

        <Grid item xs>
          {" "}
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
        </Grid>
        <Grid item xs>
          {" "}
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
        </Grid>
        <Grid item xs>
          {" "}
          <Typography>
            <En>What is the naming authority of the platform?</En>
            <Fr>Quelle est l'autorité de dénomination de la plateforme ?</Fr>
          </Typography>
          <TextField
            value={record.platformAuthority}
            name="platformAuthority"
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={disabled}
          />
        </Grid>
      </Grid>
    </Paper>

    <Grid item xs>
      <Paper style={paperClass}>
        <Typography variant="h5">Instruments</Typography>
        <Typography>
          <En>Add instruments associated with this platform.</En>
          <Fr>Ajoutez des instruments associés à cette plateforme.</Fr>
        </Typography>
      </Paper>
      <Instruments
        value={record.instruments || []}
        onChange={handleInputChange}
        name="instruments"
        disabled={disabled}
        paperClass={paperClass}
      />
    </Grid>
  </>
);

export default PlatformTab;
