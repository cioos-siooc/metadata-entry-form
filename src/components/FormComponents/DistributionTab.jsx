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
          <En>
            Enter any URLs associated with this dataset. Eg ERDDAP datasets, or
            CSV files. At least one resource is required.
          </En>
          <Fr>
            Entrez les URL associées à ce jeux de données. Par exemple, des jeux
            de données ERDDAP ou des fichiers CSV. Au moins une ressource est
            requise.
          </Fr>
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
