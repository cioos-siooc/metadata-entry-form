 
import React, { useRef, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { Box, Card, Stack, TextField, Typography } from "@mui/material";
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
import GeomanControl from "./GeomanControl";
import { HeadingText, SupplementalText } from "./QuestionStyles";
import { validateField } from "../../utils/validate";
import RequiredMark from "./RequiredMark";
import GeographicLocationSearch from "./GeographicLocationSearch";
import { radii } from "../../theme/tokens";

// Laid out as a compass cross so each edge sits where it points. `gridColumn`
// is over the 4-column grid below: N and S span the middle half, W and E take
// a half each, so all four fields end up the same width.
// Values centre in the box, and so does the label while the field is still
// empty. Once it has a value the label shrinks into the border notch, which the
// fieldset draws on the left — so the shrunk state keeps MUI's own placement.
const CENTERED_FIELD_SX = {
  "& .MuiInputBase-input": { textAlign: "center" },
  // Labels now stack above the field theme-wide, so centring is just text
  // alignment over the full field width.
  "& .MuiInputLabel-root": { width: "100%", textAlign: "center" },
};

const BBOX_FIELDS = [
  { key: "north", label: <I18n en="North" fr="Nord" />, gridColumn: "2 / 4" },
  { key: "west", label: <I18n en="West" fr="Ouest" />, gridColumn: "1 / 3" },
  { key: "east", label: <I18n en="East" fr="Est" />, gridColumn: "3 / 5" },
  { key: "south", label: <I18n en="South" fr="Sud" />, gridColumn: "2 / 4" },
];

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

// Each input group sits in its own outlined box, so the sidebar reads as three
// labelled sections rather than one run of fields. Titles are text.primary and
// the copy under them is SupplementalText, consistently across all three.
const SidebarSection = ({ title, action, children }) => (
  <Box
    sx={(theme) => ({
      mt: 1.5,
      p: 1.5,
      border: "1px solid",
      // Not `divider` — the sidebar Card is background.subtle, which divider
      // matches exactly on dark.
      borderColor: theme.vars.palette.subtleBorder,
      borderRadius: `${radii.md}px`,
    })}
  >
    <Stack direction="row" alignItems="baseline" spacing={0.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {action}
    </Stack>
    {children}
  </Box>
);

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

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems="stretch"
    >
      {/* Leaflet needs a definite pixel height, so the wrapper carries it */}
      <Box
        sx={{
          flexGrow: 1,
          minWidth: 0,
          // md+: the flex row stretches this to the sidebar's height, so the two
          // columns always end level. xs: stacked, so it needs its own height.
          height: { xs: 340, md: "auto" },
          minHeight: { md: 480 },
          // Same corner as the sidebar Card, which takes radii.lg from the
          // MuiCard override. overflow clips Leaflet's tiles to it.
          borderRadius: `${radii.lg}px`,
          overflow: "hidden",
        }}
      >
        <MapContainer
          style={{ width: "100%", height: "100%" }}
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
      </Box>

      <Card
        variant="outlined"
        sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          p: 2,
          bgcolor: "background.subtle",
        }}
      >
        <SupplementalText sx={{ mt: 0 }}>
          <I18n>
            <En>
              To designate a spatial area, search for a location, draw on the
              map, add a bounding box or enter polygon coordinates.
            </En>
            <Fr>
              Pour définir une étendue spatiale, recherchez un lieu, tracez sur
              la carte, ajoutez un cadre englobant ou saisissez les coordonnées
              d&apos;un polygone.
            </Fr>
          </I18n>
        </SupplementalText>

        {!disabled && (
          <SidebarSection
            title={
              <I18n en="Search for a location" fr="Rechercher un lieu" />
            }
          >
            <Box sx={{ mt: 1 }}>
              <GeographicLocationSearch
                updateMap={handleSearchSelect}
                mapData={mapData}
                disabled={disabled}
              />
            </Box>
          </SidebarSection>
        )}

        <Stack direction="row" alignItems="baseline" sx={{ mt: 2.5 }}>
          <HeadingText sx={{ fontSize: "0.9375rem", mb: 0 }}>
            <I18n>
              <En>Enter your bounding box or polygon</En>
              <Fr>Saisissez votre cadre englobant ou votre polygone</Fr>
            </I18n>
          </HeadingText>
          <RequiredMark passes={validateField(record, "map")} />
        </Stack>

        <SidebarSection title={<I18n en="Bounding box" fr="Cadre englobant" />}>
        <SupplementalText>
          <I18n>
            <En>
              Decimal degrees (eg 58.66), not degrees, minutes and seconds.
            </En>
            <Fr>
              Degrés décimaux (p. ex. 58,66), et non degrés, minutes et
              secondes.
            </Fr>
          </I18n>
        </SupplementalText>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            columnGap: 1.5,
            rowGap: 1,
          }}
        >
          {BBOX_FIELDS.map(({ key, label, gridColumn }) => (
            <TextField
              key={key}
              sx={{ gridColumn, ...CENTERED_FIELD_SX }}
              label={label}
              value={mapData[key] ?? ""}
              onChange={handleBBoxChange(key)}
              type="number"
              size="small"
              fullWidth
              inputProps={{ inputMode: "numeric" }}
              disabled={disabled || Boolean(mapData.polygon)}
            />
          ))}
        </Box>
        </SidebarSection>

        <SidebarSection
          title={
            <I18n en="Polygon coordinates" fr="Coordonnées du polygone" />
          }
        >
        <SupplementalText>
          <I18n>
            <En>
              Coordinates must start and end with the same point. Eg,
            </En>
            <Fr>
              La suite de coordonnées doit commencer et se terminer par le même
              point. Par exemple,
            </Fr>
          </I18n>{" "}
          48,-128 56,-133 56,-147 48,-128
        </SupplementalText>
        <TextField
          value={mapData.polygon || ""}
          onChange={handleChangePoly()}
          type="text"
          size="small"
          multiline
          minRows={2}
          maxRows={4}
          fullWidth
          sx={{ mt: 1 }}
          disabled={disabled || (bboxIsDrawn && !polyIsDrawn)}
        />
        </SidebarSection>
      </Card>
    </Stack>
  );
};

export default MapSelect;
