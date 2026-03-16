import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

// Responsive breakpoints
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200
} as const;

// Layout mode type
export type LayoutMode = 'desktop' | 'tablet' | 'mobile';

// Layout state interface
export interface LayoutState {
  menuPaneWidth: number;
  menuPaneCollapsed: boolean;
  listPaneWidth: number;
  listPaneCollapsed: boolean;
  popPaneWidth: number;
  popPaneVisible: boolean;
  layoutMode: LayoutMode;
  preferences: LayoutPreferences;
}

// Layout preferences interface
export interface LayoutPreferences {
  menuPaneWidth: number;
  listPaneWidth: number;
  popPaneWidth: number;
  menuPaneCollapsed: boolean;
  autoCollapseOnMobile: boolean;
}

// Default values
const DEFAULT_PREFERENCES: LayoutPreferences = {
  menuPaneWidth: 256,
  listPaneWidth: 320,
  popPaneWidth: 480,
  menuPaneCollapsed: false,
  autoCollapseOnMobile: true,
};

const DEFAULT_STATE: LayoutState = {
  menuPaneWidth: 256,
  menuPaneCollapsed: false,
  listPaneWidth: 320,
  listPaneCollapsed: false,
  popPaneWidth: 480,
  popPaneVisible: false,
  layoutMode: 'desktop',
  preferences: DEFAULT_PREFERENCES,
};

// Context interface
interface LayoutContextType {
  // State
  layoutState: LayoutState;

  // Actions
  setMenuPaneWidth: (width: number) => void;
  setMenuPaneCollapsed: (collapsed: boolean) => void;
  setListPaneWidth: (width: number) => void;
  setListPaneCollapsed: (collapsed: boolean) => void;
  setPopPaneWidth: (width: number) => void;
  setPopPaneVisible: (visible: boolean) => void;

  // Utility functions
  getCurrentBreakpoint: () => keyof typeof BREAKPOINTS;
  isResponsiveMode: (mode: LayoutMode) => boolean;
  resetToDefaults: () => void;

  // Preference management
  savePreferences: () => void;
  loadPreferences: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Local storage key
const LAYOUT_PREFERENCES_KEY = 'layout-preferences';

// Helper function to determine layout mode based on viewport width
const getLayoutMode = (width: number): LayoutMode => {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
};

// Helper function to load preferences from localStorage
const loadPreferencesFromStorage = (): LayoutPreferences => {
  try {
    const stored = localStorage.getItem(LAYOUT_PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and merge with defaults
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        // Ensure width constraints
        menuPaneWidth: Math.max(200, Math.min(400, parsed.menuPaneWidth || DEFAULT_PREFERENCES.menuPaneWidth)),
        listPaneWidth: Math.max(280, Math.min(500, parsed.listPaneWidth || DEFAULT_PREFERENCES.listPaneWidth)),
        popPaneWidth: Math.max(400, Math.min(600, parsed.popPaneWidth || DEFAULT_PREFERENCES.popPaneWidth)),
      };
    }
  } catch (error) {
    console.warn('Failed to load layout preferences from localStorage:', error);
  }
  return DEFAULT_PREFERENCES;
};

// Helper function to save preferences to localStorage
const savePreferencesToStorage = (preferences: LayoutPreferences): void => {
  try {
    localStorage.setItem(LAYOUT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save layout preferences to localStorage:', error);
  }
};

export function LayoutProvider({ children }: { children: ReactNode }) {
  // Initialize state with preferences from localStorage
  const [layoutState, setLayoutState] = useState<LayoutState>(() => {
    const savedPreferences = loadPreferencesFromStorage();
    const initialMode = getLayoutMode(window.innerWidth);

    return {
      ...DEFAULT_STATE,
      preferences: savedPreferences,
      menuPaneWidth: savedPreferences.menuPaneWidth,
      listPaneWidth: savedPreferences.listPaneWidth,
      popPaneWidth: savedPreferences.popPaneWidth,
      menuPaneCollapsed: savedPreferences.menuPaneCollapsed,
      layoutMode: initialMode,
      // Auto-collapse on mobile if preference is set
      listPaneCollapsed: initialMode === 'mobile' && savedPreferences.autoCollapseOnMobile,
    };
  });

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const newMode = getLayoutMode(window.innerWidth);

      setLayoutState(prev => {
        const shouldAutoCollapse = newMode === 'mobile' && prev.preferences.autoCollapseOnMobile;

        return {
          ...prev,
          layoutMode: newMode,
          // Auto-collapse list pane on mobile if preference is set
          listPaneCollapsed: shouldAutoCollapse || (newMode === 'tablet' && prev.listPaneCollapsed),
          // Hide pop pane on small screens
          popPaneVisible: newMode === 'mobile' ? false : prev.popPaneVisible,
        };
      });
    };

    // Debounce resize handler
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Action functions
  const setMenuPaneWidth = useCallback((width: number) => {
    // Enforce constraints
    const constrainedWidth = Math.max(200, Math.min(400, width));

    setLayoutState(prev => ({
      ...prev,
      menuPaneWidth: constrainedWidth,
      preferences: {
        ...prev.preferences,
        menuPaneWidth: constrainedWidth,
      },
    }));
  }, []);

  const setMenuPaneCollapsed = useCallback((collapsed: boolean) => {
    setLayoutState(prev => ({
      ...prev,
      menuPaneCollapsed: collapsed,
      preferences: {
        ...prev.preferences,
        menuPaneCollapsed: collapsed,
      },
    }));
  }, []);

  const setListPaneWidth = useCallback((width: number) => {
    // Enforce constraints
    const constrainedWidth = Math.max(280, Math.min(500, width));

    setLayoutState(prev => ({
      ...prev,
      listPaneWidth: constrainedWidth,
      preferences: {
        ...prev.preferences,
        listPaneWidth: constrainedWidth,
      },
    }));
  }, []);

  const setListPaneCollapsed = useCallback((collapsed: boolean) => {
    setLayoutState(prev => ({
      ...prev,
      listPaneCollapsed: collapsed,
    }));
  }, []);

  const setPopPaneWidth = useCallback((width: number) => {
    // Enforce constraints
    const constrainedWidth = Math.max(400, Math.min(600, width));

    setLayoutState(prev => ({
      ...prev,
      popPaneWidth: constrainedWidth,
      preferences: {
        ...prev.preferences,
        popPaneWidth: constrainedWidth,
      },
    }));
  }, []);

  const setPopPaneVisible = useCallback((visible: boolean) => {
    setLayoutState(prev => ({
      ...prev,
      popPaneVisible: visible,
    }));
  }, []);

  // Utility functions
  const getCurrentBreakpoint = useCallback((): keyof typeof BREAKPOINTS => {
    const width = window.innerWidth;
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    return 'desktop';
  }, []);

  const isResponsiveMode = useCallback((mode: LayoutMode): boolean => {
    return layoutState.layoutMode === mode;
  }, [layoutState.layoutMode]);

  const resetToDefaults = useCallback(() => {
    const currentMode = getLayoutMode(window.innerWidth);
    setLayoutState({
      ...DEFAULT_STATE,
      layoutMode: currentMode,
      preferences: DEFAULT_PREFERENCES,
      menuPaneWidth: DEFAULT_PREFERENCES.menuPaneWidth,
      listPaneWidth: DEFAULT_PREFERENCES.listPaneWidth,
      popPaneWidth: DEFAULT_PREFERENCES.popPaneWidth,
      menuPaneCollapsed: DEFAULT_PREFERENCES.menuPaneCollapsed,
      listPaneCollapsed: currentMode === 'mobile' && DEFAULT_PREFERENCES.autoCollapseOnMobile,
    });
  }, []);

  // Preference management
  const savePreferences = useCallback(() => {
    savePreferencesToStorage(layoutState.preferences);
  }, [layoutState.preferences]);

  const loadPreferences = useCallback(() => {
    const savedPreferences = loadPreferencesFromStorage();
    const currentMode = layoutState.layoutMode;

    setLayoutState(prev => ({
      ...prev,
      preferences: savedPreferences,
      menuPaneWidth: savedPreferences.menuPaneWidth,
      listPaneWidth: savedPreferences.listPaneWidth,
      popPaneWidth: savedPreferences.popPaneWidth,
      menuPaneCollapsed: savedPreferences.menuPaneCollapsed,
      listPaneCollapsed: currentMode === 'mobile' && savedPreferences.autoCollapseOnMobile,
    }));
  }, [layoutState.layoutMode]);

  // Auto-save preferences when they change
  useEffect(() => {
    savePreferencesToStorage(layoutState.preferences);
  }, [layoutState.preferences]);

  const contextValue: LayoutContextType = {
    layoutState,
    setMenuPaneWidth,
    setMenuPaneCollapsed,
    setListPaneWidth,
    setListPaneCollapsed,
    setPopPaneWidth,
    setPopPaneVisible,
    getCurrentBreakpoint,
    isResponsiveMode,
    resetToDefaults,
    savePreferences,
    loadPreferences,
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}