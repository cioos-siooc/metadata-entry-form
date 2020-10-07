import React from "react";

import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import { TextField } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { keywordLists } from "../../keywordLists";
import BilingualTextInput from "./BilingualTextInput";

const KeywordsInput = ({ onChange, value, name }) => {
  const { language } = useParams();

  function cleanList(list) {
    return list
      .map((item) => item.trim())
      .filter((item, i, arr) => item && arr.indexOf(item) === i);
  }

  function handleHelperChange(event, selectedValue) {
    if (selectedValue) {
      const newValue = { en: [], fr: [] };

      const selectedIndex = keywordLists[language].includes(selectedValue)
        ? keywordLists[language].indexOf(selectedValue)
        : -1;

      ["en", "fr"].forEach((l) => {
        const keywordList = value[l];
        if (selectedIndex >= 0) {
          keywordList.push(keywordLists[l][selectedIndex]);
        } else {
          keywordList.push(selectedValue);
        }
        newValue[l] = cleanList(keywordList);
      });

      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
  }

  return (
    <div>
      <Autocomplete
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
        options={keywordLists[language]}
        getOptionLabel={(option) => option}
        style={{ width: 400 }}
        renderInput={(params) => (
          <TextField
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...params}
            label="keyword entry helper"
            variant="outlined"
          />
        )}
      />
      <BilingualTextInput
        name="keywords"
        value={{
          en: value.en.join(","),
          fr: value.fr.join(","),
        }}
        onChange={(e) => {
          onChange({
            target: {
              name,
              value: {
                en: e.target.value.en.split(","),
                fr: e.target.value.fr.split(","),
              },
            },
          });
        }}
        onBlur={(e) => {
          onChange({
            target: {
              name,
              value: {
                en: cleanList(e.target.value.en.split(",")),
                fr: cleanList(e.target.value.fr.split(",")),
              },
            },
          });
        }}
        required="either"
      />
    </div>
  );
};

export default KeywordsInput;
