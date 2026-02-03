import React, { useMemo } from 'react';
import { Box, Typography } from '@material-ui/core';

import { useRecordListContext } from './context';
import { recordToRow } from './config';
import { applyFiltersAndSort } from './filtering';
import CardControls from './CardControls';
import MetadataRecordListItem from '../FormComponents/MetadataRecordListItem';
import { I18n, En, Fr } from '../I18n';

const RecordCardView = ({ records }) => {
  const { config, actionHandlers, githubPublishEnabled, language, listState } = useRecordListContext();

  // Transform to table rows so we can reuse the same fields for filtering/sorting
  const rows = useMemo(
    () => (records || []).map((r, idx) => recordToRow(r, language, idx)),
    [records, language]
  );

  // Apply same filters/sort as the table
  const visibleRows = useMemo(
    () => applyFiltersAndSort({ filterModel: listState.filterModel, sortModel: listState.sortModel }, rows),
    [listState.filterModel, listState.sortModel, rows]
  );

  // Map rows back to original records by recordID
  const recordById = useMemo(() => {
    const map = new Map();
    (records || []).forEach((rec) => map.set(rec.recordID, rec));
    return map;
  }, [records]);

  const visibleRecords = useMemo(
    () => visibleRows.map((row) => recordById.get(row.recordID)).filter(Boolean),
    [visibleRows, recordById]
  );

  const actions = config.actions || {};
  const cardFields = config.cardFields || {};

  return (
    <Box>
      <CardControls />
      {(!visibleRecords || visibleRecords.length === 0) ? (
        <Typography>
          <I18n>
            <En>No records found.</En>
            <Fr>Aucun enregistrement trouvé.</Fr>
          </I18n>
        </Typography>
      ) : visibleRecords.map((record) => {
        const { title, recordID } = record;
        if (!(title?.en || title?.fr)) return null;

        const userID = record.userinfo?.userID;

        return (
          <MetadataRecordListItem
            key={recordID}
            record={record}
            // Field visibility from config
            showAuthor={cardFields.showAuthor}
            showPercentComplete={cardFields.showProgress}
            // Action visibility from config
            showViewAction={actions.showViewAction}
            showEditAction={actions.showEditAction}
            showDeleteAction={actions.showDeleteAction}
            showCloneAction={actions.showCloneAction}
            showSubmitAction={actions.showSubmitAction}
            showPublishAction={actions.showPublishAction && record.status === 'submitted'}
            showUnPublishAction={actions.showUnPublishAction && record.status === 'published'}
            showUnSubmitAction={actions.showUnSubmitAction && record.status === 'submitted'}
            showTransferButton={actions.showTransferButton}
            showDownloadButton={actions.showDownloadButton}
            showGithubPublishAction={actions.showGithubPublishAction && (record.status === 'submitted' || record.status === 'published')}
            githubPublishEnabled={githubPublishEnabled}
            // Action handlers
            onViewEditClick={() => actionHandlers.edit?.(recordID, userID)}
            onDeleteClick={() => actionHandlers.delete?.(recordID, userID)}
            onCloneClick={() => actionHandlers.clone?.(recordID, userID)}
            onSubmitClick={() => {
              if (record.status === '') {
                actionHandlers.submit?.(recordID, userID);
              } else {
                actionHandlers.unsubmit?.(recordID, userID);
              }
            }}
            onUnSubmitClick={() => actionHandlers.unsubmit?.(recordID, userID)}
            onUnPublishClick={() => actionHandlers.unpublish?.(recordID, userID)}
            onPublishClick={() => actionHandlers.publish?.(recordID, userID)}
            onTransferClick={() => actionHandlers.transfer?.(recordID, userID)}
            onGithubPublishClick={() => actionHandlers.githubPublish?.(recordID, userID)}
          />
        );
      })}
    </Box>
  );
};

export default RecordCardView;
