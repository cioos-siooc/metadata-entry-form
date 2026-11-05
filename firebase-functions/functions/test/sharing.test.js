// In-memory stand-ins for RTDB and Firebase Auth. `db` maps a path to the value
// stored there; `authUsers` maps an email to a user record.
const db = {};
const authUsers = {};
const updates = [];

const snapshot = (path) => ({
  val: () => (path in db ? db[path] : null),
  exists: () => path in db && db[path] !== null,
});

jest.mock("firebase-admin", () => ({
  database: () => ({
    ref: (path = "") => ({
      once: jest.fn(async () => snapshot(path)),
      update: jest.fn(async (obj) => {
        updates.push(obj);
        Object.entries(obj).forEach(([key, value]) => {
          const full = path ? `${path}/${key}` : key;
          if (value === null) delete db[full];
          else db[full] = value;
        });
      }),
      push: () => ({ key: "newRecordID" }),
    }),
  }),
  auth: () => ({
    getUser: jest.fn(async (uid) => ({ uid, email: `${uid}@cioos.ca` })),
    getUserByEmail: jest.fn(async (email) => {
      if (authUsers[email]) return authUsers[email];
      const e = new Error("no user");
      e.code = "auth/user-not-found";
      throw e;
    }),
  }),
}));

jest.mock("firebase-functions", () => ({
  auth: { user: () => ({ onCreate: (fn) => fn }) },
  database: { ref: () => ({ onUpdate: (fn) => fn }) },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
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

jest.mock("firebase-functions/params", () => ({
  defineString: () => ({ value: () => "" }),
}));

jest.mock("nodemailer", () => ({
  createTransport: () => ({ sendMail: jest.fn() }),
}));

jest.mock("../issue", () => jest.fn());

const transporter = require("../mailer");
const {
  shareRecord,
  unshareRecord,
  claimInvites,
  transferRecord,
  emailKey,
} = require("../sharing");

const REGION = "pacific";
const OWNER = "owner-uid";
const RECORD = "record-1";
const RECORD_PATH = `${REGION}/users/${OWNER}/records/${RECORD}`;

const ownerContext = {
  auth: { uid: OWNER, token: { email: "owner@cioos.ca", name: "Owner" } },
};

const setRecord = (record) => {
  db[RECORD_PATH] = { title: { en: "A record" }, ...record };
};

beforeEach(() => {
  Object.keys(db).forEach((k) => delete db[k]);
  Object.keys(authUsers).forEach((k) => delete authUsers[k]);
  updates.length = 0;
  jest.clearAllMocks();
  transporter.sendMail.mockResolvedValue({});
  setRecord({});
});

describe("shareRecord", () => {
  test("rejects unauthenticated callers", async () => {
    await expect(
      shareRecord({ region: REGION, recordID: RECORD, email: "a@b.ca" }, {}),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });

  test("rejects an unknown region", async () => {
    await expect(
      shareRecord(
        { region: "nowhere", recordID: RECORD, email: "a@b.ca" },
        ownerContext,
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  test.each(["", "not-an-email", "no@domain", "a b@c.ca"])(
    "rejects invalid email %p",
    async (email) => {
      await expect(
        shareRecord({ region: REGION, recordID: RECORD, email }, ownerContext),
      ).rejects.toMatchObject({ code: "invalid-argument" });
    },
  );

  test("rejects sharing with yourself", async () => {
    await expect(
      shareRecord(
        { region: REGION, recordID: RECORD, email: "Owner@cioos.ca" },
        ownerContext,
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  test("rejects a record the caller does not own", async () => {
    delete db[RECORD_PATH];
    await expect(
      shareRecord(
        { region: REGION, recordID: RECORD, email: "a@b.ca" },
        ownerContext,
      ),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  test("rejects an unsaved record", async () => {
    await expect(
      shareRecord(
        { region: REGION, recordID: "", email: "a@b.ca" },
        ownerContext,
      ),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  test("grants access and emails a recipient who has an account", async () => {
    authUsers["editor@cioos.ca"] = { uid: "editor-uid" };

    const result = await shareRecord(
      { region: REGION, recordID: RECORD, email: " Editor@CIOOS.ca " },
      ownerContext,
    );

    expect(result).toEqual({
      status: "shared",
      email: "editor@cioos.ca",
      emailSent: true,
    });
    expect(updates[0]).toEqual({
      [`${RECORD_PATH}/sharedWith/editor-uid`]: "editor@cioos.ca",
      [`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`]: { shared: true },
    });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "editor@cioos.ca" }),
    );
  });

  test("records an invitation and emails an address with no account", async () => {
    const result = await shareRecord(
      { region: REGION, recordID: RECORD, email: "newcomer@example.org" },
      ownerContext,
    );

    const key = emailKey("newcomer@example.org");
    expect(result).toEqual({
      status: "invited",
      email: "newcomer@example.org",
      emailSent: true,
    });
    expect(db[`${RECORD_PATH}/pendingShares/${key}`]).toBe(
      "newcomer@example.org",
    );
    expect(db[`invites/${key}/${REGION}/${OWNER}/${RECORD}`]).toMatchObject({
      email: "newcomer@example.org",
      invitedBy: "owner@cioos.ca",
    });
    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "newcomer@example.org" }),
    );
  });

  test("does not re-share or re-email an existing editor", async () => {
    authUsers["editor@cioos.ca"] = { uid: "editor-uid" };
    setRecord({ sharedWith: { "editor-uid": "editor@cioos.ca" } });

    const result = await shareRecord(
      { region: REGION, recordID: RECORD, email: "editor@cioos.ca" },
      ownerContext,
    );

    expect(result).toEqual({
      status: "already-shared",
      email: "editor@cioos.ca",
    });
    expect(updates).toHaveLength(0);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  test("does not re-send a pending invitation", async () => {
    const key = emailKey("newcomer@example.org");
    setRecord({ pendingShares: { [key]: "newcomer@example.org" } });

    const result = await shareRecord(
      { region: REGION, recordID: RECORD, email: "newcomer@example.org" },
      ownerContext,
    );

    expect(result).toEqual({
      status: "already-invited",
      email: "newcomer@example.org",
    });
    expect(updates).toHaveLength(0);
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  test("enforces the per-record cap", async () => {
    const sharedWith = {};
    for (let i = 0; i < 20; i += 1)
      sharedWith[`uid-${i}`] = `user${i}@cioos.ca`;
    setRecord({ sharedWith });

    await expect(
      shareRecord(
        { region: REGION, recordID: RECORD, email: "one-too-many@cioos.ca" },
        ownerContext,
      ),
    ).rejects.toMatchObject({ code: "resource-exhausted" });
  });

  test("keeps the share when the notification email fails", async () => {
    authUsers["editor@cioos.ca"] = { uid: "editor-uid" };
    transporter.sendMail.mockRejectedValue(new Error("SMTP down"));

    const result = await shareRecord(
      { region: REGION, recordID: RECORD, email: "editor@cioos.ca" },
      ownerContext,
    );

    expect(result).toMatchObject({ status: "shared", emailSent: false });
    expect(db[`${RECORD_PATH}/sharedWith/editor-uid`]).toBe("editor@cioos.ca");
  });
});

describe("unshareRecord", () => {
  test("removes an existing share from both the record and the index", async () => {
    setRecord({ sharedWith: { "editor-uid": "editor@cioos.ca" } });
    db[`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`] = { shared: true };

    const result = await unshareRecord(
      { region: REGION, recordID: RECORD, uid: "editor-uid" },
      ownerContext,
    );

    expect(result).toEqual({ status: "unshared" });
    expect(db[`${RECORD_PATH}/sharedWith/editor-uid`]).toBeUndefined();
    expect(
      db[`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`],
    ).toBeUndefined();
  });

  test("withdraws a pending invitation", async () => {
    const key = emailKey("newcomer@example.org");
    setRecord({ pendingShares: { [key]: "newcomer@example.org" } });
    db[`invites/${key}/${REGION}/${OWNER}/${RECORD}`] = {
      email: "newcomer@example.org",
    };

    const result = await unshareRecord(
      { region: REGION, recordID: RECORD, inviteKey: key },
      ownerContext,
    );

    expect(result).toEqual({ status: "invite-withdrawn" });
    expect(db[`${RECORD_PATH}/pendingShares/${key}`]).toBeUndefined();
    expect(db[`invites/${key}/${REGION}/${OWNER}/${RECORD}`]).toBeUndefined();
  });

  test("requires either uid or inviteKey", async () => {
    await expect(
      unshareRecord({ region: REGION, recordID: RECORD }, ownerContext),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });
});

describe("claimInvites", () => {
  const key = emailKey("newcomer@example.org");

  test("grants access to invited records and clears the invitation", async () => {
    setRecord({ pendingShares: { [key]: "newcomer@example.org" } });
    db[`invites/${key}`] = {
      [REGION]: { [OWNER]: { [RECORD]: { email: "x" } } },
    };

    await claimInvites({ uid: "newcomer-uid", email: "Newcomer@example.org" });

    expect(db[`${RECORD_PATH}/sharedWith/newcomer-uid`]).toBe(
      "Newcomer@example.org",
    );
    expect(db[`${REGION}/shares/newcomer-uid/${OWNER}/${RECORD}`]).toEqual({
      shared: true,
    });
    expect(db[`${RECORD_PATH}/pendingShares/${key}`]).toBeUndefined();
    expect(db[`invites/${key}`]).toBeUndefined();
  });

  test("skips records that were deleted after the invitation was sent", async () => {
    delete db[RECORD_PATH];
    db[`invites/${key}`] = {
      [REGION]: { [OWNER]: { [RECORD]: { email: "x" } } },
    };

    await claimInvites({ uid: "newcomer-uid", email: "newcomer@example.org" });

    expect(db[`${RECORD_PATH}/sharedWith/newcomer-uid`]).toBeUndefined();
    expect(db[`invites/${key}`]).toBeUndefined();
  });

  test("does nothing for a user with no invitations", async () => {
    await claimInvites({ uid: "someone", email: "nobody@example.org" });
    expect(updates).toHaveLength(0);
  });
});

describe("transferRecord", () => {
  const reviewerContext = {
    auth: { uid: "reviewer-uid", token: { email: "reviewer@cioos.ca" } },
  };

  beforeEach(() => {
    db[`admin/${REGION}/permissions`] = {
      reviewers: "reviewer@cioos.ca, other@cioos.ca",
    };
    authUsers["newowner@cioos.ca"] = { uid: "newowner-uid" };
  });

  const transfer = (email = "newowner@cioos.ca", context = reviewerContext) =>
    transferRecord(
      { region: REGION, recordID: RECORD, sourceUserID: OWNER, email },
      context,
    );

  test("rejects callers who are not reviewers or admins", async () => {
    await expect(
      transfer("newowner@cioos.ca", {
        auth: { uid: "x", token: { email: "random@cioos.ca" } },
      }),
    ).rejects.toMatchObject({ code: "permission-denied" });
  });

  test("reports when the destination has no account", async () => {
    await expect(transfer("ghost@cioos.ca")).resolves.toEqual({
      success: false,
      reason: "user-not-found",
    });
  });

  test("moves the record and repoints the shares index", async () => {
    setRecord({ sharedWith: { "editor-uid": "editor@cioos.ca" } });
    db[`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`] = { shared: true };

    const result = await transfer();

    expect(result).toEqual({
      success: true,
      recordID: "newRecordID",
      userID: "newowner-uid",
      region: REGION,
      sentForReview: false,
    });
    expect(db[RECORD_PATH]).toBeUndefined();
    expect(
      db[`${REGION}/users/newowner-uid/records/newRecordID`],
    ).toMatchObject({ recordID: "newRecordID", userID: "newowner-uid" });
    expect(
      db[`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`],
    ).toBeUndefined();
    expect(db[`${REGION}/shares/editor-uid/newowner-uid/newRecordID`]).toEqual({
      shared: true,
    });
  });

  test("drops the new owner from the record's own shared list", async () => {
    setRecord({ sharedWith: { "newowner-uid": "newowner@cioos.ca" } });

    await transfer();

    expect(
      db[`${REGION}/users/newowner-uid/records/newRecordID`].sharedWith,
    ).toEqual({});
    expect(
      db[`${REGION}/shares/newowner-uid/newowner-uid/newRecordID`],
    ).toBeUndefined();
  });

  describe("to another region", () => {
    const moveTo = (
      destinationRegion,
      context = reviewerContext,
      email = "newowner@cioos.ca",
    ) =>
      transferRecord(
        {
          region: REGION,
          recordID: RECORD,
          sourceUserID: OWNER,
          email,
          destinationRegion,
        },
        context,
      );

    beforeEach(() => {
      db["admin/atlantic/permissions"] = { admins: "reviewer@cioos.ca" };
    });

    test("rejects an unknown destination region", async () => {
      await expect(moveTo("nowhere")).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });

    test("sends it to the review of a region the caller doesn't review", async () => {
      db["admin/stlaurent/permissions"] = {
        admins: "boss@ogsl.ca",
        reviewers: "r1@ogsl.ca, r2@ogsl.ca",
      };
      setRecord({ status: "published", language: "fr" });

      await expect(moveTo("stlaurent")).resolves.toMatchObject({
        success: true,
        sentForReview: true,
        region: "stlaurent",
      });
      expect(
        db["stlaurent/users/newowner-uid/records/newRecordID"],
      ).toMatchObject({ status: "submitted" });
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ["r1@ogsl.ca", "r2@ogsl.ca"],
          subject: "New CIOOS Metadata record to be reviewed",
        }),
      );
    });

    test("still requires being a reviewer of the record's region", async () => {
      db[`admin/${REGION}/permissions`] = {};
      await expect(moveTo("atlantic")).rejects.toMatchObject({
        code: "permission-denied",
      });
      expect(db[RECORD_PATH]).toBeDefined();
    });

    test("moves the record, its status, shares and invites", async () => {
      setRecord({
        status: "published",
        sharedWith: { "editor-uid": "editor@cioos.ca" },
        pendingShares: { "new,cioos,ca": "new@cioos.ca" },
      });

      await expect(moveTo("atlantic")).resolves.toEqual({
        success: true,
        sentForReview: false,
        recordID: "newRecordID",
        userID: "newowner-uid",
        region: "atlantic",
      });
      expect(db[RECORD_PATH]).toBeUndefined();
      expect(
        db["atlantic/users/newowner-uid/records/newRecordID"],
      ).toMatchObject({ status: "published", userID: "newowner-uid" });
      expect(
        db[`${REGION}/shares/editor-uid/${OWNER}/${RECORD}`],
      ).toBeUndefined();
      expect(
        db["atlantic/shares/editor-uid/newowner-uid/newRecordID"],
      ).toEqual({ shared: true });
      expect(
        db[`invites/new,cioos,ca/${REGION}/${OWNER}/${RECORD}`],
      ).toBeUndefined();
      expect(
        db["invites/new,cioos,ca/atlantic/newowner-uid/newRecordID"],
      ).toMatchObject({ email: "new@cioos.ca" });
    });

    test("keeps the owner when no email is given", async () => {
      setRecord({ status: "published", userID: OWNER });

      await expect(moveTo("atlantic", reviewerContext, "")).resolves.toEqual({
        success: true,
        sentForReview: false,
        recordID: "newRecordID",
        userID: OWNER,
        region: "atlantic",
      });
      expect(db[RECORD_PATH]).toBeUndefined();
      expect(db[`atlantic/users/${OWNER}/records/newRecordID`]).toMatchObject({
        status: "published",
        userID: OWNER,
      });
    });

    test("requires an email to transfer within the region", async () => {
      setRecord({});
      await expect(moveTo(REGION, reviewerContext, "")).rejects.toMatchObject({
        code: "invalid-argument",
      });
    });

    test.each(["draft", "registered", "findable"])(
      "refuses a record with a %s DOI from the form",
      async (doiCreationStatus) => {
        setRecord({ doiCreationStatus });
        await expect(moveTo("atlantic")).resolves.toEqual({
          success: false,
          reason: "has-doi",
        });
        expect(db[RECORD_PATH]).toBeDefined();
      },
    );

    test("keeps a managed DOI when staying in the region", async () => {
      setRecord({ doiCreationStatus: "findable" });
      await expect(moveTo(REGION)).resolves.toMatchObject({ success: true });
    });
  });
});
