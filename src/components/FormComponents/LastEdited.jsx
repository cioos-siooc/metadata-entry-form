import React from "react";
import TimeAgo from "javascript-time-ago";
import { useParams } from "react-router-dom";

import en from "javascript-time-ago/locale/en";
import fr from "javascript-time-ago/locale/fr";
import { En, Fr, I18n } from "../I18n";

const LastEdited = ({ dateStr }) => {
  const { language } = useParams();

  if (!dateStr) return null;

  let timeAgo;

  if (language === "en") {
    TimeAgo.addLocale(en);
    timeAgo = new TimeAgo("en-US");
  } else {
    TimeAgo.addLocale(fr);
    timeAgo = new TimeAgo("fr-FR");
  }

  return (
    <span>
      <I18n>
        <En>Last edited</En>
        <Fr>Dernière modification</Fr>
      </I18n>{" "}
      {timeAgo.format(new Date(dateStr))}
      {". "}
    </span>
  );
};

export default LastEdited;
