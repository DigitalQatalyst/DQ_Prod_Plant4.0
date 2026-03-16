import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { IncidentCases } from '../IncidentCases';
import { useApp } from '@/context/AppContext';
import * as threatMonitoringQueries from '@/lib/threatMonitoringQueries';

// Mock the context
vi.mock('@/context/AppContext');
const mockUseApp = vi.mocked(useApp);

// Mock the queries
vi.mock('@/lib/threatMonitoringQueries');
const mockGetIncidentCases = vi.mocked(threatMonitoringQueries.getIncidentCases);

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
      <div>Tabs: {tabs?.length || 0}</div>
    </div>
  ),
}));

const mockIncidentCases = [
  {
    id: 'incident-001',
    tenantId: 'tenant-001',
    incidentNumber: 'INC-2024-001',
    title: 'Unauthorized Access to Substation Control System',
    description: 'Suspicious login attempts detected on substation SCADA system',
    incidentType: 'unauthorized-access' as const,
    severity: 'high' as const,
    priority: 'p2-high' as const,
    status: 'investigating' as const,
    assignedTo: 'security-analyst-001',
    createdBy: 'system-monitor',
    affectedSites: ['substation-001'],
    affectedAssets: ['scada-001', 'hmi-001'],
    affectedGridNodes: ['node-001'],
    affectedGridLines: ['line-001'],
    reportedAt: '2024-01-20T10:00:00Z',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
    customersAffected: 0,
    systemsCompromised: 1,
    indicatorsOfCompromise: ['unusual-login-pattern'],
    containmentActions: ['Isolated affected system'],
    eradicationActions: [],
    recoveryActions: [],
    stakeholdersNotified: ['security-team'],
    externalNotifications: [],
    communicationLog: [],
    evidenceCollected: [],
    forensicImages: [],
    logSources: ['auth-logs', 'scada-logs'],
    responseActions: ['System isolation', 'Log analysis initiated'],
  },
  {
    id: 'incident-002',
    tenantId: 'tenant-001',
    incidentNumber: 'INC-2024-002',
    title: 'Malware Detection on Protection Relay',
    description: 'Malware signature detected on transmission protection relay',
    incidentType: 'malware-infection' as const,
    severity: 'critical' as const,
    priority: 'p1-critical' as const,
    status: 'contained' as const,
    assignedTo: 'incident-commander-001',
    createdBy: 'antivirus-system',
    affectedSites: ['substation-002'],
    affectedAssets: ['relay-001'],
    affectedGridNodes: ['node-002'],
    affectedGridLines: [],
    reportedAt: '2024-01-20T14:00:00Z',
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
    customersAffected: 5000,
    systemsCompromised: 1,
    indicatorsOfCompromise: ['malware-hash-123'],
    containmentActions: ['Relay isolated', 'Backup protection activated'],
    eradicationActions: ['Malware removed'],
    recoveryActions: ['System restored'],
    stakeholdersNotified: ['operations-center', 'management'],
    externalNotifications: ['regulatory-authority'],
    communicationLog: [],
    evidenceCollected: ['malware-sample'],
    forensicImages: ['relay-memory-dump'],
    logSources: ['relay-logs', 'network-logs'],
  },
];

describe('IncidentCases', () => {
  beforeEach(() => {
    mockUseApp.mockReturnValue({
      currentTenant: {
        id: 'tenant-001',
        name: 'Test Transmission Company',
      },
    } as any);

    mockGetIncidentCases.mockResolvedValue(mockIncidentCases);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders incident cases list correctly', async () => {
    render(<IncidentCases />);

    // Check that the component renders
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByText('Security Incident Cases')).toBeInTheDocument();
    expect(screen.getByText('Test Transmission Company')).toBeInTheDocument();

    // Wait for incidents to load
    await waitFor(() => {
      expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });

    // Check that incidents are displayed
    expect(screen.getByText('Unauthorized Access to Substation Control System')).toBeInTheDocument();
    expect(screen.getByText('Malware Detection on Protection Relay')).toBeInTheDocument();
  });

  it('displays incident severity and status correctly', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('investigating')).toBeInTheDocument();
      expect(screen.getByText('contained')).toBeInTheDocument();
    });
  });

  it('shows transmission-specific incident types', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      expect(screen.getByText('unauthorized access')).toBeInTheDocument();
      expect(screen.getByText('malware infection')).toBeInTheDocument();
    });
  });

  it('displays affected sites and assets count', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      // Should show site counts
      expect(screen.getAllByText(/1 site/)).toHaveLength(2);
    });
  });

  it('handles loading state', () => {
    mockGetIncidentCases.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<IncidentCases />);
    
    expect(screen.getByText('Loading incident cases...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockGetIncidentCases.mockRejectedValue(new Error('Failed to load incidents'));
    
    render(<IncidentCases />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Incidents')).toBeInTheDocument();
      expect(screen.getByText('Failed to load incidents')).toBeInTheDocument();
    });
  });

  it('calls getIncidentCases with correct parameters', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      expect(mockGetIncidentCases).toHaveBeenCalledWith('tenant-001', {
        limit: 100
      });
    });
  });

  it('filters incidents by severity', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('all')).toBeInTheDocument();
    });

    // Check that filter options are available
    const severityFilter = screen.getByDisplayValue('all');
    expect(severityFilter).toBeInTheDocument();
  });

  it('shows priority indicators for critical incidents', async () => {
    render(<IncidentCases />);

    await waitFor(() => {
      expect(screen.getByText('P1')).toBeInTheDocument();
    });
  });
});