import { eovList, progressCodes, roleCodes, associationTypeCode, initiativeTypeCode } from "../isoCodeLists";

it("Defines constants", () => {
  expect(eovList).toBeDefined();
  expect(progressCodes).toBeDefined();
  expect(roleCodes).toBeDefined();
  expect(associationTypeCode).toBeDefined();
  expect(initiativeTypeCode).toBeDefined();
});
