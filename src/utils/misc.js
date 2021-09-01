export function camelToSentenceCase(text = "") {
  if (!text) return "";
  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
export function deepEquals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
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
