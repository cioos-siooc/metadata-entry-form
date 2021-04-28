import { Paper, TextField, Grid } from "@material-ui/core";
import React from "react";
import { useParams } from "react-router-dom";

import { En, Fr } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";

import MapSelect from "../FormComponents/MapSelect";
import { camelToSentenceCase } from "../../utils/misc";
import SelectInput from "../FormComponents/SelectInput";
import { depthDirections } from "../../isoCodeLists";
import translate from "../../utils/i18n";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";

const SpatialTab = ({ disabled, record, handleInputChange }) => {
  const { language } = useParams();

  return (
    <Grid>
      <Paper style={paperClass}>
        <QuestionText style={{ paddingBottom: "15px" }}>
          <En>What is the spatial extent of the dataset?</En>
          <Fr>Quelle est l'étendue spatiale du jeu de données?</Fr>{" "}
          <SupplementalText>
            <En>
              You can draw a bounding box or polygon for the dataset using the
              Polygon or Box buttons at the left side of them form.
              Alternatively you can enter them using the fields below. Either a
              bounding box or a Polygon is required.
            </En>
            <Fr>
              Vous pouvez tracer un cadre ou un polygone pour situer
              géographiquement votre jeu de données. Vous pouvez aussi localiser
              l’aire géographique couverte par votre jeu de données en
              inscrivant les coordonnées géographiques (degrés décimaux) dans
              les champs sous la carte. Cette section doit obligatoirement être
              complétée.
            </Fr>
          </SupplementalText>
        </QuestionText>
        <MapSelect
          value={record.map}
          name="map"
          onChange={handleInputChange}
          disabled={disabled}
          record={record}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the vertical extent of the dataset in meters?</En>
          <Fr>Quelle est l'étendue verticale du jeu de données en mètres?</Fr>
          <RequiredMark
            passes={
              validateField(record, "verticalExtentDirection") &&
              validateField(record, "verticalExtentMin") &&
              validateField(record, "verticalExtentMax")
            }
          />

          <SupplementalText>
            <En>
              <p>
                This captures the minimum and maximum depths (or height from sea
                floor) where the instrument recorded data.
              </p>
              <p>
                Depth positive: Depth is recorded with positive values (i.e. a
                maximum value of 150m implies 150m below the surface).
                <br />
                Heigth positive: Depth is the elevation from the sea floor (i.e.
                a maximum value of 150m implies 150m above the sea floor).
              </p>
            </En>
            <Fr>
              <p>
                Profondeur positive: La profondeur est enregistrée avec des
                valeurs positives (c'est-à-dire une valeur maximale de 150 m
                implique 150 m au-dessous de la surface).
              </p>
              <p>
                Hauteur positive: La profondeur est l'élévation depuis le fond
                marin (c'est-à-dire une valeur maximale de 150 m implique 150 m
                au-dessus du fond marin)
              </p>
            </Fr>
          </SupplementalText>
        </QuestionText>
        <Grid
          container
          direction="row"
          justify="flex-start"
          alignItems="flex-start"
          spacing={4}
        >
          <Grid item xs={5}>
            <SelectInput
              name="verticalExtentDirection"
              value={record.verticalExtentDirection || ""}
              onChange={(e) => handleInputChange(e)}
              options={depthDirections}
              optionLabels={depthDirections.map((e) =>
                camelToSentenceCase(translate(e, language))
              )}
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              name="verticalExtentMin"
              value={record.verticalExtentMin}
              onChange={handleInputChange}
              label="Min"
              fullWidth
              type="number"
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              name="verticalExtentMax"
              value={record.verticalExtentMax}
              onChange={handleInputChange}
              label="Max"
              fullWidth
              type="number"
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
};

export default SpatialTab;
