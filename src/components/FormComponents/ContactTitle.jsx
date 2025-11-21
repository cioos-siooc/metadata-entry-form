import React from "react";

import { Chip } from "@material-ui/core";
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

function ContactTitle({ isDefaultContact, ...contact }) {
  const titleText = getContactTitleFromNames(contact) ||
    (<I18n en="New contact" fr="Nouveau contact" />);

  if (isDefaultContact) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {titleText}
        <Chip
          label={<I18n en="Default" fr="Défaut" />}
          size="small"
          style={{
            backgroundColor: '#e3f2fd',
            color: '#1976d2',
            fontWeight: 500,
            height: '20px',
            fontSize: '0.7rem',
          }}
        />
      </span>
    );
  }

  return titleText;
}

export default ContactTitle;
