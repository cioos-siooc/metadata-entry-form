import Keycloak from "keycloak-js";

// Replaces Firebase Auth (src/auth.js). Keycloak brokers Google, Microsoft
// and ORCID; the SPA is a public OIDC client using PKCE. Sign-in buttons pass
// an idpHint so users land directly on the chosen provider instead of the
// Keycloak login page.
//
// Account linking across providers is handled by Keycloak's first-broker-login
// flow (verify-by-email); users manage linked providers in the Keycloak
// Account Console — see accountConsoleUrl().

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || "/auth";
const realm = import.meta.env.VITE_KEYCLOAK_REALM || "cioos";

export const keycloak = new Keycloak({
  url: keycloakUrl,
  realm,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "metadata-form",
});

let initPromise = null;

// Idempotent: UserProvider calls this on mount; repeated calls share one init.
export function initAuth() {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      silentCheckSsoRedirectUri: `${window.location.origin}${import.meta.env.BASE_URL}silent-check-sso.html`,
    });
  }
  return initPromise;
}

export async function getAccessToken() {
  if (!keycloak.authenticated) return null;
  await keycloak.updateToken(30); // refresh when expiring within 30s
  return keycloak.token;
}

const login = (idpHint) =>
  keycloak.login({ idpHint, redirectUri: window.location.href });

export const signInWithGoogle = () => login("google");
export const signInWithMicrosoft = () => login("microsoft");
export const signInWithOrcid = () => login("orcid");
// Dev realms have local username/password users; no idpHint shows the login form.
export const signInWithKeycloak = () => keycloak.login({ redirectUri: window.location.href });

export const signOut = () =>
  keycloak.logout({ redirectUri: window.location.origin + import.meta.env.BASE_URL });

// Keycloak Account Console page for linking/unlinking identity providers.
export function accountConsoleUrl() {
  return `${keycloakUrl.replace(/\/$/, "")}/realms/${realm}/account/#/security/linked-accounts`;
}

export function currentUser() {
  if (!keycloak.authenticated) return null;
  const claims = keycloak.tokenParsed || {};
  return {
    uid: keycloak.subject,
    email: claims.email,
    displayName: claims.name || claims.preferred_username || claims.email,
  };
}
