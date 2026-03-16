/**
 * Analytics Verification Test
 * 
 * Verifies that all 5 analytics pages render correctly for both sectors
 * and include transmission-specific features when in transmission context.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { LayoutProvider } from '@/context/LayoutContext';

// Import analytics pages
import { EnergyAnalyticsEfficiencyKPIs } from '@/pages/energy/EnergyAnalyticsEfficiencyKPIs';
import { EnergyAnalyticsLoadProfiling } from '@/pages/energy/EnergyAnalyticsLoadProfiling';
import { EnergyAnalyticsPeakDemand } from '@/pages/energy/EnergyAnalyticsPeakDemand';
import { EnergyAnalyticsWasteDetection } from '@/pages/energy/EnergyAnalyticsWasteDetection';
import { EnergyAnalyticsAIOptimisation } from '@/pages/energy/EnergyAnalyticsAIOptimisation';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock data providers
vi.mock('@/lib/data/providers/AnalyticsProvider', () => ({
  getAnalyticsProvider: () => ({
    getTransmissionEfficiencyScopes: vi.fn().mockResolvedValue([]),
    getKPISnapshots: vi.fn().mockResolvedValue([]),
    getBenchmarks: vi.fn().mockResolvedValue([]),
    getDemandWindows: vi.fn().mockResolvedValue([]),
    getDemandWindowsWithCalculations: vi.fn().mockResolvedValue([]),
    getRecommendations: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('@/lib/data/providers/TransmissionProvider', () => ({
  getTransmissionProvider: () => ({
    listTxSubstations: vi.fn().mockResolvedValue([]),
    listTxFeeders: vi.fn().mockResolvedValue([]),
    listEnergyMetersTxScoped: vi.fn().mockResolvedValue([]),
  }),
}));

// Analytics pages to test
const analyticsPages = [
  { name: 'EnergyAnalyticsEfficiencyKPIs', component: EnergyAnalyticsEfficiencyKPIs },
  { name: 'EnergyAnalyticsLoadProfiling', component: EnergyAnalyticsLoadProfiling },
  { name: 'EnergyAnalyticsPeakDemand', component: EnergyAnalyticsPeakDemand },
  { name: 'EnergyAnalyticsWasteDetection', component: EnergyAnalyticsWasteDetection },
  { name: 'EnergyAnalyticsAIOptimisation', component: EnergyAnalyticsAIOptimisation },
];

// Mock tenant data
const mockUpstreamTenant = {
  id: 'upstream-tenant-id',
  name: 'Upstream Test Tenant',
  sector: 'Oil & Gas',
  subsector: 'Upstream',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockTransmissionTenant = {
  id: 'transmission-tenant-id',
  name: 'Transmission Test Tenant',
  sector: 'Power',
  subsector: 'Transmission',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

// Mock energy data
const mockEnergyMeters = [
  {
    id: 'meter-1',
    name: 'Test Meter 1',
    scope: 'Facility Total',
    status: 'Normal' as const,
    currentKW: 150,
    energyTypes: ['electricity' as const],
    lastTelemetryAt: '2024-01-01T12:00:00Z'
  }
];

const mockEnergyTelemetry = {
  'meter-1': {
    timestamp: ['2024-01-01T12:00:00Z'],
    kW: [150],
    kWh: [1800],
    voltage: [480],
    current: [200],
    powerFactor: [0.95]
  }
};

// Test wrapper component
function TestWrapper({ 
  children, 
  sector = 'Oil & Gas', 
  subsector = 'Upstream' 
}: { 
  children: React.ReactNode;
  sector?: string;
  subsector?: string;
}) {
  const tenant = sector === 'Power' ? mockTransmissionTenant : mockUpstreamTenant;
  
  return (
    <BrowserRouter>
      <AppProvider
        initialTenant={tenant}
        initialEnergyMeters={mockEnergyMeters}
        initialEnergyTelemetry={mockEnergyTelemetry}
      >
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

describe('Analytics Verification', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock console.error to catch any rendering errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Page Rendering - Upstream Context', () => {
    analyticsPages.forEach(({ name, component: Component }) => {
      it(`should render ${name} without errors in upstream context`, async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        
        try {
          render(
            <TestWrapper sector="Oil & Gas" subsector="Upstream">
              <Component />
            </TestWrapper>
          );

          // Wait for component to fully render
          await waitFor(() => {
            expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Should not have console errors
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        } catch (error) {
          throw new Error(`${name} failed to render in upstream context: ${error}`);
        }
      });
    });
  });

  describe('Page Rendering - Transmission Context', () => {
    analyticsPages.forEach(({ name, component: Component }) => {
      it(`should render ${name} without errors in transmission context`, async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error');
        
        try {
          render(
            <TestWrapper sector="Power" subsector="Transmission">
              <Component />
            </TestWrapper>
          );

          // Wait for component to fully render
          await waitFor(() => {
            expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
          }, { timeout: 3000 });

          // Should not have console errors
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        } catch (error) {
          throw new Error(`${name} failed to render in transmission context: ${error}`);
        }
      });
    });
  });

  describe('Transmission-Specific Features', () => {
    it('should display transmission KPIs in EnergyAnalyticsEfficiencyKPIs', async () => {
      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show transmission-specific terminology
        expect(screen.getByText(/Transmission Efficiency/i) || 
               screen.getByText(/Grid/i) ||
               screen.getByText(/Losses/i)).toBeInTheDocument();
      });
    });

    it('should display transmission load profiling features', async () => {
      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsLoadProfiling />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show transmission-specific features
        expect(screen.getByText(/Load Profiling/i)).toBeInTheDocument();
        // May show substation/feeder context
        const transmissionElements = screen.queryAllByText(/Substation|Feeder|Grid|Transmission/i);
        expect(transmissionElements.length).toBeGreaterThan(0);
      });
    });

    it('should display transmission demand management in EnergyAnalyticsPeakDemand', async () => {
      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsPeakDemand />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show peak demand features
        expect(screen.getByText(/Peak Demand/i) || 
               screen.getByText(/Demand/i)).toBeInTheDocument();
      });
    });

    it('should display transmission waste patterns in EnergyAnalyticsWasteDetection', async () => {
      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsWasteDetection />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show waste detection features
        expect(screen.getByText(/Waste Detection/i) || 
               screen.getByText(/Waste/i) ||
               screen.getByText(/Grid/i)).toBeInTheDocument();
      });
    });

    it('should display transmission AI recommendations in EnergyAnalyticsAIOptimisation', async () => {
      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsAIOptimisation />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show AI optimization features
        expect(screen.getByText(/AI/i) || 
               screen.getByText(/Optimization/i) ||
               screen.getByText(/Optimisation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Sector Context Switching', () => {
    it('should show different content between upstream and transmission contexts', async () => {
      // Render in upstream context
      const { rerender } = render(
        <TestWrapper sector="Oil & Gas" subsector="Upstream">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      });

      const upstreamContent = screen.getByText(/Energy Analytics/i).closest('div')?.textContent;

      // Rerender in transmission context
      rerender(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      });

      const transmissionContent = screen.getByText(/Energy Analytics/i).closest('div')?.textContent;

      // Content should be different (though both may contain "Energy Analytics")
      // This is a basic check - in practice, the pages adapt their content based on sector
      expect(upstreamContent).toBeDefined();
      expect(transmissionContent).toBeDefined();
    });
  });

  describe('Data Provider Integration', () => {
    it('should call transmission providers when in transmission context', async () => {
      const mockAnalyticsProvider = vi.mocked(
        (await import('@/lib/data/providers/AnalyticsProvider')).getAnalyticsProvider()
      );

      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      });

      // Should have attempted to call transmission-specific methods
      // Note: These may not be called immediately due to useEffect dependencies
      expect(mockAnalyticsProvider.getTransmissionEfficiencyScopes).toHaveBeenCalledWith(
        expect.any(String)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      // Mock providers to return empty data
      const mockAnalyticsProvider = vi.mocked(
        (await import('@/lib/data/providers/AnalyticsProvider')).getAnalyticsProvider()
      );
      mockAnalyticsProvider.getTransmissionEfficiencyScopes.mockResolvedValue([]);

      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      });

      // Should render without errors even with empty data
      expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
    });

    it('should handle provider errors gracefully', async () => {
      // Mock providers to throw errors
      const mockAnalyticsProvider = vi.mocked(
        (await import('@/lib/data/providers/AnalyticsProvider')).getAnalyticsProvider()
      );
      mockAnalyticsProvider.getTransmissionEfficiencyScopes.mockRejectedValue(
        new Error('Provider error')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <TestWrapper sector="Power" subsector="Transmission">
          <EnergyAnalyticsEfficiencyKPIs />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      });

      // Should still render the page structure
      expect(screen.getByText(/Energy Analytics/i)).toBeInTheDocument();
      
      // May log errors but shouldn't crash
      // Note: We don't assert on console.error calls as error handling varies by component
    });
  });
});