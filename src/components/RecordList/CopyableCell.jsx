import React from "react";
import { Tooltip, Box, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopy(String(text));
  };

  const tooltipTitle = language === "fr" ? "Copier" : "Copy";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        width: "100%",
        minWidth: 0,
        "& .copy-icon-button": {
          opacity: 0,
          transition: (theme) =>
            theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shortest,
            }),
        },
        "&:hover .copy-icon-button, &:focus-within .copy-icon-button": {
          opacity: 1,
        },
        "@media (hover: none)": {
          "& .copy-icon-button": { opacity: 1 },
        },
      }}
    >
      <Box
        component="span"
        sx={{
          flex: 1,
          minWidth: 0,
          ...(truncate && {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }),
        }}
        title={truncate ? String(text) : undefined}
      >
        {content}
      </Box>
      <Tooltip title={tooltipTitle} enterDelay={400} enterNextDelay={400}>
        <IconButton
          className="copy-icon-button"
          size="small"
          onClick={handleCopy}
          aria-label={`${tooltipTitle} ${String(text)}`}
          // 16px icon + 4px padding: the 24px WCAG 2.5.8 minimum target.
          sx={{ padding: "4px", flexShrink: 0 }}
        >
          <ContentCopyIcon sx={{ fontSize: "1rem" }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default CopyableCell;
