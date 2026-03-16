/**
 * Migration 2702 Verification Tests
 * Verifies the energy alerts schema creation
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function to read migration files
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

describe('Migration 2702 Energy Alerts Verification', () => {
  let sql: string;

  // Read the migration file once for all tests
  beforeAll(() => {
    try {
      sql = readMigrationFile('2702_energy_alerts_tx.sql');
    } catch (error) {
      throw new Error(`Failed to read migration file: ${error}`);
    }
  });

  describe('Enum Types Creation', () => {
    it('should create energy_alert_source_type enum with correct values', () => {
      expect(sql).toContain('CREATE TYPE energy_alert_source_type AS ENUM');
      expect(sql).toContain("'anomaly'");
      expect(sql).toContain("'pq_event'");
    });

    it('should create energy_alert_state enum with correct values', () => {
      expect(sql).toContain('CREATE TYPE energy_alert_state AS ENUM');
      expect(sql).toContain("'open'");
      expect(sql).toContain("'acked'");
      expect(sql).toContain("'closed'");
    });

    it('should create energy_alert_severity enum with correct values', () => {
      expect(sql).toContain('CREATE TYPE energy_alert_severity AS ENUM');
      expect(sql).toContain("'Low'");
      expect(sql).toContain("'Medium'");
      expect(sql).toContain("'High'");
      expect(sql).toContain("'Critical'");
    });
  });

  describe('Energy Alerts Table Creation', () => {
    it('should create energy_alerts table with correct structure', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_alerts');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('source_type energy_alert_source_type NOT NULL');
      expect(sql).toContain('source_id UUID NOT NULL');
      expect(sql).toContain('alert_state energy_alert_state NOT NULL DEFAULT \'open\'');
      expect(sql).toContain('severity energy_alert_severity NOT NULL');
      expect(sql).toContain('assigned_to UUID');
      expect(sql).toContain('ack_at TIMESTAMPTZ');
      expect(sql).toContain('close_at TIMESTAMPTZ');
      expect(sql).toContain('sla_due_at TIMESTAMPTZ');
      expect(sql).toContain('tags TEXT[]');
      expect(sql).toContain('notes TEXT');
      expect(sql).toContain('created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
      expect(sql).toContain('updated_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    });

    it('should have natural key constraint (source_type, source_id)', () => {
      expect(sql).toContain('CONSTRAINT uk_energy_alerts_source UNIQUE (source_type, source_id)');
    });

    it('should have timestamp ordering check constraints', () => {
      expect(sql).toContain('CONSTRAINT ck_energy_alerts_ack_after_created CHECK (ack_at IS NULL OR ack_at >= created_at)');
      expect(sql).toContain('CONSTRAINT ck_energy_alerts_close_after_ack CHECK (close_at IS NULL OR ack_at IS NULL OR close_at >= ack_at)');
      expect(sql).toContain('CONSTRAINT ck_energy_alerts_close_after_created CHECK (close_at IS NULL OR close_at >= created_at)');
    });
  });

  describe('Energy Alert Activity Table Creation', () => {
    it('should create energy_alert_activity table with correct structure', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_alert_activity');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('alert_id UUID NOT NULL REFERENCES energy_alerts(id) ON DELETE CASCADE');
      expect(sql).toContain('activity_type VARCHAR(50) NOT NULL');
      expect(sql).toContain('user_id UUID');
      expect(sql).toContain('old_value JSONB');
      expect(sql).toContain('new_value JSONB');
      expect(sql).toContain('notes TEXT');
      expect(sql).toContain('created_at TIMESTAMPTZ NOT NULL DEFAULT now()');
    });
  });

  describe('Indexes Creation', () => {
    it('should create performance indexes on energy_alerts', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_org_id ON energy_alerts(org_id)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_state ON energy_alerts(alert_state)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_severity ON energy_alerts(severity)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_assigned_to ON energy_alerts(assigned_to)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_created_at ON energy_alerts(created_at DESC)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_sla_due_at ON energy_alerts(sla_due_at) WHERE sla_due_at IS NOT NULL');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_source ON energy_alerts(source_type, source_id)');
    });

    it('should create index for filtering open alerts (requirement 8.4)', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alerts_open ON energy_alerts(alert_state) WHERE alert_state = \'open\'');
    });

    it('should create indexes on energy_alert_activity', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_alert_id ON energy_alert_activity(alert_id)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_created_at ON energy_alert_activity(created_at DESC)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_alert_activity_user_id ON energy_alert_activity(user_id)');
    });
  });

  describe('Triggers and Functions', () => {
    it('should create updated_at trigger function', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION update_energy_alerts_updated_at()');
      expect(sql).toContain('NEW.updated_at = now()');
      expect(sql).toContain('LANGUAGE plpgsql');
    });

    it('should create updated_at trigger', () => {
      expect(sql).toContain('CREATE TRIGGER tr_energy_alerts_updated_at');
      expect(sql).toContain('BEFORE UPDATE ON energy_alerts');
      expect(sql).toContain('EXECUTE FUNCTION update_energy_alerts_updated_at()');
    });

    it('should create activity logging function', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION log_energy_alert_activity()');
      expect(sql).toContain('INSERT INTO energy_alert_activity');
      expect(sql).toContain('LANGUAGE plpgsql');
    });

    it('should create activity logging trigger', () => {
      expect(sql).toContain('CREATE TRIGGER tr_energy_alert_activity');
      expect(sql).toContain('AFTER INSERT OR UPDATE ON energy_alerts');
      expect(sql).toContain('EXECUTE FUNCTION log_energy_alert_activity()');
    });

    it('should log different activity types', () => {
      expect(sql).toContain("'created'");
      expect(sql).toContain("'acknowledged'");
      expect(sql).toContain("'closed'");
      expect(sql).toContain("'assigned'");
      expect(sql).toContain("'note_added'");
    });
  });

  describe('Row Level Security', () => {
    it('should enable RLS on both tables', () => {
      expect(sql).toContain('ALTER TABLE energy_alerts ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE energy_alert_activity ENABLE ROW LEVEL SECURITY');
    });

    it('should create RLS policies for tenant isolation', () => {
      expect(sql).toContain('CREATE POLICY energy_alerts_tenant_isolation ON energy_alerts');
      expect(sql).toContain("org_id = current_setting('app.current_tenant_id')::UUID");
      
      expect(sql).toContain('CREATE POLICY energy_alert_activity_tenant_isolation ON energy_alert_activity');
      expect(sql).toContain('EXISTS (');
      expect(sql).toContain('SELECT 1 FROM energy_alerts ea');
      expect(sql).toContain('WHERE ea.id = energy_alert_activity.alert_id');
    });
  });

  describe('Permissions and Comments', () => {
    it('should grant appropriate permissions', () => {
      expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON energy_alerts TO authenticated');
      expect(sql).toContain('GRANT SELECT, INSERT ON energy_alert_activity TO authenticated');
      // Note: No sequence grants needed since tables use gen_random_uuid() instead of sequences
    });

    it('should have documentation comments', () => {
      expect(sql).toContain('COMMENT ON TABLE energy_alerts IS');
      expect(sql).toContain('COMMENT ON TABLE energy_alert_activity IS');
      expect(sql).toContain('COMMENT ON CONSTRAINT uk_energy_alerts_source ON energy_alerts IS');
      expect(sql).toContain('COMMENT ON CONSTRAINT ck_energy_alerts_ack_after_created ON energy_alerts IS');
      expect(sql).toContain('COMMENT ON CONSTRAINT ck_energy_alerts_close_after_ack ON energy_alerts IS');
      expect(sql).toContain('COMMENT ON CONSTRAINT ck_energy_alerts_close_after_created ON energy_alerts IS');
    });
  });

  describe('Requirements Compliance', () => {
    it('should reference the correct requirements in comments', () => {
      expect(sql).toContain('Requirements: 8.1, 8.2, 8.4, 8.5');
    });

    it('should support requirement 8.1: alert creation from anomalies', () => {
      // Natural key constraint ensures one alert per source
      expect(sql).toContain('UNIQUE (source_type, source_id)');
      // Source type includes anomaly
      expect(sql).toContain("'anomaly'");
      // Default state is open
      expect(sql).toContain("DEFAULT 'open'");
    });

    it('should support requirement 8.2: alert creation from PQ events', () => {
      // Source type includes pq_event
      expect(sql).toContain("'pq_event'");
    });

    it('should support requirement 8.4: alert acknowledgment tracking', () => {
      // Has ack_at timestamp
      expect(sql).toContain('ack_at TIMESTAMPTZ');
      // Has acked state
      expect(sql).toContain("'acked'");
      // Activity logging for acknowledgment
      expect(sql).toContain("'acknowledged'");
    });

    it('should support requirement 8.5: alert closure tracking', () => {
      // Has close_at timestamp
      expect(sql).toContain('close_at TIMESTAMPTZ');
      // Has closed state
      expect(sql).toContain("'closed'");
      // Activity logging for closure
      expect(sql).toContain("'closed'");
    });
  });

  describe('SQL Syntax Validation', () => {
    it('should have valid SQL syntax', () => {
      // Basic SQL syntax checks
      expect(sql).not.toContain('CREAT TABLE'); // Should be CREATE TABLE
      expect(sql).not.toContain('PRIMAY KEY'); // Should be PRIMARY KEY
      expect(sql).not.toContain('REFERNCES'); // Should be REFERENCES
      
      // Check that major statements exist
      expect(sql).toContain('CREATE TYPE');
      expect(sql).toContain('CREATE TABLE');
      expect(sql).toContain('CREATE INDEX');
      expect(sql).toContain('CREATE TRIGGER');
      expect(sql).toContain('CREATE POLICY');
    });

    it('should use IF NOT EXISTS for idempotency', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_alerts');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_alert_activity');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS');
    });
  });
});