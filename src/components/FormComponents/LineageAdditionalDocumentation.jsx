import React, { useState } from "react";
import { TextField, Grid, Box } from "@mui/material";
import validator from "validator";
import SelectInput from "./SelectInput";
import { En, Fr, I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import RequiredMark from "./RequiredMark";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { identifierType } from "../../isoCodeLists";
import { lineagePartIsComplete } from "../../utils/validate";
import ItemCards from "./ItemCards";

const validateURL = (url) => !url || validator.isURL(url);

const emptyDocumentation = {
  title: "",
  authority: "",
  code: "",
};

const LineageAdditionalDocumentation = ({
  updateDocumentations,
  documentations = [],
  disabled,
  language,
}) => {
  const [activeDocumentation, setActiveDocumentation] = useState(null);

  function updateDocumentationField(key) {
    return (e) => {
      const documentationsCopy = [...documentations];
      documentationsCopy[activeDocumentation][key] = e.target.value;
      updateDocumentations(documentationsCopy);
    };
  }

  function urlIsValid(url) {
    return !url || validateURL(url);
  }

  function handleIdentifierChange(key) {
    return (e) => {
      const newValue = [...documentations];
      newValue[activeDocumentation][key] = e.target.value;

      const s = newValue[activeDocumentation].code;
      switch (true) {
        case urlIsValid(newValue[activeDocumentation].code) &&
          /^http.?:\/\/doi\.org\//i.test(s):
          newValue[activeDocumentation].authority = "DOI";
          break;
        case urlIsValid(newValue[activeDocumentation].code):
          newValue[activeDocumentation].authority = "URL";
          break;
        default:
          newValue[activeDocumentation].authority = "";
          break;
      }
      updateDocumentations(newValue);
    };
  }

  const documentation =
    documentations.length > 0 && documentations[activeDocumentation];

  return (
    <Grid container spacing={0}>
      <Grid>
        <QuestionText>
          <I18n>
            <En>Additional documentation:</En>
            <Fr>Documentation supplémentaire :</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                A citation to additional lineage documentation. This could be a
                publication that describes the whole process, dataset, or model.
              </En>
              <Fr>
                Information supplémentaire sur la généalogie des données. Peut
                être une publication décrivant le processus complet, la base de
                données ou le modèle.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
      </Grid>

      <ItemCards
        items={documentations}
        updateItems={updateDocumentations}
        openIndex={activeDocumentation}
        setOpenIndex={setActiveDocumentation}
        disabled={disabled}
        idPrefix="lineage-doc"
        numbered
        itemNoun={{ en: "document", fr: "document" }}
        ariaLabel={
          language === "fr"
            ? "Documentation supplémentaire"
            : "Additional documentation"
        }
        itemTitle={(item) =>
          item.title?.[language] || item.description?.[language]
        }
        itemMeta={(item) => item.code}
        isComplete={lineagePartIsComplete}
        getBlankItem={() => deepCopy(emptyDocumentation)}
        duplicateItem={(copy) => {
          if (copy.title?.en) copy.title.en += " (copy)";
          if (copy.title?.fr) copy.title.fr += " (copie)";
          return copy;
        }}
        addLabel=<I18n en="Add document" fr="Ajouter un document" />
        emptyText=<I18n
          en="No additional documentation yet."
          fr="Aucune documentation supplémentaire pour l'instant."
        />
        renderEditor={() => (
          <Box>
            <Grid container direction="column" spacing={2}>
              <Grid>
                <I18n>
                  <En>Title</En>
                  <Fr>Titre</Fr>
                </I18n>
                <RequiredMark
                  passes={documentation.title?.en || documentation.title?.fr}
                />
                <BilingualTextInput
                  label={
                    <I18n
                      en="Documentation title"
                      fr="Titre de la documentation"
                    />
                  }
                  value={documentation.title}
                  onChange={updateDocumentationField("title")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <TextField
                  label={
                    <I18n>
                      <En>Identifier or URL</En>
                      <Fr>Identifiant ou URL</Fr>
                    </I18n>
                  }
                  value={documentation.code}
                  onChange={handleIdentifierChange("code")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier type</En>
                    <Fr>Entrez le type d'identifiant</Fr>
                  </I18n>
                  {documentation?.code && (
                    <RequiredMark passes={documentation.authority} />
                  )}
                </QuestionText>

                <SelectInput
                  value={documentation.authority}
                  onChange={updateDocumentationField("authority")}
                  options={identifierType}
                  optionLabels={identifierType}
                  disabled={disabled}
                  label={<I18n en="Identifier type" fr="Type d'identifiant" />}
                  fullWidth={false}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      />
    </Grid>
  );
};
export default LineageAdditionalDocumentation;
