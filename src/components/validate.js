// required fields and  a function to validate each
export const validators = {
  title: (val) => val.en && val.fr,
  abstract: (val) => val.en && val.fr,
  identifier: (val) => val,
  category: (val) => val,
  keywords: (val) => val.en.length || val.fr.length,
  eov: (val) => val.length,
  dateStart: (val) => val,
  map: (val) => (val.north && val.south && val.east && val.west) || val.polygon,
  progress: (val) => val,
  distribution: (val) =>
    Array.isArray(val) && val.filter((dist) => dist.name).length,
  verticalExtentMin: (val) => val,
  verticalExtentMax: (val) => val,
  datePublished: (val) => val,
  dateRevised: (val) => val,
  platformName: (val) => val,
  platformID: (val) => val,
  platformRole: (val) => val,
  platformAuthority: (val) => val,
  language: (val) => val,
  license: (val) => val,
  contacts: (val) => val.length,
  limitations: (val) => val,
  maintenance: (val) => val,
  created: (val) => val,
};
export const validateField = (record, fieldName) => {
  const valueToValidate = record[fieldName];
  // if no validator funciton exists, then it is not a required field
  const validationFunction = validators[fieldName] || (() => true);

  return (
    valueToValidate && validationFunction && validationFunction(valueToValidate)
  );
};
export const percentValid = (record) => {
  const fields = Object.keys(validators);
  const numTotal = fields.length;
  const numValid = fields.filter((field) => validateField(record, field))
    .length;

  return numValid / numTotal;
};
export const recordIsValid = (record) => {
  return percentValid(record) === 1;
};
