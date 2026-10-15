jest.mock("firebase-admin", () => ({}));
jest.mock("firebase-functions", () => ({
  database: { ref: () => ({ onWrite: (fn) => fn }) },
}));

const { publishRegionsIndexUpdates } = require("../publishRegions");

const entry = (target) => `${target}/publishedFrom/pacific/u1/r1`;

describe("publishRegionsIndexUpdates", () => {
  test("indexes added regions", () => {
    expect(
      publishRegionsIndexUpdates("pacific", "u1", "r1", null, ["stlaurent"]),
    ).toEqual({ [entry("stlaurent")]: true });
  });

  test("removes dropped regions and keeps current ones", () => {
    expect(
      publishRegionsIndexUpdates(
        "pacific",
        "u1",
        "r1",
        ["stlaurent", "atlantic"],
        { 0: "atlantic" },
      ),
    ).toEqual({ [entry("stlaurent")]: null, [entry("atlantic")]: true });
  });

  test("removes every entry when the record is deleted", () => {
    expect(
      publishRegionsIndexUpdates("pacific", "u1", "r1", ["atlantic"], null),
    ).toEqual({ [entry("atlantic")]: null });
  });

  test("ignores unknown regions and the home region", () => {
    expect(
      publishRegionsIndexUpdates("pacific", "u1", "r1", null, [
        "pacific",
        "../admin",
        "nowhere",
      ]),
    ).toEqual({});
  });

  test("ignores records outside a known home region", () => {
    expect(
      publishRegionsIndexUpdates("admin", "u1", "r1", null, ["pacific"]),
    ).toEqual({});
  });
});
