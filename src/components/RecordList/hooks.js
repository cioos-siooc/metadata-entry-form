import { useState, useCallback } from 'react';

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
    } catch (e) {
      // Ignore errors
    }
    return defaultVisibility;
  });

  const handleColumnVisibilityChange = useCallback(
    (newModel) => {
      setColumnVisibilityModel(newModel);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newModel));
      } catch (e) {
        // Ignore errors
      }
    },
    [storageKey]
  );

  return {
    columnVisibilityModel,
    handleColumnVisibilityChange,
  };
}
