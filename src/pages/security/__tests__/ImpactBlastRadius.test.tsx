import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ImpactBlastRadius } from '../ImpactBlastRadius';
import { useApp } from '@/context/AppContext';
import * as threatMonitoringQueries from '@/lib/threatMonitoringQueries';

// Mock the context
vi.mock('@/context/AppContext');
const mockUseApp = vi.mocked(useApp);

// Mock the queries
vi.mock('@/lib/threatMonitoringQueries');
const mockGetImpactAssessments = vi.mocked(threatMonitoringQueries.getImpactAssessments);
const mockGetImpactScenarios = vi.mocked(threatMonitoringQueries.getImpactScenarios);
const mockGetCascadeAnalysis = vi.mocked(threatMonitoringQueries.getCascadeAnalysis);

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

// Mock loading and empty state components
vi.mock('@/components/shared/LoadingState', () => ({
  LoadingState: ({ message }: { message: string }) => (
    <div data-testid="loading-state">{message}</div>
  ),
}));

vi.mock('@/components/shared/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

const mockImpactAssessments = [
  {
    id: 'assessment-001',
    tenantId: 'tenant-001',
    name: 'Substation Alpha Outage Impact',
    description: 'Assessment of cascading impact from Substation Alpha failure',
    assessmentType: 'incident' as const,
    overallSeverity: 'major' as const,
    status: 'completed' as const,
    assessmentDate: '2024-01-20T10:00:00Z',
    assessedBy: 'grid-analyst-001',
    customersAffected: 15000,
    mwAtRisk: 250,
    estimatedOutageDurationHours: 6,
    estimatedRecoveryTimeHours: 12,
    estimatedCostUsd: 500000,
    revenueLossUsd: 200000,
    regulatoryFinesUsd: 50000,
    blastRadiusKm: 15.5,
    cascadePotential: true,
    isolationPossible: true,
    backupPathsAvailable: true,
    affectedSites: ['site-001', 'site-002'],
    affectedAssets: ['transformer-001', 'breaker-001'],
    affectedGridNodes: ['node-001', 'node-002'],
    affectedGridLines: ['line-001', 'line-002'],
    affectedVoltageLevels: ['132kV', '33kV'],
    primarySiteId: 'site-001',
    primaryGridNodeId: 'node-001',
    primaryGridLineId: 'line-001',
    impactCategories: ['power-outage', 'customer-impact', 'revenue-loss'],
    safetyRiskLevel: 3,
    publicSafetyConcern: false,
    environmentalImpact: 'Minimal environmental impact expected',
    confidenceLevel: 0.85,
    assessmentMethodology: 'Grid topology analysis with load flow simulation',
    assumptions: [
      'Normal weather conditions',
      'All protection systems functioning',
      'Standard load profile'
    ],
    limitations: [
      'Does not account for extreme weather',
      'Assumes no simultaneous failures'
    ],
    mitigationStrategies: [
      'Activate backup feeders',
      'Load transfer to adjacent substations',
      'Emergency generation deployment'
    ],
    contingencyPlans: [
      'Mobile substation deployment',
      'Customer load shedding',
      'Alternative supply arrangements'
    ],
    recoveryProcedures: [
      'System isolation and testing',
      'Gradual load restoration',
      'Full system verification'
    ],
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z'
  },
  {
    id: 'assessment-002',
    tenantId: 'tenant-001',
    name: 'Transmission Line Beta Failure',
    description: 'Impact assessment for transmission line failure scenario',
    assessmentType: 'scenario' as const,
    overallSeverity: 'moderate' as const,
    status: 'in-progress' as const,
    assessmentDate: '2024-01-20T14:00:00Z',
    assessedBy: 'system-planner-001',
    customersAffected: 8000,
    mwAtRisk: 120,
    estimatedOutageDurationHours: 3,
    estimatedRecoveryTimeHours: 8,
    blastRadiusKm: 8.2,
    cascadePotential: false,
    isolationPossible: true,
    backupPathsAvailable: true,
    affectedSites: ['site-003'],
    affectedAssets: ['line-beta-001'],
    affectedGridNodes: ['node-003'],
    affectedGridLines: ['line-003'],
    affectedVoltageLevels: ['132kV'],
    primarySiteId: 'site-003',
    primaryGridNodeId: 'node-003',
    primaryGridLineId: 'line-003',
    impactCategories: ['power-outage', 'customer-impact'],
    safetyRiskLevel: 2,
    publicSafetyConcern: false,
    confidenceLevel: 0.75,
    assessmentMethodology: 'Standard contingency analysis',
    assumptions: ['Normal operating conditions'],
    limitations: ['Limited to single contingency'],
    mitigationStrategies: ['Reroute power through alternate paths'],
    contingencyPlans: ['Load shedding if required'],
    recoveryProcedures: ['Line repair and restoration'],
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  }
];

const mockImpactScenarios = [
  {
    id: 'scenario-001',
    tenantId: 'tenant-001',
    scenarioName: 'Major Substation Failure',
    scenarioType: 'equipment-failure' as const,
    probability: 0.15,
    isActive: true,
    responsePlaybookId: 'playbook-001',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  }
];

const mockCascadeAnalysis = [
  {
    id: 'cascade-001',
    assessmentId: 'assessment-001',
    tenantId: 'tenant-001',
    cascadeStep: 1,
    cascadeType: 'voltage-collapse' as const,
    propagationTimeSeconds: 15,
    loadShedMw: 50,
    customersLost: 3000,
    voltageImpact: 12,
    probability: 0.8,
    protectionSystems: ['UFLS', 'UVLS'],
    automaticControls: ['Load shedding', 'Voltage regulation'],
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  }
];

describe('ImpactBlastRadius', () => {
  beforeEach(() => {
    mockUseApp.mockReturnValue({
      currentTenant: {
        id: 'tenant-001',
        name: 'Test Transmission Company',
      },
    } as any);

    mockGetImpactAssessments.mockResolvedValue(mockImpactAssessments);
    mockGetImpactScenarios.mockResolvedValue(mockImpactScenarios);
    mockGetCascadeAnalysis.mockResolvedValue(mockCascadeAnalysis);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders impact assessments list correctly', async () => {
    render(<ImpactBlastRadius />);

    // Wait for assessments to load
    await waitFor(() => {
      expect(screen.getByTestId('list-pane')).toBeInTheDocument();
      expect(screen.getByText('Impact & Blast Radius Analysis')).toBeInTheDocument();
      expect(screen.getByText('Test Transmission Company')).toBeInTheDocument();
      expect(screen.getByText('Count: 2')).toBeInTheDocument();
    });
  });

  it('displays assessment names and types', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(screen.getAllByText('Substation Alpha Outage Impact')).toHaveLength(2);
      expect(screen.getByText('Transmission Line Beta Failure')).toBeInTheDocument();
    });
  });

  it('shows assessment severity levels', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(screen.getByText('major')).toBeInTheDocument();
      expect(screen.getByText('moderate')).toBeInTheDocument();
    });
  });

  it('displays assessment status', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('in-progress')).toBeInTheDocument();
    });
  });

  it('shows cascade potential indicators', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(screen.getByText('CASCADE')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    mockGetImpactAssessments.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ImpactBlastRadius />);
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Loading impact assessments...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockGetImpactAssessments.mockRejectedValue(new Error('Failed to load assessments'));
    
    render(<ImpactBlastRadius />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load assessments')).toBeInTheDocument();
    });
  });

  it('calls impact assessment queries with correct parameters', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(mockGetImpactAssessments).toHaveBeenCalledWith('tenant-001', {
        limit: 100
      });
      expect(mockGetImpactScenarios).toHaveBeenCalledWith('tenant-001');
    });
  });

  it('handles empty assessment list', async () => {
    mockGetImpactAssessments.mockResolvedValue([]);
    mockGetImpactScenarios.mockResolvedValue([]);
    
    render(<ImpactBlastRadius />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No impact assessments found')).toBeInTheDocument();
    });
  });

  it('shows transmission-specific terminology', async () => {
    render(<ImpactBlastRadius />);

    await waitFor(() => {
      expect(screen.getByText('Impact & Blast Radius Analysis')).toBeInTheDocument();
    });
  });
});