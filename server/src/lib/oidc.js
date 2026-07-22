const config = require("../config");

// Thin wrapper over openid-client v6 (ESM-only, so lazy dynamic import from
// this CommonJS module). Drives the authorization-code + PKCE flow for the
// social providers and returns normalized identity claims.
//
// Microsoft caveat: the multi-tenant `common` endpoint's discovery issuer
// contains a `{tenantid}` placeholder that will not match the concrete token
// issuer, so openid-client rejects it. Point OAUTH_MICROSOFT_DISCOVERY_URL at a
// specific tenant (a tenant GUID, or `organizations`/`consumers`) whose
// discovery issuer is concrete, or set OAUTH_MICROSOFT_TENANT.

let clientMod;
async function oc() {
  if (!clientMod) clientMod = await import("openid-client");
  return clientMod;
}

const configs = {};
async function getConfig(provider) {
  const p = config.oauth[provider];
  if (!p || !p.enabled) {
    const err = new Error(`Unknown or disabled auth provider: ${provider}`);
    err.statusCode = 404;
    throw err;
  }
  if (!configs[provider]) {
    const client = await oc();
    configs[provider] = await client.discovery(new URL(p.discoveryUrl), p.clientId, p.clientSecret);
  }
  return configs[provider];
}

function redirectUri(provider) {
  return `${config.apiBaseUrl}/api/v1/auth/oauth/${provider}/callback`;
}

// Generates PKCE/state/nonce and the provider authorization URL. Caller
// persists { codeVerifier, nonce, state } server-side keyed by state.
async function startAuth(provider) {
  const client = await oc();
  const cfg = await getConfig(provider);
  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();
  const url = client.buildAuthorizationUrl(cfg, {
    redirect_uri: redirectUri(provider),
    scope: config.oauth[provider].scopes.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });
  return { url: url.href, codeVerifier, nonce, state };
}

// Exchanges the callback code for tokens, validates the ID token, and returns
// normalized identity claims.
async function completeAuth(provider, currentUrl, { codeVerifier, nonce, state }) {
  const client = await oc();
  const cfg = await getConfig(provider);
  const tokens = await client.authorizationCodeGrant(cfg, new URL(currentUrl), {
    pkceCodeVerifier: codeVerifier,
    expectedNonce: nonce,
    expectedState: state,
    idTokenExpected: true,
  });
  const claims = tokens.claims();
  return {
    providerSubject: claims.sub,
    email: claims.email || null,
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name || claims.given_name || null,
  };
}

module.exports = { startAuth, completeAuth, redirectUri };
