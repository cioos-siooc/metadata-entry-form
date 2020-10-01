import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import BilingualTextInput from "./BilingualTextInput";
import React from "react";
import { TextField } from "@material-ui/core";
import { keywordLists } from "../../keywordLists";
import { useParams } from "react-router-dom";

const KeywordsInput = ({ onChange, value, name }) => {
  const { language } = useParams();

  function handleHelperChange(event, selectedValue) {
    if (selectedValue && selectedValue.trim()) {
      let newValue = { en: "", fr: "" };

      let selectedIndex = keywordLists[language].includes(selectedValue)
        ? keywordLists[language].indexOf(selectedValue)
        : -1;

      ["en", "fr"].forEach((l) => {
        let keywordList = value[l].split(",").filter((item) => item);
        if (selectedIndex >= 0) {
          keywordList.push(keywordLists[l][selectedIndex]);
        } else {
          keywordList.push(selectedValue);
        }
        newValue[l] = keywordList.join(",");
      });

      onChange({
        target: {
          name: name,
          value: newValue,
        },
      });
    }
  }

  return (
    <div>
      <Autocomplete
        language={useParams().language}
        onChange={handleHelperChange}
        filterOptions={(options, params) => {
          const filtered = createFilterOptions()(options, params);

          if (params.inputValue !== "") {
            filtered.push(params.inputValue);
          }

          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        freeSolo
        handleHomeEndKeys
        renderOption={(option) => option}
        id="keyword-autocomplete"
        options={keywordLists[language]}
        getOptionLabel={(option) => option}
        style={{ width: 400 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="keyword entry helper"
            variant="outlined"
          />
        )}
      />
      <BilingualTextInput
        name="keywords"
        value={value}
        onChange={(e) => {
          onChange(e);
        }}
        required="either"
      />
    </div>
  );
};

export default KeywordsInput;
