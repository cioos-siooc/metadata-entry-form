import * as Device from "expo-device";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { get } from "@/api/client";
import { ApiError, NetworkError } from "@/api/errors";
import i18n, { deviceLanguage, type Language } from "@/i18n";
import { loadApiBaseOverride } from "@/state/devSettings";
import {
  loadPreferences,
  saveLanguage,
  saveRegion,
  saveTheme,
} from "@/state/preferences";
import type { ThemeName } from "@/theme/tokens";

import { signInWithProvider, type OAuthProvider, type OAuthResult } from "./oauth";
import {
  getCurrentUser,
  restoreSession,
  rememberRegionRoles,
  signInWithPassword,
  signOut as endSession,
  type SessionStatus,
  type SessionUser,
} from "./session";
import { readReceipt, type RegionRoles } from "./tokenStore";

/**
 * Session, region, language and theme in one provider.
 *
 * They belong together because they are entangled: roles are per-region and
 * must be refetched whenever the region changes (the API derives them per
 * region — there is no global role), and the theme's accent is derived from the
 * active region's brand colour.
 */

const NO_ROLES: RegionRoles = { isAdmin: false, isReviewer: false, isSuperadmin: false };

interface SessionContextValue {
  /** null while restoring at launch. */
  status: SessionStatus | null;
  user: SessionUser | null;
  /** True when running on a cached receipt with no connectivity. */
  isOffline: boolean;
  roles: RegionRoles;

  region: string | null;
  setRegion: (region: string | null) => Promise<void>;

  language: Language;
  setLanguage: (language: Language) => Promise<void>;

  /** null follows the OS; "night" is always explicit. */
  themeOverride: ThemeName | null;
  setThemeOverride: (theme: ThemeName | null) => Promise<void>;

  signIn: (email: string, password: string) => Promise<void>;
  signInWith: (provider: OAuthProvider) => Promise<OAuthResult>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const deviceInfo = () => ({
  deviceId: Device.osBuildId ?? undefined,
  deviceName: Device.deviceName ?? Device.modelName ?? undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [region, setRegionState] = useState<string | null>(null);
  const [language, setLanguageState] = useState<Language>(deviceLanguage());
  const [themeOverride, setThemeOverrideState] = useState<ThemeName | null>(null);
  const [roles, setRoles] = useState<RegionRoles>(NO_ROLES);

  // Restore preferences and session once, at launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Before anything issues a request: a dev override has to be in place
      // or the first calls go to the build-time address.
      await loadApiBaseOverride();
      const prefs = await loadPreferences();
      if (cancelled) return;

      setRegionState(prefs.region);
      setThemeOverrideState(prefs.theme);
      const lang = prefs.language ?? deviceLanguage();
      setLanguageState(lang);
      await i18n.changeLanguage(lang);

      try {
        const restored = await restoreSession();
        if (!cancelled) setStatus(restored);
      } catch {
        if (!cancelled) setStatus({ state: "signedOut" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Roles are per-region, so refetch whenever either changes.
  useEffect(() => {
    if (!region || !status || status.state === "signedOut") {
      setRoles(NO_ROLES);
      return;
    }

    let cancelled = false;
    (async () => {
      // Offline: fall back to whatever the receipt recorded for this region.
      if (status.state === "offline") {
        const receipt = await readReceipt();
        if (!cancelled) setRoles(receipt?.roles?.[region] ?? NO_ROLES);
        return;
      }

      try {
        const me = await get<RegionRoles>(`/regions/${region}/me`);
        if (cancelled) return;
        const next: RegionRoles = {
          isAdmin: Boolean(me.isAdmin),
          isReviewer: Boolean(me.isReviewer),
          isSuperadmin: Boolean(me.isSuperadmin),
        };
        setRoles(next);
        // Persist so the Review tab is still correct on a cold offline launch.
        await rememberRegionRoles(region, next);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NetworkError) {
          const receipt = await readReceipt();
          if (!cancelled) setRoles(receipt?.roles?.[region] ?? NO_ROLES);
          return;
        }
        // A 403 or similar means no elevated role here, which is not an error.
        if (err instanceof ApiError) setRoles(NO_ROLES);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [region, status]);

  const setRegion = useCallback(async (next: string | null) => {
    setRegionState(next);
    await saveRegion(next);
  }, []);

  const setLanguage = useCallback(async (next: Language) => {
    setLanguageState(next);
    await i18n.changeLanguage(next);
    await saveLanguage(next);
  }, []);

  const setThemeOverride = useCallback(async (next: ThemeName | null) => {
    setThemeOverrideState(next);
    await saveTheme(next);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await signInWithPassword(email, password, deviceInfo());
    setStatus({ state: "online", user });
  }, []);

  const signInWith = useCallback(async (provider: OAuthProvider) => {
    const result = await signInWithProvider(provider, deviceInfo());
    if (result.status === "success") {
      const user = getCurrentUser();
      if (user) setStatus({ state: "online", user });
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await endSession();
    setStatus({ state: "signedOut" });
    setRoles(NO_ROLES);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user: status && status.state !== "signedOut" ? status.user : null,
      isOffline: status?.state === "offline",
      roles,
      region,
      setRegion,
      language,
      setLanguage,
      themeOverride,
      setThemeOverride,
      signIn,
      signInWith,
      signOut,
    }),
    [
      status,
      roles,
      region,
      setRegion,
      language,
      setLanguage,
      themeOverride,
      setThemeOverride,
      signIn,
      signInWith,
      signOut,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside a SessionProvider");
  return value;
}
