jest.mock("firebase-functions", () => ({
  runWith: () => ({ https: { onCall: (fn) => fn } }),
  logger: { error: jest.fn() },
  https: {
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
}));

jest.mock("firebase-functions/params", () => ({
  defineString: (name) => ({
    value: () => ({ REVIEWER_API_URL: "https://reviewer.test/", REVIEWER_API_TOKEN: "tok" })[name],
  }),
}));

jest.mock("axios", () => ({ post: jest.fn() }));

const axios = require("axios");
const { reviewRecord } = require("../reviewer");

const auth = { auth: { token: {} } };
const body = { record: { title: {} }, region: "pacific", userID: "u", recordID: "r" };

describe("reviewRecord", () => {
  beforeEach(() => axios.post.mockReset());

  it("forwards the record with the bearer token and returns findings", async () => {
    axios.post.mockResolvedValue({ data: { findings: [{ id: "1" }] } });
    await expect(reviewRecord(body, auth)).resolves.toEqual({ findings: [{ id: "1" }] });
    expect(axios.post).toHaveBeenCalledWith(
      "https://reviewer.test/review",
      body,
      expect.objectContaining({ headers: { Authorization: "Bearer tok" } })
    );
  });

  it("rejects unauthenticated callers without calling the reviewer", async () => {
    await expect(reviewRecord(body, {})).rejects.toMatchObject({ code: "unauthenticated" });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("maps reviewer outages to unavailable", async () => {
    axios.post.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(reviewRecord(body, auth)).rejects.toMatchObject({ code: "unavailable" });
  });
});
