// Submitted and published records served like a Web Accessible Folder (WAF)
// by the `forms` function (firebase-functions/python-functions/forms_api.py),
// rendered on request. Settings live in admin/{region}/waf.

export const DEFAULT_WAF_URL = "https://forms.cioos.ca/api/";

// keys match forms_api.FORMATS
export const WAF_FORMATS = [
  { key: "xml", label: "ISO 19115-3 XML" },
  { key: "yaml", label: "YAML" },
  { key: "json", label: "JSON" },
  { key: "erddap", label: "ERDDAP" },
  { key: "datacite_json", label: "DataCite JSON" },
  { key: "datacite_xml", label: "DataCite XML" },
  { key: "cff", label: "Citation CFF" },
];
export const DEFAULT_WAF_FORMATS = ["xml", "yaml"];

export const wafFormatLabel = (key) =>
  WAF_FORMATS.find((format) => format.key === key)?.label || key;

const withTrailingSlash = (url) => (url.endsWith("/") ? url : `${url}/`);

// Normalized WAF settings of a region from its admin/{region}/waf node
export const getWafSettings = (waf) => {
  waf = waf || {};
  return {
    formats: waf.formats?.length ? waf.formats : DEFAULT_WAF_FORMATS,
    splitByOwner: Boolean(waf.splitByOwner),
    url: withTrailingSlash(waf.url || DEFAULT_WAF_URL),
    tokens: waf.tokens || {},
  };
};

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

// Whether the user's Firebase ID token may be sent to this WAF URL. Region
// admins set the URL, so it must not leak reviewers' tokens to another host.
export const isTrustedWafURL = (url) => {
  let origin;
  try {
    origin = new URL(url);
  } catch {
    return false;
  }
  return (
    origin.origin === new URL(DEFAULT_WAF_URL).origin ||
    origin.origin === window.location.origin ||
    LOCAL_HOSTS.includes(origin.hostname)
  );
};

export const WAF_TOKEN_PREFIX = "waf_";

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Random token given once to a harvester, only its hash is stored
export const generateWafToken = () =>
  WAF_TOKEN_PREFIX + toBase64Url(crypto.getRandomValues(new Uint8Array(32)));

// sha256 hex, as compared by firebase-functions/python-functions/forms_api.py
export const hashWafToken = async (token) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// URL a harvester can crawl, the token travels as the Basic auth password
export const harvestURL = (wafURL, region, token = "TOKEN") => {
  const url = new URL(`${withTrailingSlash(wafURL)}${region}/`);
  url.username = "harvester";
  url.password = token;
  return url.toString();
};
