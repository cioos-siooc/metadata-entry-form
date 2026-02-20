import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, Button } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarQuickFilter,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";

import { useRecordListContext } from "./context";
import { useColumnVisibility } from "./hooks";
import { createColumns, recordToRow } from "./config";
import { I18n } from "../I18n";
import RecordActions from "./RecordActions";

const RecordTableView = ({ records }) => {
  const navigate = useNavigate();
  const {
    config,
    actionHandlers,
    language,
    region,
    githubPublishEnabled,
    listState,
  } = useRecordListContext();

  const {
    columnVisibilityModel,
    handleColumnVisibilityChange,
    resetColumnVisibility,
  } = useColumnVisibility(
    config.table?.columnVisibilityStorageKey ||
    `${config.pageId}-column-visibility`,
    config.defaultColumnVisibility || {},
  );

  // Table-specific filter and sort state (independent from card view)
  const tableFilterKey = `record-table-filters-${config.pageId}`;
  const [filterModel, setFilterModel] = useState(() => {
    try {
      const saved = localStorage.getItem(tableFilterKey);
      if (saved) {
        return JSON.parse(saved).filterModel || { items: [] };
      }
    } catch { /* ignore storage errors */ }
    return { items: [] };
  });

  const [sortModel, setSortModel] = useState(() => {
    try {
      const saved = localStorage.getItem(tableFilterKey);
      if (saved) {
        return JSON.parse(saved).sortModel || [];
      }
    } catch { /* ignore storage errors */ }
    return [];
  });

  // Persist table filters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        tableFilterKey,
        JSON.stringify({ filterModel, sortModel })
      );
    } catch { /* ignore storage errors */ }
  }, [filterModel, sortModel, tableFilterKey]);

  // Reset handler for columns and filters
  const handleReset = useCallback(() => {
    resetColumnVisibility();
    setFilterModel({ items: [] });
    setSortModel([]);
    try {
      localStorage.removeItem(tableFilterKey);
    } catch { /* ignore storage errors */ }
  }, [resetColumnVisibility, tableFilterKey]);

  // Create column definitions for current language
  const columnDefs = useMemo(
    () => createColumns(language, region),
    [language, region],
  );

  // Build columns array from config
  const columns = useMemo(() => {
    const cols = (config.columns || [])
      .map((colName) => columnDefs[colName])
      .filter(Boolean);

    // Add actions column
    cols.push({
      field: "actions",
      headerName: language === "en" ? "Actions" : "Actions",
      width: 70,
      minWidth: 60,
      headerAlign: "center",
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <RecordActions
          record={params.row.fullRecord}
          recordID={params.row.recordID}
          userID={params.row.userID}
          status={params.row.status}
          actions={config.actions || {}}
          handlers={actionHandlers}
          language={language}
          region={region}
          githubPublishEnabled={githubPublishEnabled}
          size="small"
        />
      ),
    });

    return cols;
  }, [
    config,
    columnDefs,
    language,
    region,
    actionHandlers,
    githubPublishEnabled,
  ]);

  // Transform records to rows
  const rows = useMemo(
    () =>
      (records || []).map((record, index) =>
        recordToRow(record, language, index),
      ),
    [records, language],
  );

  // Custom toolbar with reset button
  const CustomToolbar = useCallback(
    () => (
      <GridToolbarContainer
        style={{
          padding: "8px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "8px",
        }}
      >
        <GridToolbarQuickFilter />
        <GridToolbarFilterButton />
        <GridToolbarColumnsButton />
        <GridToolbarExport />
        <Tooltip
          title={
            <I18n
              en="Reset columns & filters"
              fr="Réinitialiser colonnes et filtres"
            />
          }
        >
          <Button size="small" startIcon={<Refresh />} onClick={handleReset}>
            <I18n en="Reset" fr="Réinitialiser" />
          </Button>
        </Tooltip>
      </GridToolbarContainer>
    ),
    [handleReset],
  );

  // Handle row click to navigate to record
  const handleRowClick = useCallback(
    (params, event) => {
      // Don't navigate if clicking on actions column or interactive elements
      if (
        event.target.closest('[data-field="actions"]') ||
        event.target.closest("button") ||
        event.target.closest("a")
      ) {
        return;
      }
      const { userID, recordID, region: rowRegion } = params.row;
      if (userID && recordID) {
        navigate(`/${language}/${rowRegion || region}/${userID}/${recordID}`);
      }
    },
    [navigate, language, region],
  );

  return (
    <div style={{ width: "100%", maxHeight: "calc(100vh - 300px)", overflow: "auto" }}>
      <DataGrid
        autoHeight
        sx={{
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-row": { cursor: "pointer" },
          "& .MuiDataGrid-row:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        }}
        rows={rows}
        columns={columns}
        onRowClick={handleRowClick}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: config.table?.pageSize || 20,
              page: 0,
            },
          },
        }}
        pageSizeOptions={
          config.table?.rowsPerPageOptions || [10, 20, 50, 100]
        }
        showToolbar={true}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        slots={{
          toolbar: CustomToolbar,
          noRowsOverlay: () => (
            <div style={{ padding: "20px", textAlign: "center" }}>
              {language === "en"
                ? "No records found."
                : "Aucun enregistrement trouvé."}
            </div>
          ),
        }}
        localeText={{
          toolbarColumns: language === "en" ? "Columns" : "Colonnes",
          toolbarColumnsLabel:
            language === "en" ? "Select columns" : "Sélectionner les colonnes",
          columnsPanelTextFieldLabel:
            language === "en" ? "Find column" : "Rechercher une colonne",
          columnsPanelTextFieldPlaceholder:
            language === "en" ? "Column title" : "Titre de la colonne",
          columnsPanelShowAllButton:
            language === "en" ? "Show all" : "Afficher tout",
          columnsPanelHideAllButton:
            language === "en" ? "Hide all" : "Masquer tout",
          toolbarQuickFilterPlaceholder:
            language === "en" ? "Search..." : "Rechercher...",
          toolbarFilters: language === "en" ? "Filters" : "Filtres",
          toolbarFiltersLabel:
            language === "en" ? "Show filters" : "Afficher les filtres",
          toolbarFiltersTooltipHide:
            language === "en" ? "Hide filters" : "Masquer les filtres",
          toolbarFiltersTooltipShow:
            language === "en" ? "Show filters" : "Afficher les filtres",
          toolbarFiltersTooltipActive: (count) =>
            language === "en"
              ? `${count} active filter(s)`
              : `${count} filtre(s) actif(s)`,
        }}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
      />
    </div>
  );
};

export default RecordTableView;
