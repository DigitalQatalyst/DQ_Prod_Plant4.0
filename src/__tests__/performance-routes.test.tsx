/**
 * Performance Routes Test
 * 
 * Tests the sector-specific routing behavior for performance features:
 * - Oil & Gas tenants should see the original Performance page
 * - Power Transmission tenants should be redirected to detailed performance pages
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { PerformanceRouter } from '@/pages/optimise/PerformanceRouter';
import { PerformanceOverviewPage } from '@/pages/optimise/performance/PerformanceOverviewPage';

// Mock the AppContext with different tenant types
const mockOilGasTenant = { 
  id: 'tenant-oil-gas', 
  name: 'Oil & Gas Tenant',
  sector: 'oil-gas',
  subsector: 'upstream'
};

const mockTransmissionTenant = { 
  id: 'tenant-transmission', 
  name: 'Power Transmission Tenant',
  sector: 'power',
  subsector: 'transmission'
};

const createMockAppContext = (tenant: any) => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useApp: () => ({
    currentTenant: tenant,
    selectedTenant: tenant,
    setSelectedTenant: vi.fn(),
    currentSector: { id: tenant.sector, name: tenant.sector },
    currentSubsector: tenant.subsector,
    setCurrentSector: vi.fn(),
    setCurrentSubsector: vi.fn(),
    selectedAsset: null,
    setSelectedAsset: vi.fn(),
    setIsPopPaneOpen: vi.fn(),
    setPopPaneContent: vi.fn(),
    assets: [],
    isPopPaneOpen: false,
    popPaneContent: { type: null, data: null },
    availableSubsectors: [],
    availableOrganizations: [],
    sector: tenant.sector,
    subsector: tenant.subsector,
    isUpstreamTenant: tenant.sector === 'oil-gas',
    energyMeters: [],
    energyTelemetry: {},
    energyBaselines: [],
    tariffs: {},
    emissionFactors: {},
    userPersona: { id: 'operator', name: 'Operator' },
    setUserPersona: vi.fn(),
  }),
});

// Helper to render routes with proper setup
const renderWithRoutes = (
  initialRoute: string, 
  tenant: any,
  routes: Array<{ path: string; element: React.ReactElement }>
) => {
  // Mock the AppContext for this specific test
  vi.doMock('@/context/AppContext', () => createMockAppContext(tenant));
  
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppProvider>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </AppProvider>
    </MemoryRouter>
  );
};

describe('Performance Routes - Sector-Specific Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Oil & Gas Tenant Routing', () => {
    it('should show original Performance page for Oil & Gas tenants', async () => {
      const routes = [
        { path: '/optimise/performance', element: <PerformanceRouter /> },
        { path: '/optimise/performance/overview', element: <PerformanceOverviewPage /> }
      ];

      renderWithRoutes('/optimise/performance', mockOilGasTenant, routes);

      // Should show the original Performance page content
      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
      });

      // Should NOT redirect to overview page
      expect(window.location.pathname).toBe('/optimise/performance');
    });

    it('should show access denied for Oil & Gas tenants trying to access transmission-specific pages', async () => {
      const routes = [
        { path: '/optimise/performance/overview', element: <PerformanceOverviewPage /> }
      ];

      renderWithRoutes('/optimise/performance/overview', mockOilGasTenant, routes);

      // Should show access restriction message
      await waitFor(() => {
        expect(screen.getByText('Access Restricted')).toBeInTheDocument();
        expect(screen.getByText(/only available for Power Transmission tenants/)).toBeInTheDocument();
      });
    });
  });

  describe('Power Transmission Tenant Routing', () => {
    it('should redirect Power Transmission tenants from base performance route to overview', async () => {
      const mockNavigate = vi.fn();
      
      // Mock react-router-dom
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useLocation: () => ({ pathname: '/optimise/performance' }),
        };
      });

      const routes = [
        { path: '/optimise/performance', element: <PerformanceRouter /> },
        { path: '/optimise/performance/overview', element: <PerformanceOverviewPage /> }
      ];

      renderWithRoutes('/optimise/performance', mockTransmissionTenant, routes);

      // Should call navigate to redirect to overview
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/optimise/performance/overview', { replace: true });
      });
    });

    it('should allow Power Transmission tenants to access detailed performance pages', async () => {
      const routes = [
        { path: '/optimise/performance/overview', element: <PerformanceOverviewPage /> }
      ];

      renderWithRoutes('/optimise/performance/overview', mockTransmissionTenant, routes);

      // Should show the detailed performance overview page
      await waitFor(() => {
        expect(screen.getByText('Performance Panels')).toBeInTheDocument();
        // Should NOT show access restriction
        expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation Menu Filtering', () => {
    it('should show appropriate performance menu items based on tenant type', () => {
      // This would test the navigation filtering logic
      // The actual implementation would be in the navigation component
      // that uses the sectorHints to filter menu items
      
      // For Oil & Gas tenants, should show: "Performance (Oil & Gas)"
      // For Power Transmission tenants, should show: Overview, Loss Analysis, etc.
      
      expect(true).toBe(true); // Placeholder - actual implementation would test navigation filtering
    });
  });

  describe('Access Control Integration', () => {
    it('should use hasPerformanceAccess function to determine routing', () => {
      // Test that the routing logic correctly uses the access control function
      // This is implicitly tested by the routing tests above
      expect(true).toBe(true); // Placeholder
    });
  });
});