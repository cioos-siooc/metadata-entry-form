let mockBase = null;

jest.mock("firebase-admin", () => ({
  database: () => ({
    ref: () => ({
      child: () => ({
        child: () => ({
          once: async () => ({ val: () => mockBase }),
        }),
      }),
    }),
  }),
}));

jest.mock("firebase-functions", () => ({
  database: {
    ref: () => ({
      onCreate: (fn) => fn,
      onUpdate: (fn) => fn,
      onDelete: (fn) => fn,
    }),
  },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  https: { onCall: (handler) => handler, HttpsError: class extends Error {} },
}));

jest.mock("axios", () => ({ get: jest.fn(async () => ({})), post: jest.fn() }));

const axios = require("axios");
const { getGeneratorUrl, regenerateXMLforRecord } = require("../updates");

describe("getGeneratorUrl", () => {
  test.each([
    ["https://api.forms.cioos.ca", "https://api.forms.cioos.ca/record"],
    ["https://api.forms.cioos.ca/", "https://api.forms.cioos.ca/record"],
    ["https://host/api", "https://host/api/record"],
    [null, "https://api.forms.cioos.ca/record"],
  ])("base %s -> %s", async (base, expected) => {
    mockBase = base;
    expect((await getGeneratorUrl("pacific", "record")).toString()).toBe(
      expected,
    );
  });
});

describe("regenerateXMLforRecord", () => {
  test("awaits the generator request and builds the query string", async () => {
    mockBase = "https://api.forms.cioos.ca";
    await regenerateXMLforRecord(
      { path: "pacific/u/r", status: "submitted", region: "pacific" },
      { auth: { token: {} } },
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.forms.cioos.ca/record?path=pacific%2Fu%2Fr&status=&filename=",
    );
  });

  test("rethrows generator failures", async () => {
    axios.get.mockRejectedValueOnce(new Error("ENOTFOUND"));
    await expect(
      regenerateXMLforRecord(
        { path: "p", status: "published", region: "pacific" },
        { auth: { token: {} } },
      ),
    ).rejects.toThrow("ENOTFOUND");
  });
});
