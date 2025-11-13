const { Octokit } = require("octokit");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

/**
 * Cloud Function to publish metadata records to GitHub repository
 * 
 * @param {Object} data - Function parameters
 * @param {string} data.recordId - The record ID to publish
 * @param {string} data.userId - The user ID requesting the publish
 * @param {string} data.region - The region (e.g., "pacific", "atlantic")
 * @param {Array<string>} data.environments - List of environments to publish to (e.g., ["prod", "dev"])
 * @param {string} [data.commitMessage] - Optional custom commit message
 * @param {Object} context - Firebase Auth context
 * @returns {Promise<Object>} Success response with commit details
 */
exports.githubPublishRecord = functions.https.onCall(async (data, context) => {
  // 1. Authenticate caller (must be signed in)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to publish records"
    );
  }

  const { recordId, userId, region, environments, commitMessage } = data;
  const userEmail = context.auth.token.email;

  // 2. Validate required parameters
  if (!recordId || !userId || !region || !environments || !Array.isArray(environments)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters: recordId, userId, region, and environments array"
    );
  }

  if (environments.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "At least one environment must be specified"
    );
  }

  try {
    const db = admin.database();

    // 3. Check if user is admin or reviewer for this region
    const permissionsRef = db.ref(`admin/${region}/permissions`);
    const permissionsSnapshot = await permissionsRef.once("value");
    const permissions = permissionsSnapshot.val();

    if (!permissions) {
      throw new functions.https.HttpsError(
        "permission-denied",
        `No permissions configured for region: ${region}`
      );
    }

    const admins = permissions.admins ? permissions.admins.split(",").map(e => e.trim()) : [];
    const reviewers = permissions.reviewers ? permissions.reviewers.split(",").map(e => e.trim()) : [];
    const isAuthorized = admins.includes(userEmail) || reviewers.includes(userEmail);

    if (!isAuthorized) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User does not have permission to publish records in this region"
      );
    }

    // 4. Fetch record data from Firebase
    const recordRef = db.ref(`users/${userId}/${recordId}`);
    const recordSnapshot = await recordRef.once("value");
    const recordData = recordSnapshot.val();

    if (!recordData) {
      throw new functions.https.HttpsError(
        "not-found",
        `Record not found: ${recordId}`
      );
    }

    // 5. Load GitHub configuration from admin path
    const githubConfigRef = db.ref(`admin/${region}/githubCredentials`);
    const githubConfigSnapshot = await githubConfigRef.once("value");
    const githubConfig = githubConfigSnapshot.val();

    if (!githubConfig || !githubConfig.githubTokenHash) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "GitHub publishing is not configured for this region. Please configure it in the Admin page."
      );
    }

    const {
      owner,
      repo,
      branch,
      filenameTemplate,
      githubTokenHash,
    } = githubConfig;

    if (!owner || !repo || !branch || !filenameTemplate) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "GitHub configuration is incomplete. Please check Admin settings."
      );
    }

    // 6. Decode GitHub token from base64
    const githubToken = Buffer.from(githubTokenHash, "base64").toString("utf8");

    // 7. Initialize Octokit
    const octokit = new Octokit({
      auth: githubToken,
    });

    // 8. Generate filename from template
    const filename = generateFilename(filenameTemplate, recordData, recordId);

    // 9. Convert record to XML and YAML
    const [xmlContent, yamlContent] = await Promise.all([
      convertRecordToFormat(recordData, "xml"),
      convertRecordToFormat(recordData, "yaml"),
    ]);

    // 10. Prepare commit message
    const defaultMessage = `Publish metadata record: ${recordData.title?.en || recordData.title?.fr || recordId}`;
    const message = commitMessage || defaultMessage;

    // 11. Commit files to GitHub for each environment
    const results = [];
    
    for (const environment of environments) {
      const files = [
        {
          path: `forms/${environment}/${filename}.xml`,
          content: xmlContent,
        },
        {
          path: `forms/${environment}/${filename}.yaml`,
          content: yamlContent,
        },
      ];

      const result = await commitFilesToGitHub(
        octokit,
        owner,
        repo,
        branch,
        files,
        message,
        recordData
      );

      results.push({
        environment,
        commitUrl: result.commitUrl,
        sha: result.sha,
        files: files.map(f => f.path),
      });
    }

    // 12. Return success response
    return {
      success: true,
      recordId,
      filename,
      environments: results,
      message: "Record successfully published to GitHub",
    };

  } catch (error) {
    console.error("Error publishing to GitHub:", error);
    
    // Re-throw HttpsErrors as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new functions.https.HttpsError(
      "internal",
      `Failed to publish record: ${error.message}`
    );
  }
});

/**
 * Generate filename from template
 * Supports variables: {uuid}, {title}
 * 
 * @param {string} template - Filename template (e.g., "{uuid}" or "{title}")
 * @param {Object} recordData - The record data
 * @param {string} recordId - The record UUID
 * @returns {string} Generated filename
 */
function generateFilename(template, recordData, recordId) {
  let filename = template;

  // Replace {uuid} with record ID
  filename = filename.replace(/\{uuid\}/g, recordId);

  // Replace {title} with sanitized title
  if (filename.includes("{title}")) {
    const title = recordData.title?.en || recordData.title?.fr || recordId;
    const sanitizedTitle = sanitizeFilename(title);
    filename = filename.replace(/\{title\}/g, sanitizedTitle);
  }

  return filename;
}

/**
 * Sanitize filename by removing/replacing invalid characters
 * 
 * @param {string} title - The title to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dash
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 100); // Limit length
}

/**
 * Convert record to specified format using Python conversion function
 * 
 * @param {Object} recordData - The record data
 * @param {string} format - Output format ("xml" or "yaml")
 * @returns {Promise<string>} Converted content
 */
async function convertRecordToFormat(recordData, format) {
  try {
    // Determine the Python function URL based on environment
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const region = process.env.FUNCTION_REGION || "us-central1";
    
    // Use emulator if running locally, otherwise use production URL
    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    const baseUrl = isEmulator
      ? "http://127.0.0.1:5002"
      : `https://${region}-${projectId}.cloudfunctions.net`;
    
    const conversionUrl = `${baseUrl}/convert_metadata`;

    // Call the Python conversion function
    const response = await axios.post(
      conversionUrl,
      {
        data: {
          record_data: recordData,
          output_format: format,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data && response.data.data) {
      return response.data.data;
    }

    throw new Error(`Conversion returned no data for format: ${format}`);

  } catch (error) {
    console.error(`Error converting to ${format}:`, error.message);
    throw new Error(`Failed to convert record to ${format}: ${error.message}`);
  }
}

/**
 * Commit files to GitHub repository
 * 
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Target branch
 * @param {Array<Object>} files - Array of {path, content} objects
 * @param {string} message - Commit message
 * @param {Object} recordData - Record data for metadata
 * @returns {Promise<Object>} Commit result with URL and SHA
 */
async function commitFilesToGitHub(octokit, owner, repo, branch, files, message, recordData) {
  try {
    // 1. Get the current commit SHA of the branch
    const { data: refData } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const currentCommitSha = refData.object.sha;

    // 2. Get the tree SHA of the current commit
    const { data: commitData } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });
    const currentTreeSha = commitData.tree.sha;

    // 3. Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blobData } = await octokit.rest.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString("base64"),
          encoding: "base64",
        });
        return {
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blobData.sha,
        };
      })
    );

    // 4. Create a new tree with the new blobs
    const { data: newTree } = await octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: currentTreeSha,
      tree: blobs,
    });

    // 5. Create a new commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [currentCommitSha],
    });

    // 6. Update the reference to point to the new commit
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    // 7. Return commit details
    return {
      commitUrl: newCommit.html_url,
      sha: newCommit.sha,
      tree: newTree.sha,
    };

  } catch (error) {
    console.error("Error committing to GitHub:", error);
    throw new Error(`Failed to commit to GitHub: ${error.message}`);
  }
}
