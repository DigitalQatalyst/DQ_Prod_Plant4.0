/**
 * TransmissionProvider
 * 
 * Implements API query functions for EMS Power Transmission foundation entities.
 * Provides CRUD operations for transmission topology (substations, feeders, transformers, lines)
 * and energy meters with topology context.
 * 
 * Also provides monitoring API functions for real-time telemetry, baselines, power quality,
 * multi-fluid monitoring, and sub-metering.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.5, 2.7, 4.4, 5.1, 6.4, 7.2, 27.1
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  TxSubstation,
  TxFeeder,
  TxTransformer,
  TxLine,
  TxEnergyMeterRegistry,
  MultiFluidSummary,
  EnergyMeter,
  MeterRoleType,
  MeterStatusType,
  EnergyType,
  EnergyTelemetry,
  EnergyBaseline,
  PowerQualityEvent,
  PowerQuality,
  TxPowerQualityLimit,
  Submeter,
  SubmeterWithNames,
  TxComplianceRequirement,
  TxComplianceEvidence,
  TxComplianceSummary
} from "@/types/transmission";

/**
 * Filter options for listing substations
 */
export interface ListSubstationsFilters {
  org_id?: string;
  region?: string;
  active?: boolean;
  code?: string;
}

/**
 * Filter options for listing feeders
 */
export interface ListFeedersFilters {
  substation_id?: string;
  org_id?: string;
  direction?: 'incomer' | 'outgoer';
  voltage_level_kv?: number;
  active?: boolean;
}

/**
 * Filter options for listing transformers
 */
export interface ListTransformersFilters {
  substation_id?: string;
  org_id?: string;
  primary_voltage_kv?: number;
  secondary_voltage_kv?: number;
  active?: boolean;
}

/**
 * Filter options for listing transmission lines
 */
export interface ListLinesFilters {
  org_id?: string;
  from_substation_id?: string;
  to_substation_id?: string;
  voltage_level_kv?: number;
  active?: boolean;
}

/**
 * Filter options for listing energy meters with topology context
 */
export interface ListEnergyMetersTxFilters {
  org_id?: string;
  substation_id?: string;
  feeder_id?: string;
  bay_id?: string;
  transformer_id?: string;
  meter_role?: MeterRoleType;
  status?: MeterStatusType;
  energy_type?: EnergyType;
  stale_telemetry?: boolean;  // Filter for meters with stale data (> 1 hour old)
  active?: boolean;
}

/**
 * Filter options for real-time telemetry queries
 * Requirement: 2.5
 */
export interface RealtimeTelemetryFilters {
  org_id?: string;
  substation_id?: string;
  feeder_id?: string;
  meter_role?: MeterRoleType;
  status?: MeterStatusType;
  energy_type?: EnergyType;
  stale_telemetry?: boolean;
  limit?: number;  // Limit number of results
}

/**
 * Filter options for baseline queries
 * Requirement: 4.4
 */
export interface BaselineFilters {
  meter_id?: string;
  baseline_type?: string;
  active?: boolean;
}

/**
 * Baseline with aggregated telemetry trends
 * Requirement: 4.4
 */
export interface BaselineWithTrends {
  baseline: EnergyBaseline;
  trends: {
    timestamp: string;
    actual_kwh: number | null;
    baseline_kwh: number | null;
    deviation_pct: number | null;
  }[];
  summary: {
    avg_deviation_pct: number | null;
    max_deviation_pct: number | null;
    anomaly_count: number;
  };
}


/**
 * Filter options for power quality events
 * Requirement: 6.4
 */
export interface PowerQualityEventFilters {
  org_id?: string;
  meter_id?: string;
  substation_id?: string;
  feeder_id?: string;
  event_type?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  resolved?: boolean;
  start_date?: string;
  end_date?: string;
}

/**
 * Filter options for submeters
 * Requirement: 7.2
 */
export interface SubmeterFilters {
  parent_meter_id?: string;
  feeder_id?: string;
  asset_id?: string;
  active?: boolean;
}

/**
 * TransmissionProvider class
 * Handles all transmission topology and meter registry queries
 */
export class TransmissionProvider {
  private cachedTransmissionTenantId: string | null = null;

  /**
   * Ensure Supabase is configured before making queries
   */
  private ensureConnected(): void {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error(
        "Supabase client not initialized. " +
        "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
  }

  /**
   * Get the default Power Transmission tenant ID with caching.
   * Queries for tenant with scenario_tag = 'power_transmission_demo_v1'
   * Requirements: 8.2
   */
  async getDefaultTransmissionTenantId(): Promise<string> {
    if (this.cachedTransmissionTenantId) {
      return this.cachedTransmissionTenantId;
    }

    this.ensureConnected();

    const { data, error } = await supabase!
      .from('tenants')
      .select('id')
      .eq('scenario_tag', 'power_transmission_demo_v1')
      .single();

    if (error) {
      // In local dev, we might use the hardcoded ID if the query fails but we know it should be there
      if (import.meta.env.DEV) {
        return '69083830-a193-4f8b-aab2-0d17349d286c';
      }
      throw new Error(`getDefaultTransmissionTenantId failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Power Transmission demo tenant not found. Ensure seed data is loaded.');
    }

    this.cachedTransmissionTenantId = data.id;
    return this.cachedTransmissionTenantId;
  }

  /**
   * Resolve a potential mock tenant ID to a real Supabase UUID
   */
  async resolveTenantId(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) return undefined;

    // If it's a mock ID, resolve it to the real UUID using the scenario tag
    if (tenantId === 't-dewa' || tenantId === 'dewa-transmission' || tenantId === '69083830-a193-4f8b-aab2-0d17349d286c') {
      return this.getDefaultTransmissionTenantId();
    }
    return tenantId;
  }


  /**
   * Handle RLS denial errors with user-friendly messages
   * Requirement: 27.1
   */
  private handleError(error: any, operation: string): never {
    // Check for "table not found" or "failed to fetch" (connection refused)
    const isNetworkError = error.message?.includes('Failed to fetch') || error.message?.includes('net::ERR_CONNECTION_REFUSED');
    const isTableMissing = error.code === 'PGRST204' ||
      error.message?.includes('Could not find the table') ||
      error.message?.includes('does not exist');

    if (isTableMissing || isNetworkError) {
      console.warn(`Database issue for ${operation}: ${error.message}. Returning mock fallback.`);
      // We throw a specific error that the caller can catch if they want mock data
      const mockError = new Error(`Mock mode triggered for ${operation}`);
      (mockError as any).isTableMissing = true;
      throw mockError;
    }

    // Check for RLS denial (insufficient permissions)
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      throw new Error('Insufficient access to this resource');
    }

    // Check for constraint violations
    if (error.code === '23505') {
      throw new Error(`Duplicate entry: ${error.message}`);
    }

    if (error.code === '23503') {
      throw new Error(`Referenced entity not found: ${error.message}`);
    }

    if (error.code === '23514') {
      throw new Error(`Validation failed: ${error.message}`);
    }

    // Generic error
    throw new Error(`${operation} failed: ${error.message}`);
  }

  // ============================================================================
  // MOCK DATA FALLBACKS
  // ============================================================================

  private getMockSubstations(orgId?: string): TxSubstation[] {
    return [
      {
        id: 'mock-sub-1',
        org_id: orgId || 'default-org',
        code: 'DS-01',
        name: 'Dubai Main Substation',
        region: 'Dubai',
        voltage_levels_kv: [400, 132],
        geo: null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-sub-2',
        org_id: orgId || 'default-org',
        code: 'JA-02',
        name: 'Jebel Ali Grid Station',
        region: 'Jebel Ali',
        voltage_levels_kv: [220, 132],
        geo: null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockFeeders(substationId?: string): TxFeeder[] {
    return [
      {
        id: 'mock-feeder-1',
        substation_id: substationId || 'mock-sub-1',
        feeder_code: 'F01',
        name: 'Industrial Feeder A',
        voltage_level_kv: 132,
        direction: 'outgoer',
        utility_ref: 'REF-001',
        capacity_mva: 50,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'mock-feeder-2',
        substation_id: substationId || 'mock-sub-1',
        feeder_code: 'F02',
        name: 'Residential Feeder B',
        voltage_level_kv: 132,
        direction: 'outgoer',
        utility_ref: 'REF-002',
        capacity_mva: 30,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockMeters(orgId?: string): TxEnergyMeterRegistry[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'mock-meter-1',
        org_id: orgId || '69083830-a193-4f8b-aab2-0d17349d286c',
        site_id: 'mock-site-1',
        name: 'Main Incomer 1',
        meter_code: 'M-INC-01',
        status: 'Normal',
        energy_types: ['electricity'],
        meter_role: 'grid_incomer',
        meter_type: 'Digital Multifunction',
        scope: 'Main Incomer',
        location: 'Incomer Bay 1',
        active: true,
        substation_id: 'mock-sub-1',
        substation_name: 'Dubai Main Substation',
        substation_code: 'DS-01',
        substation_region: 'Dubai',
        feeder_id: null,
        feeder_name: null,
        feeder_code: null,
        feeder_direction: null,
        feeder_voltage_kv: null,
        bay_id: 'mock-bay-1',
        bay_name: 'Bay 1',
        bay_code: 'B01',
        bay_type: 'incomer',
        transformer_id: null,
        transformer_name: null,
        transformer_code: null,
        transformer_capacity_mva: null,
        last_telemetry_at: now,
        current_kw: 1250.5,
        current_kwh: 45020.3,
        current_voltage_v: 400120,
        current_power_factor: 0.98,
        current_frequency_hz: 50.01,
        current_thd_pct: 1.2,
        is_stale: false,
        created_at: now,
        updated_at: now
      },
      {
        id: 'mock-meter-2',
        org_id: orgId || '69083830-a193-4f8b-aab2-0d17349d286c',
        site_id: 'mock-site-1',
        name: 'Feeder Meter F01',
        meter_code: 'M-FDR-01',
        status: 'Normal',
        energy_types: ['electricity'],
        meter_role: 'feeder_outgoing',
        meter_type: 'Digital Multifunction',
        scope: 'Feeder Monitoring',
        location: 'Outgoing Bay 4',
        active: true,
        substation_id: 'mock-sub-1',
        substation_name: 'Dubai Main Substation',
        substation_code: 'DS-01',
        substation_region: 'Dubai',
        feeder_id: 'mock-feeder-1',
        feeder_name: 'Industrial Feeder A',
        feeder_code: 'F01',
        feeder_direction: 'outgoer',
        feeder_voltage_kv: 132,
        bay_id: 'mock-bay-4',
        bay_name: 'Bay 4',
        bay_code: 'B04',
        bay_type: 'outgoing',
        transformer_id: null,
        transformer_name: null,
        transformer_code: null,
        transformer_capacity_mva: null,
        last_telemetry_at: now,
        current_kw: 850.2,
        current_kwh: 28400.1,
        current_voltage_v: 132050,
        current_power_factor: 0.95,
        current_frequency_hz: 49.98,
        current_thd_pct: 2.1,
        is_stale: false,
        created_at: now,
        updated_at: now
      }
    ];
  }

  // ============================================================================
  // SUBSTATIONS
  // ============================================================================

  /**
   * List substations with optional filters
   * Requirement: 1.1, 27.1
   */
  async listTxSubstations(filters?: ListSubstationsFilters): Promise<TxSubstation[]> {
    try {
      this.ensureConnected();
      let query = supabase!.from('tx_substations').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.region) {
        query = query.eq('region', filters.region);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }
      if (filters?.code) {
        query = query.ilike('code', `%${filters.code}%`);
      }

      // Order by name for consistent results
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxSubstations');
      }

      return data || [];
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a single substation by ID
   * Requirement: 1.1, 27.1
   */
  async getTxSubstation(id: string): Promise<TxSubstation | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_substations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxSubstation');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxSubstation');
    }
  }

  /**
   * Upsert (insert or update) a substation
   * Uses natural key (org_id, code) for conflict resolution
   * Requirement: 1.1, 27.1
   */
  async upsertTxSubstation(substation: Partial<TxSubstation> & { org_id: string; code: string; name: string }): Promise<TxSubstation> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_substations')
        .upsert(
          {
            ...substation,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'org_id,code',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxSubstation');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertTxSubstation');
    }
  }

  // ============================================================================
  // FEEDERS
  // ============================================================================

  /**
   * List feeders with optional filters
   * Requirement: 1.2, 27.1
   */
  async listTxFeeders(filters?: ListFeedersFilters): Promise<TxFeeder[]> {
    try {
      this.ensureConnected();

      let selectClause = '*';
      let hasOrgIdJoin = false;

      // If org_id filtering is requested, we need to join with tx_substations
      if (filters?.org_id) {
        hasOrgIdJoin = true;
        selectClause = '*, tx_substations!inner(org_id)';
      }

      let query = supabase!.from('tx_feeders').select(selectClause);

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('tx_substations.org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }
      if (filters?.direction) {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.voltage_level_kv) {
        query = query.eq('voltage_level_kv', filters.voltage_level_kv);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by name for consistent results
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxFeeders');
      }

      // Clean up the joined data structure if we added it
      const resultData = data || [];
      if (hasOrgIdJoin) {
        return resultData.map(item => {
          const { tx_substations, ...rest } = item as any;
          return rest;
        }) as unknown as TxFeeder[];
      }

      return resultData as unknown as TxFeeder[];
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a single feeder by ID
   * Requirement: 1.2, 27.1
   */
  async getTxFeeder(id: string): Promise<TxFeeder | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_feeders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxFeeder');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxFeeder');
    }
  }

  /**
   * Upsert (insert or update) a feeder
   * Uses natural key (substation_id, feeder_code) for conflict resolution
   * Requirement: 1.2, 27.1
   */
  async upsertTxFeeder(feeder: Partial<TxFeeder> & { substation_id: string; feeder_code: string; name: string }): Promise<TxFeeder> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_feeders')
        .upsert(
          {
            ...feeder,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'substation_id,feeder_code',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxFeeder');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertTxFeeder');
    }
  }

  // ============================================================================
  // TRANSFORMERS
  // ============================================================================

  /**
   * List transformers with optional filters
   * Requirement: 1.3, 27.1
   */
  async listTxTransformers(filters?: ListTransformersFilters): Promise<TxTransformer[]> {
    this.ensureConnected();

    try {
      let selectClause = '*';
      let hasOrgIdJoin = false;

      // If org_id filtering is requested, we need to join with tx_substations
      if (filters?.org_id) {
        hasOrgIdJoin = true;
        selectClause = '*, tx_substations!inner(org_id)';
      }

      let query = supabase!.from('tx_transformers').select(selectClause);

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('tx_substations.org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }
      if (filters?.primary_voltage_kv) {
        query = query.eq('primary_voltage_kv', filters.primary_voltage_kv);
      }
      if (filters?.secondary_voltage_kv) {
        query = query.eq('secondary_voltage_kv', filters.secondary_voltage_kv);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by name for consistent results
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxTransformers');
      }

      // Clean up the joined data structure if we added it
      const resultData = data || [];
      if (hasOrgIdJoin) {
        return resultData.map(item => {
          const { tx_substations, ...rest } = item as any;
          return rest;
        }) as unknown as TxTransformer[];
      }

      return resultData as unknown as TxTransformer[];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'listTxTransformers');
    }
  }

  /**
   * Get a single transformer by ID
   * Requirement: 1.3, 27.1
   */
  async getTxTransformer(id: string): Promise<TxTransformer | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_transformers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxTransformer');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxTransformer');
    }
  }

  /**
   * Upsert (insert or update) a transformer
   * Uses natural key (substation_id, transformer_code) for conflict resolution
   * Requirement: 1.3, 27.1
   */
  async upsertTxTransformer(transformer: Partial<TxTransformer> & { substation_id: string; transformer_code: string; name: string }): Promise<TxTransformer> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_transformers')
        .upsert(
          {
            ...transformer,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'substation_id,transformer_code',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxTransformer');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertTxTransformer');
    }
  }

  // ============================================================================
  // TRANSMISSION LINES
  // ============================================================================

  /**
   * List transmission lines with optional filters
   * Requirement: 1.4, 27.1
   */
  async listTxLines(filters?: ListLinesFilters): Promise<TxLine[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('tx_lines').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.from_substation_id) {
        query = query.eq('from_substation_id', filters.from_substation_id);
      }
      if (filters?.to_substation_id) {
        query = query.eq('to_substation_id', filters.to_substation_id);
      }
      if (filters?.voltage_level_kv) {
        query = query.eq('voltage_level_kv', filters.voltage_level_kv);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by name for consistent results
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxLines');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'listTxLines');
    }
  }

  /**
   * Get a single transmission line by ID
   * Requirement: 1.4, 27.1
   */
  async getTxLine(id: string): Promise<TxLine | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_lines')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxLine');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxLine');
    }
  }

  /**
   * Upsert (insert or update) a transmission line
   * Uses natural key (org_id, line_code) for conflict resolution
   * Requirement: 1.4, 27.1
   */
  async upsertTxLine(line: Partial<TxLine> & { org_id: string; line_code: string; name: string; from_substation_id: string; to_substation_id: string }): Promise<TxLine> {
    this.ensureConnected();

    try {
      // Validate that from and to substations are different (client-side check)
      if (line.from_substation_id === line.to_substation_id) {
        throw new Error('Validation failed: from_substation_id and to_substation_id must be different');
      }

      const { data, error } = await supabase!
        .from('tx_lines')
        .upsert(
          {
            ...line,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'org_id,line_code',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxLine');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Insufficient access') || error.message.startsWith('Validation failed'))) {
        throw error;
      }
      this.handleError(error, 'upsertTxLine');
    }
  }

  // ============================================================================
  // ENERGY METERS WITH TOPOLOGY CONTEXT
  // ============================================================================

  /**
   * List energy meters with topology context and filters
   * Uses the v_tx_energy_meter_registry view for comprehensive meter information
   * Requirement: 2.7, 27.1
   */
  async listEnergyMetersTxScoped(filters?: ListEnergyMetersTxFilters): Promise<TxEnergyMeterRegistry[]> {
    this.ensureConnected();
    try {
      // Query the meter registry view for comprehensive data
      let query = supabase!.from('v_tx_energy_meter_registry').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }
      if (filters?.feeder_id) {
        query = query.eq('feeder_id', filters.feeder_id);
      }
      if (filters?.bay_id) {
        query = query.eq('bay_id', filters.bay_id);
      }
      if (filters?.transformer_id) {
        query = query.eq('transformer_id', filters.transformer_id);
      }
      if (filters?.meter_role) {
        query = query.eq('meter_role', filters.meter_role);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.energy_type) {
        // Filter by energy type using array containment
        query = query.contains('energy_types', [filters.energy_type]);
      }
      if (filters?.stale_telemetry !== undefined) {
        query = query.eq('is_stale', filters.stale_telemetry);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by name for consistent results
      query = query.order('name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listEnergyMetersTxScoped');
      }

      return data || [];
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get a single energy meter by ID with topology context
   * Requirement: 2.7, 27.1
   */
  async getEnergyMeterTxScoped(id: string): Promise<TxEnergyMeterRegistry | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('v_tx_energy_meter_registry')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getEnergyMeterTxScoped');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getEnergyMeterTxScoped');
    }
  }

  /**
   * Upsert (insert or update) an energy meter
   * Uses natural key (org_id, meter_code) for conflict resolution when meter_code is provided
   * Requirement: 2.7, 27.1
   */
  async upsertEnergyMeter(meter: Partial<EnergyMeter> & { org_id: string; name: string }): Promise<EnergyMeter> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_meters')
        .upsert(
          {
            ...meter,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: meter.meter_code ? 'org_id,meter_code' : undefined,
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertEnergyMeter');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertEnergyMeter');
    }
  }

  // ============================================================================
  // MONITORING: REAL-TIME TELEMETRY
  // ============================================================================

  /**
   * Get real-time telemetry with latest telemetry batch
   * Returns meters with their most recent telemetry data
   * Requirement: 2.5
   */
  async getRealtimeTelemetry(filters?: RealtimeTelemetryFilters): Promise<TxEnergyMeterRegistry[]> {
    this.ensureConnected();
    try {
      // Use the meter registry view which includes latest telemetry
      let query = supabase!.from('v_tx_energy_meter_registry').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }
      if (filters?.feeder_id) {
        query = query.eq('feeder_id', filters.feeder_id);
      }
      if (filters?.meter_role) {
        query = query.eq('meter_role', filters.meter_role);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.energy_type) {
        query = query.contains('energy_types', [filters.energy_type]);
      }
      if (filters?.stale_telemetry !== undefined) {
        query = query.eq('is_stale', filters.stale_telemetry);
      }

      // Order by status (Critical/High first) then by name
      query = query.order('status', { ascending: false }).order('name', { ascending: true });

      // Apply limit if specified
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getRealtimeTelemetry');
      }

      return data || [];
    } catch (error: any) {
      throw error;
    }
  }

  // ============================================================================
  // MONITORING: BASELINES AND TRENDS
  // ============================================================================

  /**
   * Get baseline with aggregated telemetry trends
   * Returns baseline data with actual vs baseline comparison over time
   * Requirement: 4.4
   */
  async getBaselineWithTrends(
    meter_id: string,
    period: { start: string; end: string },
    grain: 'hour' | 'day' = 'day'
  ): Promise<BaselineWithTrends | null> {
    this.ensureConnected();

    try {
      // First, get the active baseline for this meter that overlaps with the period
      const { data: baseline, error: baselineError } = await supabase!
        .from('energy_baselines')
        .select('*')
        .eq('meter_id', meter_id)
        .eq('active', true)
        .lte('baseline_period_start', period.end)
        .gte('baseline_period_end', period.start)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (baselineError) {
        if (baselineError.code === 'PGRST116') {
          // No baseline found
          return null;
        }
        this.handleError(baselineError, 'getBaselineWithTrends');
      }

      if (!baseline) {
        return null;
      }

      // Get aggregated telemetry data for the period
      // Use time_bucket for aggregation by hour or day
      const interval = grain === 'hour' ? '1 hour' : '1 day';

      const { data: telemetryData, error: telemetryError } = await supabase!
        .rpc('get_aggregated_telemetry', {
          p_meter_id: meter_id,
          p_start_time: period.start,
          p_end_time: period.end,
          p_interval: interval
        });

      if (telemetryError) {
        // If the RPC doesn't exist, fall back to direct query
        const { data: fallbackData, error: fallbackError } = await supabase!
          .from('energy_telemetry')
          .select('timestamp, kwh, kw')
          .eq('meter_id', meter_id)
          .gte('timestamp', period.start)
          .lte('timestamp', period.end)
          .order('timestamp', { ascending: true });

        if (fallbackError) {
          this.handleError(fallbackError, 'getBaselineWithTrends');
        }

        // Calculate trends from raw data
        const trends = (fallbackData || []).map((point) => {
          const baseline_kwh = baseline.baseline_value;
          const actual_kwh = point.kwh;
          const deviation_pct = actual_kwh && baseline_kwh
            ? ((actual_kwh - baseline_kwh) / baseline_kwh) * 100
            : null;

          return {
            timestamp: point.timestamp,
            actual_kwh,
            baseline_kwh,
            deviation_pct
          };
        });

        // Calculate summary statistics
        const deviations = trends.map(t => t.deviation_pct).filter(d => d !== null) as number[];
        const anomaly_count = deviations.filter(d => Math.abs(d) > 10).length; // 10% threshold

        return {
          baseline,
          trends,
          summary: {
            avg_deviation_pct: deviations.length > 0
              ? deviations.reduce((a, b) => a + b, 0) / deviations.length
              : null,
            max_deviation_pct: deviations.length > 0
              ? Math.max(...deviations.map(Math.abs))
              : null,
            anomaly_count
          }
        };
      }

      // Process RPC results
      const trends = (telemetryData || []).map((point: any) => {
        const baseline_kwh = baseline.baseline_value;
        const actual_kwh = point.avg_kwh;
        const deviation_pct = actual_kwh && baseline_kwh
          ? ((actual_kwh - baseline_kwh) / baseline_kwh) * 100
          : null;

        return {
          timestamp: point.bucket,
          actual_kwh,
          baseline_kwh,
          deviation_pct
        };
      });

      // Calculate summary statistics
      const deviations = trends.map(t => t.deviation_pct).filter(d => d !== null) as number[];
      const anomaly_count = deviations.filter(d => Math.abs(d) > 10).length; // 10% threshold

      return {
        baseline,
        trends,
        summary: {
          avg_deviation_pct: deviations.length > 0
            ? deviations.reduce((a, b) => a + b, 0) / deviations.length
            : null,
          max_deviation_pct: deviations.length > 0
            ? Math.max(...deviations.map(Math.abs))
            : null,
          anomaly_count
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getBaselineWithTrends');
    }
  }

  /**
   * Upsert (insert or update) a baseline
   * Requirement: 4.4
   */
  async upsertBaseline(baseline: Partial<EnergyBaseline> & { meter_id: string; baseline_name: string }): Promise<EnergyBaseline> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_baselines')
        .upsert(
          {
            ...baseline,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertBaseline');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertBaseline');
    }
  }

  // ============================================================================
  // MONITORING: MULTI-FLUID ENERGY
  // ============================================================================

  /**
   * Get multi-fluid energy summary grouped by energy type
   * Returns aggregated consumption data for each energy type
   * Requirement: 5.1
   */
  async getMultiFluidSummary(filters?: {
    org_id?: string;
    substation_id?: string;
    feeder_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<MultiFluidSummary[]> {
    this.ensureConnected();

    try {
      // Get all meters with their latest telemetry
      let meterQuery = supabase!.from('v_tx_energy_meter_registry').select('*');

      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          meterQuery = meterQuery.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        meterQuery = meterQuery.eq('substation_id', filters.substation_id);
      }
      if (filters?.feeder_id) {
        meterQuery = meterQuery.eq('feeder_id', filters.feeder_id);
      }

      const { data: meters, error: meterError } = await meterQuery;

      if (meterError) {
        this.handleError(meterError, 'getMultiFluidSummary');
      }

      if (!meters || meters.length === 0) {
        return [];
      }

      // Group meters by energy type
      const energyTypeMap = new Map<EnergyType, TxEnergyMeterRegistry[]>();

      meters.forEach(meter => {
        meter.energy_types.forEach((energyType: EnergyType) => {
          if (!energyTypeMap.has(energyType)) {
            energyTypeMap.set(energyType, []);
          }
          energyTypeMap.get(energyType)!.push(meter);
        });
      });

      // Build summary for each energy type
      const summaries: MultiFluidSummary[] = [];

      for (const [energyType, typeMeters] of energyTypeMap.entries()) {
        // If date range is specified, get aggregated telemetry
        let totalKwh: number | null = null;
        let avgKw: number | null = null;
        let maxKw: number | null = null;
        let totalCost: number = 0;
        let totalEmissions: number = 0;

        // Default factors (could be refined)
        const costFactor = energyType === 'electricity' ? 0.12 : 0.08;
        const emissionFactor = energyType === 'electricity' ? 0.45 : 0.25;

        if (filters?.start_date && filters?.end_date) {
          const meterIds = typeMeters.map(m => m.id);

          const { data: telemetryAgg, error: telemetryError } = await supabase!
            .from('energy_telemetry')
            .select('meter_id, kwh, kw')
            .in('meter_id', meterIds)
            .gte('timestamp', filters.start_date)
            .lte('timestamp', filters.end_date);

          if (!telemetryError && telemetryAgg) {
            const kwhs = telemetryAgg.map(t => t.kwh).filter(k => k !== null) as number[];
            const kws = telemetryAgg.map(t => t.kw).filter(k => k !== null) as number[];

            totalKwh = kwhs.length > 0 ? kwhs.reduce((a, b) => a + b, 0) : null;
            avgKw = kws.length > 0 ? kws.reduce((a, b) => a + b, 0) / kws.length : null;
            maxKw = kws.length > 0 ? Math.max(...kws) : null;
          }
        } else {
          // Use current values from meter registry
          const currentKws = typeMeters.map(m => m.current_kw).filter(k => k !== null) as number[];
          avgKw = currentKws.length > 0 ? currentKws.reduce((a, b) => a + b, 0) / currentKws.length : null;
          maxKw = currentKws.length > 0 ? Math.max(...currentKws) : null;
        }

        const metersSummary = typeMeters.map(m => {
          const mKwh = m.current_kwh || 0;
          const cost = mKwh * costFactor;
          const emissions = mKwh * emissionFactor;

          totalCost += cost;
          totalEmissions += emissions;

          return {
            meter_id: m.id,
            meter_name: m.name,
            substation_id: m.substation_id,
            substation_name: m.substation_name,
            feeder_id: m.feeder_id,
            feeder_name: m.feeder_name,
            current_kw: m.current_kw,
            total_kwh: m.current_kwh,
            cost: cost,
            co2_emissions: emissions
          };
        });

        summaries.push({
          energy_type: energyType,
          meter_count: typeMeters.length,
          total_kwh: totalKwh || typeMeters.reduce((sum, m) => sum + (m.current_kwh || 0), 0),
          avg_kw: avgKw,
          max_kw: maxKw,
          total_cost: totalCost,
          co2_emissions: totalEmissions,
          meters: metersSummary
        });
      }

      return summaries;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getMultiFluidSummary');
    }
  }

  /**
   * Get energy trend data for charts
   * Aggregates telemetry data into time-series buckets
   */
  async getEnergyTrendData(filters: {
    org_id: string;
    substation_id?: string;
    feeder_id?: string;
    energy_type?: EnergyType;
    start_date: string;
    end_date: string;
  }): Promise<{ timestamp: string; consumption: number; cost: number; demand: number }[]> {
    this.ensureConnected();

    try {
      // First resolve the tenant ID
      const resolvedOrgId = await this.resolveTenantId(filters.org_id);

      // Determine which meters to include
      let meterQuery = supabase!.from('energy_meters').select('id');
      if (resolvedOrgId) meterQuery = meterQuery.eq('org_id', resolvedOrgId);
      if (filters.substation_id) meterQuery = meterQuery.eq('substation_id', filters.substation_id);
      if (filters.feeder_id) meterQuery = meterQuery.eq('feeder_id', filters.feeder_id);
      if (filters.energy_type) meterQuery = meterQuery.contains('energy_types', [filters.energy_type]);

      const { data: meters, error: meterError } = await meterQuery;
      if (meterError || !meters || meters.length === 0) return [];

      const meterIds = meters.map(m => m.id);

      // Fetch telemetry data
      const { data, error } = await supabase!
        .from('energy_telemetry')
        .select('timestamp, kwh, kw')
        .in('meter_id', meterIds)
        .gte('timestamp', filters.start_date)
        .lte('timestamp', filters.end_date)
        .order('timestamp', { ascending: true });

      if (error) this.handleError(error, 'getEnergyTrendData');

      // Aggregate by timestamp (hourly if range is large, or as-is)
      // For simplicity, we'll just group by the raw timestamps if they are pre-aggregated, 
      // or we can bucket them in JS if needed. 
      // Real implementation might use a DB function.

      const trendMap = new Map<string, { consumption: number; cost: number; demand: number }>();
      const costFactor = filters.energy_type === 'electricity' ? 0.12 : 0.08;

      (data || []).forEach(point => {
        const ts = new Date(point.timestamp).toISOString();
        if (!trendMap.has(ts)) {
          trendMap.set(ts, { consumption: 0, cost: 0, demand: 0 });
        }
        const entry = trendMap.get(ts)!;
        entry.consumption += point.kwh || 0;
        entry.cost += (point.kwh || 0) * costFactor;
        entry.demand += point.kw || 0;
      });

      return Array.from(trendMap.entries()).map(([timestamp, values]) => ({
        timestamp,
        ...values
      }));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) throw error;
      this.handleError(error, 'getEnergyTrendData');
    }
  }

  // ============================================================================
  // MONITORING: POWER QUALITY
  // ============================================================================

  /**
   * Get power quality events with filters
   * Requirement: 6.4
   */
  async getPowerQualityEvents(filters?: PowerQualityEventFilters): Promise<PowerQualityEvent[]> {
    this.ensureConnected();

    try {
      let selectClause = '*';
      let hasOrgIdJoin = false;

      // If org_id filtering is requested, we need to join with energy_meters
      if (filters?.org_id) {
        hasOrgIdJoin = true;
        selectClause = '*, energy_meters!inner(org_id)';
      }

      let query = supabase!.from('power_quality_events').select(selectClause);

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('energy_meters.org_id', resolvedOrgId);
        }
      }
      if (filters?.meter_id) {
        query = query.eq('meter_id', filters.meter_id);
      }
      if (filters?.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
      }
      if (filters?.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      // If filtering by substation or feeder, need to join with meters
      if (filters?.substation_id || filters?.feeder_id) {
        // Get meter IDs for the topology filter
        let meterQuery = supabase!.from('energy_meters').select('id');

        if (filters.substation_id) {
          meterQuery = meterQuery.eq('substation_id', filters.substation_id);
        }
        if (filters.feeder_id) {
          meterQuery = meterQuery.eq('feeder_id', filters.feeder_id);
        }

        const { data: meterIds, error: meterError } = await meterQuery;

        if (meterError) {
          this.handleError(meterError, 'getPowerQualityEvents');
        }

        if (meterIds && meterIds.length > 0) {
          query = query.in('meter_id', meterIds.map(m => m.id));
        } else {
          // No meters match the topology filter, return empty
          return [];
        }
      }

      // Order by timestamp descending (most recent first)
      query = query.order('timestamp', { ascending: false });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getPowerQualityEvents');
      }

      // Clean up the joined data structure if we added it
      const resultData = data || [];
      if (hasOrgIdJoin) {
        return resultData.map(item => {
          const { energy_meters, ...rest } = item as any;
          return rest;
        }) as unknown as PowerQualityEvent[];
      }

      return resultData as unknown as PowerQualityEvent[];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getPowerQualityEvents');
    }
  }

  /**
   * Resolve a power quality event
   * Requirement: 6.4
   */
  async resolvePQEvent(event_id: string, resolution_notes: string): Promise<PowerQualityEvent> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('power_quality_events')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes
        })
        .eq('id', event_id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'resolvePQEvent');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'resolvePQEvent');
    }
  }

  /**
   * Get power quality telemetry time series
   * Requirement: 6.1
   */
  async getPowerQualityTelemetry(filters: {
    meter_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<PowerQuality[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('power_quality').select('*');

      // Apply filters
      if (filters.meter_id) {
        query = query.eq('meter_id', filters.meter_id);
      }
      if (filters.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      // Order by timestamp descending (most recent first)
      query = query.order('timestamp', { ascending: false });

      // Apply limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getPowerQualityTelemetry');
      }

      return data || [];
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get power quality limits by voltage level
   * Requirement: 6.3
   */
  async getPowerQualityLimits(filters?: {
    org_id?: string;
    voltage_level_kv?: number;
    limit_type?: string;
    active?: boolean;
  }): Promise<TxPowerQualityLimit[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('tx_power_quality_limits').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.voltage_level_kv) {
        query = query.eq('voltage_level_kv', filters.voltage_level_kv);
      }
      if (filters?.limit_type) {
        query = query.eq('limit_type', filters.limit_type);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by voltage level and limit type
      query = query.order('voltage_level_kv', { ascending: true });
      query = query.order('limit_type', { ascending: true });
      query = query.order('severity', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getPowerQualityLimits');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getPowerQualityLimits');
    }
  }

  // ============================================================================
  // MONITORING: SUB-METERING
  // ============================================================================

  /**
   * Get submeters with filters
   * Supports filtering by parent meter, feeder, or asset
   * Requirement: 7.2
   */
  async getSubmeters(filters?: SubmeterFilters): Promise<SubmeterWithNames[]> {
    this.ensureConnected();

    try {
      // Build query to get submeters with resolved names
      let query = supabase!
        .from('submeters')
        .select(`
          *,
          parent_meter:energy_meters!parent_meter_id(id, name, location),
          submeter:energy_meters!submeter_id(id, name, location)
        `);

      // Apply filters
      if (filters?.parent_meter_id) {
        query = query.eq('parent_meter_id', filters.parent_meter_id);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // If filtering by feeder or asset, need to filter through the submeter's meter record
      if (filters?.feeder_id) {
        const { data: meterIds, error: meterError } = await supabase!
          .from('energy_meters')
          .select('id')
          .eq('feeder_id', filters.feeder_id);

        if (meterError) {
          this.handleError(meterError, 'getSubmeters');
        }

        if (meterIds && meterIds.length > 0) {
          query = query.in('submeter_id', meterIds.map(m => m.id));
        } else {
          return [];
        }
      }

      if (filters?.asset_id) {
        const { data: meterIds, error: meterError } = await supabase!
          .from('energy_meters')
          .select('id')
          .eq('asset_id', filters.asset_id);

        if (meterError) {
          this.handleError(meterError, 'getSubmeters');
        }

        if (meterIds && meterIds.length > 0) {
          query = query.in('submeter_id', meterIds.map(m => m.id));
        } else {
          return [];
        }
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getSubmeters');
      }

      // Transform the data to include resolved names
      const submetersWithNames: SubmeterWithNames[] = (data || []).map((item: any) => ({
        id: item.id,
        parent_meter_id: item.parent_meter_id,
        submeter_id: item.submeter_id,
        allocation_percentage: item.allocation_percentage,
        active: item.active,
        metadata: item.metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
        parent_meter_name: item.parent_meter?.name || 'Unknown',
        submeter_name: item.submeter?.name || 'Unknown',
        parent_meter_location: item.parent_meter?.location || null,
        submeter_location: item.submeter?.location || null
      }));

      return submetersWithNames;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getSubmeters');
    }
  }

  /**
   * Upsert (insert or update) a submeter relationship
   * Requirement: 7.2
   */
  async upsertSubmeter(submeter: Partial<Submeter> & { parent_meter_id: string; submeter_id: string }): Promise<Submeter> {
    this.ensureConnected();

    try {
      // Validate that parent and submeter are different
      if (submeter.parent_meter_id === submeter.submeter_id) {
        throw new Error('Validation failed: parent_meter_id and submeter_id must be different');
      }

      const { data, error } = await supabase!
        .from('submeters')
        .upsert(
          {
            ...submeter,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'parent_meter_id,submeter_id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertSubmeter');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Insufficient access') || error.message.startsWith('Validation failed'))) {
        throw error;
      }
      this.handleError(error, 'upsertSubmeter');
    }
  }

  // ============================================================================
  // COMPLIANCE: REQUIREMENTS AND EVIDENCE
  // ============================================================================

  /**
   * List compliance requirements with optional filters
   * Requirement: 21.1, 27.1
   */
  async listTxComplianceRequirements(filters?: {
    org_id?: string;
    requirement_type?: string;
    compliance_category?: string;
    compliance_status?: string;
    risk_level?: string;
    applies_to_scope?: string;
    active?: boolean;
  }): Promise<TxComplianceRequirement[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('tx_compliance_requirements').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.requirement_type) {
        query = query.eq('requirement_type', filters.requirement_type);
      }
      if (filters?.compliance_category) {
        query = query.eq('compliance_category', filters.compliance_category);
      }
      if (filters?.compliance_status) {
        query = query.eq('compliance_status', filters.compliance_status);
      }
      if (filters?.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters?.applies_to_scope) {
        query = query.eq('applies_to_scope', filters.applies_to_scope);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Order by risk level (Critical first) then by name
      query = query.order('risk_level', { ascending: false });
      query = query.order('requirement_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxComplianceRequirements');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'listTxComplianceRequirements');
    }
  }

  /**
   * Get a single compliance requirement by ID
   * Requirement: 21.1, 27.1
   */
  async getTxComplianceRequirement(id: string): Promise<TxComplianceRequirement | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_compliance_requirements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxComplianceRequirement');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxComplianceRequirement');
    }
  }

  /**
   * Upsert (insert or update) a compliance requirement
   * Uses natural key (org_id, requirement_code) for conflict resolution
   * Requirement: 21.1, 27.1
   */
  async upsertTxComplianceRequirement(
    requirement: Partial<TxComplianceRequirement> & {
      org_id: string;
      requirement_code: string;
      requirement_name: string;
      requirement_type: string;
      compliance_category: string;
    }
  ): Promise<TxComplianceRequirement> {
    this.ensureConnected();

    try {
      const resolvedOrgId = await this.resolveTenantId(requirement.org_id) || requirement.org_id;

      const { data, error } = await supabase!
        .from('tx_compliance_requirements')
        .upsert(
          {
            ...requirement,
            org_id: resolvedOrgId,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'org_id,requirement_code',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxComplianceRequirement');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertTxComplianceRequirement');
    }
  }

  /**
   * List compliance evidence with optional filters
   * Requirement: 21.2, 27.1
   */
  async listTxComplianceEvidence(filters?: {
    org_id?: string;
    requirement_id?: string;
    evidence_type?: string;
    status?: string;
    verified?: boolean;
    linked_substation_id?: string;
    linked_feeder_id?: string;
  }): Promise<TxComplianceEvidence[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('tx_compliance_evidence').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.requirement_id) {
        query = query.eq('requirement_id', filters.requirement_id);
      }
      if (filters?.evidence_type) {
        query = query.eq('evidence_type', filters.evidence_type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.verified !== undefined) {
        query = query.eq('verified', filters.verified);
      }
      if (filters?.linked_substation_id) {
        query = query.eq('linked_substation_id', filters.linked_substation_id);
      }
      if (filters?.linked_feeder_id) {
        query = query.eq('linked_feeder_id', filters.linked_feeder_id);
      }

      // Order by valid_from descending (most recent first)
      query = query.order('valid_from', { ascending: false });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listTxComplianceEvidence');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'listTxComplianceEvidence');
    }
  }

  /**
   * Get a single compliance evidence by ID
   * Requirement: 21.2, 27.1
   */
  async getTxComplianceEvidence(id: string): Promise<TxComplianceEvidence | null> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tx_compliance_evidence')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(error, 'getTxComplianceEvidence');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxComplianceEvidence');
    }
  }

  /**
   * Upsert (insert or update) compliance evidence
   * Requirement: 21.2, 27.1
   */
  async upsertTxComplianceEvidence(
    evidence: Partial<TxComplianceEvidence> & {
      org_id: string;
      requirement_id: string;
      evidence_type: string;
      evidence_name: string;
      valid_from: string;
    }
  ): Promise<TxComplianceEvidence> {
    this.ensureConnected();

    try {
      const resolvedOrgId = await this.resolveTenantId(evidence.org_id) || evidence.org_id;

      const { data, error } = await supabase!
        .from('tx_compliance_evidence')
        .upsert(
          {
            ...evidence,
            org_id: resolvedOrgId,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        this.handleError(error, 'upsertTxComplianceEvidence');
      }

      return data!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'upsertTxComplianceEvidence');
    }
  }

  /**
   * Get compliance summary for an organization
   * Aggregates compliance status across all requirements
   * Requirement: 21.1
   */
  async getTxComplianceSummary(org_id: string): Promise<TxComplianceSummary | null> {
    this.ensureConnected();

    try {
      const resolvedOrgId = await this.resolveTenantId(org_id) || org_id;

      // Get all requirements for the organization
      const { data: requirements, error: reqError } = await supabase!
        .from('tx_compliance_requirements')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('active', true);

      if (reqError) {
        this.handleError(reqError, 'getTxComplianceSummary');
      }

      if (!requirements || requirements.length === 0) {
        return null;
      }

      // Calculate summary statistics
      const total_requirements = requirements.length;
      const compliant_count = requirements.filter(r => r.compliance_status === 'compliant').length;
      const non_compliant_count = requirements.filter(r => r.compliance_status === 'non_compliant').length;
      const pending_count = requirements.filter(r => r.compliance_status === 'pending').length;
      const not_applicable_count = requirements.filter(r => r.compliance_status === 'not_applicable').length;

      const critical_risk_count = requirements.filter(r => r.risk_level === 'Critical').length;
      const high_risk_count = requirements.filter(r => r.risk_level === 'High').length;
      const medium_risk_count = requirements.filter(r => r.risk_level === 'Medium').length;
      const low_risk_count = requirements.filter(r => r.risk_level === 'Low').length;

      // Calculate overdue reviews
      const now = new Date();
      const overdue_reviews_count = requirements.filter(r =>
        r.next_review_date && new Date(r.next_review_date) < now
      ).length;

      // Calculate expiring soon (within 30 days)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring_soon_count = requirements.filter(r =>
        r.expiry_date && new Date(r.expiry_date) <= thirtyDaysFromNow && new Date(r.expiry_date) >= now
      ).length;

      // Calculate overall compliance percentage
      const overall_compliance_percentage = total_requirements > 0
        ? (compliant_count / total_requirements) * 100
        : 0;

      // Group by category
      const categoryMap = new Map<string, { total: number; compliant: number }>();
      requirements.forEach(r => {
        if (!categoryMap.has(r.compliance_category)) {
          categoryMap.set(r.compliance_category, { total: 0, compliant: 0 });
        }
        const cat = categoryMap.get(r.compliance_category)!;
        cat.total++;
        if (r.compliance_status === 'compliant') {
          cat.compliant++;
        }
      });

      const by_category = Array.from(categoryMap.entries()).map(([category, stats]) => ({
        category,
        total: stats.total,
        compliant: stats.compliant,
        compliance_percentage: stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0
      }));

      // Group by type
      const typeMap = new Map<string, { total: number; compliant: number }>();
      requirements.forEach(r => {
        if (!typeMap.has(r.requirement_type)) {
          typeMap.set(r.requirement_type, { total: 0, compliant: 0 });
        }
        const type = typeMap.get(r.requirement_type)!;
        type.total++;
        if (r.compliance_status === 'compliant') {
          type.compliant++;
        }
      });

      const by_type = Array.from(typeMap.entries()).map(([type, stats]) => ({
        type,
        total: stats.total,
        compliant: stats.compliant,
        compliance_percentage: stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0
      }));

      // For missing evidence count, we would need to query evidence table
      // For now, set to 0 as a placeholder
      const missing_evidence_count = 0;

      return {
        org_id,
        total_requirements,
        compliant_count,
        non_compliant_count,
        pending_count,
        not_applicable_count,
        critical_risk_count,
        high_risk_count,
        medium_risk_count,
        low_risk_count,
        overdue_reviews_count,
        expiring_soon_count,
        missing_evidence_count,
        overall_compliance_percentage,
        by_category,
        by_type
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTxComplianceSummary');
    }
  }
}

// Singleton instance
let transmissionProviderInstance: TransmissionProvider | null = null;

/**
 * Get the singleton TransmissionProvider instance
 */
export function getTransmissionProvider(): TransmissionProvider {
  if (!transmissionProviderInstance) {
    transmissionProviderInstance = new TransmissionProvider();
  }
  return transmissionProviderInstance;
}
