import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Autocomplete,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";
import { I18n, En, Fr } from "../I18n";
import geographicLocations from "../../utils/geographicLocations";

const TYPE_FILTERS = [
  { value: "all", en: "All", fr: "Tout" },
  { value: "province", en: "Province", fr: "Province" },
  { value: "territory", en: "Territory", fr: "Territoire" },
  { value: "marineRegion", en: "Marine Region", fr: "Région marine" },
  { value: "dfoBioregion", en: "DFO Bioregion", fr: "Biorégion MPO" },
  { value: "ocean", en: "Ocean", fr: "Océan" },
];

const GeographicLocationSearch = ({ updateMap, mapData, disabled }) => {
  const { language } = useParams();
  const [typeFilter, setTypeFilter] = useState("all");

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
                <En>Search for a geographic location</En>
                <Fr>Rechercher un lieu géographique</Fr>
              </I18n>
            }
          />
        )}
      />
    </Box>
  );
};

export default GeographicLocationSearch;
