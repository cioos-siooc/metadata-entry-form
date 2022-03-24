import React from "react";
import { HelpOutline } from "@material-ui/icons";
import { Tooltip } from "@material-ui/core";

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
