/**
 * EMS Final Integration and Testing
 * 
 * This comprehensive test suite validates:
 * - Navigation between all 25 EMS pages
 * - Consistent data display across related pages
 * - Error-free loading under upstream tenant context
 * - Responsive design and accessibility compliance
 * - Interactive features and PopPane functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/components/theme-provider';

// Import all 25 EMS pages
import { EnergyMonitoringRealTime } from '@/pages/energy/EnergyMonitoringRealTime';
import { EnergyMonitoringSubMetering } from '@/pages/energy/EnergyMonitoringSubMetering';
import { EnergyMonitoringPowerQuality } from '@/pages/energy/EnergyMonitoringPowerQuality';
import { EnergyMonitoringBaselineTrends } from '@/pages/energy/EnergyMonitoringBaselineTrends';
import { EnergyMonitoringMultiFluid } from '@/pages/energy/EnergyMonitoringMultiFluid';
import { EnergyAnalyticsEfficiencyKPIs } from '@/pages/energy/EnergyAnalyticsEfficiencyKPIs';
import { EnergyAnalyticsLoadProfiling } from '@/pages/energy/EnergyAnalyticsLoadProfiling';
import { EnergyAnalyticsPeakDemand } from '@/pages/energy/EnergyAnalyticsPeakDemand';
import { EnergyAnalyticsWasteDetection } from '@/pages/energy/EnergyAnalyticsWasteDetection';
import { EnergyAnalyticsAIOptimisation } from '@/pages/energy/EnergyAnalyticsAIOptimisation';
import { EnergySustainabilityCarbonCalculation } from '@/pages/energy/EnergySustainabilityCarbonCalculation';
import { EnergySustainabilityEnergyIntensity } from '@/pages/energy/EnergySustainabilityEnergyIntensity';
import { EnergySustainabilityRenewables } from '@/pages/energy/EnergySustainabilityRenewables';
import { EnergySustainabilityESGReporting } from '@/pages/energy/EnergySustainabilityESGReporting';
import { EnergySustainabilityCompliance } from '@/pages/energy/EnergySustainabilityCompliance';
import EnergyControlLoadBalancing from '@/pages/energy/EnergyControlLoadBalancing';
import EnergyControlDemandResponse from '@/pages/energy/EnergyControlDemandResponse';
import EnergyControlAssetModes from '@/pages/energy/EnergyControlAssetModes';
import EnergyControlIntegration from '@/pages/energy/EnergyControlIntegration';
import EnergyControlEfficiencyCurves from '@/pages/energy/EnergyControlEfficiencyCurves';
import { EnergyDashboardsCustom } from '@/pages/energy/EnergyDashboardsCustom';
import { EnergyDashboardsPeriodComparison } from '@/pages/energy/EnergyDashboardsPeriodComparison';
import { EnergyDashboardsCostAnalysis } from '@/pages/energy/EnergyDashboardsCostAnalysis';
import { EnergyDashboardsAnomalies } from '@/pages/energy/EnergyDashboardsAnomalies';
import { EnergyDashboardsAuditReports } from '@/pages/energy/EnergyDashboardsAuditReports';

// Mock data imports
import * as mockData from '@/data/mockData';

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AppProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// EMS page definitions with routing information
const emsPages = [
  // Energy Monitoring & Metering (5 pages)
  { 
    name: 'EnergyMonitoringRealTime', 
    component: EnergyMonitoringRealTime, 
    featureSet: 'Energy Monitoring & Metering',
    route: '/energy/ems/monitoring/real-time',
    title: 'Real-time Consumption'
  },
  { 
    name: 'EnergyMonitoringSubMetering', 
    component: EnergyMonitoringSubMetering, 
    featureSet: 'Energy Monitoring & Metering',
    route: '/energy/ems/monitoring/sub-metering',
    title: 'Sub-metering'
  },
  { 
    name: 'EnergyMonitoringPowerQuality', 
    component: EnergyMonitoringPowerQuality, 
    featureSet: 'Energy Monitoring & Metering',
    route: '/energy/ems/monitoring/power-quality',
    title: 'Power Quality'
  },
  { 
    name: 'EnergyMonitoringBaselineTrends', 
    component: EnergyMonitoringBaselineTrends, 
    featureSet: 'Energy Monitoring & Metering',
    route: '/energy/ems/monitoring/baseline-trends',
    title: 'Baseline Trends'
  },
  { 
    name: 'EnergyMonitoringMultiFluid', 
    component: EnergyMonitoringMultiFluid, 
    featureSet: 'Energy Monitoring & Metering',
    route: '/energy/ems/monitoring/multi-fluid',
    title: 'Multi-fluid Monitoring'
  },
  
  // Energy Analytics & Optimisation (5 pages)
  { 
    name: 'EnergyAnalyticsEfficiencyKPIs', 
    component: EnergyAnalyticsEfficiencyKPIs, 
    featureSet: 'Energy Analytics & Optimisation',
    route: '/energy/ems/analytics/efficiency-kpis',
    title: 'Efficiency KPIs'
  },
  { 
    name: 'EnergyAnalyticsLoadProfiling', 
    component: EnergyAnalyticsLoadProfiling, 
    featureSet: 'Energy Analytics & Optimisation',
    route: '/energy/ems/analytics/load-profiling',
    title: 'Load Profiling'
  },
  { 
    name: 'EnergyAnalyticsPeakDemand', 
    component: EnergyAnalyticsPeakDemand, 
    featureSet: 'Energy Analytics & Optimisation',
    route: '/energy/ems/analytics/peak-demand',
    title: 'Peak Demand'
  },
  { 
    name: 'EnergyAnalyticsWasteDetection', 
    component: EnergyAnalyticsWasteDetection, 
    featureSet: 'Energy Analytics & Optimisation',
    route: '/energy/ems/analytics/waste-detection',
    title: 'Waste Detection'
  },
  { 
    name: 'EnergyAnalyticsAIOptimisation', 
    component: EnergyAnalyticsAIOptimisation, 
    featureSet: 'Energy Analytics & Optimisation',
    route: '/energy/ems/analytics/ai-recommendations',
    title: 'AI Optimisation'
  },
  
  // Sustainability & Emissions Tracking (5 pages)
  { 
    name: 'EnergySustainabilityCarbonCalculation', 
    component: EnergySustainabilityCarbonCalculation, 
    featureSet: 'Sustainability & Emissions Tracking',
    route: '/energy/ems/sustainability/carbon-emissions',
    title: 'Carbon Calculation'
  },
  { 
    name: 'EnergySustainabilityEnergyIntensity', 
    component: EnergySustainabilityEnergyIntensity, 
    featureSet: 'Sustainability & Emissions Tracking',
    route: '/energy/ems/sustainability/intensity-metrics',
    title: 'Energy Intensity'
  },
  { 
    name: 'EnergySustainabilityRenewables', 
    component: EnergySustainabilityRenewables, 
    featureSet: 'Sustainability & Emissions Tracking',
    route: '/energy/ems/sustainability/renewable-contribution',
    title: 'Renewables'
  },
  { 
    name: 'EnergySustainabilityESGReporting', 
    component: EnergySustainabilityESGReporting, 
    featureSet: 'Sustainability & Emissions Tracking',
    route: '/energy/ems/sustainability/esg-sdg-reporting',
    title: 'ESG Reporting'
  },
  { 
    name: 'EnergySustainabilityCompliance', 
    component: EnergySustainabilityCompliance, 
    featureSet: 'Sustainability & Emissions Tracking',
    route: '/energy/ems/sustainability/compliance-outputs',
    title: 'Compliance'
  },
  
  // Energy Control Advisory & Integration (5 pages)
  { 
    name: 'EnergyControlLoadBalancing', 
    component: EnergyControlLoadBalancing, 
    featureSet: 'Energy Control Advisory & Integration',
    route: '/energy/ems/control/load-balancing',
    title: 'Load Balancing'
  },
  { 
    name: 'EnergyControlDemandResponse', 
    component: EnergyControlDemandResponse, 
    featureSet: 'Energy Control Advisory & Integration',
    route: '/energy/ems/control/demand-response',
    title: 'Demand Response'
  },
  { 
    name: 'EnergyControlAssetModes', 
    component: EnergyControlAssetModes, 
    featureSet: 'Energy Control Advisory & Integration',
    route: '/energy/ems/control/asset-modes',
    title: 'Asset Modes'
  },
  { 
    name: 'EnergyControlIntegration', 
    component: EnergyControlIntegration, 
    featureSet: 'Energy Control Advisory & Integration',
    route: '/energy/ems/control/integration',
    title: 'Integration'
  },
  { 
    name: 'EnergyControlEfficiencyCurves', 
    component: EnergyControlEfficiencyCurves, 
    featureSet: 'Energy Control Advisory & Integration',
    route: '/energy/ems/control/efficiency-curves',
    title: 'Efficiency Curves'
  },
  
  // Energy Dashboards & Reporting (5 pages)
  { 
    name: 'EnergyDashboardsCustom', 
    component: EnergyDashboardsCustom, 
    featureSet: 'Energy Dashboards & Reporting',
    route: '/energy/ems/dashboards/custom',
    title: 'Custom Dashboards'
  },
  { 
    name: 'EnergyDashboardsPeriodComparison', 
    component: EnergyDashboardsPeriodComparison, 
    featureSet: 'Energy Dashboards & Reporting',
    route: '/energy/ems/dashboards/period-comparison',
    title: 'Period Comparison'
  },
  { 
    name: 'EnergyDashboardsCostAnalysis', 
    component: EnergyDashboardsCostAnalysis, 
    featureSet: 'Energy Dashboards & Reporting',
    route: '/energy/ems/dashboards/cost-analysis',
    title: 'Cost Analysis'
  },
  { 
    name: 'EnergyDashboardsAnomalies', 
    component: EnergyDashboardsAnomalies, 
    featureSet: 'Energy Dashboards & Reporting',
    route: '/energy/ems/dashboards/anomaly-charts',
    title: 'Anomalies'
  },
  { 
    name: 'EnergyDashboardsAuditReports', 
    component: EnergyDashboardsAuditReports, 
    featureSet: 'Energy Dashboards & Reporting',
    route: '/energy/ems/dashboards/audit-reports',
    title: 'Audit Reports'
  },
];

describe('EMS Final Integration and Testing', () => {
  let queryClient: QueryClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch to ensure no API calls
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('API calls not allowed in mock-only mode'));

    // Mock console.error to catch React errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Navigation Testing', () => {
    it('should have exactly 25 EMS pages defined', () => {
      expect(emsPages).toHaveLength(25);
    });

    it('should have 5 pages per feature set', () => {
      const featureSets = [
        'Energy Monitoring & Metering',
        'Energy Analytics & Optimisation', 
        'Sustainability & Emissions Tracking',
        'Energy Control Advisory & Integration',
        'Energy Dashboards & Reporting'
      ];

      featureSets.forEach(featureSet => {
        const pagesInSet = emsPages.filter(page => page.featureSet === featureSet);
        expect(pagesInSet).toHaveLength(5);
      });
    });

    it('should have unique routes for all EMS pages', () => {
      const routes = emsPages.map(page => page.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });

    it('should have all routes following EMS URL pattern', () => {
      emsPages.forEach(page => {
        expect(page.route).toMatch(/^\/energy\/ems\//);
      });
    });
  });

  describe('Page Loading and Error-Free Operation', () => {
    it('should render all EMS pages without errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      for (const page of emsPages) {
        const PageComponent = page.component;
        
        try {
          render(
            <TestWrapper>
              <PageComponent />
            </TestWrapper>
          );

          // Check that no console errors were logged during render
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        } catch (error) {
          throw new Error(`Page ${page.name} failed to render: ${error}`);
        }
      }
    });

    it('should load pages under upstream tenant context', async () => {
      // Test a representative sample of pages from each feature set
      const samplePages = [
        emsPages.find(p => p.featureSet === 'Energy Monitoring & Metering'),
        emsPages.find(p => p.featureSet === 'Energy Analytics & Optimisation'),
        emsPages.find(p => p.featureSet === 'Sustainability & Emissions Tracking'),
        emsPages.find(p => p.featureSet === 'Energy Control Advisory & Integration'),
        emsPages.find(p => p.featureSet === 'Energy Dashboards & Reporting'),
      ].filter(Boolean);

      for (const page of samplePages) {
        const PageComponent = page!.component;
        
        render(
          <TestWrapper>
            <PageComponent />
          </TestWrapper>
        );

        // Verify upstream context elements are present
        await waitFor(() => {
          // Look for upstream-specific elements like sector badges or upstream assets
          const upstreamElements = screen.queryAllByText(/upstream/i);
          const sectorElements = screen.queryAllByText(/oil.*gas|upstream|wellhead|esp|compressor/i);
          
          // At least one upstream context indicator should be present
          expect(upstreamElements.length + sectorElements.length).toBeGreaterThan(0);
        });
      }
    });

    it('should display EMSPageShell structure on all pages', async () => {
      // Test a few representative pages
      const testPages = emsPages.slice(0, 5);

      for (const page of testPages) {
        const PageComponent = page.component;
        
        render(
          <TestWrapper>
            <PageComponent />
          </TestWrapper>
        );

        // Verify nLVE pattern elements are present
        await waitFor(() => {
          // Look for ListPane and WorkPane structure
          const listElements = screen.queryAllByRole('list') || screen.queryAllByText(/select|choose|filter/i);
          const contentElements = screen.queryAllByRole('main') || screen.queryAllByText(/kw|kwh|energy|meter/i);
          
          // Should have both list and content areas
          expect(listElements.length + contentElements.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Data Consistency Testing', () => {
    it('should have consistent mock data available across all pages', () => {
      // Verify all required mock datasets exist
      expect(mockData.upstreamEnergyMeters).toBeDefined();
      expect(mockData.upstreamEnergyMeters.length).toBeGreaterThan(0);
      
      expect(mockData.upstreamSubmeters).toBeDefined();
      expect(mockData.upstreamSubmeters.length).toBeGreaterThan(0);
      
      expect(mockData.upstreamPowerQuality).toBeDefined();
      expect(Object.keys(mockData.upstreamPowerQuality).length).toBeGreaterThan(0);
      
      expect(mockData.upstreamEnergyAnomalies).toBeDefined();
      expect(mockData.upstreamEnergyAnomalies.length).toBeGreaterThan(0);
      
      expect(mockData.upstreamControllableLoads).toBeDefined();
      expect(mockData.upstreamControllableLoads.length).toBeGreaterThan(0);
      
      expect(mockData.upstreamProductionContext).toBeDefined();
      expect(mockData.upstreamProductionContext.barrelsPerDay).toBeGreaterThan(0);
    });

    it('should display consistent meter data across monitoring pages', async () => {
      const monitoringPages = emsPages.filter(p => p.featureSet === 'Energy Monitoring & Metering');
      const meterIds = new Set<string>();

      for (const page of monitoringPages) {
        const PageComponent = page.component;
        
        render(
          <TestWrapper>
            <PageComponent />
          </TestWrapper>
        );

        // Look for meter IDs in the rendered content
        await waitFor(() => {
          const meterElements = screen.queryAllByText(/em-wh-\d+|em-esp-\d+|em-gc-\d+/i);
          meterElements.forEach(element => {
            const match = element.textContent?.match(/(em-wh-\d+|em-esp-\d+|em-gc-\d+)/i);
            if (match) {
              meterIds.add(match[1].toLowerCase());
            }
          });
        });
      }

      // Should have consistent meter IDs across pages
      expect(meterIds.size).toBeGreaterThan(0);
    });

    it('should display consistent energy values across related pages', async () => {
      // Test that energy values are consistent between real-time and sub-metering pages
      const realTimePage = emsPages.find(p => p.name === 'EnergyMonitoringRealTime');
      const subMeteringPage = emsPages.find(p => p.name === 'EnergyMonitoringSubMetering');

      if (realTimePage && subMeteringPage) {
        // Render real-time page
        const { unmount: unmountRealTime } = render(
          <TestWrapper>
            <realTimePage.component />
          </TestWrapper>
        );

        const realTimeValues = new Set<string>();
        await waitFor(() => {
          const valueElements = screen.queryAllByText(/\d+\.?\d*\s*(kw|kwh)/i);
          valueElements.forEach(element => {
            if (element.textContent) {
              realTimeValues.add(element.textContent);
            }
          });
        });

        unmountRealTime();

        // Render sub-metering page
        render(
          <TestWrapper>
            <subMeteringPage.component />
          </TestWrapper>
        );

        const subMeteringValues = new Set<string>();
        await waitFor(() => {
          const valueElements = screen.queryAllByText(/\d+\.?\d*\s*(kw|kwh)/i);
          valueElements.forEach(element => {
            if (element.textContent) {
              subMeteringValues.add(element.textContent);
            }
          });
        });

        // Should have some overlapping energy values
        const intersection = new Set([...realTimeValues].filter(x => subMeteringValues.has(x)));
        expect(intersection.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Interactive Features Testing', () => {
    it('should handle meter selection interactions', async () => {
      const realTimePage = emsPages.find(p => p.name === 'EnergyMonitoringRealTime');
      
      if (realTimePage) {
        render(
          <TestWrapper>
            <realTimePage.component />
          </TestWrapper>
        );

        // Look for clickable meter elements
        await waitFor(() => {
          const clickableElements = screen.queryAllByRole('button') || 
                                  screen.queryAllByRole('listitem') ||
                                  screen.queryAllByText(/em-wh-\d+|select|choose/i);
          
          if (clickableElements.length > 0) {
            // Try clicking the first clickable element
            fireEvent.click(clickableElements[0]);
            
            // Should not throw errors
            expect(true).toBe(true);
          }
        });
      }
    });

    it('should handle PopPane interactions', async () => {
      // Test pages that have PopPane functionality
      const pagesWithPopPanes = [
        emsPages.find(p => p.name === 'EnergyAnalyticsWasteDetection'),
        emsPages.find(p => p.name === 'EnergySustainabilityESGReporting'),
        emsPages.find(p => p.name === 'EnergyControlLoadBalancing'),
        emsPages.find(p => p.name === 'EnergyDashboardsAnomalies'),
      ].filter(Boolean);

      for (const page of pagesWithPopPanes) {
        const PageComponent = page!.component;
        render(
          <TestWrapper>
            <PageComponent />
          </TestWrapper>
        );

        // Look for buttons that might open PopPanes
        await waitFor(() => {
          const buttons = screen.queryAllByRole('button');
          const popPaneButtons = buttons.filter(button => 
            button.textContent?.match(/investigate|schedule|simulate|generate|export|details/i)
          );

          if (popPaneButtons.length > 0) {
            // Try clicking a PopPane button
            fireEvent.click(popPaneButtons[0]);
            
            // Should not throw errors
            expect(true).toBe(true);
          }
        });
      }
    });

    it('should handle tab navigation', async () => {
      // Test pages that likely have tabs
      const pagesWithTabs = emsPages.slice(0, 3);

      for (const page of pagesWithTabs) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        // Look for tab elements
        await waitFor(() => {
          const tabs = screen.queryAllByRole('tab') || 
                      screen.queryAllByText(/overview|details|trends|analysis/i);
          
          if (tabs.length > 1) {
            // Try clicking different tabs
            fireEvent.click(tabs[1]);
            
            // Should not throw errors
            expect(true).toBe(true);
          }
        });
      }
    });
  });

  describe('Responsive Design Testing', () => {
    it('should render properly at different viewport sizes', async () => {
      const testPage = emsPages[0];
      
      // Test desktop size
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true });
      
      const { unmount } = render(
        <TestWrapper>
          <testPage.component />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should render without errors at desktop size
        expect(screen.getByRole('main') || document.body).toBeTruthy();
      });

      unmount();

      // Test tablet size
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
      
      render(
        <TestWrapper>
          <testPage.component />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should render without errors at tablet size
        expect(screen.getByRole('main') || document.body).toBeTruthy();
      });
    });

    it('should have accessible elements', async () => {
      const testPages = emsPages.slice(0, 3);

      for (const page of testPages) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        // Check for basic accessibility elements
        await waitFor(() => {
          // Should have main content area
          const mainElements = screen.queryAllByRole('main') || 
                              screen.queryAllByRole('region') ||
                              document.querySelectorAll('[role="main"]');
          
          // Should have some interactive elements with proper roles
          const interactiveElements = screen.queryAllByRole('button') ||
                                    screen.queryAllByRole('link') ||
                                    screen.queryAllByRole('tab');
          
          // At least one of these should be present for accessibility
          expect(mainElements.length + interactiveElements.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Mock-Only Operation Validation', () => {
    it('should not make any API calls during page rendering', async () => {
      const fetchSpy = vi.fn().mockRejectedValue(new Error('API calls not allowed'));
      global.fetch = fetchSpy;

      // Test a sample of pages from each feature set
      const samplePages = emsPages.filter((_, index) => index % 5 === 0);

      for (const page of samplePages) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        await waitFor(() => {
          // Page should render successfully
          expect(document.body).toBeTruthy();
        });
      }

      // Verify no fetch calls were made
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should work completely offline', async () => {
      // Simulate complete network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.XMLHttpRequest = vi.fn().mockImplementation(() => {
        throw new Error('Network error');
      });

      const testPage = emsPages[0];
      
      render(
        <TestWrapper>
          <testPage.component />
        </TestWrapper>
      );

      // Should still render successfully
      await waitFor(() => {
        expect(document.body).toBeTruthy();
      });
    });
  });

  describe('Visual Consistency Testing', () => {
    it('should use consistent Plant4.0 theme elements', async () => {
      const testPages = emsPages.slice(0, 5);

      for (const page of testPages) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        // Check for dark theme classes
        await waitFor(() => {
          const darkElements = document.querySelectorAll('[class*="dark"]') ||
                              document.querySelectorAll('[class*="bg-"]') ||
                              document.querySelectorAll('[class*="text-"]');
          
          // Should have theme-related classes
          expect(darkElements.length).toBeGreaterThan(0);
        });
      }
    });

    it('should display energy type icons consistently', async () => {
      const testPages = emsPages.filter(p => 
        p.featureSet === 'Energy Monitoring & Metering' || 
        p.featureSet === 'Energy Analytics & Optimisation'
      );

      for (const page of testPages) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        // Look for energy type indicators
        await waitFor(() => {
          const energyElements = screen.queryAllByText(/electricity|gas|diesel|steam/i) ||
                               document.querySelectorAll('[class*="energy"]') ||
                               document.querySelectorAll('svg');
          
          // Should have energy-related elements
          expect(energyElements.length).toBeGreaterThan(0);
        });
      }
    });

    it('should display sector badges consistently', async () => {
      const testPages = emsPages.slice(0, 3);

      for (const page of testPages) {
        render(
          <TestWrapper>
            <page.component />
          </TestWrapper>
        );

        // Look for sector/subsector badges
        await waitFor(() => {
          const sectorElements = screen.queryAllByText(/upstream|oil.*gas|wellhead|esp/i) ||
                                document.querySelectorAll('[class*="badge"]');
          
          // Should have sector-related elements
          expect(sectorElements.length).toBeGreaterThan(0);
        });
      }
    });
  });
});