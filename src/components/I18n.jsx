import React, { Fragment } from "react";
import { useParams } from "react-router-dom";

export const primaryLanguage = "en";

export const En = (props) => {
  const { language } = useParams();
  return language === "en" && <Fragment>{props.children}</Fragment>;
};

export const Fr = (props) => {
  const { language } = useParams();
  return language === "fr" && <Fragment>{props.children}</Fragment>;
};

// Just returns text "en" or "fr"
export const I18n = ({ en, fr }) => {
  const { language } = useParams();
  return language === "en" ? en : fr;
};
