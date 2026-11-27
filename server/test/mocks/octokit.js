// Jest stand-in for the ESM-only `octokit` package, which jest's CJS runtime
// cannot parse (plain Node loads it fine via require(esm)). Mapped in via
// moduleNameMapper so suites can load src/app.js. Tests that exercise Octokit
// behavior override this with an explicit jest.mock("octokit", factory).
module.exports = { Octokit: jest.fn() };
