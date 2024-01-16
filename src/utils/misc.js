export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
export function deepEquals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Creates a debounced version of a function.
 * 
 * @param {Function} mainFunction - The function to debounce.
 * @param {number} delay - The amount of time (in milliseconds) to delay.
 * @return {Function} A debounced version of the specified function.
 */
export const debounce = (mainFunction, delay) => {
  let timer;

  const debouncedFunction = (...args) => {
    // Return a promise that resolves or rejects based on the mainFunction's execution
    return new Promise((resolve, reject) => {
      // Clear existing timer to reset the debounce period
      clearTimeout(timer);

      // Set a new timer to delay the execution of mainFunction
      timer = setTimeout(() => {
        // Execute mainFunction and handle its promise
        Promise.resolve(mainFunction(...args))
          .then(resolve)
          .catch(reject);
      }, delay);
    });
  };

  return debouncedFunction;
}

/*
Convert firebase to javascript, mostly just used to get real array elements
*/
export function firebaseToJSObject(input) {
  if (!input) return null;
  const out = deepCopy(input);
  Object.keys(out).forEach((key) => {
    if (typeof out[key] === "object" && Object.keys(out[key])[0] === "0") {
      out[key] = Object.entries(out[key]).map(([, v]) => v);
    }

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
