// Moved to the @cioos/shared workspace so the web SPA and the Expo app share
// one source of truth. Re-exported here so existing imports keep working.
export {
  getBlankRecord,
  getBlankContact,
  getBlankInstrument,
  getBlankPlatform,
} from "@cioos/shared/blankRecord.js";
