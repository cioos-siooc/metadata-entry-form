import React, { useRef, useEffect, useState } from "react";

import { Save } from "@material-ui/icons";
import {
  Typography,
  Paper,
  Grid,
  FormControl,
} from "@material-ui/core";
import { useParams } from "react-router-dom";

import BilingualTextInput from "../FormComponents/BilingualTextInput";

import regions from "../../regions";

import DOIInput from "../FormComponents/DOIInput";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { paperClass, QuestionText, SupplementalText } from "../FormComponents/QuestionStyles";
import { validateField } from "../../utils/validate";
import { metadataScopeCodes } from "../../isoCodeLists";
import CheckBoxList from "../FormComponents/CheckBoxList";
import SharedUsersList from "../FormComponents/SharedUsersList";

import SelectInput from "../FormComponents/SelectInput";

const {DataCollectionSampling, ...filtereMetadataScopeCodes} = metadataScopeCodes;

const StartTab = ({ disabled, record, updateRecord, handleUpdateRecord, userID }) => {
  const { language, region } = useParams();
  const regionInfo = regions[region];
  const [showShareRecord, setShowShareRecord] = useState(false)
  const mounted = useRef(false);
  
  const updateResourceType = (value) => {
    if(Array.isArray(value) && value.length === 1 && value.includes('other')){
      if (Array.isArray(record.eov)){
          if(!record.eov.includes('other')){
            updateRecord("eov")([...record.eov, "other"])
          }
        else{
            updateRecord("eov")(["other"])
        }
      }
    }
    updateRecord("resourceType")(value);
  };

  const handleMetadataScopeChange = () => {
    return (e) => {
      const newEvent = { target: { value: metadataScopeCodes[e.target.value]?.isoValue }};
      handleUpdateRecord("metadataScopeIso")(newEvent);
      handleUpdateRecord("metadataScope")(e);
    };
  }

 
  useEffect(() => {
    mounted.current = true;

    if (!record.language) {
      handleUpdateRecord("language")({ target: {value: language}});
    }

    if (!record.metadataScope) {
      handleUpdateRecord("metadataScope")({ target: { value: 'Dataset' } });
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

  return (
    <Grid item xs>
      <Paper style={paperClass}>
        {disabled && (
          <QuestionText style={{ paddingBottom: "15px" }}>
            <I18n>
              <En>
                <b>
                  This form is locked because it has already been published, or
                  you do not have access to edit it.
                </b>
              </En>
              <Fr>
                <b>
                  Ce formulaire est verrouillé car il a déjà été publié ou vous
                  n'avez pas accès pour le modifier.
                </b>
              </Fr>
            </I18n>
          </QuestionText>
        )}
        <Typography variant="body1">
          <I18n>
            <En>
              Welcome to the {regionInfo.title.en} Metadata Entry Tool, the
              first step in making your data discoverable and accessible through
              CIOOS. This information will be used to create a metadata record
              for your dataset that will allow it to be searchable through the{" "}
              {regionInfo.catalogueTitle.en}. Please fill out each field with as
              much detail as possible. The metadata record will help describe
              this dataset for others to determine if it is relevant for their
              work and ensure it is interoperable with other databases and
              systems.
              <br />
              <br /> Questions regarding the form can be directed to{" "}
            </En>
            <Fr>
              Bienvenue dans l’outil de saisie de métadonnées{" "}
              {regionInfo.titleFrPossessive} qui constitue la première étape du
              processus de partage de vos données. Ces renseignements serviront
              à créer le profil de métadonnées de votre jeu de données. Ces
              métadonnées facilitent l’accessibilité et la découvrabilité de vos
              données via le Catalogue de données {regionInfo.catalogueTitle.fr}
              . Elles rendent également vos jeux de données interopérables avec
              d’autres systèmes de diffusion. Aussi, nous vous incitons
              fortement à remplir les champs requis de la façon la plus
              exhaustive possible.
              <br />
              <br /> Les questions concernant le formulaire peuvent être
              adressées à{" "}
            </Fr>
          </I18n>
          <a href={`mailto:${regionInfo.email}`}>{regionInfo.email}</a>.
        </Typography>

        <ul>
          <li>
            <I18n>
              <En>You can save the form once you have filled out a title.</En>
              <Fr>
                Dès que vous avez saisi un titre, vous pouvez enregistrer le
                formulaire.
              </Fr>
            </I18n>
          </li>
          <li>
            <En>
              All fields marked with a <RequiredMark /> are mandatory.
            </En>
            <Fr>
              Tous les champs marqués d'une étoile <RequiredMark /> sont
              obligatoires.
            </Fr>
          </li>
          <li>
            <I18n>
              <En>
                The form can be saved and completed over time by clicking the{" "}
                <Save /> icon in the bottom right corner. This icon will be
                greyed out until you have filled in the dataset title in the
                "Identification" section.
              </En>
              <Fr>
                Le formulaire peut être sauvegardé et complété ultérieurement en
                cliquant sur le bouton <Save /> dans le coin inférieur droit.
                Cet icône sera activé par l’ajout du titre du jeu de données
                dans la section « Identification des données ».
              </Fr>
            </I18n>
          </li>
          <li>
            <I18n>
              <En>
                Some fields can have text in both French and English, though
                this is only required for the title and the abstract. There is a
                'Translate' button that will automatically generate text in the
                other language. This translation is more accurate when there is
                more text to translate.
              </En>
              <Fr>
                Certains champs peuvent avoir du texte à la fois en français et
                en anglais, toutefois seules les traductions du titre et du
                résumé sont réellement requises. Le bouton « Traduire» génère
                automatiquement du texte dans l'autre langue. Veuillez noter que
                plus il y a de texte à traduire et plus la traduction sera
                précise.
              </Fr>
            </I18n>
          </li>
        </ul>
      </Paper>
      
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
            <En>What is the resource type?</En>
            <Fr>Quel est le type de ressource?</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "metadataScope")} />

        </QuestionText>
        <SelectInput
          value={record.metadataScope || ""}
          onChange={handleMetadataScopeChange()}
          options={Object.keys(filtereMetadataScopeCodes)}
          optionLabels={Object.values(filtereMetadataScopeCodes).map(
            ({ title }) => title[language]
          )}
          optionTooltips={Object.values(filtereMetadataScopeCodes).map(
            ({ text }) => text[language]
          )}
          disabled={disabled}
          fullWidth={false}
          style={{ width: "200px" }}
        />
      </Paper>

      <Paper style={paperClass}>
        <FormControl>
          <QuestionText style={{ paddingBottom: "15px" }}>
            <I18n>
              <En>What is the theme of this record?</En>
              <Fr>Quel est le thème de cet enregistrement?</Fr>
            </I18n>
            {/* TO DO: ADD VALIDATION TO ENSURE A RESOURCE TYPE IS SELECTED */}
            <RequiredMark passes={record.resourceType} />
          </QuestionText>
          <CheckBoxList
            aria-labelledby="resource-type"
            name="resource-type"
            value={record.resourceType || []}
            labelSize={6}
            defaultValue="oceanographic"
            onChange={(v) => updateResourceType(v)}
            options={["oceanographic", "biological", "other"]}
            optionLabels={
              
              <I18n
                en={["Oceanographic", "Biological", "Other"]}
                fr={["Océanographique", "Biologique", "Autre"]}
              />
              }
            disabled={disabled}
          />
        </FormControl>
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

      <DOIInput
        record={record}
        handleUpdateDatasetIdentifier={handleUpdateRecord("datasetIdentifier")}
        handleUpdateDoiCreationStatus={handleUpdateRecord("doiCreationStatus")}
        disabled={disabled}
      />
      
      {showShareRecord && (
        <SharedUsersList
        region={region}
        updateRecord={updateRecord}
        record={record}
      />
      )}
    </Grid>
  );
};

export default StartTab;
