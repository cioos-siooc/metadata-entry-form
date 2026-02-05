import React, { useMemo, useCallback, useState } from "react";
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Edit,
  Visibility,
  Delete,
  FileCopy,
  Publish,
  Eject,
  TransferWithinAStation,
  CloudUpload,
  CloudDownload,
  OpenInNew,
  Refresh,
} from "@mui/icons-material";
import FileSaver from "file-saver";
import { getFunctions, httpsCallable } from "firebase/functions";
import recordToEML from "../../utils/recordToEML";
import recordToDataCite from "../../utils/recordToDataCite";
import { getRecordFilename } from "../../utils/misc";
import { recordIsValid } from "../../utils/validate";
import regions from "../../regions";
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

// Separate component for row actions to manage menu state
const RowActions = ({
  rowData,
  actions,
  actionHandlers,
  githubPublishEnabled,
  language,
  region,
  datacitePrefix,
}) => {
  const [publishAnchorEl, setPublishAnchorEl] = useState(null);
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const publishMenuOpen = Boolean(publishAnchorEl);
  const downloadMenuOpen = Boolean(downloadAnchorEl);

  const handlePublishClick = (event) => {
    setPublishAnchorEl(event.currentTarget);
  };

  const handlePublishClose = () => {
    setPublishAnchorEl(null);
  };

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  const isPublished = rowData.status === "published";
  const isSubmitted = rowData.status === "submitted";
  const isDraft = rowData.status === "";

  const record = rowData.fullRecord;
  const isValidRecord = record && recordIsValid(record);
  const catalogueURL =
    record && isPublished
      ? `${regions[region]?.catalogueURL?.[language] || ""}dataset/ca-cioos_${record.identifier}`
      : null;

  // Download handler
  const handleDownloadRecord = async (fileType) => {
    if (!record) return;
    const extensions = {
      erddap: "_erddap.xml",
      xml: ".xml",
      yaml: ".yaml",
      eml: "_eml.xml",
      json: ".json",
      dataciteJson: "_dataCite.json",
    };
    const mimeTypes = {
      xml: "application/xml",
      yaml: "application/x-yaml",
      eml: "application/xml",
      erddap: "application/xml",
      json: "application/json",
      dataciteJson: "application/json",
    };

    setIsDownloading(true);
    try {
      let blob;
      if (fileType === "eml") {
        const emlStr = await recordToEML(record);
        blob = new Blob([emlStr], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      } else if (fileType === "json") {
        blob = new Blob([JSON.stringify(record, null, 2)], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      } else if (fileType === "dataciteJson") {
        const dc = recordToDataCite(record, language, region, datacitePrefix);
        blob = new Blob([JSON.stringify(dc, null, 2)], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      } else {
        const functions = getFunctions();
        const convertMetadata = httpsCallable(functions, "convert_metadata");
        const resp = await convertMetadata({
          record_data: record,
          output_format: fileType,
        });
        const resultText = resp?.data ?? "";
        blob = new Blob([resultText], {
          type: `${mimeTypes[fileType]};charset=utf-8`,
        });
      }

      FileSaver.saveAs(
        blob,
        `${getRecordFilename(record)}${extensions[fileType]}`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine if we should show the grouped publish menu
  const showPublishMenu =
    (isSubmitted && actions.showPublishAction) ||
    (isPublished && actions.showUnPublishAction) ||
    (isSubmitted && actions.showUnSubmitAction) ||
    ((isSubmitted || isPublished) && actions.showGithubPublishAction);

  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {/* View/Edit button */}
      {(actions.showViewAction || actions.showEditAction) && (
        <Tooltip
          title={
            isPublished || actions.showViewAction ? (
              <I18n en="View" fr="Voir" />
            ) : (
              <I18n en="Edit" fr="Modifier" />
            )
          }
        >
          <IconButton
            size="small"
            onClick={() =>
              actionHandlers.edit?.(rowData.recordID, rowData.userID)
            }
          >
            {isPublished || actions.showViewAction ? (
              <Visibility fontSize="small" />
            ) : (
              <Edit fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}

      {/* Clone */}
      {actions.showCloneAction && (
        <Tooltip title={<I18n en="Clone" fr="Dupliquer" />}>
          <IconButton
            size="small"
            onClick={() =>
              actionHandlers.clone?.(rowData.recordID, rowData.userID)
            }
          >
            <FileCopy fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Delete */}
      {actions.showDeleteAction && (
        <Tooltip title={<I18n en="Delete" fr="Supprimer" />}>
          <IconButton
            size="small"
            onClick={() =>
              actionHandlers.delete?.(rowData.recordID, rowData.userID)
            }
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Transfer */}
      {actions.showTransferButton && (
        <Tooltip title={<I18n en="Transfer" fr="Transférer" />}>
          <IconButton
            size="small"
            onClick={() =>
              actionHandlers.transfer?.(rowData.recordID, rowData.userID)
            }
          >
            <TransferWithinAStation fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Submit (Draft -> Submitted) - standalone button for user submissions */}
      {isDraft && actions.showSubmitAction && (
        <Tooltip
          title={<I18n en="Submit for review" fr="Soumettre pour examen" />}
        >
          <IconButton
            size="small"
            onClick={() =>
              actionHandlers.submit?.(rowData.recordID, rowData.userID)
            }
          >
            <Publish fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Grouped Publish Menu (for reviewers) */}
      {showPublishMenu && (
        <>
          <Tooltip
            title={<I18n en="Publishing Options" fr="Options de publication" />}
            open={!publishMenuOpen ? undefined : false}
          >
            <IconButton size="small" onClick={handlePublishClick}>
              <Publish fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={publishAnchorEl}
            open={publishMenuOpen}
            onClose={handlePublishClose}
            disableScrollLock
          >
            {/* Publish (Submitted -> Published) */}
            {isSubmitted && actions.showPublishAction && (
              <MenuItem
                onClick={() => {
                  actionHandlers.publish?.(rowData.recordID, rowData.userID);
                  handlePublishClose();
                }}
              >
                <Publish style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Publish" fr="Publier" />
              </MenuItem>
            )}

            {/* Unpublish (Published -> Submitted) */}
            {isPublished && actions.showUnPublishAction && (
              <MenuItem
                onClick={() => {
                  actionHandlers.unpublish?.(rowData.recordID, rowData.userID);
                  handlePublishClose();
                }}
              >
                <Eject style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Un-publish" fr="Dépublier" />
              </MenuItem>
            )}

            {/* Unsubmit (Submitted -> Draft) */}
            {isSubmitted && actions.showUnSubmitAction && (
              <MenuItem
                onClick={() => {
                  actionHandlers.unsubmit?.(rowData.recordID, rowData.userID);
                  handlePublishClose();
                }}
              >
                <Eject style={{ marginRight: 8 }} fontSize="small" />
                <I18n en="Return to draft" fr="Revenir au brouillon" />
              </MenuItem>
            )}

            {/* GitHub Publish */}
            {(isSubmitted || isPublished) &&
              actions.showGithubPublishAction && (
                <Tooltip
                  title={
                    <I18n
                      en="GitHub publishing not configured"
                      fr="La publication GitHub n'est pas configurée"
                    />
                  }
                  disableHoverListener={githubPublishEnabled}
                  disableFocusListener={githubPublishEnabled}
                  disableTouchListener={githubPublishEnabled}
                >
                  <span>
                    <MenuItem
                      disabled={!githubPublishEnabled}
                      onClick={() => {
                        if (githubPublishEnabled) {
                          actionHandlers.githubPublish?.(
                            rowData.recordID,
                            rowData.userID,
                          );
                        }
                        handlePublishClose();
                      }}
                    >
                      <CloudUpload
                        style={{ marginRight: 8 }}
                        fontSize="small"
                      />
                      <I18n en="Publish to GitHub" fr="Publier sur GitHub" />
                    </MenuItem>
                  </span>
                </Tooltip>
              )}
          </Menu>
        </>
      )}

      {/* Download Button */}
      {actions.showDownloadButton && (
        <>
          <Tooltip
            title={<I18n en="Download" fr="Télécharger" />}
            open={downloadMenuOpen ? false : undefined}
          >
            <span>
              <IconButton
                size="small"
                onClick={handleDownloadClick}
                disabled={!isValidRecord}
              >
                {isDownloading ? (
                  <CircularProgress size={18} />
                ) : (
                  <CloudDownload fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Menu
            anchorEl={downloadAnchorEl}
            open={downloadMenuOpen}
            onClose={handleDownloadClose}
            disableScrollLock
          >
            <MenuItem
              onClick={() => {
                handleDownloadRecord("iso19115-3_xml");
                handleDownloadClose();
              }}
            >
              ISO 19115-3 XML
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("yaml");
                handleDownloadClose();
              }}
            >
              YAML
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("erddap");
                handleDownloadClose();
              }}
            >
              ERDDAP snippet
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("eml");
                handleDownloadClose();
              }}
            >
              EML for OBIS IPT
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("json");
                handleDownloadClose();
              }}
            >
              Database JSON
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDownloadRecord("dataciteJson");
                handleDownloadClose();
              }}
            >
              DATACITE JSON
            </MenuItem>
          </Menu>
        </>
      )}

      {/* Catalogue Link */}
      <Tooltip
        title={
          <I18n
            en="Open catalogue entry in new window"
            fr="Ouvrir l'entrée dans le catalogue dans une nouvelle fenêtre"
          />
        }
      >
        <span>
          <IconButton
            size="small"
            disabled={!isPublished || !catalogueURL}
            onClick={() => {
              if (catalogueURL) {
                const win = window.open(catalogueURL, "_blank");
                win?.focus();
              }
            }}
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
};

const RecordTableView = ({ records }) => {
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

  // Shared filter/sort state across table and cards (from context)
  const {
    filterModel,
    setFilterModel,
    sortModel,
    setSortModel,
    resetListState,
  } = listState;

  // Reset handler for columns and filters
  const handleReset = useCallback(() => {
    resetColumnVisibility();
    resetListState();
  }, [resetColumnVisibility, resetListState]);

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

    // Add actions column - use fixed width to fit buttons only
    cols.push({
      field: "actions",
      headerName: language === "en" ? "Actions" : "Actions",
      width: 280,
      minWidth: 240,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <RowActions
          rowData={params.row}
          actions={config.actions || {}}
          actionHandlers={actionHandlers}
          githubPublishEnabled={githubPublishEnabled}
          language={language}
          region={region}
          datacitePrefix=""
        />
      ),
    });

    return cols;
  }, [config, columnDefs, language, region, actionHandlers, githubPublishEnabled]);

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

  return (
    <div style={{ height: "calc(100vh - 300px)", width: "100%" }}>
      <DataGrid
        sx={{ "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" } }}
        rows={rows}
        columns={columns}
        pageSize={config.table?.pageSize || 20}
        rowsPerPageOptions={
          config.table?.rowsPerPageOptions || [10, 20, 50, 100]
        }
        checkboxSelection={false}
        disableSelectionOnClick
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        components={{
          Toolbar: CustomToolbar,
          NoRowsOverlay: () => (
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
