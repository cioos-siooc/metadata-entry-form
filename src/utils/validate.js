import validator from "validator";
import { getFunctions, httpsCallable } from "firebase/functions";
// eslint-disable-next-line no-unused-vars
import firebase from "../firebase"; // this is needed to make the test pass.

export const validateEmail = (email) => !email || validator.isEmail(email);
export const validateURL = (url) => !url || validator.isURL(url);
const functions = getFunctions();
const checkURLActive = httpsCallable(functions, 'checkURLActive');

// See https://stackoverflow.com/a/48524047/7416701
export const doiRegexp = /^(https:\/\/doi.org\/)?10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
export const validateDOI = (val) => !val || (doiRegexp.test(val) && isValidHttpUrl(val));
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
    contact.role &&
      contact.role.length &&
      (contact.orgName || contact.givenNames || contact.lastName)
  );

// required fields and  a function to validate each
const validators = {
  title: {
    validation: (val) => val && val.en && val.fr,
    tab: "start",
    error: {
      en: "Missing title in French or English",
      fr: "Titre manquant en français ou en anglais",
    },
  },
  resourceType: {
    validation: (val) => val,
    tab: "start",
    error: {
      en: "Please select a theme for this record",
      fr: "Veuillez sélectionner un thème pour cet enregistrement",
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
    validation: validateDOI,
    optional: true,
    tab: "start",
    error: {
      en: "Invalid DOI",
      fr: "DOI non valide",
    },
  },
  metadataScope: {
    tab: "start",
    validation: (val) => val,
    error: {
      en: "Please select a resource type",
      fr: "Veuillez sélectionner un type de ressources",
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
  // if biological data then geographic description is required
  map: {
    error: {
      en: "Spatial information is missing",
      fr: "L'information géographique est manquante",
    },
    tab: "spatial",
    validation: (val, record) => {
      if (!val) return false;
      const north = parseFloat(val.north);
      const south = parseFloat(val.south);
      const east = parseFloat(val.east);
      const west = parseFloat(val.west);
      const { polygon, description } = val;

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
        (polygon && polygonIsValid(polygon)) ||
        !record.resourceType  ||
        (Array.isArray(record.resourceType) && record.resourceType.includes("biological") && description)
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
  // at least one contact has to appear in citation
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
        .find((contact) => contact.role.includes("owner")) &&
      val.filter(contactIsFilled).find((contact) => contact.inCitation),
    error: {
      en:
        "Every contact must have at least one role checked, and 'Data Owner' or 'Metadata Custodian' must be added to at least one contact. One contact can occupy multiple roles. Email addresses must be in the form of user@example.com and URLs must be valid.  At least one contact must be selected to appear in the citation.",
      fr:
        "Chaque contact doit avoir au moins un rôle coché, et « Propriétaire des données » ou « Dépositaire des métadonnées » doit être ajouté à au moins un contact. Un contact peut occuper plusieurs rôles. Les adresses e-mail doivent être au format user@example.com et les URL doivent être valides. Au moins un contact doit être sélectionné pour apparaître dans la citation.",
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
        "Doit avoir au moins une ressource. Vérifiez si votre URL est valide.",
    },
  },
  associated_resources: {
    tab: "relatedworks",
    validation: (val) =>
      !val ||
      (val &&
        val.every(
          (work) => work.title && work.title.en && work.title.fr && work.authority && work.code && work.association_type
        )),
    error: {
      en:
        "Related works must contain a Title, Identifier, Identifier Type, and a Relation Type to be valid.",
      fr:
        "Les œuvres connexes doivent contenir un titre, un identifiant, un type d'identifiant et un type de relation pour être valides.",
    },
  },

  // if lineageStep.scope == 'collectionSession' then statment is required
  // if lineageStep.processingStep length > 0 then title and description are required
  history: {
    tab: "lineage",
    validation: (val) =>
      !val ||
      (
        Array.isArray(val) &&
        val.every(
          (lineageStep) =>
            !lineageStep.processingStep ||
            (
              lineageStep.processingStep &&
              lineageStep.processingStep.every((pStep) => pStep.title && pStep.description)
            )
        ) &&
        val.every(
          (lineageStep) =>
            !lineageStep.source ||
            (
              lineageStep.source &&
              lineageStep.source.every((pStep) => pStep.title && pStep.description)
            )
        ) &&
        val.every(
          (lineageStep) =>
            lineageStep.scope !== 'collectionSession' ||
            (
              lineageStep.scope === 'collectionSession' &&
              lineageStep.statement.en && lineageStep.statement.fr
            )
        )
      ),
    error: {
      en:
        "Lineage must contain a title and description for each processing step and source. If lineage scope is set to 'data collection' then lineage statement is required",
      fr:
        "Le lignage doit contenir un titre et une description pour chaque étape de traitement. Si la portée du lignage est définie sur « collecte de données », alors une déclaration de lignage est requise",
    },
  },
  platforms: {
    tab: "platform",
    validation: (val, record) => record.noPlatform || val.every((platform) => platform.type && platform.id) || (!record.metadataScope || record.metadataScope === 'model'),
    error: {
      en: "Missing platform type or ID",
      fr: "Type ou ID de plateforme manquant",
    },
  },
  instruments: {
    tab: "platformInstruments",
    validation: (val) => val.every((instrument) => instrument.id),
    error: {
      en: "Instrument ID is required",
      fr: "L'identifiant de l'instrument est requis",
    },
  },
  taxa: {
    tab: "taxa",
    validation: (val, record) => record.noTaxa || val,
    error: {
      en: "Missing Taxonomic Coverage",
      fr: "Couverture taxonomique manquante",
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


export const warnings = {
  distribution: {
    tab: "resources",
    validation: async (val) => {
      const processedVal = await Promise.all(
        val.map(async (dist) => {
          const res = await checkURLActive(dist.url);
          return {...dist, status:res.data};
        })
      );
      const filterVal = processedVal.filter((dist) => !dist.status)
      return filterVal.length
    },
    error: {
      en:
        "Resource URL is not accessible. This could be because it has not been created yet or is otherwise unreachable",
      fr:
        "L'URL de la ressource n'est pas accessible. Cela peut être dû au fait qu'il n'a pas encore été créé ou qu'il est autrement inaccessible.",
    },
  },
};


export const validateFieldWarning = async (record, fieldName) => {
  const valueToValidate = record[fieldName];
  // if no validator funciton exists, then it is not a required field
  const validationFunction =
    (warnings[fieldName] && warnings[fieldName].validation) || (() => true);

  const res = await validationFunction(valueToValidate, record);
  return validationFunction && res;
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
