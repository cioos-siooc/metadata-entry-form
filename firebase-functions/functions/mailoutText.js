// send emails to reviwers when a metadata form record is submitted for review
// this is the text that is sent in the emails
function mailOptionsReviewer(reviewers, title, region) {
  return {
    from:
      "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: reviewers,
    subject: "New CIOOS Metadata record to be reviewed", // email subject
    html: `<div>
                      <p style="font-size: 16px;">New record submitted!</p>
                      A metadata record in your region has been completed and submitted
                      for your review. The title is "${title}". You can login and approve the record at
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/reviewer">https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/reviewer</a>
                  </div>
                  <div>
                      <hr>
                  </div>
                  <div>
                      <p style="font-size: 16px;">Nouveau dossier soumis!</p>
                      Un enregistrement de métadonnées dans votre région a été complété et soumis pour examen. Le titre est "${title}". Vous pouvez vous connecter
                      et approuver l'enregistrement sur
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/reviewer">https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/reviewer</a>
                  </div>
            `, // email content in HTML
  };
}

function mailOptionsAuthor(authorEmail, title, region) {
  return {
    from:
      "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: authorEmail,
    subject: "Your CIOOS metadata has been approved!", // email subject
    html: `<div>
                  <div>
                      <p style="font-size: 16px;">Approved</p>
                      Your metadata record titled "${title}" has been approved by a reviewer.
                  </div>
                  <div>
                      <a
                          href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}">https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}</a>

                  </div>
                  <div>
                      <hr>
                  </div>
                  <div>
                      <p style="font-size: 16px;">Approuvé</p>
                      Votre enregistrement de métadonnées intitulé "${title}" a été approuvé par un réviseur.

                  </div>
                  <div>
                      <a
                          href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}">https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}</a>
                  </div>
              </div>`, // email content in HTML
  };
}
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mailOptionsShareNotice(recipientEmail, authorName, title, region) {
  const safeAuthor = escapeHtml(authorName);
  const safeTitle = escapeHtml(title);
  return {
    from:
      "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: recipientEmail,
    subject: "A CIOOS metadata record has been shared with you",
    html: `<div>
                      <p style="font-size: 16px;">A record has been shared with you</p>
                      ${safeAuthor} has shared the metadata record "${safeTitle}" with you for editing.
                      You can access it from the "Shared with me" page at
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/shared">https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}/shared</a>
                  </div>
                  <div>
                      <hr>
                  </div>
                  <div>
                      <p style="font-size: 16px;">Un enregistrement a été partagé avec vous</p>
                      ${safeAuthor} a partagé l'enregistrement de métadonnées "${safeTitle}" avec vous pour modification.
                      Vous pouvez y accéder depuis la page « Partagé avec moi » à
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/shared">https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}/shared</a>
                  </div>
            `,
  };
}

function mailOptionsShareInvite(recipientEmail, authorName, title, region) {
  const safeAuthor = escapeHtml(authorName);
  const safeTitle = escapeHtml(title);
  return {
    from:
      "CIOOS Metadata Notifications <cioos.metadata.notifications@gmail.com>",
    to: recipientEmail,
    subject:
      "You've been invited to collaborate on a CIOOS metadata record",
    html: `<div>
                      <p style="font-size: 16px;">You've been invited to collaborate</p>
                      ${safeAuthor} has invited you to collaborate on the CIOOS metadata record "${safeTitle}".
                      Sign in with this email address at
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}">https://cioos-siooc.github.io/metadata-entry-form/#/en/${region}</a>
                      and the record will appear under "Shared with me".
                  </div>
                  <div>
                      <hr>
                  </div>
                  <div>
                      <p style="font-size: 16px;">Vous avez été invité à collaborer</p>
                      ${safeAuthor} vous a invité à collaborer sur l'enregistrement de métadonnées CIOOS "${safeTitle}".
                      Connectez-vous avec cette adresse e-mail à
                      <a href="https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}">https://cioos-siooc.github.io/metadata-entry-form/#/fr/${region}</a>
                      et l'enregistrement apparaîtra sous « Partagé avec moi ».
                  </div>
            `,
  };
}

module.exports = {
  mailOptionsReviewer,
  mailOptionsAuthor,
  mailOptionsShareNotice,
  mailOptionsShareInvite,
};
