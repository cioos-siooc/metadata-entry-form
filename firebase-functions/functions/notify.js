const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { defineString } = require('firebase-functions/params');
const nodemailer = require("nodemailer");
const { mailOptionsReviewer, mailOptionsAuthor } = require("./mailoutText");
const createIssue = require("./issue");

/**
 * Here we're using Gmail to send
 */
const gmailUser = defineString('GMAIL_USER');
const gmailPass = defineString('GMAIL_PASS');

const gmailUserCred = process.env.GMAIL_USER || gmailUser.value()
const gmailPassCred = process.env.GMAIL_PASS || gmailPass.value()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailUserCred, pass: gmailPassCred },
});
/*
Email the reviewers for the region when a form is submitted for review
*/
// Send a test email to the calling admin's address to verify SMTP/credentials
// from a deployed environment. Throws an HttpsError on transport failure.
exports.testEmailNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token || !context.auth.token.email) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in with a verified email to send a test email.'
    );
  }

  const recipient = context.auth.token.email;
  const region = (data && data.region) || 'unknown';

  if (!gmailUserCred || !gmailPassCred) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Email credentials (GMAIL_USER / GMAIL_PASS) are not configured for this deployment.'
    );
  }

  try {
    const info = await transporter.sendMail({
      from: gmailUserCred,
      to: recipient,
      subject: `[CIOOS Metadata] Test email for region "${region}"`,
      text:
        `This is a test email from the CIOOS metadata entry form.\n\n` +
        `Region: ${region}\n` +
        `Sent at: ${new Date().toISOString()}\n\n` +
        `If you received this, the notification email pipeline is working.`,
    });
    functions.logger.info(`[testEmailNotification] Sent to ${recipient}`, { messageId: info.messageId });
    return { success: true, recipient, messageId: info.messageId };
  } catch (err) {
    functions.logger.error('[testEmailNotification] sendMail failed:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send test email.');
  }
});

exports.notifyReviewer = functions.database
  .ref("/{region}/users/{userID}/records/{recordID}/status")
  .onUpdate(async ({ after, before }, context) => {
    const db = admin.database();
    const { region, userID, recordID } = context.params;
    // Don't notify if going from published to submitted
    if (after.val() === "submitted" && !before.val()) {
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
      const titleEn = record.title && record.title.en;
      const titleFr = record.title && record.title.fr;
      const title = titleEn || titleFr;

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

      if (reviewers.includes(authorEmail)) {
        console.log("Author is a reviewer, don't notifiy other reviewers");
        return;
      }
      if (!reviewers.length) {
        console.log(`No reviewers found to notify for region ${region}`);
        return;
      }

      const authorName = authorUserInfo.displayName || "";
      const custodian = (record.contacts || []).find(
        (c) => c.role && c.role.includes("custodian")
      );
      const orgName = custodian && custodian.orgName;

      console.log("Emailing ", reviewers);
      transporter.sendMail(
        mailOptionsReviewer(
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
        ),
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
      const titleEn = record.title && record.title.en;
      const titleFr = record.title && record.title.fr;

      if (!titleEn && !titleFr) {
        console.log(`No title found for record ${recordID}`);
        return;
      }

      transporter.sendMail(
        mailOptionsAuthor(authorEmail, titleEn, titleFr, region),
        (e, info) => {
          console.log(info);
          if (e) {
            console.log(e);
          }
        }
      );
    }
  });
