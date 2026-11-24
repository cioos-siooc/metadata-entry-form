import React, { useCallback, useState } from "react";

import {
  TextField,
  Box,
  Button,
  Chip,
  InputAdornment,
  Autocomplete,
  Stack,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { Add } from "@mui/icons-material";
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

  const canAdd =
    !disabled && (selectedKeyword || selectedKeywordAltLang || inputValue);

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
      >
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
          sx={{ flex: 1 }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={
                language === "fr"
                  ? "Choisir ou saisir un mot-clé"
                  : "Choose or type a keyword"
              }
              inputProps={{
                ...params.inputProps,
                "aria-label":
                  language === "fr"
                    ? `Mot-clé (${language.toUpperCase()})`
                    : `Keyword (${language.toUpperCase()})`,
              }}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    {language.toUpperCase()}
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        <TextField
          value={selectedKeywordAltLang || ""}
          onChange={(e) => setSelectedKeywordAltLang(e.target.value)}
          disabled={disabled}
          sx={{ flex: 1 }}
          inputProps={{
            "aria-label":
              language === "fr"
                ? `Mot-clé (${altLanguage.toUpperCase()})`
                : `Keyword (${altLanguage.toUpperCase()})`,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {altLanguage.toUpperCase()}
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          disabled={!canAdd}
          startIcon={<Add />}
          onClick={handleHelperChange}
          sx={{ flexShrink: 0, minHeight: 41 }}
        >
          <I18n>
            <En>Add</En>
            <Fr>Ajouter</Fr>
          </I18n>
        </Button>
      </Stack>

      {languages
        .filter((lang) => value[lang]?.length)
        .map((lang) => (
          <Stack
            key={lang}
            direction="row"
            alignItems="flex-start"
            spacing={1.5}
          >
            <Box
              component="span"
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "text.secondary",
                minWidth: 22,
                lineHeight: "26px",
                mt: 0.5,
              }}
            >
              {lang.toUpperCase()}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {(value[lang] || []).map((keyword, i) => (
                <Chip
                  key={i}
                  disabled={disabled}
                  label={keyword}
                  onDelete={handleDelete(keyword, lang)}
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              ))}
            </Box>
          </Stack>
        ))}
    </Stack>
  );
};

export default KeywordsInput;
