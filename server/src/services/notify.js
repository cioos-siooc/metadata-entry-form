// Port of firebase-functions/functions/notify.js as plain functions.
// The RTDB triggers (notifyReviewer / notifyUser) became notifySubmitted /
// notifyPublished, called from recordHooks on status transitions.
// Reviewer emails come from the region_permissions table (role='reviewer')
// instead of /admin/{region}/permissions/reviewers; author info rides along
// on the record as record.userinfo (set by the routes).

const { query } = require("../db");
const {
  mailOptionsReviewer,
  mailOptionsAuthor,
  mailOptionsAuthorSubmissionConfirmation,
} = require("./mailoutText");
const createIssue = require("./issue");
const { getTransporter } = require("../lib/mailer");

// RTDB returned sparse arrays as objects keyed by index, so the original
// coerced contacts (and a contact's role) with Object.values. Postgres
// records store real arrays, but keep the coercion — migrated data may
// retain the object shape.
function findCustodianOrgName(record) {
  const contacts = Object.values((record && record.contacts) || {});
  const custodian = contacts.find((c) => Object.values((c && c.role) || {}).includes("custodian"));
  return custodian && custodian.orgName;
}

async function getReviewerEmails(region) {
  const result = await query(
    "SELECT email FROM region_permissions WHERE region = $1 AND role = 'reviewer' ORDER BY email",
    [region],
  );
  return result.rows.map((r) => r.email);
}

/*
Email the reviewers for the region (and confirmation to the author) when a
record is submitted for review. Also opens the hakai review GitHub issue.
Mirrors notifyReviewer.
*/
async function notifySubmitted({ region, record, authorUserinfo, reviewerEmails, log = console }) {
  const author = authorUserinfo || record.userinfo || {};
  const authorEmail = author.email;

  const titleEn = record.title && record.title.en;
  const titleFr = record.title && record.title.fr;
  const title = titleEn || titleFr;
  if (!title) {
    log.info(`No title found for record ${record.recordID}`);
    return;
  }

  if (region === "hakai" && !title.includes("JUST TESTING")) {
    log.info("Creating github issue");
    await createIssue(
      title,
      `https://cioos-siooc.github.io/metadata-entry-form/#/${record.language}/${region}/${record.userID}/${record.recordID}`,
    );
  }

  const reviewers = reviewerEmails ?? (await getReviewerEmails(region));

  if (authorEmail) {
    log.info(`Emailing submission confirmation to author ${authorEmail}`);
    await getTransporter().sendMail(
      mailOptionsAuthorSubmissionConfirmation(authorEmail, titleEn, titleFr, region),
    );
  }

  if (reviewers.includes(authorEmail)) {
    log.info("Author is a reviewer, don't notify other reviewers");
    return;
  }
  if (!reviewers.length) {
    log.info(`No reviewers found to notify for region ${region}`);
    return;
  }

  const authorName = author.displayName || "";
  const orgName = findCustodianOrgName(record);

  log.info(`Emailing reviewers ${reviewers.join(",")}`);
  await getTransporter().sendMail(
    mailOptionsReviewer(
      reviewers,
      titleEn,
      titleFr,
      region,
      authorName,
      authorEmail,
      orgName,
      record.userID,
      record.recordID,
      record.language,
    ),
  );
}

/*
Email the author when their record is published — unless the author is a
reviewer themselves. Mirrors notifyUser (including the quirk that nothing is
sent when the region has no reviewers).
*/
async function notifyPublished({ region, record, authorUserinfo, reviewerEmails, log = console }) {
  const reviewers = reviewerEmails ?? (await getReviewerEmails(region));
  if (!reviewers.length) {
    log.info(`No reviewers for region ${region}`);
    return;
  }

  const author = authorUserinfo || record.userinfo || {};
  const authorEmail = author.email;

  if (reviewers.includes(authorEmail)) {
    log.info("Author is a reviewer, don't notify author");
    return;
  }

  const titleEn = record.title && record.title.en;
  const titleFr = record.title && record.title.fr;
  if (!titleEn && !titleFr) {
    log.info(`No title found for record ${record.recordID}`);
    return;
  }

  log.info(`Emailing ${authorEmail}`);
  await getTransporter().sendMail(mailOptionsAuthor(authorEmail, titleEn, titleFr, region));
}

module.exports = { notifySubmitted, notifyPublished, findCustodianOrgName, getReviewerEmails };
