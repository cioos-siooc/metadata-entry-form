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
        <En>Welcome to the CIOOS Metadata intake tool.</En>
        <Fr>Bienvenue à la maison</Fr>
      </Typography>
    </div>
  );
};

export default Home;
