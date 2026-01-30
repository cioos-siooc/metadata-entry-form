import React from 'react';
import { Box, Typography } from '@material-ui/core';

import { useRecordListContext } from './context';
import MetadataRecordListItem from '../FormComponents/MetadataRecordListItem';
import { I18n, En, Fr } from '../I18n';

const RecordCardView = ({ records }) => {
  const { config, actionHandlers, githubPublishEnabled } = useRecordListContext();

  // Sort records by created date (newest first)
  const sortedRecords = [...(records || [])].sort(
    (a, b) => new Date(b.created) - new Date(a.created)
  );

  if (!sortedRecords || sortedRecords.length === 0) {
    return (
      <Typography>
        <I18n>
          <En>No records found.</En>
          <Fr>Aucun enregistrement trouvé.</Fr>
        </I18n>
      </Typography>
    );
  }

  const actions = config.actions || {};
  const cardFields = config.cardFields || {};

  return (
    <Box>
      {sortedRecords.map((record) => {
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
