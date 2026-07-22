// Tests for the record-change hook pipeline (notify + issue + xmlGenerator)
// and the recordExport routes. External effects are mocked: nodemailer
// (sendMail captured), octokit (GitHub issue), axios (converter calls).
// Reviewer lists come from real region_permissions rows (region 'stlaurent'
// to avoid clashing with the records/admin suites).

process.env.SMTP_FROM = "CIOOS Test Notifications <notify@test.example>";
process.env.CONVERTER_URL = "http://converter.test";

const mockSendMail = jest.fn();
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: (...args) => mockSendMail(...args) })),
}));

const mockGithubRequest = jest.fn();
jest.mock("octokit", () => ({
  Octokit: jest.fn(() => ({ request: (...args) => mockGithubRequest(...args) })),
}));

jest.mock("axios", () => {
  const instance = { post: jest.fn(), get: jest.fn(), put: jest.fn(), delete: jest.fn() };
  return { ...instance, create: jest.fn(() => instance) };
});

const { randomUUID } = require("crypto");
const axios = require("axios");
const { buildTestApp, signToken, authHeader } = require("./helpers");
const { query, pool } = require("../src/db");
const { onRecordChange } = require("../src/services/recordHooks");

const REGION = "stlaurent";
const CONVERTER = "http://converter.test";

const log = { info: jest.fn(), error: jest.fn() };

let reviewer1;
let reviewer2;

function makeRecord(overrides = {}) {
  const authorEmail = `author-${randomUUID()}@hooks.test`;
  return {
    recordID: randomUUID(),
    userID: randomUUID(),
    status: "submitted",
    title: { en: "A fine dataset", fr: "Un bon jeu de données" },
    language: "en",
    identifier: randomUUID(),
    filename: "a_fine_dataset_abc12",
    contacts: [{ role: ["custodian"], orgName: "Ocean Org" }],
    userinfo: { email: authorEmail, displayName: "Author Person" },
    ...overrides,
  };
}

beforeAll(async () => {
  reviewer1 = `reviewer1-${randomUUID()}@hooks.test`;
  reviewer2 = `reviewer2-${randomUUID()}@hooks.test`;
  const insert =
    "INSERT INTO region_permissions (region, email, role) VALUES ($1, $2, 'reviewer') ON CONFLICT DO NOTHING";
  await query(insert, [REGION, reviewer1]);
  await query(insert, [REGION, reviewer2]);
});

afterAll(async () => {
  await query("DELETE FROM region_permissions WHERE email LIKE '%@hooks.test'");
  await query(
    "DELETE FROM records WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@hooks.test')",
  );
  await query("DELETE FROM users WHERE email LIKE '%@hooks.test'");
  await pool.end();
});

beforeEach(() => {
  jest.clearAllMocks();
  mockSendMail.mockResolvedValue({ accepted: [] });
  mockGithubRequest.mockResolvedValue({});
  axios.post.mockResolvedValue({ data: {} });
});

describe("onRecordChange transitions", () => {
  test("draft -> submitted: author confirmation + reviewer mail + XML update", async () => {
    const record = makeRecord();
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "draft" },
      after: { status: "submitted" },
      kind: "update",
    });

    expect(mockSendMail).toHaveBeenCalledTimes(2);

    const confirmation = mockSendMail.mock.calls[0][0];
    expect(confirmation.to).toBe(record.userinfo.email);
    expect(confirmation.from).toBe("CIOOS Test Notifications <notify@test.example>");
    expect(confirmation.subject).toMatch(/has been submitted/);

    const reviewerMail = mockSendMail.mock.calls[1][0];
    expect([...reviewerMail.to].sort()).toEqual([reviewer1, reviewer2].sort());
    expect(reviewerMail.subject).toBe("New CIOOS Metadata record to be reviewed");
    expect(reviewerMail.html).toContain("Ocean Org"); // custodian org
    expect(reviewerMail.html).toContain(`${record.userID}/${record.recordID}`);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/record`, {
      record,
      filename: record.filename,
      status: "submitted",
      region: REGION,
    });

    // no GitHub issue outside hakai
    expect(mockGithubRequest).not.toHaveBeenCalled();
  });

  test("submitting author who is a reviewer gets confirmation only", async () => {
    const record = makeRecord({ userinfo: { email: reviewer1, displayName: "Rev One" } });
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "draft" },
      after: { status: "submitted" },
      kind: "update",
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail.mock.calls[0][0].to).toBe(reviewer1);
  });

  test("published -> submitted: XML update but no notifications", async () => {
    const record = makeRecord();
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "published" },
      after: { status: "submitted" },
      kind: "update",
    });

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/record`, expect.any(Object));
  });

  test("submitted -> published: author approval mail + XML update", async () => {
    const record = makeRecord({ status: "published" });
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "submitted" },
      after: { status: "published" },
      kind: "update",
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe(record.userinfo.email);
    expect(mail.subject).toBe("Your CIOOS metadata has been approved!");

    expect(axios.post).toHaveBeenCalledWith(
      `${CONVERTER}/record`,
      expect.objectContaining({ status: "published" }),
    );
  });

  test("publishing a reviewer's own record sends no mail", async () => {
    const record = makeRecord({
      status: "published",
      userinfo: { email: reviewer2, displayName: "Rev Two" },
    });
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "submitted" },
      after: { status: "published" },
      kind: "update",
    });
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test("submitted -> draft demotion still calls the converter with the new status", async () => {
    const record = makeRecord({ status: "" });
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "submitted" },
      after: { status: "draft" },
      kind: "update",
    });

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      `${CONVERTER}/record`,
      expect.objectContaining({ status: "" }),
    );
  });

  test("create with submitted status regenerates XML (after the 1s settle delay)", async () => {
    const record = makeRecord();
    const started = Date.now();
    await onRecordChange(log, {
      region: REGION,
      record,
      before: null,
      after: { status: "submitted" },
      kind: "create",
    });
    expect(Date.now() - started).toBeGreaterThanOrEqual(1000);
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/record`, expect.any(Object));
    expect(mockSendMail).not.toHaveBeenCalled(); // creates never notify
  });

  test("delete calls recordDelete with the stored filename", async () => {
    const record = makeRecord();
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "published" },
      after: null,
      kind: "delete",
    });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/recordDelete`, {
      filename: record.filename,
      region: REGION,
    });
  });

  test("delete derives the filename when none is stored", async () => {
    const record = makeRecord({
      filename: "",
      title: { en: "My Dataset", fr: "" },
      language: "en",
      identifier: "abcde-uuid-rest",
    });
    await onRecordChange(log, {
      region: REGION,
      record,
      before: { status: "submitted" },
      after: null,
      kind: "delete",
    });
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/recordDelete`, {
      filename: "my_dataset_abcde",
      region: REGION,
    });
  });

  test("hakai submission opens a GitHub issue", async () => {
    const record = makeRecord({ title: { en: "Kelp survey", fr: "" } });
    await onRecordChange(log, {
      region: "hakai",
      record,
      before: { status: "draft" },
      after: { status: "submitted" },
      kind: "update",
    });

    expect(mockGithubRequest).toHaveBeenCalledTimes(1);
    const [route, input] = mockGithubRequest.mock.calls[0];
    expect(route).toBe("POST /repos/{owner}/{repo}/issues");
    expect(input).toMatchObject({
      owner: "HakaiInstitute",
      repo: "metadata-review",
      title: "Dataset - Kelp survey",
    });
    expect(input.body).toContain(`${record.userID}/${record.recordID}`);
  });

  test("hakai issue is skipped for JUST TESTING titles", async () => {
    const record = makeRecord({ title: { en: "JUST TESTING the form", fr: "" } });
    await onRecordChange(log, {
      region: "hakai",
      record,
      before: { status: "draft" },
      after: { status: "submitted" },
      kind: "update",
    });
    expect(mockGithubRequest).not.toHaveBeenCalled();
  });

  test("failures are logged, never thrown", async () => {
    axios.post.mockRejectedValue(new Error("converter down"));
    mockSendMail.mockRejectedValue(new Error("smtp down"));

    await expect(
      onRecordChange(log, {
        region: REGION,
        record: makeRecord(),
        before: { status: "draft" },
        after: { status: "submitted" },
        kind: "update",
      }),
    ).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  test("per-region record_generator_url overrides the converter base URL", async () => {
    await query("UPDATE regions SET record_generator_url = $2 WHERE id = $1", [
      REGION,
      "https://generator.example.org/",
    ]);
    try {
      const record = makeRecord({ status: "" });
      await onRecordChange(log, {
        region: REGION,
        record,
        before: { status: "submitted" },
        after: { status: "draft" },
        kind: "update",
      });
      expect(axios.post).toHaveBeenCalledWith(
        "https://generator.example.org/record",
        expect.any(Object),
      );
    } finally {
      await query("UPDATE regions SET record_generator_url = NULL WHERE id = $1", [REGION]);
    }
  });
});

describe("record export routes", () => {
  let app;
  let user;

  beforeAll(async () => {
    app = await buildTestApp();
    user = { email: `exporter-${randomUUID()}@hooks.test` };
    user.token = await signToken({ email: user.email });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createRecord(body = {}) {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/records`,
      headers: authHeader(user.token),
      payload: {
        title: { en: "Export dataset", fr: "" },
        language: "en",
        identifier: randomUUID(),
        ...body,
      },
    });
    expect(res.statusCode).toBe(201);
    return res.json();
  }

  test("regenerate-xml calls the converter for submitted records, no-ops for drafts", async () => {
    const record = await createRecord();
    const url = `/api/v1/regions/${REGION}/records/${record.recordID}`;

    // draft: nothing to do
    const draftRes = await app.inject({
      method: "POST",
      url: `${url}/regenerate-xml`,
      headers: authHeader(user.token),
    });
    expect(draftRes.statusCode).toBe(200);
    expect(draftRes.json()).toEqual({ regenerated: false });
    expect(axios.post).not.toHaveBeenCalled();

    const submit = await app.inject({
      method: "PUT",
      url: `${url}/status`,
      headers: authHeader(user.token),
      payload: { status: "submitted" },
    });
    expect(submit.statusCode).toBe(200);
    // let the fire-and-forget status hook drain before asserting on the route
    await new Promise((resolve) => setTimeout(resolve, 100));
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ data: {} });

    const res = await app.inject({
      method: "POST",
      url: `${url}/regenerate-xml`,
      headers: authHeader(user.token),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ regenerated: true });
    expect(axios.post).toHaveBeenCalledWith(
      `${CONVERTER}/record`,
      expect.objectContaining({
        status: "submitted",
        region: REGION,
        record: expect.objectContaining({ recordID: record.recordID }),
      }),
    );
  });

  test("regenerate-xml 404s for unknown records", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/records/${randomUUID()}/regenerate-xml`,
      headers: authHeader(user.token),
    });
    expect(res.statusCode).toBe(404);
  });

  test("record-export proxies /convert and returns the payload", async () => {
    axios.post.mockResolvedValueOnce({ data: { data: "<xml>converted</xml>" } });

    const record = { title: { en: "Export me", fr: "" }, language: "en" };
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/record-export`,
      headers: authHeader(user.token),
      payload: { record, fileType: "XML" },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ data: "<xml>converted</xml>" });
    expect(axios.post).toHaveBeenCalledWith(`${CONVERTER}/convert`, {
      record_data: record,
      output_format: "xml",
    });
  });

  test("record-export validates its body", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/record-export`,
      headers: authHeader(user.token),
      payload: { fileType: "xml" },
    });
    expect(res.statusCode).toBe(422);
  });

  test("record-export surfaces converter failures", async () => {
    const err = new Error("boom");
    err.response = { status: 500, data: { detail: "Conversion failed: bad record" } };
    axios.post.mockRejectedValueOnce(err);

    const res = await app.inject({
      method: "POST",
      url: `/api/v1/regions/${REGION}/record-export`,
      headers: authHeader(user.token),
      payload: { record: { title: {} }, fileType: "xml" },
    });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe("Conversion failed: bad record");
  });
});
