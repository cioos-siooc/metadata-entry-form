import validator from "validator";

export const validateEmail = (email) => !email || validator.isEmail(email);
export const validateURL = (url) => !url || validator.isURL(url);

// See https://stackoverflow.com/a/48524047/7416701
export const doiRegexp = /^10.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

const validateLatitude = (num) => num >= -90 && num <= 90;

const deepCompare = (obj1, obj2) =>
  JSON.parse(JSON.stringify(obj1) === JSON.stringify(obj2));

const validateLongitude = (num) => num >= -360 && num <= 360;

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
  title: {
    validation: (val) => val && val.en && val.fr,
    tab: "dataID",
    error: {
      en: "Missing title in French or English",
      fr: "Titre manquant en français ou en anglais",
    },
  },
  abstract: {
    validation: (val) => val && val.en && val.fr,
    tab: "dataID",
    error: {
      en: "Missing abstract in French or English",
      fr: "Abrégé manquant en français ou en anglais",
    },
  },
  keywords: {
    validation: (val) => val && (val.en.length || val.fr.length),
    tab: "dataID",
    error: {
      en: "At least one keyword is required",
      fr: "Au moins un mot clé est requis",
    },
  },
  eov: {
    validation: (val) => val && val.length,
    tab: "dataID",
    error: {
      en: "At least one EOV is required",
      fr: "Au moins un variable essentielle océanique est requise",
    },
  },
  datasetIdentifier: {
    validation: (val) => !val || doiRegexp.test(val),
    optional: true,
    tab: "dataID",
    error: {
      en: "Invalid DOI",
      fr: "DOI non valide",
    },
  },
  progress: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Please select a dataset status",
      fr: "L'information spatiale est manquante",
    },
  },
  language: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Language field is missing",
      fr: "Le champ de langue est vide",
    },
  },
  license: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Please select a license for the dataset",
      fr: "Veuillez sélectionner une licence pour le jeu de données",
    },
  },
  map: {
    error: {
      en: "Spatial information is missing",
      fr: "L'information géographique est manquante",
    },
    tab: "spatial",
    validation: (val) => {
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
  },

  verticalExtentMin: {
    tab: "spatial",

    validation: (val) => val,
    error: {
      en: "Missing Vertical Extent Min",
      fr: "Étendue verticale manquante Min",
    },
  },
  verticalExtentMax: {
    tab: "spatial",
    validation: (val) => val,
    error: {
      en: "Missing Vertical Extent Max",
      fr: "Étendue verticale manquante Max",
    },
  },
  verticalExtentDirection: {
    tab: "spatial",
    validation: (val) => val,
    error: {
      en: "Missing Vertical Extent Direction",
      fr: "Direction de l'étendue verticale manquante",
    },
  },
  // at least one contact has to have a role and a org or individual name
  contacts: {
    tab: "contacts",
    validation: (val) =>
      val &&
      // every contact must have a role and name
      val.every(contactIsFilled) &&
      val.every(
        (contact) =>
          validateEmail(contact.indEmail) &&
          validateEmail(contact.orgEmail) &&
          validateURL(contact.orgURL)
      ) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("custodian")) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("owner")),
    error: {
      en:
        "Every contact must have at least one role checked, and  'Data contact' or 'Metadata contact' must be added to at least one contact. Email addresses must be in the form of user@example.com and URLs must be valid.",
      fr:
        "Assurez-vous que chaque contact a un rôle qui lui est attribué. Assurez-vous également d'avoir une personne ressource pour les métadonnées et un personne ressource pour les données. Les adresses e-mail doivent être sous la forme de user@example.com et les URL doivent être valides.",
    },
  },
  distribution: {
    tab: "resources",
    validation: (val) =>
      Array.isArray(val) &&
      val.filter((dist) => dist.name && dist.url && validator.isURL(dist.url))
        .length,

    error: {
      en:
        "Must have at least one resource. If a URL is included it must be valid.",
      fr:
        "Doit avoir au moins une ressource. Si une URL est incluse, elle doit être valide.",
    },
  },
  platformID: {
    tab: "platform",
    validation: (val, record) => record.noPlatform || val,
    error: {
      en: "Missing platform ID",
      fr: "ID de la plateforme manquant",
    },
  },
  platformDescription: {
    tab: "platform",
    validation: (val, record) => record.noPlatform || val,
    error: {
      en: "Missing platform description",
      fr: "Description de la plateforme manquante",
    },
  },
  instruments: {
    tab: "platformInstruments",
    validation: (val, record) =>
      record.noPlatform ||
      (val && val.filter((instrument) => instrument.id).length),
    error: {
      en: "At least one instrument is required if there is a platform",
      fr: "Au moins un instrument est requis s'il y a une plateforme",
    },
  },
};
export const validateField = (record, fieldName) => {
  const valueToValidate = record[fieldName];
  // if no validator funciton exists, then it is not a required field
  const validationFunction =
    (validators[fieldName] && validators[fieldName].validation) || (() => true);

  return validationFunction && validationFunction(valueToValidate, record);
};

export const getErrorsByTab = (record) => {
  const fields = Object.keys(validators);
  const invalidFields = fields.filter((field) => !validateField(record, field));
  const fieldErrorInfo = invalidFields.map((field) => {
    const { error, tab } = validators[field];
    return { error, tab };
  });

  return fieldErrorInfo.reduce((acc, { error, tab }) => {
    if (!acc[tab]) acc[tab] = [];
    acc[tab].push(error);
    return acc;
  }, {});
};

export const percentValid = (record) => {
  const fields = Object.keys(validators);
  const numTotalRequired = fields.filter((field) => !validators[field].optional)
    .length;

  const validFieldsRequired = fields.filter(
    (field) => !validators[field].optional && validateField(record, field)
  );
  const numValidRequired = validFieldsRequired.length;

  return numValidRequired / numTotalRequired;
};
export const recordIsValid = (record) => {
  const optionalFieldsAreValid = Object.entries(validators)
    .filter(([, validatorObject]) => validatorObject.optional)
    .every(([field]) => validateField(record, field));

  return percentValid(record) === 1 && optionalFieldsAreValid;
};
