/**
 * An in-memory stand-in for firebase/database.
 *
 * The Firebase CLI's RTDB emulator needs a JVM, so rather than skip the storage
 * layer entirely this replaces the module with a tiny tree that behaves the way
 * RTDB does for the operations the stores use. What is under test is each
 * store's own logic — path construction, status mapping, index maintenance —
 * which is where the risk lives.
 *
 * Use it as:
 *
 *   vi.mock("firebase/database", async () =>
 *     (await import("./helpers/fakeRtdb")).fakeDatabaseModule);
 *   vi.mock("../../firebase", () => ({ default: {} }));
 *   const { resetDatabase, databaseTree } = await import("./helpers/fakeRtdb");
 *
 * The mock factory and the test import the same module instance, so they share
 * the same tree.
 */

/** The fake database tree, reset before each test. */
let tree = {};

function readPath(path) {
  return String(path)
    .split("/")
    .filter(Boolean)
    .reduce((node, key) => (node == null ? undefined : node[key]), tree);
}

function writePath(path, value) {
  const parts = String(path).split("/").filter(Boolean);
  const last = parts.pop();
  const parent = parts.reduce((node, key) => {
    if (node[key] === undefined || node[key] === null) node[key] = {};
    return node[key];
  }, tree);
  if (value === null) delete parent[last];
  else parent[last] = value;
}

let pushCounter = 0;

/**
 * Realtime Database has no array type and never stores null:
 *
 *   - an array is stored as an object keyed "0", "1", … and comes back that way
 *   - writing null deletes the key rather than storing it
 *
 * Emulating both is what lets this suite catch round-trip mangling of nested
 * structures. A fake that stores arrays as arrays hides the problem entirely,
 * which is exactly what happened here: a JSON Schema is full of nested arrays
 * (`required`, `enum`, `ui:steps`), and they came back as objects in production
 * while every test passed.
 */
export function toRtdbShape(value) {
  if (Array.isArray(value)) {
    return value.reduce((acc, item, index) => {
      const converted = toRtdbShape(item);
      if (converted !== null && converted !== undefined) {
        acc[String(index)] = converted;
      }
      return acc;
    }, {});
  }
  if (value === null || typeof value !== "object") return value;
  return Object.entries(value).reduce((acc, [key, item]) => {
    if (item === null || item === undefined) return acc;
    const converted = toRtdbShape(item);
    // RTDB does not store empty containers either — writing {} or [] deletes
    // the location. So an empty `contacts: []` comes back as UNDEFINED, not as
    // {}, and callers rely on getBlankRecord() to put the empty array back. A
    // fake that stored {} here would hand every consumer a non-array where
    // production hands them nothing.
    if (
      converted !== null &&
      typeof converted === "object" &&
      Object.keys(converted).length === 0
    ) {
      return acc;
    }
    acc[key] = converted;
    return acc;
  }, {});
}

export const fakeDatabaseModule = {
  getDatabase: () => ({}),
  ref: (_db, path) => ({ path: path || "" }),
  get: async (reference) => {
    const value = readPath(reference.path);
    const resolved = value === undefined ? null : value;
    return {
      exists: () => value !== undefined && value !== null,
      val: () => resolved,
      // Real snapshots expose both. Code that reads .toJSON() (getRegionProjects,
      // loadRegionRecords, the saved-library listeners) crashes without it.
      toJSON: () => resolved,
    };
  },
  set: async (reference, value) =>
    writePath(reference.path, value === null ? null : toRtdbShape(value)),
  update: async (reference, patch) => {
    const existing = readPath(reference.path) || {};
    const merged = { ...existing, ...patch };
    // A null in an update() deletes that key, matching RTDB.
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === undefined) delete merged[key];
    });
    writePath(reference.path, toRtdbShape(merged));
  },
  push: async (reference, value) => {
    pushCounter += 1;
    const key = `key${String(pushCounter).padStart(3, "0")}`;
    writePath(`${reference.path}/${key}`, toRtdbShape(value));
    return { key };
  },
  remove: async (reference) => writePath(reference.path, null),
  child: (reference, path) => ({ path: `${reference.path}/${path}` }),
  onValue: () => () => {},
};


/** Empties the tree between tests. */
export function resetDatabase() {
  tree = {};
  pushCounter = 0;
}

/** The raw tree, for asserting on what was actually written. */
export function databaseTree() {
  return tree;
}
