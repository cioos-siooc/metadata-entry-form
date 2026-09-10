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

function mailOptionsAuthorSubmissionConfirmation(
  authorEmail,
  titleEn,
  titleFr,
  region
) {
  const regionEn = (regionNames[region] || {}).en || region;
  const regionFr = (regionNames[region] || {}).fr || region;

  return {
    from: "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
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

// Shared by both share emails: who sent it, what record, and where to open it.
function shareBody(titleEn, titleFr, region, ownerName, ownerEmail, userID, recordID, language) {
  const regionEn = (regionNames[region] || {}).en || region;
  const regionFr = (regionNames[region] || {}).fr || region;
  const lang = language || "en";
  const recordUrl = `https://cioos-siooc.github.io/metadata-entry-form/#/${lang}/${region}/${userID}/${recordID}`;
  const sharedBy = ownerName ? `${ownerName} &lt;${ownerEmail}&gt;` : ownerEmail;

  return {
    recordUrl,
    tableEn: `<table cellpadding="4">
  ${row("Title (EN)", titleEn)}
  ${row("Title (FR)", titleFr)}
  ${row("Shared by", sharedBy)}
  ${row("Region", regionEn)}
</table>`,
    tableFr: `<table cellpadding="4">
  ${row("Titre (EN)", titleEn)}
  ${row("Titre (FR)", titleFr)}
  ${row("Partagé par", sharedBy)}
  ${row("Région", regionFr)}
</table>`,
  };
}

// Sent when a record is shared with someone who already has an account.
function mailOptionsRecordShared(
  recipientEmail,
  titleEn,
  titleFr,
  region,
  ownerName,
  ownerEmail,
  userID,
  recordID,
  language
) {
  const { recordUrl, tableEn, tableFr } = shareBody(
    titleEn, titleFr, region, ownerName, ownerEmail, userID, recordID, language
  );

  return {
    from: "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: recipientEmail,
    subject: "A CIOOS metadata record has been shared with you",
    html: `
<p><b>A metadata record has been shared with you</b></p>
<p>You now have editing access to this record.</p>
${tableEn}
<p><a href="${recordUrl}">Open record</a></p>

<hr>

<p><b>Un enregistrement de métadonnées a été partagé avec vous</b></p>
<p>Vous avez maintenant accès en modification à cet enregistrement.</p>
${tableFr}
<p><a href="${recordUrl}">Ouvrir l'enregistrement</a></p>`,
  };
}

// Sent when a record is shared with an email address that has no account yet.
// Access is granted automatically once they sign up with this same address.
function mailOptionsShareInvitation(
  recipientEmail,
  titleEn,
  titleFr,
  region,
  ownerName,
  ownerEmail,
  userID,
  recordID,
  language
) {
  const { recordUrl, tableEn, tableFr } = shareBody(
    titleEn, titleFr, region, ownerName, ownerEmail, userID, recordID, language
  );
  const lang = language || "en";
  const signUpUrl = `https://cioos-siooc.github.io/metadata-entry-form/#/${lang}/${region}`;

  return {
    from: "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: recipientEmail,
    subject: "You have been invited to edit a CIOOS metadata record",
    html: `
<p><b>You have been invited to edit a metadata record</b></p>
${tableEn}
<p>You do not have a CIOOS Metadata Entry Form account yet. Sign in with
<b>${recipientEmail}</b> to create one — the record will be waiting for you under
"Shared with me".</p>
<p><a href="${signUpUrl}">Create an account</a> &nbsp;|&nbsp;
  <a href="${recordUrl}">Open record</a></p>

<hr>

<p><b>Vous avez été invité à modifier un enregistrement de métadonnées</b></p>
${tableFr}
<p>Vous n'avez pas encore de compte pour le formulaire de saisie de métadonnées du SIOOC.
Connectez-vous avec <b>${recipientEmail}</b> pour en créer un — l'enregistrement vous
attendra sous « Partagé avec moi ».</p>
<p><a href="${signUpUrl}">Créer un compte</a> &nbsp;|&nbsp;
  <a href="${recordUrl}">Ouvrir l'enregistrement</a></p>`,
  };
}

module.exports = {
  regionNames,
  mailOptionsReviewer,
  mailOptionsAuthor,
  mailOptionsAuthorSubmissionConfirmation,
  mailOptionsRecordShared,
  mailOptionsShareInvitation,
};
