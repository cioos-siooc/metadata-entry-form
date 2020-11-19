const validateLatitude = (num) => num >= -90 && num <= 90;

const deepCompare = (obj1, obj2) =>
  JSON.parse(JSON.stringify(obj1) === JSON.stringify(obj2));

const validateLongitude = (num) => num >= -180 && num <= 180;

const polygonIsValid = (polygon) => {
  // eg 48,-128 56,-133 56,-147 48,-128
  const coordinates = polygon.split(" ").map((c) => c.split(","));
  if (coordinates.length < 2) return false;
  if (!deepCompare(coordinates[0], coordinates[coordinates.length - 1]))
    return false;

  return (
    coordinates.filter(
      ([lat, lon]) =>
        validateLongitude(parseFloat(lon)) && validateLatitude(parseFloat(lat))
    ).length === coordinates.length
  );
};

// required fields and  a function to validate each
const validators = {
  title: (val) => val.en && val.fr,
  abstract: (val) => val.en && val.fr,
  identifier: (val) => val,
  keywords: (val) => val.en.length || val.fr.length,
  eov: (val) => val.length,
  map: (val) => {
    const north = parseFloat(val.north);
    const south = parseFloat(val.south);
    const east = parseFloat(val.east);
    const west = parseFloat(val.west);
    const { polygon } = val;

    return (
      (north &&
        south &&
        east &&
        west &&
        north > south &&
        east > west &&
        validateLatitude(north) &&
        validateLatitude(south) &&
        validateLongitude(east) &&
        validateLongitude(west)) ||
      (polygon && polygonIsValid(polygon))
    );
  },
  progress: (val) => val,
  distribution: (val) =>
    Array.isArray(val) && val.filter((dist) => dist.name && dist.url).length,
  verticalExtentMin: (val) => val,
  verticalExtentMax: (val) => val,
  platformName: (val) => val,
  platformID: (val) => val,
  platformAuthority: (val) => val,
  language: (val) => val,
  license: (val) => val,
  // at least one contact has to have a role and a org or individual name
  contacts: (val) =>
    val.filter(
      (contact) =>
        contact.role &&
        contact.role.length &&
        (contact.orgName || contact.indName)
    ).length,
  created: (val) => val,
  verticalExtentDirection: (val) => val,
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
  const validFields = fields.filter((field) => validateField(record, field));
  // const invalidFields = fields.filter((field) => !validateField(record, field));

  const numValid = validFields.length;

  return numValid / numTotal;
};
export const recordIsValid = (record) => {
  return percentValid(record) === 1;
};
