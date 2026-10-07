jest.mock("firebase-admin", () => ({
  database: () => ({ ref: () => ({ once: jest.fn() }) }),
}));

jest.mock("firebase-functions", () => ({
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
jest.mock("../mailoutText", () => ({
  mailOptionsReviewer: jest.fn(),
  mailOptionsAuthor: jest.fn(),
}));

const { findCustodianOrgName } = require("../notify");

describe("findCustodianOrgName", () => {
  test("finds custodian when contacts is an array (happy path)", () => {
    const record = {
      contacts: [
        { role: ["owner"], orgName: "Other Org" },
        { role: ["custodian"], orgName: "Custodian Org" },
      ],
    };
    expect(findCustodianOrgName(record)).toBe("Custodian Org");
  });

  test("finds custodian when contacts is an object (RTDB sparse-array form — regression)", () => {
    const record = {
      contacts: {
        0: { role: ["owner"], orgName: "Other Org" },
        2: { role: ["custodian"], orgName: "Custodian Org" },
      },
    };
    expect(findCustodianOrgName(record)).toBe("Custodian Org");
  });

  test("returns undefined when contacts is missing", () => {
    expect(findCustodianOrgName({})).toBeUndefined();
  });

  test("returns undefined when no contact has the custodian role", () => {
    const record = { contacts: [{ role: ["owner"], orgName: "Other" }] };
    expect(findCustodianOrgName(record)).toBeUndefined();
  });

  test("finds custodian when role is an object (RTDB sparse-array form — regression)", () => {
    // RTDB returns role (an array of role strings) as an index-keyed object;
    // a plain object has no .includes, which previously threw a TypeError and
    // aborted the function before the reviewer email was sent.
    const record = {
      contacts: {
        0: { role: { 0: "owner" }, orgName: "Other Org" },
        1: { role: { 0: "custodian", 1: "owner" }, orgName: "Custodian Org" },
      },
    };
    expect(findCustodianOrgName(record)).toBe("Custodian Org");
  });

  test("tolerates contacts entries with no role field", () => {
    const record = {
      contacts: {
        a: { orgName: "No Role" },
        b: { role: ["custodian"], orgName: "Custodian Org" },
      },
    };
    expect(findCustodianOrgName(record)).toBe("Custodian Org");
  });
});
