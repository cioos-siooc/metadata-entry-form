import React from "react";
import { Description, AssignmentTurnedIn, Drafts } from "@material-ui/icons";
import { Tooltip } from "@material-ui/core";
import { I18n } from "../I18n";

const RecordStatusIcon = ({ status }) => {
  if (status === "published")
    return (
      <Tooltip title={<I18n en="Published" fr="Publié" />}>
        <AssignmentTurnedIn color="primary" />
      </Tooltip>
    );
  else if (status === "submitted")
    return (
      <Tooltip title={<I18n en="Submitted" fr="Soumis" />}>
        <Description color="secondary" />
      </Tooltip>
    );
  else if (status === "")
    return (
      <Tooltip title={<I18n en="Draft" fr="Brouillon" />}>
        <Drafts color="action" />
      </Tooltip>
    );
  return null;
};
export default RecordStatusIcon;
