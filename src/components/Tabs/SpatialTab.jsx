import { Paper, TextField, Grid, Tooltip, IconButton } from "@material-ui/core";
import React from "react";
import { useParams } from "react-router-dom";

import { OpenInNew } from "@material-ui/icons";
import { En, Fr, I18n } from "../I18n";
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

  return (
    <Grid>
      <Paper style={paperClass}>
        <QuestionText style={{ paddingBottom: "15px" }}>
          <I18n>
            <En>What is the spatial extent of the dataset?</En>
            <Fr>Quelle est l'étendue géographique du jeu de données?</Fr>
          </I18n>{" "}
          <SupplementalText>
            <I18n>
              <En>
                You can draw a bounding box or polygon for the dataset using the
                Polygon or Box buttons at the left side of them form.
                Alternatively you can enter them using the fields below. Either
                a bounding box or a Polygon is required.
              </En>
              <Fr>
                Vous pouvez tracer un cadre ou un polygone pour situer
                géographiquement votre jeu de données. Vous pouvez aussi
                localiser l’aire géographique couverte par votre jeu de données
                en inscrivant les coordonnées géographiques (degrés décimaux)
                dans les champs apparaissant sous la carte. Cette section doit
                obligatoirement être complétée.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        <MapSelect
          mapData={record.map}
          updateMap={updateRecord("map")}
          handleUpdateMap={updateRecord("map")}
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
                  Cela permet de capturer les profondeurs minimales et maximales
                  (ou la hauteur de fond marin) où l'instrument a enregistré des
                  données.
                </Fr>
              </I18n>
            </div>

            <div style={{ paddingTop: "5px" }}>
              <I18n>
                <En>
                  Depth positive: Depth is recorded with positive values (i.e. a
                  maximum value of 150m implies 150m below sea level).
                </En>
                <Fr>
                  Profondeur positive: La profondeur est enregistrée avec des
                  valeurs positives (c'est-à-dire une valeur maximale de 150 m
                  implique 150 m au-dessous de la surface).
                </Fr>
              </I18n>
              <OpenEPSGDefn url="https://epsg.io/5831" />
            </div>
            <div>
              <I18n>
                <En>
                  Height Positive: Altitude is the elevation from sea level (i.e. a
                  maximum value of 150m implies 150m above sea level).
                </En>
                <Fr>
                  Hauteur positive: L'altitude est l'altitude par rapport au niveau de la mer
                  (c'est-à-dire qu'une valeur maximale de 150 m implique 150 m au-dessus du niveau de la mer).
                </Fr>
              </I18n>
              <OpenEPSGDefn url="https://epsg.io/5829" />
            </div>
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
              value={record.verticalExtentDirection || ""}
              onChange={handleUpdateRecord("verticalExtentDirection")}
              options={depthDirections}
              optionLabels={depthDirections.map((e) =>
                camelToSentenceCase(translate(e, language))
              )}
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
      </Paper>
    </Grid>
  );
};

export default SpatialTab;
