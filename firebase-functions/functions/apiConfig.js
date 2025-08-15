// This file contains standardized headers and settings for all external API calls

// Standard headers to prevent Cloudflare blocking and improve API compatibility
const standardHeaders = {
  'User-Agent': 'CIOOS-Metadata-Form/1.0 (Firebase-Functions)',
  'Accept': 'application/json',
  'Accept-Language': 'en,fr',
  'Cache-Control': 'no-cache',
  'X-Requested-With': 'XMLHttpRequest',
  'Connection': 'keep-alive'
};

// Axios configuration with timeout and retry settings
const axiosConfig = {
  timeout: 15000, // 15 second timeout
  validateStatus: (status) => status < 500, // Accept all status codes < 500
  headers: standardHeaders,
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB max content length
};

// Fetch configuration for fetch-based API calls
const fetchConfig = {
  method: 'GET',
  headers: {
    ...standardHeaders,
    'Accept-Encoding': 'gzip, deflate, br'
  },
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'omit'
};

// DataCite specific headers (extends standard headers)
const dataciteHeaders = (authHash) => ({
  ...standardHeaders,
  'Authorization': `Basic ${authHash}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json, application/vnd.api+json'
});

// GBIF specific headers
const gbifHeaders = {
  ...standardHeaders,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// ROR specific headers
const rorHeaders = {
  ...standardHeaders,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

// ORCID specific headers
const orcidHeaders = {
  ...standardHeaders,
  'Accept': 'application/json, application/vnd.orcid+json',
  'Content-Type': 'application/json'
};

// CIOOS Forms specific headers
const cioosHeaders = {
  ...standardHeaders,
  'Accept': 'application/json, text/xml, application/xml',
  'Content-Type': 'application/json'
};

module.exports = {
  standardHeaders,
  axiosConfig,
  fetchConfig,
  dataciteHeaders,
  gbifHeaders,
  rorHeaders,
  orcidHeaders,
  cioosHeaders
};
