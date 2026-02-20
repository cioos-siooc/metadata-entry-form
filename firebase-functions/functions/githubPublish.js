const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Octokit } = require("octokit");

// Helper to check permissions
async function checkPermissions(email, region) {
  const permissionsSnapshot = await admin.database().ref(`admin/${region}/permissions`).once('value');
  const permissions = permissionsSnapshot.val();
  const admins = (permissions && permissions.admins ? permissions.admins.split(",").map(e => e.trim()) : []);
  const reviewers = (permissions && permissions.reviewers ? permissions.reviewers.split(",").map(e => e.trim()) : []);
  
  if (!admins.includes(email) && !reviewers.includes(email)) {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin or reviewer.');
  }
}

exports.githubPublishRecord = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  
  const { region, files, commitMessage } = data;
  
  if (!region || !files || !Array.isArray(files) || files.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: region and files.');
  }
  
  // 1. Check Permissions
  await checkPermissions(context.auth.token.email, region);
  
  // 2. Fetch GitHub Config
  const configSnapshot = await admin.database().ref(`admin/${region}/githubCredentials`).once('value');
  const config = configSnapshot.val();
  if (!config || !config.token) {
    throw new functions.https.HttpsError('failed-precondition', 'GitHub configuration missing.');
  }
  
  // 3. Commit to GitHub
  const octokit = new Octokit({
    auth: config.token
  });
  
  const { owner, repo } = config;
  const branch = config.branch || "main";
  
  const uploadedFiles = [];
  
  try {
      // 1. Get Ref
      const { data: refData } = await octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`
      });
      const commitSha = refData.object.sha;
      
      // 2. Get Commit
      const { data: commitData } = await octokit.rest.git.getCommit({
          owner,
          repo,
          commit_sha: commitSha
      });
      const treeSha = commitData.tree.sha;
      
      // 3. Create Tree
      const treeItems = files.map(file => {
          uploadedFiles.push(file.path);
          return {
              path: file.path,
              mode: '100644',
              type: 'blob',
              content: file.content
          };
      });
      
      const { data: treeData } = await octokit.rest.git.createTree({
          owner,
          repo,
          base_tree: treeSha,
          tree: treeItems
      });
      const newTreeSha = treeData.sha;
      
      // 4. Create Commit
      const message = commitMessage || "Publish metadata record";
      
      const { data: newCommitData } = await octokit.rest.git.createCommit({
          owner,
          repo,
          message,
          tree: newTreeSha,
          parents: [commitSha]
      });
      const newCommitSha = newCommitData.sha;
      
      // 5. Update Ref
      await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: newCommitSha
      });
      
      return {
          success: true,
          commitSha: newCommitSha,
          files: uploadedFiles,
          commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`
      };
      
  } catch (error) {
      // eslint-disable-next-line no-console
      console.error("GitHub API Error", error);
      throw new functions.https.HttpsError('internal', `GitHub API Error: ${error.message}`);
  }
});