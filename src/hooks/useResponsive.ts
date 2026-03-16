import { useState, useEffect } from 'react';
import { BREAKPOINTS, LayoutMode } from '@/context/LayoutContext';

interface ResponsiveState {
  width: number;
  height: number;
  layoutMode: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// Helper function to determine layout mode based on viewport width
const getLayoutMode = (width: number): LayoutMode => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

// Helper function to get initial viewport dimensions
const getViewportDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 1200, height: 800 }; // Default for SSR
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState(getViewportDimensions);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events to improve performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions(getViewportDimensions());
      }, 150);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Set initial dimensions
    setDimensions(getViewportDimensions());

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const layoutMode = getLayoutMode(dimensions.width);

  return {
    width: dimensions.width,
    height: dimensions.height,
    layoutMode,
    isMobile: layoutMode === 'mobile',
    isTablet: layoutMode === 'tablet',
    isDesktop: layoutMode === 'desktop',
  };
}

// Hook for checking specific breakpoints
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[breakpoint];
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
}