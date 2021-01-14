/* eslint-disable no-case-declarations */
/* eslint-disable no-underscore-dangle */
import React, { useState } from "react";

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

const MapSelect = ({ onChange, value = {}, name, disabled, record }) => {
  function onEditPath() {}

  function onDeleted() {
    const newVal = {
      north: "",
      south: "",
      east: "",
      west: "",
      polygon: "",
    };

    onChange({ target: { name, value: newVal } });
  }

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

  function handleChange(e) {
    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    const newData = { ...value, [e.target.name]: e.target.value };

    onChange({ target: { name, value: newData } });
  }

  function handleChangePoly(e) {
    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    const newData = { ...value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
  }

  function limitDecimals(x) {
    return Number.parseFloat(x).toPrecision(4);
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

  const hasBoundingBox = (
    test_n = value.north,
    test_s = value.south,
    test_e = value.east,
    test_w = value.west
  ) => {
    const test =
      coordTest.test(test_n) &&
      coordTest.test(test_s) &&
      coordTest.test(test_e) &&
      coordTest.test(test_w);

    return test;
  };

  const hasPolygon = (test_string = value.polygon) => {
    return polyTest.test(test_string);
  };

  const onCreated = (e) => {
    const { layer, layerType } = e;

    // remove any existing shapes
    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    switch (layerType) {
      case "polygon":
        const points = layer.getLatLngs()[0];
        const polygonStrings = points.map(
          ({ lat, lng }) => `${limitDecimals(lat)},${limitDecimals(lng)}`
        );
        const polygon = polygonStrings.concat(polygonStrings[0]).join(" ");

        onChange({ target: { name, value: { polygon } } });
        break;

      default: // Assume rectangle
      case "rectangle":
        const bounds = layer.getBounds();

        let { lat: north, lng: east } = bounds.getNorthEast().wrap();
        let { lat: south, lng: west } = bounds.getSouthWest().wrap();

        north = limitDecimals(north);
        south = limitDecimals(south);
        east = limitDecimals(east);
        west = limitDecimals(west);

        const newValue = { north, south, east, west };
        onChange({ target: { name, value: newValue } });
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
      onDeleted();
    },
  });

  const bboxIsDrawn = Boolean(
    value.north || value.south || value.east || value.west
  );

  const fieldsAreEmpty = !bboxIsDrawn && !value.polygon;

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
              onEdited={onEditPath}
              onCreated={onCreated}
              onDeleted={onDeleted}
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
            <LeafletPolygon positions={parsePolyString(value.polygon)} />
          )}

          {hasBoundingBox() && (
            <LeafletRectangle
              bounds={[
                [value.north, value.east],
                [value.south, value.west],
              ]}
            />
          )}
        </FeatureGroup>
      </Map>
      <br />
      <QuestionText>
        <En>Bounding Box Coordinates</En>
        <Fr>
          Veuillez fournir les coordonnées en degrés décimaux et non en secondes
          décimales.
        </Fr>
        {(bboxIsDrawn || fieldsAreEmpty) && (
          <RequiredMark passes={validateField(record, "map")} />
        )}
        <SupplementalText>
          <En>
            If you are providing a bounding box, please provide the coordinates
            in decimal degrees and not in decimal minutes seconds.
          </En>
          <Fr>
            If you are providing a bounding box, please provide the coordinates
            in decimal degrees and not in decimal minutes seconds.
          </Fr>
        </SupplementalText>
      </QuestionText>
      <Grid container direction="row" spacing={3}>
        <Grid item xs={2}>
          <TextField
            name="north"
            label={<I18n en="North" fr="Nord" />}
            value={value.north || ""}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            onChange={handleChange}
            type="number"
            disabled={disabled || Boolean(value.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            name="south"
            label={<I18n en="South" fr="Sud" />}
            value={value.south || ""}
            onChange={handleChange}
            type="number"
            disabled={disabled || Boolean(value.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            name="east"
            label={<I18n en="East" fr="Est" />}
            value={value.east || ""}
            onChange={handleChange}
            type="number"
            disabled={disabled || Boolean(value.polygon)}
          />
        </Grid>
        <Grid item xs={2}>
          <TextField
            name="west"
            value={value.west || ""}
            label={<I18n en="West" fr="Ouest" />}
            onChange={handleChange}
            type="number"
            disabled={disabled || Boolean(value.polygon)}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ margin: "20px", marginLeft: "20%" }}>
        OR
      </Typography>

      <QuestionText>
        <En>Polygon coordinates</En>
        <Fr>Les coordonnées des polygones</Fr>
        {(!bboxIsDrawn || fieldsAreEmpty) && (
          <RequiredMark passes={validateField(record, "map")} />
        )}
        <SupplementalText>
          <En>
            If you are providing polygon coordinates, they must start and end
            with the same point. Eg,
          </En>
          <Fr>
            Doivent commencer et se terminer par le même point. Par exemple,
          </Fr>{" "}
          48,-128 56,-133 56,-147 48,-128
        </SupplementalText>
      </QuestionText>
      <TextField
        name="polygon"
        value={value.polygon || ""}
        onChange={handleChangePoly}
        type="text"
        fullWidth
        disabled={disabled || bboxIsDrawn}
      />
    </div>
  );
};

export default withLeaflet(MapSelect);
