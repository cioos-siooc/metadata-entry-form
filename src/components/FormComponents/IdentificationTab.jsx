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
          <En>What is primary language of the dataset?</En>
          <Fr>Quelle est la langue principale du jeu de données?</Fr>
          <RequiredMark passes={validateField(record, "language")} />
        </QuestionText>
        <SelectInput
          name="language"
          value={record.language}
          onChange={(e) => handleInputChange(e)}
          options={["en", "fr"]}
          optionLabels={["English", "Français"]}
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
          fullWidth={false}
          style={{ width: "200px" }}
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
          <En>
            What is the end date when data was last collected? Leave blank if
            data collection is ongoing.
          </En>
          <Fr>
            Quelle est la date de fin à laquelle les données ont été collectées
            pour la dernière fois? Laissez vide si la collecte des données est
            en cours.
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
          <En>
            What is the date when the data was published? Leave blank if dataset
            hasn't been published.
          </En>
          <Fr>
            Quelle est la date de début à laquelle les données ont été publiées
            ? Laissez vide si les données n'ont pas été publiées.
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
          <En>
            What is the date when data was revised? Leave blank if dataset
            hasn't been revised.
          </En>
          <Fr>
            Quelle est la date à laquelle les données ont été révisées ? Laissez
            vide si le jeu de données n'a pas a été révisé.
          </Fr>
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

      <Paper style={paperClass}>
        <QuestionText>
          <En>How is the dataset licensed?</En>
          <Fr>Comment le jeu de données est-il sous licence</Fr>
          <RequiredMark passes={validateField(record, "license")} />
          <SupplementalText>
            <En>
              <ul>
                <li>
                  <b>
                    Creative Commons Attribution 4.0 International licence
                    (CC-BY 4.0)
                  </b>{" "}
                  - CIOOS recommended. Allows for open sharing and adaptation of
                  the data provided that the original creator is attributed.
                </li>
                <li>
                  <b>Creative Commons 0</b> - imposes no restrictions of any
                  kind.
                </li>
                <li>
                  <b>Open Government Licence - Canada</b> - For datasets made
                  available by Government of Canada departments and agencies, it
                  is very similar to CC-BY as it allows for open sharing and
                  adaptation of the data, provided that the original creator of
                  the data is properly attributed.
                </li>
              </ul>
            </En>
            <Fr>
              <ul>
                <li>
                  <b>
                    Licence internationale Creative Commons Attribution 4.0
                    (CC-BY 4.0){" "}
                  </b>
                  - CIOOS recommandé.permet le partage ouvert et l'adaptation de
                  les données fournies que le créateur original est attribué.
                </li>
                <li>
                  <b>Creative Commons 0</b> - n'impose aucune restriction
                </li>
                <li>
                  <b>Licence pour gouvernement ouvert - Canada</b> - Pour les
                  ensembles de données disponible par les ministères et
                  organismes du gouvernement du Canada, très similaire à CC-BY
                  car il permet le partage ouvert et adaptation des données à
                  condition que le créateur initial du les données sont
                  correctement attribuées.
                </li>
              </ul>
            </Fr>
          </SupplementalText>
        </QuestionText>
        <SelectInput
          name="license"
          value={record.license}
          onChange={(e) => handleInputChange(e)}
          optionLabels={[
            "Creative Commons Attribution 4.0",
            "Creative Commons 0",
            "Open Government Licence - Canada",
            "Apache License, Version 2.0",
          ]}
          options={[
            "CC-BY-4.0",
            "CC0",
            "government-open-license-canada",
            "Apache-2.0",
          ]}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What are the limitations affecting the dataset?</En>
          <Fr>Quelles sont les limitations affectant le jeu de données?</Fr>
          <SupplementalText>
            <En>
              For example:
              <i>
                <ul>
                  <li>Not to be used for navigational purposes.</li>
                  <li>Instrument was not calibrated on day..</li>
                  <li>Haven’t applied appropriate QC on the data yet.</li>
                </ul>
              </i>
            </En>
            <Fr>
              Par exemple:
              <i>
                <ul>
                  <li>Ne pas utiliser à des fins de navigation.</li>
                  <li>L' instrument n'a pas été étalonné le jour..</li>
                  <li>
                    N' ont pas encore appliqué le contrôle de qualité approprié
                    sur les données.
                  </li>
                </ul>
              </i>
            </Fr>
          </SupplementalText>
        </QuestionText>
        <BilingualTextInput
          name="limitations"
          value={record.limitations}
          onChange={handleInputChange}
          multiline
          disabled={disabled}
        />
      </Paper>
    </div>
  );
};

export default IdentificationTab;
