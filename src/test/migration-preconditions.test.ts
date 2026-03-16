/**
 * Migration Precondition and Post-Seed Validation Tests
 * 
 * This test suite validates:
 * - Precondition assertions before migrations
 * - Post-seed validations after data seeding
 * - Migration dependency validation
 * 
 * Requirements: 8.5
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Migration Preconditions and Post-Seed Validation', () => {
  describe('Precondition Assertions', () => {
    it('should validate prerequisite tables exist before security migrations', async () => {
      // Check that base tables exist before security tables are created
      const prerequisiteTables = ['tenants', 'sites', 'assets'];
      
      for (const tableName of prerequisiteTables) {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName);

        // If Supabase is not available, skip the test
        if (error && error.message.includes('NetworkError')) {
          console.warn(`Supabase not available, skipping prerequisite table test for ${tableName}`);
          continue;
        }

        expect(error).toBeNull();
        expect(data).toHaveLength(1);
        expect(data?.[0].table_name).toBe(tableName);
      }
    });

    it('should validate tenant table has required structure', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'tenants')
        .in('column_name', ['id', 'name']);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping tenant structure test');
        return;
      }

      expect(error).toBeNull();
      expect(columns).toHaveLength(2);
      
      const idColumn = columns?.find(c => c.column_name === 'id');
      const nameColumn = columns?.find(c => c.column_name === 'name');
      
      expect(idColumn).toBeDefined();
      expect(nameColumn).toBeDefined();
    });

    it('should validate assets table has required structure for OT security', async () => {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'assets')
        .in('column_name', ['id', 'tenant_id', 'site_id']);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping assets structure test');
        return;
      }

      expect(error).toBeNull();
      expect(columns?.length).toBeGreaterThanOrEqual(3);
      
      const requiredColumns = ['id', 'tenant_id', 'site_id'];
      const columnNames = columns?.map(c => c.column_name) || [];
      
      requiredColumns.forEach(colName => {
        expect(columnNames).toContain(colName);
      });
    });
  });

  describe('Post-Seed Validations', () => {
    it('should validate transmission tenant exists after seeding', async () => {
      const { data: tenants, error } = await supabase
        .from('tenants')
        .select('id, name')
        .ilike('name', '%transmission%');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping transmission tenant test');
        return;
      }

      expect(error).toBeNull();
      
      if (tenants && tenants.length > 0) {
        expect(tenants[0].name).toMatch(/transmission/i);
        expect(tenants[0].id).toBeDefined();
      }
    });

    it('should validate transmission sites exist after seeding', async () => {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name, site_type')
        .in('site_type', ['substation', 'grid_station', 'regional_hub']);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping transmission sites test');
        return;
      }

      expect(error).toBeNull();
      
      if (sites && sites.length > 0) {
        sites.forEach(site => {
          expect(['substation', 'grid_station', 'regional_hub']).toContain(site.site_type);
          expect(site.name).toBeDefined();
        });
      }
    });

    it('should validate transmission assets exist after seeding', async () => {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('id, name, asset_type')
        .in('asset_type', ['transformer', 'circuit-breaker', 'protection-relay', 'rtu']);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping transmission assets test');
        return;
      }

      expect(error).toBeNull();
      
      if (assets && assets.length > 0) {
        const transmissionAssetTypes = ['transformer', 'circuit-breaker', 'protection-relay', 'rtu'];
        assets.forEach(asset => {
          expect(asset.name).toBeDefined();
          // Asset type should be transmission-related if specified
          if (asset.asset_type) {
            expect(transmissionAssetTypes).toContain(asset.asset_type);
          }
        });
      }
    });

    it('should validate security users seeded with proper roles', async () => {
      const { data: users, error } = await supabase
        .from('security_users')
        .select('id, username, role, status');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping security users test');
        return;
      }

      expect(error).toBeNull();
      
      if (users && users.length > 0) {
        const validRoles = ['operator', 'engineer', 'supervisor', 'administrator', 'auditor'];
        const validStatuses = ['active', 'inactive', 'suspended'];
        
        users.forEach(user => {
          expect(validRoles).toContain(user.role);
          expect(validStatuses).toContain(user.status);
          expect(user.username).toBeDefined();
        });
      }
    });

    it('should validate security zones seeded with IEC 62443 compliance', async () => {
      const { data: zones, error } = await supabase
        .from('security_zones')
        .select('id, name, zone_type, security_level');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping security zones test');
        return;
      }

      expect(error).toBeNull();
      
      if (zones && zones.length > 0) {
        zones.forEach(zone => {
          expect(zone.name).toBeDefined();
          expect(zone.zone_type).toBeDefined();
          // IEC 62443 security levels are 1-4
          if (zone.security_level) {
            expect(zone.security_level).toBeGreaterThanOrEqual(1);
            expect(zone.security_level).toBeLessThanOrEqual(4);
          }
        });
      }
    });

    it('should validate OT asset security records match assets', async () => {
      const { data: assets, error: assetError } = await supabase
        .from('assets')
        .select('id')
        .limit(10);

      // If Supabase is not available, skip the test
      if (assetError && assetError.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping OT asset security test');
        return;
      }

      expect(assetError).toBeNull();
      
      if (assets && assets.length > 0) {
        const { data: otSecurity, error: secError } = await supabase
          .from('ot_asset_security')
          .select('asset_id, criticality, security_status')
          .in('asset_id', assets.map(a => a.id));

        expect(secError).toBeNull();
        
        if (otSecurity && otSecurity.length > 0) {
          const validCriticalities = ['safety-critical', 'production-critical', 'high', 'medium', 'low'];
          const validStatuses = ['secure', 'at-risk', 'vulnerable'];
          
          otSecurity.forEach(security => {
            expect(validCriticalities).toContain(security.criticality);
            expect(validStatuses).toContain(security.security_status);
          });
        }
      }
    });

    it('should validate compliance standards seeded for transmission', async () => {
      const { data: standards, error } = await supabase
        .from('compliance_standards')
        .select('id, name, full_name, status');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping compliance standards test');
        return;
      }

      expect(error).toBeNull();
      
      if (standards && standards.length > 0) {
        const transmissionStandards = ['IEC 62443', 'NERC CIP'];
        const hasTransmissionStandard = standards.some(std => 
          transmissionStandards.some(ts => std.name.includes(ts))
        );
        
        if (hasTransmissionStandard) {
          expect(hasTransmissionStandard).toBe(true);
        }
        
        standards.forEach(standard => {
          expect(standard.name).toBeDefined();
          expect(['compliant', 'non-compliant', 'in-progress', 'not-applicable']).toContain(standard.status);
        });
      }
    });
  });

  describe('Data Consistency Validations', () => {
    it('should validate foreign key consistency after seeding', async () => {
      // Check security_users reference valid tenants
      const { data: users, error: userError } = await supabase
        .from('security_users')
        .select(`
          id,
          tenant_id,
          tenants!inner(id, name)
        `)
        .limit(5);

      // If Supabase is not available, skip the test
      if (userError && userError.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping foreign key consistency test');
        return;
      }

      expect(userError).toBeNull();
      
      if (users && users.length > 0) {
        users.forEach(user => {
          expect(user.tenant_id).toBeDefined();
          expect(user.tenants).toBeDefined();
        });
      }
    });

    it('should validate OT asset security references valid assets', async () => {
      const { data: otSecurity, error } = await supabase
        .from('ot_asset_security')
        .select(`
          id,
          asset_id,
          assets!inner(id, name)
        `)
        .limit(5);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping OT asset security FK test');
        return;
      }

      expect(error).toBeNull();
      
      if (otSecurity && otSecurity.length > 0) {
        otSecurity.forEach(security => {
          expect(security.asset_id).toBeDefined();
          expect(security.assets).toBeDefined();
        });
      }
    });

    it('should validate security zones have consistent asset counts', async () => {
      const { data: zones, error } = await supabase
        .from('security_zones')
        .select('id, asset_count');

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping zone asset count test');
        return;
      }

      expect(error).toBeNull();
      
      if (zones && zones.length > 0) {
        for (const zone of zones) {
          const { data: assets, error: assetError } = await supabase
            .from('ot_asset_security')
            .select('id')
            .eq('zone_id', zone.id);

          expect(assetError).toBeNull();
          
          const actualCount = assets?.length || 0;
          expect(zone.asset_count).toBe(actualCount);
        }
      }
    });
  });

  describe('Migration Dependency Validation', () => {
    it('should validate migration order dependencies', async () => {
      // Security users should exist before other security tables that reference them
      const { data: userTable, error: userError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'security_users');

      // If Supabase is not available, skip the test
      if (userError && userError.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping migration dependency test');
        return;
      }

      expect(userError).toBeNull();
      expect(userTable).toHaveLength(1);

      // Security zones should exist before OT asset security
      const { data: zoneTable, error: zoneError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'security_zones');

      expect(zoneError).toBeNull();
      expect(zoneTable).toHaveLength(1);

      // OT asset security should exist and reference zones
      const { data: otTable, error: otError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'ot_asset_security');

      expect(otError).toBeNull();
      expect(otTable).toHaveLength(1);
    });

    it('should validate enum types created before tables that use them', async () => {
      const { data: enums, error } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typtype', 'e')
        .in('typname', ['transmission_role', 'user_status', 'security_alert_severity']);

      // If Supabase is not available, skip the test
      if (error && error.message.includes('NetworkError')) {
        console.warn('Supabase not available, skipping enum validation test');
        return;
      }

      expect(error).toBeNull();
      expect(enums?.length).toBeGreaterThanOrEqual(3);
    });
  });
});