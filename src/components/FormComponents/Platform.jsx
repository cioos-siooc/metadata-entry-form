import React from "react";

import { TextField, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText, paperClass } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import SelectInput from "./SelectInput";
import platforms from "../../platforms.json";

const Platform = ({ record, handleUpdateRecord, disabled }) => {
  const { language = "en" } = useParams();

  const platformsSorted = Object.values(platforms).sort((a, b) =>
    a[`label_${language}`].localeCompare(b[`label_${language}`], language)
  );
  console.log("record.platform", record.platform);
  return (
    <div>
      <Grid item xs style={{ ...paperClass, marginTop: "-40px" }}>
        <QuestionText>
          <I18n>
            <En>What type of platform is it?</En>
            <Fr>De quel type de plateforme s'agit-il ?</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                Please select a platform from the{" "}
                <a
                  href="http://vocab.nerc.ac.uk/collection/L06/current/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NERC L06 Vocabulary
                </a>
              </En>
              <Fr>
                Veuillez sélectionner une plateforme dans la liste{" "}
                <a
                  href="http://vocab.nerc.ac.uk/collection/L06/current/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vocabulaire NERC L06
                </a>
              </Fr>
            </I18n>
            <RequiredMark passes={validateField(record, "platform")} />
          </SupplementalText>
        </QuestionText>
        <SelectInput
          value={record.platform}
          onChange={handleUpdateRecord("platform")}
          optionLabels={platformsSorted.map((e) => `${e[`label_${language}`]}`)}
          optionTooltips={platformsSorted.map(
            (e) => `${e[`definition_${language}`]}`
          )}
          options={platformsSorted.map((e) => e.label_en)}
          // disabled={!contactList.length || disabled}
          label={<I18n en="Platform" fr="Plateforme" />}
          fullWidth={false}
        />
      </Grid>

      <Grid item xs style={paperClass}>
        <QuestionText>
          <I18n>
            <En>More about the platform</En>
            <Fr>Décrire la plateforme</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>You can also add aditional information about the platform</En>
              <Fr>Par exemple, le nom ou le type de plateforme.</Fr>
            </I18n>
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
    </div>
  );
};

export default Platform;
