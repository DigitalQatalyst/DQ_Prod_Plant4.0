/**
 * MockProvider
 * 
 * Wraps existing mock data files to implement the DataProvider interface.
 * This allows gradual migration to Supabase without breaking existing functionality.
 * 
 * IMPORTANT: This is the ONLY place that should import from src/data/* directly.
 * All other code should go through the provider layer.
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
  CIProjectFilters,
  CountermeasureFilters,
  CreateCIDocumentRequest,
  CIDocument,
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


// Legacy mock data imports - ONLY allowed in this file
import {
  tenants,
  assetsByTenant,
  sectors,
  siteSummary
} from "@/data/mockData";
import { alerts, incidents } from "@/data/alertData";
import { upstreamAssets } from "@/data/upstreamMockData";

/**
 * MockProvider implementation
 * 
 * All methods return Promises to match the async interface,
 * even though the underlying data is synchronous.
 */
export class MockProvider implements DataProvider {
  private readonly info: ProviderInfo = {
    name: "MockProvider",
    version: "1.0.0",
    isConnected: true
  };

  getInfo(): ProviderInfo {
    return this.info;
  }

  // ============================================================================
  // Tenant / Organization
  // ============================================================================

  async getTenants(): Promise<Tenant[]> {
    return tenants;
  }

  async getTenantsBySector(sectorId: string): Promise<Tenant[]> {
    return tenants.filter(t => t.sector === sectorId);
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return tenants.find(t => t.id === tenantId) || null;
  }

  // ============================================================================
  // Sectors
  // ============================================================================

  async getSectors(): Promise<Sector[]> {
    return sectors;
  }

  async getSectorById(sectorId: string): Promise<Sector | null> {
    return sectors.find(s => s.id === sectorId) || null;
  }

  // ============================================================================
  // Assets
  // ============================================================================

  async getAssetsByTenant(tenantId: string): Promise<Asset[]> {
    return assetsByTenant[tenantId] || [];
  }

  async getAssetById(assetId: string): Promise<Asset | UpstreamAsset | null> {
    // Search across all tenants
    for (const assets of Object.values(assetsByTenant)) {
      const found = assets.find(a => a.id === assetId);
      if (found) return found;
    }
    return null;
  }

  async getSiteSummaryByTenant(tenantId: string): Promise<SiteSummary[]> {
    return siteSummary[tenantId] || [];
  }

  // ============================================================================
  // Alerts & Incidents
  // ============================================================================

  async getAlertsByTenant(tenantId: string): Promise<Alert[]> {
    return alerts.filter(a => a.tenantId === tenantId);
  }

  async getAlertsBySeverity(tenantId: string, severity: string): Promise<Alert[]> {
    return alerts.filter(a => a.tenantId === tenantId && a.severity === severity);
  }

  async getIncidentsByTenant(tenantId: string): Promise<Incident[]> {
    return incidents.filter(i => i.tenantId === tenantId);
  }

  // ============================================================================
  // Upstream-specific (Oil & Gas)
  // These return empty arrays for now - upstream mock data can be wired in later
  // ============================================================================

  async getUpstreamAssetsByTenant(tenantId: string): Promise<UpstreamAsset[]> {
    return upstreamAssets.filter(a => a.tenantId === tenantId);
  }

  async getDiscoveryJobsByTenant(tenantId: string): Promise<UpstreamDiscoveryJob[]> {
    // TODO: Wire up upstreamMockData.ts when needed
    return [];
  }

  async getDiscoveryAgentsByTenant(tenantId: string): Promise<DiscoveryAgent[]> {
    // TODO: Wire up upstreamMockData.ts when needed
    return [];
  }

  async getConnectionEndpointsByTenant(tenantId: string): Promise<ConnectionEndpoint[]> {
    // TODO: Wire up upstreamMockData.ts when needed
    return [];
  }

  async getCandidateAssetsByJob(jobId: string): Promise<CandidateAsset[]> {
    // TODO: Wire up upstreamMockData.ts when needed
    return [];
  }

  // ============================================================================
  // Transmission-specific (Power Transmission)
  // These return empty arrays/objects for now - will be implemented in HybridProvider
  // ============================================================================

  async getTransmissionTenants(): Promise<TransmissionTenant[]> {
    return [];
  }

  async getGridNodesByTenant(tenantId: string): Promise<GridNode[]> {
    return [];
  }

  async getGridLinesByTenant(tenantId: string): Promise<GridLine[]> {
    return [];
  }

  async getTransmissionAssetsByTenant(tenantId: string): Promise<TransmissionAsset[]> {
    return [];
  }

  async getTransmissionAssetById(assetId: string): Promise<TransmissionAsset | null> {
    return null;
  }


  async getTransmissionOverviewKpis(tenantId: string): Promise<TransmissionKpis> {
    return {
      totalAssets: 0,
      onlineAssets: 0,
      offlineAssets: 0,
      maintenanceAssets: 0,
      criticalAlerts: 0,
      warningAlerts: 0,
      totalGridNodes: 0,
      totalGridLines: 0,
      activeLines: 0
    };
  }

  async getAlertsByAsset(assetId: string): Promise<Alert[]> {
    return [];
  }

  async getTelemetryPointsByAsset(assetId: string): Promise<TelemetryPoint[]> {
    return [];
  }

  async getChildAssets(parentAssetId: string): Promise<TransmissionAsset[]> {
    return [];
  }

  async getAssetTopologyLinks(assetId: string): Promise<GridAssetLink[]> {
    return [];
  }

  async updateTransmissionAsset(assetId: string, data: any): Promise<TransmissionAsset> {
    throw new Error("updateTransmissionAsset not implemented in MockProvider");
  }


  // ============================================================================
  // ============================================================================
  // Performance Management (OEE & Performance Tracking)
  // These return empty arrays/objects for now - performance mock data can be added later
  // ============================================================================

  async listPerformancePanels(tenantId: string, filters?: PerformanceFilters): Promise<PerformancePanel[]> {
    // TODO: Wire up performance mock data when needed
    return [];
  }

  async getPerformancePanel(id: string): Promise<PerformancePanel | null> {
    // TODO: Wire up performance mock data when needed
    return null;
  }

  async createPerformancePanel(tenantId: string, panel: CreatePerformancePanelRequest): Promise<PerformancePanel> {
    // TODO: Implement mock creation logic when needed
    throw new Error("MockProvider.createPerformancePanel() not implemented");
  }

  async updatePerformancePanel(panelId: string, updates: UpdatePerformancePanelRequest): Promise<PerformancePanel> {
    // TODO: Implement mock update logic when needed
    throw new Error("MockProvider.updatePerformancePanel() not implemented");
  }

  async deletePerformancePanel(panelId: string): Promise<void> {
    // TODO: Implement mock delete logic when needed
    throw new Error("MockProvider.deletePerformancePanel() not implemented");
  }

  async listPerformanceLosses(tenantId: string, filters?: LossFilters): Promise<PerformanceLoss[]> {
    // TODO: Wire up performance mock data when needed
    return [];
  }

  async getPerformanceLoss(id: string): Promise<PerformanceLoss | null> {
    // TODO: Wire up performance mock data when needed
    return null;
  }

  async createPerformanceLoss(tenantId: string, loss: CreatePerformanceLossRequest): Promise<PerformanceLoss> {
    // TODO: Implement mock creation logic when needed
    throw new Error("MockProvider.createPerformanceLoss() not implemented");
  }

  async updatePerformanceLoss(lossId: string, updates: UpdatePerformanceLossRequest): Promise<PerformanceLoss> {
    // TODO: Implement mock update logic when needed
    throw new Error("MockProvider.updatePerformanceLoss() not implemented");
  }

  async listPerformanceBottlenecks(tenantId: string, filters?: BottleneckFilters): Promise<PerformanceBottleneck[]> {
    // TODO: Wire up performance mock data when needed
    return [];
  }

  async getPerformanceBottleneck(id: string): Promise<PerformanceBottleneck | null> {
    // TODO: Wire up performance mock data when needed
    return null;
  }

  async createPerformanceBottleneck(tenantId: string, bottleneck: CreatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    // TODO: Implement mock creation logic when needed
    throw new Error("MockProvider.createPerformanceBottleneck() not implemented");
  }

  async updatePerformanceBottleneck(bottleneckId: string, updates: UpdatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    // TODO: Implement mock update logic when needed
    throw new Error("MockProvider.updatePerformanceBottleneck() not implemented");
  }

  async listPerformanceTrends(tenantId: string, filters: TrendFilters): Promise<PerformanceTrend[]> {
    // TODO: Wire up performance mock data when needed
    return [];
  }

  async listPerformanceBenchmarks(tenantId: string, filters?: BenchmarkFilters): Promise<PerformanceBenchmark[]> {
    // TODO: Wire up performance mock data when needed
    return [];
  }

  async exportPerformanceData(tenantId: string, exportRequest: PerformanceExportRequest): Promise<ExportResult> {
    // TODO: Implement mock export logic when needed
    throw new Error("MockProvider.exportPerformanceData() not implemented");
  }

  // ============================================================================
  // SIM (Shift Intelligence Management) - Return empty for mock tenants
  // Mock tenants don't have SIM data - only Supabase tenants do
  // ============================================================================

  async getSimBoards(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    // Mock tenants don't have SIM data
    return [];
  }

  async getSimBoardById(boardId: string): Promise<any | null> {
    return null;
  }

  async getSimKpis(boardId: string): Promise<any[]> {
    return [];
  }

  async listSwitchingOrders(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async getSwitchingOrder(orderId: string): Promise<any | null> {
    return null;
  }

  async createSwitchingOrder(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createSwitchingOrder() not implemented");
  }

  async updateSwitchingOrder(orderId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateSwitchingOrder() not implemented");
  }

  async listOutages(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async getOutage(outageId: string): Promise<any | null> {
    return null;
  }

  async createOutage(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createOutage() not implemented");
  }

  async updateOutage(outageId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateOutage() not implemented");
  }

  async listSimIssues(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async createSimIssue(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createSimIssue() not implemented");
  }

  async updateSimIssue(issueId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateSimIssue() not implemented");
  }

  async listSimActions(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async createSimAction(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createSimAction() not implemented");
  }

  async updateSimAction(actionId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateSimAction() not implemented");
  }

  // ============================================================================
  // CI (Continuous Improvement) - Return empty for mock tenants
  // Mock tenants don't have CI data - only Supabase tenants do
  // ============================================================================

  async getCiStages(tenantId: string): Promise<any[]> {
    // Mock tenants don't have CI data
    return [];
  }

  async listCiProjects(
    tenantId: string,
    filters?: CIProjectFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async getCiProject(projectId: string): Promise<any | null> {
    return null;
  }

  async createCiProject(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createCiProject() not implemented");
  }

  async updateCiProject(projectId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateCiProject() not implemented");
  }

  async moveCiProjectStage(projectId: string, stageId: string): Promise<any> {
    throw new Error("MockProvider.moveCiProjectStage() not implemented");
  }

  async getCiProjectRca(projectId: string): Promise<any[]> {
    return [];
  }

  async upsertCiProjectRca(payload: any): Promise<any> {
    throw new Error("MockProvider.upsertCiProjectRca() not implemented");
  }

  async listCiCountermeasures(
    tenantId: string,
    filters?: CountermeasureFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    return [];
  }

  async createCiCountermeasure(tenantId: string, payload: any): Promise<any> {
    throw new Error("MockProvider.createCiCountermeasure() not implemented");
  }

  async updateCiCountermeasure(countermeasureId: string, patch: any): Promise<any> {
    throw new Error("MockProvider.updateCiCountermeasure() not implemented");
  }

  async listCiProjectKpis(projectId: string): Promise<any[]> {
    return [];
  }

  async upsertCiImpact(payload: any): Promise<any> {
    throw new Error("MockProvider.upsertCiImpact() not implemented");
  }

  async listCiDocuments(projectId: string): Promise<any[]> {
    return [];
  }

  async createCiDocument(payload: CreateCIDocumentRequest): Promise<CIDocument> {
    throw new Error("createCiDocument not implemented in MockProvider");
  }

  // ============================================================================
  // CI Reports - Stub implementation
  // ============================================================================

  async listCiReports(
    tenantId: string,
    filters?: import('@/types/optimise').CIReportFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<import('@/types/optimise').CIReport[]> {
    return [];
  }

  async getCiReport(reportId: string): Promise<import('@/types/optimise').CIReport | null> {
    return null;
  }

  // ============================================================================
  // Shift Performance - Stub implementation
  // ============================================================================

  async listShiftPerformance(
    tenantId: string,
    filters?: import('@/types/optimise').ShiftPerformanceFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<import('@/types/optimise').ShiftPerformanceMetrics[]> {
    return [];
  }

  async getShiftPerformance(shiftId: string): Promise<import('@/types/optimise').ShiftPerformanceMetrics | null> {
    return null;
  }

  // ============================================================================
  // Optimisation (AI-powered) Methods
  // ============================================================================

  async listOpportunities(
    tenantId: string,
    filters?: OpportunityFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationOpportunity[]> {
    return [];
  }

  async getOpportunity(opportunityId: string): Promise<OptimisationOpportunity | null> {
    return null;
  }

  async updateOpportunity(opportunityId: string, patch: UpdateOpportunityRequest): Promise<OptimisationOpportunity> {
    throw new Error("updateOpportunity not implemented in MockProvider");
  }

  async listRecommendations(
    tenantId: string,
    filters?: RecommendationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<AIRecommendation[]> {
    return [];
  }

  async getRecommendation(recommendationId: string): Promise<AIRecommendation | null> {
    return null;
  }

  async createRecommendation(tenantId: string, payload: CreateRecommendationRequest): Promise<AIRecommendation> {
    throw new Error("createRecommendation not implemented in MockProvider");
  }

  async updateRecommendation(recommendationId: string, patch: UpdateRecommendationRequest): Promise<AIRecommendation> {
    throw new Error("updateRecommendation not implemented in MockProvider");
  }

  async listPlaybooks(tenantId: string, filters?: PlaybookFilters): Promise<OptimisationPlaybook[]> {
    return [];
  }

  async getPlaybook(playbookId: string): Promise<OptimisationPlaybook | null> {
    return null;
  }

  async linkPlaybookToOpportunity(
    opportunityId: string,
    playbookId: string,
    relevanceScore?: number,
    notes?: string
  ): Promise<void> {
    throw new Error("linkPlaybookToOpportunity not implemented in MockProvider");
  }

  async createSimulation(tenantId: string, payload: CreateSimulationRequest): Promise<OptimisationSimulation> {
    throw new Error("createSimulation not implemented in MockProvider");
  }

  async updateSimulation(simulationId: string, patch: UpdateSimulationRequest): Promise<OptimisationSimulation> {
    throw new Error("updateSimulation not implemented in MockProvider");
  }

  async listSimulations(
    tenantId: string,
    filters?: SimulationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationSimulation[]> {
    return [];
  }

  async publishToSim(tenantId: string, payload: PublishToSimRequest): Promise<PublishEvent> {
    throw new Error("publishToSim not implemented in MockProvider");
  }

  async publishToCi(tenantId: string, payload: PublishToCiRequest): Promise<PublishEvent> {
    throw new Error("publishToCi not implemented in MockProvider");
  }

  async listPublishEvents(
    tenantId: string,
    filters?: PublishEventFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<PublishEvent[]> {
    return [];
  }

  // ============================================================================
  // Process Automation (Feature Set A-D)
  // ============================================================================

  async getAutomationDashboardData(tenantId: string, params?: { from?: string; to?: string }): Promise<AutomationDashboardData> {
    return {
      kpis: {
        active_workflows: 0,
        active_triggers: 0,
        pending_approvals: 0,
        recent_simulations: 0,
        active_alarm_rules: 0,
        recent_audit_events: 0,
      },
      workflow_timeline: [],
      trigger_heatmap: [],
      approval_distribution: [],
      audit_event_types: [],
    };
  }

  async getAutomationAlerts(tenantId: string, filters?: ProcessAutomationFilters): Promise<AutomationAlert[]> {
    return [];
  }

  async getTagMappings(tenantId: string, filters?: ProcessAutomationFilters): Promise<TagMapping[]> {
    return [];
  }

  async getControlModels(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlModel[]> {
    return [];
  }

  async getActionBindings(tenantId: string, filters?: ProcessAutomationFilters): Promise<ActionBinding[]> {
    return [];
  }

  async getTriggers(tenantId: string, filters?: ProcessAutomationFilters): Promise<Trigger[]> {
    return [];
  }

  async getAlarmRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<AlarmRule[]> {
    return [];
  }

  async getEventPatterns(tenantId: string, filters?: ProcessAutomationFilters): Promise<EventPattern[]> {
    return [];
  }

  async getWorkflows(tenantId: string, filters?: ProcessAutomationFilters): Promise<Workflow[]> {
    return [];
  }

  async getSequences(tenantId: string, filters?: ProcessAutomationFilters): Promise<Sequence[]> {
    return [];
  }

  async getControlRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlRule[]> {
    return [];
  }

  async getVersions(tenantId: string, filters?: ProcessAutomationFilters): Promise<Version[]> {
    return [];
  }

  async getApprovals(tenantId: string, filters?: ProcessAutomationFilters): Promise<Approval[]> {
    return [];
  }

  async getSimulations(tenantId: string, filters?: ProcessAutomationFilters): Promise<Simulation[]> {
    return [];
  }

  async getAuditLogs(tenantId: string, filters?: ProcessAutomationFilters): Promise<AuditLog[]> {
    return [];
  }

  async getActionBinding(id: string): Promise<ActionBinding | null> {
    return null;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    return null;
  }

  async executeWorkflow(id: string): Promise<void> {
    return;
  }

  async approveApproval(id: string, reviewedBy: string): Promise<Approval> {
    throw new Error('Method not implemented in MockProvider');
  }

  async rejectApproval(id: string, reviewedBy: string, reason: string): Promise<Approval> {
    throw new Error('Method not implemented in MockProvider');
  }


  // ============================================================================
  // Transmission Catalog (Cycle 1)

  // These return empty arrays/objects for now - will be implemented in SupabaseProvider
  // ============================================================================

  async getDefaultTransmissionTenantId(): Promise<string> {
    throw new Error('MockProvider does not support getDefaultTransmissionTenantId. Use SupabaseProvider.');
  }

  async getPropertySetsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { type?: string }
  ): Promise<ListResult<PropertySet>> {
    return { data: [], total: 0 };
  }

  async getPropertySetById(id: string): Promise<PropertySet | null> {
    return null;
  }

  async createPropertySet(data: Omit<PropertySet, 'id' | 'createdAt'>): Promise<PropertySet> {
    throw new Error('MockProvider does not support createPropertySet. Use SupabaseProvider.');
  }

  async getLifecycleStatesByCategory(tenantId: string, category: string): Promise<LifecycleState[]> {
    return [];
  }

  async createLifecycleState(data: Omit<LifecycleState, 'id' | 'createdAt'>): Promise<LifecycleState> {
    throw new Error('MockProvider does not support createLifecycleState. Use SupabaseProvider.');
  }

  // ============================================================================
  // Transmission Discovery (Cycle 2)
  // These return empty arrays/objects for now - will be implemented in SupabaseProvider
  // ============================================================================

  async getTransmissionDiscoveryJobsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryJob>> {
    return { data: [], total: 0 };
  }

  async createDiscoveryJob(
    data: Omit<import('@/types/transmission').DiscoveryJob, 'id' | 'createdAt' | 'foundCount'>
  ): Promise<import('@/types/transmission').DiscoveryJob> {
    throw new Error('MockProvider does not support createDiscoveryJob. Use SupabaseProvider.');
  }

  async retryDiscoveryJob(jobId: string): Promise<import('@/types/transmission').DiscoveryJob> {
    throw new Error('MockProvider does not support retryDiscoveryJob. Use SupabaseProvider.');
  }

  async getTransmissionDiscoveryAgentsByTenant(
    tenantId: string,
    params?: PaginationParams & { status?: string; type?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryAgent>> {
    return { data: [], total: 0 };
  }

  async createDiscoveryAgent(
    data: Omit<import('@/types/transmission').DiscoveryAgent, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').DiscoveryAgent> {
    throw new Error('MockProvider does not support createDiscoveryAgent. Use SupabaseProvider.');
  }

  async getTransmissionCandidateAssetsByJob(
    jobId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').CandidateAsset>> {
    return { data: [], total: 0 };
  }

  async approveCandidateAsset(
    candidateId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    throw new Error('MockProvider does not support approveCandidateAsset. Use SupabaseProvider.');
  }

  async mergeCandidateAsset(
    candidateId: string,
    targetAssetId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    throw new Error('MockProvider does not support mergeCandidateAsset. Use SupabaseProvider.');
  }

  async rejectCandidateAsset(
    candidateId: string
  ): Promise<import('@/types/transmission').CandidateAsset> {
    throw new Error('MockProvider does not support rejectCandidateAsset. Use SupabaseProvider.');
  }

  async getAssetImportsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetImport>> {
    return { data: [], total: 0 };
  }

  async createAssetImport(
    data: Omit<import('@/types/transmission').AssetImport, 'id' | 'createdAt' | 'importedCount'>
  ): Promise<import('@/types/transmission').AssetImport> {
    throw new Error('MockProvider does not support createAssetImport. Use SupabaseProvider.');
  }

  // ============================================================================
  // Manual Asset Creation (Cycle 2)
  // ============================================================================

  async getAssetTypesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; code: string; name: string; category: string }>> {
    return [];
  }

  async getSitesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; name: string }>> {
    return [];
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
  ): Promise<TransmissionAsset> {
    throw new Error('MockProvider does not support createTransmissionAsset. Use SupabaseProvider.');
  }

  // ============================================================================
  // Cycle 3: Location & Topology Methods
  // ============================================================================

  async getLinearAssetIssues(
    lineId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>> {
    throw new Error('MockProvider does not support getLinearAssetIssues. Use SupabaseProvider.');
  }

  async getLinearAssetIssuesByTenant(
    tenantId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>> {
    throw new Error('MockProvider does not support getLinearAssetIssuesByTenant. Use SupabaseProvider.');
  }

  async createLinearAssetIssue(
    data: Omit<import('@/types/transmission').LinearAssetIssue, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    throw new Error('MockProvider does not support createLinearAssetIssue. Use SupabaseProvider.');
  }

  async resolveLinearAssetIssue(
    issueId: string
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    throw new Error('MockProvider does not support resolveLinearAssetIssue. Use SupabaseProvider.');
  }

  // ============================================================================
  // Transmission Connectivity (Cycle 4)
  // ============================================================================

  async getTransmissionConnectionEndpointsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { protocol?: string; status?: string; zone?: string }
  ): Promise<ListResult<import('@/types/transmission').ConnectionEndpoint>> {
    throw new Error('MockProvider does not support getTransmissionConnectionEndpointsByTenant. Use SupabaseProvider.');
  }

  async createConnectionEndpoint(
    data: Omit<import('@/types/transmission').ConnectionEndpoint, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    throw new Error('MockProvider does not support createConnectionEndpoint. Use SupabaseProvider.');
  }

  async updateConnectionEndpointStatus(
    id: string,
    status: 'up' | 'down' | 'unknown'
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    throw new Error('MockProvider does not support updateConnectionEndpointStatus. Use SupabaseProvider.');
  }

  async getStreamConfigsByTenant(
    tenantId: string,
    params?: PaginationParams & { profile?: string }
  ): Promise<ListResult<import('@/types/transmission').StreamConfig>> {
    throw new Error('MockProvider does not support getStreamConfigsByTenant. Use SupabaseProvider.');
  }

  async createStreamConfig(
    data: Omit<import('@/types/transmission').StreamConfig, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').StreamConfig> {
    throw new Error('MockProvider does not support createStreamConfig. Use SupabaseProvider.');
  }

  // ============================================================================
  // Transmission Portfolio Management (Cycle 5)
  // ============================================================================

  async getSavedViewsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').SavedView>> {
    throw new Error('MockProvider does not support getSavedViewsByTenant. Use SupabaseProvider.');
  }

  async getSavedViewById(id: string): Promise<import('@/types/transmission').SavedView | null> {
    throw new Error('MockProvider does not support getSavedViewById. Use SupabaseProvider.');
  }

  async createSavedView(
    data: Omit<import('@/types/transmission').SavedView, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<import('@/types/transmission').SavedView> {
    throw new Error('MockProvider does not support createSavedView. Use SupabaseProvider.');
  }

  async deleteSavedView(id: string): Promise<void> {
    throw new Error('MockProvider does not support deleteSavedView. Use SupabaseProvider.');
  }

  async getAssetPortfolioKpis(
    tenantId: string,
    filters?: import('@/types/transmission').AssetFilter
  ): Promise<import('@/types/transmission').PortfolioKpis> {
    throw new Error('MockProvider does not support getAssetPortfolioKpis. Use SupabaseProvider.');
  }

  // ============================================================================
  // Transmission Asset Detail (Cycle 6)
  // ============================================================================

  async getAssetDocuments(assetId: string): Promise<import('@/types/transmission').AssetDocument[]> {
    throw new Error('MockProvider does not support getAssetDocuments. Use SupabaseProvider.');
  }

  async createAssetDocument(
    data: Omit<import('@/types/transmission').AssetDocument, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').AssetDocument> {
    throw new Error('MockProvider does not support createAssetDocument. Use SupabaseProvider.');
  }

  async getAssetAuditLog(
    assetId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetAuditLog>> {
    throw new Error('MockProvider does not support getAssetAuditLog. Use SupabaseProvider.');
  }

  async getComplianceByAsset(assetId: string): Promise<import('@/types/transmission').ComplianceRecord[]> {
    return [];
  }

  async createAssetAuditLog(
    data: Omit<import('@/types/transmission').AssetAuditLog, 'id' | 'performedAt'>
  ): Promise<import('@/types/transmission').AssetAuditLog> {
    const mockLog: import('@/types/transmission').AssetAuditLog = {
      id: 'mock-audit-id',
      performedAt: new Date().toISOString(),
      ...data
    };
    return mockLog;
  }

  // ============================================================================
  // Transmission Alerts (Cycle 7)
  // ============================================================================

  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<Alert> {
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) {
      throw new Error(`Alert with ID ${alertId} not found`);
    }

    // Update the alert in the mock data
    const updatedAlert = {
      ...alerts[alertIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    alerts[alertIndex] = updatedAlert;

    return updatedAlert;
  }

  // ============================================================================
  // Overview & Platform Health (Phase 6)
  // ============================================================================

  async getOverviewKPIs(tenantId: string): Promise<import('@/types/overview').DashboardKPIs> {
    return {
      activeAlertsCount: 0,
      openWorkItemsCount: 0,
      integrationHealthScore: 100,
      dataFreshnessScore: 100,
      platformHealthScore: 100
    };
  }

  async getDashboards(tenantId: string): Promise<import('@/types/overview').OverviewDashboard[]> {
    return [];
  }

  async getWorkItems(tenantId: string, params?: PaginationParams): Promise<ListResult<import('@/types/overview').WorkItem>> {
    return { data: [], total: 0 };
  }

  async getNotifications(tenantId: string, userId: string): Promise<import('@/types/overview').NotificationItem[]> {
    return [];
  }

  async getOverviewExceptions(tenantId: string): Promise<import('@/types/overview').OverviewException[]> {
    return [];
  }

  async getPlatformHealthFindings(tenantId: string): Promise<import('@/types/overview').PlatformHealthFinding[]> {
    return [];
  }

  async getDataStreamStatus(tenantId: string): Promise<import('@/types/overview').DataStreamStatus[]> {
    return [];
  }

  async getAdvisorCards(tenantId: string): Promise<import('@/types/overview').AdvisorCard[]> {
    return [];
  }

  async updateWorkItem(id: string, data: Partial<import('@/types/overview').WorkItem>): Promise<import('@/types/overview').WorkItem> {
    throw new Error('MockProvider does not support updateWorkItem. Use SupabaseProvider.');
  }

  async markNotificationRead(id: string): Promise<import('@/types/overview').NotificationItem> {
    throw new Error('MockProvider does not support markNotificationRead. Use SupabaseProvider.');
  }

  // ============================================================================
  // Settings & Identity (Phase 6)
  // ============================================================================

  async getTenantProfile(tenantId: string): Promise<import('@/types/settings').OrganizationProfile | null> {
    return null;
  }

  async updateTenantProfile(tenantId: string, data: Partial<import('@/types/settings').OrganizationProfile>): Promise<import('@/types/settings').OrganizationProfile> {
    throw new Error('MockProvider does not support updateTenantProfile. Use SupabaseProvider.');
  }

  async getStreams(tenantId: string): Promise<import('@/types/settings').Stream[]> {
    return [];
  }

  async getPrograms(tenantId: string): Promise<import('@/types/settings').Program[]> {
    return [];
  }

  async getNamingStandards(tenantId: string): Promise<import('@/types/settings').NamingStandard | null> {
    return null;
  }

  async updateNamingStandards(tenantId: string, standards: import('@/types/settings').NamingStandard): Promise<import('@/types/settings').NamingStandard> {
    throw new Error('MockProvider does not support updateNamingStandards. Use SupabaseProvider.');
  }

  async getUserProfiles(tenantId: string): Promise<import('@/types/settings').UserProfile[]> {
    return [];
  }

  async updateUserProfile(userId: string, data: Partial<import('@/types/settings').UserProfile>): Promise<import('@/types/settings').UserProfile> {
    throw new Error('MockProvider does not support updateUserProfile. Use SupabaseProvider.');
  }

  async getTeams(tenantId: string): Promise<import('@/types/settings').Team[]> {
    return [];
  }

  async getIntegrations(tenantId: string): Promise<import('@/types/settings').IntegrationInstance[]> {
    return [];
  }

  async updateIntegration(id: string, data: Partial<import('@/types/settings').IntegrationInstance>): Promise<import('@/types/settings').IntegrationInstance> {
    throw new Error('MockProvider does not support updateIntegration. Use SupabaseProvider.');
  }

  async getModuleToggles(tenantId: string): Promise<import('@/types/settings').ModuleToggle[]> {
    return [];
  }

  async updateModuleToggle(id: string, enabled: boolean): Promise<import('@/types/settings').ModuleToggle> {
    throw new Error('MockProvider does not support updateModuleToggle. Use SupabaseProvider.');
  }

  async getUserPreferences(userId: string, tenantId: string): Promise<import('@/types/settings').UserPreference | null> {
    return null;
  }

  async updateUserPreferences(userId: string, tenantId: string, data: Partial<import('@/types/settings').UserPreference>): Promise<import('@/types/settings').UserPreference> {
    throw new Error('MockProvider does not support updateUserPreferences. Use SupabaseProvider.');
  }
}

// Singleton instance
let mockProviderInstance: MockProvider | null = null;

export function getMockProvider(): MockProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockProvider();
  }
  return mockProviderInstance;
}
