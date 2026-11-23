import {
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import FormSection from "../FormShell/FormSection";
import FormField from "../FormShell/FormField";
import { useParams } from "react-router-dom";

import { OpenInNew } from "@mui/icons-material";
import { En, Fr, I18n } from "../I18n";

import MapSelect from "../FormComponents/MapSelect";

import SelectInput from "../FormComponents/SelectInput";
import BilingualTextInput from "../FormComponents/BilingualTextInput";
import { depthDirections } from "../../isoCodeLists";
import { resourceTypeIncludes } from "../../utils/normalizeResourceType";

import { validateField } from "../../utils/validate";

const OpenEPSGDefn = ({ url }) => {
  const { language } = useParams();
  return (
    <IconButton
      aria-label={
        language === "fr"
          ? "Ouvrir la définition EPSG dans une nouvelle fenêtre"
          : "Open EPSG definition in new window"
      }
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

// How to choose a drawing method; shown as the map field's guidance.
const chooseAToolGuidance = (
  <I18n>
    <En>
      <div>
        You can define the spatial extent of the dataset using one of the
        following options:
      </div>
      <ul>
        <li>
          Draw a bounding box or polygon using the tools on the left side of the
          map;
        </li>
        <li>
          Enter the coordinates (decimal degrees) manually using the fields
          beside the map;
        </li>
        <li>
          Type the name of a location, and its boundaries will automatically be
          drawn on the map (those can be edited).
        </li>
      </ul>
      <div>
        Choose the method that best represents the geographic distribution of
        your data:
      </div>
      <ul>
        <li>
          For broadly distributed data in the open ocean, a bounding box may be
          most appropriate;
        </li>
        <li>
          For tightly clustered coastal data, a polygon may better represent the
          sampled area by excluding land or unsampled regions;
        </li>
        <li>
          Whether data were collected at a single location or across multiple
          locations, define one area that encompasses all locations.
        </li>
      </ul>
      <div>
        If the data is sensitive (endangered species or protected ecosystems),
        use a more general area rather than the exact location of the
        observations.
      </div>
    </En>
    <Fr>
      <div>
        Vous pouvez définir l&apos;étendue spatiale du jeu de données de
        l&apos;une des façons suivantes :
      </div>
      <ul>
        <li>
          Tracer un cadre ou un polygone à l&apos;aide des outils situés à
          gauche de la carte ;
        </li>
        <li>
          Entrer les coordonnées (degrés décimaux) manuellement dans les champs
          à côté de la carte ;
        </li>
        <li>
          Saisir le nom d&apos;un lieu : ces limites seront automatiquement
          créées sur la carte (ces limites peuvent être modifiées directement
          sur la carte).
        </li>
      </ul>
      <div>
        Choisissez l&apos;outil qui représente le mieux la distribution
        géographique de vos données :
      </div>
      <ul>
        <li>
          Pour des données largement réparties en milieu océanique, une boîte
          englobante peut être plus appropriée ;
        </li>
        <li>
          Pour des données côtières regroupées dans une zone restreinte, un
          polygone peut mieux représenter la zone échantillonnée en excluant les
          terres ou les zones non échantillonnées ;
        </li>
        <li>
          Que les données aient été collectées à un endroit ou à plusieurs,
          définissez une zone unique englobant tous les sites.
        </li>
      </ul>
      <div>
        Si les données sont sensibles (espèces protégées ou des habitats
        vulnérables), privilégiez une emprise spatiale généralisée plutôt que la
        localisation exacte des observations.
      </div>
    </Fr>
  </I18n>
);

const SpatialTab = ({ disabled, record, handleUpdateRecord, updateRecord }) => {
  const { language } = useParams();
  const noVerticalExtent =
    record.noVerticalExtent && record.noVerticalExtent !== "false";
  const mapData = record.map || {};
  // Optional for every other topic category, so a record saved before this
  // field was hidden keeps it editable rather than stranding the text.
  const showExtentDescription =
    resourceTypeIncludes(record.resourceType, "biota") ||
    Boolean(mapData.description?.en || mapData.description?.fr);

  const fr = language === "fr";
  const verticalComplete =
    validateField(record, "verticalExtentDirection") &&
    validateField(record, "verticalExtentMin") &&
    validateField(record, "verticalExtentMax");

  return (
    <Stack spacing={2}>
      <FormSection
        title={<I18n en="Geographic extent" fr="Étendue géographique" />}
      >
        <Stack spacing={4}>
          <FormField
            id="field-map"
            label={<I18n en="Area covered" fr="Zone couverte" />}
            required
            complete={validateField(record, "map")}
            hint={
              <I18n>
                <En>
                  Search for a place name, draw on the map, or enter bounding
                  box or polygon coordinates.
                </En>
                <Fr>
                  Recherchez un lieu par son nom, tracez sur la carte ou
                  saisissez les coordonnées d&apos;un cadre englobant ou
                  d&apos;un polygone.
                </Fr>
              </I18n>
            }
            guidance={chooseAToolGuidance}
          >
            <MapSelect
              mapData={mapData}
              updateMap={updateRecord("map")}
              disabled={disabled}
              record={record}
            />
          </FormField>

          {showExtentDescription && (
            <FormField
              id="field-mapDescription"
              label={
                <I18n
                  en="Description of the area"
                  fr="Description de la zone"
                />
              }
              required={resourceTypeIncludes(record.resourceType, "biota")}
              complete={Boolean(mapData.description)}
              hint={
                <I18n
                  en="Required for Biota (biological) datasets."
                  fr="Obligatoire pour les jeux de données Biote (biologiques)."
                />
              }
              guidance={
                <I18n
                  en="A text description of the geographic area covered by this dataset or study."
                  fr="Une description textuelle de la zone géographique couverte par ce jeu de données."
                />
              }
            >
              <BilingualTextInput
                value={mapData.description}
                onChange={(e) =>
                  updateRecord("map")({
                    ...mapData,
                    description: e.target.value,
                  })
                }
                name="description"
                disabled={disabled}
              />
            </FormField>
          )}
        </Stack>
      </FormSection>

      <FormSection title={<I18n en="Vertical extent" fr="Étendue verticale" />}>
        <FormField
          id="field-verticalExtentMin"
          label={
            <I18n
              en="Depth or height range, in metres"
              fr="Plage de profondeur ou de hauteur, en mètres"
            />
          }
          required
          complete={noVerticalExtent || verticalComplete}
          hint={
            <I18n
              en="Where the instruments recorded data. Choose depth or height, or give an EPSG code."
              fr="Où les instruments ont enregistré des données. Choisissez profondeur ou hauteur, ou indiquez un code EPSG."
            />
          }
          guidance={
            <>
              <p>
                <I18n>
                  <En>
                    This captures the minimum and maximum depths (or height from
                    sea floor) where the instrument recorded data.
                  </En>
                  <Fr>
                    Cela permet de renseigner les profondeurs minimales et
                    maximales (ou la hauteur depuis le fond marin) où
                    l'instrument a enregistré des données.
                  </Fr>
                </I18n>
              </p>
              <p>
                <I18n>
                  <En>
                    <b>Depth positive</b>: depth is recorded with positive
                    values (i.e. a maximum value of 150m implies 150m below the
                    water surface).
                  </En>
                  <Fr>
                    <b>Profondeur positive</b> : la profondeur est enregistrée
                    avec des valeurs positives (c’est-à-dire qu’une valeur
                    maximale de 150 m indique que les enregistrements ont été
                    effectués à un maximum de 150 m au-dessous de la surface).
                  </Fr>
                </I18n>
                <OpenEPSGDefn url="https://epsg.io/5831" />
              </p>
              <p>
                <I18n>
                  <En>
                    <b>Height positive</b>: height is the elevation from water
                    surface (i.e. a maximum value of 150m implies 150m above the
                    water surface).
                  </En>
                  <Fr>
                    <b>Hauteur positive</b> : la hauteur est l'altitude par
                    rapport à la surface de l'eau (c'est-à-dire qu'une valeur
                    maximale de 150 m implique 150 m au-dessus de la surface de
                    l'eau).
                  </Fr>
                </I18n>
                <OpenEPSGDefn url="https://epsg.io/5829" />
              </p>
            </>
          }
        >
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
                <En>
                  This dataset does not have a depth or height (value will be
                  set to zero)
                </En>
                <Fr>
                  Ce jeu de données n'a ni profondeur ni hauteur (la valeur sera
                  zéro)
                </Fr>
              </I18n>
            }
          />
          {!noVerticalExtent && (
            <Grid
              container
              columnSpacing={2}
              rowSpacing={2}
              alignItems="flex-start"
              sx={{ mt: 1 }}
            >
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ fontWeight: 500, color: "text.secondary", mb: 0.5 }}
                >
                  <I18n en="Reference" fr="Référence" />
                </Typography>
                <SelectInput
                  value={record.verticalExtentDirection || ""}
                  onChange={handleUpdateRecord("verticalExtentDirection")}
                  options={Object.keys(depthDirections)}
                  optionLabels={Object.values(depthDirections).map(
                    (e) => e[language],
                  )}
                  ariaLabel={fr ? "Référence verticale" : "Vertical reference"}
                  disabled={disabled}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  value={record.verticalExtentEPSG}
                  onChange={handleUpdateRecord("verticalExtentEPSG")}
                  label={<I18n en="or EPSG code" fr="ou code EPSG" />}
                  fullWidth
                  type="number"
                  disabled={disabled}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2.5 }}>
                <TextField
                  value={record.verticalExtentMin}
                  onChange={handleUpdateRecord("verticalExtentMin")}
                  label={<I18n en="Minimum (m)" fr="Minimum (m)" />}
                  fullWidth
                  type="number"
                  disabled={disabled}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2.5 }}>
                <TextField
                  value={record.verticalExtentMax}
                  onChange={handleUpdateRecord("verticalExtentMax")}
                  label={<I18n en="Maximum (m)" fr="Maximum (m)" />}
                  fullWidth
                  type="number"
                  disabled={disabled}
                />
              </Grid>
            </Grid>
          )}
        </FormField>
      </FormSection>
    </Stack>
  );
};

export default SpatialTab;
