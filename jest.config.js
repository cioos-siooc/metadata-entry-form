module.exports = {
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/index.js",
    "!src/setupTests.js",
    "!src/serviceWorker.js",
    "!**/node_modules/**",
  ],
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(js|jsx)$",
  moduleFileExtensions: ["js", "json", "jsx"],
  setupFilesAfterEnv: ["<rootDir>src/setupTests.js"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 95,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^axios$": "axios/dist/node/axios.cjs",
    "^cheerio/lib/utils$": "cheerio/dist/commonjs/utils",
    "^cheerio/lib/(.*)$": "cheerio/dist/commonjs/$1",
  },
};
