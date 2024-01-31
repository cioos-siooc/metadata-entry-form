import React from "react";

import { Save } from "@material-ui/icons";
import {
  Typography,
  Paper,
  Grid,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@material-ui/core";
import { useParams } from "react-router-dom";

import regions from "../../regions";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { paperClass, QuestionText } from "../FormComponents/QuestionStyles";

const StartTab = ({ disabled, handleUpdateRecord }) => {
  const { region } = useParams();
  const regionInfo = regions[region];

  return (
    <Grid item xs>
      <Paper style={paperClass}>
        {disabled && (
          <Typography>
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
          </Typography>
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
        {/* Radio Buttons here for Resource Type selection */}
        {/* TO DO: ADD STATE UPDATE FOR SELECTION */}
        <FormControl>
          <QuestionText style={{ paddingBottom: "15px" }}>
            <I18n>
              <En>What is the resource type of the dataset?</En>
              <Fr>Quel est le type de ressource de l'ensemble de données?</Fr>
            </I18n>
            {/* TO DO: ADD VALIDATION FOR RESOURCE TYPE BEING SELECTED */}
            <RequiredMark  />
          </QuestionText>
          <RadioGroup
            aria-labelledby="resource-type"
            defaultValue=""
            name="resource-type"
            onChange={handleUpdateRecord("resourceType")}
          >
            <FormControlLabel
              value="oceanographic"
              control={<Radio />}
              label="Oceanographic"
            />
            <FormControlLabel
              value="biological"
              control={<Radio />}
              label="Biological"
            />
            <FormControlLabel 
              value="model"  
              control={<Radio />} 
              label="Model" 
            />
          </RadioGroup>
        </FormControl>
      </Paper>
    </Grid>
  );
};

export default StartTab;
