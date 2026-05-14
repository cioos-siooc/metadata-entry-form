import React from "react";
import { Chip, Box, Tooltip } from "@mui/material";
import { getStatusColor, getStatusLabel, formatDate } from "./config";
import RecordActions from "./RecordActions";
import CopyableCell from "./CopyableCell";

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
  const statusColor = getStatusColor(row.status, row.region || region);
  const statusLabel = getStatusLabel(row.status, language);
  const dateDisplay = formatDate(row.created, language);
  const showProgress = config?.columns?.includes("progress");
  const showIdentifier = config?.columns?.includes("identifier");
  const titleDisplay =
    row.title || (language === "en" ? "Untitled" : "Sans titre");
  const openRecordTooltip =
    language === "fr" ? "Ouvrir la fiche" : "Open record";

  return (
    <Box
      data-id={rowId}
      data-rowindex={rest.index}
      sx={{
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "10px 14px",
        margin: "4px 0",
        border: "1px solid #e0e0e0",
        borderRadius: "14px",
        backgroundColor: selected ? "#e3f2fd" : "#fafafa",
        overflow: "hidden",
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
        <CopyableCell
          text={row.title}
          onCopy={onCopy}
          language={language}
        >
          {titleDisplay}
        </CopyableCell>
      </Box>

      {/* Identifier */}
      {showIdentifier && row.identifier && (
        <Box
          sx={{
            fontSize: "0.75rem",
            color: "#999",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <CopyableCell
            text={row.identifier}
            onCopy={onCopy}
            language={language}
          />
        </Box>
      )}

      {/* Author */}
      <Box sx={{ fontSize: "0.85rem", color: "#666" }}>
        <CopyableCell text={row.author} onCopy={onCopy} language={language} />
      </Box>

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
        <Tooltip title={openRecordTooltip} enterDelay={400}>
          <Chip
            label={statusLabel}
            size="small"
            clickable
            onClick={(e) => {
              e.stopPropagation();
              onNavigate?.(row);
            }}
            style={{
              backgroundColor: statusColor,
              color: "#ffffff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          />
        </Tooltip>

        {showProgress && (
          <Box sx={{ fontSize: "0.85rem", color: "#666" }}>
            {row.progress}%
          </Box>
        )}

        <Box sx={{ fontSize: "0.85rem", color: "#999" }}>
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
  );
};

export default MobileRecordRow;
