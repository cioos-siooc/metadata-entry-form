// This file contains standardized headers and settings for React components

// Standard headers to prevent Cloudflare blocking and improve API compatibility
export const standardHeaders = {
  'User-Agent': 'CIOOS-Metadata-Form/1.0',
  'Accept': 'application/json',
  'Accept-Language': 'en,fr',
  'Cache-Control': 'no-cache',
  'X-Requested-With': 'XMLHttpRequest',
};

// Standard ror headers to prevent Cloudflare blocking and improve API compatibility, it does not support cache-control option 
export const standardRORHeaders = {
  'User-Agent': 'CIOOS-Metadata-Form/1.0',
  'Accept': 'application/json',
  'Accept-Language': 'en,fr',
  'X-Requested-With': 'XMLHttpRequest',
};

// Axios configuration with timeout and validation settings
export const axiosConfig = {
  timeout: 10000, // 10 second timeout
  validateStatus: (status) => status < 500, // Accept all status codes < 500
  headers: standardHeaders,
};

// Fetch configuration for fetch-based API calls
export const fetchConfig = {
  method: 'GET',
  headers: {
    ...standardHeaders,
    'Accept-Encoding': 'gzip, deflate, br',
  },
  mode: 'cors',
  cache: 'no-cache',
  credentials: 'omit',
};

// GBIF specific headers
export const gbifHeaders = {
  ...standardHeaders,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// ROR specific headers
export const rorHeaders = {
  ...standardRORHeaders,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// ORCID specific headers
export const orcidHeaders = {
  ...standardRORHeaders,
  'Accept': 'application/json, application/vnd.orcid+json',
  'Content-Type': 'application/json',
};

// Function to create headers with custom Accept type
export const createHeaders = (acceptType = 'application/json') => ({
  ...standardHeaders,
  'Accept': acceptType,
});
