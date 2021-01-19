import enToFr from "./i18nDictionaryFr";

const translate = (key, toLang = "en") => {
  if (toLang === "en") return key;

  return enToFr[key] || null;
};

export default translate;
