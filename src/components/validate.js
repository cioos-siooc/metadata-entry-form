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

const contactIsFilled = (contact) =>
  Boolean(
    contact.role && contact.role.length && (contact.orgName || contact.indName)
  );

// required fields and  a function to validate each
const validators = {
  title: (val) => val && val.en && val.fr,
  abstract: (val) => val && val.en && val.fr,
  identifier: (val) => val,
  keywords: (val) => val && (val.en.length || val.fr.length),
  eov: (val) => val && val.length,
  map: (val) => {
    if (!val) return false;
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
        north >= south &&
        east >= west &&
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
  platformID: (val, record) => record.noPlatform || val,
  platformDescription: (val, record) => record.noPlatform || val,
  instruments: (val, record) =>
    record.noPlatform ||
    (val && val.filter((instrument) => instrument.id).length),
  language: (val) => val,
  license: (val) => val,
  // at least one contact has to have a role and a org or individual name
  contacts: (val) =>
    val &&
    val
      .filter(contactIsFilled)
      .find((contact) => contact.role.includes("custodian")) &&
    val
      .filter(contactIsFilled)
      .find((contact) => contact.role.includes("owner")),
  created: (val) => val,
  verticalExtentDirection: (val) => val,
};
export const validateField = (record, fieldName) => {
  const valueToValidate = record[fieldName];
  // if no validator funciton exists, then it is not a required field
  const validationFunction = validators[fieldName] || (() => true);

  return validationFunction && validationFunction(valueToValidate, record);
};
export const percentValid = (record) => {
  const fields = Object.keys(validators);
  const numTotal = fields.length;
  const validFields = fields.filter((field) => validateField(record, field));

  const invalidFields = fields.filter((field) => !validateField(record, field));

  // eslint-disable-next-line no-console
  console.log("Missing fields:", record.title, invalidFields);

  const numValid = validFields.length;

  return numValid / numTotal;
};
export const recordIsValid = (record) => {
  return percentValid(record) === 1;
};
