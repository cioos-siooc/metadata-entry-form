// Port of firebase-functions/functions/githubPublish.js (githubPublishRecord).
// Auth/permission checks happen at the route layer (requireReviewerOrAdmin);
// this service handles the Octokit git-data commit flow. Credentials come
// from region_credentials (kind='github') instead of the RTDB admin subtree.

const { Octokit } = require("octokit");
const { query } = require("../db");
const { decryptSecret } = require("../lib/crypto");

function serviceError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Reads the region's GitHub credentials.
// Returns {owner, repo, branch, environment, token} or null when not stored.
async function getGithubCredentials(region) {
  const result = await query(
    "SELECT config, secret_enc FROM region_credentials WHERE region = $1 AND kind = 'github'",
    [region],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    owner: row.config?.owner ?? null,
    repo: row.config?.repo ?? null,
    branch: row.config?.branch || "main",
    environment: row.config?.environment ?? "",
    token: row.secret_enc ? decryptSecret(row.secret_enc) : null,
  };
}

// Commits files to the region's configured repo/branch via the git data API
// (blob content in tree -> commit -> ref update).
// files: [{path, content}], commitMessage: optional.
async function publishToGithub({ region, files, commitMessage }) {
  if (!region || !files || !Array.isArray(files) || files.length === 0) {
    throw serviceError(400, "Missing required parameters: region and files.");
  }

  const config = await getGithubCredentials(region);
  if (!config || !config.token || !config.owner || !config.repo) {
    throw serviceError(400, "GitHub configuration missing.");
  }

  const octokit = new Octokit({ auth: config.token });
  const { owner, repo, branch } = config;
  const uploadedFiles = [];

  try {
    // 1. Get Ref
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const commitSha = refData.object.sha;

    // 2. Get Commit
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });
    const treeSha = commitData.tree.sha;

    // 3. Create Tree
    const treeItems = files.map((file) => {
      uploadedFiles.push(file.path);
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      };
    });

    const { data: treeData } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: treeItems,
    });
    const newTreeSha = treeData.sha;

    // 4. Create Commit
    const message = commitMessage || "Publish metadata record";
    const { data: newCommitData } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: newTreeSha,
      parents: [commitSha],
    });
    const newCommitSha = newCommitData.sha;

    // 5. Update Ref
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommitSha,
    });

    return {
      success: true,
      commitSha: newCommitSha,
      files: uploadedFiles,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
    };
  } catch (error) {
    throw serviceError(500, `GitHub API Error: ${error.message}`);
  }
}

module.exports = { getGithubCredentials, publishToGithub };
