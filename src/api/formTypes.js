import { get, post, put, del } from "./client";

// Form type definitions (JSON Schema + UI Schema), region-scoped.

export const loadFormTypes = (region, includeDisabled = false) =>
  get(`/regions/${region}/form-types`, includeDisabled ? { includeDisabled: "1" } : undefined);

export const getFormType = (region, id) => get(`/regions/${region}/form-types/${id}`);

export const createFormType = (region, formType) => post(`/regions/${region}/form-types`, formType);

export const saveFormType = (region, id, formType) =>
  put(`/regions/${region}/form-types/${id}`, formType);

export const deleteFormType = (region, id) => del(`/regions/${region}/form-types/${id}`);
