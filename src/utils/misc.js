export function camelToSentenceCase(text) {
  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

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
        en: Object.values(input.keywords.en),
        fr: Object.values(input.keywords.fr),
      };
  });
  return out;
}
