import React from "react";
import { Tooltip } from "@material-ui/core";
import { I18n } from "../I18n";

function RequiredMark({ passes }) {
  if (passes)
    return (
      <span
        style={{
          color: "green",
          fontSize: "x-large",
          position: "relative",
          bottom: "-4px",
        }}
      >
        {" "}
        ✓{" "}
      </span>
    );
  return (
    <Tooltip title={<I18n en="Required" fr="Obligatoire" />}>
      <span
        style={{
          color: "red",
          fontSize: "large",
        }}
      >
        {" "}
        ✵{" "}
      </span>
    </Tooltip>
  );
}
export default RequiredMark;
