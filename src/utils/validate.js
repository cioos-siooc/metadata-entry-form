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
  title: {
    validation: (val) => val && val.en && val.fr,
    tab: "identification",
    error: {
      en: "Missing title in one or both languages",
      fr: "Titre manquant dans une ou les deux langues",
    },
  },
  abstract: {
    validation: (val) => val && val.en && val.fr,
    tab: "identification",
    error: {
      en: "Missing abstract in one or both languages",
      fr: "Abstrait manquant dans une ou les deux langues",
    },
  },
  keywords: {
    validation: (val) => val && (val.en.length || val.fr.length),
    tab: "identification",
    error: {
      en: "At least one keyword is required",
      fr: "Au moins un mot clé est requis",
    },
  },
  eov: {
    validation: (val) => val && val.length,
    tab: "identification",
    error: {
      en: "At least one EOV is required",
      fr: "Au moins un EOV est requis",
    },
  },
  map: {
    error: {
      en: "Spatial information is missing",
      fr: "L'information spatiale est manquante",
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
  progress: {
    tab: "identification",
    validation: (val) => val,
    error: {
      en: "Please select a dataset status",
      fr: "L'information spatiale est manquante",
    },
  },
  distribution: {
    tab: "distribution",
    validation: (val) =>
      Array.isArray(val) && val.filter((dist) => dist.name && dist.url).length,
    error: {
      en: "Must have at least one resource",
      fr: "Doit avoir au moins une ressource",
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
  platformID: {
    tab: "platform",
    validation: (val, record) => record.noPlatform || val,
    error: {
      en: "Missing platform ID",
      fr: "ID de plate-forme manquant",
    },
  },
  platformDescription: {
    tab: "platform",
    validation: (val, record) => record.noPlatform || val,
    error: {
      en: "Missing platform description",
      fr: "Description de la plate-forme manquante",
    },
  },
  instruments: {
    tab: "instruments",
    validation: (val, record) =>
      record.noPlatform ||
      (val && val.filter((instrument) => instrument.id).length),
    error: {
      en: "At least one instrument is required if there is a platform",
      fr: "Au moins un instrument est requis s'il y a une plate-forme",
    },
  },
  language: {
    tab: "identification",
    validation: (val) => val,
    error: {
      en: "Language field is missing",
      fr: "Le champ de langue est manquant",
    },
  },
  license: {
    tab: "identification",
    validation: (val) => val,
    error: {
      en: "Please select a license for the dataset",
      fr: "Veuillez sélectionner une licence pour le jeu de données",
    },
  },
  // at least one contact has to have a role and a org or individual name
  contacts: {
    tab: "contacts",
    validation: (val) =>
      val &&
      // every contact must have a role and name
      val.every(contactIsFilled) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("custodian")) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("owner")),
    error: {
      en:
        "Every contact must have at least one role checked, and  'Data contact' or 'Metadata contact' must be added to at least one contact",
      fr:
        "Chaque contact doit avoir au moins un rôle vérifié, et « Contact de données » ou « Contact de métadonnées » doit être ajouté à au moins un contact",
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
  const numTotal = fields.length;
  const validFields = fields.filter((field) => validateField(record, field));

  const numValid = validFields.length;

  return numValid / numTotal;
};
export const recordIsValid = (record) => {
  return percentValid(record) === 1;
};
