import React, { useEffect, useState, useRef } from "react";
import FormSection from "../FormShell/FormSection";

import {
  Alert,
  Box,
  Link,
  Stack,
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

import { En, Fr, I18n } from "../I18n";
import {
  getErrorsByTab,
  recordIsValid,
  warnings,
  validateFieldWarning,
} from "../../utils/validate";
import tabs from "../../utils/tabs";
import { SendOutlined } from "@mui/icons-material";
import {
  SECTION_TO_VALIDATOR_TABS,
  VALIDATOR_TAB_TO_SECTION,
} from "../FormShell/useFormSections";

import GetRegionInfo from "../FormComponents/Regions";

const SubmitTab = ({
  record,
  submitRecord,
  userID,
  doiUpdated,
  doiError,
  onGoToField,
}) => {
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
        validateFieldWarning(recordObj, field),
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
        {},
      );
      if (mounted.current) setValidationWarnings(fieldWarningInfoReduced);
    };

    getUrlWarningsByTab(record);

    return () => {
      mounted.current = false;
    };
  }, [record, userID]);

  const errorTabs = Object.keys(validationErrors);
  const errorCount = errorTabs.reduce(
    (n, tab) => n + validationErrors[tab].length,
    0,
  );
  const warningTabs = validationWarnings ? Object.keys(validationWarnings) : [];
  const valid = recordIsValid(record);

  const contactLine = (
    <>
      <I18n
        en="Questions, or want to follow up on your record? Contact "
        fr="Des questions ou un suivi concernant votre enregistrement? Contactez "
      />
      <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
    </>
  );

  // One group per form section, in form order and named as in the section
  // rail (lineage and related works belong to Data and documentation), each
  // item a link to the field to fix.
  const groupBySection = (byTab) => {
    const groups = Object.entries(SECTION_TO_VALIDATOR_TABS)
      .map(([section, keys]) => ({
        key: section,
        section,
        label: tabs[keys[0]],
        issues: keys.flatMap((key) => byTab[key] || []),
      }))
      .filter((group) => group.issues.length);
    // Anything not mapped to a section still gets listed.
    Object.keys(byTab)
      .filter((key) => !VALIDATOR_TAB_TO_SECTION[key])
      .forEach((key) =>
        groups.push({ key, label: tabs[key], issues: byTab[key] }),
      );
    return groups;
  };

  const IssueList = ({ byTab, severity }) => (
    <Stack spacing={2}>
      {groupBySection(byTab).map(({ key, section, label, issues }) => {
        return (
          <Box key={key}>
            <Typography
              component="h3"
              sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.5 }}
            >
              {label?.[language] || key}
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 0,
                listStyle: "none",
                "& li + li": { mt: 0.25 },
              }}
            >
              {issues.map((issue, i) => {
                const text = issue[language];
                const target =
                  severity === "error" && section && onGoToField
                    ? () => onGoToField(section, issue.field)
                    : null;
                return (
                  <Box component="li" key={i} sx={{ display: "flex", gap: 1 }}>
                    <Box
                      aria-hidden
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        mt: "9px",
                        flexShrink: 0,
                        bgcolor:
                          severity === "error" ? "error.main" : "warning.main",
                      }}
                    />
                    {target ? (
                      <Link
                        component="button"
                        type="button"
                        onClick={target}
                        sx={{ textAlign: "left", fontSize: "1rem" }}
                      >
                        {text}
                      </Link>
                    ) : (
                      <Typography sx={{ fontSize: "1rem" }}>{text}</Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );

  return (
    <Stack spacing={2}>
      {submitted ? (
        <FormSection title={<I18n en="Submitted" fr="Soumis" />}>
          <Stack spacing={1.5} sx={{ maxWidth: "75ch" }}>
            <Alert severity="success">
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
            </Alert>
            {doiUpdated && (
              <Alert severity="success">
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
              </Alert>
            )}
            {doiError && (
              <Alert severity="error">
                <I18n>
                  <En>Error occurred when updating DOI.</En>
                  <Fr>
                    Une erreur s'est produite lors de la mise à jour du DOI
                  </Fr>
                </I18n>
              </Alert>
            )}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {contactLine}
            </Typography>
          </Stack>
        </FormSection>
      ) : valid ? (
        <FormSection
          title={<I18n en="Ready to submit" fr="Prêt pour la soumission" />}
        >
          <Stack spacing={2} sx={{ maxWidth: "75ch" }}>
            <Alert severity="success">
              <I18n>
                <En>
                  You have completed all of the required fields, your record can
                  be submitted now.
                </En>
                <Fr>
                  Vous avez rempli tous les champs obligatoires, vous pouvez
                  maintenant soumettre votre formulaire.
                </Fr>
              </I18n>
            </Alert>
            <Typography>
              <I18n>
                <En>
                  A {regionInfo.title.en} staff member will review it and
                  contact you to request more information or let you know when
                  your dataset will be available through the{" "}
                  {regionInfo.catalogueTitle.en}. Nothing is published before
                  you are contacted.
                </En>
                <Fr>
                  Un membre du personnel {regionInfo.titleFrPossessive}{" "}
                  l'examinera et vous contactera pour obtenir plus
                  d'informations ou pour vous indiquer quand votre jeu de
                  données sera disponible dans le{" "}
                  {regionInfo.catalogueTitle.fr.replace(
                    "Catalogue",
                    "catalogue",
                  )}
                  . Rien ne sera publié avant d'obtenir votre approbation.
                </Fr>
              </I18n>
            </Typography>
            {showSubmitButton && (
              <Box>
                <Button
                  size="large"
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SendOutlined />
                    )
                  }
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
                  {isSubmitting ? (
                    <I18n en="Submitting…" fr="Soumission…" />
                  ) : (
                    <I18n en="Submit for review" fr="Soumettre pour révision" />
                  )}
                </Button>
              </Box>
            )}
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {contactLine}
            </Typography>
          </Stack>
        </FormSection>
      ) : (
        <FormSection
          title={<I18n en="Before you can submit" fr="Avant de soumettre" />}
          description={
            <I18n
              en={`${errorCount} item${errorCount > 1 ? "s" : ""} to complete in ${errorTabs.length} section${errorTabs.length > 1 ? "s" : ""}. Select an item to go to it.`}
              fr={`${errorCount} élément${errorCount > 1 ? "s" : ""} à compléter dans ${errorTabs.length} section${errorTabs.length > 1 ? "s" : ""}. Sélectionnez un élément pour y accéder.`}
            />
          }
        >
          <IssueList byTab={validationErrors} severity="error" />
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2.5 }}>
            {contactLine}
          </Typography>
        </FormSection>
      )}

      {!submitted && warningTabs.length > 0 && (
        <FormSection
          title={<I18n en="Warnings" fr="Avertissements" />}
          description={
            <I18n
              en="These don't block submission, but please review them first."
              fr="Ils n'empêchent pas la soumission, mais veuillez les examiner d'abord."
            />
          }
        >
          <IssueList byTab={validationWarnings} severity="warning" />
        </FormSection>
      )}

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
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
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
    </Stack>
  );
};
export default SubmitTab;
