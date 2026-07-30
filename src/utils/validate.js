// Moved to the @cioos/shared workspace so the web SPA and the Expo app share
// one source of truth. Re-exported here so existing imports keep working.
//
// The validation core is deliberately network-free in shared/. The one warning
// that needs a transport — the resource URL reachability check — is wired back
// up here with the SPA's own `checkURLActive`.

import { createWarnings } from "@cioos/shared/validateWarnings.js";
import { checkURLActive } from "../api/actions";

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
} from "@cioos/shared/validate.js";

export const { warnings, validateFieldWarning } = createWarnings({
  checkURLActive,
});
