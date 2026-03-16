import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnergyAnalyticsWasteDetection } from '../EnergyAnalyticsWasteDetection';

// Mock the useApp hook
const mockUseApp = vi.fn();
vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp()
}));

// Mock the analytics provider
vi.mock('@/lib/data/providers/AnalyticsProvider', () => ({
  getAnalyticsProvider: () => ({
    getRecommendations: vi.fn().mockResolvedValue([])
  })
}));

// Mock chart components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />
}));

const mockUpstreamContext = {
  currentTenant: { id: 'test-tenant', name: 'Test Tenant' },
  sector: 'Oil & Gas',
  subsector: 'Upstream',
  energyMeters: [],
  energyTelemetry: {},
  upstreamProductionContext: {}
};

const mockTransmissionContext = {
  currentTenant: { id: 'test-tenant', name: 'Test Tenant' },
  sector: 'Power',
  subsector: 'Transmission',
  energyMeters: [],
  energyTelemetry: {},
  upstreamProductionContext: {}
};

describe('EnergyAnalyticsWasteDetection', () => {
  it('should render upstream waste detection correctly', () => {
    mockUseApp.mockReturnValue(mockUpstreamContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should show upstream-specific waste categories
    expect(screen.getByText('ESP Standby Power Waste')).toBeInTheDocument();
    expect(screen.getByText('Gas Compressor Operating Inefficiency')).toBeInTheDocument();
    expect(screen.getByText('Total Energy Waste')).toBeInTheDocument();
  });

  it('should render transmission waste detection correctly', () => {
    mockUseApp.mockReturnValue(mockTransmissionContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should show transmission-specific waste categories
    expect(screen.getByText('Excessive Grid Losses - Main Substation')).toBeInTheDocument();
    expect(screen.getByText('Off-Hours Consumption - Distribution Feeders')).toBeInTheDocument();
    expect(screen.getByText('Total Grid Waste')).toBeInTheDocument();
  });

  it('should show transmission context filters when in transmission mode', () => {
    mockUseApp.mockReturnValue(mockTransmissionContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should show transmission-specific filters
    expect(screen.getByText('Transmission Context Filters')).toBeInTheDocument();
    expect(screen.getByText('Substation')).toBeInTheDocument();
    expect(screen.getByText('Feeder')).toBeInTheDocument();
  });

  it('should not show transmission filters in upstream mode', () => {
    mockUseApp.mockReturnValue(mockUpstreamContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should not show transmission-specific filters
    expect(screen.queryByText('Transmission Context Filters')).not.toBeInTheDocument();
  });

  it('should display transmission-specific waste patterns', () => {
    mockUseApp.mockReturnValue(mockTransmissionContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should show transmission-specific waste types
    expect(screen.getByText(/Grid losses exceeding 3.2% benchmark/)).toBeInTheDocument();
    expect(screen.getByText(/Off-peak hours.*minimal load expected/)).toBeInTheDocument();
    expect(screen.getByText(/Transformer operating at suboptimal efficiency/)).toBeInTheDocument();
  });

  it('should show transmission-specific recommendations', () => {
    mockUseApp.mockReturnValue(mockTransmissionContext);
    
    render(<EnergyAnalyticsWasteDetection />);

    // Should show transmission-specific recommendations
    expect(screen.getByText('Transmission Optimization Actions')).toBeInTheDocument();
    expect(screen.getByText(/Inspect transformer tap changer positions/)).toBeInTheDocument();
    expect(screen.getByText(/Implement automated load shedding/)).toBeInTheDocument();
  });
});