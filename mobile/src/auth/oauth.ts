import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { apiRoot } from "@/api/transport";

import { exchangeOAuthCode } from "./session";

/**
 * Native OAuth.
 *
 * The provider is opened in a system browser sheet — ASWebAuthenticationSession
 * on iOS, Custom Tabs on Android. Not a WebView: Google rejects OAuth in an
 * embedded WebView outright.
 *
 * Our API brokers the provider exchange, so this only has to drive our own two
 * endpoints. The callback comes back to the app's registered scheme carrying a
 * single-use code, which is then traded for tokens over a normal POST. The
 * refresh token never appears in the redirect URL, because custom-scheme URLs
 * land in OS logs and any installed app can claim the scheme.
 *
 * PKCE is what makes the code useless to anyone but us: the verifier stays in
 * memory here and only its SHA-256 challenge is sent to the server.
 */

export type OAuthProvider = "google" | "microsoft" | "orcid";

export type OAuthResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "error"; message: string };

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64UrlEncode(Crypto.getRandomBytes(32));
  const challenge = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  // Expo returns standard base64; the server compares base64url.
  return {
    verifier,
    challenge: challenge.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };
}

export async function signInWithProvider(
  provider: OAuthProvider,
  device: { deviceId?: string; deviceName?: string } = {},
): Promise<OAuthResult> {
  const { verifier, challenge } = await createPkcePair();
  const returnTo = Linking.createURL("auth-callback");

  const start = new URL(`${apiRoot()}/v1/auth/oauth/${provider}/start`);
  start.searchParams.set("client", "native");
  start.searchParams.set("codeChallenge", challenge);
  start.searchParams.set("returnTo", returnTo);
  if (device.deviceName) start.searchParams.set("deviceName", device.deviceName);
  if (device.deviceId) start.searchParams.set("deviceId", device.deviceId);

  const result = await WebBrowser.openAuthSessionAsync(start.toString(), returnTo);

  if (result.type === "cancel" || result.type === "dismiss") {
    return { status: "cancelled" };
  }
  if (result.type !== "success") {
    return { status: "error", message: "Sign-in did not complete" };
  }

  const callback = new URL(result.url);
  // The server redirects here with auth_error rather than stranding the app on
  // a spinner, so surface it.
  const serverError = callback.searchParams.get("auth_error");
  if (serverError) return { status: "error", message: serverError };

  const code = callback.searchParams.get("code");
  if (!code) return { status: "error", message: "No sign-in code was returned" };

  try {
    await exchangeOAuthCode(code, verifier, device);
    return { status: "success" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Could not complete sign-in",
    };
  }
}
