import React from "react";

import { Chip } from "@material-ui/core";
import { I18n } from "../I18n";

const StatusChip = ({ status }) => {
  const statusColors = {
    submitted: "primary",
    published: "secondary",
  };

  let chipText = "";

  if (status) {
    if (status === "submitted") chipText = <I18n en="Submitted" fr="Soumis" />;
    else if (status === "published")
      chipText = <I18n en="Published" fr="Publié" />;
  } else chipText = <I18n en="Draft" fr="Brouillon" />;

  return (
    <Chip
      label={chipText}
      color={statusColors[status] || "default"}
      variant="outlined"
    />
  );
};

export default StatusChip;
