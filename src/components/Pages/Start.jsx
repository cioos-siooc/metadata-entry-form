import React from "react";
import { Typography } from "@material-ui/core";
import { En, Fr } from "../I18n";

const RegionSelect = () => {
  return (
    <div>
      <Typography variant="h5">
        <En>CIOOS Regions</En>
        <Fr>Régions CIOOS</Fr>
      </Typography>
      <Typography>
        <En>Which region are you submitting metadata for?</En>
        <Fr>Dans quelle région soumettez-vous des métadonnées ?</Fr>
      </Typography>
    </div>
  );
};

export default RegionSelect;
