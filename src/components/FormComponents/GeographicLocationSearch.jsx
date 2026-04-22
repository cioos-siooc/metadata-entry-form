import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { I18n, En, Fr } from "../I18n";
import geographicLocations from "../../utils/geographicLocations";

const GEONAMES_API = "https://geogratis.gc.ca/services/geoname";

function extractBbox(geometry) {
  if (!geometry) return null;
  let allCoords = [];
  if (geometry.type === "Point") allCoords = [geometry.coordinates];
  else if (geometry.type === "MultiPoint") allCoords = geometry.coordinates;
  else if (geometry.type === "Polygon") allCoords = geometry.coordinates[0];
  else if (geometry.type === "MultiPolygon")
    allCoords = geometry.coordinates.flat(2);
  if (!allCoords.length) return null;
  const lngs = allCoords.map(([lng]) => lng);
  const lats = allCoords.map(([, lat]) => lat);
  if (geometry.type === "Point" || geometry.type === "MultiPoint") {
    const lat = lats[0];
    const lng = lngs[0];
    return { north: lat + 0.25, south: lat - 0.25, east: lng + 0.25, west: lng - 0.25 };
  }
  return {
    west: Math.min(...lngs),
    east: Math.max(...lngs),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

function extractPolygon(geometry) {
  if (!geometry) return "";
  let ring;
  if (geometry.type === "Polygon") ring = geometry.coordinates[0];
  else if (geometry.type === "MultiPolygon") ring = geometry.coordinates[0][0];
  else return "";
  return ring.map(([lng, lat]) => `${lat},${lng}`).join(" ");
}

const TYPE_FILTERS = [
  { value: "all", en: "All", fr: "Tout" },
  { value: "province", en: "Province", fr: "Province" },
  { value: "territory", en: "Territory", fr: "Territoire" },
  { value: "marineRegion", en: "Marine Region", fr: "Région marine" },
  { value: "dfoBioregion", en: "DFO Bioregion", fr: "Biorégion MPO" },
  { value: "ocean", en: "Ocean", fr: "Océan" },
  { value: "city", en: "City", fr: "Ville" },
];

const GeographicLocationSearch = ({ updateMap, mapData, disabled }) => {
  const { language } = useParams();
  const [typeFilter, setTypeFilter] = useState("all");

  const [geonameInput, setGeonameInput] = useState("");
  const [geonameOptions, setGeonameOptions] = useState([]);
  const [geonameLoading, setGeonameLoading] = useState(false);
  const [debouncedGeonameInput] = useDebounce(geonameInput, 400);

  useEffect(() => {
    if (!debouncedGeonameInput || debouncedGeonameInput.length < 2) {
      setGeonameOptions([]);
      return;
    }
    let active = true;
    setGeonameLoading(true);
    axios
      .get(`${GEONAMES_API}/${language}/geonames.geojson`, {
        params: { q: debouncedGeonameInput, num: 15 },
      })
      .then(({ data }) => {
        if (!active) return;
        setGeonameOptions(
          (data?.features || []).map(({ properties, geometry }) => ({
            label: properties.name,
            en: properties.name,
            fr: properties.name,
            bbox: extractBbox(geometry),
            polygon: extractPolygon(geometry),
            concise: properties.concise || "",
            province: properties.province || "",
          }))
        );
      })
      .catch(() => {
        if (active) setGeonameOptions([]);
      })
      .finally(() => {
        if (active) setGeonameLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedGeonameInput, language]);

  const filteredLocations =
    typeFilter === "all"
      ? geographicLocations
      : geographicLocations.filter((loc) => loc.type === typeFilter);

  const sortedLocations = [...filteredLocations].sort((a, b) =>
    (a[language] || "").localeCompare(b[language] || "")
  );

  function handleSelect(selectedLocation) {
    if (!selectedLocation) return;
    const { bbox, polygon, en, fr } = selectedLocation;
    updateMap({
      ...mapData,
      ...(bbox
        ? {
            north: bbox.north,
            south: bbox.south,
            east: bbox.east,
            west: bbox.west,
          }
        : {}),
      polygon: polygon || "",
      description: { en, fr },
    });
  }

  function handleGeonameSelect(item) {
    if (!item) return;
    updateMap({
      ...mapData,
      ...(item.bbox
        ? {
            north: item.bbox.north,
            south: item.bbox.south,
            east: item.bbox.east,
            west: item.bbox.west,
          }
        : {}),
      polygon: item.polygon || "",
      description: { en: item.en, fr: item.fr },
    });
    setGeonameInput("");
    setGeonameOptions([]);
  }

  return (
    <Box sx={{ marginBottom: 2 }}>
      <ToggleButtonGroup
        value={typeFilter}
        exclusive
        onChange={(_, newFilter) => {
          if (newFilter !== null) setTypeFilter(newFilter);
        }}
        size="small"
        disabled={disabled}
        sx={{ marginBottom: 1, flexWrap: "wrap" }}
      >
        {TYPE_FILTERS.map((f) => (
          <ToggleButton key={f.value} value={f.value}>
            {f[language] || f.en}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Autocomplete
        options={sortedLocations}
        getOptionLabel={(option) => option[language] || option.en || ""}
        onChange={(_, value) => handleSelect(value)}
        disabled={disabled}
        fullWidth
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <I18n>
                <En>Search predefined regions</En>
                <Fr>Rechercher des régions prédéfinies</Fr>
              </I18n>
            }
          />
        )}
      />

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary">
          <I18n>
            <En>or search Canadian GeoNames</En>
            <Fr>ou rechercher dans les toponymes canadiens</Fr>
          </I18n>
        </Typography>
      </Divider>

      <Autocomplete
        options={geonameOptions}
        getOptionLabel={(option) => option.label || ""}
        filterOptions={(x) => x}
        inputValue={geonameInput}
        onInputChange={(_, value) => setGeonameInput(value)}
        onChange={(_, value) => handleGeonameSelect(value)}
        loading={geonameLoading}
        disabled={disabled}
        fullWidth
        noOptionsText={
          geonameInput.length < 2 ? (
            <I18n>
              <En>Type to search…</En>
              <Fr>Tapez pour rechercher…</Fr>
            </I18n>
          ) : (
            <I18n>
              <En>No results found</En>
              <Fr>Aucun résultat trouvé</Fr>
            </I18n>
          )
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={
              <I18n>
                <En>Search Canadian GeoNames (NRCan)</En>
                <Fr>Rechercher dans les toponymes canadiens (RNCan)</Fr>
              </I18n>
            }
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {geonameLoading && <CircularProgress size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default GeographicLocationSearch;
