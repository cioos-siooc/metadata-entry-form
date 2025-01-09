import React from "react";
import {
  Paper,
  TextField,
  Grid,
  IconButton,
  Tooltip,
} from "@material-ui/core";
import { useParams } from "react-router-dom";
import { OpenInNew, Update } from "@material-ui/icons";
import { En, Fr, I18n } from "../I18n";
import { progressCodes } from "../../isoCodeLists";
import { eovs, eovCategories } from "../../eovs";

import BilingualTextInput from "../FormComponents/BilingualTextInput";
import CheckBoxList from "../FormComponents/CheckBoxList";
import DateInput from "../FormComponents/DateInput";
import KeywordsInput from "../FormComponents/KeywordsInput";
import RequiredMark from "../FormComponents/RequiredMark";
import SelectInput from "../FormComponents/SelectInput";
import licenses from "../../utils/licenses";
import { validateField } from "../../utils/validate";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

import regions from "../../regions";

const IdentificationTab = ({
  disabled,
  record,
  handleUpdateRecord,
  updateRecord,
  projects,
}) => {
  const { language, region } = useParams();
  const regionInfo = regions[region];

  const languageUpperCase = language.toUpperCase();

  const CatalogueLink = ({ lang }) => (
    <a
      href={regionInfo.catalogueURL[lang]}
      target="_blank"
      rel="noopener noreferrer"
    >
      {regionInfo.catalogueURL[lang]}
    </a>
  );

  // sort into array of objects sorted by name?
  const licensesSorted = Object.values(licenses).sort((a, b) =>
    (a.title[language] || a.title.en).localeCompare(
      b.title[language] || a.title.en,
      language
    )
  );

  return (
    <div>

      {projects.length ? (
        <Paper style={paperClass}>
          <QuestionText>
            <I18n>
              <En>
                What are the projects that this record is part of? To add a
                project, email{" "}
              </En>
              <Fr>
                Quels sont les projets dont cet enregistrement fait partie? Pour ajouter
                un projet, courriel {" "}
              </Fr>
            </I18n>
            <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
          </QuestionText>
          <CheckBoxList
            value={record.projects || []}
            labelSize={6}
            onChange={updateRecord("projects")}
            options={projects}
            optionLabels={projects}
            disabled={disabled}
          />
        </Paper>
      ) : (
        <div />
      )}

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              Enter an abstract or summary for the dataset. Required in both
              languages.
            </En>
            <Fr>Décrivez votre jeu de données.</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "abstract")} />
          <SupplementalText>
            <I18n>
              <En>
                This information will appear as the summary text that is shown
                for this dataset in the {regionInfo.catalogueTitle.en}. Browsing
                datasets at <CatalogueLink lang="en" /> can help provide a sense
                of the type of descriptions that are typically used for this
                section of the record. As a general rule, this section should be
                worded with as little jargon as possible to give potential users
                an understanding of your dataset. Use a maximum of 500 words.
                For detailed methods please submit supplemental materials with
                your data.
                <br />
                <br />
                Suggested abstract points -
                <div>
                  <ul>
                    <li>
                      <b>What</b>- variables that were measured
                    </li>
                    <li>
                      <b>When</b>- temporal coverage of the data, frequency of
                      the measurements/observations
                    </li>
                    <li>
                      <b>Where</b>- spatial coverage of the data, sampling
                      sites, sensor tracks, laboratory spaces
                    </li>
                    <li>
                      <b>Why</b>- a high level statement on the outcome this
                      data is meant to inform
                    </li>
                  </ul>
                </div>
              </En>

              <Fr>
                Cette description correspond au résumé de votre jeu de données
                lorsqu’il sera publié dans le {regionInfo.catalogueTitle.fr}{" "}
                <CatalogueLink lang="fr" />. Pour vous aider à rédiger ce
                résumé, vous pouvez vous inspirer d’autres jeux de données déjà
                publiés dans le catalogue. Ce champ doit être compris par tout
                type d’utilisateur, nous vous recommandons un maximum de 500
                mots, l’utilisation d’un langage accessible et de limiter
                l’utilisation de vocabulaire de type jargon.
                <br />
                <br />
                Suggestion de points à aborder dans votre résumé:
                <div>
                  <ul>
                    <li>
                      <b>Quoi</b>: Les variables qui ont été mesurées
                    </li>
                    <li>
                      <b>Quand</b>: Couverture temporelle de la donnée,
                      fréquence de la mesure/observation
                    </li>
                    <li>
                      <b>Où</b>: Couverture spatiale de la donnée, nom/lieu des
                      sites d’échantillonnages, déplacement enregistrés d’un
                      capteur, laboratoire, etc.
                    </li>
                    <li>
                      <b>Comment</b>: Équipement, procédures, protocoles,
                      calibration, assurance/contrôle de la qualité
                    </li>
                    <li>
                      <b>Qui</b>: Participants, membres du personnel
                    </li>
                    <li>
                      <b>Pourquoi</b>: Quelques lignes pour décrire le contexte
                      dans lequel les données ont été échantillonnées et comment
                      elles permettent de répondre à la problématique (p. ex:
                      quelles informations peuvent-elles apporter)
                    </li>
                  </ul>
                </div>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          name="abstract"
          value={record.abstract}
          onChange={handleUpdateRecord("abstract")}
          disabled={disabled}
          multiline
        />
      </Paper>
      {(!record.resourceType || !(record.resourceType.includes('other') && record.resourceType.length === 1)) && (
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              Please select all the essential ocean variables that are contained
              in this dataset. Hover over a variable to see its definition.
            </En>
            <Fr>
              Veuillez sélectionner toutes les variables océaniques essentielles
              contenues dans ce jeu de données. Survolez une variable pour voir
              sa définition ou cliquez sur l’icône <OpenInNew /> pour accéder à
              la définition complète du Système d’observatoire global des océans
              (GOOS).
            </Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "eov")} />
          <SupplementalText>
            <I18n>
              <En>If none of these apply you can select Other.</En>
              <Fr>
                Si aucune de ces variables ne vous semble pertinente, vous
                pouvez sélectionner « Autre ».
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        {Object.entries(eovCategories).map(([categoryKey, categoryText]) => {
          const eovsFiltered = eovs
            .filter((e) => e.category === categoryKey)
            .sort((a, b) =>
              a[`label ${languageUpperCase}`].localeCompare(
                b[`label ${languageUpperCase}`],
                language
              )
            );

          return (
            <div key={categoryText[language]}>
              <h4>{categoryText[language]}</h4>
              <CheckBoxList
                value={record.eov || []}
                labelSize={6}
                onChange={updateRecord("eov")}
                options={eovsFiltered.map((e) => e.value)}
                optionLabels={eovsFiltered.map((e) => (
                  <>
                    <Tooltip title={e[`definition ${languageUpperCase}`]}>
                      <span>{e[`label ${languageUpperCase}`]}</span>
                    </Tooltip>
                    {e.url && (
                      <IconButton
                        onClick={() => {
                          const win = window.open(e.url, "_blank");
                          win.focus();
                        }}
                      >
                        <Tooltip
                          title={
                            <I18n
                              en="Open GOOS definition in new window"
                              fr="Ouvrir la définition GOOS dans une nouvelle fenêtre"
                            />
                          }
                        >
                          <OpenInNew />
                        </Tooltip>
                      </IconButton>
                    )}
                    {e.emerging && (
                      <IconButton onClick={() => {}}>
                        <Tooltip
                          title={
                            <I18n
                              en="GOOS emerging EOV"
                              fr="EOV émergent GOOS"
                            />
                          }
                        >
                          <Update />
                        </Tooltip>
                      </IconButton>
                    )}
                  </>
                ))}
                disabled={disabled}
              />
            </div>
          );
        })}
        </Paper>)}

      <Paper style={paperClass}>
        <Grid container spacing={3} direction="column">
          <Grid item xs>
            <QuestionText>
              <I18n>
                <En>
                  Choose the most specific keywords that apply to your data, or
                  create your own.
                </En>
                <Fr>
                  Choisissez des mots-clés spécifiques qui s’appliquent à vos
                  données ou créez-en des nouveaux.
                </Fr>
              </I18n>
              <RequiredMark passes={validateField(record, "keywords")} />
              <SupplementalText>
                <I18n>
                  <En>
                    <p>
                      Keywords are an important way to categorize your data that
                      allow people and other systems to search for datasets that
                      share some important characteristics.
                    </p>
                    <p>
                      Keywords should include the place name of the closest
                      community or major geographic location. Ex. Hartley Bay,
                      Gitga’at Territory, in addition to the closest body of
                      water, e.g. Douglas Channel.
                    </p>
                    <p>Enter one at a time, clicking 'Add' after each.</p>
                  </En>
                  <Fr>
                    <p>
                      Les mots clés sont un moyen efficace de catégoriser vos
                      données pour permettre aux utilisateurs ou à d'autres
                      systèmes d’accéder à tous les jeux de données partageant
                      une même caractéristique.
                    </p>
                    <p>
                      Vous pouvez choisir un mot clé prédéfini (liste
                      déroulante) en français puis cliquer sur le bouton de
                      traduction. Vous pouvez aussi créer votre propre mot clé
                      en rédigeant un texte libre en anglais ou en français
                      (vérifiez toujours si son équivalent existe dans la liste
                      déroulante afin de diminuer le risque d’écriture multiple
                      d’un même mot clé -ex: phoque Vs Phoques-).
                    </p>
                    <p>
                      Entrez un mot-clé à la fois. Cliquez sur « Ajouter »
                      chaque mot saisi.
                    </p>
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>
          </Grid>
          <Grid item xs>
            <KeywordsInput
              value={record.keywords}
              onChange={handleUpdateRecord("keywords")}
              disabled={disabled}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What is the status of this dataset?</En>
            <Fr>Quel est l'état de ce jeu de données?</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "progress")} />

          <SupplementalText>
            {Object.values(progressCodes).map(({ title, text }) => (
              <div style={{ margin: "10px" }} key={title[language]}>
                {`${title[language]}: ${text[language]}`}
              </div>
            ))}
          </SupplementalText>
        </QuestionText>
        <SelectInput
          value={record.progress || ""}
          onChange={handleUpdateRecord("progress")}
          options={Object.keys(progressCodes)}
          optionLabels={Object.values(progressCodes).map(
            ({ title }) => title[language]
          )}
          disabled={disabled}
          fullWidth={false}
          style={{ width: "200px" }}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What is the start date when data was first collected?</En>
            <Fr>Inscrivez la date de début de votre collecte de données.</Fr>
          </I18n>
        </QuestionText>
        <DateInput
          value={record.dateStart || null}
          onChange={handleUpdateRecord("dateStart")}
          disabled={disabled}
          dateEnd={record.dateEnd || undefined}
        />
        <br />
        <QuestionText>
          <I18n>
            <En>
              What is the end date when data was last collected? Leave blank if
              data collection is ongoing.
            </En>
            <Fr>
              Inscrivez la date de fin de votre collecte de données. Laissez le
              champs vide si la collecte des données toujours est en cours.
            </Fr>
          </I18n>
        </QuestionText>
        <DateInput
          value={record.dateEnd || null}
          onChange={handleUpdateRecord("dateEnd")}
          disabled={disabled}
          dateStart={record.dateStart || undefined}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              What is the date when the data was published? Leave blank if
              dataset hasn't been published.
            </En>
            <Fr>
              Quelle est la date de première publication des données ? Laissez
              le champ vide si les données n'ont pas été publiées.
            </Fr>
          </I18n>
        </QuestionText>
        <DateInput
          name="datePublished"
          value={record.datePublished || null}
          onChange={handleUpdateRecord("datePublished")}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>The version number of this dataset. For example, 1.1</En>
            <Fr>
              Le numéro de version de cet ensemble de données. Par exemple, 1.1
            </Fr>
          </I18n>
        </QuestionText>
        <TextField
          value={record.edition}
          onChange={handleUpdateRecord("edition")}
          disabled={disabled}
          style={{ marginTop: "10px" }}
          fullWidth
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>
              What is the date when data was revised? Leave blank if dataset
              hasn't been revised.
            </En>
            <Fr>
              Quelle est la date de la dernière révision des données ? Laissez
              le champ vide si le jeu de données n'a pas été révisé.
            </Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                <p>
                  Please note that this field does not need to be populated or
                  updated when revisions are made to the metadata, but rather
                  when a new version of the data file or package becomes
                  available, i.e. for time-series data.
                </p>
              </En>
              <Fr>
                <p>
                  Veuillez noter que ce champ n'a pas besoin d'être rempli ou
                  mis à jour lorsque des révisions sont apportées aux
                  métadonnées, mais plutôt lorsqu'une nouvelle version du
                  fichier ou du paquet de données devient disponible,
                  c'est-à-dire pour les données de séries temporelles.
                </p>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        <DateInput
          name="dateRevised"
          value={record.dateRevised || null}
          onChange={handleUpdateRecord("dateRevised")}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>How is the dataset licensed?</En>
            <Fr>Quelle est la licence de ce jeu de données?</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "license")} />
          <SupplementalText>
            <I18n>
              <En>
                <ul>
                  <li>
                    <b>
                      <a
                        href="https://creativecommons.org/licenses/by/4.0/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Creative Commons Attribution 4.0 International licence
                        (CC-BY 4.0)
                      </a>
                    </b>{" "}
                    - CIOOS recommended. Allows for open sharing and adaptation
                    of the data provided that the original creator is
                    attributed.
                  </li>
                  <li>
                    <b>
                      <a
                        href="https://creativecommons.org/share-your-work/public-domain/cc0/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Creative Commons 0
                      </a>
                    </b>{" "}
                    - imposes no restrictions of any kind.
                  </li>
                  <li>
                    <b>
                      <a
                        href="https://open.canada.ca/en/open-government-licence-canada"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Government Licence - Canada
                      </a>
                    </b>{" "}
                    - For datasets made available by Government of Canada
                    departments and agencies, it is very similar to CC-BY as it
                    allows for open sharing and adaptation of the data, provided
                    that the original creator of the data is properly
                    attributed.
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
                    - Licence recommandée par le SIOOC. Les données sont
                    ouvertes, mais la licence exige que le jeu de données soit
                    cité lorsqu’il est utilisé par un autre utilisateur.
                  </li>
                  <li>
                    <b>Creative Commons 0</b> - N’impose aucune restriction
                    particulière : le jeu de données peut être utilisé sans être
                    cité.
                  </li>
                  <li>
                    <b>Licence du gouvernement ouvert - Canada</b> - Pour les
                    jeux de données rendus disponibles par les organisations et
                    ministères fédéraux. Cette licence est similaire à CC-BY 4.0
                    : les données sont ouvertes mais le jeu de données doit être
                    cité lorsqu'il est utilisé par un autre utilisateur.
                  </li>
                </ul>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        <SelectInput
          value={record.license}
          onChange={handleUpdateRecord("license")}
          optionLabels={licensesSorted.map((l) => (
            <span>
              {l.title[language] || l.title.en}

              <Tooltip
                title={
                  <I18n
                    en="Open license definition in new window"
                    fr="Ouvrir la définition de licence dans une nouvelle fenêtre"
                  />
                }
              >
                <IconButton
                  onClick={() => {
                    const win = window.open(l.url, "_blank");
                    win.focus();
                  }}
                >
                  <OpenInNew />
                </IconButton>
              </Tooltip>
            </span>
          ))}
          options={licensesSorted.map((l) => l.code)}
          disabled={disabled}
        />
      </Paper>
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What are the limitations affecting the dataset?</En>
            <Fr>Quelles sont les limitations affectant le jeu de données?</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
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
                      Un contrôle de qualité n’a pas été effectué sur les
                      données.
                    </li>
                  </ul>
                </i>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        <BilingualTextInput
          name="limitations"
          value={record.limitations}
          onChange={handleUpdateRecord("limitations")}
          multiline
          disabled={disabled}
        />
      </Paper>
    </div>
  );
};

export default IdentificationTab;
