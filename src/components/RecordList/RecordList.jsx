import React, { useMemo } from 'react';
import { Box, CircularProgress, IconButton, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ViewModule, TableChart } from '@material-ui/icons';
import { useParams } from 'react-router-dom';

import { useViewPreference } from './hooks';
import { RecordListProvider } from './context';
import RecordTableView from './RecordTableView';
import RecordCardView from './RecordCardView';
import { I18n } from '../I18n';

// Re-export context utilities for external use
export { RecordListProvider, useRecordListContext } from './context';

// ============================================================================
// ViewToggle Component
// ============================================================================

const useToggleStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing(1),
    gap: theme.spacing(0.5),
  },
  button: {
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    '&.active': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const ViewToggle = ({ viewMode, onToggle }) => {
  const classes = useToggleStyles();
  const { language } = useParams();

  const tableLabel = language === 'fr' ? 'Tableau' : 'Table';
  const cardsLabel = language === 'fr' ? 'Cartes' : 'Cards';

  return (
    <Box className={classes.container}>
      <Tooltip title={<I18n en="Card view" fr="Vue en cartes" />}>
        <IconButton
          className={`${classes.button} ${viewMode === 'card' ? 'active' : ''}`}
          onClick={() => viewMode !== 'card' && onToggle()}
          aria-label={cardsLabel}
          size="small"
        >
          <ViewModule />
        </IconButton>
      </Tooltip>
      <Tooltip title={<I18n en="Table view" fr="Vue en tableau" />}>
        <IconButton
          className={`${classes.button} ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => viewMode !== 'table' && onToggle()}
          aria-label={tableLabel}
          size="small"
        >
          <TableChart />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// ============================================================================
// Main RecordList Component
// ============================================================================

const RecordList = ({
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
  const { viewMode, toggleView } = useViewPreference(
    config.pageId,
    config.views?.persistViewPreference ?? true
  );

  // Build action handlers object
  const actionHandlers = useMemo(
    () => ({
      edit: onEditRecord,
      delete: onDeleteRecord,
      clone: onCloneRecord,
      submit: (recordID, userID) => onSubmitRecord?.(recordID, userID, 'submitted'),
      publish: (recordID, userID) => onSubmitRecord?.(recordID, userID, 'published'),
      unpublish: (recordID, userID) => onSubmitRecord?.(recordID, userID, 'submitted'),
      unsubmit: (recordID, userID) => onSubmitRecord?.(recordID, userID, ''),
      transfer: onTransferRecord,
      githubPublish: onGithubPublishClick,
    }),
    [onEditRecord, onDeleteRecord, onCloneRecord, onSubmitRecord, onTransferRecord, onGithubPublishClick]
  );

  const contextValue = useMemo(
    () => ({
      config,
      actionHandlers,
      language,
      region,
      githubPublishEnabled,
    }),
    [config, actionHandlers, language, region, githubPublishEnabled]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  const showToggle = config.views?.allowToggle ?? true;

  return (
    <RecordListProvider value={contextValue}>
      <Box>
        {showToggle && <ViewToggle viewMode={viewMode} onToggle={toggleView} />}

        {viewMode === 'table' ? (
          <RecordTableView records={records} />
        ) : (
          <RecordCardView records={records} />
        )}
      </Box>
    </RecordListProvider>
  );
};

export default RecordList;
