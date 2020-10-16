import React from "react";
import { Typography } from "@material-ui/core";
import { En, Fr } from "./I18n";

const Home = () => {
  return (
    <div>
      <Typography variant="h3">
        <En>Home</En>
        <Fr>Accueil</Fr>
      </Typography>
      <Typography>
        <En>
          Welcome to the CIOOS Metadata intake tool. Start by clicking "New
          Record" on the sidebar. You can also save contacts that you will use
          often in the "Contacts" section.
        </En>
        <Fr>
          Bienvenue dans l'outil de réception des métadonnées du CIOOS.
          Commencez par cliquer sur « Nouveau » Enregistrer » sur la barre
          latérale. Vous pouvez également enregistrer les contacts que vous
          utiliserez souvent dans la section « Contacts ».
        </Fr>
      </Typography>
    </div>
  );
};

export default Home;
