import React, { useContext, useState, useEffect } from "react";
import {
  Button,
  IconButton,
  InputAdornment,
  TextField,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import TranslateIcon from "@mui/icons-material/Translate";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useParams } from "react-router-dom";
import { En, Fr, I18n } from "../I18n";
import { UserContext } from "../../providers/UserProvider";
import TranslationInfoDialog from "./TranslationInfoDialog";

// Cohere translate size limit is 5KB
const MAX_TRANSLATE_SIZE = 5000;

// Generic messages earlier versions of this form stamped on bilingual fields
// regardless of whether the translation service was actually used.
const STAMPED_MESSAGES = [
  "text translated using Cohere / texte traduit à l'aide de Cohere",
  "text translated using the Amazon translate service / texte traduit à l'aide du service de traduction Amazon",
];

// Ends up in the XML as the textGroup xlink:title. Per #551: the service is the
// "translator" when its output was kept as is, a "helper" once a person edited it.
export function composeTranslationMessage({ base, modified, verified }) {
  const role = modified ? "helper / assistant" : "translator / traducteur";
  const check = verified
    ? "human verified: yes / vérifié par un humain : oui"
    : "human verified: no / vérifié par un humain : non";
  return `${base} (${role}); ${check}`;
}

function withMessage(info) {
  return { ...info, message: composeTranslationMessage(info) };
}

// The language the translation service wrote into, independent of the UI
// language — so the verified checkbox reads the same entry in both languages.
// Entries saved before `method` existed carry only the service's message.
export function translationTarget(translations, alternateLanguage) {
  const entry = Object.entries(translations || {}).find(
    ([, info]) => info?.method === "cohere" || info?.message,
  );
  if (!entry) return { targetLang: alternateLanguage, aiInfo: undefined };
  const [targetLang, info] = entry;
  const aiInfo = info.method
    ? info
    : { method: "cohere", base: info.message, modified: false, ...info };
  return { targetLang, aiInfo };
}

// Returns the same object when nothing changed so callers can skip updates.
export function stripStampedTranslations(translations) {
  if (!translations) return translations;
  let changed = false;
  const cleaned = Object.fromEntries(
    Object.entries(translations).map(([lang, info]) => {
      if (!info?.method && STAMPED_MESSAGES.includes(info?.message)) {
        changed = true;
        return [lang, { verified: true }];
      }
      return [lang, info];
    }),
  );
  return changed ? cleaned : translations;
}

const BilingualTextInput = ({
  onChange,
  value,
  name,
  multiline,
  disabled,
  error,
  translationButonDisabled = false,
}) => {
  const { translate } = useContext(UserContext);
  const [awaitingTranslation, setAwaitingTranslation] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  const { language } = useParams();
  let languages;

  const textSizeByes = new Blob([value?.[language]]).size;
  const textTooBig = textSizeByes >= MAX_TRANSLATE_SIZE;

  if (language === "en") languages = ["en", "fr"];
  else languages = ["fr", "en"];
  const alternateLanguage = languages[1];
  const { targetLang, aiInfo } = translationTarget(
    value?.translations,
    alternateLanguage,
  );
  const translateChecked = !aiInfo || Boolean(aiInfo.verified);

  function emit(newValue) {
    onChange({ target: { name, value: newValue } });
  }

  function handleEvent(e) {
    const { name: lang, value: text } = e.target;
    const newData = { ...value, [lang]: text };
    if (lang === targetLang && text) {
      newData.translations = aiInfo
        ? { [targetLang]: withMessage({ ...aiInfo, modified: true }) }
        : { [targetLang]: { verified: true } };
    }
    emit(newData);
  }

  function handleTranslateCheckEvent(e) {
    emit({
      ...value,
      translations: {
        [targetLang]: withMessage({ ...aiInfo, verified: e.target.checked }),
      },
    });
  }

  // Older versions stamped a generic translation message on every bilingual
  // field, whether or not the translation service was used — drop those.
  useEffect(() => {
    const cleaned = stripStampedTranslations(value?.translations);
    if (cleaned !== value?.translations)
      onChange({ target: { name, value: { ...value, translations: cleaned } } });
  }, [name, onChange, value]);

  return (
    <div>
      <TranslationInfoDialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
      />
      {languages.map((lang, i) => (
        <div key={lang}>
          <TextField
            name={lang}
            fullWidth
            value={value?.[lang] || ""}
            onChange={(e) => handleEvent(e)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {lang.toUpperCase()}
                </InputAdornment>
              ),
            }}
            multiline={multiline}
            disabled={disabled}
            error={Boolean(error)}
          />
          {i === 0 && !translationButonDisabled && (
            <span>
              <Tooltip
                title={
                  <I18n
                    en="Translate english to french"
                    fr="Traduire du français en anglais"
                  />
                }
              >
                <span>
                  <Button
                    style={{ margin: "10px" }}
                    startIcon={
                      awaitingTranslation ? (
                        <CircularProgress size={20} />
                      ) : (
                        <TranslateIcon />
                      )
                    }
                    endIcon={awaitingTranslation ? null : <ArrowDownwardIcon />}
                    disabled={
                      disabled ||
                      awaitingTranslation ||
                      !value?.[lang] ||
                      textTooBig
                    }
                    onClick={() => {
                      setAwaitingTranslation(true);

                      translate({ text: value[lang], fromLang: lang }).then(
                        (result) => {
                          setAwaitingTranslation(false);
                          const data = result.data;
                          const translation =
                            typeof data === "object"
                              ? data.translatedText
                              : data;
                          const base =
                            (typeof data === "object" &&
                              data.translationMessage) ||
                            "Cohere";
                          emit({
                            ...value,
                            [alternateLanguage]: translation,
                            translations: {
                              [alternateLanguage]: withMessage({
                                method: "cohere",
                                base,
                                modified: false,
                                verified: false,
                              }),
                            },
                          });
                        },
                      );
                    }}
                  >
                    <I18n>
                      <En>Translate</En>
                      <Fr>Traduire</Fr>
                    </I18n>
                  </Button>
                </span>
              </Tooltip>
              {value?.[targetLang] && (
                <FormControlLabel
                  style={{ margin: "10px" }}
                  control={
                    <Checkbox
                      checked={translateChecked}
                      disabled={disabled || !aiInfo}
                      onChange={(e) => handleTranslateCheckEvent(e)}
                      color="primary"
                    />
                  }
                  label={
                    <I18n>
                      <En>I have verified this translation</En>
                      <Fr>J'ai vérifié cette traduction</Fr>
                    </I18n>
                  }
                />
              )}
              <Tooltip
                title={
                  <I18n
                    en="About the translation service — service, model, glossary, and how to report errors"
                    fr="À propos du service de traduction — service, modèle, glossaire et comment signaler des erreurs"
                  />
                }
              >
                <IconButton
                  onClick={() => setInfoDialogOpen(true)}
                  aria-label="about the translation service"
                  style={{ margin: "10px" }}
                >
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>

              {textTooBig && (
                <I18n>
                  <En>
                    Translation is disabled because text is larger than{" "}
                    {MAX_TRANSLATE_SIZE} characters.
                  </En>
                  <Fr>
                    La traduction est désactivée car le texte est plus grand que{" "}
                    {MAX_TRANSLATE_SIZE} caractères.
                  </Fr>
                </I18n>
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default BilingualTextInput;
