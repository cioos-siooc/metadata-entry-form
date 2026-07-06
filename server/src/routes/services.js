// Service endpoints replacing the stateless httpsCallable functions:
// translate, url-check, DataCite DOI suite, GitHub publish.

const { translateText } = require("../services/translate");
const { checkURLActive } = require("../services/urlCheck");
const {
  getDataciteCredentials,
  createDraftDoi,
  updateDraftDoi,
  deleteDraftDoi,
  getDoiStatus,
  testDataciteCredentials,
} = require("../services/datacite");
const { publishToGithub } = require("../services/githubPublish");

// Service errors carry {statusCode, message}; anything else is a 500.
function sendServiceError(reply, err) {
  const status = err.statusCode || 500;
  return reply.code(status).send({ error: err.message || "Internal error" });
}

async function serviceRoutes(app) {
  const authed = { preHandler: [app.authenticate] };
  const member = { preHandler: [app.authenticate, app.regionContext] };
  const adminOnly = {
    preHandler: [app.authenticate, app.regionContext, app.requireAdmin],
  };
  const reviewerOrAdmin = {
    preHandler: [app.authenticate, app.regionContext, app.requireReviewerOrAdmin],
  };

  // --- translate -------------------------------------------------------------

  // Replaces the `translate` callable. Response mirrors the callable result
  // shape ({data: {translatedText, translationMessage}}).
  app.post("/translate", authed, async (request, reply) => {
    const { text, fromLang } = request.body || {};
    if (!text || !fromLang) {
      return reply.code(422).send({ error: "text and fromLang required" });
    }
    try {
      const data = await translateText(text, fromLang);
      return { data };
    } catch (err) {
      request.log.error({ err }, "translateText failed");
      return sendServiceError(reply, err);
    }
  });

  // --- URL check ---------------------------------------------------------------

  // Replaces the `checkURLActive` callable.
  app.post("/url-check", authed, async (request, reply) => {
    const { url } = request.body || {};
    if (!url) return reply.code(422).send({ error: "url required" });
    return { active: await checkURLActive(url) };
  });

  // --- DataCite DOI suite ------------------------------------------------------

  // Merges getDatacitePrefix + getCredentialsStored.
  app.get("/regions/:region/doi/config", member, async (request) => {
    const credentials = await getDataciteCredentials(request.region);
    return {
      prefix: credentials?.prefix ?? "",
      hasCredentials: Boolean(credentials?.prefix && credentials?.authHash),
    };
  });

  // Replaces createDraftDoi. Body: {record} (the DataCite payload).
  app.post("/regions/:region/doi", member, async (request, reply) => {
    try {
      return await createDraftDoi(request.region, request.body?.record);
    } catch (err) {
      return sendServiceError(reply, err);
    }
  });

  // Replaces updateDraftDoi. Body: {doi, data}. DOI strings contain '/', so
  // they travel in the body rather than the path.
  app.put("/regions/:region/doi", member, async (request, reply) => {
    const { doi, data } = request.body || {};
    if (!doi) return reply.code(422).send({ error: "doi required" });
    try {
      return await updateDraftDoi(request.region, doi, data);
    } catch (err) {
      return sendServiceError(reply, err);
    }
  });

  // Replaces deleteDraftDoi. Body: {doi}.
  app.delete("/regions/:region/doi", member, async (request, reply) => {
    const { doi } = request.body || {};
    if (!doi) return reply.code(422).send({ error: "doi required" });
    try {
      const status = await deleteDraftDoi(request.region, doi);
      return { status };
    } catch (err) {
      return sendServiceError(reply, err);
    }
  });

  // Replaces getDoiStatus. ?doi=...
  app.get("/regions/:region/doi/status", member, async (request, reply) => {
    const { doi } = request.query || {};
    if (!doi) return reply.code(422).send({ error: "doi query parameter required" });
    try {
      const status = await getDoiStatus(request.region, doi);
      return { status };
    } catch (err) {
      return sendServiceError(reply, err);
    }
  });

  // Replaces testDataciteCredentials. Body may supply {prefix, authHash}
  // (e.g. before saving); omitted values fall back to the stored credentials.
  app.post("/regions/:region/doi/test-credentials", adminOnly, async (request, reply) => {
    const { prefix, authHash, apiDomain } = request.body || {};
    try {
      return await testDataciteCredentials(request.region, { prefix, authHash, apiDomain });
    } catch (err) {
      return sendServiceError(reply, err);
    }
  });

  // --- GitHub publish ------------------------------------------------------------

  // Replaces githubPublishRecord. Body: {files: [{path, content}], commitMessage}.
  app.post("/regions/:region/github-publish", reviewerOrAdmin, async (request, reply) => {
    const { files, commitMessage } = request.body || {};
    try {
      return await publishToGithub({ region: request.region, files, commitMessage });
    } catch (err) {
      request.log.error({ err }, "github publish failed");
      return sendServiceError(reply, err);
    }
  });
}

module.exports = { serviceRoutes };
