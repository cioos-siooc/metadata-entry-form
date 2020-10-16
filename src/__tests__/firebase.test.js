import firebase from "../firebase";

jest.mock("firebase/app");

it("Initializes", () => {
  expect(firebase).toBeDefined();
});
