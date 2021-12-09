import React from "react";

import Cite from "citation-js";

const intersection = (arrA, arrB) => arrA.filter((x) => arrB.includes(x));
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
            (contact.indName?.length > 1 || contact.orgName?.length > 1) &&
            contact.role &&
            // only these roles make it into the APA preview
            intersection(contact.role, [
              "author",
              "owner",
              "originator",
              "principalInvestigator",
            ]).length
        )
        .map((contact) => {
          if (contact.indName?.length > 1) return { name: contact.indName };
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
