/**
 * DataProvider Interface
 * 
 * This is the single read surface for all data access in the application.
 * Implementations can switch between MockProvider (legacy mocks) and SupabaseProvider.
 * 
 * MIGRATION STRATEGY:
 * 1. All components should consume data through this interface
 * 2. MockProvider wraps existing mock data functions
 * 3. SupabaseProvider will be implemented entity-by-entity
 * 4. Switch via VITE_DATA_BACKEND env variable
 */

import type { Tenant, Asset, Sector } from "@/types/navigation";
import type { Alert, Incident, AlertStatus } from "@/types/alert";
import type {
  UpstreamAsset,
  UpstreamTenant,
  UpstreamDiscoveryJob,
  DiscoveryAgent,
  ConnectionEndpoint,
  CandidateAsset
} from "@/types/assets";
import type {
  TransmissionTenant,
  GridNode,
  GridLine,
  TransmissionAsset,
  TransmissionKpis,
  PropertySet,
  LifecycleState,
  TelemetryPoint,
  PaginationParams,
  SortParams,
  ListResult
} from "@/types/transmission";
import type {
  PerformancePanel,
  PerformanceLoss,
  PerformanceBottleneck,
  PerformanceTrend,
  PerformanceBenchmark,
  PerformanceFilters,
  LossFilters,
  BottleneckFilters,
  TrendFilters,
  BenchmarkFilters,
  CreatePerformancePanelRequest,
  UpdatePerformancePanelRequest,
  CreatePerformanceLossRequest,
  UpdatePerformanceLossRequest,
  CreatePerformanceBottleneckRequest,
  UpdatePerformanceBottleneckRequest,
  PerformanceExportRequest,
  ExportResult
} from "@/types/performance";
import type {
  SIMBoard,
  Shift,
  KPIMetric,
  SwitchingOrder,
  Outage,
  SimIssue,
  SimAction,
  CreateSwitchingOrderRequest,
  UpdateSwitchingOrderRequest,
  CreateOutageRequest,
  UpdateOutageRequest,
  CreateSimIssueRequest,
  UpdateSimIssueRequest,
  CreateSimActionRequest,
  UpdateSimActionRequest,
  SIMBoardFilters,
  SwitchingOrderFilters,
  OutageFilters,
  SimIssueFilters,
  SimActionFilters,
  CIStage,
  CIProject,
  RootCauseAnalysis,
  Countermeasure,
  CIKPI,
  CIImpact,
  CIDocument,
  CreateCIProjectRequest,
  UpdateCIProjectRequest,
  UpsertRCARequest,
  CreateCountermeasureRequest,
  UpdateCountermeasureRequest,
  UpsertImpactRequest,
  CreateCIDocumentRequest,
  CIProjectFilters,
  CountermeasureFilters,
  OptimisationOpportunity,
  AIRecommendation,
  OptimisationPlaybook,
  OptimisationSimulation,
  PublishEvent,
  UpdateOpportunityRequest,
  CreateRecommendationRequest,
  UpdateRecommendationRequest,
  CreateSimulationRequest,
  UpdateSimulationRequest,
  PublishToSimRequest,
  PublishToCiRequest,
  OpportunityFilters,
  RecommendationFilters,
  PlaybookFilters,
  SimulationFilters,
  PublishEventFilters
} from "@/types/optimise";

import type {
  AutomationDashboardData,
  AutomationAlert,
  TagMapping,
  ProcessAutomationFilters,
  ControlModel,
  ActionBinding,
  Trigger,
  AlarmRule,
  EventPattern,
  Workflow,
  Sequence,
  ControlRule,
  Version,
  Approval,
  Simulation,
  AuditLog
} from "@/types/processAutomation";

/**
 * Site summary for dashboard widgets
 */
export interface SiteSummary {
  site: string;
  assetCount: number;
  onlineCount: number;
}

/**
 * Core DataProvider interface
 * 
 * Methods mirror existing helper functions to enable gradual migration.
 * Each method returns a Promise to support async Supabase queries.
 */
export interface DataProvider {
  // ============================================================================
  // Provider Metadata
  // ============================================================================

  /** Get provider information for debugging and logging */
  getInfo(): ProviderInfo;

  // ============================================================================
  // Tenant / Organization
  // ============================================================================

  /** Get all tenants/organizations */
  getTenants(): Promise<Tenant[]>;

  /** Get tenants filtered by sector */
  getTenantsBySector(sectorId: string): Promise<Tenant[]>;

  /** Get a single tenant by ID */
  getTenantById(tenantId: string): Promise<Tenant | null>;

  // ============================================================================
  // Sectors
  // ============================================================================

  /** Get all available sectors */
  getSectors(): Promise<Sector[]>;

  /** Get a single sector by ID */
  getSectorById(sectorId: string): Promise<Sector | null>;

  // ============================================================================
  // Assets
  // ============================================================================

  /** Get assets for a tenant */
  getAssetsByTenant(tenantId: string): Promise<Asset[]>;

  /** Get a single asset by ID */
  getAssetById(assetId: string): Promise<Asset | UpstreamAsset | null>;

  /** Get site summary for a tenant (for dashboard widgets) */
  getSiteSummaryByTenant(tenantId: string): Promise<SiteSummary[]>;

  // ============================================================================
  // Alerts & Incidents
  // ============================================================================

  /** Get alerts for a tenant */
  getAlertsByTenant(tenantId: string): Promise<Alert[]>;

  /** Get alerts filtered by severity */
  getAlertsBySeverity(tenantId: string, severity: string): Promise<Alert[]>;

  /** Get incidents for a tenant */
  getIncidentsByTenant(tenantId: string): Promise<Incident[]>;

  // ============================================================================
  // Upstream-specific (Oil & Gas)
  // ============================================================================

  /** Get upstream assets for a tenant */
  getUpstreamAssetsByTenant(tenantId: string): Promise<UpstreamAsset[]>;

  /** Get discovery jobs for a tenant */
  getDiscoveryJobsByTenant(tenantId: string): Promise<UpstreamDiscoveryJob[]>;

  /** Get discovery agents for a tenant */
  getDiscoveryAgentsByTenant(tenantId: string): Promise<DiscoveryAgent[]>;

  /** Get connection endpoints for a tenant */
  getConnectionEndpointsByTenant(tenantId: string): Promise<ConnectionEndpoint[]>;

  /** Get candidate assets for a discovery job */
  getCandidateAssetsByJob(jobId: string): Promise<CandidateAsset[]>;

  // ============================================================================
  // Transmission-specific (Power Transmission)
  // ============================================================================

  /** Get transmission tenants (sector='power') */
  getTransmissionTenants(): Promise<TransmissionTenant[]>;

  /** Get grid nodes for a tenant */
  getGridNodesByTenant(tenantId: string): Promise<GridNode[]>;

  /** Get grid lines for a tenant */
  getGridLinesByTenant(tenantId: string): Promise<GridLine[]>;

  /** Get transmission assets for a tenant */
  getTransmissionAssetsByTenant(tenantId: string): Promise<TransmissionAsset[]>;

  /** Get a single transmission asset by ID */
  getTransmissionAssetById(assetId: string): Promise<TransmissionAsset | null>;

  /** Get transmission overview KPIs for a tenant */
  getTransmissionOverviewKpis(tenantId: string): Promise<TransmissionKpis>;

  /** Get alerts for an asset */
  getAlertsByAsset(assetId: string): Promise<Alert[]>;

  /** Get telemetry points for an asset */
  getTelemetryPointsByAsset(assetId: string): Promise<TelemetryPoint[]>;

  /** Get child assets for a parent asset */
  getChildAssets(parentAssetId: string): Promise<TransmissionAsset[]>;

  /** Get topology links for an asset */
  getAssetTopologyLinks(assetId: string): Promise<import('@/types/transmission').GridAssetLink[]>;

  /** Update an existing transmission asset */
  updateTransmissionAsset(
    assetId: string,
    data: Partial<Omit<TransmissionAsset, 'id' | 'tenantId' | 'assetTypeId' | 'assetTypeCode' | 'assetTypeName'>>
  ): Promise<TransmissionAsset>;


  // ============================================================================
  // Performance Management (OEE & Performance Tracking)
  // ============================================================================

  // Performance-related methods
  /** List performance monitoring panels */
  listPerformancePanels(tenantId: string, filters?: PerformanceFilters): Promise<PerformancePanel[]>;

  /** Get a single performance panel by ID */
  getPerformancePanel(id: string): Promise<PerformancePanel | null>;

  /** Create a new performance panel */
  createPerformancePanel(tenantId: string, data: CreatePerformancePanelRequest): Promise<PerformancePanel>;

  /** Update an existing performance panel */
  updatePerformancePanel(id: string, data: UpdatePerformancePanelRequest): Promise<PerformancePanel>;

  /** Delete a performance panel */
  deletePerformancePanel(id: string): Promise<void>;

  // Losses
  listPerformanceLosses(tenantId: string, filters?: LossFilters): Promise<PerformanceLoss[]>;
  getPerformanceLoss(id: string): Promise<PerformanceLoss | null>;
  createPerformanceLoss(tenantId: string, data: CreatePerformanceLossRequest): Promise<PerformanceLoss>;
  updatePerformanceLoss(id: string, data: UpdatePerformanceLossRequest): Promise<PerformanceLoss>;

  // Bottlenecks
  listPerformanceBottlenecks(tenantId: string, filters?: BottleneckFilters): Promise<PerformanceBottleneck[]>;
  getPerformanceBottleneck(id: string): Promise<PerformanceBottleneck | null>;
  createPerformanceBottleneck(tenantId: string, data: CreatePerformanceBottleneckRequest): Promise<PerformanceBottleneck>;
  updatePerformanceBottleneck(id: string, data: UpdatePerformanceBottleneckRequest): Promise<PerformanceBottleneck>;

  // Trends
  listPerformanceTrends(tenantId: string, filters?: TrendFilters): Promise<PerformanceTrend[]>;

  // Benchmarks
  listPerformanceBenchmarks(tenantId: string, filters?: BenchmarkFilters): Promise<PerformanceBenchmark[]>;

  /**
   * Export performance data
   * @param tenantId - Tenant identifier
   * @param exportRequest - Export configuration
   */
  exportPerformanceData(tenantId: string, exportRequest: PerformanceExportRequest): Promise<ExportResult>;

  // ============================================================================
  // SIM (Shift Intelligence Management) - Lean Execution
  // ============================================================================

  /** Get SIM boards for a tenant with optional filters and pagination */
  getSimBoards(
    tenantId: string,
    filters?: SIMBoardFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<SIMBoard[]>;

  /** Get a single SIM board by ID with joined data (site, shift, kpis) */
  getSimBoardById(boardId: string): Promise<SIMBoard | null>;

  /** Get KPI metrics for a specific SIM board */
  getSimKpis(boardId: string): Promise<KPIMetric[]>;

  /** List switching orders for a tenant with optional filters and pagination */
  listSwitchingOrders(
    tenantId: string,
    filters?: SwitchingOrderFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<SwitchingOrder[]>;

  /** Get a single switching order by ID with joined impacts */
  getSwitchingOrder(orderId: string): Promise<SwitchingOrder | null>;

  /** Create a new switching order with impact links */
  createSwitchingOrder(tenantId: string, payload: CreateSwitchingOrderRequest): Promise<SwitchingOrder>;

  /** Update an existing switching order */
  updateSwitchingOrder(orderId: string, patch: UpdateSwitchingOrderRequest): Promise<SwitchingOrder>;

  /** List outages for a tenant with optional filters and pagination */
  listOutages(
    tenantId: string,
    filters?: OutageFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<Outage[]>;

  /** Get a single outage by ID with joined impacts */
  getOutage(outageId: string): Promise<Outage | null>;

  /** Create a new outage with impact links */
  createOutage(tenantId: string, payload: CreateOutageRequest): Promise<Outage>;

  /** Update an existing outage */
  updateOutage(outageId: string, patch: UpdateOutageRequest): Promise<Outage>;

  /** List SIM issues for a tenant with optional filters and pagination */
  listSimIssues(
    tenantId: string,
    filters?: SimIssueFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<SimIssue[]>;

  /** Create a new SIM issue */
  createSimIssue(tenantId: string, payload: CreateSimIssueRequest): Promise<SimIssue>;

  /** Update an existing SIM issue */
  updateSimIssue(issueId: string, patch: UpdateSimIssueRequest): Promise<SimIssue>;

  /** List SIM actions for a tenant with optional filters and pagination */
  listSimActions(
    tenantId: string,
    filters?: SimActionFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<SimAction[]>;

  /** Create a new SIM action with links to issues, orders, outages, assets, nodes, or lines */
  createSimAction(tenantId: string, payload: CreateSimActionRequest): Promise<SimAction>;

  /** Update an existing SIM action */
  updateSimAction(actionId: string, patch: UpdateSimActionRequest): Promise<SimAction>;

  // ============================================================================
  // CI (Continuous Improvement) - Project Lifecycle Management
  // ============================================================================

  /**
   * Get all CI stages for a tenant
   * @param tenantId - Tenant identifier
   * @returns Array of CI stages sorted by sort_order
   */
  getCiStages(tenantId: string): Promise<CIStage[]>;

  /**
   * List CI projects for a tenant with optional filters and pagination
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (stage, site, owner, priority, status, dates)
   * @param paging - Optional pagination (limit, offset)
   * @returns Array of CI projects
   */
  listCiProjects(
    tenantId: string,
    filters?: CIProjectFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<CIProject[]>;

  /**
   * Get a single CI project by ID with all joined data
   * @param projectId - Project identifier
   * @returns CI project with stage, site, RCA, countermeasures, KPIs, documents, and links
   */
  getCiProject(projectId: string): Promise<CIProject | null>;

  /**
   * Create a new CI project with optional links
   * @param tenantId - Tenant identifier
   * @param payload - Project creation data
   * @returns Created CI project
   */
  createCiProject(tenantId: string, payload: CreateCIProjectRequest): Promise<CIProject>;

  /**
   * Update an existing CI project
   * @param projectId - Project identifier
   * @param patch - Partial update data
   * @returns Updated CI project
   */
  updateCiProject(projectId: string, patch: UpdateCIProjectRequest): Promise<CIProject>;

  /**
   * Move a CI project to a different stage
   * @param projectId - Project identifier
   * @param stageId - Target stage identifier
   * @returns Updated CI project with new stage
   */
  moveCiProjectStage(projectId: string, stageId: string): Promise<CIProject>;

  /**
   * Get RCA records for a CI project
   * @param projectId - Project identifier
   * @returns Array of RCA records (5-whys, fishbone, fault-tree)
   */
  getCiProjectRca(projectId: string): Promise<RootCauseAnalysis[]>;

  /**
   * Upsert (insert or update) RCA data for a project
   * @param payload - RCA data with project ID, type, and content
   * @returns Upserted RCA record
   */
  upsertCiProjectRca(payload: UpsertRCARequest): Promise<RootCauseAnalysis>;

  /**
   * List countermeasures for a tenant with optional filters
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (project, owner, status, dates)
   * @param paging - Optional pagination (limit, offset)
   * @returns Array of countermeasures
   */
  listCiCountermeasures(
    tenantId: string,
    filters?: CountermeasureFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<Countermeasure[]>;

  /**
   * Create a new countermeasure
   * @param tenantId - Tenant identifier
   * @param payload - Countermeasure creation data
   * @returns Created countermeasure
   */
  createCiCountermeasure(tenantId: string, payload: CreateCountermeasureRequest): Promise<Countermeasure>;

  /**
   * Update an existing countermeasure
   * @param countermeasureId - Countermeasure identifier
   * @param patch - Partial update data
   * @returns Updated countermeasure
   */
  updateCiCountermeasure(countermeasureId: string, patch: UpdateCountermeasureRequest): Promise<Countermeasure>;

  /**
   * List KPIs linked to a CI project with impact data
   * @param projectId - Project identifier
   * @returns Array of KPIs with associated impact measurements
   */
  listCiProjectKpis(projectId: string): Promise<Array<CIKPI & { impact?: CIImpact }>>;

  /**
   * Upsert (insert or update) impact measurement for a project-KPI pair
   * @param payload - Impact data with project ID, KPI ID, and measurements
   * @returns Upserted impact record
   */
  upsertCiImpact(payload: UpsertImpactRequest): Promise<CIImpact>;

  /**
   * List documents for a CI project
   * @param projectId - Project identifier
   * @returns Array of document metadata
   */
  listCiDocuments(projectId: string): Promise<CIDocument[]>;

  /**
   * Create a new document metadata record
   * @param payload - Document metadata
   * @returns Created document record
   */
  createCiDocument(payload: CreateCIDocumentRequest): Promise<CIDocument>;

  /**
   * List CI reports for a tenant with optional filters
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (status, type, dates)
   * @param paging - Optional pagination (limit, offset)
   * @returns Array of CI reports
   */
  listCiReports(
    tenantId: string,
    filters?: import('@/types/optimise').CIReportFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<import('@/types/optimise').CIReport[]>;

  /**
   * Get a single CI report by ID
   * @param reportId - Report identifier
   * @returns CI report or null if not found
   */
  getCiReport(reportId: string): Promise<import('@/types/optimise').CIReport | null>;

  // ============================================================================
  // Shift Performance (SIM Extension)
  // ============================================================================

  /**
   * List shift performance metrics for a tenant with optional filters
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (status, dates)
   * @param paging - Optional pagination (limit, offset)
   * @returns Array of shift performance metrics with joined shift data
   */
  listShiftPerformance(
    tenantId: string,
    filters?: import('@/types/optimise').ShiftPerformanceFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<import('@/types/optimise').ShiftPerformanceMetrics[]>;

  /**
   * Get shift performance metrics for a specific shift
   * @param shiftId - Shift identifier
   * @returns Shift performance metrics or null if not found
   */
  getShiftPerformance(shiftId: string): Promise<import('@/types/optimise').ShiftPerformanceMetrics | null>;


  // ============================================================================
  // Optimisation (AI-powered) Methods
  // ============================================================================

  /**
   * List optimization opportunities for a tenant with filtering and pagination
   * Results are sorted by rank_score descending by default
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (category, status, priority, scores, etc.)
   * @param paging - Optional pagination parameters
   * @returns Array of opportunities with optional joined data
   */
  listOpportunities(
    tenantId: string,
    filters?: OpportunityFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationOpportunity[]>;

  /**
   * Get a single optimization opportunity by ID
   * Includes joined data: site, asset, recommendations, playbooks, simulations
   * @param opportunityId - Opportunity identifier
   * @returns Opportunity with related data or null if not found
   */
  getOpportunity(opportunityId: string): Promise<OptimisationOpportunity | null>;

  /**
   * Update an optimization opportunity (status, priority, analysis)
   * @param opportunityId - Opportunity identifier
   * @param patch - Partial update data
   * @returns Updated opportunity
   */
  updateOpportunity(opportunityId: string, patch: UpdateOpportunityRequest): Promise<OptimisationOpportunity>;

  /**
   * List recommendations for a tenant with filtering and pagination
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (opportunity, action type, status, priority, etc.)
   * @param paging - Optional pagination parameters
   * @returns Array of recommendations with optional joined data
   */
  listRecommendations(
    tenantId: string,
    filters?: RecommendationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<AIRecommendation[]>;

  /**
   * Get a single recommendation by ID
   * @param recommendationId - Recommendation identifier
   * @returns Recommendation with related data or null if not found
   */
  getRecommendation(recommendationId: string): Promise<AIRecommendation | null>;

  /**
   * Create a new recommendation for an opportunity
   * @param tenantId - Tenant identifier
   * @param payload - Recommendation data
   * @returns Created recommendation
   */
  createRecommendation(tenantId: string, payload: CreateRecommendationRequest): Promise<AIRecommendation>;

  /**
   * Update a recommendation (status, cost/benefit, implementation details)
   * @param recommendationId - Recommendation identifier
   * @param patch - Partial update data
   * @returns Updated recommendation
   */
  updateRecommendation(recommendationId: string, patch: UpdateRecommendationRequest): Promise<AIRecommendation>;

  /**
   * List playbooks for a tenant with filtering
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (category, active status, search)
   * @returns Array of playbooks
   */
  listPlaybooks(tenantId: string, filters?: PlaybookFilters): Promise<OptimisationPlaybook[]>;

  /**
   * Get a single playbook by ID
   * @param playbookId - Playbook identifier
   * @returns Playbook or null if not found
   */
  getPlaybook(playbookId: string): Promise<OptimisationPlaybook | null>;

  /**
   * Link a playbook to an opportunity with relevance scoring
   * @param opportunityId - Opportunity identifier
   * @param playbookId - Playbook identifier
   * @param relevanceScore - Relevance score 0-100
   * @param notes - Optional notes about the link
   * @returns Success indicator
   */
  linkPlaybookToOpportunity(
    opportunityId: string,
    playbookId: string,
    relevanceScore?: number,
    notes?: string
  ): Promise<void>;

  /**
   * Create a new simulation for a recommendation or opportunity
   * @param tenantId - Tenant identifier
   * @param payload - Simulation configuration
   * @returns Created simulation
   */
  createSimulation(tenantId: string, payload: CreateSimulationRequest): Promise<OptimisationSimulation>;

  /**
   * Update a simulation (status, results, metrics)
   * @param simulationId - Simulation identifier
   * @param patch - Partial update data
   * @returns Updated simulation
   */
  updateSimulation(simulationId: string, patch: UpdateSimulationRequest): Promise<OptimisationSimulation>;

  /**
   * List simulations for a tenant with filtering
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (recommendation, opportunity, type, status)
   * @param paging - Optional pagination parameters
   * @returns Array of simulations
   */
  listSimulations(
    tenantId: string,
    filters?: SimulationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationSimulation[]>;

  /**
   * Publish an opportunity or recommendation to the SIM system
   * Creates a switching order, outage, issue, or action in SIM
   * @param tenantId - Tenant identifier
   * @param payload - Publish configuration with target type and data
   * @returns Created publish event with target ID if successful
   */
  publishToSim(tenantId: string, payload: PublishToSimRequest): Promise<PublishEvent>;

  /**
   * Publish an opportunity or recommendation to the CI system
   * Creates a CI project or countermeasure
   * @param tenantId - Tenant identifier
   * @param payload - Publish configuration with target type and data
   * @returns Created publish event with target ID if successful
   */
  publishToCi(tenantId: string, payload: PublishToCiRequest): Promise<PublishEvent>;

  /**
   * List publish events for a tenant with filtering
   * @param tenantId - Tenant identifier
   * @param filters - Optional filters (source, target, status, publisher)
   * @param paging - Optional pagination parameters
   * @returns Array of publish events
   */
  listPublishEvents(
    tenantId: string,
    filters?: PublishEventFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<PublishEvent[]>;

  // ============================================================================
  // Process Automation (Feature Set A-D)
  // ============================================================================

  /** Get automation dashboard data including KPIs and charts */
  getAutomationDashboardData(tenantId: string, params?: { from?: string; to?: string }): Promise<AutomationDashboardData>;

  /** Get automation alerts with filtering */
  getAutomationAlerts(tenantId: string, filters?: ProcessAutomationFilters): Promise<AutomationAlert[]>;

  /** Get tag mappings for a tenant */
  getTagMappings(tenantId: string, filters?: ProcessAutomationFilters): Promise<TagMapping[]>;

  /** Get control models for a tenant */
  getControlModels(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlModel[]>;

  /** Get action bindings for a tenant */
  getActionBindings(tenantId: string, filters?: ProcessAutomationFilters): Promise<ActionBinding[]>;

  /** Get triggers for a tenant */
  getTriggers(tenantId: string, filters?: ProcessAutomationFilters): Promise<Trigger[]>;

  /** Get alarm rules for a tenant */
  getAlarmRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<AlarmRule[]>;

  /** Get event patterns for a tenant */
  getEventPatterns(tenantId: string, filters?: ProcessAutomationFilters): Promise<EventPattern[]>;

  /** Get workflows for a tenant */
  getWorkflows(tenantId: string, filters?: ProcessAutomationFilters): Promise<Workflow[]>;

  /** Get sequences for a tenant */
  getSequences(tenantId: string, filters?: ProcessAutomationFilters): Promise<Sequence[]>;

  /** Get control rules for a tenant */
  getControlRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlRule[]>;

  /** Get configuration versions for a tenant */
  getVersions(tenantId: string, filters?: ProcessAutomationFilters): Promise<Version[]>;

  /** Get approval records for a tenant */
  getApprovals(tenantId: string, filters?: ProcessAutomationFilters): Promise<Approval[]>;

  /** Get simulations for a tenant */
  getSimulations(tenantId: string, filters?: ProcessAutomationFilters): Promise<Simulation[]>;

  /** Get audit logs for a tenant */
  getAuditLogs(tenantId: string, filters?: ProcessAutomationFilters): Promise<AuditLog[]>;

  /** Get a single action binding by ID */
  getActionBinding(id: string): Promise<ActionBinding | null>;

  /** Get a single workflow by ID */
  getWorkflow(id: string): Promise<Workflow | null>;

  /** Execute a workflow */
  executeWorkflow(id: string): Promise<void>;

  /** Approve an approval request */
  approveApproval(id: string, reviewedBy: string): Promise<Approval>;

  /** Reject an approval request */
  rejectApproval(id: string, reviewedBy: string, reason: string): Promise<Approval>;


  // ============================================================================
  // Transmission Catalog (Cycle 1)
  // ============================================================================


  /** Get the default Power Transmission tenant ID */
  getDefaultTransmissionTenantId(): Promise<string>;

  /** Get property sets for a tenant with pagination and filtering */
  getPropertySetsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { type?: string }
  ): Promise<ListResult<PropertySet>>;

  /** Get a single property set by ID */
  getPropertySetById(id: string): Promise<PropertySet | null>;

  /** Create a new property set */
  createPropertySet(data: Omit<PropertySet, 'id' | 'createdAt'>): Promise<PropertySet>;

  /** Get lifecycle states for a tenant by category */
  getLifecycleStatesByCategory(tenantId: string, category: string): Promise<LifecycleState[]>;

  /** Create a new lifecycle state */
  createLifecycleState(data: Omit<LifecycleState, 'id' | 'createdAt'>): Promise<LifecycleState>;

  // ============================================================================
  // Transmission Discovery (Cycle 2)
  // ============================================================================

  /** Get discovery jobs for a tenant with pagination and filtering */
  getTransmissionDiscoveryJobsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryJob>>;

  /** Create a new discovery job */
  createDiscoveryJob(
    data: Omit<import('@/types/transmission').DiscoveryJob, 'id' | 'createdAt' | 'foundCount'>
  ): Promise<import('@/types/transmission').DiscoveryJob>;

  /** Retry a failed discovery job */
  retryDiscoveryJob(jobId: string): Promise<import('@/types/transmission').DiscoveryJob>;

  /** Get discovery agents for a tenant with pagination and filtering */
  getTransmissionDiscoveryAgentsByTenant(
    tenantId: string,
    params?: PaginationParams & { status?: string; type?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryAgent>>;

  /** Create a new discovery agent */
  createDiscoveryAgent(
    data: Omit<import('@/types/transmission').DiscoveryAgent, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').DiscoveryAgent>;

  /** Get candidate assets for a discovery job with pagination and filtering */
  getTransmissionCandidateAssetsByJob(
    jobId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').CandidateAsset>>;

  /** Approve a candidate asset (creates new asset) */
  approveCandidateAsset(
    candidateId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }>;

  /** Merge a candidate asset into an existing asset */
  mergeCandidateAsset(
    candidateId: string,
    targetAssetId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }>;

  /** Reject a candidate asset */
  rejectCandidateAsset(
    candidateId: string
  ): Promise<import('@/types/transmission').CandidateAsset>;

  /** Get asset imports for a tenant with pagination */
  getAssetImportsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetImport>>;

  /** Create a new asset import */
  createAssetImport(
    data: Omit<import('@/types/transmission').AssetImport, 'id' | 'createdAt' | 'importedCount'>
  ): Promise<import('@/types/transmission').AssetImport>;

  // ============================================================================
  // Manual Asset Creation (Cycle 2)
  // ============================================================================

  /** Get asset types for a tenant */
  getAssetTypesByTenant(tenantId: string): Promise<Array<{ id: string; code: string; name: string; category: string }>>;

  /** Get sites for a tenant */
  getSitesByTenant(tenantId: string): Promise<Array<{ id: string; name: string }>>;

  /** Create a new transmission asset manually */
  createTransmissionAsset(
    data: {
      tenantId: string;
      name: string;
      assetTypeId: string;
      siteId: string;
      status?: 'online' | 'offline' | 'maintenance';
      criticality?: 'low' | 'medium' | 'high' | 'critical';
      properties?: Record<string, unknown>;
    }
  ): Promise<TransmissionAsset>;

  // ============================================================================
  // Transmission Location & Topology (Cycle 3)
  // ============================================================================

  /** Get linear asset issues for a specific grid line with pagination and filtering */
  getLinearAssetIssues(
    lineId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>>;

  /** Get linear asset issues for a tenant with pagination and filtering */
  getLinearAssetIssuesByTenant(
    tenantId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>>;

  /** Create a new linear asset issue */
  createLinearAssetIssue(
    data: Omit<import('@/types/transmission').LinearAssetIssue, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').LinearAssetIssue>;

  /** Resolve a linear asset issue */
  resolveLinearAssetIssue(issueId: string): Promise<import('@/types/transmission').LinearAssetIssue>;

  // ============================================================================
  // Transmission Connectivity (Cycle 4)
  // ============================================================================

  /** Get connection endpoints for a tenant with pagination, sorting, and filtering */
  getTransmissionConnectionEndpointsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { protocol?: string; status?: string; zone?: string }
  ): Promise<ListResult<import('@/types/transmission').ConnectionEndpoint>>;

  /** Create a new connection endpoint */
  createConnectionEndpoint(
    data: Omit<import('@/types/transmission').ConnectionEndpoint, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').ConnectionEndpoint>;

  /** Update connection endpoint status */
  updateConnectionEndpointStatus(
    id: string,
    status: 'up' | 'down' | 'unknown'
  ): Promise<import('@/types/transmission').ConnectionEndpoint>;

  /** Get stream configs for a tenant with pagination and filtering */
  getStreamConfigsByTenant(
    tenantId: string,
    params?: PaginationParams & { profile?: string }
  ): Promise<ListResult<import('@/types/transmission').StreamConfig>>;

  /** Create a new stream config */
  createStreamConfig(
    data: Omit<import('@/types/transmission').StreamConfig, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').StreamConfig>;

  // ============================================================================
  // Transmission Portfolio Management (Cycle 5)
  // ============================================================================

  /** Get saved views for a tenant with pagination */
  getSavedViewsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').SavedView>>;

  /** Get a single saved view by ID */
  getSavedViewById(id: string): Promise<import('@/types/transmission').SavedView | null>;

  /** Create a new saved view */
  createSavedView(
    data: Omit<import('@/types/transmission').SavedView, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<import('@/types/transmission').SavedView>;

  /** Delete a saved view */
  deleteSavedView(id: string): Promise<void>;

  /** Get asset portfolio KPIs for a tenant with optional filters */
  getAssetPortfolioKpis(
    tenantId: string,
    filters?: import('@/types/transmission').AssetFilter
  ): Promise<import('@/types/transmission').PortfolioKpis>;



  // ============================================================================
  // Transmission Asset Detail (Cycle 6)
  // ============================================================================

  /** Get documents for an asset */
  getAssetDocuments(assetId: string): Promise<import('@/types/transmission').AssetDocument[]>;

  /** Create/upload a new asset document */
  createAssetDocument(
    data: Omit<import('@/types/transmission').AssetDocument, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').AssetDocument>;

  /** Get audit log for an asset with pagination */
  getAssetAuditLog(
    assetId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetAuditLog>>;

  /** Get compliance records for an asset */
  getComplianceByAsset(assetId: string): Promise<import('@/types/compliance').ComplianceRecord[]>;

  /** Create a new asset audit log entry */
  createAssetAuditLog(
    data: Omit<import('@/types/transmission').AssetAuditLog, 'id' | 'performedAt'>
  ): Promise<import('@/types/transmission').AssetAuditLog>;

  // ============================================================================
  // Transmission Alerts (Cycle 7)
  // ============================================================================

  /** Update alert status */
  updateAlertStatus(alertId: string, status: AlertStatus): Promise<Alert>;

  // ============================================================================
  // Overview & Platform Health (Phase 6)
  // ============================================================================

  /** Get overview KPIs for a tenant (aggregated from views) */
  getOverviewKPIs(tenantId: string): Promise<import('@/types/overview').DashboardKPIs>;

  /** Get dashboards for a tenant */
  getDashboards(tenantId: string): Promise<import('@/types/overview').OverviewDashboard[]>;

  /** Get work items for a tenant */
  getWorkItems(tenantId: string, params?: PaginationParams): Promise<ListResult<import('@/types/overview').WorkItem>>;

  /** Get notifications for a user */
  getNotifications(tenantId: string, userId: string): Promise<import('@/types/overview').NotificationItem[]>;

  /** Get operational exceptions */
  getOverviewExceptions(tenantId: string): Promise<import('@/types/overview').OverviewException[]>;

  /** Get platform health findings */
  getPlatformHealthFindings(tenantId: string): Promise<import('@/types/overview').PlatformHealthFinding[]>;

  /** Get data stream freshness status per site */
  getDataStreamStatus(tenantId: string): Promise<import('@/types/overview').DataStreamStatus[]>;

  /** Get advisor cards */
  getAdvisorCards(tenantId: string): Promise<import('@/types/overview').AdvisorCard[]>;

  /** Update a work item status */
  updateWorkItem(id: string, data: Partial<import('@/types/overview').WorkItem>): Promise<import('@/types/overview').WorkItem>;

  /** Mark a notification as read */
  markNotificationRead(id: string): Promise<import('@/types/overview').NotificationItem>;

  // ============================================================================
  // Settings & Identity (Phase 6)
  // ============================================================================

  /** Get tenant profile */
  getTenantProfile(tenantId: string): Promise<import('@/types/settings').OrganizationProfile | null>;

  /** Update tenant profile */
  updateTenantProfile(tenantId: string, data: Partial<import('@/types/settings').OrganizationProfile>): Promise<import('@/types/settings').OrganizationProfile>;

  /** Get streams */
  getStreams(tenantId: string): Promise<import('@/types/settings').Stream[]>;

  /** Get programs */
  getPrograms(tenantId: string): Promise<import('@/types/settings').Program[]>;

  /** Get naming standards */
  getNamingStandards(tenantId: string): Promise<import('@/types/settings').NamingStandard | null>;

  /** Update naming standards */
  updateNamingStandards(tenantId: string, standards: import('@/types/settings').NamingStandard): Promise<import('@/types/settings').NamingStandard>;

  /** Get user profiles */
  getUserProfiles(tenantId: string): Promise<import('@/types/settings').UserProfile[]>;

  /** Update user profile */
  updateUserProfile(userId: string, data: Partial<import('@/types/settings').UserProfile>): Promise<import('@/types/settings').UserProfile>;

  /** Get teams */
  getTeams(tenantId: string): Promise<import('@/types/settings').Team[]>;

  /** Get integration instances */
  getIntegrations(tenantId: string): Promise<import('@/types/settings').IntegrationInstance[]>;

  /** Update integration instance */
  updateIntegration(id: string, data: Partial<import('@/types/settings').IntegrationInstance>): Promise<import('@/types/settings').IntegrationInstance>;

  /** Get module toggles */
  getModuleToggles(tenantId: string): Promise<import('@/types/settings').ModuleToggle[]>;

  /** Update module toggle state */
  updateModuleToggle(id: string, enabled: boolean): Promise<import('@/types/settings').ModuleToggle>;

  /** Get user preferences */
  getUserPreferences(userId: string, tenantId: string): Promise<import('@/types/settings').UserPreference | null>;

  /** Update user preferences */
  updateUserPreferences(userId: string, tenantId: string, data: Partial<import('@/types/settings').UserPreference>): Promise<import('@/types/settings').UserPreference>;
}

/**
 * Provider metadata for debugging and logging
 */
export interface ProviderInfo {
  name: string;
  version: string;
  isConnected: boolean;
}
