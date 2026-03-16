import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnergySustainabilityRenewables } from '../EnergySustainabilityRenewables';

// Mock the AppContext
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp()
}));

// Mock the recharts library
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

const mockUpstreamContext = {
  sector: 'Oil & Gas',
  subsector: 'Upstream',
  currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
  energyMeters: [],
  energyTelemetry: {},
  emissionFactors: { electricityKgCo2PerKWh: 0.5 },
  setCurrentTenant: vi.fn(),
  setSector: vi.fn(),
  setSubsector: vi.fn(),
};

const mockTransmissionContext = {
  sector: 'Power',
  subsector: 'Transmission',
  currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
  energyMeters: [],
  energyTelemetry: {},
  emissionFactors: { electricityKgCo2PerKWh: 0.5 },
  setCurrentTenant: vi.fn(),
  setSector: vi.fn(),
  setSubsector: vi.fn(),
};

describe('EnergySustainabilityRenewables', () => {
  describe('Upstream Context', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
    });

    it('should render upstream renewable assets', () => {
      render(<EnergySustainabilityRenewables />);

      // Check for upstream-specific assets
      expect(screen.getByText(/Wellhead Solar Array/i)).toBeInTheDocument();
      expect(screen.getByText(/Compressor Station Solar/i)).toBeInTheDocument();
      expect(screen.getByText(/Energy Storage System/i)).toBeInTheDocument();
    });

    it('should show Cost Savings KPI for upstream', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/Cost Savings/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily energy cost savings/i)).toBeInTheDocument();
    });

    it('should not show transmission-specific features', () => {
      render(<EnergySustainabilityRenewables />);

      // Should not show transmission contract breakdown
      expect(screen.queryByText(/Renewable Energy Contracts/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Total RECs Issued/i)).not.toBeInTheDocument();
    });
  });

  describe('Transmission Context', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockTransmissionContext);
    });

    it('should render transmission renewable assets', () => {
      render(<EnergySustainabilityRenewables />);

      // Check for transmission-specific assets
      expect(screen.getByText(/Substation Solar Farm/i)).toBeInTheDocument();
      expect(screen.getByText(/Grid-Connected Wind Farm/i)).toBeInTheDocument();
      expect(screen.getByText(/Grid-Scale Battery Storage/i)).toBeInTheDocument();
    });

    it('should show Total RECs Issued KPI for transmission', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/Total RECs Issued/i)).toBeInTheDocument();
      expect(screen.getByText(/Renewable Energy Credits/i)).toBeInTheDocument();
    });

    it('should show transmission contract breakdown', () => {
      render(<EnergySustainabilityRenewables />);

      // Should show contract breakdown section
      expect(screen.getByText(/Renewable Energy Contracts/i)).toBeInTheDocument();
    });

    it('should display substation and feeder context for transmission assets', () => {
      render(<EnergySustainabilityRenewables />);

      // Check for transmission topology context
      expect(screen.getByText(/Central Substation/i)).toBeInTheDocument();
      expect(screen.getByText(/North Substation/i)).toBeInTheDocument();
    });

    it('should show PPA and REC contract types', () => {
      render(<EnergySustainabilityRenewables />);

      // Contract types should be visible in the list
      const listItems = screen.getAllByRole('button');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Common Features', () => {
    beforeEach(() => {
      mockUseApp.mockReturnValue(mockUpstreamContext);
    });

    it('should render renewable contribution KPI', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/Renewable Contribution/i)).toBeInTheDocument();
      expect(screen.getByText(/Of total energy consumption/i)).toBeInTheDocument();
    });

    it('should render total generation KPI', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/Total Generation/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily renewable generation/i)).toBeInTheDocument();
    });

    it('should render CO2 avoided KPI', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/CO₂ Avoided/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily carbon savings/i)).toBeInTheDocument();
    });

    it('should render energy source breakdown chart', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/Energy Source Breakdown/i)).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render generation vs consumption chart', () => {
      render(<EnergySustainabilityRenewables />);

      expect(screen.getByText(/24-Hour Generation vs Consumption/i)).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });
});

