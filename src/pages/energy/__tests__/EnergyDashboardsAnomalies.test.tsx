import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnergyDashboardsAnomalies } from '../EnergyDashboardsAnomalies';
import { BrowserRouter } from 'react-router-dom';

// Mock the AppContext with transmission data
const mockUseApp = vi.fn();

vi.mock('@/context/AppContext', () => ({
  useApp: () => mockUseApp(),
}));

describe('EnergyDashboardsAnomalies - Transmission Integration', () => {
  beforeEach(() => {
    mockUseApp.mockReturnValue({
      energyMeters: [
        {
          id: 'tx-meter-ss1-incomer',
          name: 'Central SS Grid Incomer',
          status: 'Normal',
          energy_types: ['electricity'],
        },
        {
          id: 'tx-meter-ss2-feeder',
          name: 'North SS Feeder 132-B',
          status: 'Normal',
          energy_types: ['electricity'],
        },
      ],
      upstreamEnergyAnomalies: [],
      transmissionEnergyAnomalies: [
        {
          id: 'tx-anom-001',
          meterId: 'tx-meter-ss1-incomer',
          timestamp: '2024-12-16T14:30:00Z',
          type: 'grid_losses',
          magnitudePct: 18,
          severity: 'High',
          description: 'Excessive transmission losses detected on 220kV line',
          resolved: false,
          estimatedCostImpact: 2500,
          substationName: 'Central Substation',
          substationId: 'ss-central',
          feederName: 'Feeder 220-A',
          feederId: 'feeder-220a',
          voltageLevel: 220,
        },
        {
          id: 'tx-anom-002',
          meterId: 'tx-meter-ss2-feeder',
          timestamp: '2024-12-16T09:45:00Z',
          type: 'voltage_deviation',
          magnitudePct: 12,
          severity: 'Medium',
          description: 'Voltage sag detected on 132kV feeder during peak load',
          resolved: false,
          estimatedCostImpact: 1200,
          substationName: 'North Substation',
          substationId: 'ss-north',
          feederName: 'Feeder 132-B',
          feederId: 'feeder-132b',
          voltageLevel: 132,
        },
        {
          id: 'tx-anom-003',
          meterId: 'tx-meter-ss1-incomer',
          timestamp: '2024-12-16T16:20:00Z',
          type: 'load_imbalance',
          magnitudePct: 25,
          severity: 'Critical',
          description: 'Severe load imbalance across transformer phases',
          resolved: false,
          estimatedCostImpact: 3500,
          substationName: 'Central Substation',
          substationId: 'ss-central',
          feederName: 'Transformer T1',
          feederId: 'transformer-t1',
          voltageLevel: 220,
        },
      ],
      sector: 'Power',
      subsector: 'Transmission',
      currentTenant: { id: 't-transmission', name: 'Transmission Grid Operator' },
    });
  });

  it('should render transmission-specific anomaly types in filter dropdown', () => {
    render(
      <BrowserRouter>
        <EnergyDashboardsAnomalies />
      </BrowserRouter>
    );

    // Find the type filter dropdown
    const typeFilter = screen.getAllByRole('combobox')[0];
    expect(typeFilter).toBeInTheDocument();

    // Check for transmission-specific options in the select
    expect(typeFilter.innerHTML).toContain('Grid Losses');
    expect(typeFilter.innerHTML).toContain('Voltage Deviation');
    expect(typeFilter.innerHTML).toContain('Load Imbalance');
  });

  it('should display transmission anomaly types', () => {
    render(
      <BrowserRouter>
        <EnergyDashboardsAnomalies />
      </BrowserRouter>
    );

    // Check that transmission anomaly types are rendered
    const pageContent = document.body.textContent || '';
    expect(pageContent).toContain('grid losses');
    expect(pageContent).toContain('voltage deviation');
    expect(pageContent).toContain('load imbalance');
  });

  it('should show transmission context in list items', () => {
    render(
      <BrowserRouter>
        <EnergyDashboardsAnomalies />
      </BrowserRouter>
    );

    // The anomaly types should be visible in the list
    const listItems = screen.getAllByRole('button', { name: /grid_losses|voltage_deviation|load_imbalance/ });
    expect(listItems.length).toBeGreaterThan(0);
  });

  it('should display correct anomaly count', () => {
    render(
      <BrowserRouter>
        <EnergyDashboardsAnomalies />
      </BrowserRouter>
    );

    // Check that we have 3 anomalies displayed
    const pageContent = document.body.textContent || '';
    expect(pageContent).toContain('3');
  });
});

describe('EnergyDashboardsAnomalies - Upstream Compatibility', () => {
  it('should not show transmission anomaly types for upstream sector', () => {
    mockUseApp.mockReturnValue({
      energyMeters: [],
      upstreamEnergyAnomalies: [
        {
          id: 'anom-001',
          meterId: 'em-wh-01',
          timestamp: '2024-12-16T14:30:00Z',
          type: 'spike',
          magnitudePct: 25,
          severity: 'Medium',
          description: 'Unexpected demand spike',
          resolved: false,
          estimatedCostImpact: 150,
        },
      ],
      transmissionEnergyAnomalies: [],
      sector: 'Oil & Gas',
      subsector: 'Upstream',
      currentTenant: { id: 't-upstream', name: 'Upstream Operator' },
    });

    render(
      <BrowserRouter>
        <EnergyDashboardsAnomalies />
      </BrowserRouter>
    );

    // Find the type filter dropdown
    const typeFilter = screen.getAllByRole('combobox')[0];

    // Transmission-specific types should NOT be present
    expect(typeFilter.innerHTML).not.toContain('Grid Losses');
    expect(typeFilter.innerHTML).not.toContain('Voltage Deviation');
    expect(typeFilter.innerHTML).not.toContain('Load Imbalance');

    // Upstream types should be present
    expect(typeFilter.innerHTML).toContain('Spike');
    expect(typeFilter.innerHTML).toContain('Baseline Drift');
    expect(typeFilter.innerHTML).toContain('Standby Waste');
  });
});

