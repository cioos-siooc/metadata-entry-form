import * as ScreenOrientation from "expo-screen-orientation";

/**
 * Which way the app is allowed to turn.
 *
 * Two real cases pull in opposite directions. On an iPad — increasingly how a
 * lab reviews records — locking to portrait wastes half the screen and fights
 * the keyboard case. On a phone held one-handed at a rail, rotation triggered
 * by the boat rather than the user is worse than useless.
 *
 * So the app allows rotation by default, which is what a tablet needs, and lets
 * anyone lock it. The native manifest permits every orientation; this narrows
 * it at runtime.
 */

export type RotationPreference = "auto" | "portrait";

export const ROTATION_PREFERENCES: RotationPreference[] = ["auto", "portrait"];

export function isRotationPreference(value: unknown): value is RotationPreference {
  return value === "auto" || value === "portrait";
}

/**
 * Applies the preference.
 *
 * Failures are swallowed: an orientation lock is a nicety, and a device that
 * refuses one (or a simulator that has not finished booting) must not stop the
 * app from starting.
 */
export async function applyRotation(preference: RotationPreference): Promise<void> {
  try {
    if (preference === "portrait") {
      // PORTRAIT, not PORTRAIT_UP: upside-down is still portrait on a tablet,
      // and locking it out makes a docked iPad unusable.
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    } else {
      await ScreenOrientation.unlockAsync();
    }
  } catch {
    // Nothing to tell the user; the screen simply keeps its current behaviour.
  }
}
