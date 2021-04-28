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
import translate from "../../utils/i18n";

import { paperClass } from "../FormComponents/QuestionStyles";

import { En, Fr } from "../I18n";

import { getErrorsByTab, percentValid } from "../../utils/validate";

import GetRegionInfo from "../FormComponents/Regions";

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
  const regionInfo = GetRegionInfo();

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography>
            <En>
              Thank-you for completing this form. The information will be
              reviewed and a {regionInfo.title.en} staff member will contact you
              to request more information or provide an update on when your
              dataset will be available through the{" "}
              {regionInfo.catalogueTitle.en}. Your information will not be
              published before you are contacted. If you have any questions or
              would like to follow up on the status of your record, please
              contact
            </En>
            <Fr>
              Merci d'avoir rempli ce formulaire. L'information sera validée par
              un membre du personnel du {regionInfo.title.fr}. Cette personne
              pourrait vous contacter pour obtenir plus d'informations ou pour
              vous indiquer quand votre jeu de données sera disponible dans le{" "}
              {regionInfo.catalogueTitle.fr}. Vos informations ne seront pas
              publiées avant d'obtenir votre approbation. Si vous avez des
              questions ou si vous désirez effectuer un suivi concernant l'état
              de votre soumission, veuillez contacter
            </Fr>{" "}
            <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
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
                      Veuillez renseigner les champs identifiés ci-dessous avant
                      de soumettre votre demande.
                    </Fr>
                  </Typography>
                </Grid>

                <Grid item xs>
                  {Object.keys(validationErrors).map((tab) => (
                    <div key={tab}>
                      <Typography variant="h6">
                        {camelToSentenceCase(translate(tab, language))}
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
