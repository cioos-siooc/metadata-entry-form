import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards against reading database paths the security rules deny.
 *
 * This class of bug is invisible in unit tests — an in-memory fake happily
 * returns whatever you ask for — and only surfaces as "permission denied" in a
 * real deployment. The specific trap: the rules grant `.read` at
 * `admin/$region` (to that region's reviewers) but define NOTHING at `/admin`
 * itself, so reading the whole node fails for everyone. Cascading rules mean a
 * child grant never widens the parent.
 *
 * Rather than parse the store's control flow, this asserts on the literal paths
 * it passes to readValue.
 */

const STORE_PATH = join(
  process.cwd(),
  "src",
  "formEngine",
  "store",
  "firebaseFormStore.js"
);

const source = readFileSync(STORE_PATH, "utf8");

/** Every string or template literal handed to readValue(...). */
function readValuePaths(text) {
  return [...text.matchAll(/readValue\(\s*([`"'])((?:\\.|(?!\1).)*)\1/g)].map(
    (match) => match[2]
  );
}

const paths = readValuePaths(source);

describe("store reads only readable paths", () => {
  it("reads something at all, so the matcher is not silently vacuous", () => {
    expect(paths.length).toBeGreaterThan(5);
  });

  it("never reads the bare /admin node", () => {
    // No .read rule exists at /admin — only at admin/$regionAdmin. Reading the
    // whole node is denied for every user, including admins.
    const offenders = paths.filter((path) => path === "admin");
    expect(
      offenders,
      "reading /admin wholesale is denied by the rules; read admin/{region}/... per region instead"
    ).toEqual([]);
  });

  it("keeps every admin read scoped to a region", () => {
    const adminReads = paths.filter((path) => path.startsWith("admin"));
    expect(adminReads.length).toBeGreaterThan(0);
    adminReads.forEach((path) => {
      // Either an interpolated region (`admin/${region}/...`) or a literal
      // second segment — never just "admin" or "admin/".
      expect(path).toMatch(/^admin\/[^/]+\/.+/);
    });
  });

  it("only reads admin subpaths that are actually readable", () => {
    // Of everything under admin/{region}, exactly two things carry a broad
    // .read: `permissions/*` and the `formTypes` activation node this feature
    // added. Anything else is reviewer-only and will fail for ordinary members.
    const readable = [/^admin\/[^/]+\/permissions\//, /^admin\/[^/]+\/formTypes/];
    const adminReads = paths.filter((path) => path.startsWith("admin"));

    const unreadable = adminReads.filter(
      (path) => !readable.some((pattern) => pattern.test(path))
    );
    expect(
      unreadable,
      "these admin paths are reviewer-only; reading them will 'permission denied' for a member"
    ).toEqual([]);
  });
});
