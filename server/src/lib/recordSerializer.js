const { standardizeRecord } = require("./blankRecord");

// The frontend speaks the Firebase record shape: one flat object where
// server-managed fields (status, recordID, sharedWith, ...) sit beside form
// data, and "" means draft. Postgres stores server-managed fields as columns
// and the rest as JSONB. These two functions are the single boundary between
// the shapes — nothing else in the server may build or pick apart a record.

const STATUS_TO_API = { draft: "", submitted: "submitted", published: "published" };
const STATUS_TO_DB = { "": "draft", submitted: "submitted", published: "published" };

// Fields owned by columns; stripped from data on write, merged back on read.
const COLUMN_FIELDS = [
  "recordID",
  "status",
  "title",
  "identifier",
  "datasetIdentifier",
  "filename",
  "created",
  "timeFirstPublished",
  "lastEditedBy",
  "sharedWith",
  "userinfo",
  "userID",
  "updatedAt",
  // Client-supplied idempotency key. MUST be listed here: fromApi merges every
  // unlisted field into the data jsonb, so omitting it would bury the key
  // inside the record document instead of putting it in its column.
  "clientRecordId",
];

function toApi(row, { sharedWith = null, userinfo = null } = {}) {
  const record = standardizeRecord({
    ...row.data,
    recordID: row.id,
    status: STATUS_TO_API[row.status] ?? row.status,
    title: { en: row.title_en ?? "", fr: row.title_fr ?? "" },
    identifier: row.identifier ?? "",
    datasetIdentifier: row.dataset_identifier ?? "",
    filename: row.filename ?? "",
    created: row.created instanceof Date ? row.created.toISOString() : (row.created ?? ""),
    timeFirstPublished:
      row.time_first_published instanceof Date
        ? row.time_first_published.toISOString()
        : (row.time_first_published ?? ""),
    lastEditedBy: row.last_edited_by ?? {},
  });
  // optimistic-concurrency token for PUT If-Unmodified-Since
  if (row.updated_at) {
    record.updatedAt =
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  }

  if (sharedWith) record.sharedWith = sharedWith;
  if (userinfo) record.userinfo = userinfo;
  if (row.user_id) record.userID = row.user_id;
  if (row.client_record_id) record.clientRecordId = row.client_record_id;
  return record;
}

// Returns { columns, data } for INSERT/UPDATE.
function fromApi(record) {
  const standardized = standardizeRecord(record);

  const columns = {
    status: STATUS_TO_DB[standardized.status] ?? "draft",
    title_en: standardized.title?.en ?? "",
    title_fr: standardized.title?.fr ?? "",
    identifier: standardized.identifier || null,
    dataset_identifier: standardized.datasetIdentifier || null,
    filename: standardized.filename || null,
    created: standardized.created || new Date().toISOString(),
    time_first_published: standardized.timeFirstPublished || null,
    last_edited_by: standardized.lastEditedBy ?? {},
    client_record_id: standardized.clientRecordId || null,
  };

  const data = { ...standardized };
  COLUMN_FIELDS.forEach((field) => delete data[field]);

  return { columns, data };
}

module.exports = { toApi, fromApi, STATUS_TO_API, STATUS_TO_DB };
