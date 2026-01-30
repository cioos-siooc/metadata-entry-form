import React, { useMemo } from 'react';
import { Box, CircularProgress } from '@material-ui/core';
import { useParams } from 'react-router-dom';

import { RecordListProvider } from './RecordListContext';
import { useViewPreference } from './hooks';
import { ViewToggle } from './components';
import RecordTableView from './views/RecordTableView';
import RecordCardView from './views/RecordCardView';

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
