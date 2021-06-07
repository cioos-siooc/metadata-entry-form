import React from "react";

import { Save } from "@material-ui/icons";
import { Typography, Paper, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";

import regions from "../../regions";

import { En, Fr, I18n } from "../I18n";
import RequiredMark from "../FormComponents/RequiredMark";
import { paperClass } from "../FormComponents/QuestionStyles";

const StartTab = ({ disabled, record }) => {
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
                  This form is locked because it has already been{" "}
                  {record.status}.
                </b>
              </En>
              <Fr>
                <b>
                  Ce formulaire est verrouillé car il a déjà été{" "}
                  {record.status === "submitted" ? "soumis" : "publié"} .
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
              CIOOS. This information will be used to create a metadata profile
              for your dataset that will allow it to be searchable through the{" "}
              {regionInfo.catalogueTitle.en} Data Catalogue. Please fill out
              each field with as much detail as possible. The metadata profile
              will help describe this dataset for others to determine if it is
              relevant for their work and ensure it is interoperable with other
              databases and systems.
              <br />
              <br /> Questions regarding the form can be directed to{" "}
            </En>
            <Fr>
              Bienvenue dans l’outil de saisie de métadonnées du{" "}
              {regionInfo.title.fr}! Ceci constitue la première étape pour rendre vos données
              accessibles et découvrables via notre plateforme. Ces
              renseignements serviront à créer un profil de métadonnées pour
              votre jeu de données, facilitant ainsi sa découverte dans le{" "}
              {regionInfo.catalogueTitle.fr} et le rendant interopérable avec
              d’autres systèmes de diffusion. Veuillez remplir les champs requis
              de la façon la plus exhaustive possible.
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
                Vous pouvez enregistrer le formulaire une fois que vous avez
                saisi un titre.
              </Fr>
            </I18n>
          </li>
          <li>
            <En>
              All fields marked with a <RequiredMark /> are mandatory.
            </En>
            <Fr>
              Tous les champs marqués d'une étoile <RequiredMark /> sont obligatoires.
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
                Le formulaire peut être sauvegardé et complété ultérieurement
                en cliquant sur le bouton <Save /> dans le coin inférieur droit.
                Cette icône sera grisée jusqu'à ce que vous ayez complété le
                titre du jeu de données dans la Section « Identification des
                données ».
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
                en anglais, toutefois seules les traductions du titre et de
                l'abrégé sont réellement requisent. Il y a un Bouton « Traduire » qui générera
                automatiquement du texte dans l'autre langue. Veuillez noter que cette traduction
                est plus précise quand il y a plus de texte que moins à traduire.
              </Fr>
            </I18n>
          </li>
        </ul>
      </Paper>
    </Grid>
  );
};

export default StartTab;
