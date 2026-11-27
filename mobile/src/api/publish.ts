import { get, post } from "./client";

/**
 * GitHub publishing.
 *
 * Reviewer-and-above, and only where the region has a token stored. The config
 * is fetched rather than assumed so the UI can show an honest "not set up for
 * this region" instead of a button that fails.
 */

export interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  /** May be a single name or a list, depending on how the region was set up. */
  environment: string | string[];
  fileTemplate: string;
  hasToken: boolean;
}

export function getGithubConfig(region: string) {
  return get<GithubConfig>(`/regions/${region}/admin/github-credentials`);
}

/** Normalises the environment field, which the API exposes either way. */
export function environmentList(config: GithubConfig | null): string[] {
  const raw = config?.environment;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (raw) return [raw];
  return ["prod"];
}

export function publishToGithub(
  region: string,
  files: { path: string; content: string }[],
  commitMessage: string,
) {
  return post<{ ok?: boolean; commit?: string }>(`/regions/${region}/github-publish`, {
    files,
    commitMessage,
  });
}

export function regenerateXml(region: string, recordID: string) {
  return post<unknown>(`/regions/${region}/records/${recordID}/regenerate-xml`, {});
}
