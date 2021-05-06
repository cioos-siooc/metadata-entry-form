import React from "react";
import { Paper, TextField, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { En, Fr } from "../I18n";
import { eovList, progressCodes } from "../../isoCodeLists";

import BilingualTextInput from "../FormComponents/BilingualTextInput";
import CheckBoxList from "../FormComponents/CheckBoxList";
import DateInput from "../FormComponents/DateInput";
import KeywordsInput from "../FormComponents/KeywordsInput";
import RequiredMark from "../FormComponents/RequiredMark";
import SelectInput from "../FormComponents/SelectInput";
import { camelToSentenceCase } from "../../utils/misc";
import translate from "../../utils/i18n";
import licenses from "../../utils/licenses";
import { validateField } from "../../utils/validate";
import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

import regions from "../../regions";

const IdentificationTab = ({ disabled, record, handleInputChange }) => {
  const { language, region } = useParams();
  const regionInfo = regions[region];

  const CatalogueLink = (lang) => (
    <a
      href={regionInfo.catalogueURL[lang]}
      target="_blank"
      rel="noopener noreferrer"
    >
      {regionInfo.catalogueURL[lang]}
    </a>
  );

  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the dataset title? Required in English and French.</En>
          <Fr>
            Quel est le titre du jeu de données? Obligatoire dans les deux
            langues.
          </Fr>
          <RequiredMark passes={validateField(record, "title")} />
          <SupplementalText>
            <En>
              Please refrain from using special characters in the dataset title.
              This will appear as the title that is shown for this dataset in
              the {regionInfo.catalogueTitle.en}.
            </En>
            <Fr>
              Veuillez ne pas utiliser de caractères spéciaux dans le titre du
              jeu de données. Cela apparaîtra sous la forme du titre affiché
              pour ce jeu de données dans le {regionInfo.catalogueTitle.fr}.
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
          <En>What is the primary language of the dataset?</En>
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
          <Fr>Entrez un description pour le jeu de données.</Fr>
          <RequiredMark passes={validateField(record, "abstract")} />
          <SupplementalText>
            <En>
              This information will appear as the summary text that is shown for
              this dataset in the {regionInfo.catalogueTitle.en}. Browsing
              datasets at <CatalogueLink lang="en" /> can help provide a sense
              of the type of descriptions that are typically used for this
              section of the profile. As a general rule, this section should be
              worded with as little jargon as possible to give potential users
              an understanding of your dataset.
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
              Cette description constituera le texte récapitulatif du jeu de
              données lorsqu’il sera publié dans le{" "}
              {regionInfo.catalogueTitle.fr}. Veuillez consulter d’autres jeux
              de données déjà publiés si vous désirez consulter un exemple :{" "}
              <CatalogueLink lang="fr" />. Si possible, veuillez remplir ce
              champ en utilisant un langage accessible pouvant être bien compris
              par d’autres utilisateurs.
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
              Autre ».
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
                Keywords are an important way to categorize your data that allow
                people and other systems to search for datasets that share some
                important characteristics. Choose the most specific keywords
                that apply to your data, or create your own.
              </En>
              <Fr>
                Les mots-clés permettent de catégoriser vos données et
                facilitent leur découvrabilité par d’autres utilisateurs.
                Choisissez des mots-clés spécifiques qui s’appliquent à vos
                données ou créez-en des nouveaux.
              </Fr>
              <RequiredMark passes={validateField(record, "keywords")} />
              <SupplementalText>
                <En> Enter one at a time, clicking 'Add' after each.</En>
                <Fr>
                  Entrez un mot-clé à la fois. Cliquez sur « Ajouter » après
                  chaque entrée.
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
          options={Object.keys(progressCodes)}
          optionLabels={Object.values(progressCodes).map(
            ({ title }) => title[language]
          )}
          optionTooltips={Object.values(progressCodes).map(
            ({ text }) => text[language]
          )}
          disabled={disabled}
          fullWidth={false}
          style={{ width: "200px" }}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <En>What is the start date when data was first collected?</En>
          <Fr>Inscrivez la date de début de votre collecte de données.</Fr>
        </QuestionText>
        <DateInput
          name="dateStart"
          value={record.dateStart || null}
          onChange={handleInputChange}
          disabled={disabled}
          dateEnd={record.dateEnd || undefined}
        />
        <QuestionText>
          <En>
            What is the end date when data was last collected? Leave blank if
            data collection is ongoing.
          </En>
          <Fr>
            Inscrivez la date de fin de votre collecte de données. L aissez vide
            si la collecte des données est en cours.
          </Fr>
        </QuestionText>
        <DateInput
          name="dateEnd"
          value={record.dateEnd || null}
          onChange={handleInputChange}
          disabled={disabled}
          dateStart={record.dateStart || undefined}
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
          <En>What is the DOI for this dataset?</En>
          <Fr>Quel est le DOI de ce jeu de données ?</Fr>
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
                  - Licence recommandée par le SIOOC. Les données sont ouvertes,
                  mais la licence exige que le jeu de données soit cité
                  lorsqu’il est utilisé par un autre utilisateur.
                </li>
                <li>
                  <b>Creative Commons 0</b> - N’impose aucune restriction
                  particulière : le jeu de données peut être utilisé sans être
                  cité.
                </li>
                <li>
                  <b>Licence pour gouvernement ouvert - Canada</b> - Pour les
                  jeux de données rendus disponibles par les organisation et
                  ministères fédéraux. Cette licence est similaire à CC-BY 4.0 :
                  les données sont ouvertes mais le jeu de données doit être
                  cité lorsque utilisé par un autre utilisateur. correctement
                  attribuées.
                </li>
              </ul>
            </Fr>
          </SupplementalText>
        </QuestionText>
        <SelectInput
          name="license"
          value={record.license}
          onChange={(e) => handleInputChange(e)}
          optionLabels={Object.values(licenses)}
          options={Object.keys(licenses)}
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
                  <li>Instrument was not calibrated on day.</li>
                  <li>Haven’t applied appropriate QC on the data yet.</li>
                </ul>
              </i>
            </En>
            <Fr>
              Par exemple :
              <i>
                <ul>
                  <li>Ne pas utiliser à des fins de navigation.</li>
                  <li>L' instrument n'a pas été étalonné.</li>
                  <li>
                    Un contrôle de qualité n’a pas été effectué sur les données.
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
