/* eslint-disable no-case-declarations */
/* eslint-disable no-underscore-dangle */
import React, { useState } from "react";

import { TextField } from "@material-ui/core";
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

const MapSelect = ({ onChange, value = {}, name, disabled }) => {
  function onEditPath() {}
  function onDeleted(e) {
    const newVal = {
      north: undefined,
      south: undefined,
      east: undefined,
      west: undefined,
      polygon: undefined,
    };

    const newValue = { ...newVal, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newValue } });
  }

  const [editableFG, setEditableFG] = useState(null);
  const [, setLayerError] = useState(null);

  const coordTest = /-?\d+\.\d+/;
  const polyTest = /-?\d+\.\d+,\s*-?\d+\.\d+\s*?/g;

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

    const newData = { value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
  }

  function limitDecimals(x) {
    return Number.parseFloat(x).toPrecision(4);
  }

  // function loadExistingExtent(e) {
  //   if (value.polygon) {
  //   }

  //   if (value.north && value.south && value.east && value.west) {
  //   }
  // }

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
    // here you have all the stored layers
    const drawnItems = editableFG.leafletElement._layers;

    clearExtraLayers(drawnItems);

    const newShape = drawnItems[Object.keys(drawnItems)[0]];

    switch (e.layerType) {
      case "polygon":
        let polygon = "";
        let polyList = "";
        let endPoint = "";

        newShape._latlngs[0].forEach((polyPoint, index) => {
          const point = `${limitDecimals(polyPoint.lat)},${limitDecimals(
            polyPoint.lng
          )}`;

          if (index === 0) {
            endPoint = point;
          }
          polyList = polyList.concat(" ", point);
        });

        polygon = polyList.concat(" ", endPoint).trim();
        onChange({ target: { name, value: { polygon } } });
        break;

      default: // Assume rectangle
      case "rectangle":
        const bounds = newShape._bounds;

        let { lat: north, lng: east } = bounds._northEast;
        let { lat: south, lng: west } = bounds._southWest;

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
              position="topright"
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
      <div style={{ margin: "10px" }}>
        <TextField
          name="north"
          label="North"
          value={value.north || ""}
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name="south"
          label="South"
          value={value.south || ""}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name="east"
          label="East"
          value={value.east || ""}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name="west"
          value={value.west || ""}
          label="West"
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
      </div>
      <div style={{ margin: "10px" }}>
        <TextField
          name="polygon"
          label="Polygon"
          value={value.polygon || ""}
          onChange={handleChangePoly}
          type="text"
          fullWidth
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default withLeaflet(MapSelect);
