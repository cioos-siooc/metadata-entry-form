import {
  eovList,
  progressCodes,
  roleCodes,
  associationTypeCode,
  initiativeTypeCode,
  metadataScopeCodes,
} from "../isoCodeLists";

it("Defines constants", () => {
  expect(eovList).toBeDefined();
  expect(progressCodes).toBeDefined();
  expect(roleCodes).toBeDefined();
  expect(associationTypeCode).toBeDefined();
  expect(initiativeTypeCode).toBeDefined();
});

it("Uses lowerCamelCase ISO MD_ScopeCode values", () => {
  // ISO 19115 MD_ScopeCode values must start lowercase (lowerCamelCase for
  // multi-word codes) so CKAN harvests them, e.g. "dataset", "collectionSession".
  Object.values(metadataScopeCodes).forEach(({ isoValue }) => {
    expect(isoValue).toMatch(/^[a-z][a-zA-Z]*$/);
  });
});
