import React, { useEffect, useState } from "react";

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

import { paperClass } from "../FormComponents/QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import {
  getErrorsByTab,
  recordIsValid,
  warnings,
  validateFieldWarning,
} from "../../utils/validate";
import tabs from "../../utils/tabs";

import GetRegionInfo from "../FormComponents/Regions";

const SubmitTab = ({ record, submitRecord }) => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState(false);

  const { language } = useParams();

  const validationErrors = getErrorsByTab(record);
  const submitted = record.status === "submitted";
  const regionInfo = GetRegionInfo();

  useEffect(() => {
    // some good info https://devtrium.com/posts/async-functions-useeffect

    // we could move this function outside of useEffect if we wrap it in a useCallback
    // see https://devtrium.com/posts/async-functions-useeffect#what-if-you-need-to-extract-the-function-outside-useeffect
    const getUrlWarningsByTab = async (recordObj) => {
      const fields = Object.keys(warnings);

      const validationPromises = fields.map((field) =>
        validateFieldWarning(recordObj, field)
      );

      const validationResults = await Promise.all(validationPromises);

      const validatedFields = fields.reduce((acc, field, index) => {
        acc[field] = validationResults[index];
        return acc;
      }, {});

      const inactiveUrls = fields.filter((field) => {
        return validatedFields[field];
      });
      const fieldWarningInfo = inactiveUrls.map((field) => {
        const { error, tab } = warnings[field];
        return { error, tab };
      });

      const fieldWarningInfoReduced = fieldWarningInfo.reduce(
        (acc, { error, tab }) => {
          if (!acc[tab]) acc[tab] = [];
          acc[tab].push(error);
          return acc;
        },
        {}
      );

      setValidationWarnings(fieldWarningInfoReduced);
    };

    getUrlWarningsByTab(record);
  }, [record]);

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs>
          <Typography>
            <I18n>
              <En>
                Thank-you for completing this form. The information will be
                reviewed and a {regionInfo.title.en} staff member will contact
                you to request more information or provide an update on when
                your dataset will be available through the{" "}
                {regionInfo.catalogueTitle.en}. Your information will not be
                published before you are contacted. If you have any questions or
                would like to follow up on the status of your record, please
                contact
              </En>
              <Fr>
                Merci d'avoir rempli ce formulaire. L'information sera validée
                par un membre du personnel {regionInfo.titleFrPossessive}. Cette
                personne pourrait vous contacter pour obtenir plus
                d'informations ou pour vous indiquer quand votre jeu de données
                sera disponible dans notre {regionInfo.catalogueTitle.fr}. Vos
                informations ne seront pas publiées avant d'obtenir votre
                approbation. Si vous avez des questions ou si vous désirez
                effectuer un suivi concernant l'état de votre soumission,
                veuillez contacte
              </Fr>
            </I18n>{" "}
            <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
          </Typography>
        </Grid>
        {submitted ? (
          <Grid item xs>
            <Typography>
              <I18n>
                <En>
                  Thank you for your submission. A reviewer has been notified.
                  You will receive an email when the record is published. You
                  are still able to edit this record by saving it, until it is
                  published.
                </En>
                <Fr>
                  Merci pour votre soumission. Un examinateur a été avisé. Vous
                  recevrez un e-mail lors de la publication de l'enregistrement.
                  Vous pouvez toujours modifier cet enregistrement en
                  l'enregistrant, jusqu'à ce qu'il soit publié.
                </Fr>
              </I18n>
            </Typography>
          </Grid>
        ) : (
          <>
            {recordIsValid(record) ? (
              <>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>
                        You have completed all of the required fields, your
                        record can be submitted now.
                      </En>
                      <Fr>
                        Vous avez rempli tous les champs obligatoires, vous
                        pouvez maintenant soumettre votre formulaire.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>
                <Grid item xs>
                  {isSubmitting ? (
                    <CircularProgress />
                  ) : (
                    <Button
                      onClick={() => {
                        setSubmitting(true);
                        submitRecord().then(() => {
                          setSubmitting(false);
                        });
                      }}
                      disabled={submitted}
                    >
                      <I18n>
                        <En>Submit</En>
                        <Fr>Soumettre</Fr>
                      </I18n>
                    </Button>
                  )}
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>
                        You haven't completed all of the required fields. You
                        will need to address the list below before submitting.
                      </En>
                      <Fr>
                        Vous n'avez pas rempli tous les champs obligatoires.
                        Veuillez compléter les champs identifiés ci-dessous
                        avant de soumettre votre demande.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>

                <Grid item xs>
                  {Object.keys(validationErrors).map((tab) => (
                    <div key={tab}>
                      <Typography variant="h6">
                        {tabs[tab][language]}
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

            {validationWarnings &&
            Object.keys(validationWarnings).length > 0 ? (
              <>
                <Grid item xs>
                  <Typography>
                    <I18n>
                      <En>
                        Some warnings were generated for the following fields.
                        Please review and fix the warnings as needed befor
                        submitting the record.
                      </En>
                      <Fr>
                        Certains avertissements ont été générés pour les champs
                        suivants. Veuillez examiner et corriger les
                        avertissements si nécessaire avant de soumettre
                        l'enregistrement.
                      </Fr>
                    </I18n>
                  </Typography>
                </Grid>

                <Grid item xs>
                  {Object.keys(validationWarnings).map((tab) => (
                    <div key={tab}>
                      <Typography variant="h6">
                        {tabs[tab][language]}
                      </Typography>
                      <List>
                        {validationWarnings[tab].map(
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
            ) : (
              " "
            )}
          </>
        )}
      </Grid>
    </Paper>
  );
};
export default SubmitTab;
