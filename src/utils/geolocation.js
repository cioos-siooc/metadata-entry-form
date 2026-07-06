// Promisified navigator.geolocation.getCurrentPosition with error codes
// mapped to stable identifiers. Geolocation only works in secure contexts
// (HTTPS or localhost) — call isGeolocationAvailable() before showing UI.

export function isGeolocationAvailable() {
  return (
    typeof navigator !== "undefined" &&
    "geolocation" in navigator &&
    (typeof window === "undefined" || window.isSecureContext)
  );
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      const err = new Error("Geolocation is not available");
      err.code = "unavailable";
      reject(err);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        const err = new Error(error.message || "Could not determine location");
        err.code = error.code === 1 ? "denied" : "unavailable";
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
