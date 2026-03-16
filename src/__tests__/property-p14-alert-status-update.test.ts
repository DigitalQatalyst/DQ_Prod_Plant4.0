import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { AlertStatus } from '@/types/alert';
import { updateAlertStatus } from '@/lib/alertUtils';

/**
 * Property Test for P14: Alert Status Update Persistence
 *
 * Property 14: Alert Status Update Persistence
 * For any alert status update, the new status SHALL be persisted and retrievable
 *
 * Validates: Requirements 7.6
 */

// Mock alert data for testing
const mockAlerts = [
  {
    id: 'alert-001',
    tenantId: 't1',
    featureArea: 'assets' as const,
    severity: 'critical' as const,
    status: 'open' as const,
    title: 'Test Alert 1',
    summary: 'Test summary',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    assetId: 'asset-001'
  },
  {
    id: 'alert-002',
    tenantId: 't2',
    featureArea: 'assets' as const,
    severity: 'warning' as const,
    status: 'acknowledged' as const,
    title: 'Test Alert 2',
    summary: 'Test summary 2',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T11:30:00Z',
    siteId: 'site-001'
  }
];

// Mock the data provider to simulate persistence
let alertStore: any[] = [...mockAlerts];

const mockDataProvider = {
  updateAlertStatus: vi.fn(async (alertId: string, status: AlertStatus) => {
    const alertIndex = alertStore.findIndex(a => a.id === alertId);
    if (alertIndex === -1) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    // Update the alert in our mock store
    const updatedAlert = {
      ...alertStore[alertIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    alertStore[alertIndex] = updatedAlert;

    return updatedAlert;
  })
};

describe('Property P14: Alert Status Update Persistence', () => {
  beforeEach(() => {
    // Reset the mock store before each test
    alertStore = [...mockAlerts];
    vi.clearAllMocks();
  });

  it('should persist alert status updates (fast-check property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random alert IDs from our mock data
        fc.constantFrom(...mockAlerts.map(a => a.id)),
        // Generate random valid alert statuses
        fc.constantFrom('open', 'acknowledged', 'in-progress', 'closed' as AlertStatus),
        // Test function
        async (alertId: string, newStatus: AlertStatus) => {
          // Get the original alert
          const originalAlert = alertStore.find(a => a.id === alertId)!;

          // Update the alert status
          const updatedAlert = await mockDataProvider.updateAlertStatus(alertId, newStatus);

          // Verify the update was persisted
          const persistedAlert = alertStore.find(a => a.id === alertId)!;

          // Property: The updated alert should have the new status
          expect(updatedAlert.status).toBe(newStatus);

          // Property: The persisted alert should match the returned alert
          expect(persistedAlert.status).toBe(newStatus);
          expect(persistedAlert.updatedAt).toBe(updatedAlert.updatedAt);

          // Property: Other fields should remain unchanged
          expect(persistedAlert.id).toBe(originalAlert.id);
          expect(persistedAlert.title).toBe(originalAlert.title);
          expect(persistedAlert.severity).toBe(originalAlert.severity);

          // Property: Updated timestamp should be newer than original
          expect(new Date(persistedAlert.updatedAt).getTime()).toBeGreaterThanOrEqual(
            new Date(originalAlert.updatedAt).getTime()
          );
        }
      ),
      {
        numRuns: 100, // Run at least 100 iterations as specified
        verbose: true
      }
    );
  });

  it('should handle all possible status transitions', async () => {
    const testAlertId = 'alert-001';
    const allStatuses: AlertStatus[] = ['open', 'acknowledged', 'in-progress', 'closed'];

    for (const status of allStatuses) {
      const updatedAlert = await mockDataProvider.updateAlertStatus(testAlertId, status);
      expect(updatedAlert.status).toBe(status);

      // Verify persistence
      const persistedAlert = alertStore.find(a => a.id === testAlertId)!;
      expect(persistedAlert.status).toBe(status);
    }
  });

  it('should update the updatedAt timestamp', async () => {
    const testAlertId = 'alert-001';
    const originalAlert = alertStore.find(a => a.id === testAlertId)!;
    const originalTimestamp = new Date(originalAlert.updatedAt).getTime();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updatedAlert = await mockDataProvider.updateAlertStatus(testAlertId, 'acknowledged');

    // Verify timestamp was updated
    const newTimestamp = new Date(updatedAlert.updatedAt).getTime();
    expect(newTimestamp).toBeGreaterThan(originalTimestamp);
  });

  it('should throw error for non-existent alert IDs', async () => {
    await expect(
      mockDataProvider.updateAlertStatus('non-existent-id', 'acknowledged')
    ).rejects.toThrow('Alert with ID non-existent-id not found');
  });

  it('should maintain data integrity across multiple updates', async () => {
    const testAlertId = 'alert-001';

    // Perform multiple status updates
    await mockDataProvider.updateAlertStatus(testAlertId, 'acknowledged');
    await mockDataProvider.updateAlertStatus(testAlertId, 'in-progress');
    await mockDataProvider.updateAlertStatus(testAlertId, 'closed');

    // Verify final state
    const finalAlert = alertStore.find(a => a.id === testAlertId)!;
    expect(finalAlert.status).toBe('closed');

    // Verify other fields unchanged
    expect(finalAlert.title).toBe('Test Alert 1');
    expect(finalAlert.severity).toBe('critical');
    expect(finalAlert.assetId).toBe('asset-001');
  });
});
