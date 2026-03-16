/**
 * SupabaseProvider
 * 
 * Implements the DataProvider interface using Supabase as the backend.
 * Methods will be implemented entity-by-entity as migrations progress.
 * 
 * MIGRATION ORDER (recommended):
 * 1. getTenants() - core entity
 * 2. getSectors() - core entity  
 * 3. getAssetsByTenant() - depends on tenants
 * 4. getAlertsByTenant() - depends on tenants
 * 5. Upstream-specific methods
 */

import type { DataProvider, SiteSummary, ProviderInfo } from "../DataProvider";
import type { Tenant, Asset, Sector } from "@/types/navigation";
import type { Alert, Incident, AlertSeverity, AlertStatus } from "@/types/alert";
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
  PropertyField,
  LifecycleState,
  PaginationParams,
  SortParams,
  ListResult
} from "@/types/transmission";
import type {
  OverviewDashboard,
  DashboardWidgetPlacement,
  OverviewException,
  PlatformHealthCheck,
  PlatformHealthFinding,
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
  SiteHierarchyNode,
  Team,
  TeamMembership,
  UserProfile,
  IntegrationInstance,
  ModuleToggle,
  UserPreference,
  NotificationPreference
} from "@/types/settings";
import type {
  PerformanceFilters,
  PerformancePanel,
  CreatePerformancePanelRequest,
  UpdatePerformancePanelRequest,
  LossFilters,
  PerformanceLoss,
  CreatePerformanceLossRequest,
  UpdatePerformanceLossRequest,
  BottleneckFilters,
  PerformanceBottleneck,
  CreatePerformanceBottleneckRequest,
  UpdatePerformanceBottleneckRequest,
  TrendFilters,
  PerformanceTrend,
  BenchmarkFilters,
  PerformanceBenchmark,
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
  CIProject,
  CreateCIProjectRequest,
  UpdateCIProjectRequest,
  CIStage,
  PlaybookFilters,
  UpdateOutageRequest,
  CreateOutageRequest,
  Outage,
  CreateSwitchingOrderRequest,
  UpdateSwitchingOrderRequest,
  SwitchingOrder,
  SIMBoard,
  KPIMetric,
  CreateSimIssueRequest,
  UpdateSimIssueRequest,
  SimIssue,
  CreateSimActionRequest,
  UpdateSimActionRequest,
  SimAction
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

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { mapTenantIdToUUID } from "@/lib/tenantMapping";

/**
 * SupabaseProvider implementation
 * 
 * Methods throw NotImplementedError until migrated.
 * This makes it obvious which entities still need migration.
 * Triggering refresh.
 */
export class SupabaseProvider implements DataProvider {
  private readonly info: ProviderInfo = {
    name: "SupabaseProvider",
    version: "1.0.0",
    isConnected: isSupabaseConfigured()
  };

  // Cached tenant ID for Power Transmission demo tenant
  private cachedTransmissionTenantId: string | null = null;
  private tenantIdMap: Map<string, string> = new Map();

  getInfo(): ProviderInfo {
    return this.info;
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
      throw new Error(`getDefaultTransmissionTenantId failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Power Transmission demo tenant not found. Ensure seed data is loaded.');
    }

    this.cachedTransmissionTenantId = data.id;
    return this.cachedTransmissionTenantId;
  }

  /**
   * Resolves a potentially mock tenant ID (like 't-dewa') to a real Supabase UUID.
   */
  private async resolveTenantId(tenantId: string): Promise<string> {
    // If it's already a UUID, return it directly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantId)) {
      return tenantId;
    }

    // Check local cache
    if (this.tenantIdMap.has(tenantId)) {
      return this.tenantIdMap.get(tenantId)!;
    }

    // All known frontend slug aliases for the DEWA Transmission demo tenant
    const transmissionSlugs = [
      't-dewa',
      't1',
      'dewa-transmission',
      'alpha-upstream',
      't-upstream',
      'power-transmission-demo',
    ];

    if (transmissionSlugs.includes(tenantId)) {
      const realId = await this.getDefaultTransmissionTenantId();
      this.tenantIdMap.set(tenantId, realId);
      return realId;
    }

    // Fall back to the value as-is (may still be invalid but will surface a clear DB error)
    return tenantId;
  }

  private notImplemented(method: string): never {
    throw new Error(
      `SupabaseProvider.${method}() not yet implemented. ` +
      `Set VITE_DATA_BACKEND=mock to use MockProvider, or implement this method.`
    );
  }

  private ensureConnected(): void {
    if (!supabase) {
      throw new Error(
        "Supabase client not initialized. " +
        "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
  }

  // ============================================================================
  // Tenant / Organization
  // ============================================================================

  async getTenants(): Promise<Tenant[]> {
    this.ensureConnected();
    // TODO: Implement when tenants table is created
    // const { data, error } = await supabase!.from('tenants').select('*');
    // if (error) throw error;
    // return data;
    this.notImplemented("getTenants");
  }

  async getTenantsBySector(sectorId: string): Promise<Tenant[]> {
    this.ensureConnected();
    this.notImplemented("getTenantsBySector");
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    this.ensureConnected();
    this.notImplemented("getTenantById");
  }

  // ============================================================================
  // Sectors
  // ============================================================================

  async getSectors(): Promise<Sector[]> {
    this.ensureConnected();
    this.notImplemented("getSectors");
  }

  async getSectorById(sectorId: string): Promise<Sector | null> {
    this.ensureConnected();
    this.notImplemented("getSectorById");
  }

  // ============================================================================
  // Assets
  // ============================================================================

  async getAssetsByTenant(tenantId: string): Promise<Asset[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const transmissionAssets = await this.getTransmissionAssetsByTenant(resolvedId);
    return transmissionAssets.map(ta => ({
      id: ta.id,
      name: ta.name,
      type: ta.assetTypeName,
      site: ta.siteName || 'Unknown',
      area: 'Main',
      status: ta.status,
      lastSeen: new Date().toISOString(), // Mock value as DB doesn't track this yet
      criticality: ta.criticality
    }));
  }

  async getAssetById(assetId: string): Promise<Asset | UpstreamAsset | null> {
    this.ensureConnected();
    const ta = await this.getTransmissionAssetById(assetId);
    if (!ta) return null;

    return {
      id: ta.id,
      name: ta.name,
      type: ta.assetTypeName,
      site: ta.siteName || 'Unknown',
      area: 'Main',
      status: ta.status,
      lastSeen: new Date().toISOString(),
      criticality: ta.criticality
    };
  }

  async getSiteSummaryByTenant(tenantId: string): Promise<SiteSummary[]> {
    this.ensureConnected();
    this.notImplemented("getSiteSummaryByTenant");
  }

  // ============================================================================
  // Alerts & Incidents
  // ============================================================================

  async getAlertsByTenant(tenantId: string): Promise<Alert[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    // Requirements: 3.5 - Fetch cross-domain alerts
    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .eq('tenant_id', resolvedTenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`getAlertsByTenant failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      severity: row.severity as AlertSeverity,
      status: row.status as AlertStatus,
      title: row.title,
      summary: row.payload?.description || (row.payload as any)?.summary || row.title,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      featureArea: row.source_type === 'asset' || row.source_type === 'grid_node' || row.source_type === 'grid_line'
        ? 'assets'
        : (row.payload?.feature_area || row.source_type) as any,
      siteId: (row.payload as any)?.siteId,
      assetId: row.source_id,
      tags: (row.payload as any)?.tags || []
    }));
  }

  async getAlertsBySeverity(tenantId: string, severity: string): Promise<Alert[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .eq('tenant_id', resolvedTenantId)
      .eq('severity', severity)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`getAlertsBySeverity failed: ${error.message}`);
    }

    // Reuse mapping logic (could extract to helper)
    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      severity: row.severity as AlertSeverity,
      status: row.status as AlertStatus,
      title: row.title,
      summary: row.payload?.description || (row.payload as any)?.summary || row.title,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      featureArea: row.source_type === 'asset' || row.source_type === 'grid_node' || row.source_type === 'grid_line'
        ? 'assets'
        : (row.payload?.feature_area || row.source_type) as any,
      siteId: (row.payload as any)?.siteId,
      assetId: row.source_id,
      tags: (row.payload as any)?.tags || []
    }));
  }

  async getIncidentsByTenant(tenantId: string): Promise<Incident[]> {
    this.ensureConnected();
    // const resolvedTenantId = await this.resolveTenantId(tenantId);

    // Note: 'incidents' table doesn't exist in Phase 0 schema yet, returning empty or could mock for now.
    // Spec says "Work Items & Notifications" in Phase 3. 
    // For now, return empty to avoid errors.
    return [];
  }


  // ============================================================================
  // Upstream-specific (Oil & Gas)
  // ============================================================================

  async getUpstreamAssetsByTenant(tenantId: string): Promise<UpstreamAsset[]> {
    this.ensureConnected();
    this.notImplemented("getUpstreamAssetsByTenant");
  }

  async getDiscoveryJobsByTenant(tenantId: string): Promise<UpstreamDiscoveryJob[]> {
    this.ensureConnected();
    this.notImplemented("getDiscoveryJobsByTenant");
  }

  async getDiscoveryAgentsByTenant(tenantId: string): Promise<DiscoveryAgent[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('discovery_agents')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`getDiscoveryAgentsByTenant failed: ${error.message}`);
    }

    return (data || []).map(agent => ({
      id: agent.id,
      tenantId: agent.tenant_id,
      name: agent.name,
      type: agent.type,
      protocols: agent.protocols || [],
      status: agent.status,
      assignedScopes: agent.assigned_scopes || [],
      lastRun: agent.last_run,
      description: agent.description,
      createdAt: agent.created_at
    }));
  }

  /**
   * Get connection endpoints for a tenant
   * Requirements: 4.1, 4.2, 8.1, 8.2
   */
  async getConnectionEndpointsByTenant(tenantId: string): Promise<ConnectionEndpoint[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('connection_endpoints')
      .select('*')
      .eq('tenant_id', await this.resolveTenantId(tenantId))
      .order('name');

    if (error) {
      throw new Error(`getConnectionEndpointsByTenant failed: ${error.message}`);
    }

    return (data || []).map(endpoint => ({
      id: endpoint.id,
      tenantId: endpoint.tenant_id,
      name: endpoint.name,
      protocol: endpoint.protocol,
      address: endpoint.address,
      port: endpoint.port,
      zone: endpoint.zone,
      hazardousArea: endpoint.hazardous_area,
      status: endpoint.status,
      lastSeen: endpoint.last_seen,
      description: endpoint.description,
      createdAt: endpoint.created_at
    }));
  }

  async getCandidateAssetsByJob(jobId: string): Promise<CandidateAsset[]> {
    this.ensureConnected();
    this.notImplemented("getCandidateAssetsByJob");
  }

  // ============================================================================
  // Transmission-specific (Power Transmission)
  // ============================================================================

  async getTransmissionTenants(): Promise<TransmissionTenant[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('tenants')
      .select('*')
      .eq('sector', 'power');

    if (error) {
      throw new Error(`getTransmissionTenants failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      sector: 'power' as const,
      subsector: row.subsector || 'transmission',
      scenarioTag: row.scenario_tag || ''
    }));
  }

  async getGridNodesByTenant(tenantId: string): Promise<GridNode[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('grid_nodes')
      .select('*')
      .eq('tenant_id', resolvedId);

    if (error) {
      throw new Error(`getGridNodesByTenant failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      name: row.name,
      nodeType: row.node_type as 'substation' | 'junction' | 'plant',
      voltageKv: row.voltage_kv,
      region: row.region,
      geoLat: row.geo_lat,
      geoLng: row.geo_lng
    }));
  }

  async getGridLinesByTenant(tenantId: string): Promise<GridLine[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('grid_lines')
      .select('*')
      .eq('tenant_id', resolvedId);

    if (error) {
      throw new Error(`getGridLinesByTenant failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      voltageKv: row.voltage_kv,
      lengthKm: row.length_km,
      status: row.status as 'active' | 'maintenance' | 'offline'
    }));
  }

  async getTransmissionAssetsByTenant(tenantId: string): Promise<TransmissionAsset[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const { data, error } = await supabase!
      .from('assets')
      .select(`
        *,
        asset_types (
          code,
          name
        ),
        sites (
          name
        )
      `)
      .eq('tenant_id', resolvedId);

    if (error) {
      throw new Error(`getTransmissionAssetsByTenant failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      assetTypeId: row.asset_type_id,
      assetTypeCode: row.asset_types?.code || '',
      assetTypeName: row.asset_types?.name || '',
      siteName: row.sites?.name || '',
      name: row.name,
      status: row.status as 'online' | 'offline' | 'maintenance',
      criticality: row.criticality as 'low' | 'medium' | 'high' | 'critical',
      parentAssetId: row.parent_asset_id,
      properties: row.properties || {}
    }));
  }

  async getTransmissionAssetById(assetId: string): Promise<TransmissionAsset | null> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('assets')
      .select(`
        *,
        asset_types (
          code,
          name,
          properties_schema
        ),
        sites (
          name
        )
      `)
      .eq('id', assetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`getTransmissionAssetById failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      siteId: data.site_id,
      assetTypeId: data.asset_type_id,
      assetTypeCode: data.asset_types?.code || '',
      assetTypeName: data.asset_types?.name || '',
      siteName: data.sites?.name || '',
      name: data.name,
      status: data.status as 'online' | 'offline' | 'maintenance',
      criticality: data.criticality as 'low' | 'medium' | 'high' | 'critical',
      parentAssetId: data.parent_asset_id,
      properties: data.properties || {},
      propertiesSchema: data.asset_types?.properties_schema || null
    };
  }

  async getTransmissionOverviewKpis(tenantId: string): Promise<TransmissionKpis> {
    this.ensureConnected();

    const resolvedId = await this.resolveTenantId(tenantId);

    // Get asset counts by status
    const { data: assetData, error: assetError } = await supabase!
      .from('assets')
      .select('status')
      .eq('tenant_id', resolvedId);

    if (assetError) {
      throw new Error(`getTransmissionOverviewKpis failed (assets): ${assetError.message}`);
    }

    // Get alert counts by severity
    const { data: alertData, error: alertError } = await supabase!
      .from('apm_alerts')
      .select('severity')
      .eq('tenant_id', resolvedId)
      .eq('status', 'open');
    if (alertError) {
      throw new Error(`getTransmissionOverviewKpis failed (alerts): ${alertError.message}`);
    }

    // Get grid node count
    const { count: nodeCount, error: nodeError } = await supabase!
      .from('grid_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', resolvedId);

    if (nodeError) {
      throw new Error(`getTransmissionOverviewKpis failed (grid_nodes): ${nodeError.message}`);
    }

    // Get grid line counts by status
    const { data: lineData, error: lineError } = await supabase!
      .from('grid_lines')
      .select('status')
      .eq('tenant_id', resolvedId);

    if (lineError) {
      throw new Error(`getTransmissionOverviewKpis failed (grid_lines): ${lineError.message}`);
    }

    // Compute KPIs
    const totalAssets = assetData.length;
    const onlineAssets = assetData.filter(a => a.status === 'online').length;
    const offlineAssets = assetData.filter(a => a.status === 'offline').length;
    const maintenanceAssets = assetData.filter(a => a.status === 'maintenance').length;

    const criticalAlerts = alertData.filter(a => a.severity === 'critical').length;
    const warningAlerts = alertData.filter(a => a.severity === 'warning').length;

    const totalGridNodes = nodeCount || 0;
    const totalGridLines = lineData.length;
    const activeLines = lineData.filter(l => l.status === 'active').length;

    return {
      totalAssets,
      onlineAssets,
      offlineAssets,
      maintenanceAssets,
      criticalAlerts,
      warningAlerts,
      totalGridNodes,
      totalGridLines,
      activeLines
    };
  }

  async getAlertsByAsset(assetId: string): Promise<Alert[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .eq('source_type', 'asset')
      .eq('source_id', assetId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`getAlertsByAsset failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      severity: row.severity as AlertSeverity,
      status: row.status as AlertStatus,
      title: row.title,
      summary: row.payload?.description || row.title,
      createdAt: row.created_at,
      updatedAt: row.created_at,
      featureArea: 'assets' as any,
      assetId: row.source_id
    }));
  }

  async getTelemetryPointsByAsset(assetId: string): Promise<TelemetryPoint[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('telemetry_points')
      .select('*')
      .eq('asset_id', assetId);

    if (error) {
      throw new Error(`getTelemetryPointsByAsset failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      tagId: row.tag_id,
      metric: row.metric,
      unit: row.unit,
      limits: row.limits,
      createdAt: row.created_at
    }));
  }

  async getChildAssets(parentAssetId: string): Promise<TransmissionAsset[]> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('assets')
      .select(`
        *,
        asset_types (
          code,
          name
        ),
        sites (
          name
        )
      `)
      .eq('parent_asset_id', parentAssetId);

    if (error) {
      throw new Error(`getChildAssets failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      siteId: row.site_id,
      assetTypeId: row.asset_type_id,
      assetTypeCode: row.asset_types?.code || '',
      assetTypeName: row.asset_types?.name || '',
      siteName: row.sites?.name || '',
      name: row.name,
      status: row.status as 'online' | 'offline' | 'maintenance',
      criticality: row.criticality as 'low' | 'medium' | 'high' | 'critical',
      parentAssetId: row.parent_asset_id,
      properties: row.properties || {}
    }));
  }

  async getAssetTopologyLinks(assetId: string): Promise<GridAssetLink[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('grid_asset_links')
      .select('*')
      .eq('asset_id', assetId);

    if (error) {
      throw new Error(`getAssetTopologyLinks failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      assetId: row.asset_id,
      nodeId: row.node_id,
      lineId: row.line_id
    }));
  }

  async updateTransmissionAsset(
    assetId: string,
    data: Partial<Omit<TransmissionAsset, 'id' | 'tenantId' | 'assetTypeId' | 'assetTypeCode' | 'assetTypeName'>>
  ): Promise<TransmissionAsset> {
    this.ensureConnected();

    const updateData: any = { ...data };

    // Map camelCase to snake_case for Supabase
    if (data.parentAssetId !== undefined) {
      updateData.parent_asset_id = data.parentAssetId;
      delete updateData.parentAssetId;
    }

    const { data: updated, error } = await supabase!
      .from('assets')
      .update(updateData)
      .eq('id', assetId)
      .select(`
        *,
        asset_types (
          code,
          name
        ),
        sites (
          name
        )
      `)
      .single();

    if (error) {
      throw new Error(`updateTransmissionAsset failed: ${error.message}`);
    }

    return {
      id: updated.id,
      tenantId: updated.tenant_id,
      siteId: updated.site_id,
      assetTypeId: updated.asset_type_id,
      assetTypeCode: updated.asset_types?.code || '',
      assetTypeName: updated.asset_types?.name || '',
      siteName: updated.sites?.name || '',
      name: updated.name,
      status: updated.status as 'online' | 'offline' | 'maintenance',
      criticality: updated.criticality as 'low' | 'medium' | 'high' | 'critical',
      parentAssetId: updated.parent_asset_id,
      properties: updated.properties || {}
    };
  }

  async getComplianceByAsset(assetId: string): Promise<import('@/types/transmission').ComplianceRecord[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('compliance_records')
      .select('*')
      .eq('asset_id', assetId)
      .order('issue_date', { ascending: false });

    if (error) {
      throw new Error(`getComplianceByAsset failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      title: row.title,
      complianceType: row.compliance_type as any,
      authority: row.authority,
      status: row.status as any,
      description: row.description,
      referenceNumber: row.reference_number,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      nextInspectionDate: row.next_inspection_date,
      createdAt: row.created_at
    }));
  }

  // ============================================================================
  // Process Automation (Feature Set A-D)
  // ============================================================================

  async getAutomationDashboardData(tenantId: string, params?: { from?: string; to?: string }): Promise<AutomationDashboardData> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    // Fetch counts for KPIs and distributions
    const [
      { count: workflowCount },
      { count: triggerCount },
      { count: approvalCount },
      { count: simulationCount },
      { count: alarmCount },
      { count: auditCount },
      { data: approvals },
      { data: auditLogs },
      { data: triggers }
    ] = await Promise.all([
      supabase!.from('pa_workflows').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_triggers').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_approvals').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId).eq('status', 'pending'),
      supabase!.from('pa_simulations').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_alarm_rules').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_audit_logs').select('*', { count: 'exact', head: true }).eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_approvals').select('status').eq('tenant_id', resolvedTenantId),
      supabase!.from('pa_audit_logs').select('*').eq('tenant_id', resolvedTenantId).order('created_at', { ascending: false }).limit(200),
      supabase!.from('pa_triggers').select('id, name').eq('tenant_id', resolvedTenantId)
    ]);

    // 1. Approval Distribution
    const approvalDist: Record<string, number> = {};
    (approvals || []).forEach((a: any) => {
      approvalDist[a.status] = (approvalDist[a.status] || 0) + 1;
    });
    const approval_distribution = Object.entries(approvalDist).map(([status, count]) => ({
      status: status as any,
      count
    }));

    // 2. Audit Event Types
    const auditDist: Record<string, number> = {};
    (auditLogs || []).forEach((log: any) => {
      auditDist[log.event_type] = (auditDist[log.event_type] || 0) + 1;
    });
    const audit_event_types = Object.entries(auditDist).map(([action, count]) => ({
      action,
      count
    }));

    // 3. Workflow Timeline (Aggregate from audit logs if possible)
    const workflowTimelineMap: Record<string, any> = {};
    (auditLogs || []).filter((l: any) => l.record_type === 'workflow' && l.event_type === 'execute').forEach((l: any) => {
      const date = new Date(l.created_at).toISOString().split('T')[0];
      if (!workflowTimelineMap[date]) workflowTimelineMap[date] = { date, executed: 0, failed: 0, pending: 0 };
      if (l.execution_result?.toLowerCase().includes('fail')) {
        workflowTimelineMap[date].failed++;
      } else {
        workflowTimelineMap[date].executed++;
      }
    });
    let workflow_timeline = Object.values(workflowTimelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Trigger Heatmap
    const triggerHeatmapMap: Record<string, any> = {};
    const triggerNames: Record<string, string> = {};
    (triggers || []).forEach((t: any) => triggerNames[t.id] = t.name);

    (auditLogs || []).filter((l: any) => l.record_type === 'trigger' && l.event_type === 'execute').forEach((l: any) => {
      const hour = new Date(l.created_at).getHours();
      const key = `${l.record_id}-${hour}`;
      if (!triggerHeatmapMap[key]) {
        triggerHeatmapMap[key] = {
          trigger_id: l.record_id,
          trigger_name: triggerNames[l.record_id] || 'Trigger Activation',
          hour,
          activation_count: 0
        };
      }
      triggerHeatmapMap[key].activation_count++;
    });
    const trigger_heatmap = Object.values(triggerHeatmapMap);

    // Provide default visual data if empty so graphs look "alive" for the demo
    if (workflow_timeline.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        workflow_timeline.push({
          date: d.toISOString().split('T')[0],
          executed: 10 + Math.floor(Math.random() * 15),
          failed: Math.floor(Math.random() * 3),
          pending: Math.floor(Math.random() * 5)
        });
      }
    }

    if (trigger_heatmap.length === 0) {
      const names = Object.values(triggerNames).slice(0, 3);
      if (names.length === 0) names.push('Safety Monitor', 'Load Balancer', 'Voltage Guard');

      names.forEach((name, idx) => {
        [4, 8, 12, 16, 20].forEach(h => {
          trigger_heatmap.push({
            trigger_id: `t-${idx}`,
            trigger_name: name,
            hour: h,
            activation_count: 5 + Math.floor(Math.random() * 20)
          });
        });
      });
    }

    if (audit_event_types.length === 0) {
      audit_event_types.push(
        { action: 'execute', count: 120 },
        { action: 'update', count: 45 },
        { action: 'create', count: 12 },
        { action: 'approve', count: 8 }
      );
    }

    if (approval_distribution.length === 0) {
      approval_distribution.push(
        { status: 'approved', count: 24 },
        { status: 'pending', count: 3 },
        { status: 'rejected', count: 2 }
      );
    }

    return {
      kpis: {
        active_workflows: workflowCount || 0,
        active_triggers: triggerCount || 0,
        pending_approvals: approvalCount || 0,
        recent_simulations: simulationCount || 0,
        active_alarm_rules: alarmCount || 0,
        recent_audit_events: auditCount || 0,
      },
      workflow_timeline,
      trigger_heatmap,
      approval_distribution,
      audit_event_types,
    };
  }


  async getAutomationAlerts(tenantId: string, filters?: ProcessAutomationFilters): Promise<AutomationAlert[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_automation_alerts').select('*').eq('tenant_id', resolvedTenantId);


    if (filters?.severity) query = query.eq('severity', filters.severity);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getTagMappings(tenantId: string, filters?: ProcessAutomationFilters): Promise<TagMapping[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_tag_mappings').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getControlModels(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlModel[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_control_models').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getActionBindings(tenantId: string, filters?: ProcessAutomationFilters): Promise<ActionBinding[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_action_bindings').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getTriggers(tenantId: string, filters?: ProcessAutomationFilters): Promise<Trigger[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_triggers').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAlarmRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<AlarmRule[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_alarm_rules').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getEventPatterns(tenantId: string, filters?: ProcessAutomationFilters): Promise<EventPattern[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_event_patterns').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getWorkflows(tenantId: string, filters?: ProcessAutomationFilters): Promise<Workflow[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_workflows').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getSequences(tenantId: string, filters?: ProcessAutomationFilters): Promise<Sequence[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_sequences').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getControlRules(tenantId: string, filters?: ProcessAutomationFilters): Promise<ControlRule[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_control_rules').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getVersions(tenantId: string, filters?: ProcessAutomationFilters): Promise<Version[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_versions').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getApprovals(tenantId: string, filters?: ProcessAutomationFilters): Promise<Approval[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_approvals').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSimulations(tenantId: string, filters?: ProcessAutomationFilters): Promise<Simulation[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_simulations').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getAuditLogs(tenantId: string, filters?: ProcessAutomationFilters): Promise<AuditLog[]> {
    this.ensureConnected();
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('pa_audit_logs').select('*').eq('tenant_id', resolvedTenantId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getActionBinding(id: string): Promise<ActionBinding | null> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('pa_action_bindings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('pa_workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async executeWorkflow(id: string): Promise<void> {
    this.ensureConnected();
    // Simulate execution by updating status
    const { error: startError } = await supabase!
      .from('pa_workflows')
      .update({
        execution_status: 'running',
        last_executed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (startError) throw startError;

    // In a real system, a backend worker would handle this.
    // For this prototype, we'll just simulate completion after a short delay.
    setTimeout(async () => {
      await supabase!
        .from('pa_workflows')
        .update({ execution_status: 'completed' })
        .eq('id', id);
    }, 2000);
  }

  async approveApproval(id: string, reviewedBy: string): Promise<Approval> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('pa_approvals')
      .update({
        status: 'approved',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectApproval(id: string, reviewedBy: string, reason: string): Promise<Approval> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('pa_approvals')
      .update({
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }


  // ============================================================================
  // Transmission Catalog (Cycle 1)

  // ============================================================================

  async getPropertySetsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { type?: string }
  ): Promise<ListResult<PropertySet>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;
    const sortBy = params?.sortBy ?? 'name';
    const sortDir = params?.sortDir ?? 'asc';

    // Build query
    let query = supabase!
      .from('property_sets')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply type filter if provided
    if (params?.type) {
      query = query.eq('type', params.type);
    }

    // Apply sorting
    const validSortFields = ['name', 'type', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getPropertySetsByTenant failed: ${error.message}`);
    }

    return {
      data: data.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        type: row.type as PropertySet['type'],
        fields: (row.fields || []) as PropertyField[],
        description: row.description,
        createdAt: row.created_at
      })),
      total: count || 0
    };
  }

  async getPropertySetById(id: string): Promise<PropertySet | null> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('property_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`getPropertySetById failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      type: data.type as PropertySet['type'],
      fields: (data.fields || []) as PropertyField[],
      description: data.description,
      createdAt: data.created_at
    };
  }

  async createPropertySet(data: Omit<PropertySet, 'id' | 'createdAt'>): Promise<PropertySet> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('property_sets')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        name: data.name,
        type: data.type,
        fields: data.fields,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Property set name '${data.name}' already exists`);
      }
      throw new Error(`createPropertySet failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      type: result.type as PropertySet['type'],
      fields: (result.fields || []) as PropertyField[],
      description: result.description,
      createdAt: result.created_at
    };
  }

  async getLifecycleStatesByCategory(tenantId: string, category: string): Promise<LifecycleState[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('lifecycle_states')
      .select('*')
      .eq('tenant_id', resolvedId)
      .eq('asset_category', category)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`getLifecycleStatesByCategory failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      assetCategory: row.asset_category,
      name: row.name,
      orderIndex: row.order_index,
      description: row.description,
      createdAt: row.created_at
    }));
  }

  async createLifecycleState(data: Omit<LifecycleState, 'id' | 'createdAt'>): Promise<LifecycleState> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('lifecycle_states')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        asset_category: data.assetCategory,
        name: data.name,
        order_index: data.orderIndex,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Lifecycle state '${data.name}' already exists for category '${data.assetCategory}' or order_index ${data.orderIndex} is already used`);
      }
      throw new Error(`createLifecycleState failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      assetCategory: result.asset_category,
      name: result.name,
      orderIndex: result.order_index,
      description: result.description,
      createdAt: result.created_at
    };
  }

  // ============================================================================
  // Transmission Discovery (Cycle 2)
  // ============================================================================

  async getTransmissionDiscoveryJobsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryJob>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;
    const sortBy = params?.sortBy ?? 'created_at';
    const sortDir = params?.sortDir ?? 'desc';

    // Build query
    let query = supabase!
      .from('discovery_jobs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply status filter if provided
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    // Apply sorting
    const validSortFields = ['name', 'type', 'status', 'created_at', 'last_run_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getTransmissionDiscoveryJobsByTenant failed: ${error.message}`);
    }

    return {
      data: data.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        type: row.type,
        scope: row.scope || {},
        status: row.status,
        foundCount: row.found_count || 0,
        lastRunAt: row.last_run_at,
        errors: row.errors,
        description: row.description,
        createdAt: row.created_at
      })),
      total: count || 0
    };
  }

  async createDiscoveryJob(
    data: Omit<import('@/types/transmission').DiscoveryJob, 'id' | 'createdAt' | 'foundCount'>
  ): Promise<import('@/types/transmission').DiscoveryJob> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('discovery_jobs')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        name: data.name,
        type: data.type,
        scope: data.scope,
        status: data.status,
        last_run_at: data.lastRunAt,
        errors: data.errors,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Discovery job name '${data.name}' already exists`);
      }
      throw new Error(`createDiscoveryJob failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      type: result.type,
      scope: result.scope || {},
      status: result.status,
      foundCount: result.found_count || 0,
      lastRunAt: result.last_run_at,
      errors: result.errors,
      description: result.description,
      createdAt: result.created_at
    };
  }

  async retryDiscoveryJob(jobId: string): Promise<import('@/types/transmission').DiscoveryJob> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('discovery_jobs')
      .update({
        status: 'pending',
        errors: null
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Discovery job not found: ${jobId}`);
      }
      throw new Error(`retryDiscoveryJob failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      type: result.type,
      scope: result.scope || {},
      status: result.status,
      foundCount: result.found_count || 0,
      lastRunAt: result.last_run_at,
      errors: result.errors,
      description: result.description,
      createdAt: result.created_at
    };
  }

  async getTransmissionDiscoveryAgentsByTenant(
    tenantId: string,
    params?: PaginationParams & { status?: string; type?: string }
  ): Promise<ListResult<import('@/types/transmission').DiscoveryAgent>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    // Build query
    let query = supabase!
      .from('discovery_agents')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply filters
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.type) {
      query = query.eq('type', params.type);
    }

    // Apply sorting
    query = query.order('name', { ascending: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getTransmissionDiscoveryAgentsByTenant failed: ${error.message}`);
    }

    return {
      data: data.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        type: row.type,
        protocols: row.protocols || [],
        status: row.status,
        assignedScopes: row.assigned_scopes || [],
        lastRun: row.last_run,
        description: row.description,
        createdAt: row.created_at
      })),
      total: count || 0
    };
  }

  async createDiscoveryAgent(
    data: Omit<import('@/types/transmission').DiscoveryAgent, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').DiscoveryAgent> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('discovery_agents')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        name: data.name,
        type: data.type,
        protocols: data.protocols,
        status: data.status,
        assigned_scopes: data.assignedScopes,
        last_run: data.lastRun,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Discovery agent name '${data.name}' already exists`);
      }
      throw new Error(`createDiscoveryAgent failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      type: result.type,
      protocols: result.protocols || [],
      status: result.status,
      assignedScopes: result.assigned_scopes || [],
      lastRun: result.last_run,
      description: result.description,
      createdAt: result.created_at
    };
  }

  async getTransmissionCandidateAssetsByJob(
    jobId: string,
    params?: PaginationParams & { status?: string }
  ): Promise<ListResult<import('@/types/transmission').CandidateAsset>> {
    this.ensureConnected();

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    // Build query with join to get asset type name
    let query = supabase!
      .from('candidate_assets')
      .select(`
        *,
        asset_types!suggested_type_id (
          name
        )
      `, { count: 'exact' })
      .eq('discovery_job_id', jobId);

    // Apply status filter if provided
    if (params?.status) {
      query = query.eq('status', params.status);
    }

    // Apply sorting
    query = query.order('confidence', { ascending: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getTransmissionCandidateAssetsByJob failed: ${error.message}`);
    }

    return {
      data: data.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        discoveryJobId: row.discovery_job_id,
        suggestedName: row.suggested_name,
        suggestedTypeId: row.suggested_type_id,
        suggestedTypeName: row.asset_types?.name,
        suggestedHierarchy: row.suggested_hierarchy || {},
        matchedExistingAssetId: row.matched_existing_asset_id,
        confidence: parseFloat(row.confidence),
        status: row.status,
        rawData: row.raw_data,
        createdAt: row.created_at
      })),
      total: count || 0
    };
  }

  async approveCandidateAsset(
    candidateId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    this.ensureConnected();

    // Get candidate asset
    const { data: candidate, error: candidateError } = await supabase!
      .from('candidate_assets')
      .select(`
        *,
        asset_types!suggested_type_id (
          code,
          name
        )
      `)
      .eq('id', candidateId)
      .single();

    if (candidateError) {
      throw new Error(`approveCandidateAsset failed: ${candidateError.message}`);
    }

    // Get a site ID (use first available site for the tenant)
    const { data: site } = await supabase!
      .from('sites')
      .select('id')
      .eq('tenant_id', candidate.tenant_id)
      .limit(1)
      .single();

    if (!site) {
      throw new Error('No site found for tenant');
    }

    // Create new asset
    const { data: newAsset, error: assetError } = await supabase!
      .from('assets')
      .insert({
        tenant_id: candidate.tenant_id,
        site_id: site.id,
        asset_type_id: candidate.suggested_type_id,
        name: candidate.suggested_name,
        status: 'online',
        criticality: 'medium',
        properties: candidate.raw_data || {}
      })
      .select()
      .single();

    if (assetError) {
      throw new Error(`approveCandidateAsset failed to create asset: ${assetError.message}`);
    }

    // Update candidate status
    const { data: updatedCandidate, error: updateError } = await supabase!
      .from('candidate_assets')
      .update({ status: 'approved' })
      .eq('id', candidateId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`approveCandidateAsset failed to update candidate: ${updateError.message}`);
    }

    return {
      asset: {
        id: newAsset.id,
        tenantId: newAsset.tenant_id,
        siteId: newAsset.site_id,
        assetTypeId: newAsset.asset_type_id,
        assetTypeCode: candidate.asset_types?.code || '',
        assetTypeName: candidate.asset_types?.name || '',
        name: newAsset.name,
        status: newAsset.status,
        criticality: newAsset.criticality,
        parentAssetId: newAsset.parent_asset_id,
        properties: newAsset.properties || {}
      },
      candidate: {
        id: updatedCandidate.id,
        tenantId: updatedCandidate.tenant_id,
        discoveryJobId: updatedCandidate.discovery_job_id,
        suggestedName: updatedCandidate.suggested_name,
        suggestedTypeId: updatedCandidate.suggested_type_id,
        suggestedTypeName: candidate.asset_types?.name,
        suggestedHierarchy: updatedCandidate.suggested_hierarchy || {},
        matchedExistingAssetId: updatedCandidate.matched_existing_asset_id,
        confidence: parseFloat(updatedCandidate.confidence),
        status: updatedCandidate.status,
        rawData: updatedCandidate.raw_data,
        createdAt: updatedCandidate.created_at
      }
    };
  }

  async mergeCandidateAsset(
    candidateId: string,
    targetAssetId: string
  ): Promise<{ asset: TransmissionAsset; candidate: import('@/types/transmission').CandidateAsset }> {
    this.ensureConnected();

    // Get candidate asset
    const { data: candidate, error: candidateError } = await supabase!
      .from('candidate_assets')
      .select(`
        *,
        asset_types!suggested_type_id (
          name
        )
      `)
      .eq('id', candidateId)
      .single();

    if (candidateError) {
      throw new Error(`mergeCandidateAsset failed: ${candidateError.message}`);
    }

    // Get target asset
    const { data: targetAsset, error: targetError } = await supabase!
      .from('assets')
      .select(`
        *,
        asset_types!asset_type_id (
          code,
          name
        )
      `)
      .eq('id', targetAssetId)
      .single();

    if (targetError) {
      throw new Error(`mergeCandidateAsset failed to get target asset: ${targetError.message}`);
    }

    // Merge properties
    const mergedProperties = {
      ...targetAsset.properties,
      ...candidate.raw_data
    };

    // Update target asset
    const { data: updatedAsset, error: updateAssetError } = await supabase!
      .from('assets')
      .update({ properties: mergedProperties })
      .eq('id', targetAssetId)
      .select()
      .single();

    if (updateAssetError) {
      throw new Error(`mergeCandidateAsset failed to update asset: ${updateAssetError.message}`);
    }

    // Update candidate status
    const { data: updatedCandidate, error: updateCandidateError } = await supabase!
      .from('candidate_assets')
      .update({ status: 'merged' })
      .eq('id', candidateId)
      .select()
      .single();

    if (updateCandidateError) {
      throw new Error(`mergeCandidateAsset failed to update candidate: ${updateCandidateError.message}`);
    }

    return {
      asset: {
        id: updatedAsset.id,
        tenantId: updatedAsset.tenant_id,
        siteId: updatedAsset.site_id,
        assetTypeId: updatedAsset.asset_type_id,
        assetTypeCode: targetAsset.asset_types?.code || '',
        assetTypeName: targetAsset.asset_types?.name || '',
        name: updatedAsset.name,
        status: updatedAsset.status,
        criticality: updatedAsset.criticality,
        parentAssetId: updatedAsset.parent_asset_id,
        properties: updatedAsset.properties || {}
      },
      candidate: {
        id: updatedCandidate.id,
        tenantId: updatedCandidate.tenant_id,
        discoveryJobId: updatedCandidate.discovery_job_id,
        suggestedName: updatedCandidate.suggested_name,
        suggestedTypeId: updatedCandidate.suggested_type_id,
        suggestedTypeName: candidate.asset_types?.name,
        suggestedHierarchy: updatedCandidate.suggested_hierarchy || {},
        matchedExistingAssetId: updatedCandidate.matched_existing_asset_id,
        confidence: parseFloat(updatedCandidate.confidence),
        status: updatedCandidate.status,
        rawData: updatedCandidate.raw_data,
        createdAt: updatedCandidate.created_at
      }
    };
  }

  async rejectCandidateAsset(
    candidateId: string
  ): Promise<import('@/types/transmission').CandidateAsset> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('candidate_assets')
      .update({ status: 'rejected' })
      .eq('id', candidateId)
      .select(`
        *,
        asset_types!suggested_type_id (
          name
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Candidate asset not found: ${candidateId}`);
      }
      throw new Error(`rejectCandidateAsset failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      discoveryJobId: result.discovery_job_id,
      suggestedName: result.suggested_name,
      suggestedTypeId: result.suggested_type_id,
      suggestedTypeName: result.asset_types?.name,
      suggestedHierarchy: result.suggested_hierarchy || {},
      matchedExistingAssetId: result.matched_existing_asset_id,
      confidence: parseFloat(result.confidence),
      status: result.status,
      rawData: result.raw_data,
      createdAt: result.created_at
    };
  }

  async getAssetImportsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetImport>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    // Build query
    const query = supabase!
      .from('asset_imports')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getAssetImportsByTenant failed: ${error.message}`);
    }

    return {
      data: data.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        status: row.status,
        sourceType: row.source_type,
        recordCount: row.record_count || 0,
        importedCount: row.imported_count || 0,
        errors: row.errors,
        createdAt: row.created_at,
        completedAt: row.completed_at
      })),
      total: count || 0
    };
  }

  async createAssetImport(
    data: Omit<import('@/types/transmission').AssetImport, 'id' | 'createdAt' | 'importedCount'>
  ): Promise<import('@/types/transmission').AssetImport> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('asset_imports')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        name: data.name,
        status: data.status,
        source_type: data.sourceType,
        record_count: data.recordCount,
        errors: data.errors,
        completed_at: data.completedAt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`createAssetImport failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      status: result.status,
      sourceType: result.source_type,
      recordCount: result.record_count || 0,
      importedCount: result.imported_count || 0,
      errors: result.errors,
      createdAt: result.created_at,
      completedAt: result.completed_at
    };
  }

  // ============================================================================
  // Manual Asset Creation (Cycle 2)
  // ============================================================================

  async getAssetTypesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; code: string; name: string; category: string; properties_schema: any; created_at: string }>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('asset_types')
      .select('id, code, name, category, properties_schema, created_at')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getAssetTypesByTenant failed: ${error.message}`);
    }

    return data || [];
  }

  async getSitesByTenant(
    tenantId: string
  ): Promise<Array<{ id: string; name: string }>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('sites')
      .select('id, name')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getSitesByTenant failed: ${error.message}`);
    }

    return data || [];
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
    this.ensureConnected();

    const resolvedId = await this.resolveTenantId(data.tenantId);

    // Check if asset name already exists for this tenant
    const { data: existing } = await supabase!
      .from('assets')
      .select('id')
      .eq('tenant_id', resolvedId)
      .eq('name', data.name)
      .single();

    if (existing) {
      throw new Error(`Asset name '${data.name}' already exists`);
    }

    // Get asset type details
    const { data: assetType, error: typeError } = await supabase!
      .from('asset_types')
      .select('code, name')
      .eq('id', data.assetTypeId)
      .single();

    if (typeError || !assetType) {
      throw new Error(`Asset type not found: ${data.assetTypeId}`);
    }

    // Create the asset
    const { data: result, error } = await supabase!
      .from('assets')
      .insert({
        tenant_id: resolvedId,
        site_id: data.siteId,
        asset_type_id: data.assetTypeId,
        name: data.name,
        status: data.status || 'online',
        criticality: data.criticality || 'medium',
        properties: data.properties || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`createTransmissionAsset failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      siteId: result.site_id,
      assetTypeId: result.asset_type_id,
      assetTypeCode: assetType.code,
      assetTypeName: assetType.name,
      name: result.name,
      status: result.status,
      criticality: result.criticality,
      parentAssetId: result.parent_asset_id,
      properties: result.properties || {}
    };
  }

  // ============================================================================
  // Cycle 3: Location & Topology Methods
  // ============================================================================

  /**
   * Get linear asset issues for a specific grid line
   * Requirements: 6.6, 6.7, 8.1, 8.2, 8.4
   */
  async getLinearAssetIssues(
    lineId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>> {
    this.ensureConnected();

    const limit = params?.limit || 25;
    const offset = params?.offset || 0;

    let query = supabase!
      .from('linear_asset_issues')
      .select('*, grid_lines!inner(name)', { count: 'exact' })
      .eq('grid_line_id', lineId);

    // Apply filters
    if (params?.severity) {
      query = query.eq('severity', params.severity);
    }

    if (params?.resolved !== undefined) {
      if (params.resolved) {
        query = query.not('resolved_at', 'is', null);
      } else {
        query = query.is('resolved_at', null);
      }
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getLinearAssetIssues failed: ${error.message}`);
    }

    const issues = (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      gridLineId: row.grid_line_id,
      gridLineName: row.grid_lines?.name,
      type: row.type,
      description: row.description,
      severity: row.severity,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at
    }));

    return {
      data: issues,
      total: count || 0
    };
  }

  /**
   * Get linear asset issues for a tenant
   * Requirements: 6.6, 6.7, 8.1, 8.2, 8.4
   */
  async getLinearAssetIssuesByTenant(
    tenantId: string,
    params?: PaginationParams & { severity?: string; resolved?: boolean }
  ): Promise<ListResult<import('@/types/transmission').LinearAssetIssue>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit || 25;
    const offset = params?.offset || 0;

    let query = supabase!
      .from('linear_asset_issues')
      .select('*, grid_lines!inner(name)', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply filters
    if (params?.severity) {
      query = query.eq('severity', params.severity);
    }

    if (params?.resolved !== undefined) {
      if (params.resolved) {
        query = query.not('resolved_at', 'is', null);
      } else {
        query = query.is('resolved_at', null);
      }
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getLinearAssetIssuesByTenant failed: ${error.message}`);
    }

    const issues = (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      gridLineId: row.grid_line_id,
      gridLineName: row.grid_lines?.name,
      type: row.type,
      description: row.description,
      severity: row.severity,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at
    }));

    return {
      data: issues,
      total: count || 0
    };
  }

  /**
   * Create a new linear asset issue
   * Requirements: 6.7, 8.1, 8.2
   */
  async createLinearAssetIssue(
    data: Omit<import('@/types/transmission').LinearAssetIssue, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    this.ensureConnected();

    const resolvedId = await this.resolveTenantId(data.tenantId);

    // Validate description length (min 10 chars)
    if (data.description.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }

    // Get grid line name for response
    const { data: gridLine, error: lineError } = await supabase!
      .from('grid_lines')
      .select('name')
      .eq('id', data.gridLineId)
      .single();

    if (lineError || !gridLine) {
      throw new Error(`Grid line not found: ${data.gridLineId}`);
    }

    const { data: result, error } = await supabase!
      .from('linear_asset_issues')
      .insert({
        tenant_id: resolvedId,
        grid_line_id: data.gridLineId,
        type: data.type,
        description: data.description,
        severity: data.severity,
        resolved_at: data.resolvedAt || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`createLinearAssetIssue failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      gridLineId: result.grid_line_id,
      gridLineName: gridLine.name,
      type: result.type,
      description: result.description,
      severity: result.severity,
      createdAt: result.created_at,
      resolvedAt: result.resolved_at
    };
  }

  /**
   * Resolve a linear asset issue
   * Requirements: 6.7, 8.1, 8.2
   */
  async resolveLinearAssetIssue(
    issueId: string
  ): Promise<import('@/types/transmission').LinearAssetIssue> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('linear_asset_issues')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', issueId)
      .select('*, grid_lines!inner(name)')
      .single();

    if (error) {
      throw new Error(`resolveLinearAssetIssue failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      gridLineId: result.grid_line_id,
      gridLineName: result.grid_lines?.name,
      type: result.type,
      description: result.description,
      severity: result.severity,
      createdAt: result.created_at,
      resolvedAt: result.resolved_at
    };
  }

  // ============================================================================
  // Transmission Connectivity (Cycle 4)
  // ============================================================================

  /**
   * Get connection endpoints for a tenant with pagination, sorting, and filtering
   * Requirements: 4.1, 4.2, 4.4, 8.1, 8.2, 8.4, 8.5
   */
  async getTransmissionConnectionEndpointsByTenant(
    tenantId: string,
    params?: PaginationParams & SortParams & { protocol?: string; status?: string; zone?: string }
  ): Promise<ListResult<import('@/types/transmission').ConnectionEndpoint>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;
    const sortBy = params?.sortBy ?? 'name';
    const sortDir = params?.sortDir ?? 'asc';

    let query = supabase!
      .from('connection_endpoints')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply filters
    if (params?.protocol) {
      query = query.eq('protocol', params.protocol);
    }
    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.zone) {
      query = query.eq('zone', params.zone);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortDir === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getTransmissionConnectionEndpointsByTenant failed: ${error.message}`);
    }

    return {
      data: (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        protocol: row.protocol,
        address: row.address,
        port: row.port,
        zone: row.zone,
        hazardousArea: row.hazardous_area,
        status: row.status,
        lastSeen: row.last_seen,
        description: row.description,
        createdAt: row.created_at
      })),
      total: count ?? 0
    };
  }

  /**
   * Create a new connection endpoint
   * Requirements: 4.3, 8.1, 8.2
   */
  async createConnectionEndpoint(
    data: Omit<import('@/types/transmission').ConnectionEndpoint, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    this.ensureConnected();

    const resolvedId = await this.resolveTenantId(data.tenantId);

    const { data: result, error } = await supabase!
      .from('connection_endpoints')
      .insert({
        tenant_id: resolvedId,
        name: data.name,
        protocol: data.protocol,
        address: data.address,
        port: data.port,
        zone: data.zone,
        hazardous_area: data.hazardousArea,
        status: data.status,
        last_seen: data.lastSeen,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Connection endpoint name '${data.name}' already exists`);
      }
      throw new Error(`createConnectionEndpoint failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      protocol: result.protocol,
      address: result.address,
      port: result.port,
      zone: result.zone,
      hazardousArea: result.hazardous_area,
      status: result.status,
      lastSeen: result.last_seen,
      description: result.description,
      createdAt: result.created_at
    };
  }

  /**
   * Update connection endpoint status
   * Requirements: 4.11, 8.1, 8.2
   */
  async updateConnectionEndpointStatus(
    id: string,
    status: 'up' | 'down' | 'unknown'
  ): Promise<import('@/types/transmission').ConnectionEndpoint> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('connection_endpoints')
      .update({
        status,
        last_seen: status === 'up' ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`updateConnectionEndpointStatus failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      protocol: result.protocol,
      address: result.address,
      port: result.port,
      zone: result.zone,
      hazardousArea: result.hazardous_area,
      status: result.status,
      lastSeen: result.last_seen,
      description: result.description,
      createdAt: result.created_at
    };
  }

  /**
   * Get stream configs for a tenant with pagination and filtering
   * Requirements: 4.7, 4.8, 8.1, 8.2, 8.4
   */
  async getStreamConfigsByTenant(
    tenantId: string,
    params?: PaginationParams & { profile?: string }
  ): Promise<ListResult<import('@/types/transmission').StreamConfig>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    let query = supabase!
      .from('stream_configs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId);

    // Apply filter
    if (params?.profile) {
      query = query.eq('profile', params.profile);
    }

    // Apply sorting
    query = query.order('name', { ascending: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getStreamConfigsByTenant failed: ${error.message}`);
    }

    return {
      data: (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        pollingInterval: row.polling_interval,
        retention: row.retention,
        profile: row.profile,
        assetTypes: row.asset_types || [],
        isSandbox: row.is_sandbox,
        description: row.description,
        createdAt: row.created_at
      })),
      total: count ?? 0
    };
  }

  /**
   * Create a new stream config
   * Requirements: 4.7, 4.8, 8.1, 8.2
   */
  async createStreamConfig(
    data: Omit<import('@/types/transmission').StreamConfig, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').StreamConfig> {
    this.ensureConnected();

    const resolvedId = await this.resolveTenantId(data.tenantId);

    const { data: result, error } = await supabase!
      .from('stream_configs')
      .insert({
        tenant_id: resolvedId,
        name: data.name,
        polling_interval: data.pollingInterval,
        retention: data.retention,
        profile: data.profile,
        asset_types: data.assetTypes,
        is_sandbox: data.isSandbox,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Stream config name '${data.name}' already exists`);
      }
      throw new Error(`createStreamConfig failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      pollingInterval: result.polling_interval,
      retention: result.retention,
      profile: result.profile,
      assetTypes: result.asset_types || [],
      isSandbox: result.is_sandbox,
      description: result.description,
      createdAt: result.created_at
    };
  }

  // ============================================================================
  // Transmission Portfolio Management (Cycle 5)
  // ============================================================================

  /**
   * Get saved views for a tenant with pagination
   * Requirements: 3.7, 8.1, 8.4
   */
  async getSavedViewsByTenant(
    tenantId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').SavedView>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit || 25;
    const offset = params?.offset || 0;

    // Get total count
    const { count, error: countError } = await supabase!
      .from('saved_views')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', resolvedId);

    if (countError) {
      throw new Error(`getSavedViewsByTenant count failed: ${countError.message}`);
    }

    // Get data with pagination
    const { data, error } = await supabase!
      .from('saved_views')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`getSavedViewsByTenant failed: ${error.message}`);
    }

    return {
      data: (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        filters: row.filters,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total: count || 0
    };
  }

  // ============================================================================
  // Overview & Platform Health (Phase 6)
  // ============================================================================

  /**
   * Get overview KPIs for a tenant (aggregated from v_overview_kpis)
   * Requirements: 6.1
   */
  async getOverviewKPIs(tenantId: string): Promise<DashboardKPIs> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('v_overview_kpis')
      .select('*')
      .eq('tenant_id', resolvedId)
      .single();

    if (error) {
      // Fallback if view doesn't exist or returns error
      return {
        activeAlertsCount: 0,
        openWorkItemsCount: 0,
        integrationHealthScore: 0,
        dataFreshnessScore: 0,
        platformHealthScore: 0
      };
    }

    return {
      activeAlertsCount: data.active_alerts_count || 0,
      openWorkItemsCount: data.open_work_items_count || 0,
      integrationHealthScore: data.integration_health_score || 0,
      dataFreshnessScore: data.data_freshness_score || 0,
      platformHealthScore: data.platform_health_score || 0
    };
  }

  /**
   * Get dashboards for a tenant
   * Requirements: 2.1
   */
  async getDashboards(tenantId: string): Promise<OverviewDashboard[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('overview_dashboards')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getDashboards failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      presetType: row.preset_type,
      isDefault: row.is_default,
      scopeDefaults: row.scope_defaults,
      createdAt: row.created_at
    }));
  }

  /**
   * Get work items for a tenant
   * Requirements: 3.1
   */
  async getWorkItems(tenantId: string, params?: PaginationParams): Promise<ListResult<WorkItem>> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const limit = params?.limit ?? 25;
    const offset = params?.offset ?? 0;

    const { data, error, count } = await supabase!
      .from('work_items')
      .select('*', { count: 'exact' })
      .eq('tenant_id', resolvedId)
      .order('due_at', { ascending: true, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`getWorkItems failed: ${error.message}`);
    }

    return {
      data: (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        title: row.title,
        type: row.type as WorkItem['type'],
        status: row.status as WorkItem['status'],
        priority: row.priority as WorkItem['priority'],
        assignedToUserId: row.assigned_to_user_id,
        dueAt: row.due_at,
        sourceFeatureArea: row.source_feature_area,
        sourceTable: row.source_table,
        sourceId: row.source_id,
        deeplinkPath: row.deeplink_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total: count ?? 0
    };
  }

  /**
   * SAVED VIEWS & NOTIFICATIONS
   */
  async getSavedViewById(id: string): Promise<import('@/types/transmission').SavedView | null> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('saved_views')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`getSavedViewById failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      filters: data.filters,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  /**
   * Create a new saved view
   * Requirements: 3.7, 8.1, 8.2
   */
  async createSavedView(
    data: Omit<import('@/types/transmission').SavedView, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<import('@/types/transmission').SavedView> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('saved_views')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        name: data.name,
        filters: data.filters,
        description: data.description
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error(`Saved view name '${data.name}' already exists`);
      }
      throw new Error(`createSavedView failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      filters: result.filters,
      description: result.description,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  /**
   * Get notifications for a user
   * Requirements: 3.2
   */
  async getNotifications(tenantId: string, userId: string): Promise<NotificationItem[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('notifications')
      .select('*')
      .eq('tenant_id', resolvedId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`getNotifications failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      type: row.type,
      payload: row.payload || {},
      createdAt: row.created_at,
      readAt: row.read_at
    }));
  }

  /**
   * Get operational exceptions
   * Requirements: 2.3
   */
  async getOverviewExceptions(tenantId: string): Promise<OverviewException[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('overview_exceptions')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('severity', { ascending: false });

    if (error) {
      throw new Error(`getOverviewExceptions failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      exceptionType: row.exception_type,
      severity: row.severity as OverviewException['severity'],
      title: row.title,
      description: row.description,
      ownerTeamId: row.owner_team_id,
      dueDate: row.due_date,
      status: row.status as OverviewException['status'],
      sourceRef: row.source_ref,
      createdAt: row.created_at
    }));
  }

  /**
   * Get platform health findings
   * Requirements: 4.2
   */
  async getPlatformHealthFindings(tenantId: string): Promise<PlatformHealthFinding[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('platform_health_findings')
      .select('*')
      .eq('tenant_id', resolvedId)
      .eq('status', 'open')
      .order('severity', { ascending: false });

    if (error) {
      throw new Error(`getPlatformHealthFindings failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      checkKey: row.check_key,
      severity: row.severity as PlatformHealthFinding['severity'],
      status: row.status as PlatformHealthFinding['status'],
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      details: row.details,
      resolvedAt: row.resolved_at
    }));
  }

  /**
   * Get data stream freshness status per site
   * Requirements: 7.3
   */
  async getDataStreamStatus(tenantId: string): Promise<DataStreamStatus[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('v_overview_data_freshness')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('staleness_minutes', { ascending: false });

    if (error) {
      throw new Error(`getDataStreamStatus failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      tenantId: row.tenant_id,
      siteId: row.site_id,
      streamId: row.stream_id,
      lastTelemetryAt: row.last_telemetry_at,
      stalenessMinutes: row.staleness_minutes,
      status: row.status as DataStreamStatus['status']
    }));
  }

  /**
   * Get advisor cards
   * Requirements: 5.2
   */
  async getAdvisorCards(tenantId: string): Promise<AdvisorCard[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('advisor_cards')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('severity', { ascending: false });

    if (error) {
      throw new Error(`getAdvisorCards failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      cardKey: row.card_key,
      title: row.title,
      severity: row.severity as AdvisorCard['severity'],
      rationale: row.rationale,
      recommendedAction: row.recommended_action,
      deeplinkPath: row.deeplink_path,
      params: row.params,
      createdAt: row.created_at
    }));
  }

  /**
   * Update a work item status
   * Requirements: 3.1
   */
  async updateWorkItem(id: string, data: Partial<WorkItem>): Promise<WorkItem> {
    this.ensureConnected();

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedToUserId) updateData.assigned_to_user_id = data.assignedToUserId;
    if (data.dueAt) updateData.due_at = data.dueAt;

    updateData.updated_at = new Date().toISOString();

    const { data: result, error } = await supabase!
      .from('work_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`updateWorkItem failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      title: result.title,
      type: result.type as WorkItem['type'],
      status: result.status as WorkItem['status'],
      priority: result.priority as WorkItem['priority'],
      assignedToUserId: result.assigned_to_user_id,
      dueAt: result.due_at,
      sourceFeatureArea: result.source_feature_area,
      sourceTable: result.source_table,
      sourceId: result.source_id,
      deeplinkPath: result.deeplink_path,
      createdAt: result.created_at,
      updatedAt: result.updated_at
    };
  }

  /**
   * Delete a saved view
   * Requirements: 3.8, 8.1
   */
  async deleteSavedView(id: string): Promise<void> {
    this.ensureConnected();

    const { error } = await supabase!
      .from('saved_views')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`deleteSavedView failed: ${error.message}`);
    }
  }

  /**
   * Get asset portfolio KPIs for a tenant with optional filters
   * Requirements: 3.1, 8.1, 8.2
   */
  async getAssetPortfolioKpis(
    tenantId: string,
    filters?: import('@/types/transmission').AssetFilter
  ): Promise<import('@/types/transmission').PortfolioKpis> {
    this.ensureConnected();

    // Build base query with filters
    let assetsQuery = supabase!
      .from('assets')
      .select(`
        id,
        status,
        criticality,
        site_id,
        asset_type_id,
        name,
        sites!inner(name),
        asset_types!inner(name, code)
      `)
      .eq('tenant_id', await this.resolveTenantId(tenantId));

    // Apply filters
    if (filters?.siteId) {
      assetsQuery = assetsQuery.eq('site_id', filters.siteId);
    }
    if (filters?.assetTypeId) {
      assetsQuery = assetsQuery.eq('asset_type_id', filters.assetTypeId);
    }
    if (filters?.status) {
      assetsQuery = assetsQuery.eq('status', filters.status);
    }
    if (filters?.criticality) {
      assetsQuery = assetsQuery.eq('criticality', filters.criticality);
    }
    if (filters?.search) {
      assetsQuery = assetsQuery.ilike('name', `%${filters.search}%`);
    }

    const { data: assets, error: assetsError } = await assetsQuery;

    if (assetsError) {
      throw new Error(`getAssetPortfolioKpis assets query failed: ${assetsError.message}`);
    }

    // Get alerts count
    const { data: alerts, error: alertsError } = await supabase!
      .from('alerts')
      .select('severity')
      .eq('tenant_id', await this.resolveTenantId(tenantId))
      .in('status', ['open', 'acknowledged', 'in-progress']);

    if (alertsError) {
      throw new Error(`getAssetPortfolioKpis alerts query failed: ${alertsError.message}`);
    }

    // Calculate KPIs
    const totalAssets = assets.length;
    const onlineAssets = assets.filter(a => a.status === 'online').length;
    const offlineAssets = assets.filter(a => a.status === 'offline').length;
    const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

    const assetsByType: Record<string, number> = {};
    const assetsBySite: Record<string, number> = {};

    assets.forEach(asset => {
      const typeName = (Array.isArray(asset.asset_types) ? asset.asset_types[0]?.name : (asset.asset_types as any)?.name) || 'Unknown';
      const siteName = (Array.isArray(asset.sites) ? asset.sites[0]?.name : (asset.sites as any)?.name) || 'Unknown';

      assetsByType[typeName] = (assetsByType[typeName] || 0) + 1;
      assetsBySite[siteName] = (assetsBySite[siteName] || 0) + 1;
    });

    return {
      totalAssets,
      onlineAssets,
      offlineAssets,
      maintenanceAssets,
      criticalAlerts,
      warningAlerts,
      assetsByType,
      assetsBySite
    };
  }

  /**
   * Mark a notification as read
   * Requirements: 3.2
   */
  async markNotificationRead(id: string): Promise<NotificationItem> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`markNotificationRead failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      userId: result.user_id,
      type: result.type,
      payload: result.payload || {},
      createdAt: result.created_at,
      readAt: result.read_at
    };
  }

  // ============================================================================
  // Transmission Asset Detail (Cycle 6)
  // ============================================================================

  /**
   * Get documents for an asset
   * Requirements: 5.5, 8.1, 8.2
   */
  async getAssetDocuments(assetId: string): Promise<import('@/types/transmission').AssetDocument[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('asset_documents')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`getAssetDocuments failed: ${error.message}`);
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      assetId: row.asset_id,
      name: row.name,
      category: row.category,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      description: row.description,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at
    }));
  }

  // ============================================================================
  // Settings & Identity (Phase 6)
  // ============================================================================

  /**
   * Get tenant profile
   * Requirements: 1.1
   */
  async getTenantProfile(tenantId: string): Promise<OrganizationProfile | null> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('tenant_profile')
      .select('*, tenants(name, sector, subsector, scenario_tag)')
      .eq('tenant_id', resolvedId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`getTenantProfile failed: ${error.message}`);
    }

    return {
      tenantId: data.tenant_id,
      logoUrl: data.logo_url,
      region: data.region,
      timezone: data.timezone,
      currencyCode: data.currency_code,
      regulatoryProfile: data.regulatory_profile
    };
  }

  /**
   * Update tenant profile
   * Requirements: 1.1
   */
  async updateTenantProfile(tenantId: string, data: Partial<OrganizationProfile>): Promise<OrganizationProfile> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const updateData: any = {};
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.currencyCode !== undefined) updateData.currency_code = data.currencyCode;
    if (data.regulatoryProfile !== undefined) updateData.regulatory_profile = data.regulatoryProfile;

    const { data: result, error } = await supabase!
      .from('tenant_profile')
      .update(updateData)
      .eq('tenant_id', resolvedId)
      .select()
      .single();

    if (error) {
      throw new Error(`updateTenantProfile failed: ${error.message}`);
    }

    return {
      tenantId: result.tenant_id,
      logoUrl: result.logo_url,
      region: result.region,
      timezone: result.timezone,
      currencyCode: result.currency_code,
      regulatoryProfile: result.regulatory_profile
    };
  }

  /**
   * Get streams
   * Requirements: 1.2
   */
  async getStreams(tenantId: string): Promise<Stream[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('streams')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getStreams failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      code: row.code,
      name: row.name,
      kind: row.kind,
      status: row.status as Stream['status'],
      isDefault: row.is_default,
      createdAt: row.created_at
    }));
  }

  /**
   * Create/upload a new asset document
   * Requirements: 5.5, 8.1, 8.2
   */
  async createAssetDocument(
    data: Omit<import('@/types/transmission').AssetDocument, 'id' | 'createdAt'>
  ): Promise<import('@/types/transmission').AssetDocument> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('asset_documents')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        asset_id: data.assetId,
        name: data.name,
        category: data.category,
        file_path: data.filePath,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        description: data.description,
        uploaded_by: data.uploadedBy
      })
      .select()
      .single();

    if (error) {
      throw new Error(`createAssetDocument failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      assetId: result.asset_id,
      name: result.name,
      category: result.category,
      filePath: result.file_path,
      fileSize: result.file_size,
      mimeType: result.mime_type,
      description: result.description,
      uploadedBy: result.uploaded_by,
      createdAt: result.created_at
    };
  }

  async getPrograms(tenantId: string): Promise<Program[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('programs')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getPrograms failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  async getNamingStandards(tenantId: string): Promise<import('@/types/settings').NamingStandard | null> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('naming_standards')
      .select('*')
      .eq('tenant_id', resolvedId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`getNamingStandards failed: ${error.message}`);
    }

    return {
      tenantId: data.tenant_id,
      rules: data.rules
    };
  }

  async updateNamingStandards(tenantId: string, standards: import('@/types/settings').NamingStandard): Promise<import('@/types/settings').NamingStandard> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data: result, error } = await supabase!
      .from('naming_standards')
      .upsert({
        tenant_id: resolvedId,
        rules: standards.rules
      })
      .select()
      .single();

    if (error) {
      throw new Error(`updateNamingStandards failed: ${error.message}`);
    }

    return {
      tenantId: result.tenant_id,
      rules: result.rules
    };
  }

  /**
   * Get user profiles
   * Requirements: 1.5
   */
  async getUserProfiles(tenantId: string): Promise<UserProfile[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('user_profiles')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('display_name');

    if (error) {
      throw new Error(`getUserProfiles failed: ${error.message}`);
    }

    return data.map(row => ({
      userId: row.user_id,
      tenantId: row.tenant_id,
      displayName: row.display_name,
      personaLabel: row.persona_label,
      preferences: row.preferences,
      createdAt: row.created_at
    }));
  }

  /**
   * Update user profile
   * Requirements: 1.5
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    this.ensureConnected();

    const updateData: any = {};
    if (data.displayName) updateData.display_name = data.displayName;
    if (data.personaLabel) updateData.persona_label = data.personaLabel;
    if (data.preferences) updateData.preferences = data.preferences;

    const { data: result, error } = await supabase!
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`updateUserProfile failed: ${error.message}`);
    }

    return {
      userId: result.user_id,
      tenantId: result.tenant_id,
      displayName: result.display_name,
      personaLabel: result.persona_label,
      preferences: result.preferences,
      createdAt: result.created_at
    };
  }

  /**
   * Get audit log for an asset with pagination
   * Requirements: 5.6, 8.1, 8.4
   */
  async getAssetAuditLog(
    assetId: string,
    params?: PaginationParams
  ): Promise<ListResult<import('@/types/transmission').AssetAuditLog>> {
    this.ensureConnected();

    const limit = params?.limit || 25;
    const offset = params?.offset || 0;

    const query = supabase!
      .from('asset_audit_log')
      .select('*', { count: 'exact' })
      .eq('asset_id', assetId)
      .order('performed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`getAssetAuditLog failed: ${error.message}`);
    }

    return {
      data: (data || []).map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        assetId: row.asset_id,
        action: row.action,
        changedFields: row.changed_fields || [],
        oldValues: row.old_values,
        newValues: row.new_values,
        userId: row.user_id,
        performedAt: row.performed_at,
        details: row.details
      })),
      total: count || 0
    };
  }

  async createAssetAuditLog(
    data: Omit<import('@/types/transmission').AssetAuditLog, 'id' | 'performedAt'>
  ): Promise<import('@/types/transmission').AssetAuditLog> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('asset_audit_log')
      .insert({
        tenant_id: await this.resolveTenantId(data.tenantId),
        asset_id: data.assetId,
        action: data.action,
        changed_fields: data.changedFields,
        old_values: data.oldValues,
        new_values: data.newValues,
        user_id: data.userId,
        details: data.details
      })
      .select()
      .single();

    if (error) {
      throw new Error(`createAssetAuditLog failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      assetId: result.asset_id,
      action: result.action,
      changedFields: result.changed_fields || [],
      oldValues: result.old_values,
      newValues: result.new_values,
      userId: result.user_id,
      performedAt: result.performed_at,
      details: result.details
    };
  }

  /**
   * Get teams
   * Requirements: 1.4
   */
  async getTeams(tenantId: string): Promise<Team[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);

    const { data, error } = await supabase!
      .from('teams')
      .select('*')
      .eq('tenant_id', resolvedId)
      .order('name');

    if (error) {
      throw new Error(`getTeams failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      onCallLabel: row.on_call_label,
      createdAt: row.created_at
    }));
  }

  /**
   * Get integration instances
   * Requirements: 5.1
   */
  async getIntegrations(tenantId: string): Promise<IntegrationInstance[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('integrations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      throw new Error(`getIntegrations failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      typeCode: row.type_code,
      name: row.name,
      status: row.status as IntegrationInstance['status'],
      lastSyncAt: row.last_sync_at,
      config: row.config
    }));
  }

  /**
   * Update integration instance
   * Requirements: 5.1
   */
  async updateIntegration(id: string, data: Partial<IntegrationInstance>): Promise<IntegrationInstance> {
    this.ensureConnected();

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;
    if (data.config) updateData.config = data.config;

    const { data: result, error } = await supabase!
      .from('integrations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`updateIntegration failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      typeCode: result.type_code,
      name: result.name,
      status: result.status as IntegrationInstance['status'],
      lastSyncAt: result.last_sync_at,
      config: result.config
    };
  }




  /**
   * Get module toggles
   * Requirements: 1.2
   */
  async getModuleToggles(tenantId: string): Promise<ModuleToggle[]> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('module_toggles')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`getModuleToggles failed: ${error.message}`);
    }

    return data.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      streamId: row.stream_id,
      featureArea: row.feature_area,
      enabled: row.enabled,
      readinessState: row.readiness_state
    }));
  }

  /**
   * Update module toggle state
   * Requirements: 1.2
   */
  async updateModuleToggle(id: string, enabled: boolean): Promise<ModuleToggle> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('module_toggles')
      .update({ enabled })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`updateModuleToggle failed: ${error.message}`);
    }

    return {
      id: result.id,
      tenantId: result.tenant_id,
      streamId: result.stream_id,
      featureArea: result.feature_area,
      enabled: result.enabled,
      readinessState: result.readiness_state
    };
  }

  /**
   * Get user preferences
   * Requirements: 1.5
   */
  async getUserPreferences(userId: string, tenantId: string): Promise<UserPreference | null> {
    this.ensureConnected();

    const { data, error } = await supabase!
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`getUserPreferences failed: ${error.message}`);
    }

    return {
      userId: data.user_id,
      tenantId: data.tenant_id,
      defaults: data.defaults
    };
  }

  /**
   * Update user preferences
   * Requirements: 1.5
   */
  async updateUserPreferences(userId: string, tenantId: string, data: Partial<UserPreference>): Promise<UserPreference> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('user_preferences')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        defaults: data.defaults
      })
      .select()
      .single();

    if (error) {
      throw new Error(`updateUserPreferences failed: ${error.message}`);
    }

    return {
      userId: result.user_id,
      tenantId: result.tenant_id,
      defaults: result.defaults
    };
  }

  // ============================================================================
  // Transmission Alerts (Cycle 7)
  // ============================================================================

  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<Alert> {
    this.ensureConnected();

    const { data: result, error } = await supabase!
      .from('alerts')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select(`
        *,
        sites(name),
        assets(name)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Alert with ID ${alertId} not found`);
      }
      throw new Error(`updateAlertStatus failed: ${error.message}`);
    }

    // Transform the result to match the Alert interface
    return {
      id: result.id,
      tenantId: result.tenant_id,
      severity: result.severity as AlertSeverity,
      status: result.status as AlertStatus,
      title: result.title,
      summary: result.payload?.description || result.title,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      featureArea: 'assets',
      siteId: result.site_id,
      assetId: result.asset_id,
      tags: result.tags
    };
  }

  async listPerformancePanels(tenantId: string, filters?: PerformanceFilters): Promise<PerformancePanel[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('performance_panels').select('*').eq('tenant_id', resolvedId);
    if (filters?.status?.length) query = query.in('status', filters.status);
    if (filters?.panel_types?.length) query = query.in('panel_type', filters.panel_types);
    const { data, error } = await query.order('name');
    if (error) throw new Error(`listPerformancePanels failed: ${error.message}`);
    return (data || []) as any[];
  }

  async getPerformancePanel(id: string): Promise<PerformancePanel | null> {
    this.ensureConnected();
    const { data, error } = await supabase!.from('performance_panels').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw new Error(`getPerformancePanel failed: ${error.message}`); }
    return data as any;
  }

  async createPerformancePanel(tenantId: string, data: CreatePerformancePanelRequest): Promise<PerformancePanel> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const { data: result, error } = await supabase!.from('performance_panels').insert({ tenant_id: resolvedId, ...data }).select().single();
    if (error) throw new Error(`createPerformancePanel failed: ${error.message}`);
    return result as any;
  }

  async updatePerformancePanel(id: string, data: UpdatePerformancePanelRequest): Promise<PerformancePanel> {
    this.ensureConnected();
    const { data: result, error } = await supabase!.from('performance_panels').update(data).eq('id', id).select().single();
    if (error) throw new Error(`updatePerformancePanel failed: ${error.message}`);
    return result as any;
  }

  async deletePerformancePanel(id: string): Promise<void> {
    this.ensureConnected();
    const { error } = await supabase!.from('performance_panels').delete().eq('id', id);
    if (error) throw new Error(`deletePerformancePanel failed: ${error.message}`);
  }

  async listPerformanceLosses(tenantId: string, filters?: LossFilters): Promise<PerformanceLoss[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('performance_losses').select('*').eq('tenant_id', resolvedId);
    if (filters?.loss_categories?.length) query = query.in('loss_category', filters.loss_categories);
    if (filters?.date_from) query = query.gte('occurred_at', filters.date_from);
    if (filters?.date_to) query = query.lte('occurred_at', filters.date_to);
    const { data, error } = await query.order('occurred_at', { ascending: false });
    if (error) throw new Error(`listPerformanceLosses failed: ${error.message}`);
    return (data || []) as any[];
  }

  async getPerformanceLoss(id: string): Promise<PerformanceLoss | null> {
    return null;
  }

  async createPerformanceLoss(tenantId: string, data: CreatePerformanceLossRequest): Promise<PerformanceLoss> {
    throw new Error("createPerformanceLoss not implemented in SupabaseProvider");
  }

  async updatePerformanceLoss(id: string, data: UpdatePerformanceLossRequest): Promise<PerformanceLoss> {
    throw new Error("updatePerformanceLoss not implemented in SupabaseProvider");
  }

  async listPerformanceBottlenecks(tenantId: string, filters?: BottleneckFilters): Promise<PerformanceBottleneck[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('performance_bottlenecks').select('*').eq('tenant_id', resolvedId);
    if (filters?.statuses?.length) query = query.in('status', filters.statuses);
    if (filters?.severities?.length) query = query.in('severity', filters.severities);
    if (filters?.constraint_types?.length) query = query.in('constraint_type', filters.constraint_types);
    const { data, error } = await query.order('severity');
    if (error) throw new Error(`listPerformanceBottlenecks failed: ${error.message}`);
    return (data || []) as any[];
  }

  async getPerformanceBottleneck(id: string): Promise<PerformanceBottleneck | null> {
    this.ensureConnected();
    const { data, error } = await supabase!.from('performance_bottlenecks').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw new Error(`getPerformanceBottleneck failed: ${error.message}`); }
    return data as any;
  }

  async createPerformanceBottleneck(tenantId: string, data: CreatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const { data: result, error } = await supabase!.from('performance_bottlenecks').insert({ tenant_id: resolvedId, ...data }).select().single();
    if (error) throw new Error(`createPerformanceBottleneck failed: ${error.message}`);
    return result as any;
  }

  async updatePerformanceBottleneck(id: string, data: UpdatePerformanceBottleneckRequest): Promise<PerformanceBottleneck> {
    this.ensureConnected();
    const { data: result, error } = await supabase!.from('performance_bottlenecks').update(data).eq('id', id).select().single();
    if (error) throw new Error(`updatePerformanceBottleneck failed: ${error.message}`);
    return result as any;
  }

  async listPerformanceTrends(tenantId: string, filters: TrendFilters): Promise<PerformanceTrend[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('performance_trends').select('*').eq('tenant_id', resolvedId);
    if (filters?.metric_names?.length) query = query.in('metric_name', filters.metric_names);
    if (filters?.date_from) query = query.gte('timestamp', filters.date_from);
    if (filters?.date_to) query = query.lte('timestamp', filters.date_to);
    const { data, error } = await query.order('timestamp', { ascending: false }).limit(filters?.limit || 500);
    if (error) throw new Error(`listPerformanceTrends failed: ${error.message}`);
    return (data || []) as any[];
  }

  async listPerformanceBenchmarks(tenantId: string, filters?: BenchmarkFilters): Promise<PerformanceBenchmark[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const { data, error } = await supabase!.from('performance_benchmarks').select('*').eq('tenant_id', resolvedId).order('benchmark_name');
    if (error) throw new Error(`listPerformanceBenchmarks failed: ${error.message}`);
    return (data || []) as any[];
  }

  async exportPerformanceData(tenantId: string, exportRequest: PerformanceExportRequest): Promise<ExportResult> {
    throw new Error("exportPerformanceData not implemented in SupabaseProvider");
  }

  async getSimBoardById(boardId: string): Promise<SIMBoard | null> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('sim_boards')
      .select('*, site:sites(id,name), shift:sim_shifts(id,shift_name,shift_start,shift_end)')
      .eq('id', boardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`getSimBoardById failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      boardDate: data.board_date,
      siteId: data.site_id,
      shiftId: data.shift_id,
      boardName: data.board_name,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      site: data.site,
      shift: data.shift ? {
        id: data.shift.id,
        shiftName: data.shift.shift_name,
        shiftStart: data.shift.shift_start,
        shiftEnd: data.shift.shift_end
      } : undefined
    };
  }

  async getSimKpis(boardId: string): Promise<KPIMetric[]> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('sim_kpis')
      .select('*')
      .eq('board_id', boardId)
      .order('kpi_code');

    if (error) throw new Error(`getSimKpis failed: ${error.message}`);

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      boardId: row.board_id,
      kpiCode: row.kpi_code,
      kpi_name: row.kpi_name, // Support both snake and camel if needed, but the interface says kpiName
      kpiName: row.kpi_name,
      targetValue: row.target_value,
      actualValue: row.actual_value,
      unit: row.unit,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getSwitchingOrder(orderId: string): Promise<SwitchingOrder | null> {
    return null;
  }

  async createSwitchingOrder(tenantId: string, payload: CreateSwitchingOrderRequest): Promise<SwitchingOrder> {
    throw new Error("createSwitchingOrder not implemented in SupabaseProvider");
  }

  async updateSwitchingOrder(orderId: string, patch: UpdateSwitchingOrderRequest): Promise<SwitchingOrder> {
    throw new Error("updateSwitchingOrder not implemented in SupabaseProvider");
  }

  async getOutage(outageId: string): Promise<Outage | null> {
    return null;
  }

  async createOutage(tenantId: string, payload: CreateOutageRequest): Promise<Outage> {
    throw new Error("createOutage not implemented in SupabaseProvider");
  }

  async updateOutage(outageId: string, patch: UpdateOutageRequest): Promise<Outage> {
    throw new Error("updateOutage not implemented in SupabaseProvider");
  }

  async createSimIssue(tenantId: string, payload: CreateSimIssueRequest): Promise<SimIssue> {
    throw new Error("createSimIssue not implemented in SupabaseProvider");
  }

  async updateSimIssue(issueId: string, patch: UpdateSimIssueRequest): Promise<SimIssue> {
    throw new Error("updateSimIssue not implemented in SupabaseProvider");
  }

  async createSimAction(tenantId: string, payload: CreateSimActionRequest): Promise<SimAction> {
    throw new Error("createSimAction not implemented in SupabaseProvider");
  }

  async updateSimAction(actionId: string, patch: UpdateSimActionRequest): Promise<SimAction> {
    throw new Error("updateSimAction not implemented in SupabaseProvider");
  }

  async getCiStages(tenantId: string): Promise<CIStage[]> {
    return [];
  }

  async getCiProject(projectId: string): Promise<CIProject | null> {
    return null;
  }

  async createCiProject(tenantId: string, payload: CreateCIProjectRequest): Promise<CIProject> {
    throw new Error("createCiProject not implemented in SupabaseProvider");
  }

  async updateCiProject(projectId: string, patch: UpdateCIProjectRequest): Promise<CIProject> {
    throw new Error("updateCiProject not implemented in SupabaseProvider");
  }

  async moveCiProjectStage(projectId: string, stageId: string): Promise<CIProject> {
    throw new Error("moveCiProjectStage not implemented in SupabaseProvider");
  }

  async getCiProjectRca(projectId: string): Promise<RootCauseAnalysis[]> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('ci_rca')
      .select('*, project:ci_projects(title, project_ref)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`getCiProjectRca failed: ${error.message}`);

    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      tenantId: row.tenant_id,
      rcaType: row.rca_type,
      findings: row.findings,
      conclusion: row.conclusion,
      content: row.content || {},
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectTitle: row.project?.title,
      projectRef: row.project?.project_ref,
    }));
  }

  async upsertCiProjectRca(payload: UpsertRCARequest): Promise<RootCauseAnalysis> {
    throw new Error("upsertCiProjectRca not implemented in SupabaseProvider");
  }

  async createCiCountermeasure(tenantId: string, payload: CreateCountermeasureRequest): Promise<Countermeasure> {
    throw new Error("createCiCountermeasure not implemented in SupabaseProvider");
  }

  async updateCiCountermeasure(countermeasureId: string, patch: UpdateCountermeasureRequest): Promise<Countermeasure> {
    throw new Error("updateCiCountermeasure not implemented in SupabaseProvider");
  }

  async listCiProjectKpis(projectId: string): Promise<Array<CIKPI & { impact?: CIImpact }>> {
    throw new Error("listCiProjectKpis not implemented in SupabaseProvider");
  }

  async upsertCiImpact(payload: UpsertImpactRequest): Promise<CIImpact> {
    throw new Error("upsertCiImpact not implemented in SupabaseProvider");
  }

  async listCiDocuments(projectId: string): Promise<CIDocument[]> {
    return [];
  }

  async createCiDocument(payload: CreateCIDocumentRequest): Promise<CIDocument> {
    throw new Error("createCiDocument not implemented in SupabaseProvider");
  }

  async getCiReport(reportId: string): Promise<CIReport | null> {
    return null;
  }

  async getShiftPerformance(shiftId: string): Promise<ShiftPerformanceMetrics | null> {
    return null;
  }

  async getOpportunity(opportunityId: string): Promise<OptimisationOpportunity | null> {
    return null;
  }

  async updateOpportunity(opportunityId: string, patch: UpdateOpportunityRequest): Promise<OptimisationOpportunity> {
    throw new Error("updateOpportunity not implemented in SupabaseProvider");
  }

  async getRecommendation(recommendationId: string): Promise<AIRecommendation | null> {
    return null;
  }

  async createRecommendation(tenantId: string, payload: CreateRecommendationRequest): Promise<AIRecommendation> {
    throw new Error("createRecommendation not implemented in SupabaseProvider");
  }

  async updateRecommendation(recommendationId: string, patch: UpdateRecommendationRequest): Promise<AIRecommendation> {
    throw new Error("updateRecommendation not implemented in SupabaseProvider");
  }

  async listPlaybooks(tenantId: string, filters?: PlaybookFilters): Promise<OptimisationPlaybook[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    console.log(`[SupabaseProvider] listPlaybooks for tenant ${tenantId} (resolved: ${resolvedId})`);

    let query = supabase!.from('opt_playbooks').select('*').eq('tenant_id', resolvedId);

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.isActive !== undefined) query = query.eq('is_active', filters.isActive);

    const { data, error } = await query.order('title');
    if (error) {
      console.error(`[SupabaseProvider] listPlaybooks failed:`, error);
      throw new Error(`listPlaybooks failed: ${error.message}`);
    }

    console.log(`[SupabaseProvider] Found ${data?.length || 0} playbooks`);

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      playbookRef: row.playbook_ref,
      title: row.title,
      category: row.category,
      description: row.description,
      applicabilityCriteria: row.applicability_criteria,
      steps: row.steps,
      expectedOutcomes: row.expected_outcomes,
      successMetrics: row.success_metrics,
      caseStudies: row.case_studies,
      version: row.version,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async getPlaybook(playbookId: string): Promise<OptimisationPlaybook | null> {
    this.ensureConnected();
    const { data, error } = await supabase!
      .from('opt_playbooks')
      .select('*')
      .eq('id', playbookId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`getPlaybook failed: ${error.message}`);
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      playbookRef: data.playbook_ref,
      title: data.title,
      category: data.category,
      description: data.description,
      applicabilityCriteria: data.applicability_criteria,
      steps: data.steps,
      expectedOutcomes: data.expected_outcomes,
      successMetrics: data.success_metrics,
      caseStudies: data.case_studies,
      version: data.version,
      isActive: data.is_active,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async createSimulation(tenantId: string, payload: CreateSimulationRequest): Promise<OptimisationSimulation> {
    throw new Error("createSimulation not implemented in SupabaseProvider");
  }

  async updateSimulation(simulationId: string, patch: UpdateSimulationRequest): Promise<OptimisationSimulation> {
    throw new Error("updateSimulation not implemented in SupabaseProvider");
  }

  async publishToSim(tenantId: string, payload: PublishToSimRequest): Promise<PublishEvent> {
    throw new Error("publishToSim not implemented in SupabaseProvider");
  }

  async publishToCi(tenantId: string, payload: PublishToCiRequest): Promise<PublishEvent> {
    throw new Error("publishToCi not implemented in SupabaseProvider");
  }

  async getSimBoards(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('sim_boards').select('*, site:sites(id,name), shift:sim_shifts(id,shift_name,shift_start,shift_end)').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.siteId) query = query.eq('site_id', filters.siteId);
    if (filters?.dateFrom) query = query.gte('board_date', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('board_date', filters.dateTo);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('board_date', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`getSimBoards failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      boardDate: row.board_date,
      siteId: row.site_id,
      shiftId: row.shift_id,
      boardName: row.board_name,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      site: row.site,
      shift: row.shift ? {
        id: row.shift.id,
        shiftName: row.shift.shift_name,
        shiftStart: row.shift.shift_start,
        shiftEnd: row.shift.shift_end
      } : undefined
    }));
  }

  async listSwitchingOrders(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('switching_orders').select('*').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.dateFrom) query = query.gte('planned_start', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('planned_start', filters.dateTo);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listSwitchingOrders failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id, tenantId: row.tenant_id, orderNo: row.order_no,
      description: row.description, priority: row.priority, status: row.status,
      plannedStart: row.planned_start, plannedEnd: row.planned_end,
      actualStart: row.actual_start, actualEnd: row.actual_end,
      assignedOwner: row.assigned_owner, createdAt: row.created_at, updatedAt: row.updated_at
    }));
  }

  async listOutages(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('outages').select('*').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('outage_type', filters.type);
    if (filters?.dateFrom) query = query.gte('start_time', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('start_time', filters.dateTo);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('start_time', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listOutages failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id, tenantId: row.tenant_id, outageRef: row.outage_ref,
      outageType: row.outage_type, status: row.status, startTime: row.start_time,
      estimatedRestoration: row.estimated_restoration, actualRestoration: row.actual_restoration,
      impactLevel: row.impact_level, description: row.description,
      createdAt: row.created_at, updatedAt: row.updated_at
    }));
  }

  async listSimIssues(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('sim_issues').select('*').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listSimIssues failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id, tenantId: row.tenant_id, issueRef: row.issue_ref,
      title: row.title, description: row.description, category: row.category,
      priority: row.priority, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    }));
  }

  async listSimActions(
    tenantId: string,
    filters?: any,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('sim_actions').select('*').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.owner) query = query.eq('owner', filters.owner);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('due_date', { ascending: true }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listSimActions failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id, tenantId: row.tenant_id, actionRef: row.action_ref,
      description: row.description, owner: row.owner, dueDate: row.due_date,
      priority: row.priority, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at
    }));
  }

  // ============================================================================
  // CI - Real Supabase queries
  // ============================================================================

  async listCiProjects(
    tenantId: string,
    filters?: CIProjectFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('ci_projects').select('*, ci_stage:ci_stages(id,name,sort_order), site:sites(id,name)').eq('tenant_id', resolvedId);
    if (filters?.stageId) query = query.eq('stage_id', filters.stageId);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.status) query = query.eq('status', filters.status);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listCiProjects failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id, tenantId: row.tenant_id, title: row.title, description: row.description,
      priority: row.priority, status: row.status, owner: row.owner, siteId: row.site_id,
      stageId: row.stage_id, targetKpi: row.target_kpi, targetImprovement: row.target_improvement,
      createdAt: row.created_at, updatedAt: row.updated_at, stage: row.ci_stage, site: row.site
    }));
  }

  async listCiCountermeasures(
    tenantId: string,
    filters?: CountermeasureFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<any[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('ci_countermeasures').select('*').eq('tenant_id', resolvedId);
    if (filters?.projectId) query = query.eq('project_id', filters.projectId);
    if (filters?.status) query = query.eq('status', filters.status);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listCiCountermeasures failed: ${error.message}`);
    return data || [];
  }

  async listCiReports(
    tenantId: string,
    filters?: CIReportFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<CIReport[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!.from('ci_reports').select('*').eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`listCiReports failed: ${error.message}`);
    return (data || []) as any[];
  }

  // ============================================================================
  // Shift Performance - Multi-line signature stub
  // ============================================================================

  async listShiftPerformance(
    tenantId: string,
    filters?: ShiftPerformanceFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<ShiftPerformanceMetrics[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await supabase!
      .from('shift_performance')
      .select(`
        *,
        shift:sim_shifts(id, shift_name, shift_start, shift_end, site_id)
      `)
      .eq('tenant_id', resolvedId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listShiftPerformance failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      shiftId: row.shift_id,
      performanceScore: row.performance_score,
      status: row.status,
      achievements: row.achievements,
      issues: row.issues,
      metrics: row.metrics || {},
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      shift: row.shift ? {
        id: row.shift.id,
        shiftName: row.shift.shift_name,
        shiftStart: row.shift.shift_start,
        shiftEnd: row.shift.shift_end,
        siteId: row.shift.site_id,
      } : undefined,
    }));
  }

  // ============================================================================
  // Optimisation (AI)
  // ============================================================================

  async listOpportunities(
    tenantId: string,
    filters?: OpportunityFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationOpportunity[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!
      .from('opt_opportunities')
      .select(`
        *,
        site:sites(id, name),
        asset:assets(id, name)
      `)
      .eq('tenant_id', resolvedId);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query
      .order('rank_score', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listOpportunities failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      oppRef: row.opp_ref,
      title: row.title,
      description: row.description,
      category: row.category,
      status: row.status,
      priority: row.priority,
      confidence: row.confidence,
      rankScore: row.rank_score,
      estimatedImpactMwh: row.estimated_impact_mwh,
      estimatedImpactCost: row.estimated_impact_cost,
      estimatedSavings: row.estimated_savings,
      siteId: row.site_id,
      assetId: row.asset_id,
      identifiedAt: row.identified_at,
      analysis: row.analysis || {},
      recommendations: row.recommendations || [],
      playbooks: row.playbooks || [],
      site: row.site,
      asset: row.asset,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async listRecommendations(
    tenantId: string,
    filters?: RecommendationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<AIRecommendation[]> {
    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    console.log(`[SupabaseProvider] listRecommendations for tenant ${tenantId} (resolved: ${resolvedId})`);

    // Join with opt_opportunities to get the confidence score and metadata
    let query = supabase!
      .from('opt_recommendations')
      .select('*, opportunity:opt_opportunities(*)')
      .eq('tenant_id', resolvedId);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.opportunityId) query = query.eq('opportunity_id', filters.opportunityId);
    if (filters?.priority) query = query.eq('priority', filters.priority);

    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`[SupabaseProvider] listRecommendations failed:`, error);
      throw new Error(`listRecommendations failed: ${error.message}`);
    }

    console.log(`[SupabaseProvider] Found ${data?.length || 0} recommendations`);

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      opportunityId: row.opportunity_id,
      recRef: row.rec_ref,
      title: row.title,
      description: row.description,
      actionType: row.action_type,
      priority: row.priority as any,
      status: row.status as any,
      confidenceScore: row.opportunity?.confidence || 0,
      estimatedEffortHours: row.estimated_effort_hours,
      estimatedCost: row.estimated_cost,
      estimatedBenefit: row.estimated_benefit,
      implementationSteps: row.implementation_steps,
      prerequisites: row.prerequisites,
      risks: row.risks,
      kpis: row.kpis,
      opportunity: row.opportunity ? {
        id: row.opportunity.id,
        oppRef: row.opportunity.opp_ref,
        title: row.opportunity.title,
        description: row.opportunity.description,
        category: row.opportunity.category,
        analysis: row.opportunity.analysis,
        rankScore: row.opportunity.rank_score,
        confidence: row.opportunity.confidence,
      } : undefined,
      createdBy: row.created_by,
      reviewedBy: row.reviewed_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })) as AIRecommendation[];

  }

  async listSimulations(
    tenantId: string,
    filters?: SimulationFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<OptimisationSimulation[]> {

    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!
      .from('opt_simulations')
      .select('*')
      .eq('tenant_id', resolvedId);
    if (filters?.status) query = query.eq('status', filters.status);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listSimulations failed: ${error.message}`);
    return (data || []).map((row: any) => {
      const results = row.results || {};
      const metrics = row.metrics || {};
      const params = row.input_parameters || {};

      return {
        id: row.id,
        tenantId: row.tenant_id,
        recommendationId: row.recommendation_id,
        opportunityId: row.opportunity_id,
        simRef: row.sim_ref,
        simType: row.sim_type,
        scenarioName: row.scenario_name,
        status: row.status,
        inputParameters: params,
        results: results,
        metrics: metrics,
        warnings: row.warnings || [],
        errors: row.errors || [],
        runDurationMs: row.run_duration_ms,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        // UI Aliases
        name: row.scenario_name,
        type: row.sim_type,
        description: results.description || params.description || `Simulation of ${row.sim_type}`,
        confidence: metrics.confidence || 0,
        parameters: params,
        projectedOutcome: results.projected_outcome || results.summary || "No projected outcome recorded"
      };
    }) as OptimisationSimulation[];

  }

  async listPublishEvents(
    tenantId: string,
    filters?: PublishEventFilters,
    paging?: { limit?: number; offset?: number }
  ): Promise<PublishEvent[]> {

    this.ensureConnected();
    const resolvedId = await this.resolveTenantId(tenantId);
    let query = supabase!
      .from('opt_publish_events')
      .select('*')
      .eq('tenant_id', resolvedId);
    const limit = paging?.limit || 50;
    const offset = paging?.offset || 0;
    const { data, error } = await query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(`listPublishEvents failed: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      eventRef: row.event_ref,
      sourceType: row.source_type,
      sourceId: row.source_id,
      targetSystem: row.target_system,
      targetType: row.target_type,
      targetId: row.target_id,
      status: row.status,
      payload: row.payload,
      errorMessage: row.error_message,
      publishedBy: row.published_by,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    })) as PublishEvent[];

  }


  async linkPlaybookToOpportunity(
    opportunityId: string,
    playbookId: string,
    relevanceScore?: number,
    notes?: string
  ): Promise<void> {
    throw new Error("linkPlaybookToOpportunity not implemented in SupabaseProvider");
  }

} // end SupabaseProvider class

// Singleton instance
let supabaseProviderInstance: SupabaseProvider | null = null;

export function getSupabaseProvider(): SupabaseProvider {
  if (!supabaseProviderInstance) {
    supabaseProviderInstance = new SupabaseProvider();
  }
  return supabaseProviderInstance;
}
