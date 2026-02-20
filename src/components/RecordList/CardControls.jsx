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
  useMediaQuery,
  useTheme,
  Collapse,
  IconButton,
} from "@mui/material";
import { Refresh, ExpandMore, ExpandLess } from "@mui/icons-material";
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Local state for debouncing text inputs
  const [searchInput, setSearchInput] = useState(filters.search);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  const [authorInput, setAuthorInput] = useState(filters.author);
  const [debouncedAuthor] = useDebounce(authorInput, 300);

  // Mobile filter visibility toggle
  const [filtersVisible, setFiltersVisible] = useState(false);

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
    <Box mb={2}>
      {/* Mobile Header with Toggle */}
      {isMobile && (
        <Box display="flex" gap={1} alignItems="center" mb={2}>
          <IconButton
            size="small"
            onClick={() => setFiltersVisible(!filtersVisible)}
            sx={{ ml: -1 }}
          >
            {filtersVisible ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            <I18n en="Filters" fr="Filtres" />
          </span>
        </Box>
      )}

      {/* Filters Box - Collapsed on Mobile, Always Visible on Desktop */}
      <Collapse in={!isMobile || filtersVisible} timeout="auto">
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            width: '100%',
            p: isMobile ? 2 : 0,
            border: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: isMobile ? 'action.hover' : 'transparent',
          }}
        >
          {/* Filters Group */}
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end" flex={isMobile ? '1 1 100%' : 'initial'}>
            <TextField
              variant="outlined"
              size="small"
              label={searchLabel}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ minWidth: 200, flex: isMobile ? '1 1 100%' : 'initial' }}
            />

            <FormControl variant="outlined" size="small" style={{ minWidth: 200, flex: isMobile ? '1 1 100%' : 'initial' }}>
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
              style={{ minWidth: 220, flex: isMobile ? '1 1 100%' : 'initial' }}
            />
          </Box>

          {/* Sort Group */}
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end" flex={isMobile ? '1 1 100%' : 'initial'}>
            <FormControl variant="outlined" size="small" style={{ minWidth: 160, flex: isMobile ? '1 1 calc(50% - 8px)' : 'initial' }}>
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

            <FormControl variant="outlined" size="small" style={{ minWidth: 140, flex: isMobile ? '1 1 calc(50% - 8px)' : 'initial' }}>
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
            sx={{ height: 40, flex: isMobile ? '1 1 100%' : 'initial' }}
          >
            <I18n en="Reset" fr="Réinitialiser" />
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CardControls;
