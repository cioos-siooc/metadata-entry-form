import React, {useState} from "react";

import {TextField, Grid, Tooltip, Paper} from "@material-ui/core";
import { useParams } from "react-router-dom";
import { OpenInNew } from "@material-ui/icons";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import { validateField } from "../../utils/validate";
import SelectInput from "./SelectInput";
import platformTypes from "../../platforms.json";
import PlatformLeftList from "./PlatformLeftList";

const Platform = ({
      platforms = [],
      userPlatforms,
      record,
      handleUpdateRecord,
      updatePlatforms,
      saveUpdatePlatform,
      disabled,
      paperClass,
}) => {
  const { language = "en" } = useParams();
  const [activePlatform, setActivePlatform] = useState(0);

  function updatePlatformField(key) {
      return (e) => {
        const platformsCopy = [...platforms];
        platformsCopy[activePlatform][key] = e.target.value;
        updatePlatforms(platformsCopy);
      };
    }

  function removePlatform() {
    updatePlatforms(
      platforms.filter((e, index) => index !== activePlatform)
    );
    if (platforms.length) setActivePlatform(platforms.length - 2);
  }


  const sortedPlatformTypes = Object.values(platformTypes).sort((a, b) =>
    a[`label_${language}`].localeCompare(b[`label_${language}`], language)
  );

  return (
    <div>

      <Grid container direction="row" style={{ marginLeft: "5px" }}>
        <Grid item xs={5}>

        <PlatformLeftList
                  platforms={platforms}
                  updatePlatforms={updatePlatforms}
                  activePlatform={activePlatform}
                  setActivePlatform={setActivePlatform}
                  disabled={disabled}
                  userPlatforms={userPlatforms}
                  saveUpdatePlatform={saveUpdatePlatform}
                  />
        </Grid>



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

            <RequiredMark passes={validateField(record, "platform")} />
          </SupplementalText>
        </QuestionText>
        <SelectInput
          value={record.platform}
          onChange={handleUpdateRecord("platform")}
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
          value={record.platformDescription}
          onChange={handleUpdateRecord("platformDescription")}
          multiline
          disabled={disabled}
        />
      </Grid>
      </Grid>
      </Grid>


    </div>
  );
};

export default Platform;
