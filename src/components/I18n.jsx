import React from "react";
import { useParams } from "react-router-dom";

export const GetLanguage = () => {
  const { language } = useParams();
  return language;
};

export const En = ({ children }) => {
  const { language } = useParams();
  return language === "en" && <>{children}</>;
};

export const Fr = ({ children }) => {
  const { language } = useParams();
  return language === "fr" && <>{children}</>;
};

// Just returns text "en" or "fr"
export const I18n = ({ en, fr }) => {
  const { language = "en" } = useParams();
  return language === "en" ? en : fr;
};

export const getValueinFirstLanguage = (obj) => {
  // obj is,eg,  {en:"sun",fr:"soleil"}
  // return field in first language found
  return Object.values(obj).find(() => true);
};
