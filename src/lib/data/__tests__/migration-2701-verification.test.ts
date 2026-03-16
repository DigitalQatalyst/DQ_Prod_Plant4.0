/**
 * Migration 2701 Verification Test
 * 
 * This test verifies that migration 2701_extend_energy_meters_tx.sql contains
 * the expected SQL statements to create energy_meters table with transmission
 * topology bindings, proper constraints, and indexes.
 * 
 * Requirements tested:
 * - 1.5: Meter role topology consistency
 * - 2.1: Meter registration with topology bindings
 * - 2.2: Grid incomer role requires substation_id
 * - 2.3: Feeder outgoing role requires feeder_id
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function to read migration file
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

describe('Migration 2701: Energy Meters with Transmission Topology Bindings', () => {
  const migrationFile = '2701_extend_energy_meters_tx.sql';
  let sql: string;

  // Read the migration file once for all tests
  try {
    sql = readMigrationFile(migrationFile);
  } catch (error) {
    console.error('Failed to read migration file:', error);
    sql = '';
  }

  describe('Enum Types', () => {
    it('should create meter_role_type enum with all required values', () => {
      expect(sql).toContain('CREATE TYPE meter_role_type AS ENUM');
      expect(sql).toContain("'grid_incomer'");
      expect(sql).toContain("'feeder_outgoing'");
      expect(sql).toContain("'transformer_lv'");
      expect(sql).toContain("'station_service'");
      expect(sql).toContain("'line_monitoring'");
      expect(sql).toContain("'bay_metering'");
    });

    it('should create meter_status_type enum with all required values', () => {
      expect(sql).toContain('CREATE TYPE meter_status_type AS ENUM');
      expect(sql).toContain("'Normal'");
      expect(sql).toContain("'High'");
      expect(sql).toContain("'Critical'");
      expect(sql).toContain("'Offline'");
      expect(sql).toContain("'Maintenance'");
    });

    it('should create energy_type enum with all required values', () => {
      expect(sql).toContain('CREATE TYPE energy_type AS ENUM');
      expect(sql).toContain("'electricity'");
      expect(sql).toContain("'gas'");
      expect(sql).toContain("'diesel'");
      expect(sql).toContain("'steam'");
    });

    it('should handle duplicate enum creation gracefully', () => {
      // Check for idempotent enum creation pattern
      expect(sql).toContain('DO $$ BEGIN');
      expect(sql).toContain('EXCEPTION');
      expect(sql).toContain('WHEN duplicate_object THEN NULL');
    });
  });

  describe('energy_meters table structure (Requirement 2.1)', () => {
    it('should create energy_meters table with IF NOT EXISTS', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_meters');
    });

    it('should have required basic columns', () => {
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('site_id UUID REFERENCES sites(id) ON DELETE SET NULL');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('status meter_status_type DEFAULT');
      expect(sql).toContain('energy_types energy_type[]');
    });

    it('should have transmission topology foreign keys (Requirement 1.5)', () => {
      expect(sql).toContain('substation_id UUID REFERENCES tx_substations(id) ON DELETE SET NULL');
      expect(sql).toContain('feeder_id UUID REFERENCES tx_feeders(id) ON DELETE SET NULL');
      expect(sql).toContain('bay_id UUID REFERENCES tx_bays(id) ON DELETE SET NULL');
      expect(sql).toContain('transformer_id UUID REFERENCES tx_transformers(id) ON DELETE SET NULL');
    });

    it('should have meter_role column', () => {
      expect(sql).toContain('meter_role meter_role_type');
    });

    it('should have technical specification columns', () => {
      expect(sql).toContain('meter_type TEXT');
      expect(sql).toContain('scope TEXT');
      expect(sql).toContain('location TEXT');
      expect(sql).toContain('manufacturer TEXT');
      expect(sql).toContain('model TEXT');
      expect(sql).toContain('serial_number TEXT');
      expect(sql).toContain('communication_protocol TEXT');
      expect(sql).toContain('meter_constant DECIMAL(10,4) DEFAULT 1.0');
    });

    it('should have audit columns', () => {
      expect(sql).toContain('active BOOLEAN DEFAULT true');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      expect(sql).toContain('updated_at TIMESTAMPTZ DEFAULT now()');
      expect(sql).toContain('created_by UUID');
      expect(sql).toContain('updated_by UUID');
    });
  });

  describe('Unique constraints', () => {
    it('should have natural key constraint on (org_id, meter_code)', () => {
      expect(sql).toContain('CONSTRAINT uq_energy_meters_org_code UNIQUE NULLS NOT DISTINCT (org_id, meter_code)');
    });
  });

  describe('Check constraints for role-based topology requirements', () => {
    it('should enforce grid_incomer role requires substation_id (Requirement 2.2)', () => {
      expect(sql).toContain('CONSTRAINT chk_meter_role_grid_incomer');
      expect(sql).toContain("meter_role != 'grid_incomer' OR substation_id IS NOT NULL");
    });

    it('should enforce feeder_outgoing role requires feeder_id (Requirement 2.3)', () => {
      expect(sql).toContain('CONSTRAINT chk_meter_role_feeder_outgoing');
      expect(sql).toContain("meter_role != 'feeder_outgoing' OR feeder_id IS NOT NULL");
    });

    it('should enforce transformer_lv role requires transformer_id', () => {
      expect(sql).toContain('CONSTRAINT chk_meter_role_transformer_lv');
      expect(sql).toContain("meter_role != 'transformer_lv' OR transformer_id IS NOT NULL");
    });

    it('should enforce station_service role requires substation_id', () => {
      expect(sql).toContain('CONSTRAINT chk_meter_role_station_service');
      expect(sql).toContain("meter_role != 'station_service' OR substation_id IS NOT NULL");
    });

    it('should enforce bay_metering role requires bay_id', () => {
      expect(sql).toContain('CONSTRAINT chk_meter_role_bay_metering');
      expect(sql).toContain("meter_role != 'bay_metering' OR bay_id IS NOT NULL");
    });
  });

  describe('Indexes', () => {
    it('should have basic indexes on org_id and site_id', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_org ON energy_meters(org_id)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_site ON energy_meters(site_id)');
    });

    it('should have indexes on status and active flags', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_status ON energy_meters(org_id, status)');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_active ON energy_meters(org_id, active)');
    });

    it('should have partial indexes on topology foreign keys', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_substation ON energy_meters(substation_id) WHERE substation_id IS NOT NULL');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_feeder ON energy_meters(feeder_id) WHERE feeder_id IS NOT NULL');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_bay ON energy_meters(bay_id) WHERE bay_id IS NOT NULL');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_transformer ON energy_meters(transformer_id) WHERE transformer_id IS NOT NULL');
    });

    it('should have index on meter_role', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_role ON energy_meters(meter_role) WHERE meter_role IS NOT NULL');
    });

    it('should have composite indexes for common queries', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_substation_status ON energy_meters(substation_id, status) WHERE substation_id IS NOT NULL');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_feeder_status ON energy_meters(feeder_id, status) WHERE feeder_id IS NOT NULL');
    });

    it('should have GIN index on energy_types array', () => {
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_energy_meters_energy_types ON energy_meters USING GIN(energy_types)');
    });
  });

  describe('Documentation comments', () => {
    it('should have table comment', () => {
      expect(sql).toContain("COMMENT ON TABLE energy_meters IS");
    });

    it('should have column comments for key fields', () => {
      expect(sql).toContain("COMMENT ON COLUMN energy_meters.meter_role IS");
      expect(sql).toContain("COMMENT ON COLUMN energy_meters.substation_id IS");
      expect(sql).toContain("COMMENT ON COLUMN energy_meters.feeder_id IS");
      expect(sql).toContain("COMMENT ON COLUMN energy_meters.bay_id IS");
      expect(sql).toContain("COMMENT ON COLUMN energy_meters.transformer_id IS");
    });

    it('should have constraint comments', () => {
      expect(sql).toContain("COMMENT ON CONSTRAINT uq_energy_meters_org_code ON energy_meters IS");
      expect(sql).toContain("COMMENT ON CONSTRAINT chk_meter_role_grid_incomer ON energy_meters IS");
      expect(sql).toContain("COMMENT ON CONSTRAINT chk_meter_role_feeder_outgoing ON energy_meters IS");
    });
  });

  describe('Migration idempotency', () => {
    it('should use IF NOT EXISTS for table creation', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS energy_meters');
    });

    it('should use IF NOT EXISTS for index creation', () => {
      const indexMatches = sql.match(/CREATE INDEX IF NOT EXISTS/g);
      expect(indexMatches).toBeTruthy();
      expect(indexMatches!.length).toBeGreaterThan(5); // Should have multiple indexes
    });

    it('should handle duplicate enum types gracefully', () => {
      expect(sql).toContain('WHEN duplicate_object THEN NULL');
    });
  });
});
