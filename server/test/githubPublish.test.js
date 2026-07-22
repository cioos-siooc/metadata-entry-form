// Port of firebase-functions/functions/test/githubPublish.test.js.
// GitHub credentials are real region_credentials rows (token encrypted at
// rest); Octokit is mocked. Permission checks run through the route guards.

const { randomUUID } = require("crypto");
const { buildTestApp, signToken, authHeader } = require("./helpers");

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));
const { Octokit } = require("octokit");

const { query, pool } = require("../src/db");
const { encryptSecret } = require("../src/lib/crypto");
const { getGithubCredentials } = require("../src/services/githubPublish");

// Region reserved for the service-port tests (records/admin use 'test'/'canwin').
const REGION = "amundsen";
const TOKEN = "ghp_publish_secret";

async function saveGithubCredentials() {
  await query(
    `INSERT INTO region_credentials (region, kind, config, secret_enc)
     VALUES ($1, 'github', $2, $3)
     ON CONFLICT (region, kind) DO UPDATE SET config = $2, secret_enc = $3`,
    [
      REGION,
      JSON.stringify({ owner: "test-owner", repo: "test-repo", branch: "main", environment: "" }),
      encryptSecret(TOKEN),
    ],
  );
}

describe("githubPublish", () => {
  let app;
  let reviewer;
  let member;
  let mockOctokitInstance;

  const url = `/api/v1/regions/${REGION}/github-publish`;
  const payload = {
    files: [{ path: "test.xml", content: "<xml/>" }],
    commitMessage: "test commit",
  };

  beforeAll(async () => {
    app = await buildTestApp();
    await saveGithubCredentials();

    reviewer = { email: `reviewer-${randomUUID()}@ghpublish.test` };
    reviewer.token = await signToken({ email: reviewer.email });
    await query(
      "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, 'reviewer')",
      [REGION, reviewer.email],
    );

    member = { email: `member-${randomUUID()}@ghpublish.test` };
    member.token = await signToken({ email: member.email });
  });

  afterAll(async () => {
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'github'", [REGION]);
    await query(
      "DELETE FROM region_permissions WHERE region = $1 AND email LIKE '%@ghpublish.test'",
      [REGION],
    );
    await query("DELETE FROM users WHERE email LIKE '%@ghpublish.test'");
    await app.close();
    await pool.end();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockOctokitInstance = {
      rest: {
        git: {
          getRef: jest.fn().mockResolvedValue({ data: { object: { sha: "commit-sha" } } }),
          getCommit: jest.fn().mockResolvedValue({ data: { tree: { sha: "tree-sha" } } }),
          createTree: jest.fn().mockResolvedValue({ data: { sha: "new-tree-sha" } }),
          createCommit: jest.fn().mockResolvedValue({ data: { sha: "new-commit-sha" } }),
          updateRef: jest.fn().mockResolvedValue({}),
        },
      },
    };
    Octokit.mockImplementation(() => mockOctokitInstance);
  });

  it("stores the token encrypted and decrypts it on read", async () => {
    const credentials = await getGithubCredentials(REGION);
    expect(credentials).toEqual({
      owner: "test-owner",
      repo: "test-repo",
      branch: "main",
      environment: "",
      token: TOKEN,
    });
    const row = await query(
      "SELECT secret_enc FROM region_credentials WHERE region = $1 AND kind = 'github'",
      [REGION],
    );
    expect(row.rows[0].secret_enc.toString()).not.toContain(TOKEN);
  });

  it("fails if the user is unauthenticated", async () => {
    const res = await app.inject({ method: "POST", url, payload });
    expect(res.statusCode).toBe(401);
    expect(Octokit).not.toHaveBeenCalled();
  });

  it("fails if the user is not a reviewer or admin", async () => {
    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(member.token),
      payload,
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toContain("Reviewer or admin");
    expect(Octokit).not.toHaveBeenCalled();
  });

  it("fails without files", async () => {
    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(reviewer.token),
      payload: { files: [], commitMessage: "empty" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain("region and files");
  });

  it("publishes via the git data API with valid permissions and config", async () => {
    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(reviewer.token),
      payload,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.commitSha).toBe("new-commit-sha");
    expect(body.files).toEqual(["test.xml"]);
    expect(body.commitUrl).toBe("https://github.com/test-owner/test-repo/commit/new-commit-sha");

    // authenticated with the decrypted stored token
    expect(Octokit).toHaveBeenCalledWith({ auth: TOKEN });

    expect(mockOctokitInstance.rest.git.getRef).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      ref: "heads/main",
    });
    expect(mockOctokitInstance.rest.git.createTree).toHaveBeenCalledWith(
      expect.objectContaining({
        base_tree: "tree-sha",
        tree: expect.arrayContaining([
          expect.objectContaining({ path: "test.xml", content: "<xml/>" }),
        ]),
      }),
    );
    expect(mockOctokitInstance.rest.git.createCommit).toHaveBeenCalledWith(
      expect.objectContaining({ message: "test commit", parents: ["commit-sha"] }),
    );
    expect(mockOctokitInstance.rest.git.updateRef).toHaveBeenCalledWith(
      expect.objectContaining({ ref: "heads/main", sha: "new-commit-sha" }),
    );
  });

  it("defaults the commit message when none is given", async () => {
    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(reviewer.token),
      payload: { files: payload.files },
    });

    expect(res.statusCode).toBe(200);
    expect(mockOctokitInstance.rest.git.createCommit).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Publish metadata record" }),
    );
  });

  it("maps GitHub API failures to a 500 error", async () => {
    mockOctokitInstance.rest.git.getRef.mockRejectedValue(new Error("Bad credentials"));

    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(reviewer.token),
      payload,
    });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toBe("GitHub API Error: Bad credentials");
  });

  it("fails when GitHub configuration is missing", async () => {
    await query("DELETE FROM region_credentials WHERE region = $1 AND kind = 'github'", [REGION]);

    const res = await app.inject({
      method: "POST",
      url,
      headers: authHeader(reviewer.token),
      payload,
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("GitHub configuration missing.");
    expect(Octokit).not.toHaveBeenCalled();

    await saveGithubCredentials();
  });
});
