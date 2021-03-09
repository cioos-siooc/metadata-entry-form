const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { notificationsGmailAuth } = require("./hooks-auth");

/**
 * Here we're using Gmail to send
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: notificationsGmailAuth,
});
/*
Email the reviewers for the region when a form is submitted for review
*/
exports.notifyReviewer = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(async ({ after, before }, context) => {
    const db = admin.database();
    const { region, userID, recordID } = context.params;
    // Don't notify if going from published to submitted
    if (after.val() === "submitted" && !before.val()) {
      const reviewersFirebase = await db
        .ref(`/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase
        ? Object.values(reviewersFirebase.toJSON()).map((e) => e)
        : [];

      if (!reviewers.length) {
        console.log(`No reviewers found to notify for region ${region}`);
        return;
      }

      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      console.log("Emailing ", reviewers);

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        console.log(`No title found for record ${recordID}`);
        return;
      }
      // getting dest email by query string

      const mailOptionsReviewer = {
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

      // returning result

      await transporter.sendMail(mailOptionsReviewer, (e, info) => {
        console.log(info);
        if (e) {
          console.log(e);
        }
      });
    }
  });
/*
Email the user when a record is published
*/
exports.notifyUser = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(async ({ after }, context) => {
    const db = admin.database();
    const { region, userID, recordID } = context.params;
    if (after.val() === "published") {
      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      const authorEmailFB = await db
        .ref(`/${region}/users/${userID}/userinfo/email`)
        .once("value");

      const authorEmail = authorEmailFB.toJSON();

      console.log("Emailing ", authorEmail);

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        console.log(`No title found for record ${recordID}`);
        return;
      }
      // getting dest email by query string

      const mailOptionsAuthor = {
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

      // returning result

      await transporter.sendMail(mailOptionsAuthor, (e, info) => {
        console.log(info);
        if (e) {
          console.log(e);
        }
      });
    }
  });
