import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { LayoutProvider, useLayout } from '../LayoutContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
};

// Mock window.addEventListener and removeEventListener
const mockEventListeners: { [key: string]: EventListener[] } = {};
const mockAddEventListener = vi.fn((event: string, listener: EventListener) => {
  if (!mockEventListeners[event]) {
    mockEventListeners[event] = [];
  }
  mockEventListeners[event].push(listener);
});
const mockRemoveEventListener = vi.fn((event: string, listener: EventListener) => {
  if (mockEventListeners[event]) {
    const index = mockEventListeners[event].indexOf(listener);
    if (index > -1) {
      mockEventListeners[event].splice(index, 1);
    }
  }
});

// Wrapper component for testing
const wrapper = ({ children }: { children: ReactNode }) => (
  <LayoutProvider>{children}</LayoutProvider>
);

describe('LayoutContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Setup window mocks
    Object.defineProperty(window, 'addEventListener', {
      writable: true,
      value: mockAddEventListener,
    });
    Object.defineProperty(window, 'removeEventListener', {
      writable: true,
      value: mockRemoveEventListener,
    });
    
    // Clear event listeners
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = [];
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('responsive breakpoint detection', () => {
    it('should detect mobile layout mode', () => {
      mockWindowDimensions(600, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.layoutState.layoutMode).toBe('mobile');
      expect(result.current.isResponsiveMode('mobile')).toBe(true);
    });

    it('should detect tablet layout mode', () => {
      mockWindowDimensions(900, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.layoutState.layoutMode).toBe('tablet');
      expect(result.current.isResponsiveMode('tablet')).toBe(true);
    });

    it('should detect desktop layout mode', () => {
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.layoutState.layoutMode).toBe('desktop');
      expect(result.current.isResponsiveMode('desktop')).toBe(true);
    });
  });

  describe('layout mode switching', () => {
    it('should auto-collapse list pane on mobile when preference is set', () => {
      // Start with desktop
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      // Initially not collapsed
      expect(result.current.layoutState.listPaneCollapsed).toBe(false);
      
      // Simulate resize to mobile
      act(() => {
        mockWindowDimensions(600, 800);
        // Trigger resize event
        if (mockEventListeners.resize) {
          mockEventListeners.resize.forEach(listener => {
            listener(new Event('resize'));
          });
        }
        // Fast-forward timers to handle debouncing
        vi.advanceTimersByTime(200);
      });
      
      // Should auto-collapse on mobile (default preference)
      expect(result.current.layoutState.layoutMode).toBe('mobile');
      expect(result.current.layoutState.listPaneCollapsed).toBe(true);
    });

    it('should hide pop pane on mobile', () => {
      // Start with desktop and pop pane visible
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      // Make pop pane visible
      act(() => {
        result.current.setPopPaneVisible(true);
      });
      
      expect(result.current.layoutState.popPaneVisible).toBe(true);
      
      // Simulate resize to mobile
      act(() => {
        mockWindowDimensions(600, 800);
        // Trigger resize event
        if (mockEventListeners.resize) {
          mockEventListeners.resize.forEach(listener => {
            listener(new Event('resize'));
          });
        }
        // Fast-forward timers to handle debouncing
        vi.advanceTimersByTime(200);
      });
      
      // Pop pane should be hidden on mobile
      expect(result.current.layoutState.popPaneVisible).toBe(false);
    });
  });

  describe('window resize event listeners with debouncing', () => {
    it('should add resize event listener on mount', () => {
      mockWindowDimensions(1200, 800);
      
      renderHook(() => useLayout(), { wrapper });
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove resize event listener on unmount', () => {
      mockWindowDimensions(1200, 800);
      
      const { unmount } = renderHook(() => useLayout(), { wrapper });
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('getCurrentBreakpoint utility', () => {
    it('should return correct breakpoint for mobile', () => {
      mockWindowDimensions(600, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.getCurrentBreakpoint()).toBe('mobile');
    });

    it('should return correct breakpoint for tablet', () => {
      mockWindowDimensions(900, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.getCurrentBreakpoint()).toBe('tablet');
    });

    it('should return correct breakpoint for desktop', () => {
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.getCurrentBreakpoint()).toBe('desktop');
    });
  });

  describe('preference persistence', () => {
    it('should save preferences to localStorage', () => {
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      act(() => {
        result.current.setListPaneWidth(400);
      });
      
      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'layout-preferences',
        expect.stringContaining('"listPaneWidth":400')
      );
    });

    it('should load preferences from localStorage', () => {
      const savedPreferences = {
        listPaneWidth: 400,
        popPaneWidth: 500,
        menuPaneCollapsed: true,
        autoCollapseOnMobile: false,
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPreferences));
      mockWindowDimensions(1200, 800);
      
      const { result } = renderHook(() => useLayout(), { wrapper });
      
      expect(result.current.layoutState.listPaneWidth).toBe(400);
      expect(result.current.layoutState.popPaneWidth).toBe(500);
      expect(result.current.layoutState.menuPaneCollapsed).toBe(true);
    });
  });
});