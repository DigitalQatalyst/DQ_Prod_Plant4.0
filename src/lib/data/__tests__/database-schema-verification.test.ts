/**
 * Database Schema Verification Test
 * 
 * This test verifies that all database migrations create the expected tables
 * with correct columns, constraints, and indexes as specified in the requirements.
 * 
 * Requirements tested:
 * - 3.1-3.8: Core schema tables (tenants, sites, asset_types, assets, alerts, tags, telemetry_points)
 * - 4.1-4.5: Power Transmission domain tables (grid_nodes, grid_lines, grid_asset_links)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('Database Schema Verification', () => {
  let supabase: ReturnType<typeof createClient>;
  let isSupabaseAvailable = false;

  beforeAll(async () => {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      
      // Test connection by trying to query a system table
      const { error } = await supabase.from('information_schema.tables').select('table_name').limit(1);
      
      if (!error) {
        isSupabaseAvailable = true;
      }
    } catch (e) {
      console.warn('Supabase not available for schema verification tests');
      isSupabaseAvailable = false;
    }
  });

  describe('Core Schema Tables (Requirements 3.1-3.8)', () => {
    it('should have tenants table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      // Check table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'tenants')
        .eq('table_schema', 'public');

      expect(tableError).toBeNull();
      expect(tables).toHaveLength(1);

      // Check columns
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'tenants')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      expect(columnError).toBeNull();
      expect(columns).toBeDefined();

      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('sector');
      expect(columnNames).toContain('subsector');
      expect(columnNames).toContain('scenario_tag');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have sites table with correct structure and foreign keys', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      // Check table exists
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'sites')
        .eq('table_schema', 'public');

      expect(tableError).toBeNull();
      expect(tables).toHaveLength(1);

      // Check columns
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'sites')
        .eq('table_schema', 'public');

      expect(columnError).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('region');
      expect(columnNames).toContain('geo_lat');
      expect(columnNames).toContain('geo_lng');
      expect(columnNames).toContain('created_at');
    });

    it('should have asset_types table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'asset_types')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('code');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('category');
      expect(columnNames).toContain('properties_schema');
      expect(columnNames).toContain('created_at');
    });

    it('should have assets table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'assets')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('site_id');
      expect(columnNames).toContain('asset_type_id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('criticality');
      expect(columnNames).toContain('parent_asset_id');
      expect(columnNames).toContain('properties');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have alerts table with correct structure and enums', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, udt_name')
        .eq('table_name', 'alerts')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('source_type');
      expect(columnNames).toContain('source_id');
      expect(columnNames).toContain('severity');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('payload');

      // Check that enum types are used
      const sourceTypeColumn = columns?.find(col => col.column_name === 'source_type');
      expect(sourceTypeColumn?.udt_name).toBe('alert_source_type');

      const severityColumn = columns?.find(col => col.column_name === 'severity');
      expect(severityColumn?.udt_name).toBe('alert_severity');

      const statusColumn = columns?.find(col => col.column_name === 'status');
      expect(statusColumn?.udt_name).toBe('alert_status');
    });

    it('should have tags table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, udt_name')
        .eq('table_name', 'tags')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('asset_id');
      expect(columnNames).toContain('protocol');
      expect(columnNames).toContain('address');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('created_at');

      // Check that protocol enum is used
      const protocolColumn = columns?.find(col => col.column_name === 'protocol');
      expect(protocolColumn?.udt_name).toBe('telemetry_protocol');
    });

    it('should have telemetry_points table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'telemetry_points')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('asset_id');
      expect(columnNames).toContain('tag_id');
      expect(columnNames).toContain('metric');
      expect(columnNames).toContain('unit');
      expect(columnNames).toContain('limits');
      expect(columnNames).toContain('created_at');
    });
  });

  describe('Power Transmission Domain Tables (Requirements 4.1-4.5)', () => {
    it('should have grid_nodes table with correct structure', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'grid_nodes')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('site_id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('node_type');
      expect(columnNames).toContain('voltage_kv');
      expect(columnNames).toContain('region');
      expect(columnNames).toContain('geo_lat');
      expect(columnNames).toContain('geo_lng');
      expect(columnNames).toContain('created_at');
    });

    it('should have grid_lines table with correct structure and foreign keys', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'grid_lines')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('tenant_id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('from_node_id');
      expect(columnNames).toContain('to_node_id');
      expect(columnNames).toContain('voltage_kv');
      expect(columnNames).toContain('length_km');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
    });

    it('should have grid_asset_links table with correct structure and constraints', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'grid_asset_links')
        .eq('table_schema', 'public');

      expect(error).toBeNull();
      const columnNames = columns?.map(col => col.column_name) || [];
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('asset_id');
      expect(columnNames).toContain('node_id');
      expect(columnNames).toContain('line_id');

      // Check that node_id and line_id are nullable (since constraint requires one OR the other)
      const nodeIdColumn = columns?.find(col => col.column_name === 'node_id');
      const lineIdColumn = columns?.find(col => col.column_name === 'line_id');
      expect(nodeIdColumn?.is_nullable).toBe('YES');
      expect(lineIdColumn?.is_nullable).toBe('YES');
    });
  });

  describe('Database Indexes', () => {
    it('should have required indexes for performance', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      // Query for indexes on key tables
      const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .in('tablename', ['tenants', 'sites', 'assets', 'alerts', 'grid_nodes', 'grid_lines']);

      expect(error).toBeNull();
      expect(indexes).toBeDefined();

      const indexNames = indexes?.map(idx => idx.indexname) || [];
      
      // Check for some key indexes (not exhaustive, but important ones)
      expect(indexNames.some(name => name.includes('tenants') && name.includes('sector'))).toBe(true);
      expect(indexNames.some(name => name.includes('sites') && name.includes('tenant'))).toBe(true);
      expect(indexNames.some(name => name.includes('assets') && name.includes('tenant'))).toBe(true);
      expect(indexNames.some(name => name.includes('alerts') && name.includes('tenant'))).toBe(true);
      expect(indexNames.some(name => name.includes('grid_nodes') && name.includes('tenant'))).toBe(true);
      expect(indexNames.some(name => name.includes('grid_lines') && name.includes('tenant'))).toBe(true);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key constraints for referential integrity', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      // Query for foreign key constraints
      const { data: constraints, error } = await supabase
        .from('information_schema.table_constraints')
        .select('constraint_name, table_name, constraint_type')
        .eq('constraint_type', 'FOREIGN KEY')
        .in('table_name', ['sites', 'assets', 'alerts', 'grid_nodes', 'grid_lines', 'grid_asset_links']);

      expect(error).toBeNull();
      expect(constraints).toBeDefined();
      expect(constraints!.length).toBeGreaterThan(0);

      // Check that key tables have foreign key constraints
      const tableNames = constraints?.map(c => c.table_name) || [];
      expect(tableNames).toContain('sites'); // Should reference tenants
      expect(tableNames).toContain('assets'); // Should reference tenants, sites, asset_types
      expect(tableNames).toContain('grid_nodes'); // Should reference tenants
      expect(tableNames).toContain('grid_lines'); // Should reference tenants, grid_nodes
      expect(tableNames).toContain('grid_asset_links'); // Should reference assets, grid_nodes, grid_lines
    });
  });

  describe('Enum Types', () => {
    it('should have required enum types defined', async () => {
      if (!isSupabaseAvailable) {
        console.warn('Skipping database test - Supabase not available');
        return;
      }

      // Query for custom enum types
      const { data: enums, error } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typtype', 'e') // enum type
        .like('typname', 'alert_%');

      expect(error).toBeNull();
      expect(enums).toBeDefined();

      const enumNames = enums?.map(e => e.typname) || [];
      expect(enumNames).toContain('alert_source_type');
      expect(enumNames).toContain('alert_severity');
      expect(enumNames).toContain('alert_status');
    });
  });
});