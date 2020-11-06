import { Paper, TextField, Typography, Grid } from "@material-ui/core";
import React from "react";
import { useParams } from "react-router-dom";

import { En, Fr } from "../I18n";
import RequiredMark from "./RequiredMark";

import MapSelect from "./MapSelect";
import { camelToSentenceCase } from "../../utils/misc";
import SelectInput from "./SelectInput";
import { depthDirections } from "../../isoCodeLists";
import translate from "../../utils/i18n";

const SpatialTab = ({
  disabled,
  record,
  handleInputChange,
  paperClassValidate,
  paperClass,
}) => {
  const { language } = useParams();

  return (
    <Grid>
      <Paper style={paperClassValidate("map")}>
        <Typography style={{ paddingBottom: "15px" }}>
          <En>
            You can draw a bounding box or polygon for the dataset using the
            Polygon or Box buttons at the right side of them form, or enter
            using the fields below. Either bounding box or Polygon is required.
          </En>
          <Fr>
            Vous pouvez dessiner un cadre de sélection ou un polygone pour le
            jeu de données, ou entrer à l'aide des champs ci-dessous. Le cadre
            de sélection ou le polygone est requis.
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
          <En>
            Vertical extent (m). <br />
            Depth positive: Depth is recorded with positive values (i.e. a
            maximum value of 150m implies 150m below the surface).
            <br />
            Heigth positive: Depth is the elevation from the sea floor (i.e. a
            maximum value of 150m implies 150m above the sea floor).
          </En>
          <Fr>
            Étendue verticale (m).
            <br />
            Profondeur positive: La profondeur est enregistrée avec des valeurs
            positives (c'est-à-dire une valeur maximale de 150 m implique 150 m
            au-dessous de la surface).
            <br />
            Hauteur positive: La profondeur est l'élévation depuis le fond marin
            (c'est-à-dire une valeur maximale de 150 m implique 150 m au-dessus
            du fond marin)
          </Fr>
          <RequiredMark />
        </Typography>
        <Grid container direction="row" spacing={3}>
          <Grid item xs={2}>
            <div style={paperClassValidate("verticalExtentDirection")}>
              <SelectInput
                name="verticalExtentDirection"
                value={record.verticalExtentDirection}
                onChange={(e) => handleInputChange(e)}
                options={depthDirections}
                optionLabels={depthDirections.map((e) =>
                  camelToSentenceCase(translate(e, language))
                )}
                disabled={disabled}
              />
            </div>
          </Grid>
          <Grid item xs={2}>
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
          </Grid>
          <Grid item xs={2}>
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
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default SpatialTab;
