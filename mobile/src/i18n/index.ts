/**
 * UI localisation.
 *
 * A real catalogue rather than the web SPA's approach, where `<I18n en fr>`
 * elements are inlined into components and the language is a react-router URL
 * param. That does not port, and it cannot be reviewed by a translator.
 *
 * Note the distinction the SPA already draws and this must preserve: the UI
 * language is not `record.language`, which is the dataset's own primary
 * language and part of the record's content.
 *
 * Controlled-vocabulary text — EOV labels, platform types, role codes — is NOT
 * in these catalogues. It stays as data in @cioos/shared and is read through
 * `localized()`.
 */
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const isSupported = (tag: string | undefined): tag is Language =>
  SUPPORTED_LANGUAGES.includes(tag as Language);

/** First supported device language, else English. */
export function deviceLanguage(): Language {
  for (const locale of Localization.getLocales()) {
    if (isSupported(locale.languageCode ?? undefined)) {
      return locale.languageCode as Language;
    }
  }
  return "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: deviceLanguage(),
  fallbackLng: "en",
  interpolation: {
    // React already escapes.
    escapeValue: false,
  },
  returnNull: false,
});

export default i18n;
