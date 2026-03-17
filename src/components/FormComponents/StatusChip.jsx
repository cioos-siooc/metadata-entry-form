import React from "react";

import { Chip } from "@mui/material";
import { I18n } from "../I18n";

const StatusChip = ({ status }) => {
  let chipText = "";

  if (status === "submitted") chipText = <I18n en="Submitted" fr="Soumis" />;
  else if (status === "published")
    chipText = <I18n en="Published" fr="Publié" />;
  else chipText = <I18n en="Draft" fr="Brouillon" />;

  return (
    <Chip
      label={chipText}
      // color={statusColors[status] || "default"}
      variant="outlined"
    />
  );
};

export default StatusChip;
