// CommonJS port of firebaseToJSObject from src/utils/misc.js.
// Copied (not imported) because src/ is an ESM/Vite frontend module tree that
// is fragile to require() from plain Node. Keep the logic identical: it
// normalizes the classic RTDB pathology where arrays come back as
// index-keyed objects ({"0": ..., "1": ...}).

/* eslint no-param-reassign: ["error", { "props": false }] */
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* recursively convert objects with the first key == 0 to arrays */
function objectToArray(obj) {
  if (typeof obj === "object" && obj !== null && Object.keys(obj)[0] === "0") {
    const newObj = Object.entries(obj).map(([, v]) => {
      if (v && typeof v === "object") {
        Object.keys(v).forEach((key) => {
          try {
            v[key] = objectToArray(v[key]);
          } catch (error) {
            if (error instanceof TypeError) return v[key];
          }
          return v[key];
        });
      }
      return v;
    });
    return newObj;
  }
  return obj;
}

/*
Convert firebase to javascript, mostly just used to get real array elements
*/
function firebaseToJSObject(input) {
  if (!input) return null;
  const out = deepCopy(input);
  Object.keys(out).forEach((key) => {
    out[key] = objectToArray(out[key]);

    //  special case
    if (input.keywords)
      out.keywords = {
        en: Object.values(input.keywords.en || {}),
        fr: Object.values(input.keywords.fr || {}),
      };
  });
  if (out.contacts) {
    Object.values(out.contacts).forEach((contact) => {
      if (contact && contact.role) {
        contact.role = Object.values(contact.role);
      }
    });
  }

  return out;
}

module.exports = { firebaseToJSObject, objectToArray, deepCopy };
