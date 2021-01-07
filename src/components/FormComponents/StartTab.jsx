import React from "react";

import { Save } from "@material-ui/icons";
import { Typography, Paper, Grid } from "@material-ui/core";

import { En, Fr } from "../I18n";

import RequiredMark from "./RequiredMark";
import { paperClass } from "./QuestionStyles";

const StartTab = ({ disabled, record }) => {
  return (
    <Grid item xs>
      <Paper style={paperClass}>
        {disabled && (
          <Typography>
            <En>
              <b>
                This form is locked because it has already been {record.status}.
              </b>
            </En>
            <Fr>
              <b>
                Ce formulaire est verrouillé car il a déjà été{" "}
                {record.status === "submitted" ? "soumis" : "publié"} .
              </b>
            </Fr>
          </Typography>
        )}
        <Typography variant="body1">
          <En>
            Welcome to the CIOOS metadata profile generation form. Please fill
            out each field with as much detail as you can. This information will
            be used to create a metadata profile for your dataset.
          </En>
          <Fr>
            Bienvenue sur le formulaire de génération de profils de métadonnées
            CIOOS ! Veuillez remplir sur chaque champ avec autant de détails que
            vous pouvez. Utilisation de cette informations que nous allons créer
            votre profil de métadonnées pour le jeu de données.
          </Fr>
        </Typography>

        <En>
          <ul>
            <li>You can save the form once you have filled out a title.</li>
            <li>
              All questions marked with a <RequiredMark /> are mandatory.
            </li>
            <li>
              The form can be completed over time. If you need to stop, click
              the <Save /> icon in the bottom right corner. This icon will be
              greyed out until you have filled in the dataset title in the
              "Identification" section.
            </li>
            <li>
              Some fields can have text in both French and English, though this
              is only required for title and abstract. There is a 'Translate'
              button that will automatically generate text in the other
              language. This translation is more accurate when there is more
              text to translate.
            </li>
          </ul>
        </En>
        <Fr>
          Commencez par cliquer sur « Nouveau » Enregistrer » sur la barre
          latérale. Vous pouvez également enregistrer les contacts que vous
          utiliserez souvent dans la section « Contacts ».
        </Fr>
      </Paper>
    </Grid>
  );
};

export default StartTab;
