import React, { useRef, useEffect, useState } from "react";
import FormSection from "../FormShell/FormSection";

import { ExpandLess, ExpandMore, LockOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Grid,
  Typography,
  Stack,
} from "@mui/material";
import FormField from "../FormShell/FormField";
import { useGuidance } from "../FormShell/GuidanceContext";
import { useParams } from "react-router-dom";

import BilingualTextInput from "../FormComponents/BilingualTextInput";

import regions from "../../regions";

import DOIInput from "../FormComponents/DOIInput";

import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import { metadataScopeCodes } from "../../isoCodeLists";
import CheckBoxList from "../FormComponents/CheckBoxList";
import SharedUsersList from "../FormComponents/SharedUsersList";
import { topicCategories } from "../../utils/themes";
import {
  normalizeResourceType,
  isOnlyOther,
} from "../../utils/normalizeResourceType";

import SelectInput from "../FormComponents/SelectInput";

const { DataCollectionSampling, ...filtereMetadataScopeCodes } =
  metadataScopeCodes;
const StartTab = ({
  disabled,
  record,
  updateRecord,
  handleUpdateRecord,
  userID,
}) => {
  const { language, region } = useParams();
  const regionInfo = regions[region];
  const [showShareRecord, setShowShareRecord] = useState(false);
  const mounted = useRef(false);

  const [topicAccordionExpanded, setTopicAccordionExpanded] = useState(false);
  const { showGuidance } = useGuidance();
  const fr = language === "fr";

  const allTopics = Object.entries(topicCategories).map(([key, cat]) => ({
    key,
    ...cat,
  }));
  const prominentTopics = allTopics.filter((t) => t.prominent);
  const nonProminentTopics = allTopics.filter((t) => !t.prominent);
  const nonProminentKeys = nonProminentTopics.map((t) => t.key);

  const normalizedResourceType = normalizeResourceType(
    record.resourceType || [],
  );
  const hasNonProminentSelected =
    normalizedResourceType.filter((val) => nonProminentKeys.includes(val))
      .length > 0;

  const updateResourceType = (value) => {
    if (isOnlyOther(value)) {
      if (Array.isArray(record.eov)) {
        if (!record.eov.includes("other")) {
          updateRecord("eov")([...record.eov, "other"]);
        }
      } else {
        updateRecord("eov")(["other"]);
      }
    }
    updateRecord("resourceType")(value);
  };

  const handleMetadataScopeChange = () => {
    return (e) => {
      const newEvent = {
        target: { value: metadataScopeCodes[e.target.value]?.isoValue },
      };
      handleUpdateRecord("metadataScopeIso")(newEvent);
      handleUpdateRecord("metadataScope")(e);
    };
  };

  useEffect(() => {
    mounted.current = true;

    if (!record.language) {
      handleUpdateRecord("language")({ target: { value: language } });
    }

    if (!record.metadataScope) {
      handleUpdateRecord("metadataScope")({ target: { value: "Dataset" } });
      handleUpdateRecord("metadataScopeIso")({
        target: { value: metadataScopeCodes.Dataset.isoValue },
      });
    } else if (
      !record.metadataScopeIso &&
      metadataScopeCodes[record.metadataScope]
    ) {
      // Backfill ISO value for records saved before this fix
      handleUpdateRecord("metadataScopeIso")({
        target: { value: metadataScopeCodes[record.metadataScope].isoValue },
      });
    }

    return () => {
      mounted.current = false;
    };
  }, [language]);

  useEffect(() => {
    const isNewRecord = !record.recordID;

    if (userID === record.userID || isNewRecord) {
      setShowShareRecord(true);
    }
  }, [userID, record.userID, record.recordID]);

  const moreTopicsOpen = topicAccordionExpanded || hasNonProminentSelected;

  return (
    <Stack spacing={2}>
      {disabled && (
        <Alert severity="info" icon={<LockOutlined fontSize="inherit" />}>
          <I18n>
            <En>
              This form is locked because it has already been published, or you
              do not have access to edit it.
            </En>
            <Fr>
              Ce formulaire est verrouillé car il a déjà été publié ou vous
              n'avez pas accès pour le modifier.
            </Fr>
          </I18n>
        </Alert>
      )}

      {/* Orientation for first-time providers. Hidden with the rest of the
          guidance once a returning user switches it off. */}
      {showGuidance && (
        <FormSection
          title={<I18n en="Before you start" fr="Avant de commencer" />}
        >
          <Box sx={{ maxWidth: "75ch" }}>
            <Typography variant="body1" sx={{ mb: 1.5 }}>
              <I18n>
                <En>
                  Welcome to the {regionInfo.title.en} Metadata Entry Tool, the
                  first step in making your data discoverable and accessible.
                  This information will be used to create a metadata record for
                  your dataset that will allow it to be searchable through the{" "}
                  {regionInfo.catalogueTitle.en}. The metadata record will help
                  others determine if this dataset is relevant for their work
                  and ensure it is interoperable with other databases and
                  systems.
                </En>
                <Fr>
                  Bienvenue dans le formulaire de saisie de métadonnées
                  {regionInfo.titleFrPossessive &&
                    ` ${regionInfo.titleFrPossessive}`}
                  . Cet outil constitue la première étape du processus de
                  partage de vos données. Les renseignements fournis serviront à
                  créer le profil de métadonnées de votre jeu de données. Ces
                  métadonnées facilitent l’accessibilité et la découvrabilité de
                  vos données via le {regionInfo.catalogueTitle.fr}. Elles
                  rendent également vos jeux de données interopérables avec
                  d’autres systèmes de diffusion.
                </Fr>
              </I18n>
            </Typography>
            <Box
              component="ul"
              sx={{
                pl: 2.5,
                my: 0,
                color: "text.secondary",
                "& li + li": { mt: 0.75 },
                "& b": { color: "text.primary", fontWeight: 600 },
              }}
            >
              <li>
                <I18n>
                  <En>
                    Work through the sections in any order. <b>Save</b> (top
                    right) becomes available once the dataset has a title, and
                    you can come back to finish later.
                  </En>
                  <Fr>
                    Remplissez les sections dans l'ordre de votre choix. Le
                    bouton <b>Enregistrer</b> (en haut à droite) devient
                    disponible dès que le jeu de données a un titre, et vous
                    pouvez revenir terminer plus tard.
                  </Fr>
                </I18n>
              </li>
              <li>
                <I18n>
                  <En>
                    Fields marked <b>Required</b> must be completed before you
                    can submit. The number beside each section shows how many
                    are left.
                  </En>
                  <Fr>
                    Les champs marqués <b>Obligatoire</b> doivent être remplis
                    avant la soumission. Le nombre à côté de chaque section
                    indique combien il en reste.
                  </Fr>
                </I18n>
              </li>
              <li>
                <I18n>
                  <En>
                    Only the title and abstract are required in both English and
                    French. <b>Translate</b> fills in the other language
                    automatically; it is more accurate with more text. Review
                    the result before checking it as verified.
                  </En>
                  <Fr>
                    Seuls le titre et le résumé sont obligatoires dans les deux
                    langues. Le bouton <b>Traduire</b> génère automatiquement
                    l'autre langue; une description exhaustive améliorera la
                    précision. Relisez le résultat avant de le marquer comme
                    vérifié.
                  </Fr>
                </I18n>
              </li>
              <li>
                <I18n>
                  <En>
                    Returning? Switch off <b>Guidance</b> at the top to hide
                    explanations. You can still open them for any field with the
                    ? button.
                  </En>
                  <Fr>
                    Vous connaissez déjà le formulaire? Désactivez <b>Aide</b>{" "}
                    en haut pour masquer les explications. Vous pourrez toujours
                    les afficher pour un champ avec le bouton ?.
                  </Fr>
                </I18n>
              </li>
              <li>
                <I18n
                  en="Questions about the form can be directed to "
                  fr="Les questions concernant le formulaire peuvent être adressées à "
                />
                <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
              </li>
            </Box>
          </Box>
        </FormSection>
      )}

      <FormSection title={<I18n en="The basics" fr="L'essentiel" />}>
        <Stack spacing={4}>
          <FormField
            id="field-title"
            label={<I18n en="Dataset title" fr="Titre du jeu de données" />}
            required
            complete={validateField(record, "title")}
            hint={
              <I18n
                en="What, where and when, in English and French. No acronyms."
                fr="Quoi, où et quand, en français et en anglais. Sans acronymes."
              />
            }
            guidance={
              <I18n>
                <En>
                  <p>
                    Title should be precise enough so that the user will not
                    have to open the dataset to understand its contents. Title
                    should not have acronyms, special characters, or use
                    specialized nomenclature. This will appear as the title that
                    is shown for this dataset in the{" "}
                    {regionInfo.catalogueTitle.en}.
                  </p>
                </En>
                <Fr>
                  <p>
                    Le titre doit être suffisamment précis pour que
                    l'utilisateur n'ait pas à ouvrir le jeu de données pour en
                    comprendre le contenu. Le titre ne doit pas comporter
                    d'acronymes, de caractères spéciaux ou de termes techniques
                    spécifiques à un domaine. Ceci apparaîtra comme titre de
                    votre jeu de données dans le {regionInfo.catalogueTitle.fr}.
                  </p>
                </Fr>
              </I18n>
            }
          >
            <BilingualTextInput
              name="title"
              value={record.title}
              onChange={handleUpdateRecord("title")}
              disabled={disabled}
            />
          </FormField>

          <Grid container columnSpacing={3} rowSpacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                id="field-metadataScope"
                label={<I18n en="Resource type" fr="Type de ressource" />}
                required
                complete={validateField(record, "metadataScope")}
                hint={
                  <I18n
                    en="What kind of resource this record describes."
                    fr="Le type de ressource que décrit cet enregistrement."
                  />
                }
              >
                <SelectInput
                  value={record.metadataScope || ""}
                  onChange={handleMetadataScopeChange()}
                  options={Object.keys(filtereMetadataScopeCodes)}
                  optionLabels={Object.values(filtereMetadataScopeCodes).map(
                    ({ title }) => title[language],
                  )}
                  optionTooltips={Object.values(filtereMetadataScopeCodes).map(
                    ({ text }) => text[language],
                  )}
                  ariaLabel={fr ? "Type de ressource" : "Resource type"}
                  disabled={disabled}
                />
              </FormField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                id="field-language"
                label={<I18n en="Primary language" fr="Langue principale" />}
                required
                complete={validateField(record, "language")}
                hint={
                  <I18n
                    en="The main language of the data itself."
                    fr="La langue principale des données elles-mêmes."
                  />
                }
              >
                <SelectInput
                  value={record.language}
                  onChange={handleUpdateRecord("language")}
                  options={["en", "fr"]}
                  optionLabels={["English", "Français"]}
                  ariaLabel={fr ? "Langue principale" : "Primary language"}
                  disabled={disabled}
                />
              </FormField>
            </Grid>
          </Grid>

          <FormField
            id="field-resourceType"
            label={<I18n en="Topic categories" fr="Catégories thématiques" />}
            required
            complete={Boolean(record.resourceType?.length)}
            hint={
              <I18n
                en="Select one or more ISO topic categories."
                fr="Sélectionnez une ou plusieurs catégories thématiques ISO."
              />
            }
            guidance={
              <I18n
                en="Select one or more ISO topic categories that describe this dataset. Hover over or press and hold a category to see its definition. Less common categories are under “More categories”."
                fr="Sélectionnez une ou plusieurs catégories thématiques ISO qui décrivent ce jeu de données. Survolez une catégorie pour voir sa définition. Les catégories moins courantes se trouvent sous « Plus de catégories »."
              />
            }
          >
            <CheckBoxList
              name="resource-type"
              value={normalizedResourceType}
              labelSize={{ xs: 12, sm: 6, lg: 4 }}
              onChange={(v) => updateResourceType(v)}
              options={prominentTopics.map((t) => t.key)}
              optionLabels={prominentTopics.map((t) => t.title[language])}
              optionTooltips={prominentTopics.map(
                (t) => t.definition[language],
              )}
              disabled={disabled}
            />
            <Button
              variant="text"
              size="small"
              onClick={() => setTopicAccordionExpanded((o) => !o)}
              disabled={hasNonProminentSelected}
              aria-expanded={moreTopicsOpen}
              aria-controls="more-topic-categories"
              endIcon={moreTopicsOpen ? <ExpandLess /> : <ExpandMore />}
              sx={{ mt: 0.5, ml: -1 }}
            >
              {moreTopicsOpen
                ? fr
                  ? "Moins de catégories"
                  : "Fewer categories"
                : fr
                  ? `Plus de catégories (${nonProminentTopics.length})`
                  : `More categories (${nonProminentTopics.length})`}
            </Button>
            <Collapse in={moreTopicsOpen} id="more-topic-categories">
              <Box sx={{ pt: 1 }}>
                <CheckBoxList
                  name="resource-type"
                  value={normalizedResourceType}
                  labelSize={{ xs: 12, sm: 6, lg: 4 }}
                  onChange={(v) => updateResourceType(v)}
                  options={nonProminentTopics.map((t) => t.key)}
                  optionLabels={nonProminentTopics.map(
                    (t) => t.title[language],
                  )}
                  optionTooltips={nonProminentTopics.map(
                    (t) => t.definition[language],
                  )}
                  disabled={disabled}
                />
              </Box>
            </Collapse>
          </FormField>
        </Stack>
      </FormSection>

      <div id="field-datasetIdentifier">
        <DOIInput
          record={record}
          handleUpdateDatasetIdentifier={handleUpdateRecord(
            "datasetIdentifier",
          )}
          handleUpdateDoiCreationStatus={handleUpdateRecord(
            "doiCreationStatus",
          )}
          disabled={disabled}
        />
      </div>

      {showShareRecord && <SharedUsersList region={region} record={record} />}
    </Stack>
  );
};

export default StartTab;
