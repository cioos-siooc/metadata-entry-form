const { onValueUpdated } = require("firebase-functions/v2/database");
const { defineString } = require('firebase-functions/params');
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { mailOptionsReviewer, mailOptionsAuthor } = require("./mailoutText");
const createIssue = require("./issue");

/**
 * Here we're using Gmail to send
 */
const gmailUser = defineString('GMAIL_USER');
const gmailPass = defineString('GMAIL_PASS');

// Lazy initialization - transporter created on first use
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || gmailUser.value(),
        pass: process.env.GMAIL_PASS || gmailPass.value(),
      },
    });
  }
  return transporter;
}
/*
Email the reviewers for the region when a form is submitted for review
*/
exports.notifyReviewer = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  async (event) => {
    const db = admin.database();
    const { region, userID, recordID } = event.params;
    const before = event.data.before.val();
    const after = event.data.after.val();

    // Don't notify if going from published to submitted
    if (after === "submitted" && !before) {
      const reviewersFirebase = await db
        .ref(`/admin/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase.val().split(",");

      const authorUserInfoFB = await db
        .ref(`/${region}/users/${userID}/userinfo`)
        .once("value");
      const authorUserInfo = authorUserInfoFB.toJSON();

      const authorEmail = authorUserInfo.email;

      const recordFB = await db
        .ref(`/${region}/users/${userID}/records/${recordID}`)
        .once("value");

      const record = recordFB.toJSON();
      const { language } = record;
      const title = record.title[language];

      if (!title) {
        console.log(`No title found for record ${recordID}`);
        return;
      }
      console.log("region", region);

      if (region === "hakai" && !title.includes("JUST TESTING")) {
        console.log("Creating github issue");
        await createIssue(
          title,
          `https://cioos-siooc.github.io/metadata-entry-form/#/${language}/${region}/${userID}/${recordID}`
        );
      }
      // getting dest email by query string

      // returning result
      if (reviewers.includes(authorEmail)) {
        console.log("Author is a reviewer, don't notifiy other reviewers");
        return;
      }
      if (!reviewers.length) {
        console.log(`No reviewers found to notify for region ${region}`);
        return;
      }
      console.log("Emailing ", reviewers);
      getTransporter().sendMail(
        mailOptionsReviewer(reviewers, title, region),
        (e, info) => {
          console.log(info);
          if (e) {
            console.log(e);
          }
        }
      );
    }
  });
/*
Email the user when a record is published
*/
exports.notifyUser = onValueUpdated(
  "/{region}/users/{userID}/records/{recordID}/status",
  async (event) => {
    const db = admin.database();
    // The userID of the author
    // We don't know the user ID of the publisher
    const { region, userID, recordID } = event.params;
    const after = event.data.after.val();

    if (after === "published") {
      const reviewersFirebase = await db
        .ref(`/admin/${region}/permissions/reviewers`)
        .once("value");

      const reviewers = reviewersFirebase.val().split(",");

      if (!reviewers.length) {
        console.log("No reviewers for region", region);
        return;
      }
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

      getTransporter().sendMail(
        mailOptionsAuthor(authorEmail, title, region),
        (e, info) => {
          console.log(info);
          if (e) {
            console.log(e);
          }
        }
      );
    }
  });
