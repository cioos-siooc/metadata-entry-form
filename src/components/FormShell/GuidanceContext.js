import { createContext, useCallback, useContext, useState } from "react";

// Whether field guidance (the full question and its explanatory notes) is
// expanded throughout the record form. On by default so a first-time provider
// sees everything; returning users switch it off once and the choice sticks in
// this browser. Each field can still be opened on its own while it's off.
const STORAGE_KEY = "cioos-form-show-guidance";

export const GuidanceContext = createContext({
  showGuidance: true,
  setShowGuidance: () => {},
});

export const useGuidance = () => useContext(GuidanceContext);

export function useGuidancePreference() {
  const [showGuidance, setState] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  });

  const setShowGuidance = useCallback((next) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Storage blocked (private window, previews): the toggle still works for
      // this visit.
    }
  }, []);

  return { showGuidance, setShowGuidance };
}
