import React, { useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { OpenInNew, Search, Update, Warning } from "@mui/icons-material";
import FormSection from "../FormShell/FormSection";
import FormField from "../FormShell/FormField";
import { En, Fr, I18n } from "../I18n";
import { progressCodes } from "../../isoCodeLists";
import { eovs, eovCategories } from "../../eovs";
import { isOnlyOther } from "../../utils/normalizeResourceType";

import BilingualTextInput from "../FormComponents/BilingualTextInput";
import CheckBoxList from "../FormComponents/CheckBoxList";
import DateInput from "../FormComponents/DateInput";
import KeywordsInput from "../FormComponents/KeywordsInput";
import SelectInput from "../FormComponents/SelectInput";
import licenses from "../../utils/licenses";
import { validateField } from "../../utils/validate";

import regions from "../../regions";

const twoUp = { xs: 12, sm: 6 };

const IdentificationTab = ({
  disabled,
  record,
  handleUpdateRecord,
  updateRecord,
  projects,
}) => {
  const { language, region } = useParams();
  const regionInfo = regions[region];
  const fr = language === "fr";
  const [eovFilter, setEovFilter] = useState("");

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

  const licensesSorted = Object.values(licenses).sort((a, b) =>
    (a.title[language] || a.title.en).localeCompare(
      b.title[language] || b.title.en,
      language,
    ),
  );

  const selectedEovs = record.eov || [];
  const selectedLicence = licensesSorted.find((l) => l.code === record.license);
  const filterText = eovFilter.trim().toLowerCase();

  return (
    <Stack spacing={2}>
      {/* ── Description ─────────────────────────────────────────────── */}
      <FormSection title={<I18n en="Description" fr="Description" />}>
        <Stack spacing={4}>
          {projects.length > 0 && (
            <FormField
              label={<I18n en="Projects" fr="Projets" />}
              guidance={
                <I18n>
                  <En>
                    Select the projects this record is part of. To add a
                    project, contact{" "}
                    <a href={`mailto:${regionInfo.email}`}>
                      {regionInfo.email}
                    </a>
                    .
                  </En>
                  <Fr>
                    Si cet enregistrement fait partie d'un des projet
                    ci-dessous, sélectionnez le ou les projets.
                  </Fr>
                </I18n>
              }
            >
              <CheckBoxList
                value={record.projects || []}
                labelSize={twoUp}
                onChange={updateRecord("projects")}
                options={projects}
                optionLabels={projects}
                disabled={disabled}
              />
            </FormField>
          )}

          <FormField
            id="field-abstract"
            label={<I18n en="Abstract" fr="Résumé" />}
            required
            complete={validateField(record, "abstract")}
            hint={
              <I18n
                en="Plain-language summary, in English and French. 500 words maximum."
                fr="Résumé en langage clair, en français et en anglais. 500 mots maximum."
              />
            }
            guidance={
              <I18n>
                <En>
                  <p>
                    This information will appear as the summary text that is
                    shown for this dataset in the {regionInfo.catalogueTitle.en}
                    . Browsing datasets at <CatalogueLink lang="en" /> can help
                    provide a sense of the type of descriptions that are
                    typically used for this section of the record. As a general
                    rule, this section should be worded with as little jargon as
                    possible to give potential users an understanding of your
                    dataset. For detailed methods please submit supplemental
                    materials with your data.
                  </p>
                  <p>Suggested abstract points:</p>
                  <ul>
                    <li>
                      <b>What</b>: variables that were measured
                    </li>
                    <li>
                      <b>When</b>: temporal coverage of the data, frequency of
                      the measurements/observations
                    </li>
                    <li>
                      <b>Where</b>: spatial coverage of the data, sampling
                      sites, sensor tracks, laboratory spaces
                    </li>
                    <li>
                      <b>Why</b>: a high level statement on the outcome this
                      data is meant to inform
                    </li>
                  </ul>
                </En>
                <Fr>
                  <p>
                    La description de votre jeu de données sera utilisée comme
                    résumé dans le {regionInfo.catalogueTitle.fr}. Pour vous
                    aider à rédiger ce résumé, vous pouvez vous inspirer
                    d’autres jeux de données déjà publiés dans le catalogue{" "}
                    <CatalogueLink lang="fr" />. Veuillez à ce qu'elle soit
                    compréhensible par tout type d’utilisateur, rédigée dans un
                    langage clair et accessible. Limitez l’utilisation de termes
                    techniques ou de jargon.
                  </p>
                  <p>Suggestion de points à aborder dans votre résumé :</p>
                  <ul>
                    <li>
                      <b>Quoi</b> : Les variables qui ont été mesurées
                    </li>
                    <li>
                      <b>Quand</b> : Couverture temporelle de la donnée,
                      fréquence de la mesure/observation
                    </li>
                    <li>
                      <b>Où</b> : Couverture spatiale de la donnée, nom/lieu des
                      sites d’échantillonnages, déplacement d’un capteur,
                      laboratoire, etc.
                    </li>
                    <li>
                      <b>Comment</b> : Équipement, procédures, protocoles,
                      calibration, assurance/contrôle de la qualité
                    </li>
                    <li>
                      <b>Qui</b> : Participants, membres du personnel
                    </li>
                    <li>
                      <b>Pourquoi</b> : Quelques lignes pour décrire le contexte
                      dans lequel les données ont été échantillonnées et comment
                      elles permettent de répondre à la problématique (p. ex:
                      quelles informations peuvent-elles apporter)
                    </li>
                  </ul>
                </Fr>
              </I18n>
            }
          >
            <BilingualTextInput
              name="abstract"
              value={record.abstract}
              onChange={handleUpdateRecord("abstract")}
              disabled={disabled}
              multiline
            />
          </FormField>
        </Stack>
      </FormSection>

      {/* ── Subject ─────────────────────────────────────────────────── */}
      <FormSection title={<I18n en="Subject" fr="Sujet" />}>
        <Stack spacing={4}>
          {(!record.resourceType || !isOnlyOther(record.resourceType)) && (
            <FormField
              id="field-eov"
              label={
                <I18n
                  en="Essential ocean variables"
                  fr="Variables océaniques essentielles"
                />
              }
              required
              complete={validateField(record, "eov")}
              hint={
                <I18n
                  en="Select every variable in the dataset. If none apply, select Other."
                  fr="Sélectionnez toutes les variables du jeu de données. Si aucune ne s'applique, sélectionnez « Autre »."
                />
              }
              guidance={
                <I18n>
                  <En>
                    Please select all the essential ocean variables that are
                    contained in this dataset. Hover over or press and hold a
                    variable to see its definition, or open the full GOOS
                    definition with the <OpenInNew fontSize="inherit" /> button.
                  </En>
                  <Fr>
                    Veuillez sélectionner toutes les variables océaniques
                    essentielles contenues dans ce jeu de données. Survolez une
                    variable pour afficher sa définition ou cliquez sur l’icône{" "}
                    <OpenInNew fontSize="inherit" /> pour accéder à la
                    définition complète issue du Global Ocean Observing System
                    (GOOS).
                  </Fr>
                </I18n>
              }
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ mb: 1.5 }}
              >
                <TextField
                  size="small"
                  value={eovFilter}
                  onChange={(e) => setEovFilter(e.target.value)}
                  placeholder={
                    fr ? "Filtrer les variables" : "Filter variables"
                  }
                  inputProps={{
                    "aria-label": fr
                      ? "Filtrer les variables"
                      : "Filter variables",
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 280 } }}
                />
                <Typography
                  variant="body2"
                  role="status"
                  sx={{
                    color: "text.secondary",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fr
                    ? `${selectedEovs.length} sélectionnée${selectedEovs.length > 1 ? "s" : ""}`
                    : `${selectedEovs.length} selected`}
                </Typography>
              </Stack>
              <Stack spacing={2}>
                {Object.entries(eovCategories).map(
                  ([categoryKey, categoryText]) => {
                    const eovsFiltered = eovs
                      .filter((e) => e.category === categoryKey)
                      .filter(
                        (e) => !e.deprecated || selectedEovs.includes(e.value),
                      )
                      .filter(
                        (e) =>
                          !filterText ||
                          e[`label ${languageUpperCase}`]
                            .toLowerCase()
                            .includes(filterText),
                      )
                      .sort((a, b) =>
                        a[`label ${languageUpperCase}`].localeCompare(
                          b[`label ${languageUpperCase}`],
                          language,
                        ),
                      );
                    if (!eovsFiltered.length) return null;

                    return (
                      <Box key={categoryKey}>
                        <Typography
                          component="h4"
                          variant="subtitle2"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            mb: 0.25,
                          }}
                        >
                          {categoryText[language]}
                        </Typography>
                        <CheckBoxList
                          value={selectedEovs}
                          labelSize={{ xs: 12, sm: 6, lg: 4 }}
                          onChange={updateRecord("eov")}
                          options={eovsFiltered.map((e) => e.value)}
                          optionLabels={eovsFiltered.map((e) => (
                            <>
                              <Tooltip
                                title={e[`definition ${languageUpperCase}`]}
                              >
                                <Box
                                  component="span"
                                  sx={
                                    e.deprecated
                                      ? {
                                          textDecoration: "line-through",
                                          color: "text.secondary",
                                        }
                                      : undefined
                                  }
                                >
                                  {e[`label ${languageUpperCase}`]}
                                </Box>
                              </Tooltip>
                              {e.url && (
                                <Tooltip
                                  title={
                                    <I18n
                                      en="Open GOOS definition in new window"
                                      fr="Ouvrir la définition GOOS dans une nouvelle fenêtre"
                                    />
                                  }
                                >
                                  <IconButton
                                    size="small"
                                    aria-label={
                                      fr
                                        ? "Ouvrir la définition GOOS dans une nouvelle fenêtre"
                                        : "Open GOOS definition in new window"
                                    }
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      const win = window.open(e.url, "_blank");
                                      win?.focus();
                                    }}
                                    sx={{ color: "text.secondary", ml: 0.25 }}
                                  >
                                    <OpenInNew sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {e.emerging && (
                                <Tooltip
                                  title={
                                    <I18n
                                      en="GOOS emerging EOV"
                                      fr="EOV émergent GOOS"
                                    />
                                  }
                                >
                                  <Update
                                    aria-label={
                                      fr
                                        ? "EOV émergent GOOS"
                                        : "GOOS emerging EOV"
                                    }
                                    sx={{
                                      fontSize: 16,
                                      color: "text.secondary",
                                      verticalAlign: "-3px",
                                      ml: 0.5,
                                    }}
                                  />
                                </Tooltip>
                              )}
                              {e.deprecated &&
                                (() => {
                                  const replacements = (e.replacedBy || [])
                                    .map((v) => eovs.find((x) => x.value === v))
                                    .filter(Boolean);
                                  const replacementLabelsEn = replacements
                                    .map((r) => r["label EN"])
                                    .join(", ");
                                  const replacementLabelsFr = replacements
                                    .map((r) => r["label FR"])
                                    .join(", ");
                                  return (
                                    <Tooltip
                                      title={
                                        <I18n
                                          en={`This EOV is deprecated and cannot be submitted. Please unselect it${
                                            replacementLabelsEn
                                              ? ` and use ${replacementLabelsEn} instead`
                                              : ""
                                          }.`}
                                          fr={`Cet EOV est déprécié et ne peut pas être soumis. Veuillez le désélectionner${
                                            replacementLabelsFr
                                              ? ` et utiliser ${replacementLabelsFr} à la place`
                                              : ""
                                          }.`}
                                        />
                                      }
                                    >
                                      <Warning
                                        color="warning"
                                        aria-label={
                                          fr ? "EOV déprécié" : "Deprecated EOV"
                                        }
                                        sx={{
                                          fontSize: 18,
                                          verticalAlign: "-4px",
                                          ml: 0.5,
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                })()}
                            </>
                          ))}
                          disabled={disabled}
                        />
                      </Box>
                    );
                  },
                )}
              </Stack>
            </FormField>
          )}

          <FormField
            id="field-keywords"
            label={<I18n en="Keywords" fr="Mots-clés" />}
            required
            complete={validateField(record, "keywords")}
            hint={
              <I18n
                en="Include the nearest community or place name and body of water."
                fr="Incluez le nom de la communauté ou du lieu le plus proche et du plan d'eau."
              />
            }
            guidance={
              <I18n>
                <En>
                  <p>
                    Choose the most specific keywords that apply to your data,
                    or create your own. Keywords are an important way to
                    categorize your data that allow people and other systems to
                    search for datasets that share some important
                    characteristics.
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
                    Choisissez des mots-clés spécifiques qui s’appliquent à vos
                    données ou créez-en des nouveaux. Les mots-clés sont un
                    moyen efficace de catégoriser vos données pour permettre aux
                    publics ou à d'autres systèmes informatiques d’accéder à
                    tous les jeux de données associés à des thèmes ou concepts
                    similaires.
                  </p>
                  <p>
                    Vous pouvez choisir un mot-clé prédéfini (liste déroulante)
                    en français puis cliquer sur le bouton de traduction. Vous
                    pouvez aussi créer votre propre mot-clé en rédigeant un
                    texte libre en anglais ou en français (vérifiez toujours si
                    son équivalent existe dans la liste déroulante afin de
                    diminuer le risque d’écriture multiple d’un même mot-clé
                    -ex: phoque Vs Phoques-).
                  </p>
                  <p>
                    Entrez un mot-clé à la fois. Cliquez sur « Ajouter » chaque
                    mot saisi.
                  </p>
                </Fr>
              </I18n>
            }
          >
            <KeywordsInput
              value={record.keywords}
              onChange={handleUpdateRecord("keywords")}
              disabled={disabled}
            />
          </FormField>
        </Stack>
      </FormSection>

      {/* ── Status and dates ────────────────────────────────────────── */}
      <FormSection title={<I18n en="Status and dates" fr="État et dates" />}>
        <Grid container columnSpacing={3} rowSpacing={3}>
          <Grid size={twoUp}>
            <FormField
              id="field-progress"
              label={<I18n en="Status" fr="État" />}
              hint={
                <I18n
                  en="Is data still being collected?"
                  fr="Les données sont-elles encore collectées ?"
                />
              }
              required
              complete={validateField(record, "progress")}
              guidance={
                <>
                  {Object.values(progressCodes).map(({ title, text }) => (
                    <p key={title[language]}>
                      <b>{title[language]}</b> : {text[language]}
                    </p>
                  ))}
                </>
              }
            >
              <SelectInput
                value={record.progress || ""}
                onChange={handleUpdateRecord("progress")}
                options={Object.keys(progressCodes)}
                optionLabels={Object.values(progressCodes).map(
                  ({ title }) => title[language],
                )}
                ariaLabel={fr ? "État" : "Status"}
                disabled={disabled}
              />
            </FormField>
          </Grid>
          <Grid size={twoUp}>
            <FormField
              id="field-edition"
              label={<I18n en="Version" fr="Version" />}
              hint={<I18n en="For example, 1.1" fr="Par exemple, 1.1" />}
              guidance={
                <I18n
                  en="The version number of this dataset."
                  fr="Le numéro de version de cet ensemble de données."
                />
              }
            >
              <TextField
                value={record.edition}
                onChange={handleUpdateRecord("edition")}
                disabled={disabled}
                inputProps={{ "aria-label": "Version" }}
                fullWidth
              />
            </FormField>
          </Grid>
          <Grid size={twoUp}>
            <FormField
              id="field-dateStart"
              label={
                <I18n en="Collection start date" fr="Début de la collecte" />
              }
              hint={
                <I18n
                  en="When data was first collected."
                  fr="Date des premières données collectées."
                />
              }
              guidance={
                <I18n
                  en="What is the start date when data was first collected?"
                  fr="Inscrivez la date de début de votre collecte de données."
                />
              }
            >
              <DateInput
                hideLabel
                label={fr ? "Début de la collecte" : "Collection start date"}
                value={record.dateStart || null}
                onChange={handleUpdateRecord("dateStart")}
                disabled={disabled}
                dateEnd={record.dateEnd || undefined}
              />
            </FormField>
          </Grid>
          <Grid size={twoUp}>
            <FormField
              id="field-dateEnd"
              label={<I18n en="Collection end date" fr="Fin de la collecte" />}
              hint={
                <I18n
                  en="Leave blank if collection is ongoing."
                  fr="Laissez vide si la collecte est en cours."
                />
              }
              guidance={
                <I18n
                  en="What is the end date when data was last collected?"
                  fr="Inscrivez la date de fin de votre collecte de données."
                />
              }
            >
              <DateInput
                hideLabel
                label={fr ? "Fin de la collecte" : "Collection end date"}
                value={record.dateEnd || null}
                onChange={handleUpdateRecord("dateEnd")}
                disabled={disabled}
                dateStart={record.dateStart || undefined}
              />
            </FormField>
          </Grid>
          <Grid size={twoUp}>
            <FormField
              id="field-datePublished"
              label={<I18n en="Publication date" fr="Date de publication" />}
              hint={
                <I18n
                  en="Leave blank if the data hasn't been published."
                  fr="Laissez vide si les données n'ont pas été publiées."
                />
              }
              guidance={
                <I18n
                  en="What is the date when the data was published?"
                  fr="Quelle est la date de première publication des données ?"
                />
              }
            >
              <DateInput
                hideLabel
                label={fr ? "Date de publication" : "Publication date"}
                name="datePublished"
                value={record.datePublished || null}
                onChange={handleUpdateRecord("datePublished")}
                disabled={disabled}
              />
            </FormField>
          </Grid>
          <Grid size={twoUp}>
            <FormField
              id="field-dateRevised"
              label={<I18n en="Revision date" fr="Date de révision" />}
              hint={
                <I18n
                  en="Only for a new version of the data, not metadata edits."
                  fr="Seulement pour une nouvelle version des données, pas des métadonnées."
                />
              }
              guidance={
                <I18n>
                  <En>
                    What is the date when data was revised? Leave blank if
                    dataset hasn't been revised. This field does not need to be
                    populated or updated when revisions are made to the
                    metadata, but rather when a new version of the data file or
                    package becomes available, i.e. for time-series data.
                  </En>
                  <Fr>
                    Quelle est la date de la dernière révision des données ?
                    Laissez le champ vide si le jeu de données n'a pas été
                    révisé. Ce champ n'a pas besoin d'être rempli ou mis à jour
                    lorsque des révisions sont apportées aux métadonnées, mais
                    plutôt lorsqu'une nouvelle version du fichier ou du jeu de
                    données devient disponible, c'est-à-dire pour les données de
                    séries temporelles.
                  </Fr>
                </I18n>
              }
            >
              <DateInput
                hideLabel
                label={fr ? "Date de révision" : "Revision date"}
                name="dateRevised"
                value={record.dateRevised || null}
                onChange={handleUpdateRecord("dateRevised")}
                disabled={disabled}
              />
            </FormField>
          </Grid>
        </Grid>
      </FormSection>

      {/* ── Licence and use ─────────────────────────────────────────── */}
      <FormSection
        title={<I18n en="Licence and use" fr="Licence et utilisation" />}
      >
        <Stack spacing={4}>
          <FormField
            id="field-license"
            label={<I18n en="Licence" fr="Licence" />}
            required
            complete={validateField(record, "license")}
            hint={
              <>
                <I18n
                  en="CIOOS recommends CC-BY 4.0."
                  fr="Le SIOOC recommande CC-BY 4.0."
                />
                {selectedLicence?.url && (
                  <>
                    {" "}
                    <Link
                      href={selectedLicence.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      <I18n
                        en="Read the selected licence"
                        fr="Lire la licence choisie"
                      />
                      <OpenInNew
                        aria-label={
                          fr ? "(nouvelle fenêtre)" : "(opens in new window)"
                        }
                        sx={{ fontSize: 14, ml: 0.25, verticalAlign: "-2px" }}
                      />
                    </Link>
                  </>
                )}
              </>
            }
            guidance={
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
                      - CIOOS recommended. Allows for open sharing and
                      adaptation of the data provided that the original creator
                      is attributed.
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
                      departments and agencies, it is very similar to CC-BY as
                      it allows for open sharing and adaptation of the data,
                      provided that the original creator of the data is properly
                      attributed.
                    </li>
                  </ul>
                </En>
                <Fr>
                  <ul>
                    <li>
                      <b>
                        Licence internationale Creative Commons Attribution 4.0
                        (CC-BY 4.0)
                      </b>{" "}
                      - Licence recommandée par le SIOOC. Les données sont
                      ouvertes, mais la licence exige que le jeu de données soit
                      cité lorsqu’il est utilisé par quiconque.
                    </li>
                    <li>
                      <b>Creative Commons 0</b> - N’impose aucune restriction
                      particulière : le jeu de données peut être utilisé sans
                      être cité.
                    </li>
                    <li>
                      <b>Licence du gouvernement ouvert - Canada</b> - Pour les
                      jeux de données rendus disponibles par les entités
                      fédérales. Cette licence est similaire à CC-BY 4.0 : les
                      données sont ouvertes mais le jeu de données doit être
                      cité lorsqu'il est utilisé par quiconque.
                    </li>
                  </ul>
                </Fr>
              </I18n>
            }
          >
            <SelectInput
              value={record.license}
              onChange={handleUpdateRecord("license")}
              ariaLabel={fr ? "Licence" : "Licence"}
              optionLabels={licensesSorted.map(
                (l) => l.title[language] || l.title.en,
              )}
              options={licensesSorted.map((l) => l.code)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            id="field-limitations"
            label={<I18n en="Limitations" fr="Limitations" />}
            hint={
              <I18n
                en="Anything that affects how the data can be used."
                fr="Tout ce qui limite l'utilisation des données."
              />
            }
            guidance={
              <I18n>
                <En>
                  What are the limitations affecting the dataset? For example:
                  <ul>
                    <li>Not to be used for navigational purposes.</li>
                    <li>Instrument was not calibrated on day.</li>
                    <li>Haven’t applied appropriate QC on the data yet.</li>
                  </ul>
                </En>
                <Fr>
                  Quelles sont les limitations affectant le jeu de données? Par
                  exemple :
                  <ul>
                    <li>Ne pas utiliser à des fins de navigation.</li>
                    <li>L' instrument n'a pas été étalonné.</li>
                    <li>
                      Un contrôle de qualité n’a pas été effectué sur les
                      données.
                    </li>
                  </ul>
                </Fr>
              </I18n>
            }
          >
            <BilingualTextInput
              name="limitations"
              value={record.limitations}
              onChange={handleUpdateRecord("limitations")}
              multiline
              disabled={disabled}
            />
          </FormField>
        </Stack>
      </FormSection>
    </Stack>
  );
};

export default IdentificationTab;
