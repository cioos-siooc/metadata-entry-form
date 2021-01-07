import React from "react";
import { Paper, TextField, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { En, Fr } from "../I18n";
import { eovList, progressCodes } from "../../isoCodeLists";

import BilingualTextInput from "./BilingualTextInput";
import CheckBoxList from "./CheckBoxList";
import DateInput from "./DateInput";
import KeywordsInput from "./KeywordsInput";
import RequiredMark from "./RequiredMark";
import SelectInput from "./SelectInput";
import { camelToSentenceCase } from "../../utils/misc";
import translate from "../../utils/i18n";
import { validateField } from "../validate";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";

const IdentificationTab = ({ disabled, record, handleInputChange }) => {
  const { language } = useParams();

  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the dataset title? Required in both languages.</En>
          <Fr>
            Quel est le titre du jeu de données? Obligatoire dans les deux
            langues.
          </Fr>
          <RequiredMark passes={validateField(record, "title")} />
          <SupplementalText>
            <En>
              Please refrain from using special characters in the dataset title.
              This will define the title that is shown for this dataset in CKAN.
            </En>
            <Fr>
              S'il vous plaît ne pas utiliser caractères dans le titre du jeu de
              données. Cela définira le titre qui est montré pour ce jeu de
              données dans CKAN.
            </Fr>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          name="title"
          value={record.title}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>
            Enter an abstract or summary for the dataset. Required in both
            languages.
          </En>
          <Fr>Entrez un résumé pour le jeu de données.</Fr>
          <RequiredMark passes={validateField(record, "abstract")} />
          <SupplementalText>
            <En>
              These will define the summary text that is shown for this dataset
              in CKAN, so browsing some datasets at
              https://cioosatlantic.ca/ckan can help give a sense of the type of
              descriptions that are typically used for this.
              <br />
              <br />
              Suggested abstract points -
              <div>
                <ul>
                  <li>
                    <b>What</b>- variables that were measured
                  </li>
                  <li>
                    <b>When</b>- temporal coverage of the data, frequency of the
                    measurements/observations
                  </li>
                  <li>
                    <b>Where</b>- spatial coverage of the data, sampling sites,
                    sensor tracks, laboratory spaces
                  </li>
                  <li>
                    <b>How</b>- equipment, procedures, protocols, calibrations,
                    QA/QC
                  </li>
                  <li>
                    <b>Who</b>- participants, staff
                  </li>
                  <li>
                    <b>Why</b>- a high level statement on the outcome this data
                    is meant to inform
                  </li>
                </ul>
              </div>
            </En>
            <Fr>
              {" "}
              Points abstraits suggérés - Résumé du jeu de données : Quoi-
              Variables qui ont été mesurés ; Quan- Couverture temporelle des
              données, fréquence de la mesures/observations ; Où - couverture
              spatiale des données, les sites d'échantillonnage, les pistes de
              capteurs, les locaux de laboratoire ; procédures, protocoles,
              étalonnages, AQ/CQ ; personnel ; pourquoi - un énoncé de haut
              niveau sur le résultat de ces données est censé pour informer.
            </Fr>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          name="abstract"
          value={record.abstract}
          onChange={handleInputChange}
          disabled={disabled}
          multiline
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>
            Please select all the essential ocean variables that are contained
            in this dataset.
          </En>
          <Fr>
            Veuillez sélectionner toutes les variables océaniques essentielles
            contenues dans ce jeu de données.
          </Fr>
          <RequiredMark passes={validateField(record, "eov")} />
          <SupplementalText>
            <En>If none of these apply you can select Other.</En>
            <Fr>
              Si aucun de ces éléments ne s'applique, vous pouvez sélectionner «
              Autre'.
            </Fr>
          </SupplementalText>
        </QuestionText>
        <CheckBoxList
          name="eov"
          value={record.eov || []}
          onChange={handleInputChange}
          options={eovList}
          optionLabels={eovList.map((e) => {
            return camelToSentenceCase(translate(e, language));
          })}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClass}>
        <Grid container spacing={3} direction="column">
          <Grid item xs>
            <QuestionText>
              <En>
                What are the keywords that describe the dataset? Select from the
                list or create your own.
              </En>
              <Fr>
                Quels sont les mots-clés qui décrivent le jeu de données ?
                Sélectionnez dans la liste ou créez le vôtre.
              </Fr>
              <RequiredMark passes={validateField(record, "keywords")} />
              <SupplementalText>
                <En> Enter one at a time, clicking 'Add' after each.</En>
                <Fr>
                  Entrez un à la fois, en cliquant sur « Ajouter » après chaque.
                </Fr>
              </SupplementalText>
            </QuestionText>
          </Grid>
          <Grid item xs>
            <KeywordsInput
              name="keywords"
              value={record.keywords}
              onChange={handleInputChange}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the status of this dataset?</En>
          <Fr>Quel est l'état de ce jeu de données?</Fr>
          <RequiredMark passes={validateField(record, "progress")} />
        </QuestionText>
        <SelectInput
          name="progress"
          value={record.progress || ""}
          onChange={(e) => handleInputChange(e)}
          options={progressCodes.map(([code]) => code)}
          optionLabels={progressCodes.map(([code]) => {
            return camelToSentenceCase(translate(code, language));
          })}
          optionTooltips={progressCodes.map(([, description]) => description)}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the start date when data was first collected?</En>
          <Fr>
            Quelle est la date de début à laquelle les données ont été
            collectées pour la première fois?
          </Fr>
        </QuestionText>
        <DateInput
          name="dateStart"
          value={record.dateStart || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
        <QuestionText>
          <En>What is the end date when data was last collected?</En>
          <Fr>
            Quelle est la date de fin à laquelle les données ont été collectées
            pour la dernière fois?
          </Fr>
        </QuestionText>
        <DateInput
          name="dateEnd"
          value={record.dateEnd || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the date when the data was published?</En>
          <Fr>
            Quelle est la date de début à laquelle les données ont été publiées
            ?
          </Fr>
        </QuestionText>
        <DateInput
          name="datePublished"
          value={record.datePublished || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the date when data was revised?</En>
          <Fr>Quelle est la date de début de la révision des données?</Fr>
        </QuestionText>
        <DateInput
          name="dateRevised"
          value={record.dateRevised || null}
          onChange={handleInputChange}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the dataset identifier, eg DOI or other unique ID?</En>
          <Fr>
            Quel est l'identificateur du jeu de données, par exemple DOI ou
            autre ID unique?
          </Fr>
        </QuestionText>
        <TextField
          style={{ marginTop: "10px" }}
          name="datasetIdentifier"
          value={record.datasetIdentifier}
          onChange={(e) => handleInputChange(e)}
          fullWidth
        />
      </Paper>
    </div>
  );
};

export default IdentificationTab;
