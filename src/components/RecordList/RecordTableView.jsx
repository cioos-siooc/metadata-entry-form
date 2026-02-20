import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DataGrid } from "@mui/x-data-grid";

import { useRecordListContext } from "./context";
import { useColumnVisibility } from "./hooks";
import { createColumns, recordToRow } from "./config";
import RecordActions from "./RecordActions";

const RecordTableView = ({ records }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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


  // Create column definitions for current language
  const columnDefs = useMemo(
    () => createColumns(language, region),
    [language, region],
  );

  // Build columns array from config with mobile responsiveness
  const columns = useMemo(() => {
    // On mobile, show only essential columns: title, status, progress, created, and actions
    const mobileColumns = ["title", "author", "status", "progress", "created"];
    const columnsToShow = isMobile ? mobileColumns : (config.columns || []);

    const cols = columnsToShow
      .map((colName) => {
        const col = columnDefs[colName];
        if (!col) return null;

        // On mobile, adjust column sizing to prevent overflow
        if (isMobile) {
          return {
            ...col,
            minWidth: col.field === "title" ? 100 : 60,
            maxWidth: col.field === "title" ? 200 : 120,
            flex: 0,
          };
        }
        return col;
      })
      .filter(Boolean);

    // Add actions column
    cols.push({
      field: "actions",
      headerName: language === "en" ? "Actions" : "Actions",
      width: isMobile ? 50 : 70,
      minWidth: isMobile ? 50 : 60,
      flex: 0,
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
    isMobile,
  ]);

  // Transform records to rows
  const rows = useMemo(
    () =>
      (records || []).map((record, index) =>
        recordToRow(record, language, index),
      ),
    [records, language],
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
    <div style={{
      width: "100%",
      maxWidth: "100vw",
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      <DataGrid
        autoHeight={true}
        sx={{
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
          "& .MuiDataGrid-root": {
            border: "none",
            width: "100%",
            ...(isMobile && {
              overflowX: "hidden",
            }),
          },
          "& .MuiDataGrid-row": {
            cursor: "pointer",
            ...(isMobile && {
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px",
              margin: "4px 0",
              border: "1px solid #e0e0e0",
              borderRadius: "14px",
              backgroundColor: "#fafafa",
              // boxSizing: "border-box",
            }),
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: isMobile ? "#f5f5f5" : "rgba(0, 0, 0, 0.04)",
          },
          "& .MuiDataGrid-columnHeader": {
            ...(isMobile && {
              display: "none",
            }),
          },
          "& .MuiDataGrid-cell": {
            ...(isMobile && {
              border: "none",
              // padding: "4px",
              minWidth: "auto",
              flex: "0 1 auto",
              maxWidth: "none",
              whiteSpace: "normal",
              overflow: "visible",
              display: "inline-flex",
              alignItems: "center",
            }),
          },
          "& .MuiDataGrid-cell[data-field='title']": {
            ...(isMobile && {
              flexBasis: "100%",
              fontSize: "1rem",
              // marginBottom: "8px",
            }),
          },
          "& .MuiDataGrid-cell[data-field='author']": {
            ...(isMobile && {
              flexBasis: "100%",
              // marginBottom: "8px",
            }),
          },
          "& .MuiDataGrid-virtualScroller": {
            ...(isMobile && {
              overflowX: "hidden !important",
            }),
          },
          "& .MuiDataGrid-main": {
            ...(isMobile && {
              overflowX: "hidden !important",
            }),
          },
        }}
        rows={rows}
        columns={columns}
        onRowClick={handleRowClick}
        getRowHeight={() => isMobile ? "auto" : 52}
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
