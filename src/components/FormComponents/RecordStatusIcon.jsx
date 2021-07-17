import React from "react";
import { Description, AssignmentTurnedIn, Drafts } from "@material-ui/icons";

const RecordStatusIcon = ({ status }) => {
  if (status === "published") return <AssignmentTurnedIn />;
  else if (status === "submitted") return <Description />;
  else if (status === "") return <Drafts />;
};
export default RecordStatusIcon;
