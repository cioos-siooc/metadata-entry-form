import { InputAdornment, TextField } from "@material-ui/core";

import React from "react";
import { useParams } from "react-router-dom";

const BilingualTextInput = ({
  onChange,
  onBlur,
  value,
  name,
  multiline,
  disabled,
  error,
}) => {
  function handleEvent(e, callback) {
    if (Boolean(callback) === false) {
      return;
    }
    const newData = { ...value, [e.target.name]: e.target.value };
    const newDataEvent = { target: { name, value: newData } };
    callback(newDataEvent);
  }
  const { language } = useParams();
  let languages;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  return (
    <div>
      {languages.map((lang) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value && value[lang]}
            onChange={(e) => handleEvent(e, onChange)}
            onBlur={(e) => handleEvent(e, onBlur)}
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
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
