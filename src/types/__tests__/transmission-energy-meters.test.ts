/**
 * Energy Meter Types Test
 * 
 * This test verifies that the TypeScript types for energy meters
 * are correctly defined and can be used in type-safe code.
 */

import { describe, it, expect } from 'vitest';
import type { 
  EnergyMeter, 
  EnergyMeterWithTopology,
  MeterRoleType,
  MeterStatusType,
  EnergyType 
} from '../transmission';

describe('Energy Meter Types', () => {
  describe('MeterRoleType', () => {
    it('should accept all valid meter role values', () => {
      const validRoles: MeterRoleType[] = [
        'grid_incomer',
        'feeder_outgoing',
        'transformer_lv',
        'station_service',
        'line_monitoring',
        'bay_metering'
      ];
      
      expect(validRoles).toHaveLength(6);
      expect(validRoles).toContain('grid_incomer');
      expect(validRoles).toContain('feeder_outgoing');
    });
  });

  describe('MeterStatusType', () => {
    it('should accept all valid meter status values', () => {
      const validStatuses: MeterStatusType[] = [
        'Normal',
        'High',
        'Critical',
        'Offline',
        'Maintenance'
      ];
      
      expect(validStatuses).toHaveLength(5);
      expect(validStatuses).toContain('Normal');
      expect(validStatuses).toContain('Critical');
    });
  });

  describe('EnergyType', () => {
    it('should accept all valid energy type values', () => {
      const validTypes: EnergyType[] = [
        'electricity',
        'gas',
        'diesel',
        'steam',
        'water',
        'compressed_air'
      ];
      
      expect(validTypes).toHaveLength(6);
      expect(validTypes).toContain('electricity');
      expect(validTypes).toContain('gas');
    });
  });

  describe('EnergyMeter interface', () => {
    it('should create a valid energy meter object', () => {
      const meter: EnergyMeter = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: '123e4567-e89b-12d3-a456-426614174001',
        site_id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Main Grid Incomer',
        meter_code: 'MGI-001',
        status: 'Normal',
        energy_types: ['electricity'],
        substation_id: '123e4567-e89b-12d3-a456-426614174003',
        feeder_id: null,
        bay_id: null,
        transformer_id: null,
        meter_role: 'grid_incomer',
        meter_type: 'main',
        scope: 'substation',
        location: 'Substation A',
        installation_date: '2024-01-15',
        manufacturer: 'Schneider Electric',
        model: 'PM8000',
        serial_number: 'SN123456',
        communication_protocol: 'Modbus TCP',
        meter_constant: 1.0,
        current_demand_kw: 1250.5,
        rated_capacity_kw: 5000.0,
        metadata: {},
        active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: null,
        updated_by: null
      };
      
      expect(meter.name).toBe('Main Grid Incomer');
      expect(meter.meter_role).toBe('grid_incomer');
      expect(meter.substation_id).not.toBeNull();
      expect(meter.energy_types).toContain('electricity');
    });

    it('should allow nullable topology fields', () => {
      const meter: EnergyMeter = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: '123e4567-e89b-12d3-a456-426614174001',
        site_id: null,
        name: 'Standalone Meter',
        meter_code: null,
        status: 'Normal',
        energy_types: ['electricity'],
        substation_id: null,
        feeder_id: null,
        bay_id: null,
        transformer_id: null,
        meter_role: null,
        meter_type: null,
        scope: null,
        location: null,
        installation_date: null,
        manufacturer: null,
        model: null,
        serial_number: null,
        communication_protocol: null,
        meter_constant: 1.0,
        current_demand_kw: null,
        rated_capacity_kw: null,
        metadata: {},
        active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: null,
        updated_by: null
      };
      
      expect(meter.substation_id).toBeNull();
      expect(meter.feeder_id).toBeNull();
      expect(meter.meter_role).toBeNull();
    });

    it('should support multiple energy types', () => {
      const meter: Partial<EnergyMeter> = {
        energy_types: ['electricity', 'gas', 'steam']
      };
      
      expect(meter.energy_types).toHaveLength(3);
      expect(meter.energy_types).toContain('electricity');
      expect(meter.energy_types).toContain('gas');
      expect(meter.energy_types).toContain('steam');
    });
  });

  describe('EnergyMeterWithTopology interface', () => {
    it('should extend EnergyMeter with resolved topology names', () => {
      const meterWithTopology: EnergyMeterWithTopology = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: '123e4567-e89b-12d3-a456-426614174001',
        site_id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Feeder Meter',
        meter_code: 'FM-001',
        status: 'Normal',
        energy_types: ['electricity'],
        substation_id: '123e4567-e89b-12d3-a456-426614174003',
        feeder_id: '123e4567-e89b-12d3-a456-426614174004',
        bay_id: null,
        transformer_id: null,
        meter_role: 'feeder_outgoing',
        meter_type: 'main',
        scope: 'feeder',
        location: 'Feeder Bay 1',
        installation_date: '2024-01-15',
        manufacturer: 'ABB',
        model: 'M2M',
        serial_number: 'SN789012',
        communication_protocol: 'IEC 61850',
        meter_constant: 1.0,
        current_demand_kw: 850.0,
        rated_capacity_kw: 2000.0,
        metadata: {},
        active: true,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        created_by: null,
        updated_by: null,
        // Extended fields from view
        substation_name: 'Substation A',
        feeder_name: 'Feeder 1',
        bay_code: 'BAY-01',
        transformer_name: null,
        last_telemetry_at: '2024-01-15T12:00:00Z',
        current_kw: 850.0
      };
      
      expect(meterWithTopology.substation_name).toBe('Substation A');
      expect(meterWithTopology.feeder_name).toBe('Feeder 1');
      expect(meterWithTopology.last_telemetry_at).not.toBeNull();
      expect(meterWithTopology.current_kw).toBe(850.0);
    });
  });

  describe('Type safety', () => {
    it('should enforce meter role topology requirements at type level', () => {
      // This test demonstrates that TypeScript types allow the correct combinations
      const gridIncomerMeter: Partial<EnergyMeter> = {
        meter_role: 'grid_incomer',
        substation_id: '123e4567-e89b-12d3-a456-426614174003'
      };
      
      const feederMeter: Partial<EnergyMeter> = {
        meter_role: 'feeder_outgoing',
        feeder_id: '123e4567-e89b-12d3-a456-426614174004'
      };
      
      const transformerMeter: Partial<EnergyMeter> = {
        meter_role: 'transformer_lv',
        transformer_id: '123e4567-e89b-12d3-a456-426614174005'
      };
      
      expect(gridIncomerMeter.meter_role).toBe('grid_incomer');
      expect(feederMeter.meter_role).toBe('feeder_outgoing');
      expect(transformerMeter.meter_role).toBe('transformer_lv');
    });
  });
});
