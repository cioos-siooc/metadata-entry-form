import { Paper, TextField, Typography, Grid } from "@material-ui/core";
import React from "react";
import { En, Fr } from "../I18n";
import RequiredMark from "./RequiredMark";

import MapSelect from "./MapSelect";

const SpatialTab = ({
  disabled,
  record,
  handleInputChange,
  paperClassValidate,
  paperClass,
}) => (
  <Grid>
    <Paper style={paperClassValidate("map")}>
      <Typography style={{ paddingBottom: "15px" }}>
        <En>
          Select or enter a bounding box for the dataset. Either bounding box or
          Polygon is required.
        </En>
        <Fr>
          Sélectionnez ou entrez une zone de délimitation pour l'ensemble de
          données. Le cadre de sélection ou le polygone est requis..
        </Fr>
        <RequiredMark />
      </Typography>

      <MapSelect
        value={record.map}
        name="map"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>
    <Paper style={paperClass}>
      <Typography>
        <En>Vertical extent (m)</En>
        <Fr>Étendue verticale (m)</Fr>
        <RequiredMark />
      </Typography>
      <div style={paperClassValidate("verticalExtentMin")}>
        <TextField
          name="verticalExtentMin"
          value={record.verticalExtentMin}
          onChange={handleInputChange}
          label="Min"
          type="number"
          disabled={disabled}
        />
      </div>
      <div style={paperClassValidate("verticalExtentMax")}>
        <TextField
          name="verticalExtentMax"
          value={record.verticalExtentMax}
          onChange={handleInputChange}
          label="Max"
          type="number"
          disabled={disabled}
        />
      </div>
    </Paper>
  </Grid>
);

export default SpatialTab;
