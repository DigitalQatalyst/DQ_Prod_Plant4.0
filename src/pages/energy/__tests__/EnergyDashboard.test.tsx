import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EnergyDashboard } from '../EnergyDashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock the AppContext
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp()
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
      {tabs[0].content}
    </div>
  )
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
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null
}));

describe('EnergyDashboard', () => {
  const mockCurrentTenant = {
    id: 't1',
    name: 'Test Tenant',
    sector: 'power',
    subsector: 'Transmission'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Upstream Mode (Oil & Gas)', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        currentTenant: mockCurrentTenant,
        energyMeters: [],
        energyTelemetry: [],
        energyBaselines: [],
        tariffs: [],
        emissionFactors: []
      });
    });

    it('should render upstream dashboard when not in transmission mode', () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Energy Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor energy consumption, efficiency, and optimization')).toBeInTheDocument();
      expect(screen.getByTestId('upstream-dashboard')).toBeInTheDocument();
    });

    it('should not load transmission data in upstream mode', () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(mockTransmissionProvider.listTxSubstations).not.toHaveBeenCalled();
      expect(mockTransmissionProvider.listTxFeeders).not.toHaveBeenCalled();
      expect(mockTransmissionProvider.listEnergyMetersTxScoped).not.toHaveBeenCalled();
    });
  });

  describe('Transmission Mode (Power/Transmission)', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockCurrentTenant,
        energyMeters: [],
        energyTelemetry: [],
        energyBaselines: [],
        tariffs: [],
        emissionFactors: []
      });

      // Mock transmission data
      mockTransmissionProvider.listTxSubstations.mockResolvedValue([
        {
          id: 'sub1',
          org_id: 't1',
          code: 'SUB001',
          name: 'Main Substation',
          active: true,
          voltage_levels_kv: [132, 220]
        },
        {
          id: 'sub2',
          org_id: 't1',
          code: 'SUB002',
          name: 'North Substation',
          active: true,
          voltage_levels_kv: [132]
        }
      ]);

      mockTransmissionProvider.listTxFeeders.mockResolvedValue([
        {
          id: 'feed1',
          substation_id: 'sub1',
          feeder_code: 'F001',
          name: 'Feeder 1',
          active: true,
          direction: 'outgoer'
        },
        {
          id: 'feed2',
          substation_id: 'sub1',
          feeder_code: 'F002',
          name: 'Feeder 2',
          active: true,
          direction: 'outgoer'
        }
      ]);

      mockTransmissionProvider.listEnergyMetersTxScoped.mockResolvedValue([
        {
          id: 'm1',
          org_id: 't1',
          name: 'Meter 1',
          substation_id: 'sub1',
          feeder_id: 'feed1',
          meter_role: 'feeder_outgoing',
          status: 'Normal'
        }
      ]);
    });

    it('should render transmission dashboard title and subtitle', () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Transmission Grid Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor transmission grid performance, losses, and system efficiency')).toBeInTheDocument();
    });

    it('should load transmission data on mount', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockTransmissionProvider.listTxSubstations).toHaveBeenCalledWith({ org_id: 't1' });
        expect(mockTransmissionProvider.listTxFeeders).toHaveBeenCalledWith({ org_id: 't1' });
        expect(mockTransmissionProvider.listEnergyMetersTxScoped).toHaveBeenCalledWith({ org_id: 't1' });
      });
    });

    it('should display transmission grid KPI tiles - Requirement 23.1', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Grid Losses')).toBeInTheDocument();
        expect(screen.getByText('Load Factor')).toBeInTheDocument();
        expect(screen.getByText('System Efficiency')).toBeInTheDocument();
        expect(screen.getByText('Total Delivered')).toBeInTheDocument();
      });
    });

    it('should display secondary KPIs', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Peak Demand')).toBeInTheDocument();
        expect(screen.getByText('Active Substations')).toBeInTheDocument();
        expect(screen.getByText('Active Feeders')).toBeInTheDocument();
        expect(screen.getByText('Critical Alerts')).toBeInTheDocument();
      });
    });

    it('should display substation performance summary - Requirement 23.2', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Substation Performance Summary')).toBeInTheDocument();
        expect(screen.getByText('Top substations by load and efficiency')).toBeInTheDocument();
      });
    });

    it('should display feeder load distribution chart - Requirement 23.3', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Feeder Load Distribution')).toBeInTheDocument();
        expect(screen.getByText('Current load across transmission feeders')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      });
    });

    it('should display transmission grid topology overview - Requirement 23.3', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Transmission Grid Topology Overview')).toBeInTheDocument();
        expect(screen.getByText('Network structure and connectivity status')).toBeInTheDocument();
        expect(screen.getByText('Substations')).toBeInTheDocument();
        expect(screen.getByText('Feeders')).toBeInTheDocument();
        expect(screen.getByText('Meters')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching transmission data', () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading transmission grid data...')).toBeInTheDocument();
    });

    it('should handle empty substation data gracefully - Requirement 23.6', async () => {
      mockTransmissionProvider.listTxSubstations.mockResolvedValue([]);
      mockTransmissionProvider.listTxFeeders.mockResolvedValue([]);
      mockTransmissionProvider.listEnergyMetersTxScoped.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No substation data available')).toBeInTheDocument();
      });
    });

    it('should handle empty feeder data gracefully - Requirement 23.6', async () => {
      mockTransmissionProvider.listTxFeeders.mockResolvedValue([]);

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No feeder data available')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockTransmissionProvider.listTxSubstations.mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load transmission data:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should calculate transmission KPIs correctly - Requirement 23.4', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Verify KPI values are displayed (mock values)
        expect(screen.getByText(/3\.2%/)).toBeInTheDocument(); // Grid losses
        expect(screen.getByText(/72%/)).toBeInTheDocument(); // Load factor
        expect(screen.getByText(/96\.8%/)).toBeInTheDocument(); // System efficiency
      });
    });

    it('should display active substation and feeder counts - Requirement 23.5', async () => {
      render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should show 2 active substations and 2 active feeders from mock data
        const substationElements = screen.getAllByText('2');
        expect(substationElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sector Context Switching', () => {
    it('should switch from upstream to transmission mode correctly', async () => {
      // Start in upstream mode
      mockUseApp.mockReturnValue({
        sector: 'Oil & Gas',
        subsector: 'Upstream',
        currentTenant: mockCurrentTenant
      });

      const { rerender } = render(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      // Verify upstream mode
      expect(screen.getByText('Energy Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('upstream-dashboard')).toBeInTheDocument();

      // Switch to transmission mode
      mockUseApp.mockReturnValue({
        sector: 'power',
        subsector: 'Transmission',
        currentTenant: mockCurrentTenant
      });

      mockTransmissionProvider.listTxSubstations.mockResolvedValue([]);
      mockTransmissionProvider.listTxFeeders.mockResolvedValue([]);
      mockTransmissionProvider.listEnergyMetersTxScoped.mockResolvedValue([]);

      rerender(
        <BrowserRouter>
          <EnergyDashboard />
        </BrowserRouter>
      );

      // Verify transmission mode
      await waitFor(() => {
        expect(screen.getByText('Transmission Grid Dashboard')).toBeInTheDocument();
      });
    });
  });
});
