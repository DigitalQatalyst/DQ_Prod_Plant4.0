/**
 * Performance Types for Operational Excellence
 * 
 * This module defines TypeScript types for the Performance feature set,
 * including OEE tracking, loss analysis, bottleneck identification,
 * trend analysis, and benchmarking for transmission systems.
 */

// =============================================================================
// Performance Panel Types
// =============================================================================

export interface PerformancePanel {
  id: string;
  tenant_id: string;
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  name: string;
  panel_type: 'asset' | 'site' | 'system';
  
  // OEE Metrics
  oee_percentage: number;
  availability_percentage: number;
  performance_percentage: number;
  quality_percentage: number;
  
  // Transmission-Specific Metrics
  line_loading?: number;
  transformer_loading?: number;
  transmission_losses?: number;
  saidi?: number;
  saifi?: number;
  trip_count?: number;
  
  // Metadata
  status: 'active' | 'inactive' | 'maintenance';
  last_updated: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Performance Loss Types
// =============================================================================

export interface PerformanceLoss {
  id: string;
  tenant_id: string;
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  
  loss_category: 'technical' | 'non_technical' | 'measurement_error';
  loss_type: string;
  description: string;
  
  // Loss Metrics
  duration_minutes: number;
  frequency_count: number;
  impact_percentage: number;
  energy_lost_mwh?: number;
  
  // Timestamps
  occurred_at: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Performance Bottleneck Types
// =============================================================================

export interface PerformanceBottleneck {
  id: string;
  tenant_id: string;
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  
  constraint_type: 'thermal' | 'voltage' | 'stability' | 'operational';
  severity: 'high' | 'medium' | 'low';
  description: string;
  
  // Constraint Metrics
  capacity_limit_mw?: number;
  current_loading_mw?: number;
  loading_percentage?: number;
  constraint_hours: number;
  
  // Status
  status: 'active' | 'resolved' | 'monitoring';
  resolution_notes?: string;
  
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// =============================================================================
// Performance Trend Types
// =============================================================================

export interface PerformanceTrend {
  id: string;
  tenant_id: string;
  metric_name: string;
  metric_value: number;
  timestamp: string;
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
}

// =============================================================================
// Performance Benchmark Types
// =============================================================================

export interface PerformanceBenchmark {
  id: string;
  tenant_id: string;
  benchmark_name: string;
  benchmark_type: 'site_comparison' | 'asset_comparison' | 'historical_comparison';
  
  // Benchmark Data
  entities: BenchmarkEntity[];
  metrics: BenchmarkMetric[];
  
  created_at: string;
  updated_at: string;
}

export interface BenchmarkEntity {
  entity_id: string;
  entity_name: string;
  entity_type: 'site' | 'asset' | 'grid_node' | 'grid_line';
  rank: number;
  percentile: number;
}

export interface BenchmarkMetric {
  metric_name: string;
  metric_value: number;
  target_value?: number;
  benchmark_value?: number;
}

// =============================================================================
// Filter Types
// =============================================================================

export interface PerformanceFilters {
  site_ids?: string[];
  asset_ids?: string[];
  grid_node_ids?: string[];
  grid_line_ids?: string[];
  panel_types?: string[];
  status?: string[];
  oee_min?: number;
  oee_max?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface LossFilters {
  site_ids?: string[];
  asset_ids?: string[];
  grid_node_ids?: string[];
  grid_line_ids?: string[];
  loss_categories?: string[];
  loss_types?: string[];
  date_from?: string;
  date_to?: string;
  impact_min?: number;
  impact_max?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BottleneckFilters {
  site_ids?: string[];
  asset_ids?: string[];
  grid_node_ids?: string[];
  grid_line_ids?: string[];
  constraint_types?: string[];
  severities?: string[];
  statuses?: string[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TrendFilters {
  site_ids?: string[];
  asset_ids?: string[];
  grid_node_ids?: string[];
  grid_line_ids?: string[];
  metric_names?: string[];
  date_from: string;
  date_to: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BenchmarkFilters {
  benchmark_types?: string[];
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// =============================================================================
// Request Types for Create/Update Operations
// =============================================================================

export interface CreatePerformancePanelRequest {
  name: string;
  panel_type: 'asset' | 'site' | 'system';
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  
  // Initial metrics (can be updated later)
  oee_percentage?: number;
  availability_percentage?: number;
  performance_percentage?: number;
  quality_percentage?: number;
}

export interface UpdatePerformancePanelRequest {
  name?: string;
  oee_percentage?: number;
  availability_percentage?: number;
  performance_percentage?: number;
  quality_percentage?: number;
  line_loading?: number;
  transformer_loading?: number;
  transmission_losses?: number;
  saidi?: number;
  saifi?: number;
  trip_count?: number;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface CreatePerformanceLossRequest {
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  loss_category: 'technical' | 'non_technical' | 'measurement_error';
  loss_type: string;
  description: string;
  duration_minutes: number;
  frequency_count: number;
  impact_percentage: number;
  energy_lost_mwh?: number;
  occurred_at: string;
}

export interface UpdatePerformanceLossRequest {
  loss_category?: 'technical' | 'non_technical' | 'measurement_error';
  loss_type?: string;
  description?: string;
  duration_minutes?: number;
  frequency_count?: number;
  impact_percentage?: number;
  energy_lost_mwh?: number;
  resolved_at?: string;
}

export interface CreatePerformanceBottleneckRequest {
  site_id?: string;
  asset_id?: string;
  grid_node_id?: string;
  grid_line_id?: string;
  constraint_type: 'thermal' | 'voltage' | 'stability' | 'operational';
  severity: 'high' | 'medium' | 'low';
  description: string;
  capacity_limit_mw?: number;
  current_loading_mw?: number;
  loading_percentage?: number;
  constraint_hours: number;
}

export interface UpdatePerformanceBottleneckRequest {
  constraint_type?: 'thermal' | 'voltage' | 'stability' | 'operational';
  severity?: 'high' | 'medium' | 'low';
  description?: string;
  capacity_limit_mw?: number;
  current_loading_mw?: number;
  loading_percentage?: number;
  constraint_hours?: number;
  status?: 'active' | 'resolved' | 'monitoring';
  resolution_notes?: string;
  resolved_at?: string;
}

// =============================================================================
// Export Types
// =============================================================================

export interface PerformanceExportRequest {
  export_type: 'csv' | 'excel';
  data_types: ('panels' | 'losses' | 'bottlenecks' | 'trends' | 'benchmarks')[];
  date_from?: string;
  date_to?: string;
  site_ids?: string[];
  asset_ids?: string[];
  grid_node_ids?: string[];
  grid_line_ids?: string[];
  include_metadata?: boolean;
}

export interface ExportResult {
  export_id: string;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  record_count: number;
  created_at: string;
  expires_at: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type PerformancePanelStatus = 'active' | 'inactive' | 'maintenance';
export type LossCategory = 'technical' | 'non_technical' | 'measurement_error';
export type ConstraintType = 'thermal' | 'voltage' | 'stability' | 'operational';
export type BottleneckSeverity = 'high' | 'medium' | 'low';
export type BottleneckStatus = 'active' | 'resolved' | 'monitoring';
export type BenchmarkType = 'site_comparison' | 'asset_comparison' | 'historical_comparison';
export type EntityType = 'site' | 'asset' | 'grid_node' | 'grid_line';
export type PanelType = 'asset' | 'site' | 'system';