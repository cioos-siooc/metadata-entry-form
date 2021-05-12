import React from "react";

import { Typography } from "@material-ui/core";
import { En, Fr, I18n } from "../I18n";

const Login = () => {
  return (
    <div>
      <Typography>
        <I18n>
          <En>
            Please sign in to access your metadata records. You will need a
            Google account to login.
          </En>
          <Fr>
            Connectez-vous pour accéder à vos enregistrements de métadonnées.
            Vous aurez besoin d'un compte Google pour vous connecter.
          </Fr>
        </I18n>
      </Typography>
    </div>
  );
};

export default Login;
