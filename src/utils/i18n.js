import fr from "../i18nDictionaryFr";
import en from "../i18nDictionaryEn";

const translate = (textOrCode, locale = null, context = "") => {
  const dictionary = locale === "fr" ? fr : en;
  let key = textOrCode;

  if (context) key = `[${context}]${textOrCode}`;

  if (dictionary[key]) {
    return dictionary[key];
  }

  if (dictionary[textOrCode]) {
    return dictionary[textOrCode];
  }

  return textOrCode;
};

export default translate;
