// send emails to reviewers when a metadata form record is submitted for review
// this is the text that is sent in the emails

const regionNames = {
  pacific: { en: "CIOOS Pacific", fr: "SIOOC Pacifique" },
  stlaurent: {
    en: "St. Lawrence Global Observatory (SLGO)",
    fr: "Observatoire global du Saint-Laurent (OGSL)",
  },
  atlantic: { en: "CIOOS Atlantic", fr: "SIOOC Atlantique" },
  amundsen: { en: "Amundsen Science", fr: "Amundsen Science" },
  canwin: {
    en: "Canadian Watershed Information Network",
    fr: "Réseau canadien d'information sur les bassins versants",
  },
  hakai: { en: "Hakai Institute", fr: "Hakai Institute" },
  test: { en: "Test", fr: "Test" },
};

function camelToTitle(str) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function truncate(text, maxLen) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function row(label, value) {
  if (!value) return "";
  return `<tr><td><b>${label}</b></td><td>${value}</td></tr>`;
}

function mailOptionsReviewer(
  reviewers,
  titleEn,
  titleFr,
  region,
  authorName,
  authorEmail,
  abstractEn,
  abstractFr,
  eov,
  orgName,
  userID,
  recordID,
  language
) {
  const regionEn = (regionNames[region] || {}).en || region;
  const regionFr = (regionNames[region] || {}).fr || region;
  const lang = language || "en";
  const recordUrl = `https://cioos-siooc.github.io/metadata-entry-form/#/${lang}/${region}/${userID}/${recordID}`;
  const reviewerUrlEn = `https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/reviewer`;
  const reviewerUrlFr = `https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/reviewer`;

  const eovList = eov && eov.length ? eov.map(camelToTitle).join(", ") : null;
  const submittedBy = authorName
    ? `${authorName} &lt;${authorEmail}&gt;`
    : authorEmail;

  return {
    from: "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: reviewers,
    subject: "New CIOOS Metadata record to be reviewed",
    html: `
<p><b>New record submitted for review</b></p>
<table cellpadding="4">
  ${row("Title (EN)", titleEn)}
  ${row("Title (FR)", titleFr)}
  ${row("Submitted by", submittedBy)}
  ${row("Organization", orgName)}
  ${row("Region", regionEn)}
  ${row("Essential Ocean Variables", eovList)}
  ${row("Abstract (EN)", truncate(abstractEn, 400))}
  ${row("Abstract (FR)", truncate(abstractFr, 400))}
</table>
<p>
  <a href="${recordUrl}">View record</a> &nbsp;|&nbsp;
  <a href="${reviewerUrlEn}">Reviewer dashboard</a>
</p>

<hr>

<p><b>Nouveau dossier soumis pour examen</b></p>
<table cellpadding="4">
  ${row("Titre (EN)", titleEn)}
  ${row("Titre (FR)", titleFr)}
  ${row("Soumis par", submittedBy)}
  ${row("Organisation", orgName)}
  ${row("Région", regionFr)}
  ${row("Variables océaniques essentielles", eovList)}
  ${row("Résumé (EN)", truncate(abstractEn, 400))}
  ${row("Résumé (FR)", truncate(abstractFr, 400))}
</table>
<p>
  <a href="${recordUrl}">Voir l'enregistrement</a> &nbsp;|&nbsp;
  <a href="${reviewerUrlFr}">Tableau de bord réviseur</a>
</p>`,
  };
}

function mailOptionsAuthor(authorEmail, titleEn, titleFr, region) {
  return {
    from: "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: authorEmail,
    subject: "Your CIOOS metadata has been approved!",
    html: `
<p><b>Approved</b></p>
<p>Your metadata record has been approved by a reviewer.</p>
${titleEn ? `<p>Title (EN): ${titleEn}</p>` : ""}
${titleFr ? `<p>Title (FR): ${titleFr}</p>` : ""}
<p><a href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}">Go to form</a></p>

<hr>

<p><b>Approuvé</b></p>
<p>Votre enregistrement de métadonnées a été approuvé par un réviseur.</p>
${titleEn ? `<p>Titre (EN) : ${titleEn}</p>` : ""}
${titleFr ? `<p>Titre (FR) : ${titleFr}</p>` : ""}
<p><a href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}">Accéder au formulaire</a></p>`,
  };
}

module.exports = { mailOptionsReviewer, mailOptionsAuthor };
