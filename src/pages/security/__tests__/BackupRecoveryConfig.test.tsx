import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BackupRecoveryConfig } from '../BackupRecoveryConfig';
import * as backupRecoveryQueries from '@/lib/backupRecoveryQueries';

// Mock the context
vi.mock('@/context/AppContext', () => ({
  useApp: () => ({
    currentTenant: {
      id: 'test-tenant-id',
      name: 'Test Transmission Utility',
      sector: 'transmission',
    },
  }),
}));

// Mock the queries
vi.mock('@/lib/backupRecoveryQueries');

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

describe('BackupRecoveryConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(backupRecoveryQueries.isBackupRecoveryQueriesAvailable).mockReturnValue(true);
    vi.mocked(backupRecoveryQueries.getBackupPolicies).mockImplementation(() => new Promise(() => { }));

    render(<BackupRecoveryConfig />);

    expect(screen.getByText(/Loading backup policies/i)).toBeInTheDocument();
  });

  it('should render error state when Supabase is not configured', async () => {
    vi.mocked(backupRecoveryQueries.isBackupRecoveryQueriesAvailable).mockReturnValue(false);

    render(<BackupRecoveryConfig />);

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Supabase not configured/i)).toBeInTheDocument();
    });
  });

  it('should render empty state when no policies exist', async () => {
    vi.mocked(backupRecoveryQueries.isBackupRecoveryQueriesAvailable).mockReturnValue(true);
    vi.mocked(backupRecoveryQueries.getBackupPolicies).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getBackupJobs).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getRestorePoints).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getVerificationTests).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getStorageLocations).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getBackupRecoverySummary).mockResolvedValue({
      tenantId: 'test-tenant-id',
      overallStatus: 'healthy',
      totalPolicies: 0,
      activePolicies: 0,
    });

    render(<BackupRecoveryConfig />);

    await waitFor(() => {
      expect(screen.getByText(/No Backup Policies/i)).toBeInTheDocument();
      expect(screen.getByText(/No transmission backup policies configured/i)).toBeInTheDocument();
    });
  });

  it('should render backup policies list', async () => {
    const mockPolicies = [
      {
        id: 'policy-1',
        policy_name: 'SCADA Config Backup',
        policy_description: 'Daily backup of SCADA configurations',
        backup_type: 'full',
        backup_scope: 'scada-config',
        schedule_frequency: 'daily',
        status: 'active',
        retention_period_days: 30,
        encryption_enabled: true,
        encryption_algorithm: 'AES-256',
        compression_enabled: true,
        compression_algorithm: 'gzip',
        compression_level: 6,
        verification_enabled: true,
        verification_method: 'checksum',
        storage_location: 'primary-storage',
        storage_path: '/backups/scada',
        schedule_enabled: true,
      },
    ];

    vi.mocked(backupRecoveryQueries.isBackupRecoveryQueriesAvailable).mockReturnValue(true);
    vi.mocked(backupRecoveryQueries.getBackupPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(backupRecoveryQueries.getBackupJobs).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getRestorePoints).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getVerificationTests).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getStorageLocations).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getBackupRecoverySummary).mockResolvedValue({
      tenantId: 'test-tenant-id',
      overallStatus: 'healthy',
      totalPolicies: 1,
      activePolicies: 1,
    });

    render(<BackupRecoveryConfig />);

    await waitFor(() => {
      expect(screen.getAllByText('SCADA Config Backup').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/full.*daily/i).length).toBeGreaterThan(0);
    });
  });

  it('should display policy details in overview tab', async () => {
    const mockPolicies = [
      {
        id: 'policy-1',
        policy_name: 'Transmission Backup',
        policy_description: 'Critical transmission system backup',
        backup_type: 'full',
        backup_scope: 'transmission-systems',
        schedule_frequency: 'daily',
        status: 'active',
        retention_period_days: 90,
        encryption_enabled: true,
        encryption_algorithm: 'AES-256',
        compression_enabled: true,
        compression_algorithm: 'gzip',
        compression_level: 6,
        verification_enabled: true,
        verification_method: 'checksum',
        storage_location: 'primary-storage',
        storage_path: '/backups/transmission',
        schedule_enabled: true,
      },
    ];

    vi.mocked(backupRecoveryQueries.isBackupRecoveryQueriesAvailable).mockReturnValue(true);
    vi.mocked(backupRecoveryQueries.getBackupPolicies).mockResolvedValue(mockPolicies);
    vi.mocked(backupRecoveryQueries.getBackupJobs).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getRestorePoints).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getVerificationTests).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getStorageLocations).mockResolvedValue([]);
    vi.mocked(backupRecoveryQueries.getBackupRecoverySummary).mockResolvedValue({
      tenantId: 'test-tenant-id',
      overallStatus: 'healthy',
      totalPolicies: 1,
      activePolicies: 1,
    });

    render(<BackupRecoveryConfig />);

    await waitFor(() => {
      expect(screen.getByText('Backup & Recovery Overview')).toBeInTheDocument();
      expect(screen.getByText('Backup & Recovery Posture')).toBeInTheDocument();
      // Tabs should be 0 because no policy is selected
      expect(screen.getByText('Tabs: 0')).toBeInTheDocument();
    });
  });
});
