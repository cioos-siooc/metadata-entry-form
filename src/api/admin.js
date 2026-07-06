import { get, put, del } from "./client";

// Region admin configuration. Replaces the /admin/{region} RTDB reads/writes
// in Admin.jsx and GitHubPublishDialog.jsx. Secrets are write-only: reads
// return presence flags (hasCredentials / hasToken), never values.

export const getPermissions = (region) => get(`/regions/${region}/admin/permissions`);
export const savePermissions = (region, { admins, reviewers }) =>
  put(`/regions/${region}/admin/permissions`, { admins, reviewers });

export const saveProjects = (region, projects) =>
  put(`/regions/${region}/admin/projects`, { projects });

export const getDataciteCredentials = (region) =>
  get(`/regions/${region}/admin/datacite-credentials`);
export const saveDataciteCredentials = (region, { prefix, apiDomain, dataciteHash }) =>
  put(`/regions/${region}/admin/datacite-credentials`, { prefix, apiDomain, dataciteHash });
export const deleteDataciteCredentials = (region) =>
  del(`/regions/${region}/admin/datacite-credentials`);

export const getGithubCredentials = (region) =>
  get(`/regions/${region}/admin/github-credentials`);
export const saveGithubCredentials = (
  region,
  { owner, repo, branch, environment, fileTemplate, token },
) =>
  put(`/regions/${region}/admin/github-credentials`, {
    owner,
    repo,
    branch,
    environment,
    fileTemplate,
    token,
  });
export const deleteGithubCredentials = (region) =>
  del(`/regions/${region}/admin/github-credentials`);

export const getRecordGeneratorUrl = (region) =>
  get(`/regions/${region}/admin/record-generator-url`);
export const saveRecordGeneratorUrl = (region, url) =>
  put(`/regions/${region}/admin/record-generator-url`, { url });
