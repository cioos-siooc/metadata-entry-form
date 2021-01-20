import React from "react";

import { Typography } from "@material-ui/core";
import { Fr, En } from "../I18n";

const Login = () => {
  return (
    <div>
      <Typography>
        <En>Please sign in to access your metadata records.</En>
        <Fr>
          Connectez-vous pour accéder à vos enregistrements de métadonnées.
        </Fr>
      </Typography>
    </div>
  );
};

export default Login;
