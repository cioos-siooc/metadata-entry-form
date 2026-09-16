import { del, get } from "./client";

/**
 * Signed-in devices.
 *
 * The reason this screen exists on a field app rather than only on the web: a
 * phone left on a boat or dropped over the side is the likeliest way a session
 * escapes, and the person it happened to has only the device in their hand.
 */

export interface DeviceSession {
  sessionId: string;
  clientType: "native" | "browser" | string;
  deviceId?: string | null;
  deviceName?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt: string;
}

export function listSessions() {
  return get<DeviceSession[]>("/auth/sessions");
}

export function revokeSession(sessionId: string) {
  return del<{ ok: boolean }>(`/auth/sessions/${sessionId}`);
}
