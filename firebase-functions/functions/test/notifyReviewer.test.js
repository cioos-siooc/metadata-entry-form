const mockDb = {
  "/admin/pacific/permissions/reviewers": null,
  "/pacific/users/u1/userinfo": { email: "author@example.com" },
  "/pacific/users/u1/records/r1": { language: "en", title: { en: "T" } },
};

jest.mock("firebase-admin", () => ({
  database: () => ({
    ref: (path) => ({
      once: async () => ({
        val: () => mockDb[path],
        toJSON: () => mockDb[path],
      }),
    }),
  }),
}));

jest.mock("firebase-functions", () => ({
  database: { ref: () => ({ onUpdate: (fn) => fn }) },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("../mailer", () => ({ sendMail: jest.fn(async () => ({})) }));
jest.mock("../issue", () => jest.fn());
jest.mock("../mailoutText", () => ({
  mailOptionsReviewer: jest.fn(() => "reviewer-mail"),
  mailOptionsAuthor: jest.fn(() => "author-mail"),
  mailOptionsAuthorSubmissionConfirmation: jest.fn(() => "confirmation-mail"),
}));

const transporter = require("../mailer");
const functions = require("firebase-functions");
const { notifyReviewer } = require("../notify");

const submit = () =>
  notifyReviewer(
    { before: { val: () => "" }, after: { val: () => "submitted" } },
    { params: { region: "pacific", userID: "u1", recordID: "r1" } },
  );

beforeEach(() => jest.clearAllMocks());

test("region with no reviewers only sends the author confirmation", async () => {
  mockDb["/admin/pacific/permissions/reviewers"] = null;
  await expect(submit()).resolves.toBeUndefined();
  expect(transporter.sendMail.mock.calls).toEqual([["confirmation-mail"]]);
});

test("notifies reviewers, trimming the comma-separated list", async () => {
  mockDb["/admin/pacific/permissions/reviewers"] = "a@x.ca, b@x.ca";
  await submit();
  expect(transporter.sendMail).toHaveBeenCalledWith("reviewer-mail");
  expect(
    require("../mailoutText").mailOptionsReviewer.mock.calls[0][0],
  ).toEqual(["a@x.ca", "b@x.ca"]);
});

test("mail failures are logged as errors, not thrown", async () => {
  mockDb["/admin/pacific/permissions/reviewers"] = "a@x.ca";
  transporter.sendMail.mockRejectedValue(new Error("SMTP down"));
  await expect(submit()).resolves.toBeUndefined();
  expect(functions.logger.error).toHaveBeenCalled();
});
