/**
 * Transmission Views and Functions Type Tests
 * Verifies TypeScript types for database views and functions
 * Requirements: 1.6, 2.5
 */

import { describe, test, expect } from 'vitest';
import type {
  TxEnergyMeterRegistry,
  TxLatestMeterSnapshot,
  TxEnergyConsumption,
  EnergyTelemetry,
  TxSubstation,
  TxFeeder,
  TxBay,
  TxTransformer,
  TxLine
} from '../transmission';

describe('Transmission Views and Functions Types', () => {
  test('TxEnergyMeterRegistry type should have all required fields', () => {
    const mockRegistry: TxEnergyMeterRegistry = {
      // Meter core fields
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      site_id: null,
      name: 'Test Meter',
      meter_code: 'MTR-001',
      status: 'Normal',
      energy_types: ['electricity'],
      meter_role: 'grid_incomer',
      meter_type: 'main',
      scope: 'substation',
      location: 'Bay 1',
      active: true,
      
      // Topology references
      substation_id: '123e4567-e89b-12d3-a456-426614174002',
      feeder_id: null,
      bay_id: null,
      transformer_id: null,
      
      // Resolved topology names
      substation_name: 'Main Substation',
      substation_code: 'SUB-001',
      substation_region: 'North',
      feeder_name: null,
      feeder_code: null,
      feeder_direction: null,
      feeder_voltage_kv: null,
      bay_name: null,
      bay_code: null,
      bay_type: null,
      transformer_name: null,
      transformer_code: null,
      transformer_capacity_mva: null,
      
      // Latest telemetry
      last_telemetry_at: '2024-01-15T12:00:00Z',
      current_kw: 1500.5,
      current_kwh: 12000.0,
      current_voltage_v: 132000,
      current_power_factor: 0.95,
      current_frequency_hz: 50.0,
      current_thd_pct: 2.5,
      
      // Staleness
      is_stale: false,
      
      // Metadata
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockRegistry.id).toBeDefined();
    expect(mockRegistry.name).toBe('Test Meter');
    expect(mockRegistry.substation_name).toBe('Main Substation');
    expect(mockRegistry.current_kw).toBe(1500.5);
    expect(mockRegistry.is_stale).toBe(false);
  });

  test('TxLatestMeterSnapshot type should have all required fields', () => {
    const mockSnapshot: TxLatestMeterSnapshot = {
      // Telemetry fields
      meter_id: '123e4567-e89b-12d3-a456-426614174000',
      meter_name: 'Test Meter',
      timestamp: '2024-01-15T12:00:00Z',
      kw: 1500.5,
      kwh: 12000.0,
      voltage_v: 132000,
      current_a: 11.36,
      power_factor: 0.95,
      frequency_hz: 50.0,
      thd_pct: 2.5,
      
      // Multi-phase
      voltage_l1_v: 132000,
      voltage_l2_v: 132100,
      voltage_l3_v: 131900,
      current_l1_a: 11.36,
      current_l2_a: 11.40,
      current_l3_a: 11.32,
      
      // Data quality
      data_source: 'meter',
      quality_score: 1.0,
      
      // Power quality summary (24-hour)
      pq_avg_power_factor: 0.94,
      pq_avg_thd: 2.8,
      pq_min_voltage: 131500,
      pq_max_voltage: 132500,
      pq_avg_frequency: 50.01
    };
    
    expect(mockSnapshot.meter_id).toBeDefined();
    expect(mockSnapshot.meter_name).toBe('Test Meter');
    expect(mockSnapshot.kw).toBe(1500.5);
    expect(mockSnapshot.pq_avg_power_factor).toBe(0.94);
    expect(mockSnapshot.pq_min_voltage).toBe(131500);
  });

  test('TxEnergyConsumption type should have all required fields', () => {
    const mockConsumption: TxEnergyConsumption = {
      meter_id: '123e4567-e89b-12d3-a456-426614174000',
      meter_name: 'Test Meter',
      period_start: '2024-01-01T00:00:00Z',
      period_end: '2024-01-02T00:00:00Z',
      total_kwh: 36000.0,
      avg_kw: 1500.0,
      max_kw: 2000.0,
      min_kw: 1000.0,
      data_point_count: 96,  // 24 hours * 4 readings per hour
      avg_power_factor: 0.95,
      avg_voltage_v: 132000,
      avg_frequency_hz: 50.0
    };
    
    expect(mockConsumption.meter_id).toBeDefined();
    expect(mockConsumption.total_kwh).toBe(36000.0);
    expect(mockConsumption.avg_kw).toBe(1500.0);
    expect(mockConsumption.data_point_count).toBe(96);
  });

  test('EnergyTelemetry type should have all required fields', () => {
    const mockTelemetry: EnergyTelemetry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      meter_id: '123e4567-e89b-12d3-a456-426614174001',
      timestamp: '2024-01-15T12:00:00Z',
      
      // Energy and power
      kwh: 12000.0,
      kw: 1500.5,
      
      // Electrical parameters
      voltage_v: 132000,
      current_a: 11.36,
      power_factor: 0.95,
      frequency_hz: 50.0,
      thd_pct: 2.5,
      
      // Multi-phase
      voltage_l1_v: 132000,
      voltage_l2_v: 132100,
      voltage_l3_v: 131900,
      current_l1_a: 11.36,
      current_l2_a: 11.40,
      current_l3_a: 11.32,
      
      // Data quality
      quality_score: 1.0,
      data_source: 'meter',
      metadata: {},
      created_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockTelemetry.id).toBeDefined();
    expect(mockTelemetry.meter_id).toBeDefined();
    expect(mockTelemetry.kw).toBe(1500.5);
    expect(mockTelemetry.voltage_v).toBe(132000);
  });

  test('TxSubstation type should have all required fields', () => {
    const mockSubstation: TxSubstation = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      code: 'SUB-001',
      name: 'Main Substation',
      region: 'North',
      voltage_levels_kv: [132, 220, 400],
      geo: { type: 'Point', coordinates: [0, 0] },
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockSubstation.id).toBeDefined();
    expect(mockSubstation.code).toBe('SUB-001');
    expect(mockSubstation.voltage_levels_kv).toEqual([132, 220, 400]);
  });

  test('TxFeeder type should have all required fields', () => {
    const mockFeeder: TxFeeder = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      substation_id: '123e4567-e89b-12d3-a456-426614174001',
      feeder_code: 'FDR-001',
      name: 'Feeder 1',
      voltage_level_kv: 132,
      direction: 'outgoer',
      utility_ref: 'UT-001',
      capacity_mva: 100,
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockFeeder.id).toBeDefined();
    expect(mockFeeder.feeder_code).toBe('FDR-001');
    expect(mockFeeder.direction).toBe('outgoer');
  });

  test('TxBay type should have all required fields', () => {
    const mockBay: TxBay = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      substation_id: '123e4567-e89b-12d3-a456-426614174001',
      bay_code: 'BAY-001',
      name: 'Bay 1',
      bay_type: 'line_bay',
      voltage_level_kv: 132,
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockBay.id).toBeDefined();
    expect(mockBay.bay_code).toBe('BAY-001');
    expect(mockBay.bay_type).toBe('line_bay');
  });

  test('TxTransformer type should have all required fields', () => {
    const mockTransformer: TxTransformer = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      substation_id: '123e4567-e89b-12d3-a456-426614174001',
      transformer_code: 'TRF-001',
      name: 'Transformer 1',
      primary_voltage_kv: 220,
      secondary_voltage_kv: 132,
      tertiary_voltage_kv: null,
      rated_capacity_mva: 100,
      cooling_type: 'ONAN',
      tap_changer_type: 'OLTC',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockTransformer.id).toBeDefined();
    expect(mockTransformer.transformer_code).toBe('TRF-001');
    expect(mockTransformer.cooling_type).toBe('ONAN');
  });

  test('TxLine type should have all required fields', () => {
    const mockLine: TxLine = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      line_code: 'LINE-001',
      name: 'Line 1',
      from_substation_id: '123e4567-e89b-12d3-a456-426614174002',
      to_substation_id: '123e4567-e89b-12d3-a456-426614174003',
      voltage_level_kv: 220,
      length_km: 50.5,
      conductor_type: 'ACSR',
      thermal_rating_mva: 200,
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockLine.id).toBeDefined();
    expect(mockLine.line_code).toBe('LINE-001');
    expect(mockLine.length_km).toBe(50.5);
  });

  test('TxEnergyMeterRegistry should support nullable topology fields', () => {
    const mockRegistry: TxEnergyMeterRegistry = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      org_id: '123e4567-e89b-12d3-a456-426614174001',
      site_id: null,
      name: 'Test Meter',
      meter_code: null,
      status: 'Normal',
      energy_types: ['electricity'],
      meter_role: null,
      meter_type: null,
      scope: null,
      location: null,
      active: true,
      
      // All topology fields can be null
      substation_id: null,
      feeder_id: null,
      bay_id: null,
      transformer_id: null,
      substation_name: null,
      substation_code: null,
      substation_region: null,
      feeder_name: null,
      feeder_code: null,
      feeder_direction: null,
      feeder_voltage_kv: null,
      bay_name: null,
      bay_code: null,
      bay_type: null,
      transformer_name: null,
      transformer_code: null,
      transformer_capacity_mva: null,
      
      // Telemetry can be null if no data
      last_telemetry_at: null,
      current_kw: null,
      current_kwh: null,
      current_voltage_v: null,
      current_power_factor: null,
      current_frequency_hz: null,
      current_thd_pct: null,
      
      // Stale when no telemetry
      is_stale: true,
      
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T12:00:00Z'
    };
    
    expect(mockRegistry.substation_name).toBeNull();
    expect(mockRegistry.last_telemetry_at).toBeNull();
    expect(mockRegistry.is_stale).toBe(true);
  });

  test('TxLatestMeterSnapshot should support nullable measurements', () => {
    const mockSnapshot: TxLatestMeterSnapshot = {
      meter_id: '123e4567-e89b-12d3-a456-426614174000',
      meter_name: 'Test Meter',
      timestamp: '2024-01-15T12:00:00Z',
      
      // All measurements can be null
      kw: null,
      kwh: null,
      voltage_v: null,
      current_a: null,
      power_factor: null,
      frequency_hz: null,
      thd_pct: null,
      voltage_l1_v: null,
      voltage_l2_v: null,
      voltage_l3_v: null,
      current_l1_a: null,
      current_l2_a: null,
      current_l3_a: null,
      data_source: null,
      quality_score: null,
      
      // PQ summary can be null if no data
      pq_avg_power_factor: null,
      pq_avg_thd: null,
      pq_min_voltage: null,
      pq_max_voltage: null,
      pq_avg_frequency: null
    };
    
    expect(mockSnapshot.kw).toBeNull();
    expect(mockSnapshot.pq_avg_power_factor).toBeNull();
  });
});
