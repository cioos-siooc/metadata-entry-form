import React from "react";

import { Typography, Paper } from "@material-ui/core";

import Distribution from "./Distribution";
import { En, Fr } from "../I18n";

const DistributionTab = ({
  disabled,
  record,
  handleInputChange,
  paperClass,
}) => {
  return (
    <div>
      <Paper style={paperClass}>
        <Typography>
          <En>At least one resource is required.</En>
          <Fr>Au moins une ressource est requise.</Fr>
        </Typography>
      </Paper>
      <Distribution
        name="distribution"
        paperClass={paperClass}
        value={record.distribution || []}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
};

export default DistributionTab;
