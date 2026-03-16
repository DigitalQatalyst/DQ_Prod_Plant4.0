/**
 * Power Transmission Types
 * 
 * This module defines TypeScript types for Power Transmission domain,
 * including grid topology, transmission assets, and related entities.
 */

// =============================================================================
// Transmission Tenant
// =============================================================================

export interface TransmissionTenant {
  id: string;
  name: string;
  sector: 'power';
  subsector: 'transmission';
  scenarioTag: string;
}

// =============================================================================
// Grid Topology Types
// =============================================================================

export interface GridNode {
  id: string;
  tenantId: string;
  siteId: string | null;
  name: string;
  nodeType: 'substation' | 'junction' | 'plant';
  voltageKv: number;
  region: string;
  geoLat: number | null;
  geoLng: number | null;
}

export interface GridLine {
  id: string;
  tenantId: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  voltageKv: number;
  lengthKm: number;
  status: 'active' | 'maintenance' | 'offline';
}

export interface GridAssetLink {
  assetId: string;
  nodeId: string | null;
  lineId: string | null;
}

// =============================================================================
// Transmission Asset Types
// =============================================================================

export interface TransmissionAsset {
  id: string;
  tenantId: string;
  siteId: string;
  siteName?: string;
  assetTypeId: string;
  assetTypeCode: string;  // TRANSFORMER, BREAKER, BAY, METER
  assetTypeName: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  parentAssetId: string | null;
  properties: Record<string, unknown>;
  propertiesSchema?: Record<string, string> | null;
}

// =============================================================================
// Energy Meter Types
// =============================================================================

export type MeterRoleType =
  | 'grid_incomer'        // Meter at grid connection point (requires substation_id)
  | 'feeder_outgoing'     // Meter on outgoing feeder (requires feeder_id)
  | 'transformer_lv'      // Meter on transformer low-voltage side (requires transformer_id)
  | 'station_service'     // Meter for substation auxiliary services (requires substation_id)
  | 'line_monitoring'     // Meter monitoring transmission line (optional topology)
  | 'bay_metering';       // Meter within a specific bay (requires bay_id)

export type MeterStatusType =
  | 'Normal'
  | 'High'
  | 'Critical'
  | 'Offline'
  | 'Maintenance';

export type EnergyType =
  | 'electricity'
  | 'gas'
  | 'diesel'
  | 'steam'
  | 'water'
  | 'compressed_air';

export interface EnergyMeter {
  id: string;
  org_id: string;
  site_id: string | null;

  // Basic meter information
  name: string;
  meter_code: string | null;
  status: MeterStatusType;
  energy_types: EnergyType[];

  // Transmission topology bindings (nullable - not all meters are topology-bound)
  substation_id: string | null;
  feeder_id: string | null;
  bay_id: string | null;
  transformer_id: string | null;

  // Meter role defines the function and required topology
  meter_role: MeterRoleType | null;

  // Technical specifications
  meter_type: string | null;
  scope: string | null;
  location: string | null;
  installation_date: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  communication_protocol: string | null;
  meter_constant: number;

  // Operational data
  current_demand_kw: number | null;
  rated_capacity_kw: number | null;

  // Metadata and audit
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Extended meter interface with resolved topology names (for views)
export interface EnergyMeterWithTopology extends EnergyMeter {
  substation_name: string | null;
  feeder_name: string | null;
  bay_code: string | null;
  transformer_name: string | null;
  last_telemetry_at: string | null;
  current_kw: number | null;
}

// =============================================================================
// Transmission Topology Types
// =============================================================================

export interface TxSubstation {
  id: string;
  org_id: string;
  code: string;
  name: string;
  region: string | null;
  voltage_levels_kv: number[] | null;
  geo: Record<string, unknown> | null;  // GeoJSON
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TxBay {
  id: string;
  substation_id: string;
  bay_code: string;
  name: string;
  bay_type: string | null;  // 'line_bay', 'transformer_bay', 'bus_coupler', 'reactor_bay'
  voltage_level_kv: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TxFeeder {
  id: string;
  substation_id: string;
  feeder_code: string;
  name: string;
  voltage_level_kv: number | null;
  direction: 'incomer' | 'outgoer' | null;
  utility_ref: string | null;
  capacity_mva: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TxTransformer {
  id: string;
  substation_id: string;
  transformer_code: string;
  name: string;
  primary_voltage_kv: number | null;
  secondary_voltage_kv: number | null;
  tertiary_voltage_kv: number | null;
  rated_capacity_mva: number | null;
  cooling_type: string | null;  // 'ONAN', 'ONAF', 'OFAF', 'ODAF'
  tap_changer_type: string | null;  // 'OLTC', 'DETC', 'none'
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TxLine {
  id: string;
  org_id: string;
  line_code: string;
  name: string;
  from_substation_id: string;
  to_substation_id: string;
  voltage_level_kv: number | null;
  length_km: number | null;
  conductor_type: string | null;
  thermal_rating_mva: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Energy Telemetry Types
// =============================================================================

export interface EnergyTelemetry {
  id: string;
  meter_id: string;
  timestamp: string;

  // Energy and power measurements
  kwh: number | null;  // Cumulative energy consumption
  kw: number | null;   // Instantaneous power demand

  // Electrical parameters
  voltage_v: number | null;
  current_a: number | null;
  power_factor: number | null;
  frequency_hz: number | null;
  thd_pct: number | null;  // Total Harmonic Distortion

  // Multi-phase measurements (for 3-phase systems)
  voltage_l1_v: number | null;
  voltage_l2_v: number | null;
  voltage_l3_v: number | null;
  current_l1_a: number | null;
  current_l2_a: number | null;
  current_l3_a: number | null;

  // Data quality and metadata
  quality_score: number;
  data_source: string | null;  // 'meter', 'sensor', 'calculated', 'estimated'
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// View and Function Return Types
// =============================================================================

/**
 * Return type for v_tx_energy_meter_registry view
 * Comprehensive meter registry with resolved topology names and latest telemetry
 * Requirements: 1.6, 2.5
 */
export interface TxEnergyMeterRegistry {
  // Meter core fields
  id: string;
  org_id: string;
  site_id: string | null;
  name: string;
  meter_code: string | null;
  status: MeterStatusType;
  energy_types: EnergyType[];
  meter_role: MeterRoleType | null;
  meter_type: string | null;
  scope: string | null;
  location: string | null;
  active: boolean;

  // Topology references (IDs)
  substation_id: string | null;
  feeder_id: string | null;
  bay_id: string | null;
  transformer_id: string | null;

  // Resolved topology names
  substation_name: string | null;
  substation_code: string | null;
  substation_region: string | null;
  feeder_name: string | null;
  feeder_code: string | null;
  feeder_direction: 'incomer' | 'outgoer' | null;
  feeder_voltage_kv: number | null;
  bay_name: string | null;
  bay_code: string | null;
  bay_type: string | null;
  transformer_name: string | null;
  transformer_code: string | null;
  transformer_capacity_mva: number | null;

  // Latest telemetry information
  last_telemetry_at: string | null;
  current_kw: number | null;
  current_kwh: number | null;
  current_voltage_v: number | null;
  current_power_factor: number | null;
  current_frequency_hz: number | null;
  current_thd_pct: number | null;

  // Staleness indicator (telemetry older than 1 hour)
  is_stale: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Multi-fluid energy summary grouped by energy type
 * Requirement: 5.1
 */
export interface MultiFluidSummary {
  energy_type: EnergyType;
  meter_count: number;
  total_kwh: number | null;
  avg_kw: number | null;
  max_kw: number | null;
  total_cost: number | null;
  co2_emissions: number | null;
  meters: {
    meter_id: string;
    meter_name: string;
    substation_id: string | null;
    substation_name: string | null;
    feeder_id: string | null;
    feeder_name: string | null;
    current_kw: number | null;
    total_kwh: number | null;
    cost: number | null;
    co2_emissions: number | null;
  }[];
}

/**
 * Return type for fn_tx_latest_meter_snapshot function
 * Latest telemetry point with 24-hour power quality summary
 * Requirements: 2.5
 */
export interface TxLatestMeterSnapshot {
  // Telemetry fields
  meter_id: string;
  meter_name: string;
  timestamp: string;
  kw: number | null;
  kwh: number | null;
  voltage_v: number | null;
  current_a: number | null;
  power_factor: number | null;
  frequency_hz: number | null;
  thd_pct: number | null;

  // Multi-phase measurements
  voltage_l1_v: number | null;
  voltage_l2_v: number | null;
  voltage_l3_v: number | null;
  current_l1_a: number | null;
  current_l2_a: number | null;
  current_l3_a: number | null;

  // Data quality
  data_source: string | null;
  quality_score: number | null;

  // Power quality summary (24-hour)
  pq_avg_power_factor: number | null;
  pq_avg_thd: number | null;
  pq_min_voltage: number | null;
  pq_max_voltage: number | null;
  pq_avg_frequency: number | null;
}

/**
 * Return type for fn_calculate_energy_consumption function
 * Total energy consumption and statistics for a meter within a time window
 * Requirements: 2.5
 */
export interface TxEnergyConsumption {
  meter_id: string;
  meter_name: string;
  period_start: string;
  period_end: string;
  total_kwh: number | null;
  avg_kw: number | null;
  max_kw: number | null;
  min_kw: number | null;
  data_point_count: number;
  avg_power_factor: number | null;
  avg_voltage_v: number | null;
  avg_frequency_hz: number | null;
}

// =============================================================================
// Energy Baseline Types
// =============================================================================

export interface EnergyBaseline {
  id: string;
  meter_id: string;
  baseline_name: string;
  baseline_type: string | null;  // 'historical', 'engineered', 'regression', 'seasonal', 'rolling'
  baseline_period_start: string;  // DATE
  baseline_period_end: string;    // DATE
  baseline_value: number;
  baseline_unit: string;
  normalization_factors: Record<string, unknown>;
  calculation_method: string | null;
  confidence_level: number;
  r_squared: number | null;
  cv_rmse: number | null;

  // Transmission-specific baseline metrics
  baseline_kwh_per_mwh_delivered: number | null;
  baseline_kwh_per_mw_peak: number | null;
  baseline_method: string | null;  // 'regression', 'seasonal', 'rolling'

  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Meter Channel Types
// =============================================================================

export interface TxMeterChannel {
  id: string;
  meter_id: string;
  channel_number: number;
  channel_name: string;
  channel_type: string | null;  // 'main', 'auxiliary', 'check', 'redundant'
  measurement_type: string | null;  // 'active_power', 'reactive_power', 'voltage', 'current', 'frequency'
  phase: string | null;  // 'L1', 'L2', 'L3', 'N', 'L1-L2', 'L2-L3', 'L3-L1', '3-phase'
  unit: string | null;  // 'kW', 'kVAr', 'V', 'A', 'Hz'
  multiplier: number;
  offset: number;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Power Quality Types
// =============================================================================

export interface TxPowerQualityLimit {
  id: string;
  org_id: string;
  voltage_level_kv: number;
  limit_type: string;  // 'voltage_sag', 'voltage_swell', 'thd_voltage', 'thd_current', 'frequency_deviation', 'power_factor'
  severity: 'Low' | 'Medium' | 'High' | 'Critical';

  // Threshold values
  min_value: number | null;
  max_value: number | null;
  duration_threshold_ms: number | null;

  // Metadata
  standard_reference: string | null;  // e.g., 'IEEE 1159', 'IEC 61000-4-30', 'Grid Code'
  description: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PowerQualityEvent {
  id: string;
  meter_id: string;
  event_type: string;  // 'sag', 'swell', 'thd_high', 'frequency_deviation', 'pf_low'
  timestamp: string;
  duration_ms: number | null;
  magnitude: number | null;
  pre_event_value: number | null;
  post_event_value: number | null;
  affected_phases: string | null;  // 'L1', 'L2', 'L3', 'L1,L2', etc.
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PowerQuality {
  id: string;
  meter_id: string;
  timestamp: string;
  power_factor: number | null;
  thd_voltage_pct: number | null;
  thd_current_pct: number | null;
  voltage_l1: number | null;
  voltage_l2: number | null;
  voltage_l3: number | null;
  current_l1: number | null;
  current_l2: number | null;
  current_l3: number | null;
  frequency: number | null;
  voltage_imbalance_pct: number | null;
  current_imbalance_pct: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TxPowerQualityLimit {
  id: string;
  org_id: string;
  voltage_level_kv: number;
  limit_type: string;  // 'voltage_sag', 'voltage_swell', 'thd_voltage', 'thd_current', 'frequency_deviation', 'power_factor'
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  min_value: number | null;
  max_value: number | null;
  duration_threshold_ms: number | null;
  standard_reference: string | null;
  description: string | null;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Submeter Types
// =============================================================================

export interface Submeter {
  id: string;
  parent_meter_id: string;
  submeter_id: string;
  allocation_percentage: number | null;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Extended submeter interface with resolved meter names
export interface SubmeterWithNames extends Submeter {
  parent_meter_name: string;
  submeter_name: string;
  parent_meter_location: string | null;
  submeter_location: string | null;
}

// =============================================================================
// Demand Window Types
// =============================================================================

export interface TxDemandWindow {
  id: string;
  org_id: string;
  utility_name: string;
  tariff_code: string;
  window_name: 'peak' | 'off_peak' | 'shoulder' | 'super_peak' | 'critical_peak';

  // Time definitions
  start_time: string;  // TIME format (HH:MM:SS)
  end_time: string;    // TIME format (HH:MM:SS)
  days_of_week: number[];  // Array of day numbers (1=Monday, 7=Sunday)
  months?: number[] | null;  // Optional: array of month numbers (1=Jan, 12=Dec)

  // Seasonal variations
  season?: 'summer' | 'winter' | 'spring' | 'fall' | null;
  season_start_date?: string | null;  // DATE format
  season_end_date?: string | null;    // DATE format

  // Demand charge parameters
  demand_charge_rate: number;  // $/kW
  demand_charge_unit: string;  // Default 'USD/kW'
  minimum_demand_kw: number;
  ratchet_percentage?: number | null;  // Percentage of peak demand to maintain as minimum
  ratchet_months: number;  // Number of months to apply ratchet

  // Window characteristics
  window_duration_minutes?: number | null;
  measurement_interval_minutes: number;  // Typically 15 or 30 minutes

  // Metadata
  effective_date: string;  // DATE format
  expiry_date?: string | null;  // DATE format
  description?: string | null;
  tariff_document_reference?: string | null;
  active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Demand window with calculated fields for UI display
export interface TxDemandWindowWithCalculations extends TxDemandWindow {
  is_current_window: boolean;  // Whether current time falls within this window
  next_window_start?: string | null;  // Next occurrence of this window
  estimated_monthly_charge?: number | null;  // Estimated monthly charge based on current demand
  current_demand_kw?: number | null;  // Current demand for associated meters
  peak_demand_kw?: number | null;  // Peak demand within this window for current period
}

// =============================================================================
// KPI Types
// =============================================================================

export interface TransmissionKpis {
  totalAssets: number;
  onlineAssets: number;
  offlineAssets: number;
  maintenanceAssets: number;
  criticalAlerts: number;
  warningAlerts: number;
  totalGridNodes: number;
  totalGridLines: number;
  activeLines: number;
}

// =============================================================================
// Compliance Types
// =============================================================================

export interface TxComplianceRequirement {
  id: string;
  org_id: string;
  requirement_code: string;
  requirement_name: string;
  requirement_type: 'reporting' | 'operational' | 'documentation' | 'audit' | 'certification' | 'training';
  compliance_category: 'emissions' | 'energy_efficiency' | 'renewable_energy' | 'reliability' | 'security' | 'safety' | 'environmental';

  // Regulatory details
  standard_reference: string | null;  // ISO 50001, NERC CIP, EPA GHG Reporting, etc.
  regulatory_body: string | null;  // EPA, NERC, ISO, state agency, etc.
  description: string | null;
  requirement_text: string | null;

  // Compliance tracking
  compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';

  // Dates and review
  effective_date: string;  // DATE
  expiry_date: string | null;  // DATE
  review_frequency_days: number | null;
  next_review_date: string | null;  // DATE
  last_review_date: string | null;  // DATE

  // Evidence and documentation
  evidence_types: string[] | null;  // ['reports', 'certifications', 'audits', 'measurements', 'logs']
  evidence_retention_years: number | null;

  // Scope and applicability
  applies_to_scope: 'org' | 'substation' | 'feeder' | 'all_transmission';
  scope_filter: Record<string, unknown> | null;  // JSON filters for applicability (voltage_level, region, etc.)

  // Assignment and responsibility
  assigned_to: string | null;  // User ID or role
  responsible_department: string | null;

  // Metadata
  tags: string[] | null;
  metadata: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface TxComplianceEvidence {
  id: string;
  org_id: string;
  requirement_id: string;

  // Evidence details
  evidence_type: string;  // 'report', 'certification', 'audit', 'measurement', 'log', 'document', 'photo', 'video'
  evidence_name: string;
  description: string | null;

  // File/document information
  file_path: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  file_mime_type: string | null;
  document_reference: string | null;

  // Validity and verification
  valid_from: string;  // DATE
  valid_until: string | null;  // DATE
  verified: boolean;
  verified_by: string | null;  // User ID
  verified_at: string | null;
  verification_notes: string | null;

  // Linkage to other entities
  linked_substation_id: string | null;
  linked_feeder_id: string | null;
  linked_meter_id: string | null;
  linked_asset_id: string | null;

  // Status
  status: 'active' | 'superseded' | 'expired' | 'rejected';
  superseded_by: string | null;  // Reference to newer evidence

  // Metadata
  metadata: Record<string, unknown>;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Extended compliance requirement with evidence summary
export interface TxComplianceRequirementWithEvidence extends TxComplianceRequirement {
  evidence_count: number;
  active_evidence_count: number;
  expired_evidence_count: number;
  missing_evidence_types: string[] | null;
  last_evidence_date: string | null;
  next_evidence_due_date: string | null;
  days_until_review: number | null;
  days_until_expiry: number | null;
}

// Compliance summary for dashboard/overview
export interface TxComplianceSummary {
  org_id: string;
  total_requirements: number;
  compliant_count: number;
  non_compliant_count: number;
  pending_count: number;
  not_applicable_count: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  overdue_reviews_count: number;
  expiring_soon_count: number;  // Expiring within 30 days
  missing_evidence_count: number;
  overall_compliance_percentage: number;
  by_category: {
    category: string;
    total: number;
    compliant: number;
    compliance_percentage: number;
  }[];
  by_type: {
    type: string;
    total: number;
    compliant: number;
    compliance_percentage: number;
  }[];
}

// =============================================================================
// Dashboard Types
// =============================================================================

export interface DashboardWidget {
  widget_id: string;
  widget_type: 'kpi_tile' | 'trend_chart' | 'table' | 'gauge' | 'map' | 'status_grid' | 'alert_list';
  title: string;
  query_config: {
    dataset: string;  // Whitelisted dataset name
    filters?: Record<string, unknown>;
    aggregation?: string;
    time_range?: string;
  };
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  settings?: Record<string, unknown>;
}

export interface DashboardDefinition {
  id: string;
  org_id: string;
  dashboard_code: string;
  name: string;
  description: string | null;

  // Dashboard type and category
  dashboard_type: 'system' | 'custom' | 'template';
  category: 'energy' | 'transmission' | 'sustainability' | 'operations' | 'compliance' | 'financial' | 'technical' | null;

  // Configuration
  config: {
    widgets: DashboardWidget[];
    layout?: Record<string, unknown>;
    filters?: Record<string, unknown>;
    refresh_interval_seconds?: number;
  };
  version: number;

  // Access control
  owner_id: string | null;
  public_dashboard: boolean;
  shared_with: string[] | null;  // Array of user IDs

  // Status
  active: boolean;
  published: boolean;
  superseded_by: string | null;

  // Usage tracking
  view_count: number;
  last_viewed_at: string | null;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DashboardFavorite {
  id: string;
  user_id: string;
  dashboard_id: string;
  org_id: string;
  sort_order: number;
  pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Extended dashboard with favorite status
export interface DashboardDefinitionWithFavorite extends DashboardDefinition {
  is_favorite: boolean;
  is_pinned: boolean;
  favorite_sort_order: number | null;
}

// =============================================================================
// Energy Tariff Types
// =============================================================================

export interface TimeOfUseRate {
  period_name: string;  // 'peak', 'off_peak', 'shoulder', 'super_peak'
  start_time: string;  // HH:MM format
  end_time: string;    // HH:MM format
  days_of_week: number[];  // 1-7 (Monday-Sunday)
  months?: number[];  // 1-12 (optional seasonal)
  rate_per_kwh: number;
}

export interface SeasonalRate {
  season_name: string;  // 'summer', 'winter', 'spring', 'fall'
  start_month: number;  // 1-12
  end_month: number;    // 1-12
  energy_rate_multiplier: number;  // Multiplier applied to base rate
  demand_rate_multiplier: number;
}

export interface EnergyTariff {
  id: string;
  org_id: string;
  tariff_code: string;
  tariff_name: string;
  description: string | null;

  // Tariff type and structure
  tariff_type: 'transmission' | 'distribution' | 'generation' | 'ancillary_services' | 'combined';
  rate_structure: 'flat' | 'time_of_use' | 'demand_charge' | 'tiered' | 'real_time_pricing' | 'combined';

  // Utility/Provider
  utility_name: string | null;
  utility_account_number: string | null;
  service_territory: string | null;

  // Applicability
  applies_to_scope: 'org' | 'substation' | 'feeder' | 'meter';
  scope_id: string | null;
  voltage_level_kv: number | null;

  // Rate components
  energy_rate_per_kwh: number | null;
  demand_rate_per_kw: number | null;
  fixed_charge_per_month: number | null;

  // Time-of-use rates
  tou_rates: TimeOfUseRate[] | null;

  // Demand charge configuration
  demand_window_minutes: number | null;
  demand_ratchet_enabled: boolean;
  demand_ratchet_percentage: number | null;
  demand_ratchet_months: number | null;

  // Seasonal rates
  seasonal_rates_enabled: boolean;
  seasonal_rates: SeasonalRate[] | null;

  // Temporal validity
  effective_date: string;  // DATE
  expiry_date: string | null;  // DATE

  // Status
  active: boolean;
  default_tariff: boolean;

  // Additional charges
  additional_charges: Record<string, unknown> | null;

  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Tariff cost calculation result
export interface TariffCostCalculation {
  energy_cost: number;
  demand_cost: number;
  fixed_cost: number;
  total_cost: number;
  tariff_name: string;
  calculation_details?: {
    energy_kwh: number;
    peak_demand_kw: number;
    period_start: string;
    period_end: string;
    rate_structure: string;
  };
}

// =============================================================================
// Export Job Types
// =============================================================================

export interface ExportJob {
  id: string;
  org_id: string;

  // Job details
  job_type: 'report' | 'data_export' | 'audit_export' | 'compliance_package' | 'dashboard_export';
  template_id: string | null;
  dashboard_id: string | null;

  // Export parameters
  export_format: 'pdf' | 'excel' | 'csv' | 'json' | 'xml';
  date_range_start: string | null;
  date_range_end: string | null;
  filters: Record<string, unknown>;

  // Status tracking
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  error_message: string | null;
  retry_count: number;
  max_retries: number;

  // Timing
  queued_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;

  // Output
  output_file_url: string | null;
  output_file_name: string | null;
  output_file_size_bytes: number | null;
  row_count: number | null;

  // Metadata
  generation_metadata: Record<string, unknown>;
  requested_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Export job with progress details
export interface ExportJobWithProgress extends ExportJob {
  estimated_completion_time: string | null;
  elapsed_time_seconds: number | null;
  remaining_time_seconds: number | null;
  can_retry: boolean;
  can_cancel: boolean;
}

// =============================================================================
// Common Types (Pagination, Sorting, Results)
// =============================================================================

export interface PaginationParams {
  limit?: number;  // Default: 25
  offset?: number; // Default: 0
}

export interface SortParams {
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ListResult<T> {
  data: T[];
  total: number;
}

export interface ErrorResponse {
  code: 'QUERY_FAILED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'REFERENTIAL_INTEGRITY';
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Property Set Types (Cycle 1: Catalog)
// =============================================================================

export interface PropertyField {
  id: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  unit?: string;
  required?: boolean;
}

export interface PropertySet {
  id: string;
  tenantId: string;
  name: string;
  type: 'technical' | 'operational' | 'safety' | 'financial' | 'maintenance';
  fields: PropertyField[];
  description?: string;
  createdAt: string;
}

// =============================================================================
// Lifecycle State Types (Cycle 1: Catalog)
// =============================================================================

export interface LifecycleState {
  id: string;
  tenantId: string;
  assetCategory: string;
  name: string;
  orderIndex: number;
  description?: string;
  createdAt: string;
}

// =============================================================================
// Discovery Types (Cycle 2: Discovery & Onboarding)
// =============================================================================

export interface DiscoveryScope {
  ipRange?: string;
  nodeIds?: string[];
  geoArea?: { lat: number; lng: number; radiusKm: number };
}

export interface DiscoveryJob {
  id: string;
  tenantId: string;
  name: string;
  type: 'network' | 'topology' | 'geographic';
  scope: DiscoveryScope;
  status: 'pending' | 'running' | 'completed' | 'failed';
  foundCount: number;
  lastRunAt?: string;
  errors?: string[];
  description?: string;
  createdAt: string;
}

export interface DiscoveryAgent {
  id: string;
  tenantId: string;
  name: string;
  type: 'ied_gateway' | 'scada_bridge' | 'rtu_collector';
  protocols: string[];
  status: 'active' | 'inactive' | 'error';
  assignedScopes: DiscoveryScope[];
  lastRun?: string;
  description?: string;
  createdAt: string;
}

export interface CandidateAsset {
  id: string;
  tenantId: string;
  discoveryJobId: string;
  suggestedName: string;
  suggestedTypeId?: string;
  suggestedTypeName?: string;
  suggestedHierarchy: Record<string, string>;
  matchedExistingAssetId?: string;
  confidence: number;
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  rawData?: Record<string, unknown>;
  createdAt: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface AssetImport {
  id: string;
  tenantId: string;
  name: string;
  status: 'pending' | 'mapping' | 'preview' | 'completed' | 'failed';
  sourceType: 'csv' | 'excel' | 'api';
  recordCount: number;
  importedCount: number;
  errors?: ImportError[];
  createdAt: string;
  completedAt?: string;
}

// =============================================================================
// Linear Asset Issue Types (Cycle 3: Location & Topology)
// =============================================================================

export interface LinearAssetIssue {
  id: string;
  tenantId: string;
  gridLineId: string;
  gridLineName?: string;
  type: 'thermal_overload' | 'protection_fault' | 'insulator_damage' | 'conductor_sag';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
}

// =============================================================================
// Connectivity Types (Cycle 4: Connectivity & Data Points)
// =============================================================================

export interface ConnectionEndpoint {
  id: string;
  tenantId: string;
  name: string;
  protocol: 'IEC61850' | 'DNP3' | 'OPC-UA' | 'Modbus-TCP' | 'MQTT';
  address: string;
  port?: number;
  zone?: 'IT' | 'OT' | 'DMZ';
  hazardousArea?: string;
  status: 'up' | 'down' | 'unknown';
  lastSeen?: string;
  description?: string;
  createdAt: string;
}

export interface StreamConfig {
  id: string;
  tenantId: string;
  name: string;
  pollingInterval: number;
  retention: '7d' | '30d' | '90d' | '1y';
  profile: 'high-frequency' | 'standard' | 'low-frequency';
  assetTypes: string[];
  isSandbox: boolean;
  description?: string;
  createdAt: string;
}


// =============================================================================
// Portfolio Management Types (Cycle 5: Portfolio Management)
// =============================================================================

export interface AssetFilter {
  siteId?: string;
  assetTypeId?: string;
  status?: string;
  criticality?: string;
  search?: string;
}

export interface SavedView {
  id: string;
  tenantId: string;
  name: string;
  filters: AssetFilter;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioKpis {
  totalAssets: number;
  onlineAssets: number;
  offlineAssets: number;
  maintenanceAssets: number;
  criticalAlerts: number;
  warningAlerts: number;
  assetsByType: Record<string, number>;
  assetsBySite: Record<string, number>;
}

// =============================================================================
// Telemetry Types (Cycle 6: Asset Detail & Context)
// =============================================================================

export interface TelemetryPoint {
  id: string;
  tenantId: string;
  assetId: string | null;
  tagId: string | null;
  metric: string;
  unit: string | null;
  limits: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
    states?: string[];
  } | null;
  createdAt: string;
}

// =============================================================================
// Asset Detail Types (Cycle 6: Asset Detail & Context)
// =============================================================================

export interface AssetDocument {
  id: string;
  tenantId: string;
  assetId: string;
  name: string;
  category: 'manual' | 'drawing' | 'certificate' | 'report' | 'other';
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface AssetAuditLog {
  id: string;
  tenantId: string;
  assetId: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'maintenance';
  changedFields: string[];
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  userId?: string;
  performedAt: string;
  details?: string;
}

// =============================================================================
// Compliance Types (Cycle 6: Asset Detail)
// =============================================================================

export interface ComplianceRecord {
  id: string;
  tenantId: string;
  assetId: string;
  title: string;
  complianceType: 'certification' | 'inspection' | 'calibration' | 'audit';
  authority: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'expired' | 'pending';
  description?: string;
  referenceNumber?: string;
  issueDate: string;
  expiryDate?: string;
  nextInspectionDate?: string;
  createdAt: string;
}

