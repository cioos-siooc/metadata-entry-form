import React, { useState } from "react";

import "leaflet/dist/leaflet.css";
import { TextField } from "@material-ui/core";

import { Map, TileLayer, FeatureGroup, withLeaflet } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

const MapSelect = ({ onChange, value = {}, name, disabled }) => {
  function onEditPath(e) {
    console.log("onEditPath", e);
  }
  function onDeleted(e) {
    console.log("onDeleted", e);
  }

  const [editableFG, setEditableFG] = useState(null);

  function handleChange(e) {
    console.log("event target & value: ", e.target.name, e.target.value);
    console.log("name: ", name);
    console.log("value: ", value);

    const newData = { ...value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
    console.log("handleChange", name, newData);
  }

  function handleChangePoly(e) {
    console.log("event target & value: ", e.target.name, e.target.value);
    console.log("name: ", name);
    console.log("value: ", value);

    const newData = { value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
    console.log("handleChange", name, newData);
  }

  function limitDecimals(x) {
    return Number.parseFloat(x).toPrecision(4);
  }
  const onCreated = (e) => {
    // here you have all the stored layers
    const drawnItems = editableFG.leafletElement._layers;

    console.debug("drawnItems", drawnItems);

    // From https://stackoverflow.com/questions/61073568/delete-layer-before-creating-a-new-one-with-react-leaflet-draw-in-leaflet
    // Only allow one box on the map at a time
    // if the number of layers is bigger than 1 then delete the first
    if (Object.keys(drawnItems).length > 1) {
      Object.keys(drawnItems).forEach((layerid, index) => {
        if (index > 0) return;
        const layer = drawnItems[layerid];
        editableFG.leafletElement.removeLayer(layer);
      });
    }

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
          const point = limitDecimals(polyPoint.lat) + "," + limitDecimals(polyPoint.lng);

          if (index === 0){
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
        style={{ width: "100%", height: "300px" }}
        center={[50, -100]}
        zoom={2}
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
        </FeatureGroup>
      </Map>
      <div style={{ margin: "10px" }}>
        <TextField
          name={"north"}
          label="North"
          value={value.north || ''}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"south"}
          label="South"
          value={value.south || ''}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"east"}
          label="East"
          value={value.east || ''}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"west"}
          value={value.west || ''}
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
          value={value.polygon || ''}
          onChange={handleChangePoly}
          type="text"
          fullWidth={ true }
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default withLeaflet(MapSelect);
