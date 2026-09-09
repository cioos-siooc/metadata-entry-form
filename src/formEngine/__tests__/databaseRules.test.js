import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import regions, { RESERVED_REGION_IDS } from "../../regions";

/**
 * Realtime Database rules cannot iterate over the top-level keys, so the write
 * rule on /formTypes has to name every region explicitly. That makes it possible
 * to add a region and silently leave its admins unable to manage the shared
 * catalog — this suite is what catches that.
 */

const RULES_PATH = join(
  process.cwd(),
  "firebase-functions",
  "database.rules.json"
);

const raw = readFileSync(RULES_PATH, "utf8");

/**
 * Firebase allows // comments and trailing commas in its rules file; JSON.parse
 * allows neither.
 *
 * The stripper has to be quote-aware: comments appear both on their own lines
 * and trailing actual code (`"admin": { // Section of the database …`), and rule
 * expressions are themselves quoted strings that must not be touched.
 */
function parseRules(text) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      out += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (char === "/" && text[i + 1] === "/") {
      // Skip to the end of the line, keeping the newline so line numbers in any
      // parse error still line up with the file.
      while (i < text.length && text[i] !== "\n") i += 1;
      out += "\n";
      continue;
    }

    out += char;
  }

  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const rules = parseRules(raw).rules;

describe("database rules parse", () => {
  it("is valid JSON once comments are stripped", () => {
    expect(rules).toBeTypeOf("object");
  });
});

describe("/formTypes", () => {
  const node = rules.formTypes;

  it("exists as a literal child, not under the $region wildcard", () => {
    // A named child is resolved before the wildcard. If the catalog lived under
    // $region it would inherit that node's rules and every region would need
    // its own copy of every form type.
    expect(node).toBeDefined();
    expect(rules.$region.formTypes).toBeUndefined();
  });

  it("is readable by any authenticated user", () => {
    // Members need to see which forms exist; what they may FILL IN is gated by
    // each region's activation instead.
    expect(node[".read"]).toBe("auth.uid != null");
  });

  it("names every region in its write rule", () => {
    const write = node[".write"];
    const missing = Object.keys(regions).filter(
      (slug) => !write.includes(`admin/${slug}/permissions/admins`)
    );
    expect(
      missing,
      "region(s) in src/regions.js whose admins cannot manage the shared form catalog — add them to the .write rule on /formTypes"
    ).toEqual([]);
  });

  it("names no region that does not exist", () => {
    const write = node[".write"];
    const referenced = [...write.matchAll(/admin\/([a-z0-9]+)\/permissions/g)].map(
      (match) => match[1]
    );
    const unknown = referenced.filter((slug) => !(slug in regions));
    expect(unknown).toEqual([]);
  });

  it("guards every operand against a missing admin list", () => {
    // .val() on an absent node returns null, and null.contains(...) is a rule
    // EVALUATION ERROR that fails the whole || chain — locking out every admin,
    // not just the region with no list. This is exactly the bug that made
    // publishing fail on a dev database with only some regions configured.
    const write = node[".write"];
    const guards = (write.match(/isString\(\)/g) || []).length;
    const derefs = (write.match(/\.val\(\)\.contains/g) || []).length;
    expect(guards).toBe(derefs);
    expect(guards).toBe(Object.keys(regions).length);
  });

  it("requires an admin, not merely an authenticated user", () => {
    const write = node[".write"];
    expect(write).toContain("permissions/admins");
    expect(write).not.toBe("auth.uid != null");
  });

  it("no longer depends on a superadmin list", () => {
    // The role was dropped in favour of shared admin ownership plus the
    // publish-time guardrails.
    expect(raw).not.toContain("admin/superadmins");
  });
});

describe("per-region activation", () => {
  it("lets any authenticated user read which forms a region enabled", () => {
    // Without this override the inherited $regionAdmin ".read" would restrict it
    // to reviewers, and ordinary members could not discover their own forms.
    expect(rules.admin.$regionAdmin.formTypes[".read"]).toBe("auth.uid != null");
  });

  it("leaves writes to the inherited region-admin rule", () => {
    // Activation is a per-region decision, so it must not be world-writable.
    // The inherited rule uses chained .child() calls rather than a slash path.
    expect(rules.admin.$regionAdmin.formTypes[".write"]).toBeUndefined();
    const inherited = rules.admin.$regionAdmin[".write"];
    expect(inherited).toContain("'admins'");
    expect(inherited).toContain("auth.email");
    expect(inherited).not.toBe("auth.uid != null");
  });
});

describe("submission index", () => {
  it("is writable by authenticated users", () => {
    // It holds only {userID, status, updatedAt} so a region can list
    // submissions across users; RTDB has no cross-node query.
    expect(rules.$region.formSubmissionIndex[".write"]).toBe("auth.uid != null");
  });
});

describe("reserved top-level keys", () => {
  it("keeps every literal root node out of the region namespace", () => {
    const literalRootNodes = Object.keys(rules).filter(
      (key) => !key.startsWith("$")
    );
    literalRootNodes.forEach((key) => {
      expect(RESERVED_REGION_IDS).toContain(key);
      expect(Object.keys(regions)).not.toContain(key);
    });
  });
});
