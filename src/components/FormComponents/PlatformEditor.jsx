import React from "react";

import {
  Grid, Paper,
  TextField, Tooltip,
  Typography,
} from "@material-ui/core";
import {OpenInNew} from "@material-ui/icons";
import {useParams} from "react-router-dom";
import { getBlankPlatform } from "../../utils/blankRecord";

import { En, Fr, I18n } from "../I18n";

import BilingualTextInput from "./BilingualTextInput";

import RequiredMark from "./RequiredMark";
import {QuestionText, SupplementalText} from "./QuestionStyles";
import {validateField} from "../../utils/validate";
import SelectInput from "./SelectInput";
import platformTypes from "../../platforms.json";


const PlatformEditor = ({
  value,
  disabled,
  paperClass,
  updatePlatformEvent,
}) => {

  const { language = "en" } = useParams();

  const sortedPlatformTypes = Object.values(platformTypes).sort((a, b) =>
    a[`label_${language}`].localeCompare(b[`label_${language}`], language)
  );

  const platform = { ...getBlankPlatform(), ...value };

  return (
    <Grid container direction="column" spacing={2}>
      <Grid item xs>
        <Grid container direction="column">
          {platform && (
            <Paper style={paperClass}>
                    <Grid item xs>
        <Grid container direction="column">
        <QuestionText>
          <I18n>
            <En>What type of platform is it?</En>
            <Fr>De quel type de plateforme s'agit-il ?</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>Please select a platform from the </En>
              <Fr>Veuillez sélectionner une plateforme dans la </Fr>
            </I18n>
            <a
              href="http://vocab.nerc.ac.uk/collection/L06/current/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <I18n>
                <En>SeaVoX Platform Categories (NERC L06 Vocabulary)</En>
                <Fr>SeaVoX Platform Categories (liste Vocabulaire NERC L06)</Fr>
              </I18n>
              <Tooltip
                title={
                  <I18n
                    en="Open in new window"
                    fr="Ouvrir dans une nouvelle fenêtre"
                  />
                }
              >
                <OpenInNew style={{ verticalAlign: "middle" }} />
              </Tooltip>
            </a>

            <RequiredMark passes={platform.id} />
          </SupplementalText>
        </QuestionText>
        <SelectInput
          value={platform.type}
          onChange={updatePlatformEvent("platformId")}
          optionLabels={sortedPlatformTypes.map((e) => `${e[`label_${language}`]}`)}
          optionTooltips={sortedPlatformTypes.map(
            (e) => `${e[`definition_${language}`]}`
          )}
          options={sortedPlatformTypes.map((e) => e.label_en)}
          disabled={disabled}
          label={<I18n en="Platform" fr="Plateforme" />}
          fullWidth={false}
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
            <RequiredMark passes={platform.id} />
          </SupplementalText>
        </QuestionText>
        <TextField
          label={<I18n en="Platform ID" fr="ID de plateforme" />}
          value={platform.id}
          onChange={updatePlatformEvent("platformID")}
          fullWidth
          disabled={disabled}
        />
      </Grid>

      <Grid item xs style={paperClass}>
        <QuestionText>
          <I18n>
            <En>More information about the platform</En>
            <Fr>Plus d'informations sur la plateforme</Fr>
          </I18n>
          <SupplementalText>
            <I18n>
              <En>
                You can also add aditional information about the platform.
              </En>
              <Fr>
                Vous pouvez également ajouter des informations supplémentaires
                sur la plateforme.
              </Fr>
            </I18n>
          </SupplementalText>
        </QuestionText>
        <BilingualTextInput
          value={platform.platformDescription}
          onChange={updatePlatformEvent("platformDescription")}
          multiline
          disabled={disabled}
        />
      </Grid>
      </Grid>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PlatformEditor;
