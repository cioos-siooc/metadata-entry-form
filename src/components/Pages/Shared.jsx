import React from "react";

import { Typography } from "@material-ui/core";
import { I18n, En, Fr } from "../I18n";
import FormClassTemplate from "./FormClassTemplate";

class Shared extends FormClassTemplate {
  render() {
    return (
      <div>
        <Typography variant="h5">
          <I18n>
            <En>Shared with me</En>
            <Fr>Partagé avec moi</Fr>
          </I18n>
        </Typography>
      </div>
    );
  }
}

export default Shared;
