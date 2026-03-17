import { useMemo, useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Box, CircularProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { useColumnVisibility } from "./hooks";
import { createColumns, recordToRow } from "./config";
import RecordActions from "./RecordActions";
import MobileRecordRow from "./MobileRecordRow";

const RecordTable = ({
  records,
  config,
  loading,
  onEditRecord,
  onDeleteRecord,
  onCloneRecord,
  onSubmitRecord,
  onTransferRecord,
  onGithubPublishClick,
  githubPublishEnabled,
}) => {
  const { language, region } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Build action handlers object
  const actionHandlers = useMemo(
    () => ({
      edit: onEditRecord,
      delete: onDeleteRecord,
      clone: onCloneRecord,
      submit: (recordID, userID) =>
        onSubmitRecord?.(recordID, userID, "submitted"),
      publish: (recordID, userID) =>
        onSubmitRecord?.(recordID, userID, "published"),
      unpublish: (recordID, userID) =>
        onSubmitRecord?.(recordID, userID, "submitted"),
      unsubmit: (recordID, userID) => onSubmitRecord?.(recordID, userID, ""),
      transfer: onTransferRecord,
      githubPublish: onGithubPublishClick,
    }),
    [
      onEditRecord,
      onDeleteRecord,
      onCloneRecord,
      onSubmitRecord,
      onTransferRecord,
      onGithubPublishClick,
    ],
  );

  const {
    columnVisibilityModel,
    handleColumnVisibilityChange,
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
        return col;
      })
      .filter(Boolean);

    // Add actions column
    cols.push({
      field: "actions",
      headerName: language === "en" ? "Actions" : "Actions",
      width: 70,
      minWidth: 60,
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        ...(isMobile && {
          height: "calc(100vh - 200px)",
          "& .MuiDataGrid-columnHeaders": {
            display: "none",
          },
          "& .MuiDataGrid-cell": {
            display: "none",
          },
          "& .MuiDataGrid-virtualScrollerContent": {
            paddingBottom: "8px",
            width: "100% !important",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            width: "100%",
          },
          "& .MuiDataGrid-row": {
            width: "100% !important",
            maxWidth: "100% !important",
          },
        }),
      }}
    >
      <DataGrid
        autoHeight={!isMobile}
        sx={{
          width: "100%",
          minWidth: 0,
          border: "none",
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
          "& .MuiDataGrid-row": {
            cursor: "pointer",
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
          ...(isMobile && { row: MobileRecordRow }),
          noRowsOverlay: () => (
            <div style={{ padding: "20px", textAlign: "center" }}>
              {language === "en"
                ? "No records found."
                : "Aucun enregistrement trouvé."}
            </div>
          ),
        }}
        slotProps={{
          ...(isMobile && {
            row: {
              language,
              region,
              config,
              actionHandlers,
              githubPublishEnabled,
            },
          }),
          filterPanel: {
            sx: {
              [theme.breakpoints.down("sm")]: {
                "& .MuiDataGrid-filterForm": {
                  flexDirection: "column",
                  gap: 1,
                  "& .MuiDataGrid-filterFormDeleteIcon": {
                    alignSelf: "flex-end",
                  },
                  "& .MuiDataGrid-filterFormLogicOperatorInput": {
                    display: "none",
                  },
                  "& .MuiOutlinedInput-root": {
                    width: "100%",
                  },
                },
              },
            },
          },
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
        columnVisibilityModel={
          isMobile
            ? {
              ...Object.fromEntries(columns.map((col) => [col.field, false])),
              // Keep one column visible so DataGrid renders rows
              title: true,
            }
            : columnVisibilityModel
        }
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
      />
    </Box>
  );
};

export default RecordTable;
