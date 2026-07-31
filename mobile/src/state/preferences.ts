// expo-sqlite's key-value store rather than @react-native-async-storage:
// identical API, no extra native module, and async-storage v3 dropped the
// legacy fallback so it throws "Native module is null" in Expo Go.
import AsyncStorage from "expo-sqlite/kv-store";

import { isSupported, type Language } from "@/i18n";
import { isRotationPreference, type RotationPreference } from "@/state/orientation";
import type { ThemeName } from "@/theme/tokens";

/**
 * Device preferences: region, language, theme.
 *
 * Region is the notable one. In the web SPA it lives *only* in the URL — there
 * is no localStorage or cookie for it — so reloading a bare URL dumps you back
 * at the region picker. On a phone that is unacceptable: the app is launched
 * cold, repeatedly, often without connectivity.
 *
 * A plain key-value store rather than SecureStore: none of this is secret, and
 * the keychain is reserved for the refresh token.
 */

const KEYS = {
  region: "cioos.pref.region",
  language: "cioos.pref.language",
  theme: "cioos.pref.theme",
  rotation: "cioos.pref.rotation",
} as const;

const THEME_NAMES: ThemeName[] = ["light", "dark", "night"];

export interface Preferences {
  region: string | null;
  language: Language | null;
  /** null means "follow the OS". Night is always an explicit choice. */
  theme: ThemeName | null;
  /** Whether the app may turn. Defaults to allowing it, for tablets. */
  rotation: RotationPreference;
}

export async function loadPreferences(): Promise<Preferences> {
  try {
    const [region, language, theme, rotation] = await Promise.all([
      AsyncStorage.getItem(KEYS.region),
      AsyncStorage.getItem(KEYS.language),
      AsyncStorage.getItem(KEYS.theme),
      AsyncStorage.getItem(KEYS.rotation),
    ]);
    return {
      region: region || null,
      language: isSupported(language ?? undefined) ? (language as Language) : null,
      theme: THEME_NAMES.includes(theme as ThemeName) ? (theme as ThemeName) : null,
      rotation: isRotationPreference(rotation) ? rotation : "auto",
    };
  } catch {
    // A read failure must not block launch — fall back to defaults.
    return { region: null, language: null, theme: null, rotation: "auto" };
  }
}

export async function saveRegion(region: string | null): Promise<void> {
  if (region) await AsyncStorage.setItem(KEYS.region, region);
  else await AsyncStorage.removeItem(KEYS.region);
}

export async function saveLanguage(language: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.language, language);
}

export async function saveTheme(theme: ThemeName | null): Promise<void> {
  if (theme) await AsyncStorage.setItem(KEYS.theme, theme);
  else await AsyncStorage.removeItem(KEYS.theme);
}

export async function saveRotation(rotation: RotationPreference): Promise<void> {
  await AsyncStorage.setItem(KEYS.rotation, rotation);
}
