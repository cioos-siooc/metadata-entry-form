/* eslint-disable no-case-declarations */
/* eslint-disable no-underscore-dangle */
import React, {  useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { TextField, Grid, Typography } from "@material-ui/core";
import L from "leaflet";
import {
  Map,
  TileLayer,
  FeatureGroup,
  withLeaflet,
  Polygon as LeafletPolygon,
  Rectangle as LeafletRectangle,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { I18n, En, Fr } from "../I18n";

import { QuestionText, SupplementalText } from "./QuestionStyles";
import { validateField } from "../../utils/validate";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";

const MapSelect = ({ updateMap, mapData = {}, disabled, record }) => {
  // On map clear?
  const handleMapClear = (() => {
    const emptySpatial = {
      ...mapData,
      north: "",
      south: "",
      east: "",
      west: "",
      polygon: "",
      descriptionIdentifier: uuidv4(),
    };
    updateMap(emptySpatial);
  });

  const [editableFG, setEditableFG] = useState(null);
  const [, setLayerError] = useState(null);

  const coordTest = /-?\d+\.?\d+/;
  const polyTest = /-?\d+\.?\d+,\s*-?\d+\.?\d+\s*?/g;

  function clearExtraLayers(drawnItems) {
    // From https://stackoverflow.com/questions/61073568/delete-layer-before-creating-a-new-one-with-react-leaflet-draw-in-leaflet
    // Only allow one box on the map at a time
    // if the number of layers is bigger than 1 then delete the first
    if (Object.keys(drawnItems).length > 1) {
      Object.keys(drawnItems).forEach((layerid) => {
        const existingLayers = Object.keys(editableFG.leafletElement._layers)
          .length;

        if (existingLayers === 1) return;

        const layer = drawnItems[layerid];

        editableFG.leafletElement.removeLayer(layer);
      });
    }
  }
  // update a mapData property using an event
  function handleBBoxChange(key) {
    return (e) => {
      const drawnItems = editableFG.leafletElement._layers;
      clearExtraLayers(drawnItems);
      const newData = { ...mapData, [key]: e.target.value };
      updateMap(newData);
    };
  }

  // update a mapData property using an event
  function handleDescriptionChange(key) {
    return (e) => {
      const newData = { ...mapData, [key]: e.target.value };
      updateMap(newData);
    };
  }

  function parsePolyString(polygonList) {
    let coordList = [...polygonList.matchAll(polyTest)].map((match) => {
      return match[0];
    });

    try {
      coordList = coordList.map((point) => {
        return point.split(",").map(Number);
      });
    } catch (error) {
      setLayerError({ error });
    }

    return coordList;
  }

  function limitDecimals(x) {
    return Number(Number.parseFloat(x).toFixed(4));
  }

  // update the polygon property using an event
  function handleChangePoly()  {
    return (e) => {
      if (editableFG) {
        const drawnItems = editableFG.leafletElement._layers;
        clearExtraLayers(drawnItems);
      }

      const newData = { ...mapData, polygon: e.target.value, north: '', south: '', east: '', west: '' }
      try {
        const bounds = L.latLngBounds(parsePolyString(e.target.value))
        const { lat: north, lng: east } = bounds.getNorthEast();
        const { lat: south, lng: west } = bounds.getSouthWest();

        newData.north = limitDecimals(north);
        newData.south = limitDecimals(south);
        newData.east = limitDecimals(east);
        newData.west = limitDecimals(west);
      } catch (ignore) {
        // ignore bounds errors as a missing or invalid polygon string should not take down the app
      }

      updateMap(newData);
    }
  };

  const hasBoundingBox = (
    testN = mapData.north,
    testS = mapData.south,
    testE = mapData.east,
    testW = mapData.west
  ) => {
    const test =
      coordTest.test(testN) &&
      coordTest.test(testS) &&
      coordTest.test(testE) &&
      coordTest.test(testW);

    return test;
  };

  const hasPolygon = (testString = mapData.polygon) => {
    return polyTest.test(testString);
  };

  const onCreated = (e) => {
    const { layer, layerType } = e;

    // remove any existing shapes
    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    switch (layerType) {
      case "polygon": {
        const points = layer.getLatLngs()[0];
        const polygonStrings = points.map(
          ({ lat, lng }) => `${limitDecimals(lat)},${limitDecimals(lng)}`
        );
        const polygon = polygonStrings.concat(polygonStrings[0]).join(" ");

        const polybounds = layer.getBounds();

        let { lat: north, lng: east } = polybounds.getNorthEast();
        let { lat: south, lng: west } = polybounds.getSouthWest();

        north = limitDecimals(north);
        south = limitDecimals(south);
        east = limitDecimals(east);
        west = limitDecimals(west);

        const newValue = { ...mapData, polygon, north, south, east, west };
        updateMap(newValue);
      }
        break;

      default: // Assume rectangle
      case "rectangle": {
        const bounds = layer.getBounds();

        let { lat: north, lng: east } = bounds.getNorthEast();
        let { lat: south, lng: west } = bounds.getSouthWest();

        north = limitDecimals(north);
        south = limitDecimals(south);
        east = limitDecimals(east);
        west = limitDecimals(west);

        const newValue = { ...mapData, north, south, east, west };
        updateMap(newValue);
      }
    }
  };

  const onFeatureGroupReady = (reactFGref) => {
    // store the featureGroup ref for future access to content
    setEditableFG(reactFGref);
  };
  L.EditToolbar.Delete.include({
    enable() {
      // eslint-disable-next-line react/no-this-in-sfc
      this.options.featureGroup.clearLayers();
      handleMapClear();
    },
  });

  const bboxIsDrawn = Boolean(
    mapData.north || mapData.south || mapData.east || mapData.west
  );

  const polyIsDrawn = Boolean(
    mapData.polygon
  );

  const fieldsAreEmpty = !bboxIsDrawn && !mapData.polygon;

  return (
    <div>
      <Map
        style={{ width: "100%", height: "55vh" }}
        center={[50, -100]}
        zoom={3}

        // whenReady={loadExistingExtent}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup
          ref={(featureGroupRef) => {
            onFeatureGroupReady(featureGroupRef);
          }}
        >
          {disabled === false && (
            <EditControl
              position="topleft"
              // onEdited={onEditPath}
              onCreated={onCreated}
              onMapClear={handleMapClear}
              draw={{
                marker: false,
                circle: false,
                polyline: false,
                circlemarker: false,
                polygon: true,
              }}
              edit={{
                edit: false,
              }}
            />
          )}

          {hasPolygon() && (
            <LeafletPolygon positions={parsePolyString(mapData.polygon)} />
          )}

          {/* do not draw the bounding box if we are creating a polygon */}
          {hasBoundingBox() && !hasPolygon() && (
            <LeafletRectangle
              bounds={[
                [mapData.north, mapData.east],
                [mapData.south, mapData.west],
              ]}
            />
          )}
        </FeatureGroup>
      </Map>
      <br />
      <QuestionText>
        <I18n>
          <En>Bounding Box Coordinates</En>
          <Fr>Coordonnées de délimitation - Est, Ouest, Nord, Sud</Fr>
        </I18n>
        {((bboxIsDrawn && !polyIsDrawn) || fieldsAreEmpty) && (
          <RequiredMark passes={validateField(record, "map")} />
        )}

        <SupplementalText>
          <I18n>
            <En>
              If you are providing a bounding box, please provide the
              coordinates in decimal degrees (eg 58.66) and not in decimal
              minutes seconds.
            </En>
            <Fr>
              Si vous fournissez des coordonnées de délimitation, veuillez les
              fournir en <b>degrés décimaux</b>.
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>
      <Grid container direction="row" spacing={3}>
        <Grid item xs={2}>
          <TextField
            label={<I18n en="North" fr="Nord" />}
            value={mapData.north || ""}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            onChange={handleBBoxChange("north")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            label={<I18n en="South" fr="Sud" />}
            value={mapData.south || ""}
            onChange={handleBBoxChange("south")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            label={<I18n en="East" fr="Est" />}
            value={mapData.east || ""}
            onChange={handleBBoxChange("east")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            value={mapData.west || ""}
            label={<I18n en="West" fr="Ouest" />}
            onChange={handleBBoxChange("west")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ margin: "20px", marginLeft: "20%" }}>
        <I18n>
          <En>OR</En>
          <Fr>Ou</Fr>
        </I18n>
      </Typography>

      <QuestionText>
        <I18n>
          <En>Polygon coordinates</En>
          <Fr>Coordonnées du/des polygone(s)</Fr>
        </I18n>
        {(polyIsDrawn || fieldsAreEmpty) && (
          <RequiredMark passes={validateField(record, "map")} />
        )}
        <SupplementalText>
          <I18n>
            <En>
              If you are providing polygon coordinates, they must start and end
              with the same point. Eg,
            </En>
            <Fr>
              La suite de coordonnées doit commencer et se terminer par le même point. Par exemple,
            </Fr>
          </I18n>{" "}
          48,-128 56,-133 56,-147 48,-128
        </SupplementalText>
      </QuestionText>
      <TextField
        value={mapData.polygon || ""}
        onChange={handleChangePoly()}
        type="text"
        fullWidth
        disabled={disabled || (bboxIsDrawn && !polyIsDrawn)}
      />


      <Typography variant="h6" style={{ margin: "20px", marginLeft: "20%" }}>
        <I18n>
          <En>And optionally</En>
          <Fr>Et en option</Fr>
        </I18n>
      </Typography>

      <QuestionText>
        <I18n>
          <En>Describe the Geographic Extent of the dataset. Required for Biological datasets</En>
          <Fr>Décrivez l'étendue géographique du jeu de données. Obligatoire pour les jeux de données biologiques</Fr>
        </I18n>
        {record.resourceType && record.resourceType.includes("biological") && (
          <RequiredMark passes={Boolean(mapData.description)} /> 
        )}
        <SupplementalText>
          <I18n>
            <En>
              <p>
                Optionally you can include a text description of the geographic 
                area covered by this dataset or study. This field is required 
                when filling out biological datasets but is optional for all 
                other dataset types.
              </p>
            </En>
            <Fr>
              <p>
                Vous pouvez éventuellement inclure une description textuelle 
                de la zone géographique. Ce champ est obligatoire pour des jeux de données biologiques, mais est 
                facultatif pour tous autre type de jeux de données.
              </p>
            </Fr>
          </I18n>
        </SupplementalText>
      </QuestionText>

      <BilingualTextInput
        value={mapData.description}
        onChange={handleDescriptionChange("description")}
        name="description"
        disabled={disabled}
      />
    </div>
  );
};

export default withLeaflet(MapSelect);
