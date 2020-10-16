import React, { useState } from "react";

import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import { TextField, Button, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { ArrowDownward } from "@material-ui/icons";
import { keywordLists } from "../../keywordLists";
import BilingualTextInput from "./BilingualTextInput";

const KeywordsInput = ({ onChange, value = { en: [], fr: [] }, name }) => {
  const { language } = useParams();
  const [selectedKeyword, setKeyword] = useState("");

  function cleanList(list) {
    return list
      .map((item) => item.trim())
      .filter((item, i, arr) => item && arr.indexOf(item) === i);
  }

  function handleHelperChange() {
    const selectedValue = selectedKeyword;
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
    setKeyword("");
  }

  return (
    <Grid container spacing={3} direction="column">
      <Grid container spacing={3} direction="row">
        <Grid item xs={6}>
          <Autocomplete
            style={{ paddingLeft: "10px" }}
            onChange={(e, keyword) => setKeyword(keyword)}
            filterOptions={(options, params) => {
              const filtered = createFilterOptions()(options, params);

              if (params.inputValue !== "") {
                filtered.push(params.inputValue);
              }

              return filtered;
            }}
            value={selectedKeyword}
            selectOnFocus
            clearOnBlur
            freeSolo
            handleHomeEndKeys
            renderOption={(option) => option}
            options={keywordLists[language]}
            getOptionLabel={(option) => option}
            fullWidth
            renderInput={(params) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                label="keyword entry helper"
                variant="outlined"
              />
            )}
          />
        </Grid>
        <Grid item xs>
          <Button
            disabled={Boolean(!selectedKeyword)}
            startIcon={<ArrowDownward />}
            onClick={handleHelperChange}
          >
            Add
          </Button>
        </Grid>
      </Grid>
      <Grid item xs>
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
                  en: e.target.value.en.split(",").filter((ele) => ele),
                  fr: e.target.value.fr.split(",").filter((ele) => ele),
                },
              },
            });
          }}
          onBlur={(e) => {
            onChange({
              target: {
                name,
                value: {
                  en: cleanList(e.target.value.en.split(",")).filter(
                    (ele) => ele
                  ),
                  fr: cleanList(e.target.value.fr.split(",")).filter(
                    (ele) => ele
                  ),
                },
              },
            });
          }}
          required="either"
        />
      </Grid>
    </Grid>
  );
};

export default KeywordsInput;
