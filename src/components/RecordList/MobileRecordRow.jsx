import React from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Box } from "@mui/material";
import { getStatusColor, getStatusLabel, formatDate } from "./config";
import RecordActions from "./RecordActions";

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
  // Spread remaining GridRow props so DataGrid doesn't warn
  ...rest
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest('[role="menu"]')
    ) {
      return;
    }
    const { userID, recordID, region: rowRegion } = row;
    if (userID && recordID) {
      navigate(`/${language}/${rowRegion || region}/${userID}/${recordID}`);
    }
  };

  const statusColor = getStatusColor(row.status, row.region || region);
  const statusLabel = getStatusLabel(row.status, language);
  const dateDisplay = formatDate(row.created, language);
  const showProgress = config?.columns?.includes("progress");
  const showIdentifier = config?.columns?.includes("identifier");

  return (
    <Box
      data-id={rowId}
      data-rowindex={rest.index}
      onClick={handleClick}
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
        cursor: "pointer",
        overflow: "hidden",
        "&:hover": {
          backgroundColor: selected ? "#bbdefb" : "#f5f5f5",
        },
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
        {row.title || (language === "en" ? "Untitled" : "Sans titre")}
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
          {row.identifier}
        </Box>
      )}

      {/* Author */}
      <Box sx={{ fontSize: "0.85rem", color: "#666" }}>
        {row.author}
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
        <Chip
          label={statusLabel}
          size="small"
          style={{
            backgroundColor: statusColor,
            color: "#ffffff",
            fontWeight: 500,
          }}
        />

        {showProgress && (
          <Box sx={{ fontSize: "0.85rem", color: "#666" }}>
            {row.progress}%
          </Box>
        )}

        <Box sx={{ fontSize: "0.85rem", color: "#999" }}>
          {dateDisplay}
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
