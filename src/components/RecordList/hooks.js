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
// useCardFilters - Simple card view filter state with persistence
// ============================================================================
const CARD_FILTERS_PREFIX = 'record-card-filters-';

export function useCardFilters(pageId) {
  const storageKey = `${CARD_FILTERS_PREFIX}${pageId}`;

  const [search, setSearch] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.search || '';
      }
    } catch { /* ignore storage errors */ }
    return '';
  });

  const [author, setAuthor] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.author || '';
      }
    } catch { /* ignore storage errors */ }
    return '';
  });

  const [statuses, setStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed.statuses) ? parsed.statuses : [];
      }
    } catch { /* ignore storage errors */ }
    return [];
  });

  const [sortField, setSortField] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sortField || 'created';
      }
    } catch { /* ignore storage errors */ }
    return 'created';
  });

  const [sortDir, setSortDir] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sortDir || 'desc';
      }
    } catch { /* ignore storage errors */ }
    return 'desc';
  });

  const persist = useCallback((state) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch { /* ignore storage errors */ }
  }, [storageKey]);

  const handleSetSearch = useCallback((value) => {
    setSearch(value);
    persist({ search: value, author, statuses, sortField, sortDir });
  }, [persist, author, statuses, sortField, sortDir]);

  const handleSetAuthor = useCallback((value) => {
    setAuthor(value);
    persist({ search, author: value, statuses, sortField, sortDir });
  }, [persist, search, statuses, sortField, sortDir]);

  const handleSetStatuses = useCallback((value) => {
    setStatuses(value);
    persist({ search, author, statuses: value, sortField, sortDir });
  }, [persist, search, author, sortField, sortDir]);

  const handleSetSortField = useCallback((value) => {
    setSortField(value);
    persist({ search, author, statuses, sortField: value, sortDir });
  }, [persist, search, author, statuses, sortDir]);

  const handleSetSortDir = useCallback((value) => {
    setSortDir(value);
    persist({ search, author, statuses, sortField, sortDir: value });
  }, [persist, search, author, statuses, sortField]);

  const reset = useCallback(() => {
    setSearch('');
    setAuthor('');
    setStatuses([]);
    setSortField('created');
    setSortDir('desc');
    try { localStorage.removeItem(storageKey); } catch { /* ignore storage errors */ }
  }, [storageKey]);

  return {
    search,
    setSearch: handleSetSearch,
    author,
    setAuthor: handleSetAuthor,
    statuses,
    setStatuses: handleSetStatuses,
    sortField,
    setSortField: handleSetSortField,
    sortDir,
    setSortDir: handleSetSortDir,
    reset,
  };
}

