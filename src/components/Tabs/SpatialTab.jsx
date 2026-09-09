import {
  Paper,
  TextField,
  Grid,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";

import { OpenInNew } from "@mui/icons-material";
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
            <I18n>
              <En>
                <div>
                  You can define the spatial extent of the dataset using one of
                  the following options:
                </div>
                <ul>
                  <li>
                    Draw a bounding box or polygon using the tools on the left
                    side of the map;
                  </li>
                  <li>
                    Enter the coordinates (decimal degrees) manually using the
                    fields below;
                  </li>
                  <li>
                    Type the name of a location, and its boundaries will
                    automatically be drawn on the map (those can be edited).
                  </li>
                </ul>
                <div>
                  Choose the method that best represents the geographic
                  distribution of your data:
                </div>
                <ul>
                  <li>
                    For broadly distributed data in the open ocean, a bounding
                    box may be most appropriate;
                  </li>
                  <li>
                    For tightly clustered coastal data, a polygon may better
                    represent the sampled area by excluding land or unsampled
                    regions;
                  </li>
                  <li>
                    Whether data were collected at a single location or across
                    multiple locations, define one area that encompasses all
                    locations.
                  </li>
                </ul>
                <div>
                  If the data is sensitive (endangered species or protected
                  ecosystems), use a more general area rather than the exact
                  location of the observations.
                </div>
              </En>
              <Fr>
                <div>
                  Vous pouvez définir l&apos;étendue spatiale du jeu de données
                  de l&apos;une des façons suivantes :
                </div>
                <ul>
                  <li>
                    Tracer un cadre ou un polygone à l&apos;aide des outils
                    situés à gauche de la carte ;
                  </li>
                  <li>
                    Entrer les coordonnées (degrés décimaux) manuellement dans
                    les champs ci-dessous ;
                  </li>
                  <li>
                    Saisir le nom d&apos;un lieu : ces limites seront
                    automatiquement créées sur la carte (ces limites peuvent
                    être modifiées directement sur la carte).
                  </li>
                </ul>
                <div>
                  Choisissez l&apos;outil qui représente le mieux la
                  distribution géographique de vos données :
                </div>
                <ul>
                  <li>
                    Pour des données largement réparties en milieu océanique,
                    une boîte englobante peut être plus appropriée ;
                  </li>
                  <li>
                    Pour des données côtières regroupées dans une zone
                    restreinte, un polygone peut mieux représenter la zone
                    échantillonnée en excluant les terres ou les zones non
                    échantillonnées ;
                  </li>
                  <li>
                    Que les données aient été collectées à un endroit ou à
                    plusieurs, définissez une zone unique englobant tous les
                    sites.
                  </li>
                </ul>
                <div>
                  Si les données sont sensibles (espèces protégées ou des
                  habitats vulnérables), privilégiez une emprise spatiale
                  généralisée plutôt que la localisation exacte des
                  observations.
                </div>
              </Fr>
            </I18n>
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
          <Grid size={5}>
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
          <Grid size={2}>
            <TextField
              value={record.verticalExtentMin}
              onChange={handleUpdateRecord("verticalExtentMin")}
              label="Min"
              fullWidth
              type="number"
              disabled={disabled}
            />
          </Grid>
          <Grid size={2}>
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
