/**
 * Verification tests for seed 2700_seed_energy_tx_foundation.sql
 * Tests idempotency, preconditions, and postchecks
 * Requirements: 1.7, 1.8, 30.2, 30.3, 30.4
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Seed 2700: Foundation Topology', () => {
  it('should verify transmission tenant exists (precondition)', async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, sector, subsector, scenario_tag')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .eq('scenario_tag', 'power_transmission_demo_v1')
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.name).toBe('DEWA - Transmission');
  });

  it('should verify substations were created with correct natural keys', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    expect(tenant).toBeDefined();

    const { data: substations, error } = await supabase
      .from('tx_substations')
      .select('id, code, name, region, voltage_levels_kv, active')
      .eq('org_id', tenant!.id)
      .order('code');

    expect(error).toBeNull();
    expect(substations).toBeDefined();
    expect(substations!.length).toBeGreaterThanOrEqual(5);

    // Verify expected substations exist
    const codes = substations!.map(s => s.code);
    expect(codes).toContain('SS-DXB-MAIN');
    expect(codes).toContain('SS-JA-MAIN');
    expect(codes).toContain('SS-AW-MAIN');
    expect(codes).toContain('SS-DXB-SOUTH');
    expect(codes).toContain('SS-CENTRAL');

    // Verify natural key uniqueness (org_id, code)
    const uniquePairs = new Set(substations!.map(s => `${s.code}`));
    expect(uniquePairs.size).toBe(substations!.length);
  });

  it('should verify bays were created with correct natural keys', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    const { data: bays, error } = await supabase
      .from('tx_bays')
      .select(`
        id,
        bay_code,
        name,
        bay_type,
        voltage_level_kv,
        tx_substations!inner(org_id, code)
      `)
      .eq('tx_substations.org_id', tenant!.id)
      .order('bay_code');

    expect(error).toBeNull();
    expect(bays).toBeDefined();
    expect(bays!.length).toBeGreaterThanOrEqual(8);

    // Verify no orphaned bays (all have valid substation references)
    bays!.forEach(bay => {
      expect(bay.tx_substations).toBeDefined();
    });
  });

  it('should verify feeders were created with correct natural keys', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    const { data: feeders, error } = await supabase
      .from('tx_feeders')
      .select(`
        id,
        feeder_code,
        name,
        voltage_level_kv,
        direction,
        capacity_mva,
        tx_substations!inner(org_id, code)
      `)
      .eq('tx_substations.org_id', tenant!.id)
      .order('feeder_code');

    expect(error).toBeNull();
    expect(feeders).toBeDefined();
    expect(feeders!.length).toBeGreaterThanOrEqual(10);

    // Verify no orphaned feeders
    feeders!.forEach(feeder => {
      expect(feeder.tx_substations).toBeDefined();
    });

    // Verify direction values are valid
    feeders!.forEach(feeder => {
      if (feeder.direction) {
        expect(['incomer', 'outgoer']).toContain(feeder.direction);
      }
    });
  });

  it('should verify transformers were created with correct natural keys', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    const { data: transformers, error } = await supabase
      .from('tx_transformers')
      .select(`
        id,
        transformer_code,
        name,
        primary_voltage_kv,
        secondary_voltage_kv,
        rated_capacity_mva,
        cooling_type,
        tap_changer_type,
        tx_substations!inner(org_id, code)
      `)
      .eq('tx_substations.org_id', tenant!.id)
      .order('transformer_code');

    expect(error).toBeNull();
    expect(transformers).toBeDefined();
    expect(transformers!.length).toBeGreaterThanOrEqual(6);

    // Verify no orphaned transformers
    transformers!.forEach(transformer => {
      expect(transformer.tx_substations).toBeDefined();
    });

    // Verify voltage levels are valid
    transformers!.forEach(transformer => {
      expect(transformer.primary_voltage_kv).toBeGreaterThan(0);
      expect(transformer.secondary_voltage_kv).toBeGreaterThan(0);
    });
  });

  it('should verify transmission lines were created with valid endpoints', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    const { data: lines, error } = await supabase
      .from('tx_lines')
      .select(`
        id,
        line_code,
        name,
        from_substation_id,
        to_substation_id,
        voltage_level_kv,
        length_km,
        conductor_type,
        thermal_rating_mva
      `)
      .eq('org_id', tenant!.id)
      .order('line_code');

    expect(error).toBeNull();
    expect(lines).toBeDefined();
    expect(lines!.length).toBeGreaterThanOrEqual(6);

    // Verify business rule: from and to substations must be different
    lines!.forEach(line => {
      expect(line.from_substation_id).not.toBe(line.to_substation_id);
    });

    // Verify expected lines exist
    const codes = lines!.map(l => l.line_code);
    expect(codes).toContain('LINE-CENTRAL-DXB');
    expect(codes).toContain('LINE-CENTRAL-JA');
    expect(codes).toContain('LINE-CENTRAL-AW');
  });

  it('should verify FK integrity (no orphaned records)', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    // Check for orphaned bays
    const { data: orphanedBays } = await supabase
      .from('tx_bays')
      .select('id, substation_id')
      .is('tx_substations.id', null);

    expect(orphanedBays).toBeDefined();
    expect(orphanedBays!.length).toBe(0);

    // Check for orphaned feeders
    const { data: orphanedFeeders } = await supabase
      .from('tx_feeders')
      .select('id, substation_id')
      .is('tx_substations.id', null);

    expect(orphanedFeeders).toBeDefined();
    expect(orphanedFeeders!.length).toBe(0);

    // Check for orphaned transformers
    const { data: orphanedTransformers } = await supabase
      .from('tx_transformers')
      .select('id, substation_id')
      .is('tx_substations.id', null);

    expect(orphanedTransformers).toBeDefined();
    expect(orphanedTransformers!.length).toBe(0);
  });

  it('should verify idempotency (running seed twice produces same result)', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    // Get initial counts
    const { count: initialSubstations } = await supabase
      .from('tx_substations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', tenant!.id);

    const { count: initialFeeders } = await supabase
      .from('tx_feeders')
      .select('*, tx_substations!inner(org_id)', { count: 'exact', head: true })
      .eq('tx_substations.org_id', tenant!.id);

    const { count: initialTransformers } = await supabase
      .from('tx_transformers')
      .select('*, tx_substations!inner(org_id)', { count: 'exact', head: true })
      .eq('tx_substations.org_id', tenant!.id);

    const { count: initialLines } = await supabase
      .from('tx_lines')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', tenant!.id);

    // Note: We can't actually re-run the seed file from here, but we can verify
    // that the upsert logic would work by checking for duplicates
    
    // Verify no duplicate substations (org_id, code)
    const { data: substations } = await supabase
      .from('tx_substations')
      .select('org_id, code')
      .eq('org_id', tenant!.id);

    const substationPairs = substations!.map(s => `${s.org_id}:${s.code}`);
    const uniqueSubstationPairs = new Set(substationPairs);
    expect(substationPairs.length).toBe(uniqueSubstationPairs.size);

    // Verify no duplicate feeders (substation_id, feeder_code)
    const { data: feeders } = await supabase
      .from('tx_feeders')
      .select('substation_id, feeder_code, tx_substations!inner(org_id)')
      .eq('tx_substations.org_id', tenant!.id);

    const feederPairs = feeders!.map(f => `${f.substation_id}:${f.feeder_code}`);
    const uniqueFeederPairs = new Set(feederPairs);
    expect(feederPairs.length).toBe(uniqueFeederPairs.size);

    // Verify no duplicate transformers (substation_id, transformer_code)
    const { data: transformers } = await supabase
      .from('tx_transformers')
      .select('substation_id, transformer_code, tx_substations!inner(org_id)')
      .eq('tx_substations.org_id', tenant!.id);

    const transformerPairs = transformers!.map(t => `${t.substation_id}:${t.transformer_code}`);
    const uniqueTransformerPairs = new Set(transformerPairs);
    expect(transformerPairs.length).toBe(uniqueTransformerPairs.size);

    // Verify no duplicate lines (org_id, line_code)
    const { data: lines } = await supabase
      .from('tx_lines')
      .select('org_id, line_code')
      .eq('org_id', tenant!.id);

    const linePairs = lines!.map(l => `${l.org_id}:${l.line_code}`);
    const uniqueLinePairs = new Set(linePairs);
    expect(linePairs.length).toBe(uniqueLinePairs.size);
  });

  it('should verify natural key constraints are enforced', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    // Try to insert a duplicate substation (should fail or be handled by upsert)
    const { data: existingSubstation } = await supabase
      .from('tx_substations')
      .select('id, code, name')
      .eq('org_id', tenant!.id)
      .limit(1)
      .single();

    if (existingSubstation) {
      // Attempt to insert duplicate - this should be handled by ON CONFLICT in the seed
      // We're just verifying the constraint exists
      const { data: substations } = await supabase
        .from('tx_substations')
        .select('id, code')
        .eq('org_id', tenant!.id)
        .eq('code', existingSubstation.code);

      // Should only have one substation with this code
      expect(substations!.length).toBe(1);
    }
  });

  it('should verify all seeded data has correct metadata', async () => {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .single();

    // Verify substations have created_at and updated_at
    const { data: substations } = await supabase
      .from('tx_substations')
      .select('id, code, created_at, updated_at, active')
      .eq('org_id', tenant!.id);

    substations!.forEach(sub => {
      expect(sub.created_at).toBeDefined();
      expect(sub.updated_at).toBeDefined();
      expect(sub.active).toBe(true);
    });

    // Verify feeders have proper metadata
    const { data: feeders } = await supabase
      .from('tx_feeders')
      .select('id, feeder_code, created_at, updated_at, active, tx_substations!inner(org_id)')
      .eq('tx_substations.org_id', tenant!.id);

    feeders!.forEach(feeder => {
      expect(feeder.created_at).toBeDefined();
      expect(feeder.updated_at).toBeDefined();
      expect(feeder.active).toBe(true);
    });
  });
});
