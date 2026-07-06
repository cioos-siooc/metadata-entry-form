import { get, post, put } from "./client";

// Region (tenant) display config. The GET is public — it feeds the region
// selector before login. Writes are superadmin-only.

export const getRegions = () => get("/regions");
export const createRegion = (id, config) => post("/regions", { id, config });
export const updateRegion = (id, config) => put(`/regions/${id}`, { config });

export const getSuperadmins = () => get("/superadmins");
export const saveSuperadmins = (superadmins) => put("/superadmins", { superadmins });
