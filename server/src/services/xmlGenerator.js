// Port of firebase-functions/functions/updates.js (updateXML / deleteXML).
// CONTRACT CHANGE from the Firebase version: instead of sending the converter
// a Firebase path to pull the record from RTDB, we PUSH the full record JSON.
// The generator base URL is the per-region regions.record_generator_url
// override, falling back to config.converterUrl.

const axios = require("axios");
const config = require("../config");
const { query } = require("../db");

async function generatorUrlFor(region) {
  let url = null;
  try {
    const result = await query("SELECT record_generator_url FROM regions WHERE id = $1", [region]);
    url = result.rows[0]?.record_generator_url ?? null;
  } catch (error) {
    console.error(
      `Error fetching record_generator_url for region ${region}, using the default value:`,
      error,
    );
  }
  return (url || config.converterUrl).replace(/\/+$/, "");
}

// Create/refresh (or, for a record leaving submitted/published, remove) the
// WAF XML+YAML for a record. `record` is the API-shaped record; its status
// tells the converter whether to write or delete files.
async function updateRecordXML({ region, record }) {
  const urlBase = await generatorUrlFor(region);
  return axios.post(`${urlBase}/record`, {
    record,
    filename: record.filename,
    status: record.status,
    region,
  });
}

async function deleteRecordXML({ region, filename }) {
  const urlBase = await generatorUrlFor(region);
  return axios.post(`${urlBase}/recordDelete`, { filename, region });
}

module.exports = { updateRecordXML, deleteRecordXML, generatorUrlFor };
