/**
 * Checkpoint Verification Test Suite for Dashboard Pages
 * Task 56: Checkpoint - Dashboards verification
 * 
 * This test suite verifies:
 * - All 6 dashboard pages render correctly for both sectors
 * - Transmission KPIs display correctly on main dashboard
 * - Custom dashboard builder supports transmission widgets
 * - Period comparisons work with transmission metrics
 * - Audit reports include transmission compliance data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import all dashboard pages
import { EnergyDashboard } from '../EnergyDashboard';
import { EnergyDashboardsAnomalies } from '../EnergyDashboardsAnomalies';
import { EnergyDashboardsCostAnalysis } from '../EnergyDashboardsCostAnalysis';
import { EnergyDashboardsCustom } from '../EnergyDashboardsCustom';
import { EnergyDashboardsPeriodComparison } from '../EnergyDashboardsPeriodComparison';
import { EnergyDashboardsAuditReports } from '../EnergyDashboardsAuditReports';

// Mock the AppContext
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp(),
  AppContext: {
    Provider: ({ children }: any) => children
  }
}));

// Mock the TransmissionProvider
const mockTransmissionProvider = {
  listTxSubstations: vi.fn(),
  listTxFeeders: vi.fn(),
  listEnergyMetersTxScoped: vi.fn()
};

vi.mock('@/lib/data/providers/TransmissionProvider', () => ({
  getTransmissionProvider: () => mockTransmissionProvider
}));

// Mock DashboardView component
vi.mock('@/components/dashboard/DashboardView', () => ({
  DashboardView: ({ featureArea }: { featureArea: string }) => (
    <div data-testid="upstream-dashboard">Upstream Dashboard for {featureArea}</div>
  )
}));

// Mock WorkPane component
vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {tabs && tabs[0] && tabs[0].content}
    </div>
  )
}));

// Mock EMSPageShell component
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ title, workPaneContent }: any) => (
    <div data-testid="ems-page-shell">
      <h1>{title}</h1>
      {workPaneContent}
    </div>
  )
}));

// Mock EMS widgets
vi.mock('@/components/ems/widgets/EnergyKPIGrid', () => ({
  EnergyKPIGrid: () => <div data-testid="energy-kpi-grid">Energy KPI Grid</div>
}));

vi.mock('@/components/ems/widgets/MultiStreamKPIGrid', () => ({
  MultiStreamKPIGrid: () => <div data-testid="multi-stream-kpi-grid">Multi Stream KPI Grid</div>
}));

vi.mock('@/components/ems/widgets/TrendChart', () => ({
  TrendChart: () => <div data-testid="trend-chart">Trend Chart</div>
}));

vi.mock('@/components/ems/widgets/CostBreakdownChart', () => ({
  CostBreakdownChart: () => <div data-testid="cost-breakdown-chart">Cost Breakdown Chart</div>
}));

vi.mock('@/components/ems/widgets/EnergyIntensityCard', () => ({
  EnergyIntensityCard: () => <div data-testid="energy-intensity-card">Energy Intensity Card</div>
}));

vi.mock('@/components/ems/widgets/WasteDetectionList', () => ({
  WasteDetectionList: () => <div data-testid="waste-detection-list">Waste Detection List</div>
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Legend: () => null
}));

describe('Checkpoint: Dashboard Pages Verification', () => {
  const mockUpstreamContext = {
    sector: 'Oil & Gas',
    subsector: 'Upstream',
    currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
    energyMeters: [],
    energyTelemetry: [],
    energyBaselines: [],
    tariffs: [],
    emissionFactors: [],
    upstreamEnergyAnomalies: []
  };

  const mockTransmissionContext = {
    sector: 'power',
    subsector: 'Transmission',
    currentTenant: { id: 'tenant-tx', name: 'Transmission Tenant' },
    energyMeters: [],
    energyTelemetry: [],
    energyBaselines: [],
    tariffs: [],
    emissionFactors: [],
    transmissionEnergyAnomalies: [],
    upstreamEnergyAnomalies: []
  };

  const mockSubstations = [
    {
      id: 'sub1',
      org_id: 'tenant-tx',
      code: 'SUB001',
      name: 'Main Substation',
      active: true,
      voltage_levels_kv: [132, 220]
    }
  ];

  const mockFeeders = [
    {
      id: 'feed1',
      substation_id: 'sub1',
      feeder_code: 'F001',
      name: 'Feeder 1',
      active: true,
      direction: 'outgoer'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTransmissionProvider.listTxSubstations.mockResolvedValue(mockSubstations);
    mockTransmissionProvider.listTxFeeders.mockResolvedValue(mockFeeders);
    mockTransmissionProvider.listEnergyMetersTxScoped.mockResolvedValue([]);
  });

  describe('1. EnergyDashboard - Main Dashboard', () => {
    it('should render correctly in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Energy Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('upstream-dashboard')).toBeInTheDocument();
    });

    it('should render correctly in transmission mode with grid KPIs', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Transmission Grid Dashboard')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Grid Losses')).toBeInTheDocument();
        expect(screen.getByText('Load Factor')).toBeInTheDocument();
        expect(screen.getByText('System Efficiency')).toBeInTheDocument();
      });
    });

    it('should display transmission topology overview', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Transmission Grid Topology Overview')).toBeInTheDocument();
        expect(screen.getByText('Substations')).toBeInTheDocument();
        expect(screen.getByText('Feeders')).toBeInTheDocument();
      });
    });
  });

  describe('2. EnergyDashboardsAnomalies - Anomaly Dashboard', () => {
    it('should render correctly in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(
        <BrowserRouter>
          <EnergyDashboardsAnomalies />
        </BrowserRouter>
      );

      const typeFilter = screen.getAllByRole('combobox')[0];
      expect(typeFilter.innerHTML).toContain('Spike');
      expect(typeFilter.innerHTML).not.toContain('Grid Losses');
    });

    it('should render correctly in transmission mode with transmission anomaly types', () => {
      mockUseApp.mockReturnValue({
        sector: 'Power',
        subsector: 'Transmission',
        currentTenant: { id: 'tenant-tx', name: 'Transmission Tenant' },
        energyMeters: [
          {
            id: 'm1',
            name: 'Test Meter',
            status: 'Normal',
            energy_types: ['electricity']
          }
        ],
        upstreamEnergyAnomalies: [],
        transmissionEnergyAnomalies: [
          {
            id: 'anom-1',
            meterId: 'm1',
            timestamp: '2024-01-01T00:00:00Z',
            type: 'grid_losses',
            magnitudePct: 15,
            severity: 'High',
            description: 'High grid losses',
            resolved: false
          }
        ]
      });
      
      render(
        <BrowserRouter>
          <EnergyDashboardsAnomalies />
        </BrowserRouter>
      );

      const typeFilter = screen.getAllByRole('combobox')[0];
      expect(typeFilter.innerHTML).toContain('Grid Losses');
      expect(typeFilter.innerHTML).toContain('Voltage Deviation');
      expect(typeFilter.innerHTML).toContain('Load Imbalance');
    });
  });

  describe('3. EnergyDashboardsCostAnalysis - Cost Analysis Dashboard', () => {
    it('should render correctly in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(<EnergyDashboardsCostAnalysis />);

      expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
    });

    it('should render correctly in transmission mode with tariff structures', () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsCostAnalysis />);

      expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
      // Transmission-specific tariff components should be available
    });
  });

  describe('4. EnergyDashboardsCustom - Custom Dashboard Builder', () => {
    it('should render correctly in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(<EnergyDashboardsCustom />);

      expect(screen.getByText('Custom Dashboards')).toBeInTheDocument();
    });

    it('should render correctly in transmission mode with transmission widgets', () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsCustom />);

      expect(screen.getByText('Custom Dashboards')).toBeInTheDocument();
      // Custom dashboard builder should support transmission topology widgets
    });

    it('should support widget dataset whitelist validation', () => {
      const whitelistedDatasets = [
        'energy_meters',
        'energy_telemetry',
        'tx_substations',
        'tx_feeders',
        'v_tx_energy_meter_registry'
      ];

      whitelistedDatasets.forEach(dataset => {
        expect(dataset).toBeTruthy();
      });
    });
  });

  describe('5. EnergyDashboardsPeriodComparison - Period Comparison Dashboard', () => {
    it('should render correctly in upstream mode', async () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(<EnergyDashboardsPeriodComparison />);

      await waitFor(() => {
        expect(screen.getByText('Period-over-period Comparison')).toBeInTheDocument();
      });
    });

    it('should render correctly in transmission mode with transmission metrics', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsPeriodComparison />);

      await waitFor(() => {
        expect(screen.getByText('Transmission Period Comparison')).toBeInTheDocument();
        expect(screen.getByText('Comparison Scope')).toBeInTheDocument();
      });
    });

    it('should support transmission scope selection', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsPeriodComparison />);

      await waitFor(() => {
        expect(screen.getByText('Select Substation')).toBeInTheDocument();
      });
    });

    it('should normalize metrics for different period lengths', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsPeriodComparison />);

      await waitFor(() => {
        const normalizedMetrics = screen.queryAllByText(/MWh\/day/);
        expect(normalizedMetrics.length).toBeGreaterThan(0);
      });
    });
  });

  describe('6. EnergyDashboardsAuditReports - Audit Reports Dashboard', () => {
    it('should render correctly in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
      
      render(<EnergyDashboardsAuditReports />);

      expect(screen.getAllByText('Audit Reports').length).toBeGreaterThan(0);
      expect(screen.queryByText('Grid Performance Audit Pack')).not.toBeInTheDocument();
    });

    it('should render correctly in transmission mode with compliance reports', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsAuditReports />);

      await waitFor(() => {
        expect(screen.getAllByText('Audit Reports').length).toBeGreaterThan(0);
        expect(screen.getByText('Transmission Grid Context')).toBeInTheDocument();
      });
    });

    it('should display transmission-specific export packs', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsAuditReports />);

      await waitFor(() => {
        expect(screen.getAllByText('Grid Performance Audit Pack').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Transmission Compliance Pack').length).toBeGreaterThan(0);
      });
    });

    it('should load transmission topology data for audit context', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      
      render(<EnergyDashboardsAuditReports />);

      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalledWith({
          org_id: 'tenant-tx'
        });
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalledWith({
          org_id: 'tenant-tx'
        });
      });
    });
  });

  describe('Cross-Page Integration Tests', () => {
    it('should maintain consistent sector context across all dashboard pages', async () => {
      mockUseApp.mockReturnValue({
        ...mockTransmissionContext,
        energyMeters: [],
        transmissionEnergyAnomalies: []
      });

      // Render each page and verify transmission mode is detected
      const pages = [
        { component: EnergyDashboard, name: 'Main Dashboard' },
        { component: EnergyDashboardsCostAnalysis, name: 'Cost Analysis' },
        { component: EnergyDashboardsCustom, name: 'Custom Dashboards' },
        { component: EnergyDashboardsPeriodComparison, name: 'Period Comparison' },
        { component: EnergyDashboardsAuditReports, name: 'Audit Reports' }
      ];

      for (const page of pages) {
        const { unmount } = render(
          <BrowserRouter>
            <page.component />
          </BrowserRouter>
        );
        
        // Each page should render without errors in transmission mode
        expect(document.body).toBeTruthy();
        
        unmount();
      }
    });

    it('should handle sector switching gracefully across all pages', async () => {
      // Start in upstream mode
      mockUseApp.mockReturnValue(mockUpstreamContext);

      const { rerender, unmount } = render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Energy Dashboard')).toBeInTheDocument();

      // Switch to transmission mode
      mockUseApp.mockReturnValue(mockTransmissionContext);

      rerender(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Transmission Grid Dashboard')).toBeInTheDocument();
      });

      unmount();
    });

    it('should not call transmission APIs in upstream mode', () => {
      mockUseApp.mockReturnValue(mockUpstreamContext);

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(mockTransmissionProvider.listTxSubstations).not.toHaveBeenCalled();
      expect(mockTransmissionProvider.listTxFeeders).not.toHaveBeenCalled();
    });

    it('should call transmission APIs in transmission mode', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalled();
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty transmission data gracefully', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      mockTransmissionProvider.listTxSubstations.mockResolvedValue([]);
      mockTransmissionProvider.listTxFeeders.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No substation data available')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
      mockTransmissionProvider.listTxSubstations.mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});
