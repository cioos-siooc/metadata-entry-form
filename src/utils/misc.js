import { AssignmentReturn } from "@material-ui/icons";

export function camelToSentenceCase(text) {
  var result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
