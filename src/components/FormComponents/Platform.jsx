import React, { useState } from "react";

import { TextField, Grid, Tooltip, Box } from "@mui/material";
import BookmarkAddOutlined from "@mui/icons-material/BookmarkAddOutlined";
import { useParams } from "react-router-dom";
import { OpenInNew } from "@mui/icons-material";

import BilingualTextInput from "./BilingualTextInput";
import { QuestionText, SupplementalText } from "./QuestionStyles";
import RequiredMark from "./RequiredMark";
import { En, Fr, I18n } from "../I18n";
import SelectInput from "./SelectInput";
import platformTypes from "../../platforms.json";
import ItemCards from "./ItemCards";
import SavedItemSelect from "./SavedItemSelect";
import { platformIsComplete } from "../../utils/validate";
import { deepCopy } from "../../utils/misc";
import PlatformTitle from "./PlatformTitle";
import { getBlankPlatform } from "../../utils/blankRecord";

const Platform = ({
  platforms = [],
  userPlatforms,
  updatePlatforms,
  saveUpdatePlatform,
  disabled,
}) => {
  const { language = "en" } = useParams();
  // The open platform, or null when every row is folded.
  const [activePlatform, setActivePlatform] = useState(null);

  function updatePlatformField(key) {
    return (e) => {
      const platformsCopy = [...platforms];
      platformsCopy[activePlatform][key] = e.target.value;
      updatePlatforms(platformsCopy);
    };
  }

  const sortedPlatformTypes = Object.values(platformTypes).sort((a, b) =>
    a[`label_${language}`].localeCompare(b[`label_${language}`], language),
  );

  const platform = platforms[activePlatform];
  const typeLabel = (type) =>
    platformTypes[type]?.[`label_${language}`] ||
    Object.values(platformTypes).find((t) => t.label_en === type)?.[
      `label_${language}`
    ] ||
    type;

  return (
    <ItemCards
      items={platforms}
      updateItems={updatePlatforms}
      openIndex={activePlatform}
      setOpenIndex={setActivePlatform}
      disabled={disabled}
      idPrefix="platform"
      itemNoun={{ en: "platform", fr: "plateforme" }}
      ariaLabel={
        language === "fr"
          ? "Plateformes dans cet enregistrement"
          : "Platforms in this record"
      }
      itemTitle={(item) => PlatformTitle({ platform: item })}
      itemMeta={(item) => typeLabel(item.type)}
      isComplete={platformIsComplete}
      getBlankItem={getBlankPlatform}
      duplicateItem={(copy) => {
        if (copy.id) copy.id += language === "fr" ? " (copie)" : " (copy)";
        return copy;
      }}
      menuItems={(item) => [
        {
          key: "save",
          label:
            language === "fr"
              ? "Enregistrer dans mes plateformes"
              : "Save to my platforms",
          icon: BookmarkAddOutlined,
          disabled: !item.id,
          onClick: () => saveUpdatePlatform(deepCopy(item)),
        },
      ]}
      addLabel={<I18n en="Add platform" fr="Ajouter une plateforme" />}
      emptyText={
        <I18n en="No platforms yet." fr="Aucune plateforme pour l'instant." />
      }
      footer={(addItem) => (
        <SavedItemSelect
          savedItems={userPlatforms}
          itemTitle={(item) => PlatformTitle({ platform: item })}
          getBlankItem={getBlankPlatform}
          onAdd={addItem}
          disabled={disabled}
          ariaLabel={
            language === "fr"
              ? "Rechercher une plateforme enregistrée"
              : "Search saved platforms"
          }
        />
      )}
      renderEditor={() => (
        <Box>
          <Grid sx={{ py: 1.25 }}>
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
                    <Fr>
                      SeaVoX Platform Categories (liste Vocabulaire NERC L06)
                    </Fr>
                  </I18n>
                  <Tooltip
                    title={
                      <I18n
                        en="Open in new window"
                        fr="Ouvrir dans une nouvelle fenêtre"
                      />
                    }
                  >
                    <OpenInNew sx={{ verticalAlign: "middle" }} />
                  </Tooltip>
                </a>

                <RequiredMark passes={platform.type} />
              </SupplementalText>
            </QuestionText>
            <SelectInput
              value={platform.type}
              onChange={updatePlatformField("type")}
              optionLabels={sortedPlatformTypes.map(
                (e) => `${e[`label_${language}`]}`,
              )}
              optionTooltips={sortedPlatformTypes.map(
                (e) => `${e[`definition_${language}`]}`,
              )}
              options={sortedPlatformTypes.map((e) => e.label_en)}
              disabled={disabled}
              label={<I18n en="Platform" fr="Plateforme" />}
              fullWidth={false}
            />
          </Grid>

          <Grid sx={{ py: 1.25 }}>
            <QuestionText>
              <I18n>
                <En>What is the platform ID or code?</En>
                <Fr>Quel est l'ID de la plateforme ?</Fr>
              </I18n>
              <SupplementalText>
                <I18n>
                  <En>
                    This is a unique identification of the platform. If the
                    platform is registered with{" "}
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
                    Il s'agit d'une identification unique de la plateforme. Si
                    la plateforme est enregistrée auprès du{" "}
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
              onChange={updatePlatformField("id")}
              fullWidth
              disabled={disabled}
            />
          </Grid>

          <Grid sx={{ py: 1.25 }}>
            <QuestionText>
              <I18n>
                <En>More information about the platform</En>
                <Fr>Plus d'informations sur la plateforme</Fr>
              </I18n>
              <SupplementalText>
                <I18n>
                  <En>
                    You can also add additional information about the platform.
                  </En>
                  <Fr>
                    Vous pouvez également ajouter des informations
                    supplémentaires sur la plateforme.
                  </Fr>
                </I18n>
              </SupplementalText>
            </QuestionText>
            <BilingualTextInput
              name="platformDescription"
              label={
                <I18n
                  en="Platform description"
                  fr="Description de la plateforme"
                />
              }
              value={platform.description}
              onChange={updatePlatformField("description")}
              multiline
              disabled={disabled}
            />
          </Grid>
        </Box>
      )}
    />
  );
};

export default Platform;
