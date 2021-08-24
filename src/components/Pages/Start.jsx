import React from "react";
import { Typography } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

const RegionSelect = () => {
  return (
    <div>
      <Typography variant="h5">
        <I18n>
          <En>CIOOS Regions</En>
          <Fr>Régions CIOOS</Fr>
        </I18n>
      </Typography>
      <Typography>
        <I18n>
          <En>Which region are you submitting metadata for?</En>
          <Fr>Dans quelle région soumettez-vous des métadonnées ?</Fr>
        </I18n>
      </Typography>
    </div>
  );
};

export default RegionSelect;
