const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
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

// Helper to generate filename
function generateFilename(template, record, recordId) {
  let filename = template;
  // Use record.id or identifier or key
  const uuid = record.id || record.identifier || recordId;
  filename = filename.replace("{uuid}", uuid);
  
  const title = record.title ? (record.title.en || record.title.fr || "untitled") : "untitled";
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_]/g, '-');
  filename = filename.replace("{title}", sanitizedTitle);
  
  return filename;
}

exports.githubPublishRecord = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  
  const { recordId, userId, region, environments, commitMessage } = data;
  
  if (!recordId || !userId || !region || !environments || environments.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
  }
  
  // 1. Check Permissions
  await checkPermissions(context.auth.token.email, region);
  
  // 2. Fetch Record
  const recordSnapshot = await admin.database().ref(`${region}/users/${userId}/records/${recordId}`).once('value');
  const record = recordSnapshot.val();
  if (!record) {
    throw new functions.https.HttpsError('not-found', 'Record not found.');
  }
  
  // 3. Fetch GitHub Config
  const configSnapshot = await admin.database().ref(`admin/${region}/githubCredentials`).once('value');
  const config = configSnapshot.val();
  if (!config || !config.token) {
    throw new functions.https.HttpsError('failed-precondition', 'GitHub configuration missing.');
  }
  
  // 5. Convert to XML and YAML
  const projectId = process.env.GCLOUD_PROJECT;
  const cloudFunctionRegion = "us-central1";
  const convertMetadataUrl = `https://${cloudFunctionRegion}-${projectId}.cloudfunctions.net/convert_metadata`;

  let xmlContent;
  let yamlContent;
  try {
    const xmlResponse = await axios.post(convertMetadataUrl, {
      data: {
        record_data: record,
        output_format: "iso19115-3_xml"
      }
    });
    // The API returns { data: "..." }
    xmlContent = xmlResponse.data.data;
    
    const yamlResponse = await axios.post(convertMetadataUrl, {
      data: {
        record_data: record,
        output_format: "yaml"
      }
    });
    // The API returns { data: "..." }
    yamlContent = yamlResponse.data.data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Conversion error", error);
    throw new functions.https.HttpsError('internal', 'Failed to convert record. Ensure conversion service is available.');
  }
  
  if (!xmlContent || !yamlContent) {
     throw new functions.https.HttpsError('internal', 'Conversion returned empty content.');
  }
  
  // 6. Generate Filename
  const filenameBase = generateFilename(config.fileTemplate || "{uuid}", record, recordId);
  
  // 7. Commit to GitHub
  const octokit = new Octokit({
    auth: config.token
  });
  
  const { owner, repo } = config;
  const branch = config.branch || "main";
  
  const uploadedFiles = [];
  
  try {
      // 1. Get Ref
      // If branch doesn't exist, this fails. We assume it exists.
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
      const treeItems = [];
      
      environments.forEach((env) => {
          const xmlPath = `forms/${env}/${filenameBase}.xml`;
          const yamlPath = `forms/${env}/${filenameBase}.yaml`;
          
          treeItems.push({
              path: xmlPath,
              mode: '100644',
              type: 'blob',
              content: xmlContent
          });
          
          treeItems.push({
              path: yamlPath,
              mode: '100644',
              type: 'blob',
              content: yamlContent
          });
          
          uploadedFiles.push(xmlPath);
          uploadedFiles.push(yamlPath);
      });
      
      const { data: treeData } = await octokit.rest.git.createTree({
          owner,
          repo,
          base_tree: treeSha,
          tree: treeItems
      });
      const newTreeSha = treeData.sha;
      
      // 4. Create Commit
      const title = record.title?.en || record.title?.fr || recordId;
      const message = commitMessage || `Publish metadata record: ${title}`;
      
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
