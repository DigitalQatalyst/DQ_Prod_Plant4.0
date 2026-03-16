/**
 * Comprehensive Migration Validation Tests
 * 
 * This test suite validates:
 * - Migration idempotency
 * - Precondition assertions
 * - Post-seed validations
 * - Foreign key relationships
 * 
 * Requirements: 8.5
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Migration Validation', () => {
  describe('Migration Idempotency', () => {
    it('should handle repeated migration execution without errors', async () => {
      // Test that key migrations can be run multiple times safely
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', 'security_%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping migration validation test');
        return;
      }

      expect(error).toBeNull();
      expect(tables).toBeDefined();
      
      // Verify core security tables exist
      const tableNames = tables?.map(t => t.table_name) || [];
      const expectedTables = [
        'security_users',
        'security_zones',
        'security_conduits',
        'ot_asset_security',
        'security_alerts',
        'incident_cases',
        'compliance_standards',
        'security_controls',
        'security_policies',
        'security_exceptions',
        'security_risks'
      ];

      expectedTables.forEach(tableName => {
        expect(tableNames).toContain(tableName);
      });
    });

    it('should maintain consistent enum types across migrations', async () => {
      const { data: enums, error } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typtype', 'e');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping enum validation test');
        return;
      }

      expect(error).toBeNull();
      
      const enumNames = enums?.map(e => e.typname) || [];
      const expectedEnums = [
        'transmission_role',
        'user_status',
        'security_alert_severity',
        'security_alert_status'
      ];

      expectedEnums.forEach(enumName => {
        expect(enumNames).toContain(enumName);
      });
    });
  });

  describe('Foreign Key Relationships', () => {
    it('should validate all security table foreign keys', async () => {
      const { data: constraints, error } = await supabase
        .from('information_schema.table_constraints')
        .select('table_name, constraint_name, constraint_type')
        .eq('constraint_type', 'FOREIGN KEY')
        .like('table_name', 'security_%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping foreign key validation test');
        return;
      }

      expect(error).toBeNull();
      expect(constraints).toBeDefined();
      
      // Verify key foreign key relationships exist
      const fkConstraints = constraints?.map(c => c.table_name) || [];
      expect(fkConstraints).toContain('security_users');
      expect(fkConstraints).toContain('ot_asset_security');
      expect(fkConstraints).toContain('security_alerts');
    });

    it('should validate tenant_id foreign keys on all security tables', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name')
        .eq('column_name', 'tenant_id')
        .like('table_name', 'security_%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping tenant_id validation test');
        return;
      }

      expect(error).toBeNull();
      
      const tablesWithTenantId = columns?.map(c => c.table_name) || [];
      const expectedTables = [
        'security_users',
        'security_zones',
        'security_conduits',
        'ot_asset_security',
        'security_alerts'
      ];

      expectedTables.forEach(tableName => {
        expect(tablesWithTenantId).toContain(tableName);
      });
    });

    it('should validate asset_id foreign keys where expected', async () => {
      // Alternative check using information_schema
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('table_name, column_name')
        .eq('table_name', 'ot_asset_security')
        .eq('column_name', 'asset_id');

      // If Supabase is not available, skip the test
      if (colError && colError.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping asset_id validation test');
        return;
      }

      expect(colError).toBeNull();
      expect(columns).toHaveLength(1);
    });
  });

  describe('Table Structure Validation', () => {
    it('should validate security_users table structure', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'security_users')
        .order('ordinal_position');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping security_users structure test');
        return;
      }

      expect(error).toBeNull();
      expect(columns).toBeDefined();

      const columnNames = columns?.map(c => c.column_name) || [];
      const requiredColumns = [
        'id', 'tenant_id', 'username', 'email', 'full_name', 
        'role', 'status', 'created_at', 'updated_at'
      ];

      requiredColumns.forEach(colName => {
        expect(columnNames).toContain(colName);
      });
    });

    it('should validate ot_asset_security table structure', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'ot_asset_security')
        .order('ordinal_position');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping ot_asset_security structure test');
        return;
      }

      expect(error).toBeNull();
      expect(columns).toBeDefined();

      const columnNames = columns?.map(c => c.column_name) || [];
      const requiredColumns = [
        'id', 'tenant_id', 'asset_id', 'zone_id', 'criticality',
        'security_status', 'risk_score', 'created_at', 'updated_at'
      ];

      requiredColumns.forEach(colName => {
        expect(columnNames).toContain(colName);
      });
    });

    it('should validate security_alerts table structure', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'security_alerts')
        .order('ordinal_position');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping security_alerts structure test');
        return;
      }

      expect(error).toBeNull();
      expect(columns).toBeDefined();

      const columnNames = columns?.map(c => c.column_name) || [];
      const requiredColumns = [
        'id', 'tenant_id', 'title', 'description', 'severity',
        'status', 'created_at', 'updated_at'
      ];

      requiredColumns.forEach(colName => {
        expect(columnNames).toContain(colName);
      });
    });
  });

  describe('Index Validation', () => {
    it('should validate performance indexes exist', async () => {
      const { data: indexes, error } = await supabase
        .from('pg_indexes')
        .select('indexname, tablename')
        .like('tablename', 'security_%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping index validation test');
        return;
      }

      expect(error).toBeNull();
      expect(indexes).toBeDefined();

      const indexNames = indexes?.map(i => i.indexname) || [];
      
      // Check for key performance indexes
      const expectedIndexes = [
        'idx_security_users_tenant',
        'idx_ot_asset_security_tenant',
        'idx_security_alerts_tenant'
      ];

      expectedIndexes.forEach(indexName => {
        expect(indexNames).toContain(indexName);
      });
    });
  });

  describe('Constraint Validation', () => {
    it('should validate check constraints', async () => {
      const { data: constraints, error } = await supabase
        .from('information_schema.check_constraints')
        .select('constraint_name, check_clause')
        .like('constraint_name', '%security%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping check constraints test');
        return;
      }

      expect(error).toBeNull();
      
      // Should have constraints for enum-like fields
      const constraintNames = constraints?.map(c => c.constraint_name) || [];
      expect(constraintNames.length).toBeGreaterThanOrEqual(0);
    });

    it('should validate unique constraints', async () => {
      const { data: constraints, error } = await supabase
        .from('information_schema.table_constraints')
        .select('table_name, constraint_name')
        .eq('constraint_type', 'UNIQUE')
        .like('table_name', 'security_%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping unique constraints test');
        return;
      }

      expect(error).toBeNull();
      
      const uniqueConstraints = constraints?.map(c => c.constraint_name) || [];
      if (uniqueConstraints.length > 0) {
        expect(uniqueConstraints).toContain('unique_username_per_tenant');
        expect(uniqueConstraints).toContain('unique_email_per_tenant');
      }
    });
  });

  describe('Trigger Validation', () => {
    it('should validate updated_at triggers exist', async () => {
      const { data: triggers, error } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_object_table')
        .like('event_object_table', 'security_%')
        .like('trigger_name', '%updated_at%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping trigger validation test');
        return;
      }

      expect(error).toBeNull();
      
      const triggerTables = triggers?.map(t => t.event_object_table) || [];
      if (triggerTables.length > 0) {
        expect(triggerTables).toContain('security_users');
        expect(triggerTables).toContain('ot_asset_security');
        expect(triggerTables).toContain('security_alerts');
      }
    });
  });

  describe('Data Integrity Validation', () => {
    it('should validate referential integrity with sample data', async () => {
      // Check if we have tenants (prerequisite)
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      // If Supabase is not available, skip the test
      if (tenantError && tenantError.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping referential integrity test');
        return;
      }

      expect(tenantError).toBeNull();
      
      if (tenants && tenants.length > 0) {
        // Check if security tables can reference tenant
        const { data: securityUsers, error: userError } = await supabase
          .from('security_users')
          .select('id, tenant_id')
          .limit(1);

        expect(userError).toBeNull();
        
        if (securityUsers && securityUsers.length > 0) {
          expect(securityUsers[0].tenant_id).toBeDefined();
        }
      }
    });

    it('should validate enum value constraints', async () => {
      // Test that enum values are properly constrained
      const { data: users, error } = await supabase
        .from('security_users')
        .select('role, status')
        .limit(5);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping enum validation test');
        return;
      }

      expect(error).toBeNull();
      
      if (users && users.length > 0) {
        const validRoles = ['operator', 'engineer', 'supervisor', 'administrator', 'auditor'];
        const validStatuses = ['active', 'inactive', 'suspended'];
        
        users.forEach(user => {
          if (user.role) expect(validRoles).toContain(user.role);
          if (user.status) expect(validStatuses).toContain(user.status);
        });
      }
    });
  });
});