import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AnomalySignals } from '../AnomalySignals';
import { useApp } from '@/context/AppContext';
import * as threatMonitoringQueries from '@/lib/threatMonitoringQueries';
import type { AnomalySignal } from '@/types/security';

// Mock the context
vi.mock('@/context/AppContext');
const mockUseApp = vi.mocked(useApp);

// Mock the threat monitoring queries
vi.mock('@/lib/threatMonitoringQueries', () => ({
  getAnomalySignals: vi.fn(),
  updateAnomalySignal: vi.fn(),
  getBehavioralBaselines: vi.fn(),
}));

// Mock the layout components
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle, count }: any) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <span>Count: {count}</span>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs }: any) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {tabs && tabs.map((tab: any, index: number) => (
        <div key={index} data-testid={`tab-${tab.id}`}>
          {tab.content}
        </div>
      ))}
    </div>
  ),
}));

// Mock data
const mockAnomalies: AnomalySignal[] = [
  {
    id: 'anomaly-001',
    tenantId: 'tenant-001',
    siteId: 'site-001',
    assetId: 'asset-001',
    signalName: 'Voltage Deviation Alert',
    anomalyType: 'voltage-deviation',
    severity: 'critical',
    status: 'new',
    detectedAt: '2024-01-15T10:30:00Z',
    observedValue: 245.5,
    expectedValue: 230.0,
    deviationPercentage: 6.7,
    parameterName: 'Voltage',
    unit: 'V',
    baselineValue: 230.0,
    correlatedEvents: ['switching-event', 'load-change'],
    analysisNotes: 'Voltage spike detected during switching operation',
    contextData: {},
    rawData: {},
    contributingFactors: [],
    relatedAlerts: [],
    relatedIncidents: [],
    affectedSystems: [],
    isSuppressed: false,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'anomaly-002',
    tenantId: 'tenant-001',
    siteId: 'site-002',
    assetId: 'asset-002',
    signalName: 'Frequency Anomaly',
    anomalyType: 'frequency-anomaly',
    severity: 'medium',
    status: 'investigating',
    detectedAt: '2024-01-15T11:00:00Z',
    observedValue: 49.8,
    expectedValue: 50.0,
    deviationPercentage: -0.4,
    parameterName: 'Frequency',
    unit: 'Hz',
    baselineValue: 50.0,
    correlatedEvents: [],
    analysisNotes: 'Minor frequency deviation observed',
    contextData: {},
    rawData: {},
    contributingFactors: [],
    relatedAlerts: [],
    relatedIncidents: [],
    affectedSystems: [],
    isSuppressed: false,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z'
  }
];

const mockTenant = {
  id: 'tenant-001',
  name: 'Test Transmission Company',
  industry: 'utilities' as const
};

describe('AnomalySignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useApp hook
    mockUseApp.mockReturnValue({
      currentTenant: mockTenant,
      setCurrentTenant: vi.fn(),
      currentSector: 'Utilities',
      setCurrentSector: vi.fn(),
      currentSubsector: 'Transmission',
      setCurrentSubsector: vi.fn(),
      sectorSwitchingEnabled: false,
      setSectorSwitchingEnabled: vi.fn(),
      showSectorModal: false,
      setShowSectorModal: vi.fn(),
      isLoading: false,
      setIsLoading: vi.fn()
    });
    
    vi.mocked(threatMonitoringQueries.getAnomalySignals).mockResolvedValue(mockAnomalies);
    vi.mocked(threatMonitoringQueries.updateAnomalySignal).mockResolvedValue(mockAnomalies[0]);
  });

  it('renders anomaly signals list', async () => {
    render(<AnomalySignals />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Check if anomalies are displayed
    expect(screen.getByText('Voltage Deviation')).toBeInTheDocument();
    expect(screen.getByText('Frequency Anomaly')).toBeInTheDocument();
  });

  it('displays anomaly details correctly', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Check critical anomaly indicators
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('+6.7%')).toBeInTheDocument();
    expect(screen.getByText('Voltage: 245.5 V')).toBeInTheDocument();
  });

  it('filters anomalies by type', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Find and use the type filter
    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'voltage-deviation' } });

    // Should still show voltage deviation anomaly
    expect(screen.getByText('Voltage Deviation')).toBeInTheDocument();
  });

  it('filters anomalies by severity', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Find and use the severity filter
    const severityFilter = screen.getByDisplayValue('All Severities');
    fireEvent.change(severityFilter, { target: { value: 'critical' } });

    // Should show critical anomaly
    expect(screen.getByText('Voltage Deviation')).toBeInTheDocument();
  });

  it('selects anomaly and shows details', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Click on an anomaly
    const anomalyItem = screen.getByText('Voltage Deviation');
    fireEvent.click(anomalyItem);

    // Should show anomaly details in work pane
    await waitFor(() => {
      expect(screen.getByText('Voltage Deviation - new')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    vi.mocked(threatMonitoringQueries.getAnomalySignals).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AnomalySignals />);

    expect(screen.getByText('Loading anomaly signals...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(threatMonitoringQueries.getAnomalySignals).mockRejectedValue(
      new Error('Failed to load anomalies')
    );

    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Anomalies')).toBeInTheDocument();
      expect(screen.getByText('Failed to load anomalies')).toBeInTheDocument();
    });
  });

  it('displays transmission-specific anomaly types', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Check that transmission-specific types are available in filter
    const typeFilter = screen.getByDisplayValue('All Types');
    expect(typeFilter).toBeInTheDocument();
    
    // Check for transmission-specific options in the select
    const options = screen.getAllByRole('option');
    const optionTexts = options.map(option => option.textContent);
    
    expect(optionTexts).toContain('Voltage Deviation');
    expect(optionTexts).toContain('Frequency Anomaly');
    expect(optionTexts).toContain('Protection Relay Trip');
    expect(optionTexts).toContain('Transformer Overload');
  });

  it('shows baseline comparison for anomalies', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Click on an anomaly to select it
    const anomalyItem = screen.getByText('Voltage Deviation');
    fireEvent.click(anomalyItem);

    // Check if baseline comparison tab is available
    await waitFor(() => {
      expect(screen.getByText('Baseline Comparison')).toBeInTheDocument();
    });
  });

  it('displays correlated events', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Click on an anomaly to select it
    const anomalyItem = screen.getByText('Voltage Deviation');
    fireEvent.click(anomalyItem);

    // Check if correlations tab is available
    await waitFor(() => {
      expect(screen.getByText('Correlations')).toBeInTheDocument();
    });
  });

  it('shows recommended actions for critical anomalies', async () => {
    render(<AnomalySignals />);

    await waitFor(() => {
      expect(screen.queryByText('Loading anomaly signals...')).not.toBeInTheDocument();
    });

    // Click on the critical anomaly
    const anomalyItem = screen.getByText('Voltage Deviation');
    fireEvent.click(anomalyItem);

    // Check if actions tab is available
    await waitFor(() => {
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});