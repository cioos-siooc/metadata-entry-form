import { getAccessToken, refreshAccessToken } from "../auth/session";

// The single place that knows how to reach the API. Same-origin by default
// (nginx/Vite proxies /api); override with VITE_API_BASE_URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function sendRequest(url, { method, body, headers }, token) {
  return fetch(url, {
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

export async function apiFetch(path, { method = "GET", body, params, headers } = {}) {
  const url = new URL(`${BASE_URL}/v1${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    });
  }

  let token = await getAccessToken();
  let response = await sendRequest(url, { method, body, headers }, token);

  // Access token may have expired between the proactive check and the request;
  // refresh once and retry.
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) response = await sendRequest(url, { method, body, headers }, token);
  }

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, json?.error || response.statusText, json);
  }
  return json;
}

export const get = (path, params) => apiFetch(path, { params });
export const post = (path, body) => apiFetch(path, { method: "POST", body });
export const put = (path, body, headers) => apiFetch(path, { method: "PUT", body, headers });
export const del = (path, body) => apiFetch(path, { method: "DELETE", body });
