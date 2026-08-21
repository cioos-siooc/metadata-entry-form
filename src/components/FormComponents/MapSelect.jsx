/* eslint-disable no-case-declarations */
import React, { useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { TextField, Grid, Typography } from "@mui/material";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon as LeafletPolygon,
  Rectangle as LeafletRectangle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { I18n, En, Fr } from "../I18n";
import { resourceTypeIncludes } from "../../utils/normalizeResourceType";
import GeomanControl from "./GeomanControl";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { validateField } from "../../utils/validate";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import GeographicLocationSearch from "./GeographicLocationSearch";

const bboxCoordTest = /-?\d+\.?\d+/;

// Module-level polygon parser so BboxLayer/PolygonLayer can use it.
function parsePolyString(polygonList) {
  const polyPattern = /-?\d+\.?\d+,\s*-?\d+\.?\d+\s*?/g;
  return [...polygonList.matchAll(polyPattern)].map((match) =>
    match[0].split(",").map(Number)
  );
}

// Renders an editable bbox rectangle for search-selected / pre-loaded bboxes.
// Must be rendered inside MapContainer.
// handleLayerEditRef must be a ref so the listener always calls the latest closure.
const BboxLayer = ({ mapData, drawnLayerRef, handleLayerEditRef }) => {
  const map = useMap();

  useEffect(() => {
    if (drawnLayerRef.current) return;
    const { north, south, east, west } = mapData;
    if (
      !bboxCoordTest.test(north) ||
      !bboxCoordTest.test(south) ||
      !bboxCoordTest.test(east) ||
      !bboxCoordTest.test(west)
    )
      return;

    const rect = L.rectangle([[north, east], [south, west]]);
    rect.addTo(map);
    // pm:markerdragend fires only on the layer (not the map), so attach directly
    rect.on("pm:markerdragend", () => handleLayerEditRef.current(rect));
    rect.pm.enable({ preventMarkerRemoval: true });
    drawnLayerRef.current = rect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData.north, mapData.south, mapData.east, mapData.west]);

  return null;
};

// Renders an editable polygon for search-selected / pre-loaded polygons.
// Analogous to BboxLayer but for polygon geometry.
const PolygonLayer = ({ mapData, drawnLayerRef, handleLayerEditRef }) => {
  const map = useMap();

  useEffect(() => {
    if (drawnLayerRef.current) return;
    if (!mapData.polygon) return;

    const coords = parsePolyString(mapData.polygon);
    if (coords.length < 3) return;

    const poly = L.polygon(coords);
    poly.addTo(map);
    poly.on("pm:markerdragend", () => handleLayerEditRef.current(poly));
    poly.pm.enable({ preventMarkerRemoval: true });
    drawnLayerRef.current = poly;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData.polygon]);

  return null;
};

// Geometry entered by hand replaces whatever was picked in the location search,
// so the saved location name is dropped rather than left describing a different
// area. Nudging existing vertices (handleLayerEdit) keeps the name.
function withoutSelectedLocation(data) {
  // eslint-disable-next-line no-unused-vars
  const { selectedLocation, ...rest } = data;
  return rest;
}

const MapSelect = ({ updateMap, mapData = {}, disabled, record }) => {
  const drawnLayerRef = useRef(null);
  const mapDataRef = useRef(mapData);
  mapDataRef.current = mapData;

  const coordTest = /-?\d+\.?\d+/;

  // update a mapData property using an event
  function handleBBoxChange(key) {
    return (e) => {
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
        drawnLayerRef.current = null;
      }
      const newData = { ...withoutSelectedLocation(mapData), [key]: e.target.value };
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

      const newData = { ...withoutSelectedLocation(mapData), polygon: e.target.value, north: '', south: '', east: '', west: '' };
      try {
        const bounds = L.latLngBounds(parsePolyString(e.target.value));
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
    };
  }

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

  const onCreated = useCallback(
    (e) => {
      const { layer, shape } = e;

      // Remove previous drawn shape (only one shape allowed at a time)
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
      }
      drawnLayerRef.current = layer;

      const currentMapData = withoutSelectedLocation(mapDataRef.current);

      switch (shape) {
        case "Polygon": {
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

          updateMap({ ...currentMapData, north, south, east, west, polygon: "" });
          break;
        }
      }

      // Attach drag-end listener directly on the layer — pm:markerdragend
      // fires only on the layer (not the map), so map.on() won't catch it
      layer.on("pm:markerdragend", () => handleLayerEditRef.current(layer));
      // Enable corner/vertex handles immediately after drawing
      layer.pm.enable({ preventMarkerRemoval: true });
    },
    [updateMap]
  );

  const onRemove = useCallback(() => {
    drawnLayerRef.current = null;
    const currentMapData = withoutSelectedLocation(mapDataRef.current);
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

  // Updates state from a layer's current geometry after a drag.
  // pm:markerdragend fires only on the layer (not the map), so this is
  // called via a ref-based listener attached directly to each layer.
  const handleLayerEdit = useCallback(
    (layer) => {
      const currentMapData = mapDataRef.current;
      const bounds = layer.getBounds();
      let { lat: north, lng: east } = bounds.getNorthEast();
      let { lat: south, lng: west } = bounds.getSouthWest();
      north = limitDecimals(north);
      south = limitDecimals(south);
      east = limitDecimals(east);
      west = limitDecimals(west);

      if (layer instanceof L.Rectangle) {
        updateMap({ ...currentMapData, north, south, east, west, polygon: "" });
      } else {
        const points = layer.getLatLngs()[0];
        const polygonStrings = points.map(
          ({ lat, lng }) => `${limitDecimals(lat)},${limitDecimals(lng)}`
        );
        const polygon = polygonStrings.concat(polygonStrings[0]).join(" ");
        updateMap({ ...currentMapData, polygon, north, south, east, west });
      }
    },
    [updateMap]
  );
  // Ref so BboxLayer's listener always calls the latest closure
  const handleLayerEditRef = useRef(handleLayerEdit);
  handleLayerEditRef.current = handleLayerEdit;

  // Clear any drawn layer before applying a search-selected location
  const handleSearchSelect = useCallback(
    (newMapData) => {
      if (drawnLayerRef.current) {
        drawnLayerRef.current.remove();
        drawnLayerRef.current = null;
      }
      updateMap(newMapData);
    },
    [updateMap]
  );

  const bboxIsDrawn = Boolean(
    mapData.north || mapData.south || mapData.east || mapData.west
  );

  const polyIsDrawn = Boolean(mapData.polygon);

  const fieldsAreEmpty = !bboxIsDrawn && !mapData.polygon;

  return (
    <div>
      {!disabled && (
        <GeographicLocationSearch
          updateMap={handleSearchSelect}
          mapData={mapData}
          disabled={disabled}
        />
      )}
      <MapContainer
        style={{ width: "100%", height: "55vh" }}
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

        {/* Editable bbox rectangle — handles appear immediately for resizing */}
        {!disabled && !polyIsDrawn && (
          <BboxLayer
            mapData={mapData}
            drawnLayerRef={drawnLayerRef}
            handleLayerEditRef={handleLayerEditRef}
          />
        )}

        {/* Editable polygon — handles appear immediately for vertex editing */}
        {!disabled && polyIsDrawn && (
          <PolygonLayer
            mapData={mapData}
            drawnLayerRef={drawnLayerRef}
            handleLayerEditRef={handleLayerEditRef}
          />
        )}

        <FeatureGroup>
          {/* Static polygon display in read-only / disabled mode */}
          {disabled && polyIsDrawn && (
            <LeafletPolygon positions={parsePolyString(mapData.polygon)} />
          )}

          {/* Static bbox display in read-only / disabled mode */}
          {disabled && hasBoundingBox() && !polyIsDrawn && (
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
      <Grid container direction="row" spacing={3}>
        <Grid size={2}>
          <TextField
            label={<I18n en="North" fr="Nord" />}
            value={mapData.north ?? ""}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            onChange={handleBBoxChange("north")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={2}>
          <TextField
            label={<I18n en="South" fr="Sud" />}
            value={mapData.south ?? ""}
            onChange={handleBBoxChange("south")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={2}>
          <TextField
            label={<I18n en="East" fr="Est" />}
            value={mapData.east ?? ""}
            onChange={handleBBoxChange("east")}
            type="number"
            disabled={disabled || Boolean(mapData.polygon)}
          />
        </Grid>
        <Grid size={2}>
          <TextField
            value={mapData.west ?? ""}
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

      {!disabled && (
        <>
          <Typography
            variant="h6"
            style={{ margin: "20px", marginLeft: "20%" }}
          >
            <I18n>
              <En>OR</En>
              <Fr>Ou</Fr>
            </I18n>
          </Typography>
          <GeographicLocationSearch
            updateMap={handleSearchSelect}
            mapData={mapData}
            disabled={disabled}
          />
        </>
      )}

      <Typography variant="h6" style={{ margin: "20px", marginLeft: "20%" }}>
        <I18n>
          <En>And optionally</En>
          <Fr>Et en option</Fr>
        </I18n>
      </Typography>

      <QuestionText>
        <I18n>
          <En>Describe the Geographic Extent of the dataset. Required for Biota (biological) datasets</En>
          <Fr>Décrivez l'étendue géographique du jeu de données. Obligatoire pour les jeux de données Biote (biologiques)</Fr>
        </I18n>
        {resourceTypeIncludes(record.resourceType, "biota") && (
          <RequiredMark passes={Boolean(mapData.description)} />
        )}
        <SupplementalText>
          <I18n>
            <En>
              <p>
                Optionally you can include a text description of the geographic
                area covered by this dataset or study. This field is required
                when the Biota (biological) topic category is selected but is
                optional for all other topic categories.
              </p>
            </En>
            <Fr>
              <p>
                Vous pouvez éventuellement inclure une description textuelle
                de la zone géographique. Ce champ est obligatoire lorsque la
                catégorie thématique Biote (biologique) est sélectionnée, mais
                est facultatif pour toutes les autres catégories thématiques.
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
