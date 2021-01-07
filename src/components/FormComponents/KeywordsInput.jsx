import React, { useState } from "react";

import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";

import {
  TextField,
  Button,
  Grid,
  Chip,
  InputAdornment,
} from "@material-ui/core";
import { useParams } from "react-router-dom";
import { ArrowDownward } from "@material-ui/icons";
import keywordList from "../../keywordList";
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
      .map((item) => (item || "").trim())
      .filter((item, i, arr) => item && arr.indexOf(item) === i);
  }

  function handleDelete(chipText, deletedChipLang) {
    return () => {
      const newValue = {
        en: value.en,
        fr: value.fr,
        [deletedChipLang]: value[deletedChipLang].filter(
          (keyword) => keyword !== chipText
        ),
      };

      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    };
  }
  function handleHelperChange() {
    if (selectedKeyword) {
      const newValue = { en: value.en, fr: value.fr };

      const userKeywordList = [...value[language], selectedKeyword];

      newValue[language] = cleanList(userKeywordList);

      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
    setKeyword("");
  }

  const languages = ["en", "fr"];

  if (language === "fr") languages.reverse();

  const hasKeyWordsinBothLanguages =
    Object.values(value).filter((kws) => kws.length).length > 1;

  return (
    <Grid
      container
      spacing={3}
      direction="column"
      style={{ marginBottom: "10px" }}
    >
      <Grid container spacing={3} direction="row">
        <Grid item xs={6}>
          <Autocomplete
            disabled={disabled}
            style={{ paddingLeft: "10px" }}
            onInputChange={(e, keyword) => setKeyword(keyword)}
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
            renderOption={(option) => translate(option, language) || option}
            options={keywordList}
            getOptionLabel={(option) => translate(option, language) || option}
            fullWidth
            renderInput={(params) => (
              <TextField
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...params}
                label="keyword entry helper"
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
      {languages
        .filter((lang) => value[lang] && value[lang].length)
        .map((lang) => (
          <div style={{ margin: "15px" }} key={lang}>
            {hasKeyWordsinBothLanguages && (
              <InputAdornment style={{ margin: "10px" }}>
                {lang.toUpperCase()}
              </InputAdornment>
            )}
            <Grid container direction="row">
              <Grid item xs>
                {(value[lang] || []).map((keyword) => (
                  <Chip
                    key={keyword}
                    disabled={disabled}
                    label={keyword}
                    onDelete={handleDelete(keyword, lang)}
                    color="primary"
                    style={{ margin: "5px" }}
                  />
                ))}
              </Grid>
            </Grid>
          </div>
        ))}
    </Grid>
  );
};

export default KeywordsInput;
