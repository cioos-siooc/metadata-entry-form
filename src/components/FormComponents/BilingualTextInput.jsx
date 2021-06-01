import React, { useContext, useState } from "react";
import {
  Button,
  InputAdornment,
  TextField,
  CircularProgress,
} from "@material-ui/core";
import TranslateIcon from "@material-ui/icons/Translate";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";

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

  function handleEvent(e) {
    const newData = { ...value, [e.target.name]: e.target.value };
    const newDataEvent = { target: { name, value: newData } };
    onChange(newDataEvent);
  }
  const { language } = useParams();
  let languages;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  return (
    <div>
      {languages.map((lang, i) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value && value[lang]}
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
            error={error}
          />
          {i === 0 && !translationButonDisabled && (
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
                disabled || awaitingTranslation || !(value && value[lang])
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
          )}
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
