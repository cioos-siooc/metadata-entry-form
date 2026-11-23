import React, { useLayoutEffect, useRef } from "react";
import { Box, Link } from "@mui/material";
// observeRowHeight is on the private API, which is how DataGrid's own GridRow
// reports "auto" heights; a custom row slot has to do the same.
import { useGridPrivateApiContext } from "@mui/x-data-grid/internals";
import { formatDate } from "./config";
import RecordActions from "./RecordActions";
import CopyableCell from "./CopyableCell";
import StatusChip from "../FormComponents/StatusChip";

const MobileRecordRow = ({
  row,
  rowId,
  selected,
  // Extra props from slotProps.row
  language,
  region,
  config,
  actionHandlers,
  githubPublishEnabled,
  onCopy,
  onNavigate,
  // Spread remaining GridRow props so DataGrid doesn't warn
  ...rest
}) => {
  const apiRef = useGridPrivateApiContext();
  const rowRef = useRef(null);
  // This slot replaces DataGrid's own row, which is what reports "auto"
  // heights; without it the grid assumed 52px and clipped every card.
  useLayoutEffect(
    () =>
      rowRef.current
        ? apiRef.current.observeRowHeight(rowRef.current, rowId)
        : undefined,
    [apiRef, rowId],
  );
  const dateDisplay = formatDate(row.created, language);
  const showProgress = config?.columns?.includes("progress");
  const titleDisplay =
    row.title || (language === "en" ? "Untitled" : "Sans titre");

  const handleCardClick = (event) => {
    if (event.target.closest("button") || event.target.closest("a")) {
      return;
    }
    onNavigate?.(row);
  };

  return (
    // The gap between cards is padding on this measured wrapper, not margin,
    // so it counts toward the row height.
    <Box
      ref={rowRef}
      data-id={rowId}
      data-rowindex={rest.index}
      sx={{ width: "100%", boxSizing: "border-box", py: 0.5 }}
    >
      <Box
        onClick={handleCardClick}
        sx={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "10px 14px",
          border: 1,
          borderColor: "divider",
          borderRadius: "12px",
          backgroundColor: selected ? "action.selected" : "background.paper",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* Title */}
        <Box
          sx={{
            fontSize: "1rem",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          <CopyableCell text={row.title} onCopy={onCopy} language={language}>
            {/* The keyboard and screen-reader way to open the record; the
              rest of the card is a mouse/touch convenience. */}
            <Link
              component="button"
              type="button"
              onClick={() => onNavigate?.(row)}
              underline="hover"
              sx={{
                color: "text.primary",
                font: "inherit",
                textAlign: "left",
              }}
            >
              {titleDisplay}
            </Link>
          </CopyableCell>
        </Box>

        {/* Author: only where the list mixes several people's records */}
        {config?.defaultColumnVisibility?.author && row.author && (
          <Box sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            <CopyableCell
              text={row.author}
              onCopy={onCopy}
              language={language}
            />
          </Box>
        )}

        {/* Bottom row: status, progress, date, actions */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "4px",
          }}
        >
          <StatusChip status={row.status} />

          {showProgress && (
            <Box sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              {row.progress}%
            </Box>
          )}

          <Box sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
            <CopyableCell
              text={dateDisplay}
              onCopy={onCopy}
              language={language}
            />
          </Box>

          <Box sx={{ marginLeft: "auto" }}>
            <RecordActions
              record={row.fullRecord}
              recordID={row.recordID}
              userID={row.userID}
              status={row.status}
              actions={config?.actions || {}}
              handlers={actionHandlers}
              language={language}
              region={region}
              githubPublishEnabled={githubPublishEnabled}
              size="small"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MobileRecordRow;
