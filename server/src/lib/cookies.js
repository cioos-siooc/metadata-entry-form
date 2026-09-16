// Minimal cookie read/serialize. Avoids @fastify/cookie, whose v11 internal
// dynamic import() breaks under Jest's CJS VM; we only need one cookie.

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (key) out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function getCookie(request, name) {
  return parseCookies(request.headers.cookie)[name];
}

function serializeCookie(name, value, opts = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (opts.maxAge != null) str += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (opts.domain) str += `; Domain=${opts.domain}`;
  str += `; Path=${opts.path || "/"}`;
  if (opts.httpOnly) str += "; HttpOnly";
  if (opts.secure) str += "; Secure";
  if (opts.sameSite) {
    const v = String(opts.sameSite);
    str += `; SameSite=${v.charAt(0).toUpperCase()}${v.slice(1)}`;
  }
  return str;
}

// Appends a Set-Cookie header without clobbering any already set.
function appendCookie(reply, name, value, opts) {
  const existing = reply.getHeader("set-cookie");
  const cookie = serializeCookie(name, value, opts);
  if (!existing) reply.header("set-cookie", cookie);
  else reply.header("set-cookie", [].concat(existing, cookie));
}

module.exports = { getCookie, appendCookie };
