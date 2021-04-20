import React from "react";

import { Save } from "@material-ui/icons";
import { Typography, Paper, Grid } from "@material-ui/core";

import { En, Fr } from "../I18n";

import RequiredMark from "../FormComponents/RequiredMark";
import { paperClass } from "../FormComponents/QuestionStyles";

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
          Bienvenue dans le formulaire de génération de profil de métadonnées SIOOC. 
          Veuillez remplir chaque champ avec autant de détails que possible. 
          Ces informations seront utilisées pour créer un profil de métadonnées pour votre jeu de données.
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
        <ul>
            <li>
              Vous pouvez enregistrer le formulaire une fois que vous avez rempli un titre.
              </li>
            <li>
              Toutes les questions marquées d'un <RequiredMark /> sont obligatoires.
            </li>
            <li>
              Le formulaire peut être complété au fil du temps. Si vous devez vous arrêter, 
              cliquez sur l'icône <Save /> dans le coin inférieur droit. Cette icône sera grisée jusqu'à 
              ce que vous ayez renseigné le titre du jeu de données dans la section «Identification».
            </li>
            <li>
              Certains champs peuvent contenir du texte en français et en anglais, 
              bien que cela ne soit requis que pour le titre et le résumé. 
              Il existe un bouton «Traduire» qui générera automatiquement du texte dans l'autre langue. 
              Cette traduction est plus précise lorsqu'il y a plus de texte à traduire.
            </li>
          </ul>
        </Fr>
      </Paper>
    </Grid>
  );
};

export default StartTab;
