import React from "react";

import { I18n } from "../I18n";

function getContactTitleFromNames(contact) {
  const { orgName, indName } = contact;
  const titleParts = [orgName, indName];

  return titleParts
    .filter((e) => e)
    .map((e) => e.trim())
    .filter((e) => e)
    .join(" - ");
}

function ContactTitle({ contact }) {
  return (
    getContactTitleFromNames(contact) || (
      <I18n en="New contact" fr="Nouveau contact" />
    )
  );
}

export default ContactTitle;
