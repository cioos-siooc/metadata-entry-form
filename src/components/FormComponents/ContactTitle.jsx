import React from "react";

import { I18n } from "../I18n";

/* Functions used to format text in the contact page, left column */

// creates text from a contact in the form
// <organization> - <individual name>
function getContactTitleFromNames(contact) {
  const { orgName, givenNames, lastName } = contact;
  const titleParts = [
    [lastName, givenNames].filter((e) => e).join(", "),
    orgName,
  ];

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
