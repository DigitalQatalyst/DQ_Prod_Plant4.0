/**
 * Upstream Oil & Gas Asset Types
 * 
 * This module defines TypeScript types for upstream O&G asset management,
 * including wells, wellheads, separators, compressors, flowlines, pipelines,
 * and related equipment.
 */

// =============================================================================
// Upstream O&G Tenant
// =============================================================================

export interface UpstreamTenant {
  id: string;
  name: string;
  sector: "oil-gas";
  isUpstream: boolean;
}

// =============================================================================
// Site Hierarchy Types
// =============================================================================

export interface SiteHierarchy {
  basinId?: string;
  fieldId?: string;
  padId?: string;
  facilityId?: string;
  wellId?: string;
}

export interface Basin {
  id: string;
  name: string;
  tenantId: string;
  description?: string;
}

export interface Field {
  id: string;
  name: string;
  basinId: string;
  description?: string;
}

export interface Pad {
  id: string;
  name: string;
  fieldId: string;
  type: "pad" | "platform";
  description?: string;
}

export interface Facility {
  id: string;
  name: string;
  padId: string;
  facilityType?: string;
  description?: string;
}


export type WellType = "producer" | "injector";

export interface Well {
  id: string;
  name: string;
  padId: string;
  wellType: WellType;
  status?: string;
  description?: string;
}

// =============================================================================
// Asset Core Types
// =============================================================================

export type AssetRole = "fixed" | "mobile" | "linear" | "networkNode";

export type HazardousAreaClass =
  | "Zone 0"
  | "Zone 1"
  | "Zone 2"
  | "Non-hazardous";

export type Criticality = "Low" | "Medium" | "High";

export type AssetStatus =
  | "active"
  | "maintenance"
  | "shut-in"
  | "retired"
  | "planned";

export type FluidType = "oil" | "gas" | "condensate" | "water";

export interface GeoLocation {
  lat: number;
  lng: number;
  zoneId?: string;
}

export interface ProductionContext {
  wellType?: WellType;
  fluid?: FluidType;
}

export interface UpstreamAsset {
  id: string;
  name: string;
  typeId: string;
  status: AssetStatus;
  tenantId: string;
  hierarchyIds: SiteHierarchy;
  role: AssetRole;
  geoLocation?: GeoLocation;
  hazardousAreaClass?: HazardousAreaClass;
  criticality?: Criticality;
  productionContext?: ProductionContext;
  description?: string;
  // Mobile asset specific properties
  assignedLocation?: {
    fieldId?: string;
    padId?: string;
  };
  lastKnownLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  tags?: string[];
}

// =============================================================================
// Asset Type and Category
// =============================================================================

export type AssetCategory =
  | "well"
  | "process"
  | "pipeline"
  | "electrical"
  | "instrumentation"
  | "protection"
  | "switching"
  | "measurement";

export interface UpstreamAssetType {
  id: string;
  name: string;
  category: AssetCategory;
  sectorTags: string[];
  role: AssetRole;
  propertySets: string[];
  defaultTelemetry?: string[];
  description?: string;
}

// =============================================================================
// Property Set Types
// =============================================================================

export type PropertySetType =
  | "process"
  | "mechanical"
  | "electrical"
  | "safety"
  | "pipeline"
  | "technical"
  | "operational"
  | "financial"
  | "maintenance";

export type PropertyDataType = "string" | "number" | "boolean" | "date";

export interface PropertyField {
  id: string;
  label: string;
  dataType: PropertyDataType;
  unit?: string;
  required?: boolean;
  description?: string;
}

export interface PropertySet {
  id: string;
  name: string;
  type: PropertySetType;
  fields: PropertyField[];
  description?: string;
}


// =============================================================================
// Connectivity Types
// =============================================================================

export type Protocol =
  | "opc-ua"
  | "modbus-tcp"
  | "hart"
  | "ff"
  | "mqtt";

export type NetworkZone = "IT" | "OT" | "DMZ";

export type EndpointStatus = "up" | "down" | "unknown";

export interface ConnectionEndpoint {
  id: string;
  tenantId: string;
  name: string;
  protocol: Protocol;
  address: string;
  port?: number;
  zone?: NetworkZone;
  hazardousArea?: string;
  status: EndpointStatus;
  lastSeen?: string;
  description?: string;
}

export type DataPointDirection = "input" | "output" | "bidirectional";

export interface DataPoint {
  id: string;
  assetId: string;
  endpointId: string;
  logicalName: string;
  rawAddress: string;
  direction: DataPointDirection;
  unit?: string;
  dataType?: string;
  protocolMetadata?: Record<string, unknown>;
  description?: string;
}

// =============================================================================
// Discovery Types
// =============================================================================

export type DiscoveryJobType =
  | "network"
  | "field"
  | "pad"
  | "pipelineSegment";

export type DiscoveryJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface DiscoveryJobScope {
  ipRange?: string;
  fieldId?: string;
  padId?: string;
  pipelineId?: string;
}

export interface UpstreamDiscoveryJob {
  id: string;
  name: string;
  tenantId: string;
  type: DiscoveryJobType;
  scope: DiscoveryJobScope;
  status: DiscoveryJobStatus;
  foundCount: number;
  lastRunAt?: string;
  errors?: string[];
  description?: string;
}

export type DiscoveryAgentType =
  | "rtu-gateway"
  | "opc-server"
  | "scada-gateway";

export type DiscoveryAgentStatus = "active" | "inactive" | "error";

export interface DiscoveryAgentScope {
  fieldId?: string;
  padId?: string;
  pipelineId?: string;
}

export interface DiscoveryAgent {
  id: string;
  name: string;
  tenantId: string;
  type: DiscoveryAgentType;
  protocols: Protocol[];
  status: DiscoveryAgentStatus;
  assignedScopes: DiscoveryAgentScope[];
  lastRun?: string;
  description?: string;
}


// =============================================================================
// Linear Asset Types (Pipeline/Flowline)
// =============================================================================

export type LengthUnit = "m" | "km" | "ft" | "mi";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface LinearAssetIssue {
  id: string;
  type: string;
  description: string;
  severity: IssueSeverity;
}

export interface LinearAsset extends UpstreamAsset {
  startNodeId: string;
  endNodeId: string;
  length: number;
  lengthUnit: LengthUnit;
  maop?: number;
  diameter?: number;
  material?: string;
  issues?: LinearAssetIssue[];
}

// =============================================================================
// Stream Configuration Types
// =============================================================================

export type StreamProfile =
  | "high-frequency"
  | "standard"
  | "low-frequency";

export interface StreamConfig {
  id: string;
  name: string;
  tenantId: string;
  pollingInterval: number;
  retention: string;
  profile: StreamProfile;
  assetTypes: string[];
  description?: string;
}

// =============================================================================
// Lifecycle State Types
// =============================================================================

export interface LifecycleState {
  id: string;
  name: string;
  assetCategory: string;
  order: number;
  description?: string;
}

// =============================================================================
// Filter Types (for Portfolio and other views)
// =============================================================================

export interface AssetFilter {
  tenantId?: string;
  fieldId?: string;
  padId?: string;
  typeId?: string;
  criticality?: Criticality;
  status?: AssetStatus;
  hazardousAreaClass?: HazardousAreaClass;
}

export interface SavedView {
  id: string;
  name: string;
  tenantId: string;
  filters: AssetFilter;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Network Topology Types
// =============================================================================

export type ConnectionType =
  | "flowline"
  | "pipeline"
  | "electrical"
  | "control";

export interface TopologyNode {
  id: string;
  assetId: string;
  name: string;
  nodeType: string;
}

export interface TopologyEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  connectionType: ConnectionType;
  assetId?: string;
}

// =============================================================================
// Import Types
// =============================================================================

export type ImportStatus =
  | "pending"
  | "mapping"
  | "preview"
  | "completed"
  | "failed";

export interface AssetImport {
  id: string;
  name: string;
  tenantId: string;
  status: ImportStatus;
  sourceType: string;
  recordCount: number;
  importedCount: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

// =============================================================================
// Candidate Asset Types (for Discovery Review)
// =============================================================================

export type CandidateAction = "approve" | "merge" | "reject";

export interface CandidateAsset {
  id: string;
  discoveryJobId: string;
  suggestedName: string;
  suggestedTypeId: string;
  suggestedHierarchy: SiteHierarchy;
  matchedExistingAssetId?: string;
  confidence: number;
  status: "pending" | "approved" | "merged" | "rejected";
  rawData?: Record<string, unknown>;
}
