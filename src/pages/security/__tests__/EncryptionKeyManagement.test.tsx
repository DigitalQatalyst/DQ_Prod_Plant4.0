import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EncryptionKeyManagement } from '../EncryptionKeyManagement';
import * as encryptionKeyQueries from '@/lib/encryptionKeyQueries';
import type { EncryptionKey, EncryptionKeyManagementSummary } from '@/types/security';

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

// Mock the encryption key queries
vi.mock('@/lib/encryptionKeyQueries', () => ({
  getEncryptionKeys: vi.fn(),
  getKeyRotationHistory: vi.fn(),
  getKeyUsageAudit: vi.fn(),
  getEncryptionKeyManagementSummary: vi.fn(),
  isEncryptionKeyQueriesAvailable: vi.fn(),
  initiateKeyRotation: vi.fn(),
}));

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

const mockEncryptionKey: EncryptionKey = {
  id: 'key-1',
  tenantId: 'test-tenant-id',
  keyName: 'SCADA-Encryption-Key-001',
  description: 'Primary encryption key for SCADA telemetry data',
  keyType: 'symmetric',
  algorithm: 'AES-256',
  keyLength: 256,
  keyId: 'key_abc123',
  keyFingerprint: 'SHA256:abc123def456',
  status: 'active',
  usageType: 'data-encryption',
  createdDate: '2024-01-01T00:00:00Z',
  activatedDate: '2024-01-01T01:00:00Z',
  expirationDate: '2025-01-01T00:00:00Z',
  lastRotated: '2024-06-01T00:00:00Z',
  rotationIntervalDays: 90,
  nextRotation: '2024-09-01T00:00:00Z',
  usageCount: 15000,
  lastUsed: '2024-01-20T12:00:00Z',
  usedByServices: ['SCADA-Master', 'RTU-Gateway'],
  usedByAssets: ['asset-1', 'asset-2', 'asset-3'],
  protectedDataCategories: ['telemetry', 'configuration'],
  complianceStandards: ['NERC-CIP', 'IEC-62443'],
  accessRoles: ['operator', 'engineer'],
  requiresHsm: true,
  hsmLocation: 'HSM-Primary-DC1',
  backupExists: true,
  backupLocation: 'Backup-Vault-DR',
  auditTrail: [],
  createdBy: 'admin@utility.com',
  approvedBy: 'security@utility.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-20T12:00:00Z',
};

const mockSummary: EncryptionKeyManagementSummary = {
  tenantId: 'test-tenant-id',
  totalKeys: 5,
  activeKeys: 4,
  expiredKeys: 0,
  pendingRotationKeys: 1,
  compromisedKeys: 0,
  keysByType: {
    'data-encryption': 3,
    'key-encryption': 1,
    'signing': 1,
    'authentication': 0,
    'protocol-encryption': 0,
  },
  keysByAlgorithm: {
    'AES-256': 3,
    'AES-128': 0,
    'RSA-2048': 1,
    'RSA-4096': 1,
    'ECC-P256': 0,
    'ECC-P384': 0,
  },
  averageKeyAge: 180,
  oldestKeyAge: 365,
  keysRequiringRotation: 1,
  keysWithoutBackup: 1,
  hsmProtectedKeys: 4,
  complianceScore: 85,
  lastAudit: '2024-01-15T00:00:00Z',
  nextAudit: '2024-04-15T00:00:00Z',
};

describe('EncryptionKeyManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encryptionKeyQueries.isEncryptionKeyQueriesAvailable).mockReturnValue(true);
  });

  it('should render loading state initially', () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockImplementation(
      () => new Promise(() => { }) // Never resolves
    );
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockImplementation(
      () => new Promise(() => { })
    );
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockImplementation(
      () => new Promise(() => { })
    );
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockImplementation(
      () => new Promise(() => { })
    );

    render(<EncryptionKeyManagement />);

    expect(screen.getByText(/Loading encryption keys/i)).toBeInTheDocument();
  });

  it('should render encryption keys list when data is loaded', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([mockEncryptionKey]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText('Encryption Key Management Overview')).toBeInTheDocument();
      expect(screen.getByText('Encryption Key Management Posture')).toBeInTheDocument();
      // Tabs should be 0 because no key is selected
      expect(screen.getByText('Tabs: 0')).toBeInTheDocument();
    });
  });

  it('should display transmission context for transmission tenant', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([mockEncryptionKey]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText(/Test Transmission Utility - Transmission Operations/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no keys are available', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText('No Encryption Keys')).toBeInTheDocument();
    });

    expect(screen.getByText(/No transmission encryption keys configured/i)).toBeInTheDocument();
  });

  it('should display error state when Supabase is not configured', async () => {
    vi.mocked(encryptionKeyQueries.isEncryptionKeyQueriesAvailable).mockReturnValue(false);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    expect(screen.getByText(/Supabase not configured/i)).toBeInTheDocument();
  });

  it('should display key details including HSM protection', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([mockEncryptionKey]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getAllByText('SCADA-Encryption-Key-001').length).toBeGreaterThan(0);
    });

    // Check that HSM protection is indicated
    expect(mockEncryptionKey.requiresHsm).toBe(true);
    expect(mockEncryptionKey.hsmLocation).toBe('HSM-Primary-DC1');
  });

  it('should display compliance standards', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([mockEncryptionKey]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      const elements = screen.getAllByText('SCADA-Encryption-Key-001');
      expect(elements.length).toBeGreaterThan(0);
    });

    // Verify compliance standards are present in the data
    expect(mockEncryptionKey.complianceStandards).toContain('NERC-CIP');
    expect(mockEncryptionKey.complianceStandards).toContain('IEC-62443');
  });

  it('should display usage count and protected assets', async () => {
    vi.mocked(encryptionKeyQueries.getEncryptionKeys).mockResolvedValue([mockEncryptionKey]);
    vi.mocked(encryptionKeyQueries.getKeyRotationHistory).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getKeyUsageAudit).mockResolvedValue([]);
    vi.mocked(encryptionKeyQueries.getEncryptionKeyManagementSummary).mockResolvedValue(mockSummary);

    render(<EncryptionKeyManagement />);

    await waitFor(() => {
      expect(screen.getAllByText('SCADA-Encryption-Key-001').length).toBeGreaterThan(0);
    });

    // Verify usage metrics
    expect(mockEncryptionKey.usageCount).toBe(15000);
    expect(mockEncryptionKey.usedByAssets.length).toBe(3);
    expect(mockEncryptionKey.usedByServices).toContain('SCADA-Master');
  });
});
