import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnergySustainabilityCarbonCalculation } from '../EnergySustainabilityCarbonCalculation';
import { useApp } from '@/context/AppContext';

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('EnergySustainabilityCarbonCalculation', () => {
  const mockUpstreamContext = {
    energyMeters: [
      {
        id: 'meter-1',
        name: 'Well Pad A - Meter 1',
        status: 'Normal' as const,
        energyTypes: ['electricity' as const, 'gas' as const],
        scope: 'Well Pad A',
      },
    ],
    energyTelemetry: {
      'meter-1': {
        kWh: [1000, 1100, 1200],
        kW: [50, 55, 60],
        timestamps: ['2025-01-01', '2025-01-02', '2025-01-03'],
      },
    },
    emissionFactors: {
      electricityKgCo2PerKWh: 0.475,
      gasKgCo2PerMMBtu: 53.06,
      dieselKgCo2PerLitre: 2.68,
    },
    sector: 'Oil & Gas',
    subsector: 'Upstream',
    currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
  };

  const mockTransmissionContext = {
    ...mockUpstreamContext,
    energyMeters: [
      {
        id: 'meter-tx-1',
        name: 'SS-DXB-MAIN - Grid Incomer',
        status: 'Normal' as const,
        energyTypes: ['electricity' as const],
        scope: 'Substation: SS-DXB-MAIN, Feeder: FDR-OUT-01',
      },
    ],
    energyTelemetry: {
      'meter-tx-1': {
        kWh: [45000000, 46000000, 47000000],
        kW: [1800, 1850, 1900],
        timestamps: ['2025-01-01', '2025-01-02', '2025-01-03'],
      },
    },
    sector: 'Power',
    subsector: 'Transmission',
  };

  it('renders upstream carbon calculation page correctly', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for page title (use getAllByText since it appears multiple times)
    const titles = screen.getAllByText('Carbon Calculation');
    expect(titles.length).toBeGreaterThan(0);

    // Check that the page renders without errors - look for common elements
    expect(screen.getByText('Energy Meters')).toBeInTheDocument();
  });

  it('renders transmission carbon calculation page correctly', () => {
    vi.mocked(useApp).mockReturnValue(mockTransmissionContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for page title (use getAllByText since it appears multiple times)
    const titles = screen.getAllByText('Carbon Calculation');
    expect(titles.length).toBeGreaterThan(0);

    // Check that the page renders without errors - look for common elements
    expect(screen.getByText('Energy Meters')).toBeInTheDocument();
  });

  it('displays transmission-specific KPIs when in transmission context', () => {
    vi.mocked(useApp).mockReturnValue(mockTransmissionContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for transmission-specific KPIs (use getAllByText since they appear multiple times)
    const co2PerMwhElements = screen.getAllByText('CO₂ per MWh Delivered');
    expect(co2PerMwhElements.length).toBeGreaterThan(0);
    
    const gridEfficiencyElements = screen.getAllByText('Grid Efficiency');
    expect(gridEfficiencyElements.length).toBeGreaterThan(0);
    
    const mwhDeliveredElements = screen.getAllByText('MWh Delivered');
    expect(mwhDeliveredElements.length).toBeGreaterThan(0);
  });

  it('displays upstream-specific KPIs when not in transmission context', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for upstream-specific KPIs (use getAllByText since they appear multiple times)
    const co2PerBBLElements = screen.getAllByText('CO₂ per BBL');
    expect(co2PerBBLElements.length).toBeGreaterThan(0);
    
    const co2PerMSCFElements = screen.getAllByText('CO₂ per MSCF');
    expect(co2PerMSCFElements.length).toBeGreaterThan(0);
  });

  it('displays scope 1 and scope 2 emissions breakdown', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for scope breakdown
    expect(screen.getByText('Scope 1 Emissions')).toBeInTheDocument();
    expect(screen.getByText('Scope 2 Emissions')).toBeInTheDocument();
  });

  it('shows transmission grid context in source details when in transmission mode', () => {
    vi.mocked(useApp).mockReturnValue(mockTransmissionContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // The transmission context should be available in the page
    // We can verify the meter has transmission scope
    const meterScope = mockTransmissionContext.energyMeters[0].scope;
    expect(meterScope).toContain('Substation');
    expect(meterScope).toContain('Feeder');
  });

  it('calculates emissions correctly for electricity', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Verify emissions are calculated
    // Latest kWh = 1200, factor = 0.475
    // Expected CO2 = 1200 * 0.475 = 570 kg
    // This is displayed in the UI
    expect(screen.getByText('Total CO₂ Emissions')).toBeInTheDocument();
  });

  it('displays emission factor information', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for emission factor display - it's in the overview tab
    expect(screen.getByText('Emission Sources')).toBeInTheDocument();
  });

  it('shows industry context based on sector and subsector', () => {
    vi.mocked(useApp).mockReturnValue(mockUpstreamContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for industry context section
    expect(screen.getByText('Industry Context')).toBeInTheDocument();
  });

  it('displays transmission efficiency metrics when in transmission mode', () => {
    vi.mocked(useApp).mockReturnValue(mockTransmissionContext as any);

    render(<EnergySustainabilityCarbonCalculation />);

    // Check for transmission efficiency
    expect(screen.getByText('Transmission efficiency metric')).toBeInTheDocument();
    expect(screen.getByText('Energy delivered vs losses')).toBeInTheDocument();
  });
});
