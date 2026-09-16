import { del, get, post, put } from "./client";

/**
 * Saved contacts, platforms and instruments — the user's reusable library.
 *
 * The list endpoint returns a KEYED OBJECT `{ [id]: data }`, not an array, and
 * the comment in routes/entities.js says so explicitly: "the shape the frontend
 * components expect". Normalised to an array here so the UI does not have to
 * care, and so the same mistake as /regions cannot repeat.
 */

export type EntityKind = "contacts" | "platforms" | "instruments";

export interface SavedEntity {
  id: string;
  data: Record<string, unknown>;
}

const base = (region: string, userId: string, kind: EntityKind) =>
  `/regions/${region}/users/${userId}/${kind}`;

export async function listEntities(
  region: string,
  userId: string,
  kind: EntityKind,
): Promise<SavedEntity[]> {
  const keyed = await get<Record<string, Record<string, unknown>>>(base(region, userId, kind));
  return Object.entries(keyed ?? {}).map(([id, data]) => ({ id, data }));
}

export function createEntity(
  region: string,
  userId: string,
  kind: EntityKind,
  data: Record<string, unknown>,
) {
  return post<SavedEntity>(base(region, userId, kind), data);
}

export function updateEntity(
  region: string,
  userId: string,
  kind: EntityKind,
  id: string,
  data: Record<string, unknown>,
) {
  return put<SavedEntity>(`${base(region, userId, kind)}/${id}`, data);
}

export function deleteEntity(region: string, userId: string, kind: EntityKind, id: string) {
  return del<void>(`${base(region, userId, kind)}/${id}`);
}
