import xmlescape from "xml-escape";
import licenses from "./licenses";
import { getRecordFilename } from "./misc";
import { generateCitation } from "../components/FormComponents/ApaPreview";

function isoStrToDate(isoStr) {
  return isoStr.slice(0, 10);
}
function arrayOverlap(a, b) {
  return a.some((e) => b.includes(e));
}

function recordToERDDAP(record) {
  const { contacts, language: lang } = record;

  // if there are multiple publishers or creators, this takes first one
  const publisher = contacts.find((c) =>
    arrayOverlap(c.role, ["publisher", "custodian"])
  );
  const creator = contacts.find((c) =>
    arrayOverlap(c.role, ["orginator", "owner"])
  );

  const attributes = {
    citation: generateCitation(record, record.language, "text"),
    creator_email: creator?.indEmail,
    creator_name: creator?.indName,
    creator_url: creator?.orgURL,
    creator_institution: creator?.orgName,
    // creator_type:

    publisher_email: publisher?.indEmail,
    publisher_institution: publisher?.orgName,
    publisher_url: publisher?.orgURL,
    publisher_name: publisher?.indName,
    // publisher_type:

    date_created: isoStrToDate(record.created),
    // date_issued:
    // date_metadata_modified:

    geospatial_lat_max: record.map?.north,
    geospatial_lat_min: record.map?.south,
    geospatial_lon_max: record.map?.east,
    geospatial_lon_min: record.map?.west,
    geospatial_vertical_min: record.verticalExtentMin,
    geospatial_vertical_max: record.verticalExtentMax,
    institution: contacts
      .map((c) => c.orgName)
      .filter((e) => e)
      .join(),
    project: record.projects?.join(),
    product_version: record.edition,
    license: licenses[record.license]?.url || record.license,
    instrument: record.instruments
      .map((i) => [i.manufacturer, i.id, i.version].join(" - "))
      .filter((e) => e)
      .join(),
    id: record.identifier,
    naming_authority: "ca.cioos",
    references: `https://doi.org/${record.datasetIdentifier}`,
    keywords: record.keywords[lang],
    platform: record.platform,
    platform_vocabulary:
      record.platform && "http://vocab.nerc.ac.uk/collection/L06/current/",
    summary: record.abstract[lang],
    title: record.title[lang],
  };
  const attributesStr = Object.entries(attributes)
    .filter(([, v]) => v)
    .map(([k, v]) => `  <att name="${k}">${xmlescape(String(v))}</att>`)
    .join("\n");

  return `
<iso19115File>/your/waf/${
    record.filename || getRecordFilename(record)
  }.xml</iso19115File>
<addAttributes>
${attributesStr}
</addAttributes>`;
}

export default recordToERDDAP;
