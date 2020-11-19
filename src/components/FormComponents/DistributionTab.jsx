import React from "react";

import { Paper } from "@material-ui/core";

import Distribution from "./Distribution";
import { En, Fr } from "../I18n";

import RequiredMark from "./RequiredMark";
import { paperClass, QuestionText, SupplementalText } from "./QuestionStyles";
import { validateField } from "../validate";

const DistributionTab = ({ disabled, record, handleInputChange }) => {
  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>Enter any URLs associated with this dataset.</En>
          <Fr>Entrez les URL associées à ce jeux de données.</Fr>
          <RequiredMark passes={validateField(record, "distribution")} />
          <SupplementalText>
            <En>
              Eg ERDDAP datasets, supporting documentation in text or PDF
              format, CSV dataset files. At least one resource is required.
            </En>
            <Fr>
              Par exemple, des jeux de données ERDDAP ou des fichiers CSV. Au
              moins une ressource est requise.
            </Fr>
          </SupplementalText>
        </QuestionText>
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
