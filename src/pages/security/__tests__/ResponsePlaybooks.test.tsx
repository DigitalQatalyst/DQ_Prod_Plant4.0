import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ResponsePlaybooks } from '../ResponsePlaybooks';
import { useApp } from '@/context/AppContext';
import * as threatMonitoringQueries from '@/lib/threatMonitoringQueries';

// Mock the context
vi.mock('@/context/AppContext');
const mockUseApp = vi.mocked(useApp);

// Mock the queries
vi.mock('@/lib/threatMonitoringQueries');
const mockGetResponsePlaybooks = vi.mocked(threatMonitoringQueries.getResponsePlaybooks);
const mockGetPlaybookExecutions = vi.mocked(threatMonitoringQueries.getPlaybookExecutions);

// Mock the layout components
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

const mockTenant = {
  id: 'tenant-1',
  name: 'Test Transmission Utility',
  industry: 'utilities' as const,
};

const mockPlaybook = {
  id: 'playbook-1',
  tenantId: 'tenant-1',
  name: 'Grid Isolation Response',
  description: 'Emergency response for grid isolation incidents',
  version: '1.0',
  category: 'grid-isolation',
  triggerType: 'security-incident' as const,
  triggerConditions: {},
  autoExecute: false,
  applicableThreatCategories: ['switching-manipulation'],
  applicableAssetTypes: ['transformer', 'circuit-breaker'],
  applicableProtocols: ['IEC-61850'],
  severityThreshold: 'high' as const,
  objectives: ['Isolate affected grid segment', 'Maintain system stability'],
  prerequisites: ['Verify incident scope', 'Confirm authorization'],
  estimatedDurationMinutes: 30,
  requiredRoles: ['control-room-operator', 'transmission-engineer'],
  requiredPermissions: ['grid-operations', 'emergency-response'],
  status: 'active' as const,
  isTemplate: false,
  createdBy: 'system',
  approvedBy: 'transmission-manager',
  approvedAt: '2024-01-15T10:00:00Z',
  executionCount: 5,
  successRate: 80,
  lastExecuted: '2024-01-10T14:30:00Z',
  tags: ['critical', 'transmission'],
  customFields: {},
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockExecution = {
  id: 'execution-1',
  playbookId: 'playbook-1',
  tenantId: 'tenant-1',
  triggeredBy: 'manual' as const,
  triggerSourceId: 'alert-123',
  executedBy: 'operator-1',
  executionStatus: 'completed' as const,
  startedAt: '2024-01-10T14:30:00Z',
  completedAt: '2024-01-10T15:00:00Z',
  createdAt: '2024-01-10T14:30:00Z',
  updatedAt: '2024-01-10T15:00:00Z',
};

describe('ResponsePlaybooks', () => {
  beforeEach(() => {
    mockUseApp.mockReturnValue({
      currentTenant: mockTenant,
      setCurrentTenant: vi.fn(),
    });

    mockGetResponsePlaybooks.mockResolvedValue([mockPlaybook]);
    mockGetPlaybookExecutions.mockResolvedValue([mockExecution]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the response playbooks page', async () => {
    render(<ResponsePlaybooks />);

    expect(screen.getByText('Response Playbooks')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockGetResponsePlaybooks).toHaveBeenCalledWith('tenant-1');
      expect(mockGetPlaybookExecutions).toHaveBeenCalledWith('tenant-1', { limit: 50 });
    });
  });

  it('displays playbook information correctly', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      expect(screen.getByText('Grid Isolation Response')).toBeInTheDocument();
      expect(screen.getByText('Emergency response for grid isolation incidents')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('shows transmission-specific categories', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      expect(screen.getByText('Grid Isolation')).toBeInTheDocument();
    });
  });

  it('displays execution count when available', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      expect(screen.getByText('5 executions')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockGetResponsePlaybooks.mockImplementation(() => new Promise(() => {}));
    
    render(<ResponsePlaybooks />);
    
    expect(screen.getByText('Loading response playbooks...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load playbooks';
    mockGetResponsePlaybooks.mockRejectedValue(new Error(errorMessage));
    
    render(<ResponsePlaybooks />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Playbooks')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('filters playbooks by status', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      const statusFilter = screen.getByDisplayValue('All Statuses');
      expect(statusFilter).toBeInTheDocument();
    });
  });

  it('filters playbooks by category', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      // Check that transmission-specific categories are available in the select options
      expect(screen.getByRole('option', { name: 'Switching Manipulation' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Relay Tampering' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'SCADA Compromise' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Protocol Abuse' })).toBeInTheDocument();
    });
  });

  it('shows critical playbook indicator', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });
  });

  it('displays work pane when playbook is selected', async () => {
    render(<ResponsePlaybooks />);

    await waitFor(() => {
      expect(screen.getByTestId('work-pane')).toBeInTheDocument();
      expect(screen.getAllByText('Grid Isolation Response')).toHaveLength(2); // One in list, one in work pane
    });
  });
});