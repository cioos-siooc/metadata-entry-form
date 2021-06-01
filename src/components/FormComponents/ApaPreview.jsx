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

  const apaData = [
    {
      title: title[language],

      author: contacts
        .filter((contact) => contact.role && contact.role.includes("author"))
        .map((contact) => {
          if (contact.indName) return { name: contact.indName };
          return { family: contact.orgName };
          // seems that only individuals gets cited
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

  const data = Cite(apaData);

  const html = data.format("bibliography", {
    format: "html",
    template: "apa",
    lang: "en-US",
  });

  return (
    <div>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ padding: "5px" }}
      />
    </div>
  );
}

export default APAPreview;
