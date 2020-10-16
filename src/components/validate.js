export const validators = {
  title: (val) => val.en && val.fr,
  abstract: (val) => val.en && val.fr,
  identifier: (val) => val,
  category: (val) => val,
  keywords: (val) => val.en.length || val.fr.length,
  role: (val) => val,
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
  instruments: (val) => val.length,
  platformName: (val) => val,
  platformID: (val) => val,
  platformRole: (val) => val,
  platformDescription: (val) => val,
  platformAuthority: (val) => val,
  language: (val) => val,
  license: (val) => val,
  contacts: (val) => val.length,
  status: (val) => val,
  limitations: (val) => val,
  maintenance: (val) => val,
  created: (val) => val,

  // these arent required
  comment: () => true,
  history: () => true,
};
export const validateField = (record, fieldName) => {
  const valueToValidate = record[fieldName];
  const validationFunction = validators[fieldName];

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
