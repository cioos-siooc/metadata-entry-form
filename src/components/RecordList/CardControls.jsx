import React, { useCallback, useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Button,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useRecordListContext } from "./context";
import { I18n } from "../I18n";

const STATUS_OPTIONS = ["", "submitted", "published"];

const CardControls = ({
  filters,
  onSearchChange,
  onAuthorChange,
  onStatusesChange,
  onSortFieldChange,
  onSortDirChange,
  onReset,
}) => {
  const { language } = useRecordListContext();

  // Local state for debouncing text inputs
  const [searchInput, setSearchInput] = useState(filters.search);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  const [authorInput, setAuthorInput] = useState(filters.author);
  const [debouncedAuthor] = useDebounce(authorInput, 300);

  // Sync debounced values to parent
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, onSearchChange]);

  useEffect(() => {
    if (debouncedAuthor !== filters.author) {
      onAuthorChange(debouncedAuthor);
    }
  }, [debouncedAuthor, filters.author, onAuthorChange]);

  const handleStatusChange = useCallback(
    (event) => {
      onStatusesChange(event.target.value);
    },
    [onStatusesChange],
  );

  const handleSortField = useCallback(
    (event) => {
      onSortFieldChange(event.target.value);
    },
    [onSortFieldChange],
  );

  const handleSortDir = useCallback(
    (event) => {
      onSortDirChange(event.target.value);
    },
    [onSortDirChange],
  );

  const handleReset = useCallback(() => {
    setSearchInput("");
    setAuthorInput("");
    onReset();
  }, [onReset]);

  // Labels
  const statusLabel = language === "en" ? "Status" : "Statut";
  const draftLabel = language === "en" ? "Draft" : "Brouillon";
  const submittedLabel = language === "en" ? "Submitted" : "Soumis";
  const publishedLabel = language === "en" ? "Published" : "Publié";
  const statusToText = useCallback(
    (s) => {
      if (s === "") return draftLabel;
      if (s === "submitted") return submittedLabel;
      return publishedLabel;
    },
    [draftLabel, submittedLabel, publishedLabel],
  );
  const searchLabel = language === "en" ? "Search" : "Rechercher";
  const sortByLabel = language === "en" ? "Sort by" : "Trier par";
  const directionLabel = language === "en" ? "Direction" : "Direction";
  const authorLabel = language === "en" ? "Author" : "Auteur";

  return (
    <Box display="flex" gap={3} flexWrap="wrap" alignItems="flex-end" mb={2}>
      {/* Filters Group */}
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
        <TextField
          variant="outlined"
          size="small"
          label={searchLabel}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ minWidth: 200 }}
        />

        <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}>
          <InputLabel>{statusLabel}</InputLabel>
          <Select
            multiple
            value={filters.statuses}
            onChange={handleStatusChange}
            input={<OutlinedInput label={statusLabel} />}
            renderValue={(selected) =>
              (selected || []).map((s) => statusToText(s)).join(", ")
            }
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s || "draft"} value={s}>
                <Checkbox checked={filters.statuses.indexOf(s) > -1} />
                <ListItemText primary={statusToText(s)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          variant="outlined"
          size="small"
          label={authorLabel}
          value={authorInput}
          onChange={(e) => setAuthorInput(e.target.value)}
          style={{ minWidth: 220 }}
        />
      </Box>

      {/* Sort Group */}
      <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
        <FormControl variant="outlined" size="small" style={{ minWidth: 160 }}>
          <InputLabel>{sortByLabel}</InputLabel>
          <Select
            value={filters.sortField}
            onChange={handleSortField}
            label={sortByLabel}
          >
            <MenuItem value="created">
              {language === "en" ? "Last Edited" : "Dernière modification"}
            </MenuItem>
            <MenuItem value="title">
              {language === "en" ? "Title" : "Titre"}
            </MenuItem>
            <MenuItem value="author">
              {language === "en" ? "Author" : "Auteur"}
            </MenuItem>
            <MenuItem value="progress">
              {language === "en" ? "Progress" : "Progrès"}
            </MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" style={{ minWidth: 140 }}>
          <InputLabel>{directionLabel}</InputLabel>
          <Select
            value={filters.sortDir}
            onChange={handleSortDir}
            label={directionLabel}
          >
            <MenuItem value="asc">
              {language === "en" ? "Ascending" : "Croissant"}
            </MenuItem>
            <MenuItem value="desc">
              {language === "en" ? "Descending" : "Décroissant"}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Reset Button */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<Refresh />}
        onClick={handleReset}
        sx={{ height: 40 }}
      >
        <I18n en="Reset" fr="Réinitialiser" />
      </Button>
    </Box>
  );
};

export default CardControls;
