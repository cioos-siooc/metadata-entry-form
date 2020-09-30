export function camelToSentenceCase(text) {
  var result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
// converts firebase style arrays (key as index) to arrays. work on arrays nested in objects
export function firebaseToJSObject(input) {
  if (!input) return null;
  const out = deepCopy(input);
  Object.keys(out).forEach((key) => {
    if (typeof out[key] === "object" && Object.keys(out[key])[0] === "0") {
      out[key] = Object.entries(out[key]).map(([k, v]) => v);
    }
  });
  return out;
}
