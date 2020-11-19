import React, { useContext } from "react";
import { Typography } from "@material-ui/core";

import { En, Fr } from "./I18n";
import { UserContext } from "../providers/UserProvider";

const Home = () => {
  const { user } = useContext(UserContext);

  return (
    <div>
      <Typography variant="h5">
        <En>Welcome to the CIOOS Metadata intake tool.</En>
        <Fr>Bienvenue dans l'outil de réception des métadonnées du CIOOS.</Fr>
      </Typography>

      {!user && (
        <div>
          <En>
            Start by clicking 'Sign In' on the left. You will need to sign in
            using one of the Google accounts listed in the pop up.
          </En>
          <Fr>
            Commencez par cliquer sur « Se connecter » sur la gauche pour vous
            connecter. Vous devrez vous connecter à l'aide de l'un des comptes
            Google répertoriés dans la fenêtre contextuelle.
          </Fr>
        </div>
      )}
    </div>
  );
};

export default Home;
