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
  Chip,
} from "@mui/material";
import Apartment from "@mui/icons-material/Apartment";
import Home from "@mui/icons-material/Home";
import LocationCity from "@mui/icons-material/LocationCity";
import Place from "@mui/icons-material/Place";
import Map from "@mui/icons-material/Map";
import Park from "@mui/icons-material/Park";
import Forest from "@mui/icons-material/Forest";
import Waves from "@mui/icons-material/Waves";
import Water from "@mui/icons-material/Water";
import BeachAccess from "@mui/icons-material/BeachAccess";
import Landscape from "@mui/icons-material/Landscape";
import AcUnit from "@mui/icons-material/AcUnit";
import Flight from "@mui/icons-material/Flight";
import DirectionsBoat from "@mui/icons-material/DirectionsBoat";
import Train from "@mui/icons-material/Train";
import DirectionsCar from "@mui/icons-material/DirectionsCar";
import Security from "@mui/icons-material/Security";
import Hiking from "@mui/icons-material/Hiking";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { I18n, En, Fr } from "../I18n";
import geographicLocations from "../../utils/geographicLocations";

const CONCISE_CODE_META = {
  // Administrative
  PROV: { Icon: Map, en: "Province", fr: "Province" },
  TERR: { Icon: Map, en: "Territory", fr: "Territoire" },
  GEOG: { Icon: Map, en: "Geographic Area", fr: "Zone géographique" },
  // Settlements
  CITY: { Icon: Apartment, en: "City", fr: "Ville" },
  TOWN: { Icon: Home, en: "Town", fr: "Ville" },
  VILG: { Icon: Home, en: "Village", fr: "Village" },
  HAM: { Icon: Home, en: "Hamlet", fr: "Hameau" },
  UTM: { Icon: LocationCity, en: "Upper Tier Municipality", fr: "Municipalité de palier supérieur" },
  LTM: { Icon: LocationCity, en: "Lower Tier Municipality", fr: "Municipalité de palier inférieur" },
  STM: { Icon: LocationCity, en: "Single Tier Municipality", fr: "Municipalité à palier unique" },
  MUN1: { Icon: LocationCity, en: "Municipality", fr: "Municipalité" },
  MUN2: { Icon: LocationCity, en: "Municipal Area", fr: "Zone municipale" },
  UNP: { Icon: Place, en: "Unincorporated Place", fr: "Lieu non constitué" },
  IR: { Icon: Home, en: "Indian Reserve", fr: "Réserve indienne" },
  // Conservation / vegetation
  PARK: { Icon: Park, en: "Conservation Area", fr: "Aire de conservation" },
  FOR: { Icon: Forest, en: "Forest", fr: "Forêt" },
  VEGL: { Icon: Forest, en: "Low Vegetation", fr: "Basse végétation" },
  // Water
  RIV: { Icon: Water, en: "River", fr: "Rivière" },
  RIVF: { Icon: Water, en: "River Feature", fr: "Élément fluvial" },
  FALL: { Icon: Water, en: "Falls", fr: "Chutes" },
  LAKE: { Icon: Water, en: "Lake", fr: "Lac" },
  SPRG: { Icon: Water, en: "Spring", fr: "Source" },
  CHAN: { Icon: Water, en: "Channel", fr: "Chenal" },
  RAP: { Icon: Water, en: "Rapids", fr: "Rapides" },
  HYDR: { Icon: Water, en: "Hydraulic Construction", fr: "Construction hydraulique" },
  // Sea / coastal
  SEA: { Icon: Waves, en: "Sea", fr: "Mer" },
  SEAF: { Icon: Waves, en: "Sea Feature", fr: "Élément marin" },
  SEAU: { Icon: Waves, en: "Undersea Feature", fr: "Élément sous-marin" },
  BAY: { Icon: Waves, en: "Bay", fr: "Baie" },
  CAPE: { Icon: Waves, en: "Cape", fr: "Cap" },
  SHL: { Icon: Waves, en: "Shoal", fr: "Haut-fond" },
  BCH: { Icon: BeachAccess, en: "Beach", fr: "Plage" },
  ISL: { Icon: BeachAccess, en: "Island", fr: "Île" },
  MAR: { Icon: DirectionsBoat, en: "Marine Navigation Feature", fr: "Élément de navigation marine" },
  // Terrain
  CLF: { Icon: Landscape, en: "Cliff", fr: "Falaise" },
  MTN: { Icon: Landscape, en: "Mountain", fr: "Montagne" },
  VALL: { Icon: Landscape, en: "Valley", fr: "Vallée" },
  PLN: { Icon: Landscape, en: "Plain", fr: "Plaine" },
  CAVE: { Icon: Landscape, en: "Cave", fr: "Grotte" },
  CRAT: { Icon: Landscape, en: "Crater", fr: "Cratère" },
  GLAC: { Icon: AcUnit, en: "Glacier", fr: "Glacier" },
  // Military
  MIL: { Icon: Security, en: "Military Area", fr: "Zone militaire" },
  // Infrastructure
  RAIL: { Icon: Train, en: "Railway Feature", fr: "Élément ferroviaire" },
  ROAD: { Icon: DirectionsCar, en: "Road Feature", fr: "Élément routier" },
  AIR: { Icon: Flight, en: "Air Navigation Feature", fr: "Élément de navigation aérienne" },
  // Recreation / sites
  RECR: { Icon: Hiking, en: "Recreational Site", fr: "Site récréatif" },
  RES: { Icon: Hiking, en: "Natural Resources Site", fr: "Site de ressources naturelles" },
  CAMP: { Icon: Hiking, en: "Campsite", fr: "Camping" },
  SITE: { Icon: Place, en: "Site", fr: "Site" },
  MISC: { Icon: Place, en: "Miscellaneous", fr: "Divers" },
};

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
        renderOption={(props, option) => {
          const meta = CONCISE_CODE_META[option.concise];
          const { key, ...rest } = props;
          return (
            <Box component="li" key={key} {...rest} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {meta && (
                <meta.Icon fontSize="small" sx={{ color: "text.secondary", flexShrink: 0 }} />
              )}
              <span style={{ flexGrow: 1 }}>{option.label}</span>
              {meta && (
                <Chip
                  label={meta[language] || meta.en}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem", height: 20, flexShrink: 0 }}
                />
              )}
            </Box>
          );
        }}
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
