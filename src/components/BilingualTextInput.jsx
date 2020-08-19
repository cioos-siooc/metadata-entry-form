import React, { useState } from "react";
import { TextField, InputAdornment } from "@material-ui/core";
const BilingualTextInput = ({ onChange, value, name, label, multiline }) => {
  const [bilingualText, setBilingualText] = useState({ en: "", fr: "" });

  function handleChange(e) {
    const newData = { ...bilingualText, [e.target.name]: e.target.value };
    setBilingualText(newData);
    onChange({ target: { name, value: newData } });
  }
  
  return (
    <div>
      <h5>{label}</h5>
      <div>
        <TextField
          name={"en"}
          fullWidth
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">EN</InputAdornment>
            ),
          }}
          multiline={multiline}
        />
      </div>
      <div>
        <TextField
          fullWidth
          name={"fr"}
          onChange={handleChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">FR</InputAdornment>
            ),
          }}
          multiline={multiline}
        />
      </div>
    </div>
  );
};
const areEqual = (prevProps, nextProps) => prevProps.value === nextProps.value;
export default React.memo(BilingualTextInput, areEqual);
