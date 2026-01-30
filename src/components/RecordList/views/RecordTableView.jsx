import React, { useMemo } from 'react';
import {
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  Edit,
  Visibility,
  Delete,
  FileCopy,
  Publish,
  Eject,
  TransferWithinAStation,
  CloudUpload,
} from '@material-ui/icons';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarQuickFilter,
  GridToolbarExport,
} from '@mui/x-data-grid';

import { useRecordListContext } from '../RecordListContext';
import { useColumnVisibility } from '../hooks';
import { createColumns, recordToRow } from '../config/columnDefinitions';
import { I18n } from '../../I18n';

const RecordTableView = ({ records }) => {
  const { config, actionHandlers, language, region, githubPublishEnabled } = useRecordListContext();

  const { columnVisibilityModel, handleColumnVisibilityChange } = useColumnVisibility(
    config.table?.columnVisibilityStorageKey || `${config.pageId}-column-visibility`,
    config.defaultColumnVisibility || {}
  );

  // Create column definitions for current language
  const columnDefs = useMemo(() => createColumns(language, region), [language, region]);

  // Build columns array from config
  const columns = useMemo(() => {
    const cols = (config.columns || [])
      .map((colName) => columnDefs[colName])
      .filter(Boolean);

    // Add actions column
    cols.push({
      field: 'actions',
      headerName: language === 'en' ? 'Actions' : 'Actions',
      flex: 1.5,
      minWidth: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const rowData = params.row;
        const isPublished = rowData.status === 'published';
        const isSubmitted = rowData.status === 'submitted';
        const isDraft = rowData.status === '';

        const actions = config.actions || {};

        return (
          <div style={{ display: 'flex', gap: '4px' }}>
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
                  onClick={() => actionHandlers.edit?.(rowData.recordID, rowData.userID)}
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
                  onClick={() => actionHandlers.clone?.(rowData.recordID, rowData.userID)}
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
                  onClick={() => actionHandlers.delete?.(rowData.recordID, rowData.userID)}
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
                  onClick={() => actionHandlers.transfer?.(rowData.recordID, rowData.userID)}
                >
                  <TransferWithinAStation fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Submit (Draft -> Submitted) */}
            {isDraft && actions.showSubmitAction && (
              <Tooltip title={<I18n en="Submit" fr="Soumettre" />}>
                <IconButton
                  size="small"
                  onClick={() => actionHandlers.submit?.(rowData.recordID, rowData.userID)}
                >
                  <Publish fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Publish (Submitted -> Published) */}
            {isSubmitted && actions.showPublishAction && (
              <Tooltip title={<I18n en="Publish" fr="Publier" />}>
                <IconButton
                  size="small"
                  onClick={() => actionHandlers.publish?.(rowData.recordID, rowData.userID)}
                >
                  <Publish fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Unsubmit (Submitted -> Draft) */}
            {isSubmitted && actions.showUnSubmitAction && (
              <Tooltip title={<I18n en="Unsubmit" fr="Annuler la soumission" />}>
                <IconButton
                  size="small"
                  onClick={() => actionHandlers.unsubmit?.(rowData.recordID, rowData.userID)}
                >
                  <Eject fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* Unpublish (Published -> Submitted) */}
            {isPublished && actions.showUnPublishAction && (
              <Tooltip title={<I18n en="Unpublish" fr="Dépublier" />}>
                <IconButton
                  size="small"
                  onClick={() => actionHandlers.unpublish?.(rowData.recordID, rowData.userID)}
                >
                  <Eject fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {/* GitHub Publish */}
            {isSubmitted && actions.showGithubPublishAction && githubPublishEnabled && (
              <Tooltip title={<I18n en="Publish to GitHub" fr="Publier sur GitHub" />}>
                <IconButton
                  size="small"
                  onClick={() => actionHandlers.githubPublish?.(rowData.recordID, rowData.userID)}
                >
                  <CloudUpload fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [config, columnDefs, language, actionHandlers, githubPublishEnabled]);

  // Transform records to rows
  const rows = useMemo(
    () => (records || []).map((record, index) => recordToRow(record, language, index)),
    [records, language]
  );

  return (
    <div style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
      <DataGrid
        sx={{
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
          },
        }}
        rows={rows}
        columns={columns}
        pageSize={config.table?.pageSize || 20}
        rowsPerPageOptions={config.table?.rowsPerPageOptions || [10, 20, 50, 100]}
        checkboxSelection={false}
        disableSelectionOnClick
        components={{
          Toolbar: () => (
            <GridToolbarContainer
              style={{ padding: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}
            >
              <GridToolbarQuickFilter />
              <GridToolbarColumnsButton />
              <GridToolbarExport />
            </GridToolbarContainer>
          ),
          NoRowsOverlay: () => (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              {language === 'en'
                ? 'No records found.'
                : 'Aucun enregistrement trouvé.'}
            </div>
          ),
        }}
        localeText={{
          toolbarColumns: language === 'en' ? 'Columns' : 'Colonnes',
          toolbarColumnsLabel: language === 'en' ? 'Select columns' : 'Sélectionner les colonnes',
          columnsPanelTextFieldLabel: language === 'en' ? 'Find column' : 'Rechercher une colonne',
          columnsPanelTextFieldPlaceholder: language === 'en' ? 'Column title' : 'Titre de la colonne',
          columnsPanelShowAllButton: language === 'en' ? 'Show all' : 'Afficher tout',
          columnsPanelHideAllButton: language === 'en' ? 'Hide all' : 'Masquer tout',
          toolbarQuickFilterPlaceholder: language === 'en' ? 'Search...' : 'Rechercher...',
        }}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={handleColumnVisibilityChange}
      />
    </div>
  );
};

export default RecordTableView;
