const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const { mailOptionsReviewer, mailOptionsAuthor } = require("./mailoutText");
const createIssue = require("./issue");
const { getConfigVar } = require('.serverUtils');

/**
 * Here we're using Gmail to send
 */
// const gmailUser = defineString('GMAIL_USER');
// const gmailPass = defineString('GMAIL_PASS');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: getConfigVar('GMAIL_USER'), pass: getConfigVar('GMAIL_PASS') },
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
      transporter.sendMail(
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

      transporter.sendMail(
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
