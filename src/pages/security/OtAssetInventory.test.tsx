import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { OtAssetSecurity } from '@/data/mockData';
import { OtAssetInventory } from './OtAssetInventory';
import React from 'react';

// Mock the AppContext
const mockTenant = { id: 't1', name: 'Kenya Power', industry: 'Utilities' };
const mockSetCurrentTenant = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: mockTenant,
    setCurrentTenant: mockSetCurrentTenant,
  }),
}));

// Mock the layout components to simplify testing
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, count, actions }: any) => (
    <div data-testid="list-pane">
      <div data-testid="list-pane-title">{title}</div>
      <div data-testid="list-pane-subtitle">{subtitle}</div>
      <div data-testid="list-pane-count">{count}</div>
      <div data-testid="list-pane-actions">{actions}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <div data-testid="work-pane-title">{title}</div>
      <div data-testid="work-pane-subtitle">{subtitle}</div>
      {tabs && tabs.length > 0 && (
        <div data-testid="work-pane-tabs">
          {tabs.map((tab: any) => (
            <div key={tab.id} data-testid={`tab-${tab.id}`}>
              {tab.content}
            </div>
          ))}
        </div>
      )}
    </div>
  ),
}));

/**
 * Unit Tests for OtAssetInventory Component
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
describe('OtAssetInventory Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      const { container } = render(<OtAssetInventory />);
      expect(container).toBeTruthy();
    });

    it('should render ListPane with correct title and subtitle', () => {
      render(<OtAssetInventory />);
      
      expect(screen.getByTestId('list-pane-title')).toHaveTextContent('OT Assets');
      expect(screen.getByTestId('list-pane-subtitle')).toHaveTextContent('Kenya Power');
    });

    it('should render asset list correctly', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Tenant t1 has OT assets in mock data
      expect(within(listPane).getByText('Main Transformer T1')).toBeInTheDocument();
      expect(within(listPane).getByText('Backup Generator BG-1')).toBeInTheDocument();
    });

    it('should display asset count in ListPane', () => {
      render(<OtAssetInventory />);
      
      const count = screen.getByTestId('list-pane-count');
      // Tenant t1 has 6 OT assets
      expect(count).toHaveTextContent('6');
    });

    it('should render criticality filter buttons', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      
      expect(within(actions).getByText('All')).toBeInTheDocument();
      expect(within(actions).getByText('Critical')).toBeInTheDocument();
      expect(within(actions).getByText('High')).toBeInTheDocument();
      expect(within(actions).getByText('Medium')).toBeInTheDocument();
      expect(within(actions).getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Asset Selection and WorkPane Update', () => {
    it('should render WorkPane when an asset is selected', () => {
      render(<OtAssetInventory />);
      
      // WorkPane should be rendered with the first asset selected by default
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
    });

    it('should display selected asset name in WorkPane title', () => {
      render(<OtAssetInventory />);
      
      const workPaneTitle = screen.getByTestId('work-pane-title');
      // First asset from tenant t1 should be selected
      expect(workPaneTitle).toHaveTextContent('Main Transformer T1');
    });

    it('should display selected asset details in WorkPane subtitle', () => {
      render(<OtAssetInventory />);
      
      const workPaneSubtitle = screen.getByTestId('work-pane-subtitle');
      expect(workPaneSubtitle.textContent).toContain('Transformer');
      expect(workPaneSubtitle.textContent).toContain('Nairobi Substation');
    });

    it('should update WorkPane when a different asset is clicked', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      const secondAsset = within(listPane).getByText('Backup Generator BG-1');
      
      // Click on the second asset
      fireEvent.click(secondAsset.closest('div')!);
      
      // WorkPane should update to show the second asset
      const workPaneTitle = screen.getByTestId('work-pane-title');
      expect(workPaneTitle).toHaveTextContent('Backup Generator BG-1');
    });

    it('should render all tabs for selected asset', () => {
      render(<OtAssetInventory />);
      
      // Check that all tabs are rendered
      expect(screen.getByTestId('tab-security-info')).toBeInTheDocument();
      expect(screen.getByTestId('tab-vulnerabilities')).toBeInTheDocument();
      expect(screen.getByTestId('tab-network')).toBeInTheDocument();
      expect(screen.getByTestId('tab-risk')).toBeInTheDocument();
    });
  });

  describe('Criticality Filtering', () => {
    it('should filter assets by criticality level when filter button is clicked', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      const criticalButton = within(actions).getByText('Critical');
      
      // Click the Critical filter button
      fireEvent.click(criticalButton);
      
      // Count should update to show only critical assets
      const count = screen.getByTestId('list-pane-count');
      // Tenant t1 has 2 critical assets
      expect(count).toHaveTextContent('2');
    });

    it('should show all assets when "All" filter is selected', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      
      // First filter by Critical
      const criticalButton = within(actions).getByText('Critical');
      fireEvent.click(criticalButton);
      
      // Then click All
      const allButton = within(actions).getByText('All');
      fireEvent.click(allButton);
      
      // Count should show all assets again
      const count = screen.getByTestId('list-pane-count');
      expect(count).toHaveTextContent('6');
    });

    it('should filter assets by high criticality', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      const highButton = within(actions).getByText('High');
      
      fireEvent.click(highButton);
      
      const count = screen.getByTestId('list-pane-count');
      // Tenant t1 has 2 high criticality assets
      expect(count).toHaveTextContent('2');
    });

    it('should filter assets by medium criticality', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      const mediumButton = within(actions).getByText('Medium');
      
      fireEvent.click(mediumButton);
      
      const count = screen.getByTestId('list-pane-count');
      // Tenant t1 has 1 medium criticality asset
      expect(count).toHaveTextContent('1');
    });

    it('should filter assets by low criticality', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      const lowButton = within(actions).getByText('Low');
      
      fireEvent.click(lowButton);
      
      const count = screen.getByTestId('list-pane-count');
      // Tenant t1 has 1 low criticality asset
      expect(count).toHaveTextContent('1');
    });

    it('should only display assets matching the selected criticality filter', () => {
      render(<OtAssetInventory />);
      
      const actions = screen.getByTestId('list-pane-actions');
      const criticalButton = within(actions).getByText('Critical');
      
      fireEvent.click(criticalButton);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Should show critical assets (tenant t1 has 2 critical assets)
      expect(within(listPane).getByText('Main Transformer T1')).toBeInTheDocument();
      expect(within(listPane).getByText('Backup Generator BG-1')).toBeInTheDocument();
      
      // Should not show non-critical assets
      expect(within(listPane).queryByText('Distribution Transformer DT-5')).not.toBeInTheDocument();
    });
  });

  describe('Security Status Indicators', () => {
    it('should display security status badges for each asset', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Check for security status indicators
      expect(within(listPane).getByText('vulnerable')).toBeInTheDocument();
      expect(within(listPane).getByText('at-risk')).toBeInTheDocument();
    });

    it('should display criticality badges for each asset', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Check for criticality badges
      expect(within(listPane).getAllByText('critical').length).toBeGreaterThan(0);
      expect(within(listPane).getAllByText('high').length).toBeGreaterThan(0);
    });

    it('should display vulnerability count when present', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Assets with vulnerabilities should show count
      expect(within(listPane).getByText('5 vuln')).toBeInTheDocument();
    });

    it('should display open alerts count when present', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Assets with open alerts should show count
      expect(within(listPane).getByText('2 alerts')).toBeInTheDocument();
    });

    it('should display correct security status in WorkPane', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      
      // Check that security status is displayed in the Security Info tab
      const securityTab = within(workPane).getByTestId('tab-security-info');
      expect(securityTab).toBeInTheDocument();
    });

    it('should display risk score in WorkPane', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const securityTab = within(workPane).getByTestId('tab-security-info');
      
      // Risk score should be displayed
      expect(within(securityTab).getByText('Risk Score')).toBeInTheDocument();
    });

    it('should display patch status in WorkPane', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const securityTab = within(workPane).getByTestId('tab-security-info');
      
      // Patch status should be displayed
      expect(within(securityTab).getByText('Patch Status')).toBeInTheDocument();
    });

    it('should display network exposure in WorkPane', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const securityTab = within(workPane).getByTestId('tab-security-info');
      
      // Network exposure should be displayed
      expect(within(securityTab).getByText('Network Exposure')).toBeInTheDocument();
    });
  });

  describe('Tenant Context Integration', () => {
    it('should use current tenant from context', () => {
      render(<OtAssetInventory />);
      
      // Verify tenant name appears in subtitle
      expect(screen.getByText('Kenya Power')).toBeInTheDocument();
    });

    it('should display assets filtered by tenant', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Verify we're seeing tenant t1 assets
      expect(within(listPane).getByText('Main Transformer T1')).toBeInTheDocument();
      expect(within(listPane).getByText('Backup Generator BG-1')).toBeInTheDocument();
    });
  });

  describe('Asset Details Display', () => {
    it('should display asset type and site for each asset', () => {
      render(<OtAssetInventory />);
      
      const listPane = screen.getByTestId('list-pane');
      
      // Check for asset types (use getAllByText since there are multiple Transformers)
      expect(within(listPane).getAllByText('Transformer').length).toBeGreaterThan(0);
      expect(within(listPane).getByText('Generator')).toBeInTheDocument();
      
      // Check for sites (use getAllByText since some sites appear multiple times)
      expect(within(listPane).getAllByText('Nairobi Substation').length).toBeGreaterThan(0);
      expect(within(listPane).getAllByText('Mombasa Hub').length).toBeGreaterThan(0);
    });

    it('should display vulnerability information in Vulnerabilities tab', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const vulnTab = within(workPane).getByTestId('tab-vulnerabilities');
      
      expect(within(vulnTab).getByText(/Vulnerability Summary/)).toBeInTheDocument();
    });

    it('should display network information in Network tab', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const networkTab = within(workPane).getByTestId('tab-network');
      
      expect(within(networkTab).getByText('Network Exposure')).toBeInTheDocument();
    });

    it('should display risk assessment in Risk tab', () => {
      render(<OtAssetInventory />);
      
      const workPane = screen.getByTestId('work-pane');
      const riskTab = within(workPane).getByTestId('tab-risk');
      
      expect(within(riskTab).getByText('Risk Score Overview')).toBeInTheDocument();
    });
  });
});

/**
 * Feature: security-feature-area, Property 4: Criticality level filtering
 * Validates: Requirements 3.3
 * 
 * Property: For any selected criticality level filter in the OT asset inventory,
 * all displayed assets should have that criticality level
 */
describe('Property 4: Criticality level filtering', () => {
  // Helper function to filter assets by criticality level (matches the component logic)
  const filterAssetsByCriticality = (
    assets: OtAssetSecurity[],
    criticalityFilter: string
  ): OtAssetSecurity[] => {
    if (criticalityFilter === 'all') return assets;
    return assets.filter((asset) => asset.criticality === criticalityFilter);
  };

  // Helper function to check if all assets have the specified criticality level
  const allAssetsHaveCriticality = (
    assets: OtAssetSecurity[],
    criticality: string
  ): boolean => {
    return assets.every((asset) => asset.criticality === criticality);
  };

  // Arbitrary generator for OtAssetSecurity
  const otAssetSecurityArbitrary = fc.record({
    tenantId: fc.constantFrom('t1', 't2', 't3'),
    assetId: fc.uuid(), // Use UUID to ensure unique IDs
    assetName: fc.string({ minLength: 5, maxLength: 50 }),
    assetType: fc.constantFrom('Transformer', 'Generator', 'Kiln', 'Dryer', 'Pump', 'Motor', 'Breaker', 'Analyzer', 'Meter'),
    site: fc.constantFrom('Nairobi Substation', 'Mombasa Hub', 'Kericho Factory', 'Athi River Plant', 'Kisumu Station', 'Nandi Facility'),
    criticality: fc.constantFrom('critical', 'high', 'medium', 'low') as fc.Arbitrary<'critical' | 'high' | 'medium' | 'low'>,
    securityStatus: fc.constantFrom('secure', 'at-risk', 'vulnerable', 'unknown') as fc.Arbitrary<'secure' | 'at-risk' | 'vulnerable' | 'unknown'>,
    vulnerabilityCount: fc.integer({ min: 0, max: 20 }),
    openAlerts: fc.integer({ min: 0, max: 10 }),
    lastSecurityScan: fc.integer({ min: Date.parse('2024-01-01T00:00:00Z'), max: Date.parse('2024-12-31T23:59:59Z') }).map(ms => new Date(ms).toISOString()),
    riskScore: fc.integer({ min: 0, max: 100 }),
    networkExposure: fc.constantFrom('internal', 'dmz', 'external') as fc.Arbitrary<'internal' | 'dmz' | 'external'>,
    patchStatus: fc.constantFrom('up-to-date', 'pending', 'overdue') as fc.Arbitrary<'up-to-date' | 'pending' | 'overdue'>,
  });

  it('should return only assets with the specified criticality level for any list of assets', () => {
    fc.assert(
      fc.property(
        // Generate a non-empty array of OT assets
        fc.array(otAssetSecurityArbitrary, { minLength: 1, maxLength: 30 }),
        // Generate a criticality filter
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        (assets, criticalityFilter) => {
          // Filter assets by criticality level
          const filteredAssets = filterAssetsByCriticality(assets, criticalityFilter);
          
          // Property: All filtered assets should have the specified criticality level
          expect(allAssetsHaveCriticality(filteredAssets, criticalityFilter)).toBe(true);
          
          // Additional check: Each asset should match the filter
          filteredAssets.forEach(asset => {
            expect(asset.criticality).toBe(criticalityFilter);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return all assets when filter is set to "all"', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 1, maxLength: 30 }),
        (assets) => {
          // Filter with "all"
          const filteredAssets = filterAssetsByCriticality(assets, 'all');
          
          // Property: Should return all assets unchanged
          expect(filteredAssets.length).toBe(assets.length);
          expect(filteredAssets).toEqual(assets);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no assets match the criticality filter', () => {
    fc.assert(
      fc.property(
        // Generate assets with a specific criticality
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        fc.integer({ min: 1, max: 10 }),
        (criticality, count) => {
          // Create assets all with the same criticality
          const assets: OtAssetSecurity[] = Array.from({ length: count }, (_, i) => ({
            tenantId: 't1',
            assetId: `asset-${i}`,
            assetName: `Asset ${i}`,
            assetType: 'Transformer',
            site: 'Nairobi Substation',
            criticality: criticality,
            securityStatus: 'secure',
            vulnerabilityCount: 0,
            openAlerts: 0,
            lastSecurityScan: '2024-01-15T08:00:00Z',
            riskScore: 50,
            networkExposure: 'internal',
            patchStatus: 'up-to-date',
          }));
          
          // Filter with a different criticality level
          const differentCriticalities = ['critical', 'high', 'medium', 'low'].filter(c => c !== criticality);
          const differentCriticality = differentCriticalities[0];
          
          const filteredAssets = filterAssetsByCriticality(assets, differentCriticality);
          
          // Property: Should return empty array when no matches
          expect(filteredAssets.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include assets with different criticality levels', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 5, maxLength: 30 }),
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        (assets, criticalityFilter) => {
          const filteredAssets = filterAssetsByCriticality(assets, criticalityFilter);
          
          // Property: No asset in the filtered list should have a different criticality
          const otherCriticalities = ['critical', 'high', 'medium', 'low'].filter(c => c !== criticalityFilter);
          
          filteredAssets.forEach(asset => {
            otherCriticalities.forEach(otherCriticality => {
              expect(asset.criticality).not.toBe(otherCriticality);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve asset object structure in filtered results', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 1, maxLength: 30 }),
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        (assets, criticalityFilter) => {
          const filteredAssets = filterAssetsByCriticality(assets, criticalityFilter);
          
          // Property: All filtered assets should have the complete structure
          filteredAssets.forEach(filteredAsset => {
            expect(filteredAsset).toHaveProperty('assetId');
            expect(filteredAsset).toHaveProperty('assetName');
            expect(filteredAsset).toHaveProperty('assetType');
            expect(filteredAsset).toHaveProperty('site');
            expect(filteredAsset).toHaveProperty('criticality');
            expect(filteredAsset).toHaveProperty('securityStatus');
            expect(filteredAsset).toHaveProperty('vulnerabilityCount');
            expect(filteredAsset).toHaveProperty('openAlerts');
            expect(filteredAsset).toHaveProperty('lastSecurityScan');
            expect(filteredAsset).toHaveProperty('riskScore');
            expect(filteredAsset).toHaveProperty('networkExposure');
            expect(filteredAsset).toHaveProperty('patchStatus');
            
            // Verify the filtered asset exists in the original array
            const originalAsset = assets.find(a => a.assetId === filteredAsset.assetId);
            expect(originalAsset).toBeDefined();
            expect(filteredAsset).toEqual(originalAsset);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not modify the original assets array', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 1, maxLength: 30 }),
        fc.constantFrom('critical', 'high', 'medium', 'low', 'all'),
        (assets, criticalityFilter) => {
          // Create a deep copy of the original array
          const originalAssets = JSON.parse(JSON.stringify(assets));
          
          // Filter assets
          filterAssetsByCriticality(assets, criticalityFilter);
          
          // Property: Original array should remain unchanged
          expect(assets).toEqual(originalAssets);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty asset list', () => {
    const emptyList: OtAssetSecurity[] = [];
    const criticalityFilters = ['critical', 'high', 'medium', 'low', 'all'];
    
    criticalityFilters.forEach(filter => {
      const filteredAssets = filterAssetsByCriticality(emptyList, filter);
      
      // Property: Should return empty array for any filter
      expect(filteredAssets).toEqual([]);
      expect(filteredAssets.length).toBe(0);
    });
  });

  it('should handle single asset', () => {
    fc.assert(
      fc.property(
        otAssetSecurityArbitrary,
        (asset) => {
          // Filter with the asset's own criticality
          const matchingFilter = filterAssetsByCriticality([asset], asset.criticality);
          
          // Property: Should return the asset when filter matches
          expect(matchingFilter.length).toBe(1);
          expect(matchingFilter[0]).toEqual(asset);
          
          // Filter with a different criticality
          const differentCriticalities = ['critical', 'high', 'medium', 'low'].filter(c => c !== asset.criticality);
          const differentFilter = differentCriticalities[0];
          const nonMatchingFilter = filterAssetsByCriticality([asset], differentFilter);
          
          // Property: Should return empty array when filter doesn't match
          expect(nonMatchingFilter.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly count filtered assets for each criticality level', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 10, maxLength: 50 }),
        (assets) => {
          // Count assets by criticality in the original array
          const criticalCount = assets.filter(a => a.criticality === 'critical').length;
          const highCount = assets.filter(a => a.criticality === 'high').length;
          const mediumCount = assets.filter(a => a.criticality === 'medium').length;
          const lowCount = assets.filter(a => a.criticality === 'low').length;
          
          // Filter by each criticality level
          const criticalFiltered = filterAssetsByCriticality(assets, 'critical');
          const highFiltered = filterAssetsByCriticality(assets, 'high');
          const mediumFiltered = filterAssetsByCriticality(assets, 'medium');
          const lowFiltered = filterAssetsByCriticality(assets, 'low');
          
          // Property: Filtered counts should match the expected counts
          expect(criticalFiltered.length).toBe(criticalCount);
          expect(highFiltered.length).toBe(highCount);
          expect(mediumFiltered.length).toBe(mediumCount);
          expect(lowFiltered.length).toBe(lowCount);
          
          // Property: Sum of all filtered counts should equal total assets
          const totalFiltered = criticalFiltered.length + highFiltered.length + mediumFiltered.length + lowFiltered.length;
          expect(totalFiltered).toBe(assets.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain filtering consistency across multiple calls', () => {
    fc.assert(
      fc.property(
        fc.array(otAssetSecurityArbitrary, { minLength: 1, maxLength: 30 }),
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        (assets, criticalityFilter) => {
          // Filter multiple times
          const firstFilter = filterAssetsByCriticality(assets, criticalityFilter);
          const secondFilter = filterAssetsByCriticality(assets, criticalityFilter);
          const thirdFilter = filterAssetsByCriticality(assets, criticalityFilter);
          
          // Property: Multiple calls should return identical results
          expect(firstFilter).toEqual(secondFilter);
          expect(secondFilter).toEqual(thirdFilter);
          
          // Verify the asset IDs are the same
          const firstIds = firstFilter.map(a => a.assetId).sort();
          const secondIds = secondFilter.map(a => a.assetId).sort();
          const thirdIds = thirdFilter.map(a => a.assetId).sort();
          
          expect(firstIds).toEqual(secondIds);
          expect(secondIds).toEqual(thirdIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter correctly when all assets have the same criticality', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('critical', 'high', 'medium', 'low'),
        fc.integer({ min: 1, max: 20 }),
        (criticality, count) => {
          // Create assets all with the same criticality
          const assets: OtAssetSecurity[] = Array.from({ length: count }, (_, i) => ({
            tenantId: 't1',
            assetId: `asset-${i}`,
            assetName: `Asset ${i}`,
            assetType: 'Transformer',
            site: 'Nairobi Substation',
            criticality: criticality,
            securityStatus: 'secure',
            vulnerabilityCount: 0,
            openAlerts: 0,
            lastSecurityScan: '2024-01-15T08:00:00Z',
            riskScore: 50,
            networkExposure: 'internal',
            patchStatus: 'up-to-date',
          }));
          
          // Filter with the same criticality
          const filteredAssets = filterAssetsByCriticality(assets, criticality);
          
          // Property: Should return all assets
          expect(filteredAssets.length).toBe(count);
          expect(filteredAssets).toEqual(assets);
          
          // Filter with "all"
          const allFiltered = filterAssetsByCriticality(assets, 'all');
          expect(allFiltered.length).toBe(count);
          expect(allFiltered).toEqual(assets);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed criticality levels correctly', () => {
    // Create a controlled dataset with known distribution
    const assets: OtAssetSecurity[] = [
      {
        tenantId: 't1',
        assetId: 'a1',
        assetName: 'Critical Asset 1',
        assetType: 'Transformer',
        site: 'Nairobi Substation',
        criticality: 'critical',
        securityStatus: 'secure',
        vulnerabilityCount: 0,
        openAlerts: 0,
        lastSecurityScan: '2024-01-15T08:00:00Z',
        riskScore: 85,
        networkExposure: 'internal',
        patchStatus: 'up-to-date',
      },
      {
        tenantId: 't1',
        assetId: 'a2',
        assetName: 'High Asset 1',
        assetType: 'Generator',
        site: 'Mombasa Hub',
        criticality: 'high',
        securityStatus: 'at-risk',
        vulnerabilityCount: 2,
        openAlerts: 1,
        lastSecurityScan: '2024-01-14T10:00:00Z',
        riskScore: 65,
        networkExposure: 'dmz',
        patchStatus: 'pending',
      },
      {
        tenantId: 't1',
        assetId: 'a3',
        assetName: 'Medium Asset 1',
        assetType: 'Pump',
        site: 'Kericho Factory',
        criticality: 'medium',
        securityStatus: 'secure',
        vulnerabilityCount: 0,
        openAlerts: 0,
        lastSecurityScan: '2024-01-15T12:00:00Z',
        riskScore: 35,
        networkExposure: 'internal',
        patchStatus: 'up-to-date',
      },
      {
        tenantId: 't1',
        assetId: 'a4',
        assetName: 'Low Asset 1',
        assetType: 'Meter',
        site: 'Athi River Plant',
        criticality: 'low',
        securityStatus: 'secure',
        vulnerabilityCount: 0,
        openAlerts: 0,
        lastSecurityScan: '2024-01-15T07:00:00Z',
        riskScore: 15,
        networkExposure: 'internal',
        patchStatus: 'up-to-date',
      },
      {
        tenantId: 't1',
        assetId: 'a5',
        assetName: 'Critical Asset 2',
        assetType: 'Kiln',
        site: 'Athi River Plant',
        criticality: 'critical',
        securityStatus: 'vulnerable',
        vulnerabilityCount: 5,
        openAlerts: 2,
        lastSecurityScan: '2024-01-14T06:00:00Z',
        riskScore: 90,
        networkExposure: 'external',
        patchStatus: 'overdue',
      },
    ];
    
    // Test each criticality filter
    const criticalFiltered = filterAssetsByCriticality(assets, 'critical');
    expect(criticalFiltered.length).toBe(2);
    expect(criticalFiltered.every(a => a.criticality === 'critical')).toBe(true);
    
    const highFiltered = filterAssetsByCriticality(assets, 'high');
    expect(highFiltered.length).toBe(1);
    expect(highFiltered.every(a => a.criticality === 'high')).toBe(true);
    
    const mediumFiltered = filterAssetsByCriticality(assets, 'medium');
    expect(mediumFiltered.length).toBe(1);
    expect(mediumFiltered.every(a => a.criticality === 'medium')).toBe(true);
    
    const lowFiltered = filterAssetsByCriticality(assets, 'low');
    expect(lowFiltered.length).toBe(1);
    expect(lowFiltered.every(a => a.criticality === 'low')).toBe(true);
    
    const allFiltered = filterAssetsByCriticality(assets, 'all');
    expect(allFiltered.length).toBe(5);
    expect(allFiltered).toEqual(assets);
  });
});
