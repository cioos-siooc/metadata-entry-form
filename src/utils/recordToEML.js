import templatePath from "./emlTemplate.j2";

const nunjucks = require("nunjucks");

// get the full goos eov name here
// function translateEOV() {}
function arrayOverlap(a, b) {
  return a.some((e) => b.includes(e));
}
function getFirstName(x) {
  const names = x.split(" ");
  if (names) return names.slice(-1);
}

function getLastName(x) {
  const names = x.split(" ");
  if (names) return names[0];
}
function translateRole(isoRoles) {
  console.log(isoRoles);
  return isoRoles;
}

async function recordToEML(record) {
  nunjucks.configure({ autoescape: true, web: true });

  const templateXML = await fetch(templatePath).then((t) => t.text());

  return nunjucks.renderString(templateXML, {
    record,
    getFirstName,
    getLastName,
    translateRole,
    arrayOverlap,
  });
}

export default recordToEML;
