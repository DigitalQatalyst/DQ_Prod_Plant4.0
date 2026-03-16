/**
 * APM Tenant Validation
 * 
 * Utilities for validating tenant data consistency and ensuring
 * APM features work with power/transmission sector tenants.
 * 
 * Requirements: 31.9, 31.10
 */

import { supabase } from './supabase';
import { getTransmissionTenantId } from './tenantUtils';

/**
 * Tenant validation result
 */
export interface TenantValidationResult {
  isValid: boolean;
  isPowerTransmission: boolean;
  hasAssets: boolean;
  hasGridTopology: boolean;
  hasTelemetry: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a tenant is configured for power transmission
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns Validation result with details
 * 
 * @example
 * ```ts
 * const result = await validateTransmissionTenant('t1');
 * if (!result.isValid) {
 *   console.error('Tenant validation failed:', result.errors);
 * }
 * ```
 */
export async function validateTransmissionTenant(mockTenantId: string): Promise<TenantValidationResult> {
  const result: TenantValidationResult = {
    isValid: true,
    isPowerTransmission: false,
    hasAssets: false,
    hasGridTopology: false,
    hasTelemetry: false,
    errors: [],
    warnings: []
  };

  if (!supabase) {
    result.isValid = false;
    result.errors.push('Supabase client not configured');
    return result;
  }

  try {
    // Get the real tenant ID
    const tenantId = await getTransmissionTenantId(mockTenantId);

    // 1. Validate tenant exists and is power/transmission
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      result.isValid = false;
      result.errors.push('Tenant not found in database');
      return result;
    }

    // Check if tenant is power/transmission
    if (tenant.sector !== 'power' || tenant.subsector !== 'transmission') {
      result.isValid = false;
      result.errors.push(`Tenant is not a power transmission tenant (sector: ${tenant.sector}, subsector: ${tenant.subsector})`);
      return result;
    }

    result.isPowerTransmission = true;

    // 2. Check if tenant has assets
    const { count: assetCount, error: assetError } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (assetError) {
      result.warnings.push('Could not check asset count');
    } else {
      result.hasAssets = (assetCount || 0) > 0;
      if (!result.hasAssets) {
        result.warnings.push('Tenant has no assets configured');
      }
    }

    // 3. Check if tenant has grid topology
    const { count: nodeCount, error: nodeError } = await supabase
      .from('grid_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (nodeError) {
      result.warnings.push('Could not check grid topology');
    } else {
      result.hasGridTopology = (nodeCount || 0) > 0;
      if (!result.hasGridTopology) {
        result.warnings.push('Tenant has no grid topology configured');
      }
    }

    // 4. Check if tenant has telemetry configured
    const { count: telemetryCount, error: telemetryError } = await supabase
      .from('telemetry_points')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (telemetryError) {
      result.warnings.push('Could not check telemetry configuration');
    } else {
      result.hasTelemetry = (telemetryCount || 0) > 0;
      if (!result.hasTelemetry) {
        result.warnings.push('Tenant has no telemetry points configured');
      }
    }

    return result;
  } catch (err) {
    result.isValid = false;
    result.errors.push(`Validation failed: ${err instanceof Error ? err.message : String(err)}`);
    return result;
  }
}

/**
 * Check if a tenant has transmission data
 * 
 * @param mockTenantId - The tenant ID from AppContext
 * @returns True if tenant has transmission data (assets, grid, or telemetry)
 * 
 * @example
 * ```ts
 * const hasData = await tenantHasTransmissionData('t1');
 * if (!hasData) {
 *   // Show empty state
 * }
 * ```
 */
export async function tenantHasTransmissionData(mockTenantId: string): Promise<boolean> {
  const result = await validateTransmissionTenant(mockTenantId);
  return result.hasAssets || result.hasGridTopology || result.hasTelemetry;
}

/**
 * Validate DEWA transmission tenant structure
 * 
 * Specifically validates the DEWA tenant used in demos and testing
 * 
 * @returns Validation result for DEWA tenant
 * 
 * @example
 * ```ts
 * const result = await validateDEWATenant();
 * console.log('DEWA tenant valid:', result.isValid);
 * ```
 */
export async function validateDEWATenant(): Promise<TenantValidationResult> {
  if (!supabase) {
    return {
      isValid: false,
      isPowerTransmission: false,
      hasAssets: false,
      hasGridTopology: false,
      hasTelemetry: false,
      errors: ['Supabase client not configured'],
      warnings: []
    };
  }

  try {
    // Look for DEWA tenant by name and scenario tag
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('name', 'DEWA - Transmission')
      .eq('sector', 'power')
      .eq('subsector', 'transmission')
      .eq('scenario_tag', 'power_transmission_demo_v1')
      .single();

    if (tenantError || !tenant) {
      return {
        isValid: false,
        isPowerTransmission: false,
        hasAssets: false,
        hasGridTopology: false,
        hasTelemetry: false,
        errors: ['DEWA - Transmission tenant not found'],
        warnings: []
      };
    }

    // Validate the DEWA tenant using standard validation
    return await validateTransmissionTenant(tenant.id);
  } catch (err) {
    return {
      isValid: false,
      isPowerTransmission: false,
      hasAssets: false,
      hasGridTopology: false,
      hasTelemetry: false,
      errors: [`DEWA validation failed: ${err instanceof Error ? err.message : String(err)}`],
      warnings: []
    };
  }
}

/**
 * Get tenant validation summary for display
 * 
 * @param result - Validation result
 * @returns Human-readable summary
 * 
 * @example
 * ```ts
 * const result = await validateTransmissionTenant('t1');
 * const summary = getTenantValidationSummary(result);
 * console.log(summary);
 * ```
 */
export function getTenantValidationSummary(result: TenantValidationResult): string {
  if (!result.isValid) {
    return `Tenant validation failed: ${result.errors.join(', ')}`;
  }

  const parts: string[] = [];
  
  if (result.isPowerTransmission) {
    parts.push('✓ Power transmission tenant');
  }
  
  if (result.hasAssets) {
    parts.push('✓ Has assets');
  } else {
    parts.push('⚠ No assets');
  }
  
  if (result.hasGridTopology) {
    parts.push('✓ Has grid topology');
  } else {
    parts.push('⚠ No grid topology');
  }
  
  if (result.hasTelemetry) {
    parts.push('✓ Has telemetry');
  } else {
    parts.push('⚠ No telemetry');
  }

  return parts.join(' | ');
}
