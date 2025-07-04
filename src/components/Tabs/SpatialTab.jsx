import {
  Paper, 
  TextField, 
  Grid, 
  Tooltip, 
  IconButton, 
  FormControlLabel, 
  Checkbox } from "@material-ui/core";
import React from "react";
import { useParams } from "react-router-dom";

import { OpenInNew } from "@material-ui/icons";
import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";

import MapSelect from "../FormComponents/MapSelect";

import SelectInput from "../FormComponents/SelectInput";
import { depthDirections } from "../../isoCodeLists";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";

const OpenEPSGDefn = ({ url }) => {
  return (
    <IconButton
      onClick={() => {
        const win = window.open(url, "_blank");
        win.focus();
      }}
    >
      <Tooltip
        title={
          <I18n
            en="Open EPSG definition in new window"
            fr="Ouvrir la définition EPSG dans une nouvelle fenêtre"
          />
        }
      >
        <OpenInNew />
      </Tooltip>
    </IconButton>
  );
};
const SpatialTab = ({ disabled, record, handleUpdateRecord, updateRecord }) => {
  const { language } = useParams();
  const noVerticalExtent = record.noVerticalExtent && record.noVerticalExtent !== "false";

  return (
    <Grid>
      <Paper style={paperClass}>
        <QuestionText style={{ paddingBottom: "15px" }}>
          <I18n>
            <En>What is the spatial extent of the dataset?</En>
            <Fr>Quelle est l'étendue géographique du jeu de données?</Fr>
          </I18n>

          <SupplementalText>
            <div>
              <I18n>
                <En>
                  You can draw a bounding box or polygon for the dataset using
                  the Polygon or Box buttons at the left side of them form.
                  Alternatively you can enter them using the fields below.
                  Either a bounding box or a Polygon is required.
                </En>
                <Fr>
                  Vous pouvez tracer un cadre ou un polygone pour situer
                  géographiquement votre jeu de données. Vous pouvez aussi
                  localiser l’aire géographique couverte par votre jeu de
                  données en inscrivant les coordonnées géographiques (degrés
                  décimaux) dans les champs apparaissant sous la carte. Cette
                  section doit obligatoirement être complétée.
                </Fr>
              </I18n>
            </div>
            <br />
            <div>
              <I18n>
                <En>
                  Define the geographical area using the tool that meets the
                  geographic distribution of your data. Broadly distributed data
                  in the open ocean might be well served by a bounding box.
                  Tightly clustered coastal data may benefit from a polygon that
                  does not include terrain or unsampled area.
                </En>
                <Fr>
                  Définissez la zone géographique à l'aide de l'outil qui
                  correspond à la distribution géographique de vos données. Par exemple, 
                  l’étendue de données relativement dispersées, localisées en haute mer 
                  est souvent bien représentées par une zone rectangulaire, tandis qu’une représentation 
                  polygonale excluant les terrains ou zones non échantillonnés se prête mieux à 
                  l’étendue de données côtières, avec une résolution spatiale plus fine.
                </Fr>
              </I18n>
            </div>
          </SupplementalText>
        </QuestionText>
        <MapSelect
          mapData={record.map}
          updateMap={updateRecord("map")}
          handleUpdateMap={handleUpdateRecord("map")}
          disabled={disabled}
          record={record}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What is the vertical extent of the dataset in meters?</En>
            <Fr>Quelle est l'étendue verticale du jeu de données en mètres?</Fr>
          </I18n>
          <RequiredMark
            passes={
              validateField(record, "verticalExtentDirection") &&
              validateField(record, "verticalExtentMin") &&
              validateField(record, "verticalExtentMax")
            }
          />

          <SupplementalText>
            <div>
              <I18n>
                <En>
                  This captures the minimum and maximum depths (or height from
                  sea floor) where the instrument recorded data.
                </En>

                <Fr>
                  Cela permet de renseigner les profondeurs minimales et maximales
                  (ou la hauteur depuis le fond marin) où l'instrument a enregistré des
                  données.
                </Fr>
              </I18n>
            </div>

            <div style={{ paddingTop: "5px" }}>
              <I18n>
                <En>
                  Depth positive: Depth is recorded with positive values (i.e. a
                  maximum value of 150m implies 150m below the water surface).
                </En>
                <Fr>
                  Profondeur positive: La profondeur est enregistrée avec des
                  valeurs positives (c’est-à-dire qu’une valeur maximale de 150
                  m indique que les enregistrements ont été effectués à un
                  maximum de 150 m au-dessous de la surface).
                </Fr>
              </I18n>
              <OpenEPSGDefn url="https://epsg.io/5831" />
            </div>
            <div>
              <I18n>
                <En>
                  Height Positive: Height is the elevation from water surface
                  (i.e. a maximum value of 150m implies 150m above the water
                  surface).
                </En>
                <Fr>
                  Hauteur positive: La hauteur est l'altitude par rapport à la
                  surface de l'eau (c'est-à-dire qu'une valeur maximale de 150 m
                  implique 150 m au-dessus de la surface de l'eau).
                </Fr>
              </I18n>
              <OpenEPSGDefn url="https://epsg.io/5829" />
            </div>
          </SupplementalText>
        </QuestionText>
        <FormControlLabel
          disabled={disabled}
          control={
            <Checkbox
              name="noVerticalExtent"
              checked={noVerticalExtent}
              onChange={(e) => {
                const { checked } = e.target;

                updateRecord("noVerticalExtent")(checked);
              }}
            />
          }
          label={
            <I18n>
              <En>This dataset does not have a depth or height, value will be set to zero</En>
              <Fr>Ce jeu de données n'a ni profondeur ni hauteur, la valeur sera zéro</Fr>
            </I18n>
          }
        />
        {!noVerticalExtent ? (
        <Grid
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          spacing={4}
        >
          <Grid item xs={5}>
            <SelectInput
              value={record.verticalExtentDirection || ""}
              onChange={handleUpdateRecord("verticalExtentDirection")}
              options={Object.keys(depthDirections)}
              optionLabels={Object.values(depthDirections).map(
                (e) => e[language]
              )}
              disabled={disabled}
            />
              <p>
              <I18n>
                <En>OR</En>
                <Fr>OU</Fr>
            </I18n>
              </p>
            <TextField
                value={record.verticalExtentEPSG}
                onChange={handleUpdateRecord("verticalExtentEPSG")}
                label="EPSG code"
                fullWidth
                type="number"
                disabled={disabled}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              value={record.verticalExtentMin}
              onChange={handleUpdateRecord("verticalExtentMin")}
              label="Min"
              fullWidth
              type="number"
              disabled={disabled}
            />
          </Grid>
          <Grid item xs={2}>
            <TextField
              value={record.verticalExtentMax}
              onChange={handleUpdateRecord("verticalExtentMax")}
              label="Max"
              fullWidth
              type="number"
              disabled={disabled}
            />
          </Grid>
        </Grid>
        ) : ("")}
      </Paper>
    </Grid>
  );
};

export default SpatialTab;
