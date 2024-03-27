import React, { useContext, useState, useEffect } from "react";
import {
  Button,
  InputAdornment,
  TextField,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import TranslateIcon from "@material-ui/icons/Translate";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";

// AWS translate size limit is 5KB
const MAX_AWS_TRANSLATE_SIZE = 5000;

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

  const { language } = useParams();
  let languages;

  const textSizeByes = new Blob([value?.[language]]).size;
  const textTooBig = textSizeByes >= MAX_AWS_TRANSLATE_SIZE;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  const alternateLanguage = languages[1];
  const translateChecked =
    value?.translations?.[alternateLanguage]?.verified || false;

  function setTranslationData(translations, checked) {
    return {
      ...translations,
      [alternateLanguage]: {
        verified: checked,
        ...(!checked && {
          message: `text translated using the Amazon translate service / texte traduit à l'aide du service de traduction Amazon`,
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
          translations: value.translations || setTranslationData({}, false),
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
                "text translated using the Amazon translate service / texte traduit à l'aide du service de traduction Amazon",
            },
          },
        };
        onChange({ target: { name, value: updatedValue } });
      }
    }
  }, [name, onChange, value, alternateLanguage]);

  return (
    <div>
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
                      (translatedText) => {
                        setAwaitingTranslation(false);
                        const translation = translatedText.data;
                        handleEvent({
                          target: {
                            name: alternateLanguage,
                            value: translation,
                          },
                        });
                        // onTranslateComplete();
                      }
                    );
                  }}
                >
                  <I18n>
                    <En>Translate</En>
                    <Fr>Traduire</Fr>
                  </I18n>
                </Button>
                {value?.[alternateLanguage] && (
                  <FormControlLabel
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

                {textTooBig && (
                  <I18n>
                    <En>
                      Translation is disabled because text is larger than{" "}
                      {MAX_AWS_TRANSLATE_SIZE} characters.
                    </En>
                    <Fr>
                      La traduction est désactivée car le texte est plus grand
                      que {MAX_AWS_TRANSLATE_SIZE} caractères.
                    </Fr>
                  </I18n>
                )}
              </span>
            </Tooltip>
          )}
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
