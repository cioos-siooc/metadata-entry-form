import { Paper, TextField, Typography } from "@material-ui/core";
import React from "react";
import { En, Fr } from "../I18n";

import MapSelect from "./MapSelect";

const SpatialTab = ({ disabled, record, handleInputChange, paperClass }) => (
  <div>
    <Paper className={paperClass}>
      <Typography>
        <En>Select or enter a bounding box for the dataset.</En>
        <Fr>
          Sélectionnez ou entrez une zone de délimitation pour l'ensemble de
          données.
        </Fr>
      </Typography>

      <MapSelect
        value={record.map}
        name="map"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>
    <Paper className={paperClass}>
      <Typography>
        <En>Vertical extent</En>
        <Fr>Étendue verticale</Fr>
      </Typography>

      <TextField
        name="verticalExtentMin"
        value={record.verticalExtentMin}
        onChange={handleInputChange}
        label="Min"
        type="number"
        InputLabelProps={{
          shrink: true,
        }}
      />
      <TextField
        name="verticalExtentMax"
        value={record.verticalExtentMax}
        onChange={handleInputChange}
        label="Max"
        type="number"
        InputLabelProps={{
          shrink: true,
        }}
      />
    </Paper>
  </div>
);

export default SpatialTab;
