import React, { useState } from "react";

import "leaflet/dist/leaflet.css";
import { TextField } from "@material-ui/core";

import {
  Map,
  TileLayer,
  FeatureGroup,
  Circle,
  withLeaflet,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

const MapSelect = ({ onChange, value = {}, name, disabled }) => {
  function onEditPath(e) {
    console.log(e);
  }
  function onDeleted(e) {
    console.log(e);
  }

  const [editableFG, setEditableFG] = useState(null);

  function handleChange(e) {
    const newData = { ...value, [e.target.name]: e.target.value };
    onChange({ target: { name, value: newData } });
    console.log(name, newData);
  }

  function limitDecimals(x) {
    return Number.parseFloat(x).toPrecision(4);
  }
  const onCreated = (e) => {
    // here you have all the stored layers
    const drawnItems = editableFG.leafletElement._layers;

    // From https://stackoverflow.com/questions/61073568/delete-layer-before-creating-a-new-one-with-react-leaflet-draw-in-leaflet
    // Only allow one box on the map at a time
    // if the number of layers is bigger than 1 then delete the first
    if (Object.keys(drawnItems).length > 1) {
      Object.keys(drawnItems).forEach((layerid, index) => {
        if (index > 0) return;
        const layer = drawnItems[layerid];
        editableFG.leafletElement.removeLayer(layer);
      });
      const bounds = drawnItems[Object.keys(drawnItems)[0]]._bounds;

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
                polygon: false,
              }}
              edit={{
                edit: false,
              }}
            />
          )}
          <Circle center={[51.51, -0.06]} radius={200} />
        </FeatureGroup>
      </Map>
      <div style={{ margin: "10px" }}>
        <TextField
          name={"north"}
          label="North"
          value={value.north}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"south"}
          label="South"
          value={value.south}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"east"}
          label="East"
          value={value.east}
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
        <TextField
          name={"west"}
          value={value.west}
          label="West"
          onChange={handleChange}
          type="number"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
const areEqual = (prevProps, nextProps) => prevProps.value === nextProps.value;

export default React.memo(withLeaflet(MapSelect), areEqual);
