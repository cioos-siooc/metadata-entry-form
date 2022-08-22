import React from "react";

import Cite from "citation-js";

function givenNamesFormat(givenNames) {
  return givenNames
    .split(" ")
    .filter((e) => e)
    .map((e) => `${e[0].toUpperCase()}. `)
    .join(" ");
}

function APAPreview({ record, language }) {
  const {
    title,
    datasetIdentifier = "",
    created,
    contacts = [],
    datePublished,
  } = record;

  const apaData = [
    {
      title: title[language],

      author: contacts
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
              given: givenNamesFormat(contact.givenNames),
              family: contact.lastName,
            };
          // seems that only individuals gets cited? Wasnt sure how to get organization name in there
          return { family: contact.orgName };
        }),
      date: { published: datePublished || created },

      identifier: [
        {
          type: "doi",
          id: datasetIdentifier.replace(/https?:\/\/doi\.org\//, ""),
        },
      ],
      license: [
        {
          raw: record.license,
        },
      ],
    },
  ];

  try {
    const data = Cite(apaData);

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
