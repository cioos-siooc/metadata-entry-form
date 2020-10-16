import React from "react";
import { useParams } from "react-router-dom";

export const primaryLanguage = "en";

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
