import React, { useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";

import { RecordListProvider } from "./context";
import RecordTableView from "./RecordTableView";

// Re-export context utilities for external use
export { RecordListProvider, useRecordListContext } from "./context";

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

  const contextValue = useMemo(
    () => ({
      config,
      actionHandlers,
      language,
      region,
      githubPublishEnabled,
    }),
    [config, actionHandlers, language, region, githubPublishEnabled],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <RecordListProvider value={contextValue}>
      <RecordTableView records={records} />
    </RecordListProvider>
  );
};

export default RecordList;
