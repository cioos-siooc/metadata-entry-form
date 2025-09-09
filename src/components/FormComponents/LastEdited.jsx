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

  const dateObj = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - dateObj.getTime();
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

  let displayStr;
  if (diffMs > twoDaysMs) {
    // Use locale-sensitive absolute date (YYYY-MM-DD style for clarity)
    const options = { year: "numeric", month: "short", day: "2-digit" };
    displayStr = dateObj.toLocaleDateString(
      language === "fr" ? "fr-CA" : "en-CA",
      options
    );
  } else {
    displayStr = timeAgo.format(dateObj);
  }

  return (
    <span>
      <I18n>
        <En>Last edited</En>
        <Fr>Dernière modification</Fr>
      </I18n>{" "}
      {displayStr}
      {". "}
    </span>
  );
};

export default LastEdited;
