import React, { useCallback, useState } from "react";

import {
  TextField,
  Button,
  Grid,
  Chip,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { ArrowDownward } from "@mui/icons-material";
import keywordList from "../../utils/keywords";
import { En, Fr, I18n } from "../I18n";

function translate(word, toLang = "fr") {
  if (!word) return "";
  const fromLang = toLang === "fr" ? "en" : "fr";
  const foundWord = keywordList.find((e) => e && e[fromLang] === word);
  if (foundWord) return foundWord[toLang];
  return "";
}

const KeywordsInput = ({
  onChange,
  value = { en: [], fr: [] },
  name,
  disabled,
}) => {
  const { language } = useParams();
  const [selectedKeyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedKeywordAltLang, setSelectedKeywordAltLang] = useState("");

  const languages = ["en", "fr"];

  if (language === "fr") languages.reverse();
  const altLanguage = languages[1];

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
          (keyword) => keyword !== chipText,
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
  const handleHelperChange = useCallback(() => {
    const keyword = selectedKeyword || inputValue;
    if (keyword || selectedKeywordAltLang) {
      const newValue = { en: value.en, fr: value.fr };

      const userKeywordList = [...value[language], keyword];
      const userKeywordListAlt = [
        ...value[altLanguage],
        selectedKeywordAltLang,
      ];

      if (keyword) newValue[language] = cleanList(userKeywordList);
      if (selectedKeywordAltLang)
        newValue[altLanguage] = cleanList(userKeywordListAlt);

      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
    setKeyword("");
    setSelectedKeywordAltLang("");
    setInputValue("");
  }, [selectedKeyword, inputValue, selectedKeywordAltLang, language]);

  return (
    <Grid container spacing={3} direction="column">
      <Grid>
        <Autocomplete
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue);
          }}
          disabled={disabled}
          onChange={(e, keyword) =>
            setSelectedKeywordAltLang(translate(keyword, altLanguage))
          }
          value={selectedKeyword || ""}
          freeSolo
          options={keywordList
            .sort((a, b) => a[language].localeCompare(b[language]))
            .map((e) => e[language])}
          fullWidth
          renderInput={(params) => (
            <TextField {...params} label={language.toUpperCase()} />
          )}
        />
      </Grid>
      <Grid>
        <TextField
          value={selectedKeywordAltLang || ""}
          onChange={(e) => setSelectedKeywordAltLang(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {altLanguage.toUpperCase()}
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid size={3}>
        <Button
          disabled={
            disabled ||
            (!selectedKeyword && !selectedKeywordAltLang && !inputValue)
          }
          startIcon={<ArrowDownward />}
          onClick={handleHelperChange}
        >
          <I18n>
            <En>Add</En>
            <Fr>Ajouter</Fr>
          </I18n>
        </Button>
      </Grid>

      <Grid>
        {languages
          .filter((lang) => value[lang]?.length)
          .map((lang) => (
            <div style={{ margin: "15px" }} key={lang}>
              <InputAdornment position="start" style={{ margin: "10px" }}>
                {lang.toUpperCase()}
              </InputAdornment>
              <Grid container direction="row">
                <Grid>
                  {(value[lang] || []).map((keyword, i) => (
                    <Chip
                      key={i}
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
    </Grid>
  );
};

export default KeywordsInput;
