import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CircularProgress } from "@mui/material";
import { getRegions } from "../api/regions";
import regions, { mergeRegions } from "../regions";

// Loads region config from the API and merges it into the static regions
// object (see mergeRegions). Children are held behind a spinner until the
// fetch settles so nothing renders against a half-loaded region list; on API
// failure the bundled static config is the fallback.
const RegionsContext = createContext({ regions, regionsLoaded: false });

export function useRegions() {
  return useContext(RegionsContext);
}

export default function RegionsProvider({ children }) {
  const [regionsLoaded, setRegionsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRegions()
      .then((data) => mergeRegions(data?.regions))
      .catch((err) => {
        console.error("Failed to load regions from API, using bundled config", err);
      })
      .finally(() => {
        if (!cancelled) setRegionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ regions, regionsLoaded }), [regionsLoaded]);

  if (!regionsLoaded) {
    return <CircularProgress style={{ margin: "40vh auto", display: "block" }} />;
  }

  return <RegionsContext.Provider value={value}>{children}</RegionsContext.Provider>;
}
