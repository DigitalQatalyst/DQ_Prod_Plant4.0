/**
 * APM Asset Type Mapping
 * 
 * Maps APM transmission asset types to existing asset type codes in the database.
 * This ensures adherence to the existing asset type structure (TRANSFORMER, BREAKER, BAY, METER).
 * 
 * Requirements: 31.4
 */

import type { TransmissionAssetType } from '@/types/apm';

/**
 * Existing asset type codes in the database
 */
export type ExistingAssetTypeCode = 'TRANSFORMER' | 'BREAKER' | 'BAY' | 'METER';

/**
 * Map APM transmission asset types to existing database asset type codes
 * 
 * This mapping ensures that APM features work with the existing asset type structure
 * rather than creating duplicate or conflicting asset types.
 */
export const APM_TO_EXISTING_ASSET_TYPE_MAP: Record<TransmissionAssetType, ExistingAssetTypeCode> = {
  // Transformers
  'power_transformer': 'TRANSFORMER',
  
  // Breakers and switches
  'circuit_breaker': 'BREAKER',
  'disconnect_switch': 'BREAKER', // Treated as a type of breaker
  
  // Bays and busbars
  'substation_bay': 'BAY',
  'busbar': 'BAY', // Busbar is part of bay infrastructure
  
  // Lines and terminals
  'transmission_line': 'BAY', // Lines are managed through bays
  'line_terminal': 'BAY',
  
  // Protection and control
  'protection_relay': 'METER', // Relays are measurement/protection devices
  'ct': 'METER', // Current transformers are measurement devices
  'vt': 'METER', // Voltage transformers are measurement devices
  'meter': 'METER',
  'scada_rtu': 'METER', // RTUs are data acquisition devices
  'plc_ied': 'METER', // IEDs are intelligent measurement/control devices
  
  // Other equipment
  'surge_arrester': 'BAY', // Protection equipment in bays
  'reactor': 'TRANSFORMER', // Reactors are similar to transformers
  'capacitor_bank': 'TRANSFORMER', // Capacitor banks are power equipment
  'station_battery': 'METER', // Batteries are monitored equipment
  'charger': 'METER', // Chargers are monitored equipment
};

/**
 * Get the existing asset type code for an APM transmission asset type
 * 
 * @param apmAssetType - The APM transmission asset type
 * @returns The existing database asset type code
 * 
 * @example
 * ```ts
 * const code = getExistingAssetTypeCode('power_transformer');
 * // Returns: 'TRANSFORMER'
 * ```
 */
export function getExistingAssetTypeCode(apmAssetType: TransmissionAssetType): ExistingAssetTypeCode {
  return APM_TO_EXISTING_ASSET_TYPE_MAP[apmAssetType];
}

/**
 * Get all APM asset types that map to a specific existing asset type code
 * 
 * @param existingCode - The existing database asset type code
 * @returns Array of APM transmission asset types that map to this code
 * 
 * @example
 * ```ts
 * const types = getAPMAssetTypesForCode('TRANSFORMER');
 * // Returns: ['power_transformer', 'reactor', 'capacitor_bank']
 * ```
 */
export function getAPMAssetTypesForCode(existingCode: ExistingAssetTypeCode): TransmissionAssetType[] {
  return Object.entries(APM_TO_EXISTING_ASSET_TYPE_MAP)
    .filter(([_, code]) => code === existingCode)
    .map(([apmType, _]) => apmType as TransmissionAssetType);
}

/**
 * Filter transmission-relevant asset types from a query
 * 
 * This function helps filter assets to only show transmission-relevant types
 * when querying the database.
 * 
 * @returns Array of existing asset type codes relevant to transmission
 */
export function getTransmissionRelevantAssetTypeCodes(): ExistingAssetTypeCode[] {
  return ['TRANSFORMER', 'BREAKER', 'BAY', 'METER'];
}

/**
 * Check if an existing asset type code is transmission-relevant
 * 
 * @param code - The existing asset type code to check
 * @returns True if the code is relevant to transmission operations
 */
export function isTransmissionRelevantAssetType(code: string): code is ExistingAssetTypeCode {
  return ['TRANSFORMER', 'BREAKER', 'BAY', 'METER'].includes(code);
}
