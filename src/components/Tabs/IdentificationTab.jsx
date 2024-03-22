import React, { useContext, useState, useEffect, useRef } from "react";
import {
  Paper,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Button,
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useDebounce } from "use-debounce";
import { useParams } from "react-router-dom";
import { OpenInNew, Update } from "@material-ui/icons";
import { En, Fr, I18n } from "../I18n";
import { progressCodes } from "../../isoCodeLists";
import { eovs, eovCategories } from "../../eovs";

import firebase from "../../firebase";
import BilingualTextInput from "../FormComponents/BilingualTextInput";
import CheckBoxList from "../FormComponents/CheckBoxList";
import DateInput from "../FormComponents/DateInput";
import KeywordsInput from "../FormComponents/KeywordsInput";
import RequiredMark from "../FormComponents/RequiredMark";
import SelectInput from "../FormComponents/SelectInput";
import licenses from "../../utils/licenses";
import { validateField, validateDOI } from "../../utils/validate";
import { getDatacitePrefix, getAuthHash } from "../../utils/firebaseEnableDoiCreation";

import {
  QuestionText,
  SupplementalText,
  paperClass,
} from "../FormComponents/QuestionStyles";

import regions from "../../regions";
import { UserContext } from "../../providers/UserProvider";

const IdentificationTab = ({
  disabled,
  record,
  handleUpdateRecord,
  updateRecord,
  projects,
}) => {
  const { createDraftDoi, updateDraftDoi, deleteDraftDoi, getDoiStatus, recordToDataCite } = useContext(UserContext);
  const { language, region, userID } = useParams();
  const regionInfo = regions[region];
  const doiIsValid =validateDOI(record.datasetIdentifier)
  
  const languageUpperCase = language.toUpperCase();
  const [doiGenerated, setDoiGenerated] = useState(false);
  const [doiErrorFlag, setDoiErrorFlag] = useState(false);
  const [debouncedDoiIdValue] = useDebounce(record.datasetIdentifier, 1000);
  const [loadingDoi, setLoadingDoi] = useState(false);
  const [loadingDoiUpdate, setLoadingDoiUpdate] = useState(false);
  const [loadingDoiDelete, setLoadingDoiDelete] = useState(false);
  const [doiUpdateFlag, setDoiUpdateFlag] = useState(false);
  const [datacitePrefix, setDatacitePrefix] = useState('');
  const [loadingPrefix, setLoadingPrefix] = useState(true);
  const [dataciteAuthHash, setDataciteAuthHash] = useState('');
  const [loadingAuthHash, setLoadingAuthHash] = useState(true);

  const generateDoiDisabled = doiGenerated || loadingDoi || (record.doiCreationStatus !== "" || record.recordID === "");
  const showGenerateDoi = !loadingPrefix && Boolean(datacitePrefix);
  const showDoiStatus = doiIsValid && !loadingPrefix && datacitePrefix && record.doiCreationStatus && record.doiCreationStatus !== ""
  const showUpdateDoi = doiIsValid && !loadingPrefix && datacitePrefix && record.doiCreationStatus !== "" && record.datasetIdentifier.includes(datacitePrefix);
  const showDeleteDoi = doiIsValid && !loadingPrefix && datacitePrefix && record.doiCreationStatus !== "" && !doiErrorFlag && record.datasetIdentifier.includes(datacitePrefix);
  const mounted = useRef(false);

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

  async function handleGenerateDOI() {
    setLoadingDoi(true);

    try {
      const mappedDataCiteObject = await recordToDataCite({metadata: record, language, regions, region, licenses});
      if(!loadingAuthHash && dataciteAuthHash) {

        await createDraftDoi({
          record: mappedDataCiteObject, 
          region,
        })
        .then((response) => {
          return response.data.data.attributes;
        })
        .then(async (attributes) => {
          // Update the record object with datasetIdentifier and doiCreationStatus
          updateRecord("datasetIdentifier")(`https://doi.org/${attributes.doi}`);
          updateRecord("doiCreationStatus")("draft");

          // Create a new object with updated properties
          const updatedRecord = {
            ...record,
            datasetIdentifier: `https://doi.org/${attributes.doi}`,
            doiCreationStatus: "draft",
          };

          // Save the updated record to the Firebase database
          const recordsRef = firebase
            .database()
            .ref(region)
            .child("users")
            .child(userID)
            .child("records");

          if (record.recordID) {
            await recordsRef
              .child(record.recordID)
              .update({ datasetIdentifier: updatedRecord.datasetIdentifier, doiCreationStatus: updatedRecord.doiCreationStatus });
          }

          setDoiGenerated(true);
        })
        .finally(() => {
          setLoadingDoi(false);
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error in handleGenerateDOI:", err);
      setDoiErrorFlag(true);
      throw err;
    } 
  }

  async function handleUpdateDraftDOI() {
    setLoadingDoiUpdate(true);

    try {
      const mappedDataCiteObject = await recordToDataCite({metadata: record, language, regions, region, licenses});
      delete mappedDataCiteObject.data.type;
      delete mappedDataCiteObject.data.attributes.prefix;

      // Extract DOI from the full URL
      const doi = record.datasetIdentifier.replace('https://doi.org/', '');

      const dataObject = {
        doi,
        data: mappedDataCiteObject,
        region,
      }

      const response = await updateDraftDoi( dataObject );
      const statusCode = response.data.status;

      if (statusCode === 200) {
        setDoiUpdateFlag(true);
      } else {
        setDoiErrorFlag(true);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error updating draft DOI: ', err);
      setDoiErrorFlag(true);
      throw err;
    } finally {
      setLoadingDoiUpdate(false);
    }
  }

  async function handleDeleteDOI() {
    setLoadingDoiDelete(true);

    try {
      // Extract DOI from the full URL
      const doi = record.datasetIdentifier.replace('https://doi.org/', '');

      deleteDraftDoi({doi, region})
        .then((response) => response.data)
        .then(async (statusCode) => {
          if (statusCode === 204) {
            // Update the record object with datasetIdentifier and doiCreationStatus
            updateRecord("datasetIdentifier")("");
            updateRecord("doiCreationStatus")("");

            // Create a new object with updated properties
            const updatedRecord = {
              ...record,
              datasetIdentifier: "",
              doiCreationStatus: "",
            };

            // Save the updated record to the Firebase database
            const recordsRef = firebase
              .database()
              .ref(region)
              .child("users")
              .child(userID)
              .child("records");

            if (record.recordID) {
              await recordsRef
                .child(record.recordID)
                .update({ datasetIdentifier: updatedRecord.datasetIdentifier, doiCreationStatus: updatedRecord.doiCreationStatus });
            }

            setDoiGenerated(false);
          } else {
            setDoiErrorFlag(true);
          }
        })
        .finally(() => {
          setLoadingDoiDelete(false);
        });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setDoiErrorFlag(true);
      throw err;
    }
  }

  // Fetch Datacite Prefix when component mounts or region changes
  useEffect(() => {
    const fetchPrefix = async () => {
      setLoadingPrefix(true);
      const prefix = await getDatacitePrefix(region);
      setDatacitePrefix(prefix);
      setLoadingPrefix(false);
    };

    const fetchAuthHash = async () => {
      setLoadingAuthHash(true);
      const authHash = await getAuthHash(region);
      setDataciteAuthHash(authHash);
      setLoadingAuthHash(false);
    };

    fetchPrefix();
    fetchAuthHash();
  }, [region]);

  useEffect(() => {
    mounted.current = true;
    if (debouncedDoiIdValue === '') {
      updateRecord("doiCreationStatus")('')
    }
    else if (debouncedDoiIdValue && !loadingPrefix && datacitePrefix && doiIsValid && !loadingAuthHash && dataciteAuthHash) {
      let id = debouncedDoiIdValue
      if (debouncedDoiIdValue.includes('doi.org/')) {
        id = debouncedDoiIdValue.split('doi.org/').pop();
      }
      getDoiStatus({ doi: id })
        .then(response => {
          updateRecord("doiCreationStatus")(response.data)
        })
        .catch(err => {
          console.error(err)
        });
    }

    return () => {
      mounted.current = false;
    };
  }, [debouncedDoiIdValue, getDoiStatus, doiIsValid, updateRecord, datacitePrefix, loadingPrefix, dataciteAuthHash, loadingAuthHash])

  return (
    <div>
      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What is the dataset title? Required in English and French.</En>
            <Fr>
              Quel est le titre du jeu de données? Obligatoire dans les deux
              langues.
            </Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "title")} />
          <SupplementalText>
            <I18n>
              <En>
                <p>Recommended title includes: What, Where, When.</p>
                <p>
                  Title should be precise enough so that the user will not have
                  to open the dataset to understand its contents. Title should
                  not have acronyms, special characters, or use specialized
                  nomenclature. This will appear as the title that is shown for
                  this dataset in the {regionInfo.catalogueTitle.en}.
                </p>
              </En>
              <Fr>
                <p>Le titre recommandé comprend : Quoi, Où, Quand.</p>
                <p>
                  Le titre doit être suffisamment précis pour que l'utilisateur
                  n'ait pas à ouvrir le ensemble de données pour comprendre son
                  contenu. Le titre ne doit pas avoir des acronymes, des
                  caractères spéciaux ou utiliser une nomenclature spécialisée.
                  Ceci apparaîtra comme titre de votre jeu de données dans le{" "}
                  {regionInfo.catalogueTitle.fr}.
                </p>
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>

        <BilingualTextInput
          name="title"
          value={record.title}
          onChange={handleUpdateRecord("title")}
          disabled={disabled}
        />
      </Paper>

      <Paper style={paperClass}>
        <QuestionText>
          <I18n>
            <En>What is the primary language of the dataset?</En>
            <Fr>Quelle est la langue principale du jeu de données?</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "language")} />
        </QuestionText>
        <SelectInput
          value={record.language}
          onChange={handleUpdateRecord("language")}
          options={["en", "fr"]}
          optionLabels={["English", "Français"]}
          disabled={disabled}
        />
      </Paper>

      {projects.length ? (
        <Paper style={paperClass}>
          <QuestionText>
            <I18n>
              <En>
                What are the projects that this record is part of? To add a
                project, email{" "}
              </En>
              <Fr>
                Quels sont les projets dont ce disque fait partie? Pour ajouter
                un projet, e-mail{" "}
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
              la définition complète du Système d’Observatoire Global des Océans
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
      </Paper>
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
            <En>What is the DOI for this dataset? Eg,</En>
            <Fr>Quel est le DOI de ce jeu de données ? Par exemple,</Fr>
          </I18n>{" "}
          https://doi.org/10.0000/0000
          {showGenerateDoi && (
            <SupplementalText>
              <I18n>
                <En>
                  <p>Please save the form before generating a draft DOI.</p>
                </En>
                <Fr>
                  <p>
                    Veuillez enregistrer le formulaire avant de générer un
                    brouillon de DOI.
                  </p>
                </Fr>
              </I18n>
            </SupplementalText>
          )}
        </QuestionText>
        {showGenerateDoi && (
          <Button
            onClick={handleGenerateDOI}
            disabled={generateDoiDisabled}
            style={{ display: "inline" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {loadingDoi ? (
                <>
                  <CircularProgress size={24} style={{ marginRight: "8px" }} />
                  Loading...
                </>
              ) : (
                "Generate DOI"
              )}
            </div>
          </Button>
        )}
        {showUpdateDoi && (
          <Button
            onClick={handleUpdateDraftDOI}
            disabled={['not found', 'unknown'].includes(record.doiCreationStatus)}
            style={{ display: 'inline' }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {loadingDoiUpdate ? (
                <>
                  <CircularProgress size={24} style={{ marginRight: "8px" }} />
                  Loading...
                </>
              ) : (
                "Update DOI"
              )}
            </div>
          </Button>
        )}
        {showDeleteDoi && (
          <Button
            onClick={handleDeleteDOI}
            disabled={record.doiCreationStatus !== 'draft'}
            style={{ display: "inline" }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {loadingDoiDelete ? (
                <>
                  <CircularProgress size={24} style={{ marginRight: "8px" }} />
                  Loading...
                </>
              ) : (
                "Delete DOI"
              )}
            </div>
          </Button>
        )} 

        {doiErrorFlag && (
          <span>
            <I18n
              en="Error occurred with DOI API"
              fr="Une erreur s'est produite avec l'API DOI"
            />
          </span>
        )}
        {doiUpdateFlag && (
          <span>
            <I18n en="DOI has been updated" fr="Le DOI a été mis à jour" />
          </span>
        )}

        <TextField
          style={{ marginTop: "10px" }}
          name="datasetIdentifier"
          helperText={
            (doiIsValid ? "" : <I18n en="Invalid DOI" fr="DOI non valide" />)
            || (showDoiStatus && <I18n en={`DOI Status: ${record.doiCreationStatus}`} fr={`Statut DOI: ${record.doiCreationStatus}`} />)
          }
          error={!doiIsValid}
          value={record.datasetIdentifier}
          onChange={handleUpdateRecord("datasetIdentifier")}
          disabled={disabled}
          fullWidth
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
