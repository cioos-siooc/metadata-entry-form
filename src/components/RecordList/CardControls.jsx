import React, { useMemo, useCallback, useState, useEffect } from "react";
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

const CardControls = () => {
  const { language, listState } = useRecordListContext();
  const {
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    resetListState,
  } = listState;

  // Local inputs synced with model
  const [quick, setQuick] = useState(
    () => filterModel.quickFilterValues?.[0] || "",
  );
  const [debouncedQuick] = useDebounce(quick, 300);
  const [author, setAuthor] = useState(() => {
    const item = (filterModel.items || []).find(
      (i) => i.columnField === "author",
    );
    return item?.value || "";
  });
  const [debouncedAuthor] = useDebounce(author, 300);
  const statusValues = useMemo(() => {
    const item = (filterModel.items || []).find(
      (i) => i.columnField === "status",
    );
    return Array.isArray(item?.value) ? item.value : [];
  }, [filterModel]);

  const sortField = sortModel?.[0]?.field || "created";
  const sortDir = sortModel?.[0]?.sort || "desc";

  // Sync quick input to model (debounced)
  useEffect(() => {
    const next = debouncedQuick.trim();
    const values = next ? [next] : [];
    setFilterModel((prev) => ({
      ...prev,
      quickFilterValues: values,
    }));
  }, [debouncedQuick]);

  // Sync author input to model (debounced)
  useEffect(() => {
    const next = debouncedAuthor.trim();
    setFilterModel((prev) => {
      const otherItems = (prev.items || []).filter(
        (i) => i.columnField !== "author",
      );
      const newItems = next
        ? otherItems.concat([
          { columnField: "author", operatorValue: "contains", value: next },
        ])
        : otherItems;
      return { ...prev, items: newItems };
    });
  }, [debouncedAuthor]);

  const handleStatusChange = useCallback(
    (event) => {
      const values = event.target.value;
      const otherItems = (filterModel.items || []).filter(
        (i) => i.columnField !== "status",
      );
      const newItems = values.length
        ? otherItems.concat([
          { columnField: "status", operatorValue: "isAnyOf", value: values },
        ])
        : otherItems;
      setFilterModel({ ...filterModel, items: newItems });
    },
    [filterModel, setFilterModel],
  );

  const handleSortField = useCallback(
    (event) => {
      const field = event.target.value;
      setSortModel([{ field, sort: sortDir }]);
    },
    [setSortModel, sortDir],
  );

  const handleSortDir = useCallback(
    (event) => {
      const dir = event.target.value;
      setSortModel([{ field: sortField, sort: dir }]);
    },
    [setSortModel, sortField],
  );

  const handleReset = useCallback(() => {
    setQuick("");
    setAuthor("");
    resetListState();
  }, [resetListState]);

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
    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" mb={2}>
      <TextField
        variant="outlined"
        size="small"
        label={searchLabel}
        value={quick}
        onChange={(e) => setQuick(e.target.value)}
        style={{ minWidth: 200 }}
      />

      <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}>
        <InputLabel>{statusLabel}</InputLabel>
        <Select
          multiple
          value={statusValues}
          onChange={handleStatusChange}
          input={<OutlinedInput label={statusLabel} />}
          renderValue={(selected) =>
            (selected || []).map((s) => statusToText(s)).join(", ")
          }
        >
          {STATUS_OPTIONS.map((s) => (
            <MenuItem key={s || "draft"} value={s}>
              <Checkbox checked={statusValues.indexOf(s) > -1} />
              <ListItemText primary={statusToText(s)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        variant="outlined"
        size="small"
        label={authorLabel}
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        style={{ minWidth: 220 }}
      />

      <FormControl variant="outlined" size="small" style={{ minWidth: 160 }}>
        <InputLabel>{sortByLabel}</InputLabel>
        <Select
          value={sortField}
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
        <Select value={sortDir} onChange={handleSortDir} label={directionLabel}>
          <MenuItem value="asc">
            {language === "en" ? "Ascending" : "Croissant"}
          </MenuItem>
          <MenuItem value="desc">
            {language === "en" ? "Descending" : "Décroissant"}
          </MenuItem>
        </Select>
      </FormControl>

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
