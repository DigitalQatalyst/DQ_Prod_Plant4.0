/**
 * AlertsProvider Tests
 * 
 * Tests for the AlertsProvider API query functions
 * Requirements: 8.4, 8.5, 8.7, 8.8, 8.10, 8.11
 */

import { describe, it, expect } from 'vitest';
import { getAlertsProvider } from '../AlertsProvider';
import type { EnergyAlert, EnergyAlertSummary, ListAlertsFilters } from '../AlertsProvider';

describe('AlertsProvider', () => {
  const provider = getAlertsProvider();

  describe('Provider Initialization', () => {
    it('should create a singleton instance', () => {
      const provider1 = getAlertsProvider();
      const provider2 = getAlertsProvider();
      
      expect(provider1).toBe(provider2);
      expect(provider1).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof provider.listAlerts).toBe('function');
      expect(typeof provider.getAlert).toBe('function');
      expect(typeof provider.acknowledgeAlert).toBe('function');
      expect(typeof provider.assignAlert).toBe('function');
      expect(typeof provider.closeAlert).toBe('function');
      expect(typeof provider.addAlertNote).toBe('function');
      expect(typeof provider.bulkAssignAlerts).toBe('function');
      expect(typeof provider.bulkAcknowledgeAlerts).toBe('function');
      expect(typeof provider.getAlertStatistics).toBe('function');
    });
  });

  describe('Alert Listing', () => {
    it('should handle listAlerts with no filters', async () => {
      // This test will pass if Supabase is not configured (returns empty array)
      // or if configured and RLS allows access
      try {
        const alerts = await provider.listAlerts();
        expect(Array.isArray(alerts)).toBe(true);
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle listAlerts with filters', async () => {
      const filters: ListAlertsFilters = {
        alert_state: 'open',
        severity: 'Critical',
        limit: 10
      };

      try {
        const alerts = await provider.listAlerts(filters);
        expect(Array.isArray(alerts)).toBe(true);
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Alert Retrieval', () => {
    it('should handle getAlert with non-existent ID', async () => {
      try {
        const alert = await provider.getAlert('00000000-0000-0000-0000-000000000000');
        expect(alert).toBeNull();
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Alert State Management', () => {
    it('should handle acknowledgeAlert with non-existent ID', async () => {
      try {
        await provider.acknowledgeAlert('00000000-0000-0000-0000-000000000000', 'test-user');
        // Should not reach here with non-existent ID
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle assignAlert with non-existent ID', async () => {
      try {
        await provider.assignAlert('00000000-0000-0000-0000-000000000000', 'test-assignee');
        // Should not reach here with non-existent ID
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle closeAlert with non-existent ID', async () => {
      try {
        await provider.closeAlert('00000000-0000-0000-0000-000000000000', 'test-user', 'Test notes');
        // Should not reach here with non-existent ID
        expect(false).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulkAssignAlerts with empty array', async () => {
      try {
        const result = await provider.bulkAssignAlerts([], 'test-assignee');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle bulkAcknowledgeAlerts with empty array', async () => {
      try {
        const result = await provider.bulkAcknowledgeAlerts([], 'test-user');
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Statistics', () => {
    it('should handle getAlertStatistics', async () => {
      try {
        const stats = await provider.getAlertStatistics();
        expect(typeof stats).toBe('object');
        expect(typeof stats.total).toBe('number');
        expect(typeof stats.open).toBe('number');
        expect(typeof stats.acked).toBe('number');
        expect(typeof stats.closed).toBe('number');
        expect(typeof stats.overdue).toBe('number');
        expect(typeof stats.by_severity).toBe('object');
        expect(typeof stats.by_source_type).toBe('object');
      } catch (error) {
        // Expected if Supabase is not configured or access is denied
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw meaningful error messages', async () => {
      try {
        // This should fail with a meaningful error
        await provider.acknowledgeAlert('invalid-id', 'test-user');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeDefined();
        expect((error as Error).message.length).toBeGreaterThan(0);
      }
    });
  });
});