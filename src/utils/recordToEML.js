import templatePath from "./emlTemplate.j2";
import emlCoveragePath from "./emlCoverage.j2";
import { generateCitation } from "../components/FormComponents/ApaPreview";

const nunjucks = require("nunjucks");

// get the full goos eov name here
// function translateEOV() {}
function arrayOverlap(a, b) {
  return a.some((e) => b.includes(e));
}

function translateRole(isoRoles) {
  // console.log(isoRoles);
  return isoRoles;
}

const roleMapping = {
  creator: ["author", "originator"],
  metadataProvider: ["distributor", "custodian"],
  associatedParty: ["principalInvestigator", "editor"],
};
async function recordToEML(record) {
  nunjucks.configure(window.location.origin, { autoescape: true, web: true });

  let templateXML = await fetch(templatePath).then((t) => t.text());
  const emlCoverageXML = await fetch(emlCoveragePath).then((t) => t.text());
  templateXML = templateXML.replace("{% include 'emlCoverage.j2' %}", emlCoverageXML)
  return nunjucks.renderString(templateXML, {
    record,
    translateRole,
    arrayOverlap,
    citation: generateCitation(record, record.language, "text"),
    roleMapping,
    roleMappingKeys: Object.keys(roleMapping),
  });
}

export default recordToEML;
