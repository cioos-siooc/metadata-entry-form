import { useState, useEffect, useCallback } from 'react';
import { useResponsiveDefault } from './useResponsiveDefault';

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

export default useViewPreference;
