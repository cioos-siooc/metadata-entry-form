import React, { useState } from "react";

import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import { TextField, Button, Grid } from "@material-ui/core";
import { useParams } from "react-router-dom";
import { ArrowDownward } from "@material-ui/icons";
import keywordList from "../../keywordList";
import BilingualTextInput from "./BilingualTextInput";
import { En, Fr } from "../I18n";
import translate from "../../utils/i18n";

const KeywordsInput = ({
  onChange,
  value = { en: [], fr: [] },
  name,
  disabled,
}) => {
  const { language } = useParams();
  const [selectedKeyword, setKeyword] = useState("");

  function cleanList(list) {
    return list
      .map((item) => item.trim())
      .filter((item, i, arr) => item && arr.indexOf(item) === i);
  }

  function handleHelperChange() {
    if (selectedKeyword) {
      const newValue = { en: [], fr: [] };

      ["en", "fr"].forEach((l) => {
        const userKeywordList = value[l];
        userKeywordList.push(translate(selectedKeyword, l));

        newValue[l] = cleanList(userKeywordList);
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
            disabled={disabled}
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
            renderOption={(option) => translate(option, language)}
            options={keywordList}
            getOptionLabel={(option) => translate(option, language)}
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
            disabled={disabled || Boolean(!selectedKeyword)}
            startIcon={<ArrowDownward />}
            onClick={handleHelperChange}
          >
            <En>Add</En>
            <Fr>Ajouter</Fr>
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
          disabled={disabled}
          translationButonDisabled
        />
      </Grid>
    </Grid>
  );
};

export default KeywordsInput;
