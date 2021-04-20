import React, { useState } from "react";

import {
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  CircularProgress,
} from "@material-ui/core";

import { useParams } from "react-router-dom";
import { camelToSentenceCase } from "../../utils/misc";

import { paperClass } from "../FormComponents/QuestionStyles";

import { En, Fr } from "../I18n";

import { getErrorsByTab, percentValid } from "../../utils/validate";

const SubmitTab = ({ record, submitRecord }) => {
  const [isSubmitting, setSubmitting] = useState(false);

  const { language } = useParams();

  function submit() {
    setSubmitting(true);
    submitRecord().then(() => setSubmitting(false));
  }

  const recordIsComplete = Math.round(percentValid(record) * 100) === 100;

  const validationErrors = getErrorsByTab(record);
  const submitted = record.status === "submitted";

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography>
            <En>
              Use this page to submit your metadata record, as well as see which
              required fields are missing.
            </En>
            <Fr>
              Utilisez cette page pour soumettre votre enregistrement de
              métadonnées, ainsi que pour voir quels champs obligatoires sont manquants.
            </Fr>
          </Typography>
        </Grid>
        {submitted ? (
          <Grid item xs>
            <Typography>
              <En>
                Thank you for your submission. A reviewer has been notified. You
                will receive an email when the record is published. You are
                still able to edit this record by saving it, until it is
                published.
              </En>
              <Fr>
                Merci pour votre soumission. Un examinateur a été avisé. Vous
                recevrez un e-mail lors de la publication de l'enregistrement.
                Vous pouvez toujours modifier cet enregistrement en
                l'enregistrant, jusqu'à ce qu'il soit publié.
              </Fr>
            </Typography>
          </Grid>
        ) : (
          <>
            {recordIsComplete ? (
              <>
                <Grid item xs>
                  <Typography>
                    <En>
                      You have completed all of the required fields, your record
                      can be submitted now.
                    </En>
                    <Fr>
                      Vous avez rempli tous les champs obligatoires, votre
                      dossier peut être soumis maintenant.
                    </Fr>
                  </Typography>
                </Grid>
                <Grid item xs>
                  {isSubmitting ? (
                    <CircularProgress />
                  ) : (
                    <Button onClick={submit} disabled={submitted}>
                      <En>Submit</En>
                      <Fr>Soumettre</Fr>
                    </Button>
                  )}
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs>
                  <Typography>
                    <En>
                      You haven't completed all of the required fields. You will
                      need to address the list below before submitting.
                    </En>
                    <Fr>
                      Vous n'avez pas rempli tous les champs obligatoires. 
                      Veuillez renseigner les champs identifiés ci-dessous avant de soumettre votre demande.
                    </Fr>
                  </Typography>
                </Grid>

                <Grid item xs>
                  {Object.keys(validationErrors).map((tab) => (
                    <div key={tab}>
                      <Typography variant="h6">
                        {camelToSentenceCase(tab)}
                      </Typography>
                      <List>
                        {validationErrors[tab].map(
                          ({ [language]: error }, i) => (
                            <ListItem key={i}>
                              <ListItemText primary={error} />
                            </ListItem>
                          )
                        )}
                      </List>
                    </div>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>
    </Paper>
  );
};
export default SubmitTab;
