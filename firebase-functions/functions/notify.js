const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { notificationsGmailAuth } = require("./hooks-auth");
const { mailOptionsReviewer, mailOptionsAuthor } = require("./mailoutText");
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
      const authorUserInfoFB = await db
        .ref(`/${region}/users/${userID}/userinfo`)
        .once("value");
      const authorUserInfo = authorUserInfoFB.toJSON();

      const authorEmail = authorUserInfo.email;

      if (reviewers.includes(authorEmail)) {
        console.log("Author is a reviewer, don't notifiy other reviewers");
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

      // returning result

      transporter.sendMail(mailOptionsReviewer, (e, info) => {
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
    // The userID of the author
    // We don't know the user ID of the publisher
    const { region, userID, recordID } = context.params;
    if (after.val() === "published") {
      const reviewersFirebase = await db
        .ref(`/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase
        ? Object.values(reviewersFirebase.toJSON()).map((e) => e)
        : [];

      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      const authorUserInfoFB = await db
        .ref(`/${region}/users/${userID}/userinfo`)
        .once("value");
      const authorUserInfo = authorUserInfoFB.toJSON();

      const authorEmail = authorUserInfo.email;

      if (reviewers.includes(authorEmail)) {
        console.log("Author is a reviewer, don't notifiy author");
        return;
      }

      console.log("Emailing ", authorEmail);

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        console.log(`No title found for record ${recordID}`);
        return;
      }
      // getting dest email by query string

      // returning result

      transporter.sendMail(mailOptionsAuthor, (e, info) => {
        console.log(info);
        if (e) {
          console.log(e);
        }
      });
    }
  });
