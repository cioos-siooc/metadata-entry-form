// Port of firebase-functions/functions/mailoutText.js.
// Email subject/body templates (bilingual) for record submission/publication
// notifications. Only change from the original: the from-address comes from
// config.smtp.from instead of the hardcoded gmail account.

const config = require("../config");

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

function row(label, value) {
  if (!value) return "";
  return `<tr><td><b>${label}</b></td><td>${value}</td></tr>`;
}

function fromAddress() {
  return config.smtp.from;
}

function mailOptionsReviewer(
  reviewers,
  titleEn,
  titleFr,
  region,
  authorName,
  authorEmail,
  orgName,
  userID,
  recordID,
  language,
) {
  const regionEn = (regionNames[region] || {}).en || region;
  const regionFr = (regionNames[region] || {}).fr || region;
  const lang = language || "en";
  const recordUrl = `https://cioos-siooc.github.io/metadata-entry-form/#/${lang}/${region}/${userID}/${recordID}`;
  const reviewerUrlEn = `https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/reviewer`;
  const reviewerUrlFr = `https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/reviewer`;

  const submittedBy = authorName ? `${authorName} &lt;${authorEmail}&gt;` : authorEmail;

  return {
    from: fromAddress(),
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
</table>
<p>
  <a href="${recordUrl}">Voir l'enregistrement</a> &nbsp;|&nbsp;
  <a href="${reviewerUrlFr}">Tableau de bord réviseur</a>
</p>`,
  };
}

function mailOptionsAuthorSubmissionConfirmation(authorEmail, titleEn, titleFr, region) {
  const regionEn = (regionNames[region] || {}).en || region;
  const regionFr = (regionNames[region] || {}).fr || region;

  return {
    from: fromAddress(),
    to: authorEmail,
    subject: "Your CIOOS metadata record has been submitted",
    html: `
<p><b>Submission received</b></p>
<p>Thank you for submitting your metadata record. ${regionEn} has been notified and will contact you if additional information is needed before your record is published.</p>
${titleEn ? `<p>Title (EN): ${titleEn}</p>` : ""}
${titleFr ? `<p>Title (FR): ${titleFr}</p>` : ""}
<p><a href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}">Go to form</a></p>

<hr>

<p><b>Soumission reçue</b></p>
<p>Merci d'avoir soumis votre enregistrement de métadonnées. ${regionFr} a été avisé et vous contactera si des informations supplémentaires sont nécessaires avant la publication de votre enregistrement.</p>
${titleEn ? `<p>Titre (EN) : ${titleEn}</p>` : ""}
${titleFr ? `<p>Titre (FR) : ${titleFr}</p>` : ""}
<p><a href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}">Accéder au formulaire</a></p>`,
  };
}

function mailOptionsAuthor(authorEmail, titleEn, titleFr, region) {
  return {
    from: fromAddress(),
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

module.exports = {
  mailOptionsReviewer,
  mailOptionsAuthor,
  mailOptionsAuthorSubmissionConfirmation,
};
