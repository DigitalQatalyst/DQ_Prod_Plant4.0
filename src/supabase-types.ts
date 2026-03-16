/**
 * TypeScript types for Supabase Operational Excellence Database
 * Auto-generated types that match the database schema
 */

// Database enums
export type SeverityLevel = 'high' | 'medium' | 'low';
export type StatusLevel = 'good' | 'warning' | 'critical';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'in-progress' | 'resolved';
export type SimStatus = 'on-track' | 'at-risk' | 'behind';
export type CiStage = 'backlog' | 'analysis' | 'implementation' | 'validation' | 'verified';
export type CountermeasureStatus = 'planned' | 'in-progress' | 'completed';
export type OptimisationStatus = 'new' | 'under-review' | 'approved' | 'rejected' | 'implemented';

// Core database tables
export interface Tenant {
  id: string;
  name: string;
  sector?: string;
  subsector?: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  tenant_id: string;
  name: string;
  location?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  site_id: string;
  name: string;
  type?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformancePanel {
  id: string;
  tenant_id: string;
  asset_id: string;
  name: string;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
  last_updated: string;
  sector?: string;
  subsector?: string;
  // Sector-specific fields
  well_uptime?: number;
  planned_production?: number;
  actual_production?: number;
  energy_per_barrel?: number;
  flow_assurance_status?: string;
  deferment_hours?: number;
  line_loading?: number;
  transformer_loading?: number;
  transmission_losses?: number;
  saidi?: number;
  saifi?: number;
  trip_count?: number;
  changeover_efficiency?: number;
  packaging_yield?: number;
  batch_yield?: number;
  scrap_rate?: number;
  micro_stop_frequency?: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceLoss {
  id: string;
  performance_panel_id: string;
  category: string;
  duration_minutes: number;
  frequency: number;
  impact_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface PerformanceBottleneck {
  id: string;
  performance_panel_id: string;
  asset_id: string;
  constraint_description: string;
  severity: SeverityLevel;
  impact_description?: string;
  created_at: string;
  updated_at: string;
}

export interface SimBoard {
  id: string;
  tenant_id: string;
  site_id: string;
  name: string;
  shift_name: string;
  shift_date: string;
  status: SimStatus;
  sector?: string;
  subsector?: string;
  // Sector-specific fields
  field_name?: string;
  pad_name?: string;
  well_count?: number;
  active_wells?: number;
  barrel_at_risk?: number;
  mcf_at_risk?: number;
  separator_status?: string;
  trunkline_status?: string;
  pressure_reading?: number;
  temperature_reading?: number;
  flow_rate?: number;
  control_center?: string;
  system_loading?: number;
  outage_count?: number;
  switching_orders_count?: number;
  high_impact_events?: number;
  system_status?: string;
  grid_stability?: number;
  voltage_profile?: string;
  line_name?: string;
  current_sku?: string;
  hourly_target?: number;
  hourly_actual?: number;
  blocking_events?: number;
  starving_events?: number;
  changeover_status?: string;
  material_shortages?: number;
  cip_status?: string;
  quality_status?: string;
  created_at: string;
  updated_at: string;
}

export interface SimMetric {
  id: string;
  sim_board_id: string;
  name: string;
  target_value: number;
  actual_value: number;
  unit: string;
  status: StatusLevel;
  created_at: string;
  updated_at: string;
}

export interface Issue {
  id: string;
  tenant_id: string;
  sim_board_id?: string;
  title: string;
  category: string;
  priority: PriorityLevel;
  status: IssueStatus;
  assignee: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CiProject {
  id: string;
  tenant_id: string;
  title: string;
  stage: CiStage;
  priority: PriorityLevel;
  owner: string;
  target_kpi: string;
  target_improvement: string;
  sector?: string;
  subsector?: string;
  project_type?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface RootCause {
  id: string;
  ci_project_id: string;
  category: string;
  description: string;
  evidence?: any; // JSONB array
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Countermeasure {
  id: string;
  ci_project_id: string;
  root_cause_id?: string;
  description: string;
  status: CountermeasureStatus;
  owner: string;
  due_date: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export interface OptimisationOpportunity {
  id: string;
  tenant_id: string;
  title: string;
  rank_priority: number;
  category: string;
  potential_impact: string;
  confidence_percentage: number;
  status: OptimisationStatus;
  sector?: string;
  subsector?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  optimisation_opportunity_id: string;
  description: string;
  rationale: string;
  confidence_percentage: number;
  estimated_impact: string;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  applicability_percentage: number;
  content?: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface Scenario {
  id: string;
  optimisation_opportunity_id: string;
  name: string;
  parameters: any; // JSONB
  projected_outcome: string;
  confidence_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: string;
  code: string;
  name: string;
  subsectors?: any; // JSONB array
  created_at: string;
  updated_at: string;
}

// View types for common queries
export interface PerformanceSummary {
  id: string;
  name: string;
  tenant_name: string;
  site_name: string;
  asset_name: string;
  oee?: number;
  availability?: number;
  performance?: number;
  quality?: number;
  sector?: string;
  subsector?: string;
  last_updated: string;
}

export interface ActiveIssuesSummary {
  id: string;
  title: string;
  category: string;
  priority: PriorityLevel;
  status: IssueStatus;
  assignee: string;
  tenant_name: string;
  sim_board_name?: string;
  created_at: string;
}

export interface CiProjectsSummary {
  id: string;
  title: string;
  stage: CiStage;
  priority: PriorityLevel;
  owner: string;
  target_kpi: string;
  target_improvement: string;
  completion_percentage: number;
  tenant_name: string;
  sector?: string;
  subsector?: string;
  countermeasures_count: number;
  completed_countermeasures: number;
}

export interface OptimisationOpportunitiesSummary {
  id: string;
  title: string;
  rank_priority: number;
  category: string;
  potential_impact: string;
  confidence_percentage: number;
  status: OptimisationStatus;
  tenant_name: string;
  sector?: string;
  subsector?: string;
  recommendations_count: number;
  scenarios_count: number;
}

// Relationship types with joined data
export interface PerformancePanelWithRelations extends PerformancePanel {
  tenant?: Tenant;
  asset?: Asset & {
    site?: Site;
  };
  losses?: PerformanceLoss[];
  bottlenecks?: PerformanceBottleneck[];
}

export interface SimBoardWithRelations extends SimBoard {
  tenant?: Tenant;
  site?: Site;
  metrics?: SimMetric[];
  issues?: Issue[];
}

export interface CiProjectWithRelations extends CiProject {
  tenant?: Tenant;
  root_causes?: RootCause[];
  countermeasures?: Countermeasure[];
}

export interface OptimisationOpportunityWithRelations extends OptimisationOpportunity {
  tenant?: Tenant;
  recommendations?: Recommendation[];
  scenarios?: Scenario[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types for queries
export interface PerformanceFilters {
  tenant_id?: string;
  sector?: string;
  subsector?: string;
  site_id?: string;
  asset_id?: string;
  oee_min?: number;
  oee_max?: number;
  date_from?: string;
  date_to?: string;
}

export interface SimBoardFilters {
  tenant_id?: string;
  sector?: string;
  subsector?: string;
  site_id?: string;
  shift_name?: string;
  status?: SimStatus;
  date_from?: string;
  date_to?: string;
}

export interface IssueFilters {
  tenant_id?: string;
  status?: IssueStatus;
  priority?: PriorityLevel;
  category?: string;
  assignee?: string;
  date_from?: string;
  date_to?: string;
}

export interface CiProjectFilters {
  tenant_id?: string;
  sector?: string;
  subsector?: string;
  stage?: CiStage;
  priority?: PriorityLevel;
  owner?: string;
  date_from?: string;
  date_to?: string;
}

export interface OptimisationFilters {
  tenant_id?: string;
  sector?: string;
  subsector?: string;
  status?: OptimisationStatus;
  category?: string;
  confidence_min?: number;
  rank_max?: number;
}

// Utility types for creating/updating records
export type CreatePerformancePanel = Omit<PerformancePanel, 'id' | 'created_at' | 'updated_at'>;
export type UpdatePerformancePanel = Partial<CreatePerformancePanel>;

export type CreateSimBoard = Omit<SimBoard, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSimBoard = Partial<CreateSimBoard>;

export type CreateIssue = Omit<Issue, 'id' | 'created_at' | 'updated_at'>;
export type UpdateIssue = Partial<CreateIssue>;

export type CreateCiProject = Omit<CiProject, 'id' | 'created_at' | 'updated_at' | 'completion_percentage'>;
export type UpdateCiProject = Partial<CreateCiProject & { completion_percentage?: number }>;

export type CreateOptimisationOpportunity = Omit<OptimisationOpportunity, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOptimisationOpportunity = Partial<CreateOptimisationOpportunity>;

// Database configuration type
export interface DatabaseConfig {
  url: string;
  anon_key: string;
  service_role_key?: string;
}

// Supabase client configuration
export interface SupabaseClientConfig {
  auth?: {
    autoRefreshToken?: boolean;
    persistSession?: boolean;
    detectSessionInUrl?: boolean;
  };
  realtime?: {
    params?: {
      eventsPerSecond?: number;
    };
  };
}

// Export all types as a namespace for easier imports
export namespace OperationalExcellence {
  export type {
    Tenant,
    Site,
    Asset,
    PerformancePanel,
    PerformanceLoss,
    PerformanceBottleneck,
    SimBoard,
    SimMetric,
    Issue,
    CiProject,
    RootCause,
    Countermeasure,
    OptimisationOpportunity,
    Recommendation,
    Playbook,
    Scenario,
    Sector,
    PerformanceSummary,
    ActiveIssuesSummary,
    CiProjectsSummary,
    OptimisationOpportunitiesSummary,
    PerformancePanelWithRelations,
    SimBoardWithRelations,
    CiProjectWithRelations,
    OptimisationOpportunityWithRelations,
    ApiResponse,
    PaginatedResponse,
    PerformanceFilters,
    SimBoardFilters,
    IssueFilters,
    CiProjectFilters,
    OptimisationFilters,
    CreatePerformancePanel,
    UpdatePerformancePanel,
    CreateSimBoard,
    UpdateSimBoard,
    CreateIssue,
    UpdateIssue,
    CreateCiProject,
    UpdateCiProject,
    CreateOptimisationOpportunity,
    UpdateOptimisationOpportunity,
    DatabaseConfig,
    SupabaseClientConfig
  };
}