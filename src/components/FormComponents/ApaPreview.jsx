import React from "react";

import Cite from "citation-js";

function APAPreview({ record, language }) {
  const {
    title,
    datasetIdentifier = "",
    created,
    contacts = [],
    datePublished,
  } = record;
  
  const publishers = contacts
    .filter(
      (contact) =>
        // citation-js crashes sometimes with single letter input for a name
        contact.inCitation && contact.role.includes("publisher")
    )
    .map((contact) => contact.orgName);

  const cslJSON = [
    {
      title: title[language],

      author: contacts
        // if only publisher is checked, it just appears in publisher section
        .filter(
          (contact) =>
            !(contact.role.includes("publisher") && contact.role.length === 1)
        )
        .filter(
          (contact) =>
            // citation-js crashes sometimes with single letter input for a name
            contact.inCitation &&
            ((contact.givenNames?.length > 1 && contact.lastName?.length > 1) ||
              contact.orgName?.length > 1)
        )

        .map((contact) => {
          if (contact.givenNames?.length > 1 && contact.lastName?.length > 1)
            return {
              given: contact.givenNames,
              family: contact.lastName,
            };
          // seems that only individuals gets cited? Wasnt sure how to get organization name in there
          return { family: contact.orgName };
        }),
      issued: { "date-parts": [[datePublished || created]] },
      publisher: publishers.join(", "),
      DOI: datasetIdentifier.replace(/https?:\/\/doi\.org\//, ""),
    },
  ];

  try {
    const data = Cite(cslJSON);

    const html = data.format("bibliography", {
      format: "html",
      template: "apa",
      lang: "en-US",
    });

    return (
      <div>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ padding: "5px" }}
        />
      </div>
    );
  } catch (e) {
    // This is needed because sometimes partly filled names, eg "Ma" cause it to crash
    return <div />;
  }
}

export default APAPreview;
