import type { ViewStyle } from "react-native";

/**
 * The reading column.
 *
 * Once the app can turn, a screen is as wide as an iPad in landscape — about
 * 1100pt — and a form field stretched across all of it is both ugly and hard to
 * use: the eye loses the line, and a checkbox ends up a hand's width from its
 * label. Content is capped and centred instead, which costs nothing on a phone
 * (where the cap is never reached) and is the difference between usable and not
 * on a tablet.
 *
 * 720 rather than the usual 640–680 prose measure: several inputs here are
 * side-by-side pairs — bounding-box coordinates, date ranges — and they need
 * the extra room before they wrap.
 */
export const MAX_CONTENT_WIDTH = 720;

/** Apply to a ScrollView's contentContainerStyle, or to a plain container. */
export const contentColumn: ViewStyle = {
  width: "100%",
  maxWidth: MAX_CONTENT_WIDTH,
  alignSelf: "center",
};
