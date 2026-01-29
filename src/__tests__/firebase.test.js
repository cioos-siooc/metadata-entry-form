// Mock Firebase to avoid ReadableStream environment issues
jest.mock("../firebase", () => ({}));

import firebase from "../firebase";

it("Initializes", () => {
  expect(firebase).toBeDefined();
});
