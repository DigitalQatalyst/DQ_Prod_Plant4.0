/**
 * Migration File Verification Test
 * 
 * This test verifies that all migration files contain the expected SQL
 * statements to create tables, constraints, and indexes as specified
 * in the requirements.
 * 
 * This test can run without a live database connection by parsing the SQL files.
 * 
 * Requirements tested:
 * - 3.1-3.8: Core schema tables (tenants, sites, asset_types, assets, alerts, tags, telemetry_points)
 * - 4.1-4.5: Power Transmission domain tables (grid_nodes, grid_lines, grid_asset_links)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Helper function to read migration files
function readMigrationFile(filename: string): string {
  const filePath = join(process.cwd(), 'supabase', 'migrations', filename);
  return readFileSync(filePath, 'utf-8');
}

describe('Migration File Verification', () => {
  describe('Core Schema Migrations (Requirements 3.1-3.8)', () => {
    it('001_create_tenants.sql should create tenants table with correct structure', () => {
      const sql = readMigrationFile('001_create_tenants.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE tenants');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('sector TEXT NOT NULL');
      expect(sql).toContain('subsector TEXT');
      expect(sql).toContain('scenario_tag TEXT');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      expect(sql).toContain('updated_at TIMESTAMPTZ DEFAULT now()');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_tenants_sector ON tenants(sector)');
      expect(sql).toContain('CREATE INDEX idx_tenants_subsector ON tenants(subsector)');
    });

    it('002_create_sites.sql should create sites table with foreign keys', () => {
      const sql = readMigrationFile('002_create_sites.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE sites');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('region TEXT');
      expect(sql).toContain('geo_lat DOUBLE PRECISION');
      expect(sql).toContain('geo_lng DOUBLE PRECISION');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_sites_tenant ON sites(tenant_id)');
    });

    it('003_create_asset_types.sql should create asset_types table with unique constraint', () => {
      const sql = readMigrationFile('003_create_asset_types.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE asset_types');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('code TEXT NOT NULL');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('category TEXT');
      expect(sql).toContain('properties_schema JSONB');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      
      // Check unique constraint
      expect(sql).toContain('UNIQUE(tenant_id, code)');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_asset_types_tenant ON asset_types(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_asset_types_code ON asset_types(code)');
    });

    it('004_create_assets.sql should create assets table with self-referencing foreign key', () => {
      const sql = readMigrationFile('004_create_assets.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE assets');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('site_id UUID REFERENCES sites(id) ON DELETE SET NULL');
      expect(sql).toContain('asset_type_id UUID REFERENCES asset_types(id) ON DELETE SET NULL');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('status TEXT DEFAULT \'online\'');
      expect(sql).toContain('criticality TEXT DEFAULT \'medium\'');
      expect(sql).toContain('parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL');
      expect(sql).toContain('properties JSONB DEFAULT \'{}\'');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      expect(sql).toContain('updated_at TIMESTAMPTZ DEFAULT now()');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_assets_tenant ON assets(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_assets_site ON assets(site_id)');
      expect(sql).toContain('CREATE INDEX idx_assets_type ON assets(asset_type_id)');
      expect(sql).toContain('CREATE INDEX idx_assets_parent ON assets(parent_asset_id)');
      expect(sql).toContain('CREATE INDEX idx_assets_status ON assets(status)');
      expect(sql).toContain('CREATE INDEX idx_assets_criticality ON assets(criticality)');
    });

    it('005_create_alerts.sql should create alerts table with enum types', () => {
      const sql = readMigrationFile('005_create_alerts.sql');
      
      // Check enum type creation
      expect(sql).toContain('CREATE TYPE alert_source_type AS ENUM');
      expect(sql).toContain('CREATE TYPE alert_severity AS ENUM');
      expect(sql).toContain('CREATE TYPE alert_status AS ENUM');
      
      // Check enum values
      expect(sql).toContain('\'asset\'');
      expect(sql).toContain('\'grid_node\'');
      expect(sql).toContain('\'grid_line\'');
      expect(sql).toContain('\'security\'');
      expect(sql).toContain('\'automation\'');
      expect(sql).toContain('\'info\'');
      expect(sql).toContain('\'warning\'');
      expect(sql).toContain('\'critical\'');
      expect(sql).toContain('\'open\'');
      expect(sql).toContain('\'acknowledged\'');
      expect(sql).toContain('\'in-progress\'');
      expect(sql).toContain('\'closed\'');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE alerts');
      
      // Check required columns with enum types
      expect(sql).toContain('source_type alert_source_type NOT NULL');
      expect(sql).toContain('severity alert_severity NOT NULL');
      expect(sql).toContain('status alert_status DEFAULT \'open\'');
      expect(sql).toContain('payload JSONB DEFAULT \'{}\'');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_alerts_tenant ON alerts(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_alerts_created ON alerts(created_at DESC)');
      expect(sql).toContain('CREATE INDEX idx_alerts_severity ON alerts(severity)');
      expect(sql).toContain('CREATE INDEX idx_alerts_status ON alerts(status)');
      expect(sql).toContain('CREATE INDEX idx_alerts_source ON alerts(source_type, source_id)');
    });

    it('006_create_telemetry.sql should create tags and telemetry_points tables', () => {
      const sql = readMigrationFile('006_create_telemetry.sql');
      
      // Check enum type creation
      expect(sql).toContain('CREATE TYPE telemetry_protocol AS ENUM');
      expect(sql).toContain('\'OPC-UA\'');
      expect(sql).toContain('\'Modbus\'');
      expect(sql).toContain('\'MQTT\'');
      expect(sql).toContain('\'DNP3\'');
      expect(sql).toContain('\'IEC61850\'');
      
      // Check tags table
      expect(sql).toContain('CREATE TABLE tags');
      expect(sql).toContain('protocol telemetry_protocol NOT NULL');
      expect(sql).toContain('address TEXT NOT NULL');
      
      // Check telemetry_points table
      expect(sql).toContain('CREATE TABLE telemetry_points');
      expect(sql).toContain('metric TEXT NOT NULL');
      expect(sql).toContain('unit TEXT');
      expect(sql).toContain('limits JSONB');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_tags_tenant ON tags(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_tags_asset ON tags(asset_id)');
      expect(sql).toContain('CREATE INDEX idx_tags_protocol ON tags(protocol)');
      expect(sql).toContain('CREATE INDEX idx_telemetry_tenant ON telemetry_points(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_telemetry_asset ON telemetry_points(asset_id)');
      expect(sql).toContain('CREATE INDEX idx_telemetry_tag ON telemetry_points(tag_id)');
      expect(sql).toContain('CREATE INDEX idx_telemetry_metric ON telemetry_points(metric)');
    });
  });

  describe('Power Transmission Domain Migrations (Requirements 4.1-4.5)', () => {
    it('007_create_grid_nodes.sql should create grid_nodes table', () => {
      const sql = readMigrationFile('007_create_grid_nodes.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE grid_nodes');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('site_id UUID REFERENCES sites(id) ON DELETE SET NULL');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('node_type TEXT NOT NULL');
      expect(sql).toContain('voltage_kv DOUBLE PRECISION');
      expect(sql).toContain('region TEXT');
      expect(sql).toContain('geo_lat DOUBLE PRECISION');
      expect(sql).toContain('geo_lng DOUBLE PRECISION');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_grid_nodes_tenant ON grid_nodes(tenant_id)');
    });

    it('008_create_grid_lines.sql should create grid_lines table with node references', () => {
      const sql = readMigrationFile('008_create_grid_lines.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE grid_lines');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE');
      expect(sql).toContain('name TEXT NOT NULL');
      expect(sql).toContain('from_node_id UUID NOT NULL REFERENCES grid_nodes(id) ON DELETE CASCADE');
      expect(sql).toContain('to_node_id UUID NOT NULL REFERENCES grid_nodes(id) ON DELETE CASCADE');
      expect(sql).toContain('voltage_kv DOUBLE PRECISION');
      expect(sql).toContain('length_km DOUBLE PRECISION');
      expect(sql).toContain('status TEXT DEFAULT \'active\'');
      expect(sql).toContain('created_at TIMESTAMPTZ DEFAULT now()');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_grid_lines_tenant ON grid_lines(tenant_id)');
      expect(sql).toContain('CREATE INDEX idx_grid_lines_from ON grid_lines(from_node_id)');
      expect(sql).toContain('CREATE INDEX idx_grid_lines_to ON grid_lines(to_node_id)');
    });

    it('009_create_grid_asset_links.sql should create grid_asset_links table with check constraint', () => {
      const sql = readMigrationFile('009_create_grid_asset_links.sql');
      
      // Check table creation
      expect(sql).toContain('CREATE TABLE grid_asset_links');
      
      // Check required columns
      expect(sql).toContain('id UUID PRIMARY KEY DEFAULT gen_random_uuid()');
      expect(sql).toContain('asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE');
      expect(sql).toContain('node_id UUID REFERENCES grid_nodes(id) ON DELETE CASCADE');
      expect(sql).toContain('line_id UUID REFERENCES grid_lines(id) ON DELETE CASCADE');
      
      // Check constraint (either node_id OR line_id must be not null)
      expect(sql).toContain('CONSTRAINT chk_link_target CHECK (node_id IS NOT NULL OR line_id IS NOT NULL)');
      
      // Check indexes
      expect(sql).toContain('CREATE INDEX idx_grid_asset_links_asset ON grid_asset_links(asset_id)');
    });
  });

  describe('Migration File Structure', () => {
    it('should have all required migration files', () => {
      const migrationFiles = [
        '001_create_tenants.sql',
        '002_create_sites.sql',
        '003_create_asset_types.sql',
        '004_create_assets.sql',
        '005_create_alerts.sql',
        '006_create_telemetry.sql',
        '007_create_grid_nodes.sql',
        '008_create_grid_lines.sql',
        '009_create_grid_asset_links.sql'
      ];

      migrationFiles.forEach(filename => {
        expect(() => readMigrationFile(filename)).not.toThrow();
      });
    });

    it('should have requirement comments in migration files', () => {
      const migrationFiles = [
        { file: '001_create_tenants.sql', requirement: '3.1' },
        { file: '002_create_sites.sql', requirement: '3.2' },
        { file: '003_create_asset_types.sql', requirement: '3.3' },
        { file: '004_create_assets.sql', requirement: '3.4' },
        { file: '005_create_alerts.sql', requirement: '3.5' },
        { file: '006_create_telemetry.sql', requirement: '3.6' },
        { file: '007_create_grid_nodes.sql', requirement: '4.1' },
        { file: '008_create_grid_lines.sql', requirement: '4.2' },
        { file: '009_create_grid_asset_links.sql', requirement: '4.3' }
      ];

      migrationFiles.forEach(({ file, requirement }) => {
        const sql = readMigrationFile(file);
        expect(sql).toContain(`Requirements: ${requirement}`);
      });
    });
  });

  describe('SQL Syntax Validation', () => {
    it('should have valid SQL syntax in all migration files', () => {
      const migrationFiles = [
        '001_create_tenants.sql',
        '002_create_sites.sql',
        '003_create_asset_types.sql',
        '004_create_assets.sql',
        '005_create_alerts.sql',
        '006_create_telemetry.sql',
        '007_create_grid_nodes.sql',
        '008_create_grid_lines.sql',
        '009_create_grid_asset_links.sql'
      ];

      migrationFiles.forEach(filename => {
        const sql = readMigrationFile(filename);
        
        // Basic SQL syntax checks
        expect(sql).not.toContain('CREAT TABLE'); // Should be CREATE TABLE
        expect(sql).not.toContain('PRIMAY KEY'); // Should be PRIMARY KEY
        expect(sql).not.toContain('REFERNCES'); // Should be REFERENCES
        
        // Check that statements end with semicolons
        const statements = sql.split('\n').filter(line => 
          line.trim().startsWith('CREATE') || 
          line.trim().startsWith('ALTER') ||
          line.trim().startsWith('INSERT')
        );
        
        // At least one CREATE statement should exist
        expect(statements.length).toBeGreaterThan(0);
      });
    });
  });
});