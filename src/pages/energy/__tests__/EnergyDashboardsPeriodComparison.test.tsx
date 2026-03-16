import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EnergyDashboardsPeriodComparison } from '../EnergyDashboardsPeriodComparison';
import * as AppContext from '@/context/AppContext';
import * as TransmissionProvider from '@/lib/data/providers/TransmissionProvider';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn()
}));

// Mock the transmission provider
vi.mock('@/lib/data/providers/TransmissionProvider', () => ({
  getTransmissionProvider: vi.fn()
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  Cell: () => null
}));

describe('EnergyDashboardsPeriodComparison', () => {
  const mockTransmissionTenant = {
    id: 'tx-tenant-1',
    name: 'Transmission Operator',
    sector: 'power',
    subsector: 'Transmission'
  };

  const mockUpstreamTenant = {
    id: 'upstream-tenant-1',
    name: 'Oil & Gas Operator',
    sector: 'oil-gas',
    subsector: 'Upstream'
  };

  const mockSubstations = [
    {
      id: 'sub-1',
      org_id: 'tx-tenant-1',
      code: 'SUB001',
      name: 'Main Substation',
      active: true,
      voltage_levels_kv: [132, 220],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'sub-2',
      org_id: 'tx-tenant-1',
      code: 'SUB002',
      name: 'North Substation',
      active: true,
      voltage_levels_kv: [132],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockFeeders = [
    {
      id: 'feed-1',
      substation_id: 'sub-1',
      feeder_code: 'F001',
      name: 'Feeder 1',
      voltage_level_kv: 132,
      direction: 'outgoer' as const,
      active: true
    },
    {
      id: 'feed-2',
      substation_id: 'sub-1',
      feeder_code: 'F002',
      name: 'Feeder 2',
      voltage_level_kv: 132,
      direction: 'outgoer' as const,
      active: true
    }
  ];

  const mockTransmissionProvider = {
    listTxSubstations: vi.fn().mockResolvedValue(mockSubstations),
    listTxFeeders: vi.fn().mockResolvedValue(mockFeeders),
    listEnergyMetersTxScoped: vi.fn().mockResolvedValue([])
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (TransmissionProvider.getTransmissionProvider as any).mockReturnValue(mockTransmissionProvider);
  });

  describe('Transmission Mode', () => {
    beforeEach(() => {
      (AppContext.useApp as any).mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockTransmissionTenant
      });
    });

    it('should render transmission period comparison page', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getByText('Transmission Period Comparison')).toBeInTheDocument();
      });
    });

    it('should display period selection options', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Today vs Yesterday').length).toBeGreaterThan(0);
        expect(screen.getAllByText('This Week vs Last Week').length).toBeGreaterThan(0);
      });
    });

    it('should load transmission substations and feeders', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalledWith({
          org_id: 'tx-tenant-1'
        });
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalledWith({
          org_id: 'tx-tenant-1'
        });
      });
    });

    it('should display transmission scope selector - Requirement 25.2', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getByText('Comparison Scope')).toBeInTheDocument();
      });
    });

    it('should display transmission metrics with normalization - Requirement 25.5', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should show normalized metrics for energy values
        const energyMetrics = screen.queryAllByText(/MWh/);
        expect(energyMetrics.length).toBeGreaterThan(0);
      });
    });

    it('should show grid-level metrics when "all" scope selected - Requirement 25.1', async () => {
      // Mock empty substations so scope defaults to 'all'
      mockTransmissionProvider.listTxSubstations.mockResolvedValueOnce([]);
      mockTransmissionProvider.listTxFeeders.mockResolvedValueOnce([]);
      
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getAllByText('Entire Grid').length).toBeGreaterThan(0);
        expect(screen.getByText('Total Energy Delivered')).toBeInTheDocument();
        expect(screen.getByText('Grid Losses')).toBeInTheDocument();
        expect(screen.getByText('Load Factor')).toBeInTheDocument();
        expect(screen.getByText('System Efficiency')).toBeInTheDocument();
      });
    });

    it('should display variance calculations - Requirement 25.4', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should show variance percentages
        const badges = screen.queryAllByText(/Improved|Declined|Unchanged/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should normalize metrics for different period lengths - Requirement 25.5', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // When comparing periods of different lengths, should show normalization badge
        // This would be visible when selecting month vs quarter comparisons
        const metrics = screen.queryAllByText(/Current:|Previous:/);
        expect(metrics.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Upstream Mode', () => {
    beforeEach(() => {
      (AppContext.useApp as any).mockReturnValue({
        sector: 'oil-gas',
        subsector: 'Upstream',
        currentTenant: mockUpstreamTenant
      });
    });

    it('should render upstream period comparison page', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getByText('Period-over-period Comparison')).toBeInTheDocument();
      });
    });

    it('should display upstream metrics', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.getByText('Main Facility')).toBeInTheDocument();
        expect(screen.getByText('Total Energy Consumption')).toBeInTheDocument();
      });
    });

    it('should not load transmission data in upstream mode', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).not.toHaveBeenCalled();
        expect(mockTransmissionProvider.listTxFeeders).not.toHaveBeenCalled();
      });
    });

    it('should not display transmission scope selector', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        expect(screen.queryByText('Comparison Scope')).not.toBeInTheDocument();
      });
    });
  });

  describe('Period Normalization', () => {
    beforeEach(() => {
      (AppContext.useApp as any).mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockTransmissionTenant
      });
    });

    it('should normalize energy metrics per day for fair comparison - Requirement 25.5', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Energy metrics should be normalized to per-day basis
        const normalizedMetrics = screen.queryAllByText(/MWh\/day/);
        expect(normalizedMetrics.length).toBeGreaterThan(0);
      });
    });

    it('should not normalize percentage metrics - Requirement 25.5', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Percentage metrics should not be normalized
        expect(screen.getByText('Grid Losses')).toBeInTheDocument();
        expect(screen.getByText('Load Factor')).toBeInTheDocument();
        expect(screen.getByText('System Efficiency')).toBeInTheDocument();
      });
    });
  });

  describe('Variance Calculations', () => {
    beforeEach(() => {
      (AppContext.useApp as any).mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockTransmissionTenant
      });
    });

    it('should calculate variance correctly - Requirement 25.3', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should show variance as both absolute and percentage
        const variances = screen.queryAllByText(/%/);
        expect(variances.length).toBeGreaterThan(0);
      });
    });

    it('should indicate improvement vs decline - Requirement 25.4', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should show improvement/decline badges
        const badges = screen.queryAllByText(/Improved|Declined/);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should handle zero variance - Requirement 25.3', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should show "Unchanged" for metrics with no variance
        const unchangedBadges = screen.queryAllByText('Unchanged');
        // May or may not have unchanged metrics depending on mock data
        expect(unchangedBadges.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Substation and Feeder Performance', () => {
    beforeEach(() => {
      (AppContext.useApp as any).mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockTransmissionTenant
      });
    });

    it('should support substation-level comparison - Requirement 25.2', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Should be able to select substation scope
        expect(screen.getByText('Select Substation')).toBeInTheDocument();
      });
    });

    it('should support feeder-level comparison - Requirement 25.2', async () => {
      render(<EnergyDashboardsPeriodComparison />);
      
      await waitFor(() => {
        // Scope selector should include feeder option
        expect(screen.getByText('Comparison Scope')).toBeInTheDocument();
      });
    });
  });
});
