import React from "react";

import { Typography, Paper } from "@material-ui/core";

import MapSelect from "./MapSelect";
import { En, Fr } from "../I18n";

const IdentificationTab = ({
  disabled,
  record,
  handleInputChange,
  paperClass,
}) => (
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
  </div>
);

export default IdentificationTab;
