import React from "react";

import { Typography, Paper, Grid } from "@material-ui/core";

import { En, Fr } from "../I18n";

const StartTab = ({ disabled, paperClass }) => {
  return (
    <Grid item xs>
      <Paper style={paperClass}>
        <Typography variant="h3">
          <En>CIOOS Metadata Profile Intake Form</En>
          <Fr>Formulaire de réception des profils de métadonnées du CIOOS</Fr>
        </Typography>
        {disabled && (
          <Typography>
            <En>
              <b>This form is locked because it has already been submitted.</b>
            </En>
            <Fr>
              <b>Ce formulaire est verrouillé car il a déjà été soumis.</b>
            </Fr>
          </Typography>
        )}
        <Typography>
          <En>
            Welcome to the CIOOS metadata profile generation form! Please fill
            out each field with as much detail as you can. Using this
            information we will create your metadata profile for the given
            dataset.
          </En>
          <Fr>
            Bienvenue sur le formulaire de génération de profils de métadonnées
            CIOOS ! Veuillez remplir sur chaque champ avec autant de détails que
            vous pouvez. Utilisation de cette informations que nous allons créer
            votre profil de métadonnées pour le jeu de données.
          </Fr>
        </Typography>
        <br />
        <Typography>
          <En>
            The form can be saved once you have filled in the dataset title in
            the "Identification" section.
          </En>
          <Fr>
            Le formulaire peut être enregistré une fois que vous avez rempli le
            titre du jeu de données dans la section « Identification ».
          </Fr>
        </Typography>
      </Paper>
    </Grid>
  );
};

export default StartTab;
