/* eslint no-param-reassign: ["error", { "props": false }] */
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
export function deepEquals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/* recursively convert objects with the first key == 0 to arrays */
function objectToArray(obj) {
  if (typeof obj === "object" && Object.keys(obj)[0] === "0") {
    const newObj = Object.entries(obj).map(([, v]) => {
      Object.keys(v).forEach((key) => {
        try {
          v[key] = objectToArray(v[key]);
        }
        catch (error) {
          if (error instanceof TypeError)
            return v[key];
        }
        return v[key];
      })
      return v
    })
    return newObj
  }
  return obj
}

/*
Convert firebase to javascript, mostly just used to get real array elements
*/
export function firebaseToJSObject(input) {
  if (!input) return null;
  const out = deepCopy(input);
  Object.keys(out).forEach((key) => {
    out[key] = objectToArray(out[key])

    //  special case
    if (input.keywords)
      out.keywords = {
        en: Object.values(input.keywords.en || {}),
        fr: Object.values(input.keywords.fr || {}),
      };
  });
  if (out.contacts) {
    Object.values(out.contacts).forEach((contact) => {
      if (contact.role) {
        // eslint-disable-next-line no-param-reassign
        contact.role = Object.values(contact.role);
      }
    });
  }

  return out;
}

const replacer = (key, value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  return value;
};

// used to trim all extra whitespace from strings in the record
export const trimStringsInObject = (obj) =>
  JSON.parse(JSON.stringify(obj, replacer));

export function getRecordFilename(record) {
  return `${record.title[record.language].slice(
    0,
    30
  )}_${record.identifier.slice(0, 5)}`
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "_");
}
export const unique = (arr) => [...new Set(arr)];
