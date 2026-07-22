import { get, post, put, del } from "./client";

// Replacements for the Firebase httpsCallable functions. Each returns a
// {data}-shaped object so existing call sites (which unwrap `.data`) keep
// working unchanged. New code should prefer src/api/* modules directly.

export const translate = async (payload) => ({ data: await post("/translate", payload) });

export const checkURLActive = async (url) => ({ data: (await post("/url-check", { url })).active });

export const regenerateXMLforRecord = async ({ region, recordID }) => ({
  data: await post(`/regions/${region}/records/${recordID}/regenerate-xml`, {}),
});

// record-export proxies the converter's response body, which is already
// {data: <converted payload>} — don't wrap it a second time.
export const downloadRecord = async ({ region, record, fileType }) =>
  post(`/regions/${region}/record-export`, { record, fileType });

export const convertMetadata = async ({ region, record, outputFormat }) =>
  post(`/regions/${region}/record-export`, { record, fileType: outputFormat });

export const createDraftDoi = async ({ region, record }) => ({
  data: await post(`/regions/${region}/doi`, { record }),
});

export const updateDraftDoi = async ({ region, doi, data }) => ({
  data: await put(`/regions/${region}/doi`, { doi, data }),
});

export const deleteDraftDoi = async ({ region, doi }) => ({
  data: await del(`/regions/${region}/doi`, { doi }),
});

export const getDoiStatus = async ({ region, doi }) => ({
  data: (await get(`/regions/${region}/doi/status`, { doi })).status,
});

export const getCredentialsStored = async (region) => ({
  data: (await get(`/regions/${region}/doi/config`)).hasCredentials,
});

export const getDatacitePrefix = async (region) => ({
  data: (await get(`/regions/${region}/doi/config`)).prefix,
});

export const testDataciteCredentials = async ({ region, prefix, authHash }) => ({
  data: await post(`/regions/${region}/doi/test-credentials`, { prefix, authHash }),
});

export const githubPublishRecord = async ({ region, files, commitMessage }) => ({
  data: await post(`/regions/${region}/github-publish`, { files, commitMessage }),
});
