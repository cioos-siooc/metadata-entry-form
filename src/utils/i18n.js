import enToFr from "./i18nDictionaryFr";

const translate = (key, locale = "en") => {
  if (locale === "en") return key;

  return enToFr[key] || null;
};

export default translate;
