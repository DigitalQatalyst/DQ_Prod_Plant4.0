/**
 * Migration 2700 Verification Test
 * 
 * This test verifies that migration 2700_energy_tx_foundation.sql contains
 * the expected SQL statements to create transmission topology tables with
 * proper constraints and indexes.
 * 
 * Requirements tested:
 * - 1.1: Substation uniqueness by (org_id, code)
 * - 1.2: Feeder uniqueness by (substation_id, feeder_code)
 * - 1.3: Transformer uniqueness by (substation_id, transformer_code)
 * - 1.4: Transmission line endpoint validity
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function to read migration file
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

describe('Migration 2700: EMS Power Transmission Foundation', () => {
  const migrationFile = '2700_energy_tx_foundation.sql';
  
  describe('tx_substations table (Requirement 1.1)', () => {
    it('should create tx_substations table with correct structure', () => {
      const sql = readMigrationFile(migrationFile);
      
      // Check table creation with IF NOT EXISTS
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS tx_substations');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('code TEXT NOT NULL');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('region TEXT');
      expect(sql).toContain('voltage_levels_kv INTEGER[]');
      expect(sql).toContain('geo JSONB');
    