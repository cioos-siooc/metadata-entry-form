import { useMemo, useCallback, useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { Box, Button, CircularProgress, Snackbar, Alert } from "@mui/material";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import {
  DataGrid,
  useGridApiRef,
  gridFilteredSortedRowIdsSelector,
} from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid/locales";

import {
  useColumnVisibility,
  useRecordTableFilters,
  markFormNavigation,
} from "./hooks";
import { createColumns, recordToRow } from "./config";
import RecordActions from "./RecordActions";
import MobileRecordRow from "./MobileRecordRow";
import copyToClipboard from "../../utils/copyToClipboard";
import { UserContext } from "../../providers/UserProvider";

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
  onReviewRecord,
  githubPublishEnabled,
  emptyMessage,
}) => {
  const { language, region } = useParams();
  const { doiStatusManagement } = useContext(UserContext);
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
      review: onReviewRecord,
    }),
    [
      onEditRecord,
      onDeleteRecord,
      onCloneRecord,
      onSubmitRecord,
      onTransferRecord,
      onGithubPublishClick,
      onReviewRecord,
    ],
  );

  const { columnVisibilityModel, handleColumnVisibilityChange } =
    useColumnVisibility(
      config.table?.columnVisibilityStorageKey ||
        `${config.pageId}-column-visibility`,
      config.defaultColumnVisibility || {},
    );

  const { filterModel, setFilterModel, sortModel, setSortModel } =
    useRecordTableFilters(config.pageId);

  const apiRef = useGridApiRef();
  const [visibleRowCount, setVisibleRowCount] = useState(0);

  const filtersActive = useMemo(() => {
    if (filterModel?.items?.length > 0) return true;
    if (filterModel?.quickFilterValues?.length > 0) return true;
    if (sortModel?.length > 0) return true;
    return false;
  }, [filterModel, sortModel]);

  const handleClearFilters = useCallback(() => {
    setFilterModel({ items: [], quickFilterValues: [] });
    setSortModel([]);
  }, [setFilterModel, setSortModel]);

  // Counted after filtering settles rather than from onStateChange, which
  // fires while the grid renders and made React warn about a cross-component
  // update.
  useEffect(() => {
    const api = apiRef.current;
    if (loading || !api?.subscribeEvent) return undefined;
    const count = () =>
      setVisibleRowCount(gridFilteredSortedRowIdsSelector(apiRef).length);
    count();
    const offFiltered = api.subscribeEvent("filteredRowsSet", count);
    const offSorted = api.subscribeEvent("sortedRowsSet", count);
    return () => {
      offFiltered();
      offSorted();
    };
  }, [apiRef, loading]);

  // Toast state for copy-to-clipboard feedback
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState("success");

  const showToast = useCallback((message, severity = "success") => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  const closeToast = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    setToastOpen(false);
  }, []);

  const handleNavigateToRecord = useCallback(
    (row) => {
      const { userID, recordID, region: rowRegion } = row;
      if (userID && recordID) {
        // Same marker the Actions > Edit path sets, so returning from the form
        // keeps the table's filters either way you opened the record.
        markFormNavigation(config.pageId);
        navigate(`/${language}/${rowRegion || region}/${userID}/${recordID}`);
      }
    },
    [navigate, language, region, config.pageId],
  );

  const handleRowClick = useCallback(
    (params, event) => {
      // Don't navigate if the click landed on the actions column, a copy
      // button, or another interactive element inside the row.
      if (
        event.target.closest('[data-field="actions"]') ||
        event.target.closest("button") ||
        event.target.closest("a")
      ) {
        return;
      }
      handleNavigateToRecord(params.row);
    },
    [handleNavigateToRecord],
  );

  const handleCopyCell = useCallback(
    (text) => {
      copyToClipboard(text)
        .then(() => {
          showToast(language === "fr" ? "Copié !" : "Copied!", "success");
        })
        .catch(() => {
          showToast(
            language === "fr" ? "Échec de la copie" : "Copy failed",
            "error",
          );
        });
    },
    [language, showToast],
  );

  // Create column definitions for current language
  const columnDefs = useMemo(
    () =>
      createColumns(language, region, {
        onCopy: handleCopyCell,
      }),
    [language, region, handleCopyCell],
  );

  // Build columns array from config with mobile responsiveness
  const columns = useMemo(() => {
    // On mobile, show only essential columns: title, status, progress, created, and actions
    const mobileColumns = ["title", "author", "status", "progress", "created"];
    const columnsToShow = isMobile ? mobileColumns : config.columns || [];

    const cols = columnsToShow
      .map((colName) => {
        // DOI status is only meaningful/up-to-date for regions that manage DOI
        // status from the form; hide the column for DataCite-managed regions.
        if (colName === "doiStatus" && doiStatusManagement !== "form")
          return null;
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
    doiStatusManagement,
  ]);

  // Transform records to rows
  const rows = useMemo(
    () =>
      (records || []).map((record, index) =>
        recordToRow(record, language, index),
      ),
    [records, language],
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
      sx={(t) => ({
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        // Desktop: one bordered surface for toolbar, rows and pager. Mobile
        // rows are cards of their own, so the frame would double up.
        ...(!isMobile && {
          border: `1px solid ${t.vars.palette.divider}`,
          borderRadius: 1.5,
          overflow: "hidden",
          bgcolor: "background.paper",
        }),
        ...(isMobile && {
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
      })}
    >
      {filtersActive && (
        <Box
          role="status"
          sx={(t) => ({
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            px: 1.5,
            py: 1,
            bgcolor: "background.brandSubtle",
            borderBottom: `1px solid ${t.vars.palette.divider}`,
            fontSize: "0.875rem",
          })}
        >
          <FilterAltOffIcon fontSize="small" sx={{ color: "text.secondary" }} />
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            {language === "en"
              ? `Showing ${visibleRowCount} of ${rows.length} records`
              : `${visibleRowCount} enregistrements sur ${rows.length}`}
          </Box>
          <Button size="small" onClick={handleClearFilters}>
            {language === "en"
              ? "Clear filters and sorting"
              : "Effacer filtres et tri"}
          </Button>
        </Box>
      )}
      <DataGrid
        apiRef={apiRef}
        autoHeight
        sx={{ width: "100%", minWidth: 0 }}
        rows={rows}
        columns={columns}
        onRowClick={handleRowClick}
        getRowHeight={() => (isMobile ? "auto" : 56)}
        disableRowSelectionOnClick
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: config.table?.pageSize || 20,
              page: 0,
            },
          },
        }}
        pageSizeOptions={config.table?.rowsPerPageOptions || [10, 20, 50, 100]}
        showToolbar={true}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        slots={{
          ...(isMobile && { row: MobileRecordRow }),
          noRowsOverlay: () => (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 3,
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              {emptyMessage ||
                (language === "en"
                  ? "No records match."
                  : "Aucun enregistrement ne correspond.")}
            </Box>
          ),
        }}
        slotProps={{
          row: isMobile
            ? {
                language,
                region,
                config,
                actionHandlers,
                githubPublishEnabled,
                onCopy: handleCopyCell,
                onNavigate: handleNavigateToRecord,
              }
            : {},
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
          // The full French pack (pager, menus, operators), then our wording.
          ...(language === "fr"
            ? frFR.components.MuiDataGrid.defaultProps.localeText
            : {}),
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
            language === "en" ? "Search…" : "Rechercher…",
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

      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={closeToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeToast}
          severity={toastSeverity}
          variant="filled"
          elevation={6}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RecordTable;
