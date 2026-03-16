/**
 * AnalyticsProvider
 * 
 * Implements API query functions for EMS Analytics including KPI snapshots,
 * benchmarks, recommendations, and demand windows.
 * 
 * Requirements: 9.1, 9.2, 9.4, 10.2, 11.1, 11.7
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TxDemandWindow, TxDemandWindowWithCalculations } from "@/types/transmission";
import { mockTransmissionEfficiencyScopes } from "@/data/mockData";

/**
 * KPI Snapshot interface
 */
export interface EnergyKPISnapshot {
  id: string;
  org_id: string;
  kpi_code: string;
  scope_type: 'org' | 'substation' | 'feeder' | 'meter';
  scope_id: string;
  period_start: string;
  period_end: string;
  period_grain: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  value: number;
  unit: string;
  target_value?: number;
  baseline_value?: number;
  calculation_method?: string;
  data_quality_score?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Benchmark interface
 */
export interface EnergyBenchmark {
  id: string;
  org_id: string;
  benchmark_code: string;
  benchmark_name: string;
  benchmark_type: 'industry' | 'peer' | 'historical' | 'target' | 'regulatory';
  scope_type: 'org' | 'substation' | 'feeder' | 'meter' | 'voltage_level';
  scope_filter?: Record<string, any>;
  value: number;
  unit: string;
  percentile?: number;
  source?: string;
  source_reference?: string;
  effective_date: string;
  expiry_date?: string;
  confidence_level?: number;
  sample_size?: number;
  description?: string;
  methodology?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Recommendation interface
 */
export interface EnergyRecommendation {
  id: string;
  org_id: string;
  recommendation_type: 'waste' | 'efficiency' | 'peak_shaving' | 'ai_optimization' | 'load_balancing' | 'pq_improvement';
  scope_type: 'substation' | 'feeder' | 'meter' | 'load' | 'transformer';
  scope_id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimated_savings_kwh?: number;
  estimated_savings_cost?: number;
  estimated_implementation_cost?: number;
  payback_period_months?: number;
  confidence_level?: number;
  timeframe?: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  implementation_complexity?: 'Low' | 'Medium' | 'High';
  required_resources?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'cancelled';
  status_reason?: string;
  assigned_to?: string;
  target_implementation_date?: string;
  actual_implementation_date?: string;
  review_date?: string;
  actual_savings_kwh?: number;
  actual_savings_cost?: number;
  actual_implementation_cost?: number;
  source?: string;
  source_reference?: string;
  validation_notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Filter options for KPI snapshots
 */
export interface KPISnapshotFilters {
  org_id?: string;
  kpi_code?: string;
  scope_type?: 'org' | 'substation' | 'feeder' | 'meter';
  scope_id?: string;
  period_grain?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  start_date?: string;
  end_date?: string;
  limit?: number;
}

/**
 * Filter options for benchmarks
 */
export interface BenchmarkFilters {
  org_id?: string;
  benchmark_code?: string;
  benchmark_type?: 'industry' | 'peer' | 'historical' | 'target' | 'regulatory';
  scope_type?: 'org' | 'substation' | 'feeder' | 'meter' | 'voltage_level';
  active?: boolean;
  effective_date?: string;
}

/**
 * Filter options for demand windows
 */
export interface DemandWindowFilters {
  org_id?: string;
  utility_name?: string;
  tariff_code?: string;
  window_name?: 'peak' | 'off_peak' | 'shoulder' | 'super_peak' | 'critical_peak';
  active?: boolean;
  effective_date?: string;
}

/**
 * Filter options for recommendations
 */
export interface RecommendationFilters {
  org_id?: string;
  recommendation_type?: 'waste' | 'efficiency' | 'peak_shaving' | 'ai_optimization' | 'load_balancing' | 'pq_improvement';
  scope_type?: 'substation' | 'feeder' | 'meter' | 'load' | 'transformer';
  scope_id?: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'cancelled';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_to?: string;
}

/**
 * Efficiency scope for transmission KPIs
 */
export interface TransmissionEfficiencyScope {
  id: string;
  name: string;
  category: "substation" | "feeder" | "transformer" | "organization";
  kWhPerMWhDelivered?: number;
  lossesPct?: number;
  loadFactor?: number;
  avgPowerFactor?: number;
  utilizationPct?: number;
  benchmark: {
    kWhPerMWhDelivered?: number;
    lossesPct?: number;
    loadFactor?: number;
    avgPowerFactor?: number;
    utilizationPct?: number;
  };
  target: {
    kWhPerMWhDelivered?: number;
    lossesPct?: number;
    loadFactor?: number;
    avgPowerFactor?: number;
    utilizationPct?: number;
  };
  trend: "up" | "down" | "neutral";
  status: "Normal" | "Warning" | "Critical";
  // Add metadata for filtering
  substation_id?: string;
  feeder_id?: string;
  meter_role?: string;
}

/**
 * AnalyticsProvider class
 */
export class AnalyticsProvider {
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
   * Handle RLS denial errors with user-friendly messages
   */
  private handleError(error: any, operation: string): never {
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

  // Cached tenant ID for Power Transmission demo tenant
  private cachedTransmissionTenantId: string | null = null;

  private async getDefaultTransmissionTenantId(): Promise<string> {
    if (this.cachedTransmissionTenantId) {
      return this.cachedTransmissionTenantId;
    }

    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tenants')
        .select('id')
        .ilike('name', '%Transmission%')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Fallback static ID if not found
          return '69083830-a193-4f8b-aab2-0d17349d286c';
        }
        throw new Error(`getDefaultTransmissionTenantId failed: ${error.message}`);
      }

      this.cachedTransmissionTenantId = data!.id;
      return data!.id;
    } catch (e) {
      return '69083830-a193-4f8b-aab2-0d17349d286c';
    }
  }

  async resolveTenantId(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) return undefined;
    if (tenantId === 't-dewa' || tenantId === 'dewa-transmission' || tenantId === '69083830-a193-4f8b-aab2-0d17349d286c') {
      return this.getDefaultTransmissionTenantId();
    }
    return tenantId;
  }

  // ============================================================================
  // KPI SNAPSHOTS
  // ============================================================================

  /**
   * Get KPI snapshots with filters
   * Requirement: 9.1, 9.2
   */
  async getKPISnapshots(filters?: KPISnapshotFilters): Promise<EnergyKPISnapshot[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('energy_kpi_snapshots').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.kpi_code) {
        query = query.eq('kpi_code', filters.kpi_code);
      }
      if (filters?.scope_type) {
        query = query.eq('scope_type', filters.scope_type);
      }
      if (filters?.scope_id) {
        query = query.eq('scope_id', filters.scope_id);
      }
      if (filters?.period_grain) {
        query = query.eq('period_grain', filters.period_grain);
      }
      if (filters?.start_date) {
        query = query.gte('period_start', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('period_end', filters.end_date);
      }

      // Order by period_start descending (most recent first)
      query = query.order('period_start', { ascending: false });

      // Apply limit if specified
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getKPISnapshots');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getKPISnapshots');
    }
  }

  /**
   * Get transmission efficiency scopes with KPI data
   * Requirement: 9.1, 9.4
   */
  async getTransmissionEfficiencyScopes(org_id: string): Promise<TransmissionEfficiencyScope[]> {
    // Resolve org_id first
    const resolvedOrgId = await this.resolveTenantId(org_id) || org_id;

    // If Supabase is not configured, return mock data
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('Supabase not configured, using mock transmission efficiency scopes');
      return mockTransmissionEfficiencyScopes.map(scope => ({
        ...scope,
        // Convert mock interface to TransmissionEfficiencyScope interface
        id: scope.id,
        name: scope.name,
        category: scope.category,
        kWhPerMWhDelivered: scope.kWhPerMWhDelivered,
        lossesPct: scope.lossesPct,
        loadFactor: scope.loadFactor,
        avgPowerFactor: scope.avgPowerFactor,
        utilizationPct: scope.utilizationPct,
        benchmark: scope.benchmark,
        target: scope.target,
        trend: scope.trend,
        status: scope.status
      }));
    }

    try {
      // Get organizational KPIs
      const { data: orgKPIs, error: orgError } = await supabase!
        .from('energy_kpi_snapshots')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('scope_type', 'org')
        .eq('period_grain', 'month')
        .order('period_start', { ascending: false })
        .limit(10);

      if (orgError) {
        this.handleError(orgError, 'getTransmissionEfficiencyScopes');
      }

      // Get substation KPIs
      const { data: substationKPIs, error: substationError } = await supabase!
        .from('energy_kpi_snapshots')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('scope_type', 'substation')
        .eq('period_grain', 'day')
        .order('period_start', { ascending: false })
        .limit(50);

      if (substationError) {
        this.handleError(substationError, 'getTransmissionEfficiencyScopes');
      }

      // Get feeder KPIs
      const { data: feederKPIs, error: feederError } = await supabase!
        .from('energy_kpi_snapshots')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('scope_type', 'feeder')
        .eq('period_grain', 'day')
        .order('period_start', { ascending: false })
        .limit(50);

      if (feederError) {
        this.handleError(feederError, 'getTransmissionEfficiencyScopes');
      }

      // Get benchmarks for comparison
      const { data: benchmarks, error: benchmarkError } = await supabase!
        .from('energy_benchmarks')
        .select('*')
        .eq('org_id', resolvedOrgId)
        .eq('active', true)
        .order('effective_date', { ascending: false });

      if (benchmarkError) {
        this.handleError(benchmarkError, 'getTransmissionEfficiencyScopes');
      }

      // Get topology data for names
      const { data: substations, error: substationNamesError } = await supabase!
        .from('tx_substations')
        .select('id, code, name')
        .eq('org_id', resolvedOrgId)
        .eq('active', true);

      if (substationNamesError) {
        this.handleError(substationNamesError, 'getTransmissionEfficiencyScopes');
      }

      const { data: feeders, error: feederNamesError } = await supabase!
        .from('tx_feeders')
        .select('id, feeder_code, name, substation_id')
        .eq('active', true);

      if (feederNamesError) {
        this.handleError(feederNamesError, 'getTransmissionEfficiencyScopes');
      }

      // Build efficiency scopes
      const scopes: TransmissionEfficiencyScope[] = [];

      // Create organizational scope
      const orgLosses = orgKPIs?.find(k => k.kpi_code === 'losses_pct');
      const orgLoadFactor = orgKPIs?.find(k => k.kpi_code === 'avg_load_factor');
      const orgKWhPerMWh = orgKPIs?.find(k => k.kpi_code === 'kwh_per_mwh_delivered');

      if (orgLosses || orgLoadFactor || orgKWhPerMWh) {
        scopes.push({
          id: resolvedOrgId,
          name: "Total Organization",
          category: "organization",
          lossesPct: orgLosses?.value,
          loadFactor: orgLoadFactor?.value,
          kWhPerMWhDelivered: orgKWhPerMWh?.value,
          benchmark: {
            lossesPct: orgLosses?.baseline_value,
            loadFactor: orgLoadFactor?.baseline_value,
            kWhPerMWhDelivered: orgKWhPerMWh?.baseline_value,
          },
          target: {
            lossesPct: orgLosses?.target_value,
            loadFactor: orgLoadFactor?.target_value,
            kWhPerMWhDelivered: orgKWhPerMWh?.target_value,
          },
          trend: this.calculateTrend(orgLosses?.value, orgLosses?.baseline_value),
          status: this.calculateStatus(orgLosses?.value, orgLosses?.target_value, orgLosses?.baseline_value)
        });
      }

      // Create substation scopes
      const substationMap = new Map(substations?.map(s => [s.id, s]) || []);
      const substationKPIMap = new Map<string, EnergyKPISnapshot[]>();

      substationKPIs?.forEach(kpi => {
        if (!substationKPIMap.has(kpi.scope_id)) {
          substationKPIMap.set(kpi.scope_id, []);
        }
        substationKPIMap.get(kpi.scope_id)!.push(kpi);
      });

      substationKPIMap.forEach((kpis, substationId) => {
        const substation = substationMap.get(substationId);
        if (!substation) return;

        const losses = kpis.find(k => k.kpi_code === 'losses_pct');
        const loadFactor = kpis.find(k => k.kpi_code === 'load_factor');

        scopes.push({
          id: substationId,
          name: substation.name,
          category: "substation",
          lossesPct: losses?.value,
          loadFactor: loadFactor?.value,
          benchmark: {
            lossesPct: losses?.baseline_value,
            loadFactor: loadFactor?.baseline_value,
          },
          target: {
            lossesPct: losses?.target_value,
            loadFactor: loadFactor?.target_value,
          },
          trend: this.calculateTrend(losses?.value, losses?.baseline_value),
          status: this.calculateStatus(losses?.value, losses?.target_value, losses?.baseline_value)
        });
      });

      // Create feeder scopes
      const feederMap = new Map(feeders?.map(f => [f.id, f]) || []);
      const feederKPIMap = new Map<string, EnergyKPISnapshot[]>();

      feederKPIs?.forEach(kpi => {
        if (!feederKPIMap.has(kpi.scope_id)) {
          feederKPIMap.set(kpi.scope_id, []);
        }
        feederKPIMap.get(kpi.scope_id)!.push(kpi);
      });

      feederKPIMap.forEach((kpis, feederId) => {
        const feeder = feederMap.get(feederId);
        if (!feeder) return;

        const utilization = kpis.find(k => k.kpi_code === 'utilization_pct');
        const powerFactor = kpis.find(k => k.kpi_code === 'avg_power_factor');

        scopes.push({
          id: feederId,
          name: feeder.name,
          category: "feeder",
          utilizationPct: utilization?.value,
          avgPowerFactor: powerFactor?.value,
          benchmark: {
            utilizationPct: utilization?.baseline_value,
            avgPowerFactor: powerFactor?.baseline_value,
          },
          target: {
            utilizationPct: utilization?.target_value,
            avgPowerFactor: powerFactor?.target_value,
          },
          trend: this.calculateTrend(utilization?.value, utilization?.baseline_value),
          status: this.calculateStatus(utilization?.value, utilization?.target_value, utilization?.baseline_value)
        });
      });

      return scopes;
    } catch (error) {
      console.error('[AnalyticsProvider] Error in getTransmissionEfficiencyScopes:', error);
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getTransmissionEfficiencyScopes');
    }
  }

  // ============================================================================
  // BENCHMARKS
  // ============================================================================

  /**
   * Get benchmarks with filters
   * Requirement: 9.4
   */
  async getBenchmarks(filters?: BenchmarkFilters): Promise<EnergyBenchmark[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('energy_benchmarks').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.benchmark_code) {
        query = query.eq('benchmark_code', filters.benchmark_code);
      }
      if (filters?.benchmark_type) {
        query = query.eq('benchmark_type', filters.benchmark_type);
      }
      if (filters?.scope_type) {
        query = query.eq('scope_type', filters.scope_type);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }
      if (filters?.effective_date) {
        query = query.lte('effective_date', filters.effective_date);
        query = query.or(`expiry_date.is.null,expiry_date.gte.${filters.effective_date}`);
      }

      // Order by effective_date descending
      query = query.order('effective_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getBenchmarks');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getBenchmarks');
    }
  }

  // ============================================================================
  // DEMAND WINDOWS
  // ============================================================================

  /**
   * Get transmission demand windows with filters
   * Requirement: 10.2, 10.3
   */
  async getDemandWindows(filters?: DemandWindowFilters): Promise<TxDemandWindow[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('tx_demand_windows').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.utility_name) {
        query = query.eq('utility_name', filters.utility_name);
      }
      if (filters?.tariff_code) {
        query = query.eq('tariff_code', filters.tariff_code);
      }
      if (filters?.window_name) {
        query = query.eq('window_name', filters.window_name);
      }
      if (filters?.active !== undefined) {
        query = query.eq('active', filters.active);
      }
      if (filters?.effective_date) {
        query = query.lte('effective_date', filters.effective_date);
        query = query.or(`expiry_date.is.null,expiry_date.gte.${filters.effective_date}`);
      }

      // Order by utility, tariff, and window name
      query = query.order('utility_name', { ascending: true });
      query = query.order('tariff_code', { ascending: true });
      query = query.order('window_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getDemandWindows');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getDemandWindows');
    }
  }

  /**
   * Get demand windows with current demand calculations
   * Requirement: 10.2, 10.4
   */
  async getDemandWindowsWithCalculations(
    org_id: string,
    substation_id?: string,
    feeder_id?: string
  ): Promise<TxDemandWindowWithCalculations[]> {
    this.ensureConnected();

    try {
      // Resolve org_id first
      const resolvedOrgId = await this.resolveTenantId(org_id) || org_id;

      // Get demand windows for the organization
      const demandWindows = await this.getDemandWindows({
        org_id: resolvedOrgId,
        active: true,
        effective_date: new Date().toISOString().split('T')[0]
      });

      // Get current time info
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
      const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday from 0 to 7
      const currentMonth = now.getMonth() + 1; // Convert to 1-based

      // Get current demand from meters
      let currentDemandKw: number | null = null;
      if (substation_id || feeder_id) {
        const { data: meters, error: meterError } = await supabase!
          .from('v_tx_energy_meter_registry')
          .select('current_kw')
          .eq('org_id', resolvedOrgId)
          .eq(substation_id ? 'substation_id' : 'feeder_id', substation_id || feeder_id);

        if (!meterError && meters) {
          const totalKw = meters
            .map(m => m.current_kw)
            .filter(kw => kw !== null)
            .reduce((sum, kw) => sum + kw, 0);
          currentDemandKw = totalKw > 0 ? totalKw : null;
        }
      }

      // Calculate enhanced demand windows
      const enhancedWindows: TxDemandWindowWithCalculations[] = demandWindows.map(window => {
        // Check if current time falls within this window
        const isCurrentWindow = this.isTimeInWindow(
          currentTime,
          currentDay,
          currentMonth,
          window
        );

        // Calculate next window start (simplified - would need more complex logic for full implementation)
        const nextWindowStart = this.calculateNextWindowStart(window, now);

        // Estimate monthly charge
        const estimatedMonthlyCharge = currentDemandKw && currentDemandKw > window.minimum_demand_kw
          ? currentDemandKw * window.demand_charge_rate
          : window.minimum_demand_kw * window.demand_charge_rate;

        return {
          ...window,
          is_current_window: isCurrentWindow,
          next_window_start: nextWindowStart,
          estimated_monthly_charge: estimatedMonthlyCharge,
          current_demand_kw: currentDemandKw,
          peak_demand_kw: null // Would need historical data query to calculate
        };
      });

      return enhancedWindows;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getDemandWindowsWithCalculations');
    }
  }

  /**
   * Calculate peak demand for a specific window and time period
   * Requirement: 10.2
   */
  async calculatePeakDemandForWindow(
    window_id: string,
    meter_ids: string[],
    start_date: string,
    end_date: string
  ): Promise<{ peak_kw: number; peak_timestamp: string } | null> {
    this.ensureConnected();

    try {
      // Get the demand window details
      const { data: window, error: windowError } = await supabase!
        .from('tx_demand_windows')
        .select('*')
        .eq('id', window_id)
        .single();

      if (windowError || !window) {
        return null;
      }

      // Query telemetry data within the window time constraints
      // This is a simplified version - full implementation would need to handle
      // time zone conversions, seasonal dates, and complex window logic
      const { data: telemetryData, error: telemetryError } = await supabase!
        .from('energy_telemetry')
        .select('kw, timestamp')
        .in('meter_id', meter_ids)
        .gte('timestamp', start_date)
        .lte('timestamp', end_date)
        .not('kw', 'is', null)
        .order('kw', { ascending: false })
        .limit(1);

      if (telemetryError || !telemetryData || telemetryData.length === 0) {
        return null;
      }

      return {
        peak_kw: telemetryData[0].kw,
        peak_timestamp: telemetryData[0].timestamp
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'calculatePeakDemandForWindow');
    }
  }

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  /**
   * Get recommendations with filters
   * Requirement: 11.1, 11.7
   */
  async getRecommendations(filters?: RecommendationFilters): Promise<EnergyRecommendation[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('energy_recommendations').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.recommendation_type) {
        query = query.eq('recommendation_type', filters.recommendation_type);
      }
      if (filters?.scope_type) {
        query = query.eq('scope_type', filters.scope_type);
      }
      if (filters?.scope_id) {
        query = query.eq('scope_id', filters.scope_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      // Order by priority (Critical first) then by created_at descending
      query = query.order('priority', { ascending: false });
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getRecommendations');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getRecommendations');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if current time falls within a demand window
   */
  private isTimeInWindow(
    currentTime: string,
    currentDay: number,
    currentMonth: number,
    window: TxDemandWindow
  ): boolean {
    // Check day of week
    if (!window.days_of_week.includes(currentDay)) {
      return false;
    }

    // Check month (if specified)
    if (window.months && !window.months.includes(currentMonth)) {
      return false;
    }

    // Check time range (simplified - doesn't handle overnight windows)
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(window.start_time);
    const end = this.timeToMinutes(window.end_time);

    if (start <= end) {
      // Same day window
      return current >= start && current <= end;
    } else {
      // Overnight window
      return current >= start || current <= end;
    }
  }

  /**
   * Calculate next occurrence of a demand window
   */
  private calculateNextWindowStart(window: TxDemandWindow, from: Date): string | null {
    // Simplified implementation - would need more complex logic for full implementation
    const tomorrow = new Date(from);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.toISOString().split('T')[0]} ${window.start_time}`;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate trend based on current vs baseline value
   */
  private calculateTrend(current?: number, baseline?: number): "up" | "down" | "neutral" {
    if (!current || !baseline) return "neutral";

    const change = ((current - baseline) / baseline) * 100;

    if (Math.abs(change) < 2) return "neutral";
    return change > 0 ? "up" : "down";
  }

  /**
   * Calculate status based on current, target, and baseline values
   */
  private calculateStatus(current?: number, target?: number, baseline?: number): "Normal" | "Warning" | "Critical" {
    if (!current) return "Normal";

    // For losses, lower is better
    if (target && current > target * 1.2) return "Critical";
    if (target && current > target * 1.1) return "Warning";
    if (baseline && current > baseline * 1.15) return "Critical";
    if (baseline && current > baseline * 1.05) return "Warning";

    return "Normal";
  }
}

// Singleton instance
let analyticsProviderInstance: AnalyticsProvider | null = null;

/**
 * Get the singleton AnalyticsProvider instance
 */
export function getAnalyticsProvider(): AnalyticsProvider {
  if (!analyticsProviderInstance) {
    analyticsProviderInstance = new AnalyticsProvider();
  }
  return analyticsProviderInstance;
}