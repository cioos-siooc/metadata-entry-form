import validator from "validator";
import { getFunctions, httpsCallable } from "firebase/functions";
// eslint-disable-next-line no-unused-vars
import firebase from "../firebase"; // this is needed to make the test pass.
import { hasResourceType, resourceTypeIncludes } from "./normalizeResourceType";
import { eovs } from "../eovs";

export const validateEmail = (email) => !email || validator.isEmail(email);
export const validateURL = (url) => !url || validator.isURL(url);
const functions = getFunctions();
const checkURLActive = httpsCallable(functions, "checkURLActive");

// See https://stackoverflow.com/a/48524047/7416701
export const doiRegexp =
  /^(https:\/\/doi.org\/)?10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
export const validateDOI = (val) =>
  !val || (doiRegexp.test(val) && isValidHttpUrl(val));
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
        validateLongitude(parseFloat(lon)) && validateLatitude(parseFloat(lat)),
    ).length === coordinates.length
  );
};

const bboxLabels = {
  north: { en: "North", fr: "Nord" },
  south: { en: "South", fr: "Sud" },
  east: { en: "East", fr: "Est" },
  west: { en: "West", fr: "Ouest" },
};

// Specific complaints about a bounding box, so the user gets more than "Spatial information is missing".
// Returns [] when nothing is filled in (that's the generic "missing" case) or when the box is fine.
export const bboxProblems = (map = {}) => {
  const coords = {
    north: parseFloat(map.north),
    south: parseFloat(map.south),
    east: parseFloat(map.east),
    west: parseFloat(map.west),
  };
  const names = (keys, language) =>
    keys.map((k) => bboxLabels[k][language]).join(", ");
  const problems = [];

  const missing = Object.keys(coords).filter((k) => Number.isNaN(coords[k]));
  if (missing.length && missing.length < 4)
    problems.push({
      en: `Missing bounding box coordinate(s): ${names(missing, "en")}`,
      fr: `Coordonnée(s) de délimitation manquante(s) : ${names(missing, "fr")}`,
    });

  const outOfRange = Object.keys(coords).filter(
    (k) =>
      !Number.isNaN(coords[k]) &&
      !(k === "north" || k === "south"
        ? validateLatitude(coords[k])
        : validateLongitude(coords[k])),
  );
  if (outOfRange.length)
    problems.push({
      en: `Coordinate(s) out of range: ${names(
        outOfRange,
        "en",
      )}. Latitudes must be between -90 and 90, longitudes between -360 and 360`,
      fr: `Coordonnée(s) hors limites : ${names(
        outOfRange,
        "fr",
      )}. Les latitudes doivent être comprises entre -90 et 90, les longitudes entre -360 et 360`,
    });

  // NaN comparisons are false, so these only fire once both values are numbers
  if (coords.north < coords.south)
    problems.push({
      en: "North latitude must be greater than or equal to South latitude",
      fr: "La latitude Nord doit être supérieure ou égale à la latitude Sud",
    });

  if (coords.east < coords.west)
    problems.push({
      en: "East longitude must be greater than or equal to West longitude",
      fr: "La longitude Est doit être supérieure ou égale à la longitude Ouest",
    });

  return problems;
};

const contactIsFilled = (contact) =>
  Boolean(
    contact.role &&
    contact.role.length &&
    (contact.orgName || contact.givenNames || contact.lastName),
  );

// Per-item rules. The record validators below apply these to every item; the
// list editors use them to mark each item complete or not.
const contactLinksValid = (contact) =>
  validateEmail(contact.indEmail) &&
  validateEmail(contact.orgEmail) &&
  validateURL(contact.orgURL);

export const contactIsComplete = (contact) =>
  contactIsFilled(contact) && contactLinksValid(contact);

export const resourceIsComplete = (dist) =>
  Boolean(dist.name && dist.url && validator.isURL(dist.url));

export const relatedWorkIsComplete = (work) =>
  Boolean(
    work.title?.en &&
    work.title?.fr &&
    work.authority &&
    work.code &&
    work.association_type,
  );

// Lineage sources and processing steps.
export const lineagePartIsComplete = (part) =>
  Boolean(part.title && part.description);

export const lineageIsComplete = (lineageStep) =>
  (lineageStep.processingStep || []).every(lineagePartIsComplete) &&
  (lineageStep.source || []).every(lineagePartIsComplete) &&
  (lineageStep.scope !== "collectionSession" ||
    Boolean(lineageStep.statement?.en && lineageStep.statement?.fr));

export const platformIsComplete = (platform) =>
  Boolean(platform.type && platform.id);

export const instrumentIsComplete = (instrument, platforms = []) =>
  Boolean(instrument.id && (platforms.length < 2 || instrument.platform));

// required fields and  a function to validate each
const validators = {
  title: {
    validation: (val) => val && val.en && val.fr,
    tab: "start",
    error: {
      en: "Dataset title: enter it in both English and French",
      fr: "Titre du jeu de données : saisissez-le en français et en anglais",
    },
  },
  resourceType: {
    validation: (val) => hasResourceType(val),
    tab: "start",
    error: {
      en: "Topic categories: select at least one",
      fr: "Catégories thématiques : sélectionnez-en au moins une",
    },
  },
  abstract: {
    validation: (val) => val && val.en && val.fr,
    tab: "dataID",
    error: {
      en: "Abstract: enter it in both English and French",
      fr: "Résumé : saisissez-le en français et en anglais",
    },
  },
  keywords: {
    validation: (val) => val && (val.en.length || val.fr.length),
    tab: "dataID",
    error: {
      en: "Keywords: add at least one",
      fr: "Mots-clés : ajoutez-en au moins un",
    },
  },
  eov: {
    validation: (val) => val && val.length,
    tab: "dataID",
    error: {
      en: "Essential ocean variables: select at least one",
      fr: "Variables océaniques essentielles : sélectionnez-en au moins une",
    },
  },
  eovDeprecated: {
    validation: (_, record) => {
      const deprecatedValues = new Set(
        eovs.filter((e) => e.deprecated).map((e) => e.value),
      );
      const eov = Array.isArray(record.eov) ? record.eov : [];
      return !eov.some((v) => deprecatedValues.has(v));
    },
    tab: "dataID",
    error: {
      en: "One or more selected EOVs are deprecated and prevent submission. Please unselect them and choose the replacement EOVs.",
      fr: "Une ou plusieurs EOVs sélectionnées sont dépréciées et empêchent la soumission. Veuillez les désélectionner et choisir les EOVs de remplacement.",
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
      en: "Resource type: select one",
      fr: "Type de ressource : sélectionnez-en un",
    },
  },
  progress: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Status: select one",
      fr: "État : sélectionnez-en un",
    },
  },
  language: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Primary language: select one",
      fr: "Langue principale : sélectionnez-en une",
    },
  },
  license: {
    tab: "dataID",
    validation: (val) => val,
    error: {
      en: "Licence: select one",
      fr: "Licence : sélectionnez-en une",
    },
  },
  // if biological data then geographic description is required
  map: {
    error: (val) => {
      const problems = val ? bboxProblems(val) : [];
      if (problems.length)
        return {
          en: problems.map((p) => p.en).join("; "),
          fr: problems.map((p) => p.fr).join("; "),
        };
      if (val && val.polygon)
        return {
          en: "Polygon coordinates are invalid: use space separated lat,lon pairs that start and end with the same point",
          fr: "Les coordonnées du polygone sont invalides : utilisez des paires lat,lon séparées par des espaces qui commencent et se terminent par le même point",
        };
      return {
        en: "Spatial information is missing",
        fr: "Les informations spatiales sont manquantes",
      };
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
        (!Number.isNaN(north) &&
          !Number.isNaN(south) &&
          !Number.isNaN(east) &&
          !Number.isNaN(west) &&
          north >= south &&
          east >= west &&
          validateLatitude(north) &&
          validateLatitude(south) &&
          validateLongitude(east) &&
          validateLongitude(west)) ||
        (polygon && polygonIsValid(polygon)) ||
        !hasResourceType(record.resourceType) ||
        (resourceTypeIncludes(record.resourceType, "biota") && description)
      );
    },
  },

  verticalExtentMin: {
    tab: "spatial",

    validation: (val, record) => val || record.noVerticalExtent,
    error: {
      en: "Vertical extent: enter the minimum",
      fr: "Étendue verticale : saisissez le minimum",
    },
  },
  verticalExtentMax: {
    tab: "spatial",
    validation: (val, record) => val || record.noVerticalExtent,
    error: {
      en: "Vertical extent: enter the maximum",
      fr: "Étendue verticale : saisissez le maximum",
    },
  },
  verticalExtentDirection: {
    tab: "spatial",
    validation: (val, record) => val || record.noVerticalExtent,
    error: {
      en: "Vertical extent: choose depth or height (the reference)",
      fr: "Étendue verticale : choisissez profondeur ou hauteur (la référence)",
    },
  },
  // at least one contact has to have a role and a org or individual name
  // at least one contact has to appear in citation
  contacts: {
    tab: "contacts",
    validation: (val) =>
      val &&
      // every contact must have a role and name
      val.every(contactIsComplete) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("custodian")) &&
      val
        .filter(contactIsFilled)
        .find((contact) => contact.role.includes("owner")) &&
      val.filter(contactIsFilled).find((contact) => contact.inCitation),
    // Only the rules that actually fail, so the Submit list says what to fix.
    error: (val) => {
      const list = Array.isArray(val) ? val : [];
      const filled = list.filter(contactIsFilled);
      const problems = [
        [
          !list.length || !list.every(contactIsFilled),
          "every contact needs a name and at least one role",
          "chaque contact doit avoir un nom et au moins un rôle",
        ],
        [
          !filled.some((c) => c.role.includes("custodian")),
          "add a Metadata custodian",
          "ajoutez un dépositaire des métadonnées",
        ],
        [
          !filled.some((c) => c.role.includes("owner")),
          "add a Data owner",
          "ajoutez un propriétaire des données",
        ],
        [
          !filled.some((c) => c.inCitation),
          "select at least one contact to appear in the citation",
          "sélectionnez au moins un contact pour la citation",
        ],
        [
          !list.every(contactLinksValid),
          "fix invalid email addresses or URLs",
          "corrigez les adresses courriel ou URL non valides",
        ],
      ].filter(([failing]) => failing);
      return {
        en: `Contacts: ${problems.map((p) => p[1]).join("; ")}`,
        fr: `Contacts : ${problems.map((p) => p[2]).join(" ; ")}`,
      };
    },
  },
  distribution: {
    tab: "resources",
    validation: (val) =>
      Array.isArray(val) && val.filter(resourceIsComplete).length,

    error: {
      en: "Resources: add at least one, with a name and a valid URL",
      fr: "Ressources : ajoutez-en au moins une, avec un nom et une URL valide",
    },
  },
  associated_resources: {
    tab: "relatedworks",
    validation: (val) =>
      !val || val.every(relatedWorkIsComplete),
    error: {
      en: "Related works must contain a Title, Identifier, Identifier Type, and a Relation Type to be valid.",
      fr: "Les ressources connexes doivent contenir un titre, un identifiant, un type d'identifiant et un type de relation pour être valides.",
    },
  },

  // if lineageStep.scope == 'collectionSession' then statment is required
  // if lineageStep.processingStep length > 0 then title and description are required
  history: {
    tab: "lineage",
    validation: (val) =>
      !val || (Array.isArray(val) && val.every(lineageIsComplete)),
    error: {
      en: "Lineage must contain a title and description for each processing step and source. If lineage scope is set to 'data collection' then lineage statement is required",
      fr: "La généalogie des données doit contenir un titre et une description pour chaque étape de traitement. Si le cadre est défini sur « collecte de données », alors une déclaration de généalogie des données est requise",
    },
  },
  platforms: {
    tab: "platform",
    validation: (val, record) =>
      record.noPlatform ||
      val.every(platformIsComplete) ||
      !record.metadataScope ||
      record.metadataScopeIso === "model",
    error: {
      en: "Missing platform type or ID",
      fr: "Type ou ID de plateforme manquant.",
    },
  },
  instruments: {
    tab: "platformInstruments",
    validation: (val, record) => {
      const platforms = record.platforms || [];
      return val.every((instrument) =>
        instrumentIsComplete(instrument, platforms),
      );
    },
    error: {
      en: "Instrument ID is required. When multiple platforms are defined, each instrument must be associated to a platform.",
      fr: "L'identifiant de l'instrument est requis. Lorsque plusieurs plates-formes sont définies, chaque instrument doit être associé à une plate-forme.",
    },
  },
  taxa: {
    tab: "taxa",
    validation: (val, record) => record.noTaxa || val,
    error: {
      en: "Taxa: add at least one, or confirm the dataset has none",
      fr: "Taxons : ajoutez-en au moins un, ou confirmez qu'il n'y en a aucun",
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
    return {
      error: typeof error === "function" ? error(record[field], record) : error,
      tab,
      field,
    };
  });

  // Each error keeps its field key so the UI can link straight to the field.
  return fieldErrorInfo.reduce((acc, { error, tab, field }) => {
    if (!acc[tab]) acc[tab] = [];
    acc[tab].push({ ...error, field });
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
          return { ...dist, status: res.data };
        }),
      );
      const filterVal = processedVal.filter((dist) => !dist.status);
      return filterVal.length;
    },
    error: {
      en: "Resource URL is not accessible. This could be because it has not been created yet or is otherwise unreachable",
      fr: "L'URL de la ressource n'est pas accessible. Cela peut être dû au fait qu'il n'a pas encore été créé ou qu'il est autrement inaccessible.",
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
  const numTotalRequired = fields.filter(
    (field) => !validators[field].optional,
  ).length;

  const validFieldsRequired = fields.filter(
    (field) => !validators[field].optional && validateField(record, field),
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
