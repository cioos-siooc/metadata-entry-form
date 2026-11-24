import React, { useState } from "react";
import { Grid, Box, TextField } from "@mui/material";
import validator from "validator";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { associationTypeCode, identifierType } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { deepCopy } from "../../utils/misc";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import associationTypeToIso from "../../associationTypeMapping";
import { relatedWorkIsComplete } from "../../utils/validate";
import ItemCards from "./ItemCards";

const validateURL = (url) => !url || validator.isURL(url);

// The row's second line: how it relates, and its identifier.
function relatedWorkSummary(work, language) {
  return [
    associationTypeCode[work.association_type]?.title?.[language],
    work.code,
  ]
    .filter(Boolean)
    .join(" · ");
}

const RelatedWorks = ({ updateResources, resources, disabled }) => {
  const emptyResource = {
    title: { en: "", fr: "" },
    authority: "",
    code: "",
    association_type: "",
    association_type_iso: "",
  };
  const { language } = useParams();
  const [activeResource, setActiveResource] = useState(null);
  const resourceStep = resources.length > 0 && resources[activeResource];

  function handleResourceChange(key) {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource][key] = e.target.value;
      updateResources(newValue);
    };
  }

  function handleAssociationTypeChange() {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource].association_type_iso =
        associationTypeToIso[e.target.value];
      newValue[activeResource].association_type = e.target.value;
      updateResources(newValue);
    };
  }

  function urlIsValid(url) {
    return !url || validateURL(url);
  }

  function handleIdentifierChange(key) {
    return (e) => {
      const newValue = [...resources];
      newValue[activeResource][key] = e.target.value;

      const s = newValue[activeResource].code;
      switch (true) {
        case urlIsValid(newValue[activeResource].code) &&
          /^http.?:\/\/doi\.org\//i.test(s):
          newValue[activeResource].authority = "DOI";
          break;
        case urlIsValid(newValue[activeResource].code):
          newValue[activeResource].authority = "URL";
          break;
        default:
          newValue[activeResource].authority = "";
          break;
      }
      updateResources(newValue);
    };
  }
  return (
    <Box>
      <ItemCards
        items={resources}
        updateItems={updateResources}
        openIndex={activeResource}
        setOpenIndex={setActiveResource}
        disabled={disabled}
        idPrefix="related"
        numbered
        itemNoun={{ en: "related work", fr: "travail connexe" }}
        ariaLabel={language === "fr" ? "Travaux connexes" : "Related works"}
        itemTitle={(item) => item.title?.[language]}
        itemMeta={(item) => relatedWorkSummary(item, language)}
        isComplete={relatedWorkIsComplete}
        getBlankItem={() => deepCopy(emptyResource)}
        duplicateItem={(copy) => {
          if (copy.title?.en) copy.title.en += " (copy)";
          if (copy.title?.fr) copy.title.fr += " (copie)";
          return copy;
        }}
        addLabel=<I18n en="Add related work" fr="Ajouter un travail connexe" />
        emptyText=<I18n
          en="No related works yet."
          fr="Aucun travail connexe pour l'instant."
        />
        renderEditor={() => (
          <Box>
            <Grid container direction="column" spacing={3}>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter the title of the related resource</En>
                    <Fr>Entrez le titre de la ressource connexe</Fr>
                  </I18n>
                  <RequiredMark
                    passes={resourceStep.title?.en || resourceStep.title?.fr}
                  />
                </QuestionText>{" "}
                <BilingualTextInput
                  name="title"
                  label={<I18n en="Title" fr="Titre" />}
                  value={resourceStep.title}
                  onChange={handleResourceChange("title")}
                  disabled={disabled}
                  fullWidth
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier for the related resource</En>
                    <Fr>Saisissez l'identifiant de la ressource connexe</Fr>
                  </I18n>

                  <RequiredMark passes={resourceStep.code} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The identifier may be to a resource, or metadata
                          record on another repository or another record within
                          CIOOS. A DOI or full URL are preferred.
                        </p>
                      </En>
                      <Fr>
                        <p>
                          L'identifiant peut renvoyer vers une ressource ou un
                          enregistrement de métadonnées sur un autre dépôt de
                          données ou vers un autre enregistrement dans le SIOOC.
                          Un DOI ou une URL complète sont préférés.
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <TextField
                  label={<I18n en="Identifier" fr="identifiant" />}
                  value={resourceStep.code}
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
                  <RequiredMark passes={resourceStep.authority} />
                </QuestionText>

                <SelectInput
                  value={resourceStep.authority}
                  onChange={handleResourceChange("authority")}
                  options={identifierType}
                  optionLabels={identifierType}
                  disabled={disabled}
                  label={<I18n en="Identifier type" fr="Type d'identifiant" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid>
                <QuestionText>
                  <I18n>
                    <En>What is the relation type?</En>
                    <Fr>Quel est le type de relation?</Fr>
                  </I18n>
                  <RequiredMark passes={resourceStep.association_type} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          Specify the relationship from (A) the primary
                          resource; to (B) the related resource. For example:
                        </p>
                        <ul>
                          <li>
                            Use 'Is New Version Of' to indicate the primary
                            resource described in this metadata record (A) is a
                            new version of (B) the related resource.
                          </li>
                          <li>
                            Use 'Is Part of' to indicate the primary resource
                            (A) is a subset of (B) the related larger resource.
                          </li>
                          <li>
                            Use 'Has Part' to indicate the primary resource (A)
                            is the larger work that includes (B) the related
                            resource.
                          </li>
                          <li>Use 'Cites' to indicate that (A) cites (B).</li>
                          <li>
                            Use 'Is Cited by to indicate that (B) cites (A)
                          </li>
                        </ul>
                      </En>
                      <Fr>
                        <p>
                          Spécifiez la relation entre la ressource principale
                          (A) et la ressource connexe (B). Par exemple :
                        </p>
                        <ul>
                          «»
                          <li>
                            Utilisez « Est une nouvelle version de » pour
                            indiquer que la ressource principale (A) décrite
                            dans cet enregistrement de métadonnées est une
                            nouvelle version de la ressource connexe (B).
                          </li>
                          <li>
                            Utilisez « Fait partie de » pour indiquer que la
                            ressource principale (A) est un sous-ensemble de la
                            ressource connexe (B) plus large.
                          </li>
                          <li>
                            Utilisez « A une partie » pour indiquer que la
                            ressource principale (A) est plus large qui comprend
                            la ressource connexe (B).
                          </li>
                          <li>
                            Utilisez « Cite » pour indiquer que (A) cite (B).
                          </li>
                          <li>
                            Utilisez « Est cité par » pour indiquer que (B) cite
                            (A)
                          </li>
                        </ul>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <SelectInput
                  value={resourceStep.association_type}
                  onChange={handleAssociationTypeChange()}
                  options={Object.keys(associationTypeCode)}
                  optionLabels={Object.values(associationTypeCode).map(
                    ({ title }) => title[language],
                  )}
                  optionTooltips={Object.values(associationTypeCode).map(
                    ({ text }) => text[language],
                  )}
                  disabled={disabled}
                  label={<I18n en="Relation type" fr="Type de relation" />}
                  fullWidth={false}
                />
              </Grid>
            </Grid>
          </Box>
        )}
      />
    </Box>
  );
};

export default RelatedWorks;
