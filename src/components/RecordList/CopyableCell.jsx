import React from "react";
import { Tooltip, Box } from "@mui/material";

const CopyableCell = ({
  text,
  onCopy,
  language = "en",
  truncate = false,
  children,
}) => {
  const content = children !== undefined ? children : text;
  const hasText = text !== undefined && text !== null && text !== "";

  if (!hasText || !onCopy) {
    return truncate ? (
      <Box
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
        }}
        title={typeof content === "string" ? content : undefined}
      >
        {content}
      </Box>
    ) : (
      <>{content}</>
    );
  }

  const handleClick = (e) => {
    e.stopPropagation();
    onCopy(String(text));
  };

  const tooltipTitle = language === "fr" ? "Cliquer pour copier" : "Click to copy";

  return (
    <Tooltip title={tooltipTitle} enterDelay={400} enterNextDelay={400}>
      <Box
        component="span"
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          display: "inline-block",
          width: "100%",
          padding: "2px 4px",
          margin: "-2px -4px",
          borderRadius: "4px",
          ...(truncate && {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }),
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        {content}
      </Box>
    </Tooltip>
  );
};

export default CopyableCell;
