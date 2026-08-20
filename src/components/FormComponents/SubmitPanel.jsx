import React, { useEffect, useState, useRef } from "react";

import {
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import { useParams } from "react-router-dom";

import { paperClass } from "./QuestionStyles";

import { En, Fr, I18n } from "../I18n";
import {
  getErrorsByTab,
  recordIsValid,
  warnings,
  validateFieldWarning,
} from "../../utils/validate";
import tabs from "../../utils/tabs";

import GetRegionInfo from "./Regions";

const SubmitPanel = ({ record, submitRecord, userID, doiUpdated, doiError }) => {
  const mounted = useRef(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const { language } = useParams();

  const validationErrors = getErrorsByTab(record);
  const submitted = record.status === "submitted";
  const regionInfo = GetRegionInfo();

  useEffect(() => {
    mounted.current = true;

    if (userID === record.userID) {
      setShowSubmitButton(true);
    }

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
      if (mounted.current) setValidationWarnings(fieldWarningInfoReduced);
    };

    getUrlWarningsByTab(record);

    return () => {
      mounted.current = false;
    };
  }, [record, userID]);

  return (
    <Paper style={paperClass}>
      <Grid container direction="column" spacing={3}>
        <Grid >
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
                Merci d'avoir rempli ce formulaire. Les informations seront
                examinées par un membre du personnel{" "}
                {regionInfo.titleFrPossessive}. Cette personne vous contactera
                pour obtenir plus d'informations ou pour vous indiquer quand
                votre jeu de données sera disponible dans notre{" "}
                {regionInfo.catalogueTitle.fr.replace("Catalogue", "catalogue")}
                . Vos informations ne seront pas publiées avant d'obtenir votre
                approbation. Si vous avez des questions ou si vous désirez
                effectuer un suivi concernant l'état de votre soumission,
                veuillez contacter
              </Fr>
            </I18n>{" "}
            <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
          </Typography>
        </Grid>
        {submitted ? (
          <Grid >
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
            {doiUpdated && (
              <Typography>
                <b>
                  <I18n>
                    <En>
                      DOI has successfully been updated with the submitted
                      changes.
                    </En>
                    <Fr>
                      DOI a été mis à jour avec succès avec les modifications
                      soumises.
                    </Fr>
                  </I18n>
                </b>
              </Typography>
            )}
            {doiError && (
              <Typography>
                <b>
                  <I18n>
                    <En>Error occurred when updating DOI.</En>
                    <Fr>
                      Une erreur s'est produite lors de la mise à jour du DOI
                    </Fr>
                  </I18n>
                </b>
              </Typography>
            )}
          </Grid>
        ) : (
          <>
            {recordIsValid(record) ? (
              <>
                <Grid >
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
                <Grid >
                  {isSubmitting && <CircularProgress />}
                  {!isSubmitting && showSubmitButton && (
                    <Button
                      onClick={() => {
                        setSubmitting(true);
                        submitRecord()
                          .then(() => {
                            setSubmitting(false);
                            setSuccessDialogOpen(true);
                          })
                          .catch(() => {
                            setSubmitting(false);
                            setErrorDialogOpen(true);
                          });
                      }}
                      disabled={submitted || isSubmitting}
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
                {/* Errors Section */}
                <Grid >
                  <Typography variant="h5">
                    <I18n>
                      <En>Errors</En>
                      <Fr>Erreurs</Fr>
                    </I18n>
                  </Typography>
                </Grid>

                <Grid >
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

                <Grid >
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
                {/* Warnings Section Heading */}
                <Grid >
                  <Typography variant="h5">
                    <I18n>
                      <En>Warnings</En>
                      <Fr>Avertissements</Fr>
                    </I18n>
                  </Typography>
                </Grid>

                <Grid >
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

                <Grid >
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
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
      >
        <DialogTitle>
          <I18n>
            <En>Submission received</En>
            <Fr>Soumission reçue</Fr>
          </I18n>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <I18n>
              <En>
                Your metadata form has been successfully submitted.{" "}
                {regionInfo.title.en} has been notified and will contact you if
                additional information is needed.
              </En>
              <Fr>
                Votre formulaire de métadonnées a été soumis avec succès.{" "}
                {regionInfo.title.fr} a été avisé et vous contactera si des
                informations supplémentaires sont nécessaires.
              </Fr>
            </I18n>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
      >
        <DialogTitle>
          <I18n>
            <En>Submission failed</En>
            <Fr>Échec de la soumission</Fr>
          </I18n>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <I18n>
              <En>
                An error occurred while submitting your form. Please try again.
                If the problem persists, contact{" "}
              </En>
              <Fr>
                Une erreur s'est produite lors de la soumission de votre
                formulaire. Veuillez réessayer. Si le problème persiste,
                contactez{" "}
              </Fr>
            </I18n>
            <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
export default SubmitPanel;
