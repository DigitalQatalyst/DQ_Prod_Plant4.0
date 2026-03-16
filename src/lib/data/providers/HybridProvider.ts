/**
 * HybridProvider
 * 
 * Implements the DataProvider interface by delegating calls based on method type:
 * - Transmission-specific methods → SupabaseProvider
 * - All other methods → MockProvider
 * 
 * This enables Power Transmission pages to use Supabase while keeping
 * Upstream Oil & Gas pages on local mocks during gradual migration.
 */

import type { DataProvider, SiteSummary, ProviderInfo } from "../DataProvider";
import type { Tenant, Asset, Sector } from "@/types/navigation";
import type { Alert, Incident, AlertStatus } from "@/types/alert";

import type {
  UpstreamAsset,
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
  TelemetryPoint,
  GridAssetLink,
  PropertySet,
  LifecycleState,
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
  KPIMetric,
  SwitchingOrder,
  CreateSwitchingOrderRequest,
  UpdateSwitchingOrderRequest,
  Outage,
  CreateOutageRequest,
  UpdateOutageRequest,
  CreateSimIssueRequest,
  SimIssue,
  UpdateSimIssueRequest,
  CreateSimActionRequest,
  SimAction,
  UpdateSimActionRequest,
  CIStage,
  CIProject,
  CreateCIProjectRequest,
  UpdateCIProjectRequest,
  RootCauseAnalysis,
  UpsertRCARequest,
  CreateCountermeasureRequest,
  Countermeasure,
  UpdateCountermeasureRequest,
  CIKPI,
  CIImpact,
  UpsertImpactRequest,
  CIDocument,
  CreateCIDocumentRequest,
  OptimisationOpportunity,
  UpdateOpportunityRequest,
  AIRecommendation,
  CreateRecommendationRequest,
  UpdateRecommendationRequest,
  OptimisationPlaybook,
  CreateSimulationRequest,
  UpdateSimulationRequest,
  OptimisationSimulation,
  PublishToSimRequest,
  PublishToCiRequest,
  PublishEvent,
  CIProjectFilters,
  CountermeasureFilters,
  OpportunityFilters,
  RecommendationFilters,
  PlaybookFilters,
  SimulationFilters,
  PublishEventFilters,
  CIReport,
  ShiftPerformanceMetrics,
  CIReportFilters,
  ShiftPerformanceFilters
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
import type {
  OverviewDashboard,
  OverviewException,
  PlatformHealthCheck,
  DataStreamStatus,
  WorkItem,
  NotificationItem,
  AdvisorCard,
  DashboardKPIs
} from "@/types/overview";
import type {
  OrganizationProfile,
  Stream,
  Program,
  NamingStandard,
  UserProfile,
  Team,
  IntegrationInstance,
  ModuleToggle,
  UserPreference
} from "@/types/settings";
import { getMockProvider } from "./MockProvider";


import { getSupabaseProvider } from "./SupabaseProvider";

/**
 * HybridProvider implementation
 * 
 * Routes method calls to appropriate backend:
 * - Transmission methods (getTransmission*, getGrid*) → SupabaseProvider
 * - All other methods → MockProvider
 */
export class HybridProvider implements DataProvider {
  private readonly mockProvider: DataProvider;
  private readonly supabaseProvider: DataProvider;
  private readonly info: ProviderInfo = {
    name: "HybridProvider",
    version: "1.0.0",
    isConnected: true
  };

  constructor() {
    this.mockProvider = getMockProvider();
    this.supabaseProvider = getSupabaseProvider();
  }

  getInfo(): ProviderInfo {
    return this.info;
  }

  /**
   * Helper to check if a tenant belongs to Power Transmission sector
   */
  private async isTransmissionTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.mockProvider.getTenantById(tenantId);
    return tenant?.sector === 'power';
  }

  // ============================================================================
  // Tenant / Organization - Delegate to MockProvider
  // ============================================================================

  async getTenants(): Promise<Tenant[]> {
    return this.mockProvider.getTenants();
  }

  async getTenantsBySector(sectorId: string): Promise<Tenant[]> {
    return this.mockProvider.getTenantsBySector(sectorId);
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return this.mockProvider.getTenantById(tenantId);
  }

  // ============================================================================
  // Sectors - Delegate to MockProvider
  // ============================================================================

  async getSectors(): Promise<Sector[]> {
    return this.mockProvider.getSectors();
  }

  async getSectorById(sectorId: string): Promise<Sector | null> {
    return this.mockProvider.getSectorById(sectorId);
  }

  // ============================================================================
  // Assets - Delegate to MockProvider
  // ============================================================================

  async getAssetsByTenant(tenantId: string): Promise<Asset[]> {
    if (await this.isTransmissionTenant(tenantId)) {
      return this.supabaseProvider.getAssetsByTenant(tenantId);
    }
    return this.mockProvider.getAssetsByTenant(tenantId);
  }

  async getAssetById(assetId: string): Promise<Asset | UpstreamAsset | null> {
    // Try Supabase first for common assets as it's the new source of truth
    const asset = await this.supabaseProvider.getAssetById(assetId);
    if (asset) return asset;

    return this.mockProvider.getAssetById(assetId);
  }

  async getSiteSummaryByTenant(tenantId: string): Promise<SiteSummary[]> {
    return this.mockProvider.getSiteSummaryByTenant(tenantId);
  }

  // ============================================================================
  // Alerts & Incidents - Delegate to MockProvider
  // ============================================================================

  async getAlertsByTenant(tenantId: string): Promise<Alert[]> {
    if (await this.isTransmissionTenant(tenantId)) {
      return this.supabaseProvider.getAlertsByTenant(tenantId);
    }
    return this.mockProvider.getAlertsByTenant(tenantId);
  }

  async getAlertsBySeverity(tenantId: string, severity: string): Promise<Alert[]> {
    if (await this.isTransmissionTenant(tenantId)) {
      return this.supabaseProvider.getAlertsBySeverity(tenantId, severity);
    }
    return this.mockProvider.getAlertsBySeverity(tenantId, severity);
  }

  async getIncidentsByTenant(tenantId: string): Promise<Incident[]> {
    return this.supabaseProvider.getIncidentsByTenant(tenantId);
  }

  // ============================================================================
  // Upstream-specific (Oil & Gas) - Delegate to MockProvider
  // ============================================================================

  async getUpstreamAssetsByTenant(tenantId: string): Promise<UpstreamAsset[]> {
    return this.mockProvider.getUpstreamAssetsByTenant(tenantId);
  }

  async getDiscoveryJobsByTenant(tenantId: string): Promise<UpstreamDiscoveryJob[]> {
    return this.mockProvider.getDiscoveryJobsByTenant(tenantId);
  }

  async getDiscoveryAgentsByTenant(tenantId: string): Promise<DiscoveryAgent[]> {
    return this.supabaseProvider.getDiscoveryAgentsByTenant(tenantId);
  }

  async getConnectionEndpointsByTenant(tenantId: string): Promise<ConnectionEndpoint[]> {
    return this.mockProvider.getConnectionEndpointsByTenant(tenantId);
  }

  async getCandidateAssetsByJob(jobId: string): Promise<CandidateAsset[]> {
    return this.mockProvider.getCandidateAssetsByJob(jobId);
  }

  // ============================================================================
  // Transmission-specific (Power Transmission) - Delegate to SupabaseProvider
  // ============================================================================

  async getTransmissionTenants(): Promise<TransmissionTenant[]> {
    return this.supabaseProvider.getTransmissionTenants();
  }

  async getGridNodesByTenant(tenantId: string): Promise<GridNode[]> {
    return this.supabaseProvider.getGridNodesByTenant(tenantId);
  }

  async getGridLinesByTenant(tenantId: string): Promise<GridLine[]> {
    return this.supabaseProvider.getGridLinesByTenant(tenantId);
  }

  async getTransmissionAssetsByTenant(tenantId: string): Promise<TransmissionAsset[]> {
    return this.supabaseProvider.getTransmissionAssetsByTenant(tenantId);
  }

  async getTransmissionAssetById(assetId: string): Promise<TransmissionAsset | null> {
    return this.supabaseProvider.getTransmissionAssetById(assetId);
  }


  async getTransmissionOverviewKpis(tenantId: string): Promise<TransmissionKpis> {
    return this.supabaseProvider.getTransmissionOverviewKpis(tenantId);
  }

  async getAlertsByAsset(assetId: string): Promise<Alert[]> {
    return this.supabaseProvider.getAlertsByAsset(assetId);
  }

  async getTelemetryPointsByAsset(assetId: string): Promise<TelemetryPoint[]> {
    return this.supabaseProvider.getTelemetryPointsByAsset(assetId);
  }

  async getChildAssets(parentAssetId: string): Promise<TransmissionAsset[]> {
    return this.supabaseProvider.getChildAssets(parentAssetId);
  }

  async getAssetTopologyLinks(assetId: string): Promise<GridAssetLink[]> {
    return this.supabaseProvider.getAssetTopologyLinks(assetId);
  }

  async updateTransmissionAsset(assetId: string, data: any): Promise<TransmissionAsset> {
    return this.supabaseProvider.updateTransmissionAsset(assetId, data);
  }

  async getComplianceByAsset(assetId: string): Promise<import('@/types/transmission').ComplianceRecord[]> {
    return this.supabaseProvider.getComplianceByAsset(assetId);
  }


  // ============================================================================
  // Transmission Catalog (Cycle 1) - Delegate to SupabaseProvider
  // ============================================================================

  async getDefaultTransmissionTenantId(): Promise<string> {
    return this.supabaseProvider.getDefaultTransmissionTenantId();
  }

  async getPropertySetsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { type?: string }
  ): Promise<ListResult<PropertySet>> {
    return this.supabaseProvider.getPropertySetsByTenant(tenantId, params);
  }

  async getPropertySetById(id: string): Promise<PropertySet | null> {
    return this.supabaseProvider.getPropertySetById(id);
  }

  async createPropertySet(data: Omit<PropertySet, 'id' | 'createdAt'>): Promise<PropertySet> {
    return this.supabaseProvider.createPropertySet(data);
  }

  async getLifecycleStatesByCategory(tenantId: string, category: string): Promise<LifecycleState[]> {
    return this.supabaseProvider.getLifecycleStatesByCategory(tenantId, category);
  }

  async createLifecycleState(data: Omit<LifecycleState, 'id' | 'createdAt'>): Promise<LifecycleState> {
    return this.supabaseProvider.createLifecycleState(data);
  }

  // ============================================================================
  // Transmission Discovery (Cycle 2) - Delegate to SupabaseProvider
  // ============================================================================

  async getTransmissionDiscoveryJobsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryJob>> {
    return this.supabaseProvider.getTransmissionDiscoveryJobsByTenant(tenantId, params);
  }

  async createDiscoveryJob(
    data: Omit<import('@/types/transmission').DiscoveryJob, 'id' | 'createdAt' | 'foundCount'>
  ): Promise<import('@/types/transmission').DiscoveryJob> {
    return this.supabaseProvider.createDiscoveryJob(data);
  }

  async retryDiscoveryJob(jobId: string): Promise<import('@/types/transmission').DiscoveryJob> {
    return this.supabaseProvider.retryDiscoveryJob(jobId);
  }

  async getTransmissionDiscoveryAgentsByTenant(
    tenantId: string,
    params?: PaginationParams & { status?: string; type?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryAgent>> {
    return this.supabaseProvider.getTransmissionDiscoveryAgentsByTenant(tenantId, params);
  }

  async createDiscoveryAgent(
    data: Omit<import('@/types/transmission').DiscoveryAgent, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').DiscoveryAgent> {
    return this.supabaseProvider.createDiscoveryAgent(data);
  }

  async getTransmissionCandidateAssetsByJob(
    jobId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').CandidateAsset>> {
    return this.supabaseProvider.getTransmissionCandidateAssetsByJob(jobId, params);
  }

  async approveCandidateAsset(
    candidateId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    return this.supabaseProvider.approveCandidateAsset(candidateId);
  }

  async mergeCandidateAsset(
    candidateId: string,
    targetAssetId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    return this.supabaseProvider.mergeCandidateAsset(candidateId, targetAssetId);
  }

  async rejectCandidateAsset(
    candidateId: string
  ): Promise<import('@/types/transmission').CandidateAsset> {
    return this.supabaseProvider.rejectCandidateAsset(candidateId);
  }

  async getAssetImportsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetImport>> {
    return this.supabaseProvider.getAssetImportsByTenant(tenantId, params);
  }

  async createAssetImport(
    data: Omit<import('@/types/transmission').AssetImport, 'id' | 'createdAt' | 'importedCount'>
  ): Promise<import('@/types/transmission').AssetImport> {
    return this.supabaseProvider.createAssetImport(data);
  }

  // ============================================================================
  // Manual Asset Creation (Cycle 2) - Route to Supabase
  // ============================================================================

  async getAssetTypesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; code: string; name: string; category: string }>> {
    return this.supabaseProvider.getAssetTypesByTenant(tenantId);
  }

  async getSitesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; name: string }>> {
    return this.supabaseProvider.getSitesByTenant(tenantId);
  }

  async createTransmissionAsset(
    data: {
      tenantId: string;
      name: string;
      assetTypeId: string;
      siteId: string;
      status?: 'online' | 'offline' | 'maintenance';
      criticality?: 'low' | 'medium' | 'high' | 'critical';
      properties?: Record<string, unknown>;
    }
  ): Promise<import('@/types/transmission').TransmissionAsset> {
    return this.supabaseProvider.createTransmissionAsset(data);
  }

  // ============================================================================
  // Cycle 3: Location & Topology Methods
  // ============================================================================

  async getLinearAssetIssues(
    lineId: string,
    params?: import('@/types/transmission').PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<import('@/types/transmission').ListResult<import('@/types/transmission').LinearAssetIssue>> {
    return this.supabaseProvider.getLinearAssetIssues(lineId, params);
  }

  async getLinearAssetIssuesByTenant(
    tenantId: string,
    params?: import('@/types/transmission').PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<import('@/types/transmission').ListResult<import('@/types/transmission').LinearAssetIssue>> {
    return this.supabaseProvider.getLinearAssetIssuesByTenant(tenantId, params);
  }

  async createLinearAssetIssue(
    data: Omit<import('@/types/transmission').LinearAssetIssue, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    return this.supabaseProvider.createLinearAssetIssue(data);
  }

  async resolveLinearAssetIssue(
    issueId: string
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    return this.supabaseProvider.resolveLinearAssetIssue(issueId);
  }

  // ============================================================================
  // Transmission Connectivity (Cycle 4)
  // ============================================================================

  async getTransmissionConnectionEndpointsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { protocol?: string; status?: string; zone?: string }
  ): Promise<ListResult<import('@/types/transmission').ConnectionEndpoint>> {
    return this.supabaseProvider.getTransmissionConnectionEndpointsByTenant(tenantId, params);
  }

  async createConnectionEndpoint(
    data: Omit<import('@/types/transmission').ConnectionEndpoint, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    return this.supabaseProvider.createConnectionEndpoint(data);
  }

  async updateConnectionEndpointStatus(
    id: string,
    status: 'up' | 'down' | 'unknown'
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    return this.supabaseProvider.updateConnectionEndpointStatus(id, status);
  }

  async getStreamConfigsByTenant(
    tenantId: string,
    params?: PaginationParams & { profile?: string }
  ): Promise<ListResult<import('@/types/transmission').StreamConfig>> {
    return this.supabaseProvider.getStreamConfigsByTenant(tenantId, params);
  }

  async createStreamConfig(
    data: Omit<import('@/types/transmission').StreamConfig, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').StreamConfig> {
    return this.supabaseProvider.createStreamConfig(data);
  }

  // ============================================================================
  // Transmission Portfolio Management (Cycle 5)
  // ============================================================================

  async getSavedViewsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').SavedView>> {
    return this.supabaseProvider.getSavedViewsByTenant(tenantId, params);
  }

  async getSavedViewById(id: string): Promise<import('@/types/transmission').SavedView | null> {
    return this.supabaseProvider.getSavedViewById(id);
  }

  async createSavedView(
    data: Omit<import('@/types/transmission').SavedView, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<import('@/types/transmission').SavedView> {
    return this.supabaseProvider.createSavedView(data);
  }

  async deleteSavedView(id: string): Promise<void> {
    return this.supabaseProvider.deleteSavedView(id);
  }

  async getAssetPortfolioKpis(
    tenantId: string,
    filters?: import('@/types/transmission').AssetFilter
  ): Promise<import('@/types/transmission').PortfolioKpis> {
    return this.supabaseProvider.getAssetPortfolioKpis(tenantId, filters);
  }



  // ============================================================================
  // Transmission Asset Detail (Cycle 6) - Delegate to SupabaseProvider
  // ============================================================================

  async getAssetDocuments(assetId: string): Promise<import('@/types/transmission').AssetDocument[]> {
    return this.supabaseProvider.getAssetDocuments(assetId);
  }

  async createAssetDocument(
    data: Omit<import('@/types/transmission').AssetDocument, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').AssetDocument> {
    return this.supabaseProvider.createAssetDocument(data);
  }

  async getAssetAuditLog(
    assetId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetAuditLog>> {
    return this.supabaseProvider.getAssetAuditLog(assetId, params);
  }

  async createAssetAuditLog(
    data: Omit<import('@/types/transmission').AssetAuditLog, 'id' | 'performedAt'>
  ): Promise<import('@/types/transmission').AssetAuditLog> {
    return this.supabaseProvider.createAssetAuditLog(data);
  }

  // ============================================================================
  // Transmission Alerts (Cycle 7)
  // ============================================================================

  async updateAlertStatus(alertId: string, status: import('@/types/alert').AlertStatus): Promise<Alert> {
    // If we're updating an alert, we can delegate to Supabase if it's a transmission-style ID
    // or if we're in a transmission tenant context.
    // For now, mirroring the grouping - if it's an asset alert, it goes to Supabase.
    // However, updateAlertStatus is generic. We'll try Supabase first for alerts
    // as that's where the new alerts are being stored.
    try {
      return await this.supabaseProvider.updateAlertStatus(alertId, status);
    } catch (error) {
      // Fallback to mock provider if not found in Supabase
      return this.mockProvider.updateAlertStatus(alertId, status);
    }
  }

  // ============================================================================
  // Overview & Platform Health (Phase 6) - Delegate to Supabase
  // ============================================================================

  async getOverviewKPIs(tenantId: string): Promise<DashboardKPIs> {
    return this.supabaseProvider.getOverviewKPIs(tenantId);
  }

  async getOverviewDashboard(tenantId: string): Promise<OverviewDashboard | null> {
    return this.supabaseProvider.getOverviewDashboard(tenantId);
  }

  async listOverviewExceptions(tenantId: string): Promise<OverviewException[]> {
    return this.supabaseProvider.listOverviewExceptions(tenantId);
  }

  async listDataStreamStatuses(tenantId: string): Promise<DataStreamStatus[]> {
    return this.supabaseProvider.listDataStreamStatuses(tenantId);
  }

  async listPlatformHealthChecks(tenantId: string): Promise<PlatformHealthCheck[]> {
    return this.supabaseProvider.listPlatformHealthChecks(tenantId);
  }

  async listWorkItems(tenantId: string): Promise<WorkItem[]> {
    return this.supabaseProvider.listWorkItems(tenantId);
  }

  async listNotifications(userId: string): Promise<NotificationItem[]> {
    return this.supabaseProvider.listNotifications(userId);
  }

  async listAdvisorCards(tenantId: string): Promise<AdvisorCard[]> {
    return this.supabaseProvider.listAdvisorCards(tenantId);
  }

  async getOverviewKpis(tenantId: string): Promise<DashboardKPIs> {
    return this.supabaseProvider.getOverviewKpis(tenantId);
  }

  async markNotificationRead(id: string): Promise<NotificationItem> {
    return this.supabaseProvider.markNotificationRead(id);
  }

  // ============================================================================
  // Settings & Identity (Phase 6) - Delegate to Supabase
  // ============================================================================

  async getTenantProfile(tenantId: string): Promise<OrganizationProfile | null> {
    return this.supabaseProvider.getTenantProfile(tenantId);
  }

  async updateTenantProfile(tenantId: string, data: Partial<OrganizationProfile>): Promise<OrganizationProfile> {
    return this.supabaseProvider.updateTenantProfile(tenantId, data);
  }

  async getStreams(tenantId: string): Promise<Stream[]> {
    return this.supabaseProvider.getStreams(tenantId);
  }

  async getPrograms(tenantId: string): Promise<Program[]> {
    return this.supabaseProvider.getPrograms(tenantId);
  }

  async getNamingStandards(tenantId: string): Promise<NamingStandard | null> {
    return this.supabaseProvider.getNamingStandards(tenantId);
  }

  async updateNamingStandards(tenantId: string, standards: NamingStandard): Promise<NamingStandard> {
    return this.supabaseProvider.updateNamingStandards(tenantId, standards);
  }

  async getUserProfiles(tenantId: string): Promise<UserProfile[]> {
    return this.supabaseProvider.getUserProfiles(tenantId);
  }

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    return this.supabaseProvider.updateUserProfile(userId, data);
  }

  async getTeams(tenantId: string): Promise<Team[]> {
    return this.supabaseProvider.getTeams(tenantId);
  }

  async getIntegrations(tenantId: string): Promise<IntegrationInstance[]> {
    return this.supabaseProvider.getIntegrations(tenantId);
  }

  async updateIntegration(id: string, data: Partial<IntegrationInstance>): Promise<IntegrationInstance> {
    return this.supabaseProvider.updateIntegration(id, data);
  }

  async getModuleToggles(tenantId: string): Promise<ModuleToggle[]> {
    return this.supabaseProvider.getModuleToggles(tenantId);
  }

  async updateModuleToggle(id: string, enabled: boolean): Promise<ModuleToggle> {
    return this.supabaseProvider.updateModuleToggle(id, enabled);
  }

  async getUserPreferences(userId: string, tenantId: string): Promise<UserPreference | null> {
    return this.supabaseProvider.getUserPreferences(userId, tenantId);
  }

  async updateUserPreferences(userId: string, tenantId: string, data: Partial<UserPreference>): Promise<UserPreference> {
    return this.supabaseProvider.updateUserPreferences(userId, tenantId, data);
  }

  async listPerformancePanels(tenantId: string, filters?: PerformanceFilters): Promise<PerformancePanel[]> {
    return this.supabaseProvider.listPerformancePanels(tenantId, filters);
  }

  async getPerformancePanel(id: string): Promise<PerformancePanel | null> {
    return this.supabaseProvider.getPerformancePanel(id);
  }

  async createPerformancePanel(tenantId: string, data: CreatePerformancePanelRequest): Promise<PerformancePanel> {
    return this.supabaseProvider.createPerformancePanel(tenantId, data);
  }

  async updatePerformancePanel(id: string, data: UpdatePerformancePanelRequest): Promise<PerformancePanel> {
    return this.supabaseProvider.updatePerformancePanel(id, data);
  }

  async deletePerformancePanel(id: string): Promise<void> {
    return this.supabaseProvider.deletePerformancePanel(id);
  }

  async listPerformanceLosses(tenantId: string, filters?: LossFilters): Promise<PerformanceLoss[]> {
    return this.supabaseProvider.listPerformanceLosses(tenantId, filters);
  }

  async getPerformanceLoss(id: string): Promise<PerformanceLoss | null> {
    return this.supabaseProvider.getPerformanceLoss(id);
  }

  async createPerformanceLoss(tenantId: string, data: CreatePerformanceLossRequest): Promise<PerformanceLoss> {
    return this.supabaseProvider.createPerformanceLoss(tenantId, data);
  }

  async updatePerformanceLoss(id: string, data: UpdatePerformanceLossRequest): Promise<PerformanceLoss> {
    return this.supabaseProvider.updatePerformanceLoss(id, data);
  }

  async listPerformanceBottlenecks(tenantId: string, filters?: BottleneckFilters): Promise<PerformanceBottleneck[]> {
    return this.supabaseProvider.listPerformanceBottlenecks(tenantId, filters);
  }

  async getPerformanceBottleneck(id: string): Promise<PerformanceBottleneck | null> {
    return this.supabaseProvider.getPerformanceBottleneck(id);
  }

  async createPerformanceBottleneck(tenantId: string, data: CreatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    return this.supabaseProvider.createPerformanceBottleneck(tenantId, data);
  }

  async updatePerformanceBottleneck(id: string, data: UpdatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    return this.supabaseProvider.updatePerformanceBottleneck(id, data);
  }

  async listPerformanceTrends(tenantId: string, filters?: TrendFilters): Promise<PerformanceTrend[]> {
    return this.supabaseProvider.listPerformanceTrends(tenantId, filters);
  }

  async listPerformanceBenchmarks(tenantId: string, filters?: BenchmarkFilters): Promise<PerformanceBenchmark[]> {
    return this.supabaseProvider.listPerformanceBenchmarks(tenantId, filters);
  }

  async exportPerformanceData(tenantId: string, exportRequest: PerformanceExportRequest): Promise<ExportResult> {
    return this.mockProvider.exportPerformanceData(tenantId, exportRequest);
  }

  async getSimBoardById(boardId: string): Promise<SIMBoard | null> {
    return this.supabaseProvider.getSimBoardById(boardId);
  }

  async getSimKpis(boardId: string): Promise<KPIMetric[]> {
    return this.supabaseProvider.getSimKpis(boardId);
  }

  async getSwitchingOrder(orderId: string): Promise<SwitchingOrder | null> {
    return this.supabaseProvider.getSwitchingOrder(orderId);
  }

  async createSwitchingOrder(tenantId: string, payload: CreateSwitchingOrderRequest): Promise<SwitchingOrder> {
    return this.supabaseProvider.createSwitchingOrder(tenantId, payload);
  }

  async updateSwitchingOrder(orderId: string, patch: UpdateSwitchingOrderRequest): Promise<SwitchingOrder> {
    return this.supabaseProvider.updateSwitchingOrder(orderId, patch);
  }

  async getOutage(outageId: string): Promise<Outage | null> {
    return this.supabaseProvider.getOutage(outageId);
  }

  async createOutage(tenantId: string, payload: CreateOutageRequest): Promise<Outage> {
    return this.supabaseProvider.createOutage(tenantId, payload);
  }

  async updateOutage(outageId: string, patch: UpdateOutageRequest): Promise<Outage> {
    return this.supabaseProvider.updateOutage(outageId, patch);
  }

  async createSimIssue(tenantId: string, payload: CreateSimIssueRequest): Promise<SimIssue> {
    return this.supabaseProvider.createSimIssue(tenantId, payload);
  }

  async updateSimIssue(issueId: string, patch: UpdateSimIssueRequest): Promise<SimIssue> {
    return this.supabaseProvider.updateSimIssue(issueId, patch);
  }

  async createSimAction(tenantId: string, payload: CreateSimActionRequest): Promise<SimAction> {
    return this.supabaseProvider.createSimAction(tenantId, payload);
  }

  async updateSimAction(actionId: string, patch: UpdateSimActionRequest): Promise<SimAction> {
    return this.supabaseProvider.updateSimAction(actionId, patch);
  }

  async getCiStages(tenantId: string): Promise<CIStage[]> {
    return this.supabaseProvider.getCiStages(tenantId);
  }

  async getCiProject(projectId: string): Promise<CIProject | null> {
    return this.supabaseProvider.getCiProject(projectId);
  }

  async createCiProject(tenantId: string, payload: CreateCIProjectRequest): Promise<CIProject> {
    return this.supabaseProvider.createCiProject(tenantId, payload);
  }

  async updateCiProject(projectId: string, patch: UpdateCIProjectRequest): Promise<CIProject> {
    return this.supabaseProvider.updateCiProject(projectId, patch);
  }

  async moveCiProjectStage(projectId: string, stageId: string): Promise<CIProject> {
    return this.supabaseProvider.moveCiProjectStage(projectId, stageId);
  }

  async getCiProjectRca(projectId: string): Promise<RootCauseAnalysis[]> {
    return this.supabaseProvider.getCiProjectRca(projectId);
  }

  async upsertCiProjectRca(payload: UpsertRCARequest): Promise<RootCauseAnalysis> {
    return this.supabaseProvider.upsertCiProjectRca(payload);
  }

  async createCiCountermeasure(tenantId: string, payload: CreateCountermeasureRequest): Promise<Countermeasure> {
    return this.supabaseProvider.createCiCountermeasure(tenantId, payload);
  }

  async updateCiCountermeasure(countermeasureId: string, patch: UpdateCountermeasureRequest): Promise<Countermeasure> {
    return this.supabaseProvider.updateCiCountermeasure(countermeasureId, patch);
  }

  async listCiProjectKpis(projectId: string): Promise<Array<CIKPI & { impact?: CIImpact }>> {
    return this.supabaseProvider.listCiProjectKpis(projectId);
  }

  async upsertCiImpact(payload: UpsertImpactRequest): Promise<CIImpact> {
    return this.supabaseProvider.upsertCiImpact(payload);
  }

  async listCiDocuments(projectId: string): Promise<CIDocument[]> {
    return this.supabaseProvider.listCiDocuments(projectId);
  }

  async createCiDocument(payload: CreateCIDocumentRequest): Promise<CIDocument> {
    return this.supabaseProvider.createCiDocument(payload);
  }

  async getCiReport(reportId: string): Promise<CIReport | null> {
    return this.supabaseProvider.getCiReport(reportId);
  }

  async getShiftPerformance(shiftId: string): Promise<ShiftPerformanceMetrics | null> {
    return this.supabaseProvider.getShiftPerformance(shiftId);
  }


  async getOpportunity(opportunityId: string): Promise<OptimisationOpportunity | null> {
    return this.mockProvider.getOpportunity(opportunityId);
  }

  async updateOpportunity(opportunityId: string, patch: UpdateOpportunityRequest): Promise<OptimisationOpportunity> {
    return this.mockProvider.updateOpportunity(opportunityId, patch);
  }

  async getRecommendation(recommendationId: string): Promise<AIRecommendation | null> {
    return this.mockProvider.getRecommendation(recommendationId);
  }

  async createRecommendation(tenantId: string, payload: CreateRecommendationRequest): Promise<AIRecommendation> {
    return this.mockProvider.createRecommendation(tenantId, payload);
  }

  async updateRecommendation(recommendationId: string, patch: UpdateRecommendationRequest): Promise<AIRecommendation> {
    return this.mockProvider.updateRecommendation(recommendationId, patch);
  }

  async listPlaybooks(tenantId: string, filters?: PlaybookFilters): Promise<OptimisationPlaybook[]> {
    return this.mockProvider.listPlaybooks(tenantId, filters);
  }

  async getPlaybook(playbookId: string): Promise<OptimisationPlaybook | null> {
    return this.mockProvider.getPlaybook(playbookId);
  }

  async createSimulation(tenantId: string, payload: CreateSimulationRequest): Promise<OptimisationSimulation> {
    return this.mockProvider.createSimulation(tenantId, payload);
  }

  async updateSimulation(simulationId: string, patch: UpdateSimulationRequest): Promise<OptimisationSimulation> {
    return this.mockProvider.updateSimulation(simulationId, patch);
  }

  async publishToSim(tenantId: string, payload: PublishToSimRequest): Promise<PublishEvent> {
    return this.mockProvider.publishToSim(tenantId, payload);
  }

  async publishToCi(tenantId: string, payload: PublishToCiRequest): Promise<PublishEvent> {
    return this.mockProvider.publishToCi(tenantId, payload);
  }

  // ============================================================================
  // SIM - Multi-line signature methods delegated to MockProvider
  // ============================================================================

  async getSimBoards(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.getSimBoards(tenantId, filters, paging);
  }

  async listSwitchingOrders(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listSwitchingOrders(tenantId, filters, paging);
  }

  async listOutages(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listOutages(tenantId, filters, paging);
  }

  async listSimIssues(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listSimIssues(tenantId, filters, paging);
  }

  async listSimActions(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listSimActions(tenantId, filters, paging);
  }

  // ============================================================================
  // CI - Multi-line signature methods routed to SupabaseProvider
  // ============================================================================

  async listCiProjects(
    tenantId: string,
    filters?: CIProjectFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listCiProjects(tenantId, filters, paging);
  }

  async listCiCountermeasures(
    tenantId: string,
    filters?: CountermeasureFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return this.supabaseProvider.listCiCountermeasures(tenantId, filters, paging);
  }

  async listCiReports(
    tenantId: string,
    filters?: CIReportFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<CIReport[]> {
    return this.supabaseProvider.listCiReports(tenantId, filters, paging);
  }

  // ============================================================================
  // Shift Performance - routed to SupabaseProvider
  // ============================================================================

  async listShiftPerformance(
    tenantId: string,
    filters?: ShiftPerformanceFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<ShiftPerformanceMetrics[]> {
    return this.supabaseProvider.listShiftPerformance(tenantId, filters, paging);
  }


  // ============================================================================
  // Optimisation (AI) - routed to SupabaseProvider
  // ============================================================================

  async listOpportunities(
    tenantId: string,
    filters?: OpportunityFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationOpportunity[]> {
    return this.supabaseProvider.listOpportunities(tenantId, filters, paging);
  }

  async listRecommendations(
    tenantId: string,
    filters?: RecommendationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<AIRecommendation[]> {
    return this.supabaseProvider.listRecommendations(tenantId, filters, paging);
  }

  async linkPlaybookToOpportunity(
    opportunityId: string,
    playbookId: string,
    relevanceScore?: number,
    notes?: string
  ): Promise<void> {
    return this.mockProvider.linkPlaybookToOpportunity(opportunityId, playbookId, relevanceScore, notes);
  }

  async listSimulations(
    tenantId: string,
    filters?: SimulationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationSimulation[]> {
    return this.supabaseProvider.listSimulations(tenantId, filters, paging);
  }

  async listPublishEvents(
    tenantId: string,
    filters?: PublishEventFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<PublishEvent[]> {
    return this.supabaseProvider.listPublishEvents(tenantId, filters, paging);
  }


  // ============================================================================
  // Process Automation (Feature Set A-D)
  // ============================================================================

  async getAutomationDashboardData(tenantId: string, params?: { from?: string; to?: string }): Promise<AutomationDashboardData> {
    return this.supabaseProvider.getAutomationDashboardData(tenantId, params);
  }

  async getAutomationAlerts(tenantId: string, filters?: ProcessAutomationFilters): Promise<AutomationAlert[]> {
    return this.supabaseProvider.getAutomationAlerts(tenantId, filters);
  }

  async getTagMappings(tenantId: string, filters?: ProcessAutomationFilters): Promise<TagMapping[]> {
    return this.supabaseProvider.getTagMappings(tenantId, filters);
  }

  async getControlModels(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlModel[]> {
    return this.supabaseProvider.getControlModels(tenantId, filters);
  }

  async getActionBindings(tenantId: string, filters?: ProcessAutomationFilters): Promise<ActionBinding[]> {
    return this.supabaseProvider.getActionBindings(tenantId, filters);
  }

  async getTriggers(tenantId: string, filters?: ProcessAutomationFilters): Promise<Trigger[]> {
    return this.supabaseProvider.getTriggers(tenantId, filters);
  }

  async getAlarmRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<AlarmRule[]> {
    return this.supabaseProvider.getAlarmRules(tenantId, filters);
  }

  async getEventPatterns(tenantId: string, filters?: ProcessAutomationFilters): Promise<EventPattern[]> {
    return this.supabaseProvider.getEventPatterns(tenantId, filters);
  }

  async getWorkflows(tenantId: string, filters?: ProcessAutomationFilters): Promise<Workflow[]> {
    return this.supabaseProvider.getWorkflows(tenantId, filters);
  }

  async getSequences(tenantId: string, filters?: ProcessAutomationFilters): Promise<Sequence[]> {
    return this.supabaseProvider.getSequences(tenantId, filters);
  }

  async getControlRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlRule[]> {
    return this.supabaseProvider.getControlRules(tenantId, filters);
  }

  async getVersions(tenantId: string, filters?: ProcessAutomationFilters): Promise<Version[]> {
    return this.supabaseProvider.getVersions(tenantId, filters);
  }

  async getApprovals(tenantId: string, filters?: ProcessAutomationFilters): Promise<Approval[]> {
    return this.supabaseProvider.getApprovals(tenantId, filters);
  }

  async getSimulations(tenantId: string, filters?: ProcessAutomationFilters): Promise<Simulation[]> {
    return this.supabaseProvider.getSimulations(tenantId, filters);
  }

  async getAuditLogs(tenantId: string, filters?: ProcessAutomationFilters): Promise<AuditLog[]> {
    return this.supabaseProvider.getAuditLogs(tenantId, filters);
  }

  async getActionBinding(id: string): Promise<ActionBinding | null> {
    return this.supabaseProvider.getActionBinding(id);
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return this.supabaseProvider.getWorkflow(id);
  }

  async executeWorkflow(id: string): Promise<void> {
    return this.supabaseProvider.executeWorkflow(id);
  }

  async approveApproval(id: string, reviewedBy: string): Promise<Approval> {
    return this.supabaseProvider.approveApproval(id, reviewedBy);
  }

  async rejectApproval(id: string, reviewedBy: string, reason: string): Promise<Approval> {
    return this.supabaseProvider.rejectApproval(id, reviewedBy, reason);
  }


}


// Singleton instance
let hybridProviderInstance: HybridProvider | null = null;

export function getHybridProvider(): HybridProvider {
  if (!hybridProviderInstance) {
    hybridProviderInstance = new HybridProvider();
  }
  return hybridProviderInstance;
}
