const { githubPublishRecord } = require("../githubPublish");

jest.mock("firebase-admin", () => {
  const mockSnapshot = {
    val: jest.fn(),
  };
  const mockRef = {
    once: jest.fn().mockResolvedValue(mockSnapshot),
  };
  const mockDatabase = {
    ref: jest.fn().mockReturnValue(mockRef),
  };
  return {
    database: () => mockDatabase,
  };
});

jest.mock("octokit", () => ({
  Octokit: jest.fn(),
}));

jest.mock("firebase-functions", () => ({
  https: {
    onCall: (handler) => handler,
    HttpsError: class extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

describe("githubPublishRecord", () => {
  let admin;
  let octokit;
  let mockOctokitInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    admin = require("firebase-admin");
    octokit = require("octokit");

    mockOctokitInstance = {
      rest: {
        git: {
          getRef: jest.fn(),
          getCommit: jest.fn(),
          createTree: jest.fn(),
          createCommit: jest.fn(),
          updateRef: jest.fn(),
        },
      },
    };
    octokit.Octokit.mockImplementation(() => mockOctokitInstance);
  });

  const context = {
    auth: {
      token: {
        email: "test@example.com",
      },
    },
  };

  const data = {
    region: "test-region",
    files: [
      { path: "test.xml", content: "<xml/>" },
    ],
    commitMessage: "test commit",
  };

  it("should fail if user is unauthenticated", async () => {
    await expect(githubPublishRecord(data, {})).rejects.toThrow("The function must be called while authenticated.");
  });

  it("should fail if permissions are denied", async () => {
    const mockSnapshot = await admin.database().ref().once();
    mockSnapshot.val.mockReturnValue({
      admins: "admin@example.com",
      reviewers: "reviewer@example.com",
    });

    await expect(githubPublishRecord(data, context)).rejects.toThrow("User must be an admin or reviewer.");
  });

  it("should succeed with valid permissions and config", async () => {
    const mockSnapshot = await admin.database().ref().once();
    
    // 1. Permissions mock
    mockSnapshot.val
      .mockReturnValueOnce({ // first call in checkPermissions
        admins: "test@example.com",
      })
      .mockReturnValueOnce({ // second call for config
        token: "gh-token",
        owner: "test-owner",
        repo: "test-repo",
        branch: "main",
      });

    // 2. Octokit mocks
    mockOctokitInstance.rest.git.getRef.mockResolvedValue({
      data: { object: { sha: "commit-sha" } },
    });
    mockOctokitInstance.rest.git.getCommit.mockResolvedValue({
      data: { tree: { sha: "tree-sha" } },
    });
    mockOctokitInstance.rest.git.createTree.mockResolvedValue({
      data: { sha: "new-tree-sha" },
    });
    mockOctokitInstance.rest.git.createCommit.mockResolvedValue({
      data: { sha: "new-commit-sha" },
    });
    mockOctokitInstance.rest.git.updateRef.mockResolvedValue({});

    const result = await githubPublishRecord(data, context);

    expect(result.success).toBe(true);
    expect(result.commitSha).toBe("new-commit-sha");
    
    expect(mockOctokitInstance.rest.git.createTree).toHaveBeenCalledWith(expect.objectContaining({
      base_tree: "tree-sha",
      tree: expect.arrayContaining([
        expect.objectContaining({ path: "test.xml", content: "<xml/>" }),
      ]),
    }));
  });
});