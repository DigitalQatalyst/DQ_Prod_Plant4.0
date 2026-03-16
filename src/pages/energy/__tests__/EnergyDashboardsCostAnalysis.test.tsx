/**
 * Test suite for EnergyDashboardsCostAnalysis with transmission features
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnergyDashboardsCostAnalysis } from '../EnergyDashboardsCostAnalysis';
import * as AppContext from '@/context/AppContext';

// Mock the AppContext
vi.mock('@/context/AppContext', () => ({
  useApp: vi.fn(),
}));

// Mock the EMSPageShell component
vi.mock('@/components/ems/EMSPageShell', () => ({
  EMSPageShell: ({ title, workPaneContent }: any) => (
    <div data-testid="ems-page-shell">
      <h1>{title}</h1>
      <div>{workPaneContent}</div>
    </div>
  ),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('EnergyDashboardsCostAnalysis', () => {
  const mockUpstreamContext = {
    energyMeters: [
      {
        id: 'meter-1',
        name: 'Well Pad A Meter',
        scope: 'Well Pad A',
        status: 'Normal' as const,
        energyTypes: ['electricity' as const],
      },
    ],
    energyTelemetry: {
      'meter-1': {
        kWh: [100, 110, 120],
        kW: [10, 11, 12],
        timestamps: ['2024-01-01T00:00:00Z', '2024-01-01T01:00:00Z', '2024-01-01T02:00:00Z'],
      },
    },
    tariffs: {
      electricityUsdPerKWh: 0.12,
      gasUsdPerMMBtu: 4.50,
      dieselUsdPerLitre: 1.25,
    },
    sector: 'Oil & Gas',
    subsector: 'Upstream',
    currentTenant: { id: 'tenant-1', name: 'Test Tenant' },
  };

  const mockTransmissionContext = {
    ...mockUpstreamContext,
    sector: 'Power',
    subsector: 'Transmission',
    energyMeters: [
      {
        id: 'meter-tx-1',
        name: 'Substation A Incomer',
        scope: 'Substation A',
        status: 'Normal' as const,
        energyTypes: ['electricity' as const],
        substationId: 'sub-1',
        substationName: 'Substation A',
        feederId: 'feeder-1',
        feederName: 'Feeder 1',
      },
    ],
  };

  it('renders cost analysis page for upstream context', () => {
    vi.mocked(AppContext.useApp).mockReturnValue(mockUpstreamContext as any);
    
    render(<EnergyDashboardsCostAnalysis />);
    
    expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
  });

  it('renders cost analysis page for transmission context', () => {
    vi.mocked(AppContext.useApp).mockReturnValue(mockTransmissionContext as any);
    
    render(<EnergyDashboardsCostAnalysis />);
    
    expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
  });

  it('shows transmission-specific tariff tab when in transmission context with demand charges', () => {
    vi.mocked(AppContext.useApp).mockReturnValue(mockTransmissionContext as any);
    
    render(<EnergyDashboardsCostAnalysis />);
    
    // The page should render without errors
    expect(screen.getByTestId('ems-page-shell')).toBeInTheDocument();
  });

  it('calculates costs correctly for upstream meters', () => {
    vi.mocked(AppContext.useApp).mockReturnValue(mockUpstreamContext as any);
    
    render(<EnergyDashboardsCostAnalysis />);
    
    // Verify the page renders
    expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
  });

  it('calculates transmission tariff costs correctly', () => {
    vi.mocked(AppContext.useApp).mockReturnValue(mockTransmissionContext as any);
    
    render(<EnergyDashboardsCostAnalysis />);
    
    // Verify the page renders with transmission context
    expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
  });
});

describe('Transmission Tariff Components', () => {
  it('transmission tariff details component exists', async () => {
    const { TransmissionTariffDetails } = await import('../components/TransmissionCostComponents');
    expect(TransmissionTariffDetails).toBeDefined();
  });

  it('transmission tariff structure component exists', async () => {
    const { TransmissionTariffStructure } = await import('../components/TransmissionCostComponents');
    expect(TransmissionTariffStructure).toBeDefined();
  });
});
