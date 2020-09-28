import React from "react";
import { TextField, InputAdornment } from "@material-ui/core";
import { useParams } from "react-router-dom";
import memoize from "../../utils/memoize";

const BilingualTextInput = ({
  onChange,
  value,
  name,
  multiline,
  disabled,
  error,
}) => {
  function handleChange(e) {
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
      {languages.map((lang) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value && value[lang]}
            onChange={handleChange}
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

export default memoize(BilingualTextInput);
// export default BilingualTextInput;
