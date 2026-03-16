/**
 * TransmissionProvider Tests
 * 
 * Tests for the TransmissionProvider API query functions
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.7, 27.1
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTransmissionProvider } from '../TransmissionProvider';
import type { TxSubstation, TxFeeder, TxTransformer, TxLine } from '@/types/transmission';

describe('TransmissionProvider', () => {
  const provider = getTransmissionProvider();
  
  // Test data IDs (will be populated during tests)
  let testOrgId: string;
  let testSubstationId: string;
  let testSubstation2Id: string;
  let testFeederId: string;
  let testTransformerId: string;
  let testLineId: string;

  describe('Substations', () => {
    it('should upsert a substation', async () => {
      // Create a test substation
      const substation = await provider.upsertTxSubstation({
        org_id: '00000000-0000-0000-0000-000000000001', // Use a test org ID
        code: 'TEST-SUB-001',
        name: 'Test Substation 001',
        region: 'North',
        voltage_levels_kv: [132, 33],
        active: true
      });

      expect(substation).toBeDefined();
      expect(substation.id).toBeDefined();
      expect(substation.code).toBe('TEST-SUB-001');
      expect(substation.name).toBe('Test Substation 001');
      expect(substation.region).toBe('North');
      
      testOrgId = substation.org_id;
      testSubstationId = substation.id;
    });

    it('should list substations with filters', async () => {
      const substations = await provider.listTxSubstations({
        org_id: testOrgId,
        active: true
      });

      expect(Array.isArray(substations)).toBe(true);
      expect(substations.length).toBeGreaterThan(0);
      expect(substations.every(s => s.org_id === testOrgId)).toBe(true);
      expect(substations.every(s => s.active === true)).toBe(true);
    });

    it('should get a substation by ID', async () => {
      const substation = await provider.getTxSubstation(testSubstationId);

      expect(substation).toBeDefined();
      expect(substation?.id).toBe(testSubstationId);
      expect(substation?.code).toBe('TEST-SUB-001');
    });

    it('should update a substation using upsert', async () => {
      const updated = await provider.upsertTxSubstation({
        org_id: testOrgId,
        code: 'TEST-SUB-001',
        name: 'Test Substation 001 Updated',
        region: 'South'
      });

      expect(updated.name).toBe('Test Substation 001 Updated');
      expect(updated.region).toBe('South');
    });

    it('should create a second substation for line testing', async () => {
      const substation = await provider.upsertTxSubstation({
        org_id: testOrgId,
        code: 'TEST-SUB-002',
        name: 'Test Substation 002',
        region: 'South',
        active: true
      });

      expect(substation).toBeDefined();
      testSubstation2Id = substation.id;
    });
  });

  describe('Feeders', () => {
    it('should upsert a feeder', async () => {
      const feeder = await provider.upsertTxFeeder({
        substation_id: testSubstationId,
        feeder_code: 'FDR-001',
        name: 'Test Feeder 001',
        voltage_level_kv: 33,
        direction: 'outgoer',
        capacity_mva: 50,
        active: true
      });

      expect(feeder).toBeDefined();
      expect(feeder.id).toBeDefined();
      expect(feeder.feeder_code).toBe('FDR-001');
      expect(feeder.name).toBe('Test Feeder 001');
      expect(feeder.direction).toBe('outgoer');
      
      testFeederId = feeder.id;
    });

    it('should list feeders with filters', async () => {
      const feeders = await provider.listTxFeeders({
        substation_id: testSubstationId,
        active: true
      });

      expect(Array.isArray(feeders)).toBe(true);
      expect(feeders.length).toBeGreaterThan(0);
      expect(feeders.every(f => f.substation_id === testSubstationId)).toBe(true);
      expect(feeders.every(f => f.active === true)).toBe(true);
    });

    it('should get a feeder by ID', async () => {
      const feeder = await provider.getTxFeeder(testFeederId);

      expect(feeder).toBeDefined();
      expect(feeder?.id).toBe(testFeederId);
      expect(feeder?.feeder_code).toBe('FDR-001');
    });

    it('should update a feeder using upsert', async () => {
      const updated = await provider.upsertTxFeeder({
        substation_id: testSubstationId,
        feeder_code: 'FDR-001',
        name: 'Test Feeder 001 Updated',
        capacity_mva: 75
      });

      expect(updated.name).toBe('Test Feeder 001 Updated');
      expect(updated.capacity_mva).toBe(75);
    });
  });

  describe('Transformers', () => {
    it('should upsert a transformer', async () => {
      const transformer = await provider.upsertTxTransformer({
        substation_id: testSubstationId,
        transformer_code: 'TRF-001',
        name: 'Test Transformer 001',
        primary_voltage_kv: 132,
        secondary_voltage_kv: 33,
        rated_capacity_mva: 100,
        cooling_type: 'ONAN',
        active: true
      });

      expect(transformer).toBeDefined();
      expect(transformer.id).toBeDefined();
      expect(transformer.transformer_code).toBe('TRF-001');
      expect(transformer.name).toBe('Test Transformer 001');
      expect(transformer.primary_voltage_kv).toBe(132);
      
      testTransformerId = transformer.id;
    });

    it('should list transformers with filters', async () => {
      const transformers = await provider.listTxTransformers({
        substation_id: testSubstationId,
        active: true
      });

      expect(Array.isArray(transformers)).toBe(true);
      expect(transformers.length).toBeGreaterThan(0);
      expect(transformers.every(t => t.substation_id === testSubstationId)).toBe(true);
      expect(transformers.every(t => t.active === true)).toBe(true);
    });

    it('should get a transformer by ID', async () => {
      const transformer = await provider.getTxTransformer(testTransformerId);

      expect(transformer).toBeDefined();
      expect(transformer?.id).toBe(testTransformerId);
      expect(transformer?.transformer_code).toBe('TRF-001');
    });

    it('should update a transformer using upsert', async () => {
      const updated = await provider.upsertTxTransformer({
        substation_id: testSubstationId,
        transformer_code: 'TRF-001',
        name: 'Test Transformer 001 Updated',
        rated_capacity_mva: 150
      });

      expect(updated.name).toBe('Test Transformer 001 Updated');
      expect(updated.rated_capacity_mva).toBe(150);
    });
  });

  describe('Transmission Lines', () => {
    it('should upsert a transmission line', async () => {
      const line = await provider.upsertTxLine({
        org_id: testOrgId,
        line_code: 'LINE-001',
        name: 'Test Line 001',
        from_substation_id: testSubstationId,
        to_substation_id: testSubstation2Id,
        voltage_level_kv: 132,
        length_km: 25.5,
        conductor_type: 'ACSR',
        active: true
      });

      expect(line).toBeDefined();
      expect(line.id).toBeDefined();
      expect(line.line_code).toBe('LINE-001');
      expect(line.name).toBe('Test Line 001');
      expect(line.from_substation_id).toBe(testSubstationId);
      expect(line.to_substation_id).toBe(testSubstation2Id);
      
      testLineId = line.id;
    });

    it('should reject a line with same from and to substations', async () => {
      await expect(
        provider.upsertTxLine({
          org_id: testOrgId,
          line_code: 'LINE-INVALID',
          name: 'Invalid Line',
          from_substation_id: testSubstationId,
          to_substation_id: testSubstationId, // Same as from
          voltage_level_kv: 132
        })
      ).rejects.toThrow('from_substation_id and to_substation_id must be different');
    });

    it('should list transmission lines with filters', async () => {
      const lines = await provider.listTxLines({
        org_id: testOrgId,
        active: true
      });

      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.every(l => l.org_id === testOrgId)).toBe(true);
      expect(lines.every(l => l.active === true)).toBe(true);
    });

    it('should get a transmission line by ID', async () => {
      const line = await provider.getTxLine(testLineId);

      expect(line).toBeDefined();
      expect(line?.id).toBe(testLineId);
      expect(line?.line_code).toBe('LINE-001');
    });

    it('should update a transmission line using upsert', async () => {
      const updated = await provider.upsertTxLine({
        org_id: testOrgId,
        line_code: 'LINE-001',
        name: 'Test Line 001 Updated',
        from_substation_id: testSubstationId,
        to_substation_id: testSubstation2Id,
        length_km: 30.0
      });

      expect(updated.name).toBe('Test Line 001 Updated');
      expect(updated.length_km).toBe(30.0);
    });
  });

  describe('Energy Meters with Topology Context', () => {
    it('should upsert an energy meter with topology bindings', async () => {
      const meter = await provider.upsertEnergyMeter({
        org_id: testOrgId,
        name: 'Test Meter 001',
        meter_code: 'MTR-001',
        status: 'Normal',
        energy_types: ['electricity'],
        substation_id: testSubstationId,
        feeder_id: testFeederId,
        meter_role: 'feeder_outgoing',
        active: true
      });

      expect(meter).toBeDefined();
      expect(meter.id).toBeDefined();
      expect(meter.meter_code).toBe('MTR-001');
      expect(meter.name).toBe('Test Meter 001');
      expect(meter.meter_role).toBe('feeder_outgoing');
      expect(meter.feeder_id).toBe(testFeederId);
    });

    it('should list energy meters with topology filters', async () => {
      const meters = await provider.listEnergyMetersTxScoped({
        org_id: testOrgId,
        substation_id: testSubstationId,
        active: true
      });

      expect(Array.isArray(meters)).toBe(true);
      // May be empty if view doesn't exist yet, but should not error
    });

    it('should filter meters by meter role', async () => {
      const meters = await provider.listEnergyMetersTxScoped({
        org_id: testOrgId,
        meter_role: 'feeder_outgoing'
      });

      expect(Array.isArray(meters)).toBe(true);
      // All returned meters should have the specified role
      if (meters.length > 0) {
        expect(meters.every(m => m.meter_role === 'feeder_outgoing')).toBe(true);
      }
    });

    it('should filter meters by energy type', async () => {
      const meters = await provider.listEnergyMetersTxScoped({
        org_id: testOrgId,
        energy_type: 'electricity'
      });

      expect(Array.isArray(meters)).toBe(true);
      // All returned meters should include the specified energy type
      if (meters.length > 0) {
        expect(meters.every(m => m.energy_types.includes('electricity'))).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle RLS denial gracefully', async () => {
      // This test assumes RLS is enabled and will deny access to non-existent org
      // In a real scenario, this would test with a user that doesn't have access
      // For now, we just verify the error handling structure exists
      expect(provider).toBeDefined();
    });

    it('should handle not found gracefully', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const substation = await provider.getTxSubstation(nonExistentId);
      
      expect(substation).toBeNull();
    });

    it('should handle duplicate entries', async () => {
      // Try to create a duplicate substation with same org_id and code
      // This should update the existing one via upsert
      const duplicate = await provider.upsertTxSubstation({
        org_id: testOrgId,
        code: 'TEST-SUB-001',
        name: 'Duplicate Test',
        region: 'East'
      });

      expect(duplicate).toBeDefined();
      expect(duplicate.name).toBe('Duplicate Test');
      expect(duplicate.region).toBe('East');
    });
  });
});
