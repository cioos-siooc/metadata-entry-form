// MUST be first. `uuid`, used by @cioos/shared's getBlankRecord, calls
// crypto.getRandomValues, which React Native does not provide. Without this
// polyfill loaded before any module that mints an id, record creation throws
// "crypto.getRandomValues() not supported" at runtime.
import "react-native-get-random-values";

import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { regionBrandHex } from "@/api/regions";
import { SessionProvider, useSession } from "@/auth/SessionProvider";
// Side-effect import: initialises i18next before any screen renders.
import "@/i18n";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();

/**
 * Sends the user wherever they actually need to be: pick a region, sign in, or
 * the app itself. Region comes first because every API path is region-scoped
 * and the theme's accent is derived from it.
 */
function useAuthGate() {
  const { status, region } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!status) return; // still restoring

    const route = segments[0];
    const onRegionSelect = route === "region-select";
    const onSignIn = route === "sign-in";
    // Shows no user data — only tokens, type and colour — so it stays reachable
    // without a session. That matters because reviewing the design should not
    // require a running backend.
    const onDesignPreview = route === "design-preview";
    if (onDesignPreview) return;

    if (!region) {
      if (!onRegionSelect) router.replace("/region-select");
      return;
    }
    if (status.state === "signedOut") {
      if (!onSignIn) router.replace("/sign-in");
      return;
    }
    // Signed in (or running offline on a receipt) — leave the auth screens.
    if (onSignIn || onRegionSelect) router.replace("/");
  }, [status, region, segments, router]);
}

function RootNavigator() {
  const theme = useTheme();
  useAuthGate();

  return (
    <>
      <StatusBar style={theme.name === "light" ? "dark" : "light"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.surface },
        }}
      />
    </>
  );
}

/** Bridges the session's region and theme choice into the theme provider. */
function ThemedApp() {
  const { region, themeOverride } = useSession();
  return (
    <ThemeProvider brandHex={regionBrandHex(region)} override={themeOverride ?? undefined}>
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    // Hide on error too: a missing font should degrade to the system face,
    // not strand the user on the splash screen forever.
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SessionProvider>
      <ThemedApp />
    </SessionProvider>
  );
}
