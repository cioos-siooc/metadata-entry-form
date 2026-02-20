import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography, TablePagination } from "@mui/material";

import { useRecordListContext } from "./context";
import { useCardFilters } from "./hooks";
import { recordToRow } from "./config";
import { applyCardFiltersAndSort } from "./filtering";
import CardControls from "./CardControls";
import MetadataRecordListItem from "../FormComponents/MetadataRecordListItem";
import { I18n, En, Fr } from "../I18n";

const RecordCardView = ({ records }) => {
  const { config, actionHandlers, githubPublishEnabled, language } =
    useRecordListContext();

  const filters = useCardFilters(config.pageId);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    config.table?.pageSize || 20
  );

  // Transform to table rows so we can reuse the same fields for filtering/sorting
  const rows = useMemo(
    () => (records || []).map((r, idx) => recordToRow(r, language, idx)),
    [records, language],
  );

  // Apply filters and sort
  const sortModel = [{ field: filters.sortField, sort: filters.sortDir }];
  const visibleRows = useMemo(
    () =>
      applyCardFiltersAndSort(
        {
          search: filters.search,
          author: filters.author,
          statuses: filters.statuses,
        },
        sortModel,
        rows,
      ),
    [filters.search, filters.author, filters.statuses, filters.sortField, filters.sortDir, rows],
  );

  // Map rows back to original records by recordID
  const recordById = useMemo(() => {
    const map = new Map();
    (records || []).forEach((rec) => map.set(rec.recordID, rec));
    return map;
  }, [records]);

  const visibleRecords = useMemo(
    () =>
      visibleRows.map((row) => recordById.get(row.recordID)).filter(Boolean),
    [visibleRows, recordById],
  );

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return visibleRecords.slice(start, end);
  }, [visibleRecords, page, rowsPerPage]);

  // Reset to first page when filters reduce results
  useEffect(() => {
    if (page > 0 && visibleRecords.length <= page * rowsPerPage) {
      setPage(0);
    }
  }, [visibleRecords.length, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const actions = config.actions || {};
  const cardFields = config.cardFields || {};

  const rowsPerPageOptions = config.table?.rowsPerPageOptions || [10, 20, 50, 100];

  return (
    <Box>
      <CardControls
        filters={filters}
        onSearchChange={filters.setSearch}
        onAuthorChange={filters.setAuthor}
        onStatusesChange={filters.setStatuses}
        onSortFieldChange={filters.setSortField}
        onSortDirChange={filters.setSortDir}
        onReset={filters.reset}
      />
      {!visibleRecords || visibleRecords.length === 0 ? (
        <Typography>
          <I18n>
            <En>No records found.</En>
            <Fr>Aucun enregistrement trouvé.</Fr>
          </I18n>
        </Typography>
      ) : (
        paginatedRecords.map((record) => {
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
              showPublishAction={
                actions.showPublishAction && record.status === "submitted"
              }
              showUnPublishAction={
                actions.showUnPublishAction && record.status === "published"
              }
              showUnSubmitAction={
                actions.showUnSubmitAction && record.status === "submitted"
              }
              showTransferButton={actions.showTransferButton}
              showDownloadButton={actions.showDownloadButton}
              showGithubPublishAction={
                actions.showGithubPublishAction &&
                (record.status === "submitted" || record.status === "published")
              }
              githubPublishEnabled={githubPublishEnabled}
              // Action handlers
              onViewEditClick={() => actionHandlers.edit?.(recordID, userID)}
              onDeleteClick={() => actionHandlers.delete?.(recordID, userID)}
              onCloneClick={() => actionHandlers.clone?.(recordID, userID)}
              onSubmitClick={() => {
                if (record.status === "") {
                  actionHandlers.submit?.(recordID, userID);
                } else {
                  actionHandlers.unsubmit?.(recordID, userID);
                }
              }}
              onUnSubmitClick={() =>
                actionHandlers.unsubmit?.(recordID, userID)
              }
              onUnPublishClick={() =>
                actionHandlers.unpublish?.(recordID, userID)
              }
              onPublishClick={() => actionHandlers.publish?.(recordID, userID)}
              onTransferClick={() =>
                actionHandlers.transfer?.(recordID, userID)
              }
              onGithubPublishClick={() =>
                actionHandlers.githubPublish?.(recordID, userID)
              }
            />
          );
        })
      )}
      {visibleRecords && visibleRecords.length > 0 && (
        <TablePagination
          component="div"
          count={visibleRecords.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage={
            language === "en" ? "Cards per page:" : "Cartes par page :"
          }
          labelDisplayedRows={({ from, to, count }) =>
            language === "en"
              ? `${from}-${to} of ${count}`
              : `${from}-${to} sur ${count}`
          }
          sx={{
            mt: 2,
            borderTop: 1,
            borderColor: "divider",
            "& .MuiTablePagination-toolbar": {
              flexWrap: "wrap",
              justifyContent: "center",
            },
          }}
        />
      )}
    </Box>
  );
};

export default RecordCardView;
