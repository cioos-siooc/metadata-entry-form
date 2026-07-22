// Record export endpoints replacing downloadRecord / regenerateXMLforRecord
// callables (proxy to the converter service).

const axios = require("axios");
const config = require("../config");
const { query } = require("../db");
const { toApi } = require("../lib/recordSerializer");
const { updateRecordXML } = require("../services/xmlGenerator");

async function recordExportRoutes(app) {
  const guarded = { preHandler: [app.authenticate, app.regionContext] };

  // Replaces the regenerateXMLforRecord callable: when a submitted/published
  // record is saved, refresh its WAF XML. Drafts are a no-op.
  app.post("/regions/:region/records/:id/regenerate-xml", guarded, async (request, reply) => {
    const result = await query("SELECT * FROM records WHERE region = $1 AND id = $2", [
      request.region,
      request.params.id,
    ]);
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "Record not found" });

    const record = toApi(row);
    if (!["submitted", "published"].includes(record.status)) {
      // No need to create new XML if the record is a draft.
      return { regenerated: false };
    }

    try {
      await updateRecordXML({ region: request.region, record });
    } catch (err) {
      request.log.error({ err }, "regenerate-xml: converter call failed");
      return reply.code(502).send({ error: "XML generation failed" });
    }
    return { regenerated: true };
  });

  // Replaces the downloadRecord callable. Deviation: the Firebase version
  // returned a URL to fetch the generated file from; this proxies the
  // converter's /convert endpoint and returns the converted payload directly.
  app.post("/regions/:region/record-export", guarded, async (request, reply) => {
    const { record, fileType } = request.body || {};
    if (!record || !fileType) {
      return reply.code(422).send({ error: "record and fileType are required" });
    }

    try {
      const response = await axios.post(`${config.converterUrl.replace(/\/+$/, "")}/convert`, {
        record_data: record,
        output_format: String(fileType).toLowerCase(),
      });
      return response.data;
    } catch (err) {
      request.log.error({ err }, "record-export: converter call failed");
      const status = err.response?.status;
      const detail = err.response?.data?.detail || err.response?.data?.error;
      return reply
        .code(status && status >= 400 && status < 500 ? 422 : 502)
        .send({ error: detail || "Record conversion failed" });
    }
  });
}

module.exports = { recordExportRoutes };
