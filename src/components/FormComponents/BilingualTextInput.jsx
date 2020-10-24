import React, { useContext, useState } from "react";
import {
  Button,
  InputAdornment,
  TextField,
  CircularProgress,
} from "@material-ui/core";

import { useParams } from "react-router-dom";
import { En, Fr } from "../I18n";
import { UserContext } from "../../providers/UserProvider";

const BilingualTextInput = ({
  onChange,
  value,
  name,
  multiline,
  disabled,
  error,
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
            error={error}
          />
          {i === 0 && (
            <Button
              startIcon={
                awaitingTranslation ? <CircularProgress size={20} /> : null
              }
              disabled={awaitingTranslation || !(value && value[lang])}
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
              <En>Translate</En>
              <Fr>Traduire</Fr>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
