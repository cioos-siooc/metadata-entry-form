import React from "react";
import { useParams } from "react-router-dom";

const spanInLanguage = (lang) => ({ children }) => {
  const { language } = useParams();
  return language === lang && <>{children}</>;
};

export const En = spanInLanguage("en");
export const Fr = spanInLanguage("fr");

/* 
  This component can be used with attributes only, eg
  <I18n en="boat" fr="bateau"/>

  Or as a container for the <En> and <Fr> tags

  Eg:

  <I18n>
    <En>rabbit</En>
    <Fr>lapin</Fr>
  </I18n>
*/

export const I18n = (props) => {
  const { en, fr, children } = props;
  const { language = "en" } = useParams();

  // If this component used via attributes
  if (en || fr) {
    if (en && fr) return language === "en" ? en : fr;
    // eslint-disable-next-line no-console
    console.error("Tag missing french or english!");
    return null;
  }

  if (Array.isArray(children) && children.length !== 2) {
    // eslint-disable-next-line no-console
    console.error(props, "Tag missing french or english!");
  }

  return children;
};
