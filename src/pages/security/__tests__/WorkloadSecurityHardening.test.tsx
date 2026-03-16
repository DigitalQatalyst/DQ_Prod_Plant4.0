import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WorkloadSecurityHardening } from '../WorkloadSecurityHardening';
import * as workloadSecurityQueries from '@/lib/workloadSecurityQueries';
import type { WorkloadSecurity, WorkloadSecuritySummary } from '@/types/security';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      sector: 'transmission',
    },
  }),
}));

// Mock the queries
vi.mock('@/lib/workloadSecurityQueries');

// Mock the layout components
vi.mock('@/components/layout/ListPane', () => ({
  ListPane: ({ children, title, subtitle }: any) => (
    <div data-testid="list-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}));

vi.mock('@/components/layout/WorkPane', () => ({
  WorkPane: ({ title, subtitle, tabs, children }: any) => (
    <div data-testid="work-pane">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div>Tabs: {tabs?.length || 0}</div>
      {children}
    </div>
  ),
}));

const mockWorkload: WorkloadSecurity = {
  id: 'workload-1',
  tenantId: 'test-tenant-id',
  workloadName: 'SCADA Master Server',
  workloadType: 'scada_interface',
  workloadDescription: 'Primary SCADA master server',
  deploymentEnvironment: 'production',
  deploymentPlatform: 'vm',
  deploymentLocation: 'Dubai Control Center',
  status: 'active',
  healthStatus: 'healthy',
  securityBaselineId: 'IEC-62443-SCADA-001',
  baselineVersion: '2.1',
  baselineComplianceStatus: 'compliant',
  baselineComplianceScore: 95,
  lastBaselineAssessment: '2024-01-20T10:00:00Z',
  hardeningLevel: 'maximum',
  hardeningProfile: 'iec_62443',
  hardeningApplied: true,
  hardeningDate: '2024-01-01T00:00:00Z',
  hardeningStandards: ['IEC-62443', 'NERC-CIP'],
  osType: 'linux',
  osVersion: 'RHEL 8.6',
  osHardeningEnabled: true,
  osHardeningControls: ['selinux-enforcing', 'kernel-hardening'],
  firewallEnabled: true,
  firewallRulesCount: 45,
  antivirusEnabled: true,
  antivirusUpdated: true,
  antivirusLastScan: '2024-01-21T10:00:00Z',
  sshEnabled: true,
  sshKeyOnly: true,
  rdpEnabled: false,
  privilegedAccessRestricted: true,
  networkSegmentationEnabled: true,
  allowedInboundPorts: [443, 502],
  allowedOutboundPorts: [443, 502, 123],
  networkEncryptionEnabled: true,
  patchLevel: 'current',
  lastPatchedDate: '2024-01-15',
  pendingPatchesCount: 0,
  criticalPatchesPending: 0,
  autoPatchingEnabled: true,
  vulnerabilityScanEnabled: true,
  lastVulnerabilityScan: '2024-01-21T10:00:00Z',
  criticalVulnerabilities: 0,
  highVulnerabilities: 0,
  mediumVulnerabilities: 2,
  lowVulnerabilities: 5,
  configurationManagementEnabled: true,
  configurationDriftDetected: false,
  lastConfigurationCheck: '2024-01-22T04:00:00Z',
  loggingEnabled: true,
  logForwardingEnabled: true,
  logDestination: 'siem.dewa.ae',
  monitoringAgentInstalled: true,
  monitoringAgentVersion: '3.2.1',
  complianceFrameworks: ['IEC-62443', 'NERC-CIP-007'],
  lastAuditDate: '2023-10-22',
  nextAuditDate: '2024-04-22',
  auditFindingsCount: 0,
  securityContact: 'security@dewa.ae',
  technicalContact: 'scada-admin@dewa.ae',
  tags: ['critical', 'scada', 'production'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-22T10:00:00Z',
};

const mockSummary: WorkloadSecuritySummary = {
  tenantId: 'test-tenant-id',
  totalWorkloads: 8,
  healthyWorkloads: 6,
  degradedWorkloads: 2,
  criticalWorkloads: 0,
  offlineWorkloads: 0,
  averageComplianceScore: 85,
  workloadsWithCriticalVulnerabilities: 1,
  workloadsWithPendingPatches: 3,
  workloadsWithConfigDrift: 2,
  hardeningCoverage: 75,
  monitoringCoverage: 100,
  workloadsByEnvironment: {
    production: 6,
    staging: 1,
    development: 1,
    test: 0,
    disaster_recovery: 0
  },
  workloadsByType: {
    scada_interface: 2,
    application: 2,
    database: 1,
    web_server: 1,
    api_service: 1,
    data_processor: 0,
    historian: 0,
    hmi_server: 0,
    communication_gateway: 0
  },
  lastAssessment: '2024-01-22T10:00:00Z',
};

describe('WorkloadSecurityHardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workloadSecurityQueries.isWorkloadSecurityQueriesAvailable).mockReturnValue(true);
  });

  it('should render loading state initially', () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockImplementation(
      () => new Promise(() => { }) // Never resolves
    );
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockImplementation(
      () => new Promise(() => { })
    );

    render(<WorkloadSecurityHardening />);
    expect(screen.getByText('Loading workload security...')).toBeInTheDocument();
  });

  it('should render workload list when data is loaded', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([mockWorkload]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue(mockSummary);

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText('Workload Security Overview')).toBeInTheDocument();
      expect(screen.getByText('Workload Security Posture')).toBeInTheDocument();
      // Tabs should be 0 because no workload is selected
      expect(screen.getByText('Tabs: 0')).toBeInTheDocument();
    });
  });

  it('should display summary metrics', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([mockWorkload]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue(mockSummary);

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getAllByText(/Total Workloads/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('8').length).toBeGreaterThan(0);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument(); // Healthy workloads
  });

  it('should show transmission-specific title for transmission tenant', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([mockWorkload]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue(mockSummary);

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText('Workload Security Hardening')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Tenant - Transmission Operations')).toBeInTheDocument();
  });

  it('should display health status badge correctly', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([mockWorkload]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue(mockSummary);

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });
  });

  it('should display compliance score', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([mockWorkload]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue(mockSummary);

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText(/Compliance: 95%/)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockRejectedValue(
      new Error('Failed to load workloads')
    );
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockRejectedValue(
      new Error('Failed to load summary')
    );

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });
  });

  it('should handle empty workload list', async () => {
    vi.mocked(workloadSecurityQueries.getWorkloadSecurityList).mockResolvedValue([]);
    vi.mocked(workloadSecurityQueries.getWorkloadSecuritySummary).mockResolvedValue({
      ...mockSummary,
      totalWorkloads: 0,
    });

    render(<WorkloadSecurityHardening />);

    await waitFor(() => {
      expect(screen.getByText('No Workloads Configured')).toBeInTheDocument();
    });

    expect(
      screen.getByText('No transmission workloads configured for security hardening')
    ).toBeInTheDocument();
  });

  it('should handle Supabase not configured', () => {
    vi.mocked(workloadSecurityQueries.isWorkloadSecurityQueriesAvailable).mockReturnValue(false);

    render(<WorkloadSecurityHardening />);

    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(
      screen.getByText(/Supabase not configured/)
    ).toBeInTheDocument();
  });
});
