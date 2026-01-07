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
  testEnvironment: "jsdom",
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
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/src/__mocks__/styleMock.js",
    "\\.(j2)$": "<rootDir>/src/__mocks__/fileMock.js"
  },
};
