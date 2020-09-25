import React from "react";

import { Typography } from "@material-ui/core";
import { Fr, En } from "./I18n";

const Submissions = () => {
  return (
    <div>
      <Typography variant="h3">
        <En>Submission received!</En>
        <Fr>Soumission reçue!</Fr>
      </Typography>

      <Typography>
        <En>Thank you for your submission!</En>
        <Fr>Merci pour votre soumission!</Fr>
      </Typography>
    </div>
  );
};

export default Submissions;
