// Port of firebase-functions/functions/serverUtils.js (checkURLActive).
// Uses Node's global fetch, and adds an SSRF guard: only http(s) URLs whose
// hostname resolves exclusively to public addresses are fetched.

const dns = require("dns").promises;

function isPrivateIPv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) return true;
  const [a, b] = octets;
  return (
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    a === 127 || // 127.0.0.0/8 loopback
    (a === 169 && b === 254) // 169.254.0.0/16 link-local
  );
}

function isPrivateIPv6(address) {
  const addr = address.toLowerCase();
  // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.1): check the embedded IPv4 part
  if (addr.includes(".")) return isPrivateIPv4(addr.slice(addr.lastIndexOf(":") + 1));
  if (addr === "::1" || addr === "0:0:0:0:0:0:0:1") return true; // loopback
  const firstGroup = parseInt(addr.split(":")[0] || "0", 16);
  return (
    (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) || // fc00::/7 unique local
    (firstGroup >= 0xfe80 && firstGroup <= 0xfebf) // fe80::/10 link-local
  );
}

function isPrivateAddress(address, family) {
  return family === 4 ? isPrivateIPv4(address) : isPrivateIPv6(address);
}

// True when the URL is fetchable without touching internal networks:
// http(s) scheme and every resolved address is public.
async function isSafeUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  // URL.hostname wraps IPv6 literals in brackets; dns.lookup wants them bare.
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses.length) return false;
    return addresses.every(({ address, family }) => !isPrivateAddress(address, family));
  } catch {
    // Hostname does not resolve — nothing to fetch
    return false;
  }
}

// Returns true when the URL responds OK to a HEAD request, false otherwise
// (including unsafe/unresolvable URLs, matching the original's
// false-on-any-error behavior).
async function checkURLActive(url) {
  if (!url) return false;

  // Prepend 'http://' if the URL has no scheme (e.g. "example.com/data").
  // URLs with an explicit non-http(s) scheme are rejected by isSafeUrl.
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
    url = "http://" + url;
  }

  if (!(await isSafeUrl(url))) return false;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

module.exports = { checkURLActive, isSafeUrl };
