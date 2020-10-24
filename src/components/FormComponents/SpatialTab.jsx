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
          You can draw a bounding box or polygon for the dataset, or enter using
          the fields below. Either bounding box or Polygon is required.
        </En>
        <Fr>
          Vous pouvez dessiner un cadre de sélection ou un polygone pour le jeu
          de données, ou entrer à l'aide des champs ci-dessous. Le cadre de
          sélection ou le polygone est requis.
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
        <En>Vertical extent (m). Depth is positive</En>
        <Fr>Étendue verticale (m). La profondeur est positive</Fr>
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
