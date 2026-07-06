import React, { useRef, useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { Alert, TextField, Grid, Typography } from "@mui/material";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon as LeafletPolygon,
  Rectangle as LeafletRectangle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { I18n, En, Fr } from "../I18n";
import GeomanControl from "./GeomanControl";

import { QuestionText, SupplementalText } from "./QuestionStyles";
import { validateField } from "../../utils/validate";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import UseMyLocationButton from "./UseMyLocationButton";

const MapSelect = ({ updateMap, mapData = {}, disabled, record }) => {
  const drawnLayerRef = useRef(null);
  const mapRef = useRef(null);
  const [locationError, setLocationError] = useState(null);
  const mapDataRef = useRef(mapData);
  mapDataRef.current = mapData;

  const coordTest = /-?\d+\.?\d+/;
  const polyTest = /-?\d+\.?\d+,\s*-?\d+\.?\d+\s*?/g;

  // update a mapData property using an event
  function handleBBoxChange(key) {
    return (e) => {
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
        drawnLayerRef.current = null;
      }
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
    const coordList = [...polygonList.matchAll(polyTest)].map((match) => {
      return match[0].split(",").map(Number);
    });

    return coordList;
  }

  function limitDecimals(x) {
    return Number(Number.parseFloat(x).toFixed(4));
  }

  // update the polygon property using an event
  function handleChangePoly() {
    return (e) => {
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
        drawnLayerRef.current = null;
      }

      const newData = {
        ...mapData,
        polygon: e.target.value,
        north: "",
        south: "",
        east: "",
        west: "",
      };
      try {
        const bounds = L.latLngBounds(parsePolyString(e.target.value));
        const { lat: north, lng: east } = bounds.getNorthEast();
        const { lat: south, lng: west } = bounds.getSouthWest();

        newData.north = limitDecimals(north);
        newData.south = limitDecimals(south);
        newData.east = limitDecimals(east);
        newData.west = limitDecimals(west);
      } catch {
        // ignore bounds errors as a missing or invalid polygon string should not take down the app
      }

      updateMap(newData);
    };
  }

  const hasBoundingBox = (
    testN = mapData.north,
    testS = mapData.south,
    testE = mapData.east,
    testW = mapData.west,
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

  const onCreated = useCallback(
    (e) => {
      const { layer, shape } = e;

      // Remove previous drawn shape (only one shape allowed at a time)
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
      }
      drawnLayerRef.current = layer;

      const currentMapData = mapDataRef.current;

      switch (shape) {
        case "Polygon": {
          const points = layer.getLatLngs()[0];
          const polygonStrings = points.map(
            ({ lat, lng }) => `${limitDecimals(lat)},${limitDecimals(lng)}`,
          );
          const polygon = polygonStrings.concat(polygonStrings[0]).join(" ");

          const polybounds = layer.getBounds();

          let { lat: north, lng: east } = polybounds.getNorthEast();
          let { lat: south, lng: west } = polybounds.getSouthWest();

          north = limitDecimals(north);
          south = limitDecimals(south);
          east = limitDecimals(east);
          west = limitDecimals(west);

          updateMap({ ...currentMapData, polygon, north, south, east, west });
          break;
        }

        case "Rectangle":
        default: {
          const bounds = layer.getBounds();

          let { lat: north, lng: east } = bounds.getNorthEast();
          let { lat: south, lng: west } = bounds.getSouthWest();

          north = limitDecimals(north);
          south = limitDecimals(south);
          east = limitDecimals(east);
          west = limitDecimals(west);

          updateMap({
            ...currentMapData,
            north,
            south,
            east,
            west,
            polygon: "",
          });
          break;
        }
      }
    },
    [updateMap],
  );

  const onRemove = useCallback(() => {
    drawnLayerRef.current = null;
    const currentMapData = mapDataRef.current;
    updateMap({
      ...currentMapData,
      north: "",
      south: "",
      east: "",
      west: "",
      polygon: "",
      descriptionIdentifier: uuidv4(),
    });
  }, [updateMap]);

  // Fill the bounding box with a small area (~0.1° half-width) around the
  // device's location and fly the map there.
  function handleLocated({ latitude, longitude }) {
    setLocationError(null);
    if (drawnLayerRef.current) {
      drawnLayerRef.current.remove();
      drawnLayerRef.current = null;
    }
    const half = 0.1;
    const north = limitDecimals(Math.min(latitude + half, 90));
    const south = limitDecimals(Math.max(latitude - half, -90));
    const east = limitDecimals(Math.min(longitude + half, 180));
    const west = limitDecimals(Math.max(longitude - half, -180));
    updateMap({ ...mapDataRef.current, north, south, east, west, polygon: "" });
    mapRef.current?.flyToBounds([
      [north, east],
      [south, west],
    ]);
  }

  const bboxIsDrawn = Boolean(
    mapData.north || mapData.south || mapData.east || mapData.west,
  );

  const polyIsDrawn = Boolean(mapData.polygon);

  const fieldsAreEmpty = !bboxIsDrawn && !mapData.polygon;

  return (
    <div>
      <MapContainer
        ref={mapRef}
        style={{ width: "100%", height: "clamp(300px, 55vh, 700px)" }}
        center={[50, -100]}
        zoom={3}
      >
        <TileLayer
          attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {disabled === false && (
          <GeomanControl onCreated={onCreated} onRemove={onRemove} />
        )}

        <FeatureGroup>
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
      </MapContainer>
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

      {locationError && (
        <Alert
          severity="warning"
          onClose={() => setLocationError(null)}
          style={{ marginBottom: "10px" }}
        >
          {locationError === "denied" ? (
            <I18n
              en="Location permission denied — enter coordinates manually or draw on the map."
              fr="Autorisation de localisation refusée — saisissez les coordonnées manuellement ou dessinez sur la carte."
            />
          ) : (
            <I18n
              en="Could not determine your location."
              fr="Impossible de déterminer votre position."
            />
          )}
        </Alert>
      )}

      <Grid container direction="row" spacing={3} alignItems="center">
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label={<I18n en="North" fr="Nord" />}
            value={mapData.north || ""}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            onChange={handleBBoxChange("north")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label={<I18n en="South" fr="Sud" />}
            value={mapData.south || ""}
            onChange={handleBBoxChange("south")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            label={<I18n en="East" fr="Est" />}
            value={mapData.east || ""}
            onChange={handleBBoxChange("east")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <TextField
            value={mapData.west || ""}
            label={<I18n en="West" fr="Ouest" />}
            onChange={handleBBoxChange("west")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <UseMyLocationButton
            onLocated={handleLocated}
            onError={setLocationError}
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
      </Grid>

      <Typography variant="h6" style={{ margin: "20px", textAlign: "center" }}>
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
              La suite de coordonnées doit commencer et se terminer par le même
              point. Par exemple,
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

      <Typography variant="h6" style={{ margin: "20px", textAlign: "center" }}>
        <I18n>
          <En>And optionally</En>
          <Fr>Et en option</Fr>
        </I18n>
      </Typography>

      <QuestionText>
        <I18n>
          <En>
            Describe the Geographic Extent of the dataset. Required for
            Biological datasets
          </En>
          <Fr>
            Décrivez l'étendue géographique du jeu de données. Obligatoire pour
            les jeux de données biologiques
          </Fr>
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
                Vous pouvez éventuellement inclure une description textuelle de
                la zone géographique. Ce champ est obligatoire pour des jeux de
                données biologiques, mais est facultatif pour tous autre type de
                jeux de données.
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

export default MapSelect;
