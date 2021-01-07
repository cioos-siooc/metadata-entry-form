import React from "react";
import TimeAgo from "javascript-time-ago";

import en from "javascript-time-ago/locale/en";
import fr from "javascript-time-ago/locale/fr";

import { Fr, En, GetLanguage } from "./I18n";

const LastEdited = ({ dateStr }) => {
  let timeAgo;
  const language = GetLanguage();
  if (language === "en") {
    TimeAgo.addLocale(en);
    timeAgo = new TimeAgo("en-US");
  } else {
    TimeAgo.addLocale(fr);
    timeAgo = new TimeAgo("fr-FR");
  }

  return (
    <span>
      <En>Last edited</En>
      <Fr>Dernière édition</Fr> {timeAgo.format(new Date(dateStr))}
      {". "}
    </span>
  );
};

export default LastEdited;
