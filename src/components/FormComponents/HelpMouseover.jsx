import React from "react";
import { HelpOutline } from "@mui/icons-material";
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
      <HelpOutline />
    </Tooltip>
  </div>
);

export default HelpMouseover;
