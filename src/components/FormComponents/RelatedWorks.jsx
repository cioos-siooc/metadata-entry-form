import React from "react";
import {
  Add,
  Delete,
  ArrowUpwardSharp,
  ArrowDownwardSharp,
} from "@material-ui/icons";
import { Button, Grid, Paper, TextField } from "@material-ui/core";
import validator from "validator";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { associationTypeCode, identifierType } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { deepCopy } from "../../utils/misc";
import { QuestionText, paperClass, SupplementalText } from "./QuestionStyles";
import associationTypeToIso from "../../associationTypeMapping"

const validateURL = (url) => !url || validator.isURL(url);

const RelatedWorks = ({ updateResources, resources, disabled }) => {

  const emptyResource = { title: { en: "", fr: "" }, authority: "", code: "", association_type: "", association_type_iso: ""};
  const { language } = useParams();

  function addResource() {
    updateResources(resources.concat(deepCopy(emptyResource)));
  }

  // removes the resource section from the list at index i
  function removeResource(i) {
    updateResources(resources.filter((e, index) => index !== i));
  }

  // move the resource section
  function moveResource(i, newIndex) {
    if (newIndex < 0 || newIndex >= resources.length) return;
    const element = resources.splice(i, 1)[0];
    resources.splice(newIndex, 0, element);
    updateResources(resources);
  }

  return (
    <div>
      {resources.map((dist = deepCopy(emptyResource), i) => {
        function urlIsValid(url) {
          return !url || validateURL(url);
        }
        function handleResourceChange(key) {
          return (e) => {
            const newValue = [...resources];
            newValue[i][key] = e.target.value;
            updateResources(newValue);
          };
        }

        function handleAssociationTypeChange() {
          return (e) => {
            const newValue = [...resources];
            newValue[i].association_type_iso = associationTypeToIso[e.target.value];
            newValue[i].association_type = e.target.value;
            updateResources(newValue);
          };
        }

        function handleIdentifierChange(key) {
          return (e) => {

            const newValue = [...resources];
            newValue[i][key] = e.target.value;

            const s = newValue[i].code
            switch (true) {
              case urlIsValid(newValue[i].code) && /^http.?:\/\/doi\.org\//i.test(s):
                newValue[i].authority = 'DOI'
                break;
              case urlIsValid(newValue[i].code):
                newValue[i].authority = 'URL'
                break;
              default:
                newValue[i].authority = ''
                break;
            }
            updateResources(newValue);
          };
        }
        return (
          <Paper key={i} style={paperClass}>
            <Grid container direction="column" spacing={3}>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the title of the related resource</En>
                    <Fr>Entrez le titre de l'œuvre concernée</Fr>
                  </I18n>
                  <RequiredMark passes={dist.title?.en || dist.title?.fr} />
                </QuestionText>{" "}
                <BilingualTextInput
                  name="title"
                  label={<I18n en="Title" fr="Titre" />}
                  value={dist.title}
                  onChange={handleResourceChange("title")}
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier for the related resource</En>
                    <Fr>Saisissez l'identifiant de l'œuvre concernée</Fr>
                  </I18n>

                  <RequiredMark passes={dist.code} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          The identifier may be to a resource, or metadata record on another
                          repository or another record within CIOOS. A DOI or full URL are preferred.
                        </p>
                      </En>
                      <Fr>
                        <p>
                          L'identifiant peut provenir d'une ressource ou d'un enregistrement de métadonnées sur un autre
                          référentiel ou un autre enregistrement dans CIOOS. Un DOI ou une URL complète sont préférés.
                        </p>
                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <TextField
                  label={<I18n en="Identifier" fr="identifiant" />}
                  value={dist.code}
                  onChange={handleIdentifierChange("code")}
                  fullWidth
                  disabled={disabled}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>Enter the identifier type</En>
                    <Fr>Entrez le type d'identifiant</Fr>
                  </I18n>
                  <RequiredMark passes={dist.authority} />
                </QuestionText>

                <SelectInput
                  value={dist.authority}
                  onChange={handleResourceChange("authority")}
                  options={identifierType}
                  optionLabels={identifierType}
                  disabled={disabled}
                  label={< I18n en="Identifier Type" fr="Type d'identifiant" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid item xs>
                <QuestionText>
                  <I18n>
                    <En>What is the relation type?</En>
                    <Fr>
                      Quel est le type de relation?</Fr>
                  </I18n>
                  <RequiredMark passes={dist.association_type} />
                  <SupplementalText>
                    <I18n>
                      <En>
                        <p>
                          Specify the relationship from (A) the primary resource; to (B) the related resource. For example:
                        </p>
                        <ul>
                          <li>Use 'Is New Version Of' to indicate the primary resource described in this metadata record (A) is a new version of (B) the related resource.</li>
                          <li>Use 'Is Part of' to indicate the primary resource (A) is a subset of (B) the related larger resource.</li>
                          <li>Use 'Has Part' to indicate the primary resource (A) is the larger work that includes (B) the related resource.</li>
                          <li>Use 'Cites' to indicate that (A) cites (B).</li>
                          <li>Use 'Is Cited by to indicate that (B) cites (A)</li>
                        </ul>

                      </En>
                      <Fr>
                        <p>
                          Spécifiez la relation à partir de (A) la ressource principale ; à (B) la ressource associée. Par exemple:
                        </p>
                        <ul>
                          <li>Utilisez "Est une nouvelle version de" pour indiquer que la ressource principale décrite dans cet enregistrement de métadonnées (A) est une nouvelle version de (B) la ressource associée.</li>
                          <li>Utilisez "Fait partie de" pour indiquer que la ressource principale (A) est un sous-ensemble de (B) la ressource plus grande associée.</li>
                          <li>Utilisez "A une partie" pour indiquer que la ressource principale (A) est le travail le plus important qui comprend (B) la ressource associée.</li>
                          <li>Utilisez "Cites" pour indiquer que (A) cite (B).</li>
                          <li>Utilisez "Est cité par" pour indiquer que (B) cite (A)</li>
                        </ul>

                      </Fr>
                    </I18n>
                  </SupplementalText>
                </QuestionText>
                <SelectInput
                  value={dist.association_type}
                  onChange={handleAssociationTypeChange()}
                  options={Object.keys(associationTypeCode)}
                  optionLabels={Object.values(associationTypeCode).map(
                    ({ title }) => title[language]
                  )}
                  optionTooltips={Object.values(associationTypeCode).map(
                    ({ text }) => text[language]
                  )}
                  disabled={disabled}
                  label={<I18n en="Relation Type" fr="Type de relation" />}
                  fullWidth={false}
                />
              </Grid>
              <Grid item xs>
                <Button
                  startIcon={<Delete />}
                  disabled={disabled}
                  onClick={() => removeResource(i)}
                >
                  <I18n>
                    <En>Remove item</En>
                    <Fr>Supprimer la ressource</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowUpwardSharp />}
                  disabled={disabled || i - 1 < 0}
                  onClick={() => moveResource(i, i - 1)}
                >
                  <I18n>
                    <En>Move up</En>
                    <Fr>Déplacer vers le haut</Fr>
                  </I18n>
                </Button>
                <Button
                  startIcon={<ArrowDownwardSharp />}
                  disabled={disabled || i + 1 >= resources.length}
                  onClick={() => moveResource(i, i + 1)}
                >
                  <I18n>
                    <En>Move down</En>
                    <Fr>Déplacer vers le bas</Fr>
                  </I18n>
                </Button>
              </Grid>
            </Grid>
          </Paper>
        );
      })}

      <Paper style={paperClass}>
        <Button startIcon={<Add />} disabled={disabled} onClick={() => addResource()}>
          <I18n>
            <En>Add item</En>
            <Fr>Ajouter une ressource</Fr>
          </I18n>
        </Button>
      </Paper>
    </div>
  );
};

export default RelatedWorks;
