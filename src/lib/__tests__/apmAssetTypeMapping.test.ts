/**
 * Tests for APM Asset Type Mapping
 * 
 * Validates that APM transmission asset types correctly map to existing
 * database asset type codes (TRANSFORMER, BREAKER, BAY, METER).
 * 
 * Requirements: 31.4
 */

import { describe, it, expect } from 'vitest';
import {
  getExistingAssetTypeCode,
  getAPMAssetTypesForCode,
  getTransmissionRelevantAssetTypeCodes,
  isTransmissionRelevantAssetType,
  APM_TO_EXISTING_ASSET_TYPE_MAP
} from '../apmAssetTypeMapping';

describe('APM Asset Type Mapping', () => {
  describe('getExistingAssetTypeCode', () => {
    it('should map power_transformer to TRANSFORMER', () => {
      expect(getExistingAssetTypeCode('power_transformer')).toBe('TRANSFORMER');
    });

    it('should map circuit_breaker to BREAKER', () => {
      expect(getExistingAssetTypeCode('circuit_breaker')).toBe('BREAKER');
    });

    it('should map substation_bay to BAY', () => {
      expect(getExistingAssetTypeCode('substation_bay')).toBe('BAY');
    });

    it('should map meter to METER', () => {
      expect(getExistingAssetTypeCode('meter')).toBe('METER');
    });

    it('should map protection_relay to METER', () => {
      expect(getExistingAssetTypeCode('protection_relay')).toBe('METER');
    });

    it('should map ct (current transformer) to METER', () => {
      expect(getExistingAssetTypeCode('ct')).toBe('METER');
    });

    it('should map vt (voltage transformer) to METER', () => {
      expect(getExistingAssetTypeCode('vt')).toBe('METER');
    });
  });

  describe('getAPMAssetTypesForCode', () => {
    it('should return all APM types that map to TRANSFORMER', () => {
      const types = getAPMAssetTypesForCode('TRANSFORMER');
      expect(types).toContain('power_transformer');
      expect(types).toContain('reactor');
      expect(types).toContain('capacitor_bank');
    });

    it('should return all APM types that map to BREAKER', () => {
      const types = getAPMAssetTypesForCode('BREAKER');
      expect(types).toContain('circuit_breaker');
      expect(types).toContain('disconnect_switch');
    });

    it('should return all APM types that map to BAY', () => {
      const types = getAPMAssetTypesForCode('BAY');
      expect(types).toContain('substation_bay');
      expect(types).toContain('busbar');
      expect(types).toContain('transmission_line');
      expect(types).toContain('line_terminal');
      expect(types).toContain('surge_arrester');
    });

    it('should return all APM types that map to METER', () => {
      const types = getAPMAssetTypesForCode('METER');
      expect(types).toContain('meter');
      expect(types).toContain('protection_relay');
      expect(types).toContain('ct');
      expect(types).toContain('vt');
      expect(types).toContain('scada_rtu');
      expect(types).toContain('plc_ied');
      expect(types).toContain('station_battery');
      expect(types).toContain('charger');
    });
  });

  describe('getTransmissionRelevantAssetTypeCodes', () => {
    it('should return all four transmission-relevant codes', () => {
      const codes = getTransmissionRelevantAssetTypeCodes();
      expect(codes).toHaveLength(4);
      expect(codes).toContain('TRANSFORMER');
      expect(codes).toContain('BREAKER');
      expect(codes).toContain('BAY');
      expect(codes).toContain('METER');
    });
  });

  describe('isTransmissionRelevantAssetType', () => {
    it('should return true for TRANSFORMER', () => {
      expect(isTransmissionRelevantAssetType('TRANSFORMER')).toBe(true);
    });

    it('should return true for BREAKER', () => {
      expect(isTransmissionRelevantAssetType('BREAKER')).toBe(true);
    });

    it('should return true for BAY', () => {
      expect(isTransmissionRelevantAssetType('BAY')).toBe(true);
    });

    it('should return true for METER', () => {
      expect(isTransmissionRelevantAssetType('METER')).toBe(true);
    });

    it('should return false for non-transmission types', () => {
      expect(isTransmissionRelevantAssetType('PUMP')).toBe(false);
      expect(isTransmissionRelevantAssetType('MOTOR')).toBe(false);
      expect(isTransmissionRelevantAssetType('WELLHEAD')).toBe(false);
    });
  });

  describe('Complete mapping coverage', () => {
    it('should have a mapping for every TransmissionAssetType', () => {
      // All 18 transmission asset types should be mapped
      const mappedTypes = Object.keys(APM_TO_EXISTING_ASSET_TYPE_MAP);
      expect(mappedTypes.length).toBe(18);
    });

    it('should only map to valid existing asset type codes', () => {
      const validCodes = ['TRANSFORMER', 'BREAKER', 'BAY', 'METER'];
      const mappedCodes = Object.values(APM_TO_EXISTING_ASSET_TYPE_MAP);
      
      mappedCodes.forEach(code => {
        expect(validCodes).toContain(code);
      });
    });
  });

  describe('Logical groupings', () => {
    it('should group power equipment under TRANSFORMER', () => {
      expect(getExistingAssetTypeCode('power_transformer')).toBe('TRANSFORMER');
      expect(getExistingAssetTypeCode('reactor')).toBe('TRANSFORMER');
      expect(getExistingAssetTypeCode('capacitor_bank')).toBe('TRANSFORMER');
    });

    it('should group switching equipment under BREAKER', () => {
      expect(getExistingAssetTypeCode('circuit_breaker')).toBe('BREAKER');
      expect(getExistingAssetTypeCode('disconnect_switch')).toBe('BREAKER');
    });

    it('should group bay infrastructure under BAY', () => {
      expect(getExistingAssetTypeCode('substation_bay')).toBe('BAY');
      expect(getExistingAssetTypeCode('busbar')).toBe('BAY');
      expect(getExistingAssetTypeCode('transmission_line')).toBe('BAY');
      expect(getExistingAssetTypeCode('line_terminal')).toBe('BAY');
      expect(getExistingAssetTypeCode('surge_arrester')).toBe('BAY');
    });

    it('should group measurement and control devices under METER', () => {
      expect(getExistingAssetTypeCode('meter')).toBe('METER');
      expect(getExistingAssetTypeCode('protection_relay')).toBe('METER');
      expect(getExistingAssetTypeCode('ct')).toBe('METER');
      expect(getExistingAssetTypeCode('vt')).toBe('METER');
      expect(getExistingAssetTypeCode('scada_rtu')).toBe('METER');
      expect(getExistingAssetTypeCode('plc_ied')).toBe('METER');
    });
  });
});
