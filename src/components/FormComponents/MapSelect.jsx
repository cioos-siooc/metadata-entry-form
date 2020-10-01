import React, { useState } from "react";

import "leaflet/dist/leaflet.css";
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
import "leaflet-draw/dist/leaflet.draw.css";

const MapSelect = ({ onChange, value = {}, name, disabled }) => {
  function onEditPath(e) {
    console.log("onEditPath", e);
  }
  function onDeleted(e) {
    console.log("onDeleted", e);
    console.log("Wiping all values.");

    value.north = undefined;
    value.south = undefined;
    value.east = undefined;
    value.west = undefined;
    value.polygon = undefined;

    const newValue = { ...value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newValue } });
  }

  const [editableFG, setEditableFG] = useState(null);
  const [layerError, setLayerError] = useState(null);

  const coord_test = /-?\d+\.\d+/;
  const poly_test = /-?\d+\.\d+,\s*-?\d+\.\d+\s*?/g;

  function handleChange(e) {
    console.log("event target & value: ", e.target.name, e.target.value);
    console.log("name: ", name);
    console.log("value: ", value);

    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    const newData = { ...value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
    console.log("handleChange", name, newData);
  }

  function handleChangePoly(e) {
    console.log("event target & value: ", e.target.name, e.target.value);
    console.log("name: ", name);
    console.log("value: ", value);

    const drawnItems = editableFG.leafletElement._layers;
    clearExtraLayers(drawnItems);

    const newData = { value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
    console.log("handleChangePoly", name, newData);
  }

  function limitDecimals(x) {
    return Number.parseFloat(x).toPrecision(4);
  }

  function loadExistingExtent(e) {
    console.log("loadExistingExtent", e);
    console.log("value: ", value);

    if (value.polygon) {
      console.log("Create Polygon");
    }

    if (value.north && value.south && value.east && value.west) {
      console.log("Create Bounding Box");
    }
  }

  function parsePolyString(polygon_list) {
    console.log("polygon_list", polygon_list);
    let coord_list = [...polygon_list.matchAll(poly_test)].map(function (
      match
    ) {
      return match[0];
    });

    try {
      coord_list = coord_list.map(function (point) {
        return point.split(",").map(Number);
      });
    } catch (error) {
      setLayerError({ error });
      console.error("Caught Error", error);
    }

    console.log("coord_list", coord_list);
    return coord_list;
  }

  const hasBoundingBox = (
    test_n = value.north,
    test_s = value.south,
    test_e = value.east,
    test_w = value.west
  ) => {
    const test =
      coord_test.test(test_n) &&
      coord_test.test(test_s) &&
      coord_test.test(test_e) &&
      coord_test.test(test_w);

    if (test) {
      console.log("Bounding Box Detected...");
    }

    return test;
  };

  const hasPolygon = (test_string = value.polygon) => {
    const test = poly_test.test(test_string);

    if (test) {
      console.log("Polygon Detected...");
    }

    return test;
  };

  const clearExtraLayers = (drawnItems) => {
    // From https://stackoverflow.com/questions/61073568/delete-layer-before-creating-a-new-one-with-react-leaflet-draw-in-leaflet
    // Only allow one box on the map at a time
    // if the number of layers is bigger than 1 then delete the first
    if (Object.keys(drawnItems).length > 1) {
      Object.keys(drawnItems).forEach((layerid, index) => {
        const existing_layers = Object.keys(editableFG.leafletElement._layers).length;

        if (existing_layers === 1) return;

        const layer = drawnItems[layerid];

        editableFG.leafletElement.removeLayer(layer);
      });
    }
  }

  const onCreated = (e) => {
    // here you have all the stored layers
    const drawnItems = editableFG.leafletElement._layers;

    console.debug("drawnItems", drawnItems);
    clearExtraLayers(drawnItems);
    
    const newShape = drawnItems[Object.keys(drawnItems)[0]];

    console.log("New Shape: ", newShape);
    console.log("Layer Type: ", e.layerType);
    console.log("Bounds: ", newShape._bounds);

    switch (e.layerType) {
      case "polygon":
        console.log("Polygon Created...");
        let polygon = "";
        let poly_list = "";
        let end_point = "";

        newShape._latlngs[0].forEach((polyPoint, index) => {
          const point =
            limitDecimals(polyPoint.lat) + "," + limitDecimals(polyPoint.lng);

          if (index === 0) {
            end_point = point;
          }
          poly_list = poly_list.concat(" ", point);
        });

        polygon = poly_list.concat(" ", end_point).trim();

        console.log("Polygon:", polygon);

        onChange({ target: { name, value: { polygon } } });
        break;

      default: // Assume rectangle
      case "rectangle":
        console.log("Rectangle Created...");
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
    console.log("onCreated", e);
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
        maxBounds={[
          [84, -30],
          [32, -164],
        ]}
        whenReady={loadExistingExtent}
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
          name={"north"}
          label="North"
          value={value.north || ""}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"south"}
          label="South"
          value={value.south || ""}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"east"}
          label="East"
          value={value.east || ""}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"west"}
          value={value.west || ""}
          label="West"
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
      </div>
      <div style={{ margin: "10px" }}>
        <TextField
          name={"polygon"}
          label="Polygon"
          value={value.polygon || ""}
          onChange={handleChangePoly}
          type="text"
          fullWidth={true}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default withLeaflet(MapSelect);
