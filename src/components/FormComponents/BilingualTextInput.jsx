import React, { useCallback, useContext, useState } from "react";
import {
  Button,
  InputAdornment,
  TextField,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
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

  const handleEvent = useCallback((e) => {
    const newData = { ...value, [e.target.name]: e.target.value };
    const newDataEvent = { target: { name, value: newData } };
    onChange(newDataEvent);
  },[]);
  
  const { language } = useParams();
  let languages;

  const textSizeByes = new Blob([value?.[language]]).size;
  const textTooBig = textSizeByes >= MAX_AWS_TRANSLATE_SIZE;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  return (
    <div>
      {languages.map((lang, i) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value?.[lang] || ""}
            onChange={handleEvent}
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
                    const alternateLanguage = languages[1];
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
                      }
                    );
                  }}
                >
                  <I18n>
                    <En>Translate</En>
                    <Fr>Traduire</Fr>
                  </I18n>
                </Button>
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
