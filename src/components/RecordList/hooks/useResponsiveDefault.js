import { useState, useEffect } from 'react';

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

export default useResponsiveDefault;
