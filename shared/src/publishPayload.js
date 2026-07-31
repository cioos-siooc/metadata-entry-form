import { getRecordFilename } from "./misc.js";

/**
 * The file set a GitHub publish writes.
 *
 * Shared because the paths are a contract with the WAF: the harvester reads
 * `forms/<region>/<env>/<name>.xml`, and a client that named them differently
 * would publish records nothing ever picks up. Both clients must produce
 * byte-identical paths for the same record.
 *
 * Conversion is injected rather than performed here — the converter is a
 * network service, and this stays a pure function so it can be tested without
 * one.
 */

/** Expands a region's filename template. Mirrors the backend helper. */
export function publishFilenameBase(record, fileTemplate) {
  let base = fileTemplate || "{filename}";

  if (base.includes("{filename}")) {
    base = base.replace("{filename}", getRecordFilename(record));
  }

  const uuid = record.id || record.identifier;
  base = base.replace("{uuid}", uuid);

  const title = record.title ? record.title.en || record.title.fr || "untitled" : "untitled";
  return base.replace("{title}", title.replace(/[^a-zA-Z0-9-_]/g, "-"));
}

/**
 * Builds the {files, commitMessage} payload.
 *
 * `xmlContent` and `yamlContent` come from the converter; the JSON copy is the
 * record itself, minus `userinfo` — that is a database join, not metadata, and
 * publishing it would put contributor details in a public repository.
 */
export function buildPublishPayload({
  record,
  environments,
  commitMessage,
  config = {},
  region,
  xmlContent,
  yamlContent,
}) {
  const filenameBase = publishFilenameBase(record, config.fileTemplate);

  const recordForJson = { ...record };
  delete recordForJson.userinfo;
  const jsonContent = JSON.stringify(recordForJson, null, 2);

  const files = [];
  for (const env of environments) {
    const baseDir = region ? `forms/${region}/${env}` : `forms/${env}`;
    files.push({ path: `${baseDir}/${filenameBase}.xml`, content: xmlContent });
    files.push({ path: `${baseDir}/${filenameBase}.yaml`, content: yamlContent });
    files.push({ path: `${baseDir}/${filenameBase}.json`, content: jsonContent });
  }

  // A copy of the record JSON outside the per-environment tree.
  files.push({ path: `records/${filenameBase}.json`, content: jsonContent });

  const title = record.title ? record.title.en || record.title.fr || "untitled" : "untitled";
  return {
    files,
    commitMessage: commitMessage || `Publish metadata record: ${title}`,
  };
}
