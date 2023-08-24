import React from "react";
import { useParams } from "react-router-dom";
import { Paper, Grid } from "@material-ui/core";
import Lineage from "../FormComponents/Lineage";
import { paperClass } from "../FormComponents/QuestionStyles";

const LineageTab = ({
  updateRecord,
  record,
  disabled,
}) => {

  const { language } = useParams()
  return (
    <Grid>
      <Paper style={paperClass}>
        <Grid container direction="column" spacing={0}>


          <Lineage
            history={record.history}
            updateLineage={updateRecord("history")}
            disabled={disabled}
            paperClass={paperClass}
            language={language}
          />

        </Grid>
      </Paper>
    </Grid>
  );
};
export default LineageTab;
