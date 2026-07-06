// Port of firebase-functions/functions/issue.js.
// Creates a GitHub issue in HakaiInstitute/metadata-review when a hakai
// record is submitted for review. Token comes from config.githubAuth.

const fs = require("fs");
const path = require("path");
const config = require("../config");

function readIssueText(filename) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Create an issue in the github repo when a metadata form record is submitted for review
async function createIssue(title, url) {
  // octokit v4+ is ESM-only; require lazily so loading this module doesn't
  // pull it in (Node >=22 supports require(esm) at runtime, Jest's CJS
  // runtime does not — tests mock "octokit").
  const { Octokit } = require("octokit"); // eslint-disable-line global-require
  const octokit = new Octokit({
    auth: config.githubAuth,
  });
  const issueText = readIssueText(path.join(__dirname, "dataset-name.md"));
  const input = {
    owner: "HakaiInstitute",
    repo: "metadata-review",
    title: `Dataset - ${title}`,
    body: `## ${title}\n\n<${url}>\n\n${issueText}`,
  };

  await octokit.request("POST /repos/{owner}/{repo}/issues", input);
}

module.exports = createIssue;
