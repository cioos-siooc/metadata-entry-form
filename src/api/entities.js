import { get, post, put, del } from "./client";

// Per-user reusable entities (saved contacts / platforms / instruments).
// Replaces src/utils/firebase{Contact,Platform,Instrument}Functions.js.
// List calls return keyed objects {id: entity} — the shape components expect.

function makeEntityApi(kind) {
  const base = (region, userID) => `/regions/${region}/users/${userID}/${kind}`;
  return {
    list: (region, userID) => get(base(region, userID)),
    getOne: (region, userID, id) => get(`${base(region, userID)}/${id}`),
    // returns the new id (push().key equivalent)
    create: async (region, userID, entity) =>
      (await post(base(region, userID), entity)).id,
    update: (region, userID, id, entity) => put(`${base(region, userID)}/${id}`, entity),
    remove: (region, userID, id) => del(`${base(region, userID)}/${id}`),
    clone: async (region, userID, id) =>
      (await post(`${base(region, userID)}/${id}/clone`, {})).id,
  };
}

export const contacts = makeEntityApi("contacts");
export const platforms = makeEntityApi("platforms");
export const instruments = makeEntityApi("instruments");
