import React from "react";

import { TextField, Grid } from "@material-ui/core";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";

const Platform = ({ record, handleUpdateRecord, disabled }) => (
  <>
    {/* TODO remove tacky negative margin */}
    <Grid item xs style={{ ...paperClass, marginTop: "-40px" }}>
      <QuestionText>
        <I18n>
          <En>Describe the platform</En>
          <Fr>Décrire la plateforme</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>Eg, the name or type of platform</En>
            <Fr>Par exemple, le nom ou le type de plateforme.</Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "platformDescription")} />
        </SupplementalText>
      </QuestionText>
      <BilingualTextInput
        value={record.platformDescription}
        onChange={handleUpdateRecord("platformDescription")}
        multiline
        disabled={disabled}
      />
    </Grid>

    <Grid item xs style={paperClass}>
      <QuestionText>
        <I18n>
          <En>What is the platform ID or code?</En>
          <Fr>Quel est l'ID de la plateforme ?</Fr>
        </I18n>
        <SupplementalText>
          <I18n>
            <En>
              This is a unique identification of the platform. If the platform
              is registered with{" "}
              <a
                href="https://vocab.seadatanet.org/v_bodc_vocab_v2/search.asp?lib=C17"
                target="_blank"
                rel="noopener noreferrer"
              >
                ICES
              </a>
              , use that identifier
            </En>
            <Fr>
              Il s'agit d'une identification unique de la plateforme. Si la
              plateforme est enregistrée auprès du{" "}
              <a
                href="https://vocab.seadatanet.org/v_bodc_vocab_v2/search.asp?lib=C17"
                target="_blank"
                rel="noopener noreferrer"
              >
                CIEM
              </a>
              , utilisez cet identifiant
            </Fr>
          </I18n>
          <RequiredMark passes={validateField(record, "platformID")} />
        </SupplementalText>
      </QuestionText>

      <TextField
        label={<I18n en="Platform ID" fr="ID de plateforme" />}
        value={record.platformID}
        onChange={handleUpdateRecord("platformID")}
        fullWidth
        disabled={disabled}
      />
    </Grid>
  </>
);

export default Platform;
