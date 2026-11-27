import React from "react";
import { HelpOutlineOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";

const HelpMouseover = ({ children }) => (
  <div
    style={{
      display: "inline",
      verticalAlign: "middle",
      margin: "10px",
    }}
  >
    <Tooltip title={children}>
      <HelpOutlineOutlined />
    </Tooltip>
  </div>
);

export default HelpMouseover;
