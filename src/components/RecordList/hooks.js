import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// useResponsiveDefault - Determines default view based on screen size
// ============================================================================
const BREAKPOINT = 960; // px - matches MUI md breakpoint

export function useResponsiveDefault() {
  const [defaultView, setDefaultView] = useState(() => {
    if (typeof window === 'undefined') return 'card';
    return window.innerWidth >= BREAKPOINT ? 'table' : 'card';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINT}px)`);

    const handleChange = (e) => {
      setDefaultView(e.matches ? 'table' : 'card');
    };

    // Set initial value
    setDefaultView(mediaQuery.matches ? 'table' : 'card');

    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  return defaultView;
}

// ============================================================================
// useViewPreference - Manages view mode (table/card) with persistence
// ============================================================================
const VIEW_PREFERENCE_KEY_PREFIX = 'record-list-view-';

export function useViewPreference(pageId, persistPreference = true) {
  const responsiveDefault = useResponsiveDefault();
  const storageKey = `${VIEW_PREFERENCE_KEY_PREFIX}${pageId}`;

  const [viewMode, setViewMode] = useState(() => {
    if (!persistPreference) return responsiveDefault;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && ['table', 'card'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // localStorage may not be available
    }
    return responsiveDefault;
  });

  // Update from responsive default if no saved preference
  useEffect(() => {
    if (!persistPreference) {
      setViewMode(responsiveDefault);
      return;
    }

    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setViewMode(responsiveDefault);
      }
    } catch (e) {
      setViewMode(responsiveDefault);
    }
  }, [responsiveDefault, storageKey, persistPreference]);

  // Persist to localStorage when changed
  useEffect(() => {
    if (persistPreference) {
      try {
        localStorage.setItem(storageKey, viewMode);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [viewMode, storageKey, persistPreference]);

  const toggleView = useCallback(() => {
    setViewMode((current) => (current === 'table' ? 'card' : 'table'));
  }, []);

  const setView = useCallback((mode) => {
    if (['table', 'card'].includes(mode)) {
      setViewMode(mode);
    }
  }, []);

  return {
    viewMode,
    setView,
    toggleView,
    isTableView: viewMode === 'table',
    isCardView: viewMode === 'card',
  };
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

  const resetColumnVisibility = useCallback(() => {
    setColumnVisibilityModel(defaultVisibility);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      // Ignore errors
    }
  }, [storageKey, defaultVisibility]);

  return {
    columnVisibilityModel,
    handleColumnVisibilityChange,
    resetColumnVisibility,
  };
}

// ============================================================================
// useListState - Shared filter/sort state with persistence
// ============================================================================
const LIST_STATE_PREFIX = 'record-list-state-';

export function useListState(pageId) {
  const storageKey = `${LIST_STATE_PREFIX}${pageId}`;

  const [filterModel, setFilterModel] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filterModel || { items: [] };
      }
    } catch (e) { /* ignore storage errors */ JSON.stringify(e); }
    return { items: [] };
  });

  const [sortModel, setSortModel] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sortModel || [];
      }
    } catch (e) { /* ignore storage errors */ JSON.stringify(e); }
    return [];
  });

  const persist = useCallback((next) => {
    try {
      const current = localStorage.getItem(storageKey);
      const base = current ? JSON.parse(current) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...base, ...next }));
    } catch (e) { /* ignore storage errors */ JSON.stringify(e); }
  }, [storageKey]);

  const handleFilterModelChange = useCallback((model) => {
    setFilterModel((prev) => {
      const hasNewItems = Array.isArray(model?.items) && model.items.length > 0;
      const nextItems = hasNewItems ? model.items : (prev?.items || []);
      const nextQuick = (model && Object.prototype.hasOwnProperty.call(model, 'quickFilterValues'))
        ? (model.quickFilterValues || [])
        : (prev?.quickFilterValues || []);
      const nextLogic = (model && Object.prototype.hasOwnProperty.call(model, 'logicOperator'))
        ? model.logicOperator
        : prev?.logicOperator;

      const next = {
        items: nextItems,
        quickFilterValues: nextQuick,
        ...(nextLogic ? { logicOperator: nextLogic } : {}),
      };

      // Persist the merged model
      persist({ filterModel: next });
      return next;
    });
  }, [persist]);

  const handleSortModelChange = useCallback((model) => {
    setSortModel(model);
    persist({ sortModel: model });
  }, [persist]);

  const reset = useCallback(() => {
    setFilterModel({ items: [] });
    setSortModel([]);
    try { localStorage.removeItem(storageKey); } catch (e) { /* ignore storage errors */ JSON.stringify(e); }
  }, [storageKey]);

  return {
    filterModel,
    setFilterModel: handleFilterModelChange,
    sortModel,
    setSortModel: handleSortModelChange,
    resetListState: reset,
  };
}

