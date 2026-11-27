import AsyncStorage from "expo-sqlite/kv-store";

import { apiBaseOverride, applyApiBaseOverride, normalizeBaseUrl } from "./apiBase";

/**
 * Developer overrides, persisted.
 *
 * The API URL is baked in at build time through EXPO_PUBLIC_API_BASE_URL,
 * which is fine for a shipped app and useless during development: the address
 * of a laptop running the server changes with the network, and a QA build has
 * to be pointed at staging without a rebuild.
 *
 * Not secret and not synced — a per-device override belonging to whoever is
 * holding the phone.
 */

const KEY = "cioos.dev.apiBaseUrl";

/** Loaded once at launch, before anything issues a request. */
export async function loadApiBaseOverride(): Promise<void> {
  try {
    applyApiBaseOverride(await AsyncStorage.getItem(KEY));
  } catch {
    applyApiBaseOverride(null);
  }
}

export async function setApiBaseOverride(url: string | null): Promise<void> {
  const cleaned = normalizeBaseUrl(url);
  applyApiBaseOverride(cleaned);
  if (cleaned) await AsyncStorage.setItem(KEY, cleaned);
  else await AsyncStorage.removeItem(KEY);
}

export { apiBaseOverride };
