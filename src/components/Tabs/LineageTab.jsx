import React from "react";
import { useParams } from "react-router-dom";
import { Paper, Grid } from "@material-ui/core";
import Lineage from "../FormComponents/Lineage";
import { En, Fr, I18n } from "../I18n";
import { paperClass, QuestionText, SupplementalText } from "../FormComponents/QuestionStyles";
import RequiredMark from "../FormComponents/RequiredMark";
import { validateField } from "../../utils/validate";

const LineageTab = ({
  updateRecord,
  record,
  disabled,
}) => {

  const { language } = useParams()
  return (
    <Grid>
      <Paper style={paperClass}>
        <QuestionText>
          <En>
            Data processing history (provenance) for the resource.
          </En>
          <Fr>
            Historique du traitement des données (provenance) pour la ressource.
          </Fr>
          <RequiredMark passes={validateField(record, "distribution")} />
          <SupplementalText>
            <I18n>
              <En>
                Enter Information about the events or source data used in constructing the data specified by the scope.
              </En>
              <Fr>
                Entrez des informations sur les événements ou les données sources utilisées dans la construction des données spécifiées par la portée.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Paper>

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
