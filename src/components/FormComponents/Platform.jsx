import React from "react";

import { TextField, Grid } from "@material-ui/core";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../validate";

const Platform = ({ record, handleInputChange, disabled }) => (
  <>
    {/* TODO remove tacky negative margin */}
    <Grid item xs style={{ ...paperClass, marginTop: "-40px" }}>
      <QuestionText>
        <En>Describe the platform</En>
        <Fr>Décrire la plateforme</Fr>
        <SupplementalText>
          <En>Eg, the name or type of platform</En>
          <Fr>Par exemple, le nom ou le type de plate-forme.</Fr>
          <RequiredMark passes={validateField(record, "platformDescription")} />
        </SupplementalText>
      </QuestionText>
      <BilingualTextInput
        name="platformDescription"
        value={record.platformDescription}
        onChange={handleInputChange}
        multiline
        disabled={disabled}
      />
    </Grid>

    <Grid item xs style={paperClass}>
      <QuestionText>
        <En>What is the platform ID or code?</En>
        <Fr>Qu'est-ce que l'ID de plate-forme ?</Fr>
        <SupplementalText>
          <En>
            This is a unique identification of the platform. If the platform is
            registered with ICES, use that identifier
          </En>
          <Fr>
            Il s'agit d'une identification unique de la plateforme. Si la
            plateforme est enregistrée auprès du CIEM, utilisez cet
            identificateur
          </Fr>
          <RequiredMark passes={validateField(record, "platformID")} />
        </SupplementalText>
      </QuestionText>

      <TextField
        label={<I18n en="Platform ID" fr="ID de plateforme" />}
        name="platformID"
        value={record.platformID}
        onChange={handleInputChange}
        fullWidth
        disabled={disabled}
      />
    </Grid>
  </>
);

export default Platform;
