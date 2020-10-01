import { eovList, progressCodes, roleCodes } from "../isoCodeLists";

it("Defines constants", () => {
  expect(eovList).toBeDefined();
  expect(progressCodes).toBeDefined();
  expect(roleCodes).toBeDefined();
});
