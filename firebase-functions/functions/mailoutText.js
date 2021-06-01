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
module.exports = { mailOptionsReviewer, mailOptionsAuthor };
