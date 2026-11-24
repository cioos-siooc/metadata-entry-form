import React, { useState } from "react";
import { Grid, Box } from "@mui/material";
import { En, Fr, I18n } from "../I18n";
import { deepCopy } from "../../utils/misc";
import { metadataScopeCodes } from "../../isoCodeLists";
import RequiredMark from "./RequiredMark";
import AdditionalDocumentation from "./LineageAdditionalDocumentation";
import LineageSource from "./LineageSource";
import ProcessingStep from "./LineageProcessingStep";
import SelectInput from "./SelectInput";
import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import { lineageIsComplete } from "../../utils/validate";
import ItemCards from "./ItemCards";

const emptyLineage = {
  statement: "",
  scope: "",
  additionalDocumentation: [],
  source: [],
  processingStep: [],
};

// The row's second line: what the step holds.
function lineageSummary(step, language) {
  const fr = language === "fr";
  const count = (list, en, frText) => {
    const n = (list || []).length;
    if (!n) return null;
    const [one, many] = fr ? frText : en;
    return `${n} ${n > 1 ? many : one}`;
  };
  return [
    count(step.source, ["source", "sources"], ["source", "sources"]),
    count(
      step.processingStep,
      ["processing step", "processing steps"],
      ["étape de traitement", "étapes de traitement"],
    ),
    count(
      step.additionalDocumentation,
      ["document", "documents"],
      ["document", "documents"],
    ),
  ]
    .filter(Boolean)
    .join(" · ");
}

const Lineage = ({
  updateLineage,
  history,
  disabled,
  language,
  metadataScope,
}) => {
  const [activeLineage, setActiveLineage] = useState(null);

  const filteredMetadataScopeCodes = Object.keys(metadataScopeCodes)
    .filter((key) => ["DataCollectionSampling", metadataScope].includes(key))
    .reduce((obj, key) => {
      return {
        ...obj,
        [key]: metadataScopeCodes[key],
      };
    }, {});

  function updateLineageField(key) {
    return (e) => {
      const lineageCopy = [...history];
      lineageCopy[activeLineage][key] = e.target.value;
      updateLineage(lineageCopy);
    };
  }
  function updateLineageSubField(key) {
    return (e) => {
      const lineageCopy = [...history];
      lineageCopy[activeLineage][key] = e;
      updateLineage(lineageCopy);
    };
  }

  if (typeof history === "string") {
    const item = deepCopy(emptyLineage);
    if (history !== "") {
      item.statement = {
        en: history,
        fr: history,
      };
    }
    updateLineage([deepCopy(item)]);
  }

  const handleLineageScopeChange = () => {
    return (e) => {
      const newEvent = {
        target: { value: metadataScopeCodes[e.target.value]?.isoValue },
      };
      updateLineageField("scopeIso")(newEvent);
      updateLineageField("scope")(e);
    };
  };

  const lineageStep = history.length > 0 && history[activeLineage];

  if (lineageStep && !lineageStep.scope) {
    lineageStep.scope = metadataScope;
  }

  if (typeof history === "string" || history instanceof String) {
    history = [];
  }

  return (
    <Box>
      <ItemCards
        items={history}
        updateItems={updateLineage}
        openIndex={activeLineage}
        setOpenIndex={setActiveLineage}
        disabled={disabled}
        idPrefix="lineage"
        numbered
        itemNoun={{ en: "lineage step", fr: "étape de généalogie" }}
        ariaLabel={
          language === "fr" ? "Généalogie des données" : "Lineage steps"
        }
        itemTitle={(item) => item.statement?.[language]}
        itemMeta={(item) => lineageSummary(item, language)}
        isComplete={lineageIsComplete}
        getBlankItem={() => deepCopy(emptyLineage)}
        duplicateItem={(copy) => {
          if (copy.statement?.en) copy.statement.en += " (copy)";
          if (copy.statement?.fr) copy.statement.fr += " (copie)";
          return copy;
        }}
        addLabel=<I18n
          en="Add lineage step"
          fr="Ajouter une étape de généalogie"
        />
        emptyText=<I18n
          en="No lineage yet."
          fr="Aucune généalogie pour l'instant."
        />
        renderEditor={() => (
          <Box>
            <Grid container direction="column" spacing={3}>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Lineage title</En>
                    <Fr>Titre de la généalogie des données</Fr>
                  </I18n>
                  <RequiredMark
                    passes={
                      lineageStep.statement?.en || lineageStep.statement?.fr
                    }
                  />
                  <SupplementalText>
                    <I18n>
                      <En>
                        General explanation of the lineage step or sampling
                        methods. For detailed processing steps or methods use
                        the processing and method step question
                      </En>
                      <Fr>
                        Expliquez dans un cadre général la généalogie des
                        données et/ou les méthodes d’échantillonnage. Pour
                        fournir une explication plus détaillée, utilisez la
                        section correspondante.
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <BilingualTextInput
                  label={
                    <I18n
                      en="Lineage title"
                      fr="Titre de la généalogie des données"
                    />
                  }
                  value={lineageStep.statement}
                  onChange={updateLineageField("statement")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Scope</En>
                    <Fr>Cadre</Fr>
                  </I18n>
                  <SupplementalText>
                    <I18n>
                      <En>
                        Type of resource and/or extent to which the lineage
                        information applies.
                      </En>
                      <Fr>
                        Type de ressource et/ou d'étendue pour laquelle les
                        informations sur l'origine s'appliquent.
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <SelectInput
                  value={lineageStep.scope}
                  onChange={handleLineageScopeChange()}
                  options={Object.keys(filteredMetadataScopeCodes)}
                  optionLabels={Object.values(filteredMetadataScopeCodes).map(
                    ({ title }) => title[language],
                  )}
                  disabled={disabled}
                  fullWidth
                  label={<I18n en="Scope" fr="Cadre" />}
                />
              </Grid>
              <Grid>
                <AdditionalDocumentation
                  documentations={lineageStep.additionalDocumentation}
                  updateDocumentations={updateLineageSubField(
                    "additionalDocumentation",
                  )}
                  disabled={disabled}
                  language={language}
                />
              </Grid>
              <Grid>
                <LineageSource
                  sources={lineageStep.source}
                  updateSources={updateLineageSubField("source")}
                  disabled={disabled}
                  language={language}
                />
              </Grid>
              <Grid>
                <ProcessingStep
                  sources={lineageStep.processingStep}
                  updateSources={updateLineageSubField("processingStep")}
                  disabled={disabled}
                  language={language}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      />
    </Box>
  );
};
export default Lineage;
