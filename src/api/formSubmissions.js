import { get, post, put, del } from "./client";

// Submissions against schema-driven form types.

export const loadFormSubmissions = (region, formTypeId, params) =>
  get(`/regions/${region}/form-types/${formTypeId}/submissions`, params);

export const loadMyFormSubmissions = (region) => get(`/regions/${region}/form-submissions/mine`);

export const createFormSubmission = (region, formTypeId, data = {}) =>
  post(`/regions/${region}/form-types/${formTypeId}/submissions`, { data });

export const getFormSubmission = (region, id) => get(`/regions/${region}/form-submissions/${id}`);

export const saveFormSubmission = (region, id, data, status) =>
  put(`/regions/${region}/form-submissions/${id}`, { data, ...(status && { status }) });

export const deleteFormSubmission = (region, id) =>
  del(`/regions/${region}/form-submissions/${id}`);
