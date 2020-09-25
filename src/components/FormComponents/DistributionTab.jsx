import React from "react";

import { Typography, Paper } from "@material-ui/core";

import Distribution from "./Distribution";
import { En, Fr } from "../I18n";

const DistributionTab = ({
  disabled,
  record,
  handleInputChange,
  paperClass,
}) => (
  <div>
    <Paper className={paperClass}>
      <Typography>
        <En>Distribution</En>
        <Fr>Distribution</Fr>
      </Typography>

      <Distribution
        name="distribution"
        value={record.distribution}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </Paper>
  </div>
);

export default DistributionTab;
