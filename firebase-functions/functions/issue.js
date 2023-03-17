const { Octokit } = require("octokit");
const fs = require("fs");

const { GITHUB_AUTH } = process.env;
function readIssueText(filename) {
  try {
    return fs.readFileSync(filename, "utf8");
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function createIssue(title, url) {
  const octokit = new Octokit({
    auth: GITHUB_AUTH,
  });
  const issueText = readIssueText("dataset-name.md");
  const input = {
    owner: "HakaiInstitute",
    repo: "metadata-review",
    title: `Dataset - ${title}`,
    body: `## ${title}\n\n${url}\n\n${issueText}`,
  };

  await octokit.request("POST /repos/{owner}/{repo}/issues", input);
}
module.exports = createIssue;
