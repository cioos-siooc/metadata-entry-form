import React, { useContext, useState, useEffect } from "react";
import {
  Button,
  IconButton,
  InputAdornment,
  TextField,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TranslateIcon from "@mui/icons-material/Translate";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";
import TranslationInfoDialog from "./TranslationInfoDialog";

// Cohere translate size limit is 5KB
const MAX_TRANSLATE_SIZE = 5000;

const BilingualTextInput = ({
  onChange,
  value,
  name,
  multiline,
  disabled,
  error,
  translationButonDisabled = false,
}) => {
  const { translate } = useContext(UserContext);
  const [awaitingTranslation, setAwaitingTranslation] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const { language } = useParams();
  let languages;

  const textSizeByes = new Blob([value?.[language]]).size;
  const textTooBig = textSizeByes >= MAX_TRANSLATE_SIZE;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  const alternateLanguage = languages[1];
  const translateChecked =
    value?.translations?.[alternateLanguage]?.verified || false;

  function setTranslationData(translations, checked, translationMessage) {
    return {
      ...translations,
      [alternateLanguage]: {
        verified: checked,
        ...(!checked && {
          message: translationMessage || "text translated using Cohere / texte traduit à l'aide de Cohere",
        }),
      },
    };
  }

  function handleEvent(e) {
    const { translations, ...rest } = { ...value };
    const newData = {
      ...rest,
      [e.target.name]: e.target.value,
      ...(e.target.name === alternateLanguage &&
        e.target.value && {
        translations: translations || setTranslationData({}, false),
      }),
    };
    const newDataEvent = { target: { name, value: newData } };
    onChange(newDataEvent);
  }

  function handleTranslateCheckEvent(e) {
    const { checked } = e.target;
    const newData = {
      ...value,
      translations: setTranslationData(value.translations, checked),
    };
    const newDataEvent = { target: { name, value: newData } };
    onChange(newDataEvent);
  }

  // Ensure translations field exists on component mount/load
  useEffect(() => {
    if (value && !value.translations) {
      const hasTranslations = value.en && value.fr;
      if (hasTranslations) {
        const updatedValue = {
          ...value,
          translations: {
            [alternateLanguage]: {
              verified: false,
              message:
                "text translated using Cohere / texte traduit à l'aide de Cohere",
            },
          },
        };
        onChange({ target: { name, value: updatedValue } });
      }
    }
  }, [name, onChange, value, alternateLanguage]);

  return (
    <div>
      <TranslationInfoDialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
      />
      {languages.map((lang, i) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value?.[lang] || ""}
            onChange={(e) => handleEvent(e)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {lang.toUpperCase()}
                </InputAdornment>
              ),
            }}
            multiline={multiline}
            disabled={disabled}
            error={Boolean(error)}
          />
          {i === 0 && !translationButonDisabled && (
            <span>
              <Tooltip
                title={
                  <I18n
                    en="Translate english to french"
                    fr="Traduire du français en anglais"
                  />
                }
              >
                <span>
                  <Button
                    style={{ margin: "10px" }}
                    startIcon={
                      awaitingTranslation ? (
                        <CircularProgress size={20} />
                      ) : (
                        <TranslateIcon />
                      )
                    }
                    endIcon={awaitingTranslation ? null : <ArrowDownwardIcon />}
                    disabled={
                      disabled ||
                      awaitingTranslation ||
                      !value?.[lang] ||
                      textTooBig
                    }
                    onClick={() => {
                      setAwaitingTranslation(true);

                      translate({ text: value[lang], fromLang: lang }).then(
                        (result) => {
                          setAwaitingTranslation(false);
                          const data = result.data;
                          const translation = typeof data === "object" ? data.translatedText : data;
                          const translationMsg = typeof data === "object" ? data.translationMessage : undefined;
                          handleEvent({
                            target: {
                              name: alternateLanguage,
                              value: translation,
                            },
                          });
                          // Update translation metadata with provenance info
                          const newData = {
                            ...value,
                            [alternateLanguage]: translation,
                            translations: setTranslationData(value.translations, false, translationMsg),
                          };
                          onChange({ target: { name, value: newData } });
                        }
                      );
                    }}
                  >
                    <I18n>
                      <En>Translate</En>
                      <Fr>Traduire</Fr>
                    </I18n>
                  </Button>
                </span>
              </Tooltip>
              {value?.[alternateLanguage] && (
                <FormControlLabel
                  style={{ margin: "10px" }}
                  control={
                    <Checkbox
                      checked={translateChecked}
                      onChange={(e) => handleTranslateCheckEvent(e)}
                      color="primary"
                    />
                  }
                  label={
                    <I18n>
                      <En>I have verified this translation</En>
                      <Fr>J'ai vérifié cette traduction</Fr>
                    </I18n>
                  }
                />
              )}
              <Tooltip
                title={
                  <I18n
                    en="About the translation service — service, model, glossary, and how to report errors"
                    fr="À propos du service de traduction — service, modèle, glossaire et comment signaler des erreurs"
                  />
                }
              >
                <IconButton
                  onClick={() => setInfoDialogOpen(true)}
                  aria-label="about the translation service"
                  style={{ margin: "10px" }}
                >
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>

              {textTooBig && (
                <I18n>
                  <En>
                    Translation is disabled because text is larger than{" "}
                    {MAX_TRANSLATE_SIZE} characters.
                  </En>
                  <Fr>
                    La traduction est désactivée car le texte est plus grand
                    que {MAX_TRANSLATE_SIZE} caractères.
                  </Fr>
                </I18n>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
