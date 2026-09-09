const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { Octokit } = require("octokit");
const axios = require("axios");
const crypto = require("crypto");
const cors = require('cors')({origin: true});

// Helper to check permissions for a specific region
async function checkPermissions(email, region) {
  const permissionsSnapshot = await admin.database().ref(`admin/${region}/permissions`).once('value');
  const permissions = permissionsSnapshot.val();
  const admins = (permissions && permissions.admins ? permissions.admins.split(",").map(e => e.trim()) : []);
  const reviewers = (permissions && permissions.reviewers ? permissions.reviewers.split(",").map(e => e.trim()) : []);
  
  if (!admins.includes(email) && !reviewers.includes(email)) {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin or reviewer for this region.');
  }
}

// Helper to check if user is an admin or reviewer in ANY region (for global actions)
async function checkGlobalPermissions(email) {
    const adminSnapshot = await admin.database().ref("admin").once('value');
    const adminData = adminSnapshot.val();
    if (!adminData) throw new functions.https.HttpsError('permission-denied', 'No admin configuration found.');

    let isAuthorized = false;
    for (const region in adminData) {
        const permissions = adminData[region].permissions;
        if (!permissions) continue;
        const admins = (permissions.admins ? permissions.admins.split(",").map(e => e.trim()) : []);
        const reviewers = (permissions.reviewers ? permissions.reviewers.split(",").map(e => e.trim()) : []);
        if (admins.includes(email) || reviewers.includes(email)) {
            isAuthorized = true;
            break;
        }
    }

    if (!isAuthorized) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin or reviewer in at least one region.');
    }
}

async function getFileContent(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const content = buffer.toString('base64');
        
        // Try to determine extension from content-type
        const contentType = response.headers['content-type'] || 'image/png';
        const extension = contentType.split('/')[1] || 'png';
        
        return { content, extension };
    } catch (error) {
        console.error("Error fetching file content", url, error);
        return null;
    }
}

// Helper to get GitHub token from global config or fallback to any regional config
async function getGithubToken(globalConfig) {
    if (globalConfig && globalConfig.token) {
        const token = globalConfig.token.trim();
        console.log(`Using global GitHub token (Prefix: ${token.substring(0, 4)}..., Length: ${token.length})`);
        return token;
    }

    const adminSnapshot = await admin.database().ref("admin").once('value');
    const adminData = adminSnapshot.val();
    
    if (adminData) {
        // Prioritize 'test' region as requested
        const testToken = adminData['test']?.githubCredentials?.token;
        if (testToken) {
            const token = testToken.trim();
            console.log(`Using prioritized 'test' region GitHub token (Prefix: ${token.substring(0, 4)}..., Length: ${token.length})`);
            return token;
        }

        // Fallback to any other region
        for (const region in adminData) {
            const regionToken = adminData[region]?.githubCredentials?.token;
            if (regionToken) {
                const token = regionToken.trim();
                console.log(`Using fallback GitHub token from region: ${region} (Prefix: ${token.substring(0, 4)}..., Length: ${token.length})`);
                return token;
            }
        }
    }
    
    console.warn("No GitHub token found in any config path.");
    return null;
}

exports.githubPublishRecord = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  
  const { region, files, commitMessage } = data;
  
  if (!region || !files || !Array.isArray(files) || files.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters: region and files.');
  }
  
  await checkPermissions(context.auth.token.email, region);
  
  const configSnapshot = await admin.database().ref(`admin/${region}/githubCredentials`).once('value');
  const config = configSnapshot.val();
  if (!config || !config.token) {
    throw new functions.https.HttpsError('failed-precondition', 'GitHub configuration missing.');
  }
  
  const octokit = new Octokit({ auth: config.token });
  const { owner, repo } = config;
  const branch = config.branch || "main";
  
  try {
      const { data: refData } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
      const { data: commitData } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: refData.object.sha });
      
      const treeItems = files.map(file => ({
          path: file.path,
          mode: '100644',
          type: 'blob',
          content: file.content
      }));
      
      const { data: treeData } = await octokit.rest.git.createTree({
          owner, repo, base_tree: commitData.tree.sha, tree: treeItems
      });
      
      const { data: newCommitData } = await octokit.rest.git.createCommit({
          owner, repo, message: commitMessage || "Publish metadata record", tree: treeData.sha, parents: [refData.object.sha]
      });
      
      await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommitData.sha });
      
      return {
          success: true,
          commitSha: newCommitData.sha,
          commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`
      };
  } catch (error) {
      console.error("GitHub API Error", error);
      throw new functions.https.HttpsError('internal', `GitHub API Error: ${error.message}`);
  }
});

exports.processOrganizationTask = functions.runWith({ timeoutSeconds: 540 }).database.ref('/admin/test/organizationTasks/{taskId}')
    .onWrite(async (change, context) => {
        const data = change.after.val();
        if (!data || data.status !== 'pending') return null;

        const { taskId } = context.params;
        const taskRef = change.after.ref;

        console.log(`Processing ${data.type} task: ${taskId}`);

        try {
            const configSnapshot = await admin.database().ref(`admin/test/githubOrganizationsConfig`).once('value');
            const config = configSnapshot.val() || {};
            
            // Clean up config strings
            const cleanConfig = {
                ...config,
                owner: (config.owner || "cioos-siooc").trim(),
                repo: (config.repo || "cioos-commons").trim().replace(/^.*\//, ''), // Remove owner if included in repo name
                branch: (config.branch || "main").trim()
            };

            console.log(`Target: ${cleanConfig.owner}/${cleanConfig.repo} on branch ${cleanConfig.branch}`);

            if (data.type === 'publish') {
                const result = await performPublish(data.organization, cleanConfig, data.commitMessage, data.previousStatus);
                console.log(`Task ${taskId} completed successfully`);
                return taskRef.update({ status: 'completed', result, completedAt: new Date().toISOString() });
            } else if (data.type === 'sync') {
                const result = await performSync(cleanConfig);
                console.log(`Task ${taskId} completed successfully`);
                return taskRef.update({ status: 'completed', result, completedAt: new Date().toISOString() });
            }
        } catch (error) {
            console.error(`Task ${taskId} failed:`, error);
            return taskRef.update({ status: 'error', error: error.message, failedAt: new Date().toISOString() });
        }
    });

async function performPublish(organization, config, commitMessage, previousStatus) {
    console.log(`Performing publish for ${organization.orgSlug}...`);
    const token = await getGithubToken(config);
    if (!token) throw new Error('GitHub token missing (checked global and all regional configs).');

    const octokit = new Octokit({ auth: token });
    const { owner, repo, branch } = config;
    const orgSlug = organization.orgSlug;
    const status = organization.status || "approved";

    // Connection Test: Verify repo access first
    try {
        console.log(`Connection Test: Checking access to ${owner}/${repo} (token prefix: ${token.substring(0, 4)}..., length: ${token.length})...`);
        await octokit.rest.repos.get({ owner, repo });
        console.log("Connection Test: Success!");
    } catch (e) {
        console.error(`Connection Test Failed: status=${e.status}, message=${e.message}`);
        if (e.status === 404) {
            throw new Error(`Repository '${owner}/${repo}' not found or token lacks access to private repos. Check repo spelling and token 'repo' scope. Token prefix: ${token.substring(0, 4)}..., length: ${token.length}`);
        }
        if (e.status === 401) {
            throw new Error(`Authentication failed for '${owner}/${repo}'. The token may be expired or invalid. Token prefix: ${token.substring(0, 4)}...`);
        }
        throw e;
    }

    const treeItems = [];
    const orgJson = { ...organization };

    // Handle Logos with hashing
    if (organization.orgLogoEn && (organization.orgLogoEn.startsWith('http') || organization.orgLogoEn.startsWith('data:'))) {
        console.log(`Hashing English logo...`);
        const logoData = await getFileContent(organization.orgLogoEn);
        if (logoData) {
            const hash = crypto.createHash('sha256').update(Buffer.from(logoData.content, 'base64')).digest('hex');
            const path = `organizations/logos/${hash}.${logoData.extension}`;
            treeItems.push({ path, mode: '100644', type: 'blob', content: logoData.content, encoding: 'base64' });
            orgJson.orgLogoEn = `../logos/${hash}.${logoData.extension}`;
        }
    }

    if (organization.orgLogoFr && (organization.orgLogoFr.startsWith('http') || organization.orgLogoFr.startsWith('data:'))) {
        console.log(`Hashing French logo...`);
        const logoData = await getFileContent(organization.orgLogoFr);
        if (logoData) {
            const hash = crypto.createHash('sha256').update(Buffer.from(logoData.content, 'base64')).digest('hex');
            const path = `organizations/logos/${hash}.${logoData.extension}`;
            treeItems.push({ path, mode: '100644', type: 'blob', content: logoData.content, encoding: 'base64' });
            orgJson.orgLogoFr = `../logos/${hash}.${logoData.extension}`;
        }
    }

    const targetPath = `organizations/${status}/${orgSlug}.json`;
    console.log(`Adding JSON to tree: ${targetPath}`);
    treeItems.push({
        path: targetPath,
        mode: '100644',
        type: 'blob',
        content: JSON.stringify(orgJson, null, 2)
    });

    // Include deletion of old file in the same atomic commit if status changed
    if (previousStatus && previousStatus !== status) {
        const oldPath = `organizations/${previousStatus}/${orgSlug}.json`;
        console.log(`Including deletion of old file in tree: ${oldPath}`);
        treeItems.push({ path: oldPath, mode: '100644', sha: null });
    }

    // Retry loop to handle concurrent write conflicts (409/422 from updateRef)
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`Commit attempt ${attempt}/${MAX_RETRIES}: fetching ref refs/heads/${branch}...`);
            const { data: refData } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` });
            const { data: commitData } = await octokit.rest.git.getCommit({ owner, repo, commit_sha: refData.object.sha });
            const { data: treeData } = await octokit.rest.git.createTree({ owner, repo, base_tree: commitData.tree.sha, tree: treeItems });
            const { data: newCommitData } = await octokit.rest.git.createCommit({
                owner, repo, message: commitMessage || `Update organization: ${orgSlug}`, tree: treeData.sha, parents: [refData.object.sha]
            });
            await octokit.rest.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommitData.sha });
            console.log(`Commit succeeded on attempt ${attempt}`);
            return { success: true, commitSha: newCommitData.sha };
        } catch (err) {
            // 409 = Conflict, 422 = Not a fast-forward update
            const isConflict = err.status === 409 || err.status === 422;
            if (isConflict && attempt < MAX_RETRIES) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000) + Math.floor(Math.random() * 1000);
                console.warn(`Commit attempt ${attempt} failed with status ${err.status} (concurrent write conflict), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
}

async function performSync(config) {
    console.log("Starting sync from GitHub...");
    const token = await getGithubToken(config);
    if (!token) throw new Error('GitHub token missing.');

    const octokit = new Octokit({ auth: token });
    const { owner, repo, branch } = config;

    const results = { approved: 0, pending: 0, rejected: 0, errors: [] };
    const statuses = ["approved", "pending", "rejected"];

    for (const status of statuses) {
        try {
            console.log(`Fetching directory: organizations/${status}`);
            const { data: files } = await octokit.rest.repos.getContent({ owner, repo, path: `organizations/${status}`, ref: branch });
            if (!Array.isArray(files)) continue;

            const jsonFiles = files.filter(file => file.name.endsWith(".json"));
            await Promise.all(jsonFiles.map(async (file) => {
                try {
                    const { data: contentData } = await octokit.rest.repos.getContent({ owner, repo, path: file.path, ref: branch });
                    const orgData = JSON.parse(Buffer.from(contentData.content, 'base64').toString());
                    const slug = orgData.orgSlug || file.name.replace(".json", "");

                    if (status === "approved") {
                        await admin.database().ref(`organizations/${slug}`).set(orgData);
                        results.approved++;
                    } else {
                        await admin.database().ref(`organizationRequests/${slug}`).set({ ...orgData, status });
                        results[status]++;
                    }
                } catch (e) { results.errors.push(`Error processing ${file.path}: ${e.message}`); }
            }));
        } catch (e) { if (e.status !== 404) results.errors.push(`Error listing ${status}: ${e.message}`); }
    }
    return results;
}
