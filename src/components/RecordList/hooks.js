import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigationType } from "react-router-dom";

const filterStorageKey = (pageId) => `record-table-filters-${pageId}`;
const fromFormMarkerKey = (pageId) => `record-table-fromForm-${pageId}`;

// Set just before navigating from a dashboard into a form route, so that on
// browser/app Back the dashboard knows to preserve its filters.
export function markFormNavigation(pageId) {
  try {
    sessionStorage.setItem(fromFormMarkerKey(pageId), "1");
  } catch {
    /* ignore storage errors */
  }
}

// ============================================================================
// useRecordTableFilters - DataGrid filter/sort state for record list tables.
// Persists to sessionStorage. On every mount, clears the persisted state
// unless the user is returning from a form via browser/app Back (POP +
// one-shot marker set by markFormNavigation).
// ============================================================================
export function useRecordTableFilters(pageId) {
  const navType = useNavigationType();
  const filterKey = filterStorageKey(pageId);
  const markerKey = fromFormMarkerKey(pageId);

  // One-shot decision: runs synchronously during the first render, BEFORE the
  // useState initializers read sessionStorage.
  const didInit = useRef(false);
  if (!didInit.current) {
    didInit.current = true;
    try {
      const cameFromForm = sessionStorage.getItem(markerKey) === "1";
      sessionStorage.removeItem(markerKey);
      if (!cameFromForm || navType !== "POP") {
        sessionStorage.removeItem(filterKey);
      }
    } catch {
      /* ignore storage errors */
    }
  }

  const [filterModel, setFilterModel] = useState(() => {
    try {
      const saved = sessionStorage.getItem(filterKey);
      if (saved) {
        return JSON.parse(saved).filterModel || { items: [] };
      }
    } catch {
      /* ignore storage errors */
    }
    return { items: [] };
  });

  const [sortModel, setSortModel] = useState(() => {
    try {
      const saved = sessionStorage.getItem(filterKey);
      if (saved) {
        return JSON.parse(saved).sortModel || [];
      }
    } catch {
      /* ignore storage errors */
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        filterKey,
        JSON.stringify({ filterModel, sortModel }),
      );
    } catch {
      /* ignore storage errors */
    }
  }, [filterModel, sortModel, filterKey]);

  return { filterModel, setFilterModel, sortModel, setSortModel };
}

// ============================================================================
// useColumnVisibility - Manages DataGrid column visibility with persistence
// ============================================================================
export function useColumnVisibility(storageKey, defaultVisibility) {
  const [columnVisibilityModel, setColumnVisibilityModel] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge saved settings with defaults so new columns respect their default visibility
        return { ...defaultVisibility, ...parsed };
      }
    } catch {
      // Ignore errors
    }
    return defaultVisibility;
  });

  const handleColumnVisibilityChange = useCallback(
    (newModel) => {
      setColumnVisibilityModel(newModel);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newModel));
      } catch {
        // Ignore errors
      }
    },
    [storageKey],
  );

  return {
    columnVisibilityModel,
    handleColumnVisibilityChange,
  };
}
