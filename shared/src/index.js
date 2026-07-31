// Public surface of the shared core: the record model, the validation gate and
// the controlled vocabularies. Everything here is plain ESM JavaScript with no
// React, MUI or DOM dependency, so it runs unchanged in the web SPA, the Expo
// app and Node.
//
// Deep imports also work — `@cioos/shared/validate.js` and friends — which is
// what the SPA's compatibility shims in src/ use.

export {
  validators,
  validateField,
  getErrorsByTab,
  percentValid,
  recordIsValid,
  validateEmail,
  validateURL,
  validateDOI,
  doiRegexp,
} from "./validate.js";

export { createWarnings } from "./validateWarnings.js";

export { localized, hasLanguage } from "./localized.js";

export {
  getBlankRecord,
  getBlankContact,
  getBlankInstrument,
  getBlankPlatform,
} from "./blankRecord.js";

export {
  deepCopy,
  deepEquals,
  firebaseToJSObject,
  trimStringsInObject,
  getRecordFilename,
  unique,
} from "./misc.js";

export { eovs, eovCategories } from "./eovs.js";
export { getRegionLogo, mergeRegions, default as regions } from "./regions.js";
export { default as licenses } from "./licenses.js";
export { default as keywords } from "./keywords.js";
export { default as tabs } from "./tabs.js";
export { default as themesList } from "./themes.js";
export { default as associationTypeToIso } from "./associationTypeMapping.js";

export * from "./isoCodeLists.js";
