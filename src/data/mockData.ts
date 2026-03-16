// Navigation types with aliases to avoid conflicts
import {
  Asset as NavigationAsset,
  AssetType,
  DiscoveryJob,
  Sector as NavigationSector,
  Tenant as NavigationTenant,
  UpstreamEnergyMeter,
  EnergyTelemetry,
  EnergyBaseline,
  UpstreamTariffs,
  UpstreamEmissionFactors
} from "@/types/navigation";

// Performance and optimization types
import {
  PerformancePanel,
  Loss,
  Bottleneck,
  SIMBoard,
  SIMMetric,
  Issue,
  CIProject,
  RootCause,
  Countermeasure,
  OptimisationOpportunity,
  Recommendation,
  Playbook,
  Scenario,
  UpstreamPerformancePanel,
  TransmissionPerformancePanel,
  FMCGPerformancePanel,
  WellDeferment,
  ProductionTrainBottleneck,
  UpstreamEnergyMetrics,
  RelayMisoperation,
  NetworkConstraint,
  TransmissionLossMetrics,
  ChangeoverAnalysis,
  PackagingYield,
  BatchConsistency,
  UpstreamSIMBoard,
  TransmissionSIMBoard,
  FMCGSIMBoard,
  WellStatus,
  UpstreamSIMMetrics,
  SwitchingOrder,
  TransmissionEvent,
  LineEvent,
  FMCGSIMMetrics,
  UpstreamCIProject,
  TransmissionCIProject,
  FMCGCIProject,
  UpstreamOptimisationOpportunity,
  TransmissionOptimisationOpportunity,
  FMCGOptimisationOpportunity,
  UpstreamLossAnalysis,
  UpstreamBottleneckAnalysis,
  TransmissionLossAnalysis,
  TransmissionBottleneckAnalysis,
  FMCGLossAnalysis,
  FMCGBottleneckAnalysis,
  UpstreamKPIs,
  TransmissionKPIs,
  FMCGKPIs
} from "@/types/optimise";

// Security types with aliases to avoid conflicts
// Import unified security interfaces
import {
  Tenant as SecurityTenant,
  Site,
  SecurityAlert,
  Asset as SecurityAsset,
  User as SecurityUser,
  Asset,
  User,
  Role,
  ComplianceStandard,
  AuditLogEntry,
  SecurityZone,
  RemoteSession,
  SecurityControl,
  RiskEntry,
  AccessPolicy,
  SecurityPolicy,
  DataProtectionStatus,
  OTAssetSecurity
} from "@/types/security";
// Upstream telemetry interfaces
export interface TelemetryDataPoint {
  value: number;
  timestamp: string;
  unit: string;
  status: "Normal" | "Warning" | "Critical";
}

export interface UpstreamTelemetry {
  [assetId: string]: {
    [metric: string]: TelemetryDataPoint[];
  };
}

export interface UpstreamAlert {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  severity: "Warning" | "Critical" | "Information";
  timestamp: string;
  description: string;
  likelyCauses: string[];
  correctiveActions: string[];
  status: "Active" | "Investigating" | "Resolved";
  violations?: number;
  lastChecked?: string;
}

// Submeter interface (moved up to be available for use)
export interface Submeter {
  id: string;
  name: string;
  assetId: string;
  energyType: "electricity" | "gas" | "steam" | "water" | "compressed_air" | "diesel";
  status: "Normal" | "High" | "Critical" | "Offline";
  currentValue: number;
  unit: string;
  dailyConsumption?: number;
  monthlyConsumption?: number;
  costPerUnit?: number;
  lastReading?: string;
  calibrationDate?: string;
  nextMaintenanceDate?: string;
}

// Security-related interfaces (using imported types)

// Import upstream data and migration utilities
import {
  upstreamTenants,
  upstreamSites,
  upstreamSecurityAlerts,
  upstreamOtAssets,
  securityUsers,
  upstreamComplianceStandards,
  securityAuditEntries,
  securityZones,
  remoteSessions,
  securityControls,
  riskEntries,
  accessPolicies
} from "./upstreamSecurityMockData";

import * as upstreamSecurityMockData from "./upstreamSecurityMockData";

import {
  migrateUpstreamTenant,
  migrateUpstreamSite,
  migrateUpstreamAlert,
  migrateUpstreamAsset,
  migrateSecurityUser,
  migrateUpstreamComplianceStandard,
  migrateSecurityAuditEntry
} from "./migrationUtils";
// Additional imports

// ============================================================================
// Process Automation (PA) Interface Definitions
// ============================================================================

// Base interface for all PA records
export interface PARecord {
  id: string;
  name: string;
  description: string;
  sector: string;
  subsector: string;
  status: "active" | "draft" | "archived";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Tag Mapping
export interface TagMapping extends PARecord {
  sourceTag: string;
  targetVariable: string;
  dataType: string;
  unit: string;
  scalingFactor?: number;
}

// Control Model
export interface ControlModel extends PARecord {
  states: string[];
  currentState?: string;
  transitions?: { from: string; to: string; condition: string }[];
}

// Action Binding
export interface ActionBinding extends PARecord {
  action: string;
  actuator: string;
  parameters?: Record<string, any>;
}

// Trigger
export interface Trigger extends PARecord {
  condition: string;
  actions: string[];
  priority: "low" | "medium" | "high" | "critical";
}

// Alarm Rule
export interface AlarmRule extends PARecord {
  classification: string;
  severity: "info" | "warning" | "alarm" | "critical";
  routing: string[];
  autoAcknowledge: boolean;
  escalationTime?: number;
}

// Event Pattern
export interface EventPattern extends PARecord {
  patternType: string;
  events: string[];
  timeWindow: number;
  matchCondition: string;
  actions: string[];
}

// Workflow
export interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface Workflow extends PARecord {
  steps: WorkflowStep[];
  triggerType: string;
  approvalRequired: boolean;
}

// Sequence
export interface SequenceStep {
  id: string;
  order: number;
  name: string;
  action: string;
  duration?: number;
  condition?: string;
  parameters?: Record<string, any>;
}

export interface Sequence extends PARecord {
  steps: SequenceStep[];
  executionMode: "sequential" | "parallel" | "conditional";
  totalDuration?: number;
}

// Control Rule
export interface ControlRule extends PARecord {
  ruleType: "if-then" | "when-then" | "continuous";
  condition: string;
  actions: string[];
  priority: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

// Version
export interface Version extends PARecord {
  versionNumber: string;
  previousVersion?: string;
  changes?: string[];
  approvedBy?: string;
  approvalDate?: string;
  approvedAt?: string;
  changeDescription?: string;
  affectedComponents?: string[];
  approvalStatus?: string;
}

// Approval
export interface Approval extends PARecord {
  requestType: string;
  requestedBy: string;
  requestedAt: string;
  approver?: string;
  approvedAt?: string;
  rejectedAt?: string;
  comments?: string;
  priority?: "low" | "medium" | "high" | "critical";
  targetRecordId?: string;
  targetRecordType?: string;
  currentApprover?: string;
  approvalStatus?: string;
  approvedBy?: string[];
  rejectedBy?: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  rejectionReason?: string;
}

// Simulation
export interface Simulation extends PARecord {
  simulationType: "workflow" | "control_rule" | "sequence" | "trigger";
  targetRecordId?: string;
  parameters?: Record<string, any>;
  inputParameters?: Record<string, any>;
  results?: Record<string, any>;
  startTime?: string;
  startedAt?: string;
  endTime?: string;
  completedAt?: string;
  duration?: number;
  simulationResults?: Record<string, any>;
  expectedOutcome?: string;
  actualOutcome?: string;
  simulationStatus?: string;
}

// Audit Log
export interface AuditLog extends PARecord {
  eventType: "create" | "update" | "delete" | "execute" | "approve" | "reject";
  recordType: string;
  recordId: string;
  userId?: string;
  timestamp?: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  executionResult?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

// Generate realistic time-series data for the last 24 hours
const generateTimeSeriesData = (baseValue: number, variance: number, unit: string, status: "Normal" | "Warning" | "Critical" = "Normal") => {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
    const variation = (Math.random() - 0.5) * variance;
    const value = Math.round((baseValue + variation) * 100) / 100;

    data.push({
      value,
      timestamp: timestamp.toISOString(),
      unit,
      status
    });
  }

  return data;
};

// Note: Redundant interface definitions removed. Using imported types from '@/types/optimise' and '@/types/navigation'.

// Unified tenant data combining legacy and upstream tenants
const legacyTenants: NavigationTenant[] = [
  // Power & Utilities - Transmission
  { id: "dewa-transmission", name: "DEWA - Transmission", industry: "Power & Utilities", sector: "power", subsector: "Transmission" },
  { id: "t1", name: "Kenya Power", industry: "Power & Utilities", sector: "power", subsector: "Transmission" },
  { id: "t-dewa", name: "DEWA", industry: "Power & Utilities", sector: "power", subsector: "Transmission" },
  { id: "t-saudi-sec", name: "Saudi Electricity Company", industry: "Power & Utilities", sector: "power", subsector: "Generation" },
  { id: "t-eskom", name: "Eskom Holdings", industry: "Power & Utilities", sector: "power", subsector: "Distribution" },

  // Oil & Gas - Various subsectors
  { id: "t-aramco", name: "Saudi Aramco", industry: "Oil & Gas", sector: "oil-gas", subsector: "Upstream" },
  { id: "t-shell", name: "Shell Midstream", industry: "Oil & Gas", sector: "oil-gas", subsector: "Midstream" },
  { id: "t-bp-downstream", name: "BP Downstream", industry: "Oil & Gas", sector: "oil-gas", subsector: "Downstream" },
  { id: "t-upstream", name: "GulfUpstream Demo", industry: "Oil & Gas", sector: "oil-gas", subsector: "Upstream" },

  // FMCG & Manufacturing
  { id: "t2", name: "Kenya Tea", industry: "FMCG & Manufacturing", sector: "fmcg", subsector: "Food & Beverage" },
  { id: "t3", name: "Bamburi Cement", industry: "FMCG & Manufacturing", sector: "fmcg", subsector: "Industrial Manufacturing" },
  { id: "t-nestle", name: "Nestlé East Africa", industry: "FMCG & Manufacturing", sector: "fmcg", subsector: "Food & Beverage" },
  { id: "t-unilever", name: "Unilever Kenya", industry: "FMCG & Manufacturing", sector: "fmcg", subsector: "Consumer Goods" },

  // Mining & Metals
  { id: "t-anglogold", name: "AngloGold Ashanti", industry: "Mining & Metals", sector: "mining", subsector: "Extraction" },
  { id: "t-barrick", name: "Barrick Gold", industry: "Mining & Metals", sector: "mining", subsector: "Processing" },
  { id: "t-alcoa", name: "Alcoa Refinery", industry: "Mining & Metals", sector: "mining", subsector: "Refining" },

  // Test tenant for development
  { id: "tenant-1", name: "Test Tenant", industry: "Testing", sector: "power", subsector: "Transmission" }
];

// Get legacy tenant IDs to avoid duplicates
const legacyTenantIds = new Set(legacyTenants.map(t => t.id));

// Filter upstream tenants to exclude duplicates and migrate them
const uniqueUpstreamTenants = upstreamTenants
  .filter(t => !legacyTenantIds.has(t.id))
  .map(migrateUpstreamTenant);

export const tenants: NavigationTenant[] = [
  ...legacyTenants,
  ...uniqueUpstreamTenants
];

// Unified sites data from upstream sources
export const sites: Site[] = upstreamSites.map(migrateUpstreamSite);

export const assetsByTenant: Record<string, any[]> = {
  "dewa-transmission": [],
  t1: [
    { id: "a1", name: "Main Transformer T1", type: "Transformer", site: "Nairobi Substation", area: "Grid A", status: "online", lastSeen: "2 min ago", criticality: "critical" },
    { id: "a2", name: "Feeder Panel FP-01", type: "Panel", site: "Nairobi Substation", area: "Grid A", status: "online", lastSeen: "1 min ago", criticality: "high" },
    { id: "a3", name: "Backup Generator BG-1", type: "Generator", site: "Nairobi Substation", area: "Emergency", status: "maintenance", lastSeen: "1 hour ago", criticality: "critical" },
    { id: "a4", name: "Distribution Transformer DT-5", type: "Transformer", site: "Mombasa Hub", area: "Zone B", status: "online", lastSeen: "5 min ago", criticality: "high" },
    { id: "a5", name: "Smart Meter SM-1001", type: "Meter", site: "Mombasa Hub", area: "Zone B", status: "online", lastSeen: "30 sec ago", criticality: "low" },
    { id: "a6", name: "Circuit Breaker CB-12", type: "Breaker", site: "Kisumu Station", area: "Main", status: "offline", lastSeen: "2 hours ago", criticality: "high" },
    { id: "a7", name: "Power Quality Analyzer PQA-3", type: "Analyzer", site: "Kisumu Station", area: "Main", status: "online", lastSeen: "1 min ago", criticality: "medium" },
    { id: "a8", name: "Capacitor Bank CB-01", type: "Capacitor", site: "Nairobi Substation", area: "Grid B", status: "pending", lastSeen: "Never", criticality: "medium" },
  ],
  t2: [
    { id: "b1", name: "Tea Dryer TD-01", type: "Dryer", site: "Kericho Factory", area: "Processing", status: "online", lastSeen: "1 min ago", criticality: "critical" },
    { id: "b2", name: "Conveyor Belt CV-Main", type: "Conveyor", site: "Kericho Factory", area: "Processing", status: "online", lastSeen: "30 sec ago", criticality: "high" },
    { id: "b3", name: "Sorting Machine SM-01", type: "Sorter", site: "Kericho Factory", area: "Quality", status: "maintenance", lastSeen: "4 hours ago", criticality: "medium" },
    { id: "b4", name: "Packaging Unit PU-01", type: "Packager", site: "Nandi Facility", area: "Dispatch", status: "online", lastSeen: "2 min ago", criticality: "high" },
    { id: "b5", name: "Cold Storage CS-01", type: "Storage", site: "Nandi Facility", area: "Warehouse", status: "online", lastSeen: "5 min ago", criticality: "critical" },
  ],
  t3: [
    { id: "c1", name: "Kiln K-01", type: "Kiln", site: "Athi River Plant", area: "Production", status: "online", lastSeen: "1 min ago", criticality: "critical" },
    { id: "c2", name: "Crusher CR-Main", type: "Crusher", site: "Athi River Plant", area: "Raw Materials", status: "online", lastSeen: "2 min ago", criticality: "critical" },
    { id: "c3", name: "Ball Mill BM-01", type: "Mill", site: "Athi River Plant", area: "Processing", status: "online", lastSeen: "1 min ago", criticality: "high" },
    { id: "c4", name: "Cement Silo CS-A", type: "Silo", site: "Mombasa Plant", area: "Storage", status: "online", lastSeen: "10 min ago", criticality: "medium" },
  ],
  "t-upstream": [
    { id: "WH-01", name: "Wellhead WH-01", type: "Wellhead", site: "Pad A", area: "Production", status: "online", lastSeen: "1 min ago", criticality: "critical", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 45.0, energyCostCenter: "PAD-A" },
    { id: "ESP-07", name: "ESP Pump ESP-07", type: "ESP", site: "Pad A", area: "Artificial Lift", status: "online", lastSeen: "2 min ago", criticality: "high", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 75.0, energyCostCenter: "PAD-A" },
    { id: "P-21", name: "Transfer Pump P-21", type: "Pump", site: "Pad A", area: "Production", status: "online", lastSeen: "1 min ago", criticality: "medium", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 25.0, energyCostCenter: "PAD-A" },
    { id: "GC-11", name: "Gas Compressor GC-11", type: "Compressor", site: "Central Facility", area: "Gas Processing", status: "online", lastSeen: "30 sec ago", criticality: "critical", energyConsumer: true, primaryEnergyType: "gas", nominalPowerKw: 850.0, energyCostCenter: "CENTRAL" },
    { id: "KO-03", name: "Knockout Drum KO-03", type: "KO Drum", site: "Central Facility", area: "Gas Processing", status: "online", lastSeen: "5 min ago", criticality: "medium", energyConsumer: false },
  ],
  "alpha-upstream": [
    { id: "WH-01", name: "Wellhead WH-01", type: "Wellhead", site: "Pad A", area: "Production", status: "online", lastSeen: "1 min ago", criticality: "critical", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 45.0, energyCostCenter: "PAD-A", location: "North Permian Field - Pad NP-01" },
    { id: "ESP-07", name: "ESP Pump ESP-07", type: "ESP Pump", site: "Pad A", area: "Artificial Lift", status: "online", lastSeen: "2 min ago", criticality: "high", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 75.0, energyCostCenter: "PAD-A", location: "North Permian Field - Pad NP-01" },
    { id: "P-21", name: "Transfer Pump P-21", type: "Crude Transfer Pump", site: "Pad A", area: "Production", status: "online", lastSeen: "1 min ago", criticality: "medium", energyConsumer: true, primaryEnergyType: "electricity", nominalPowerKw: 25.0, energyCostCenter: "PAD-A", location: "North Permian Field - Pad NP-01" },
    { id: "GC-11", name: "Gas Compressor GC-11", type: "Gas Compressor", site: "Central Facility", area: "Gas Processing", status: "online", lastSeen: "30 sec ago", criticality: "critical", energyConsumer: true, primaryEnergyType: "gas", nominalPowerKw: 850.0, energyCostCenter: "CENTRAL", location: "Central Processing Facility" },
    { id: "KO-03", name: "Knockout Drum KO-03", type: "Flare KO Drum", site: "Central Facility", area: "Gas Processing", status: "online", lastSeen: "5 min ago", criticality: "medium", energyConsumer: false, location: "Central Processing Facility" },
  ],
  "69083830-a193-4f8b-aab2-0d17349d286c": [
    { id: "sub-1", name: "Dubai Main Substation", type: "Substation", site: "Dubai", area: "Main", status: "online", lastSeen: "now", criticality: "critical" },
    { id: "sub-2", name: "Jebel Ali Main Substation", type: "Substation", site: "Jebel Ali", area: "Port", status: "online", lastSeen: "now", criticality: "high" },
    { id: "sub-3", name: "Al Aweer Main Substation", type: "Substation", site: "Al Aweer", area: "Industrial", status: "online", lastSeen: "now", criticality: "medium" },
    { id: "sub-4", name: "Dubai South Substation", type: "Substation", site: "Dubai South", area: "Airport", status: "online", lastSeen: "now", criticality: "high" },
    { id: "sub-5", name: "Central Grid Hub", type: "Substation", site: "Central", area: "Hub", status: "online", lastSeen: "now", criticality: "critical" },
    { id: "m-1", name: "Main Incomer 1", type: "Meter", site: "Dubai Main", area: "Bay 1", status: "online", lastSeen: "now", criticality: "critical" },
    { id: "m-2", name: "Feeder Meter OUT-01", type: "Meter", site: "Dubai Main", area: "Bay 4", status: "online", lastSeen: "now", criticality: "high" },
    { id: "m-3", name: "Feeder Meter OUT-02", type: "Meter", site: "Dubai Main", area: "Bay 5", status: "online", lastSeen: "now", criticality: "high" },
    { id: "m-4", name: "Incomer Meter Jebel Ali", type: "Meter", site: "Jebel Ali", area: "Bay 1", status: "online", lastSeen: "now", criticality: "critical" },
    { id: "m-5", name: "Outgoing F1 Meter JA", type: "Meter", site: "Jebel Ali", area: "Bay 3", status: "online", lastSeen: "now", criticality: "high" },
  ],
};


export const discoveryJobs: DiscoveryJob[] = [
  { id: "dj1", name: "Network Scan - Nairobi", type: "network", status: "completed", startedAt: "2024-01-15 09:00", discoveredCount: 24, approvedCount: 18 },
  { id: "dj2", name: "Agent Discovery - Mombasa", type: "agent", status: "running", startedAt: "2024-01-15 14:30", discoveredCount: 12, approvedCount: 0 },
  { id: "dj3", name: "Manual Import - Kisumu", type: "manual", status: "pending", startedAt: "2024-01-15 16:00", discoveredCount: 0, approvedCount: 0 },
  { id: "dj4", name: "Full Site Scan - Kericho", type: "network", status: "completed", startedAt: "2024-01-14 08:00", discoveredCount: 45, approvedCount: 42 },
  { id: "dj5", name: "Gateway Refresh", type: "agent", status: "failed", startedAt: "2024-01-13 11:00", discoveredCount: 3, approvedCount: 0 },
];

export const assetTypes: AssetType[] = [
  { id: "at1", name: "Transformer", category: "Electrical", icon: "⚡", assetCount: 156, properties: ["Voltage Rating", "Power Rating", "Cooling Type", "Tap Position"] },
  { id: "at2", name: "Motor", category: "Mechanical", icon: "🔄", assetCount: 342, properties: ["Power", "RPM", "Efficiency Class", "Frame Size"] },
  { id: "at3", name: "Pump", category: "Mechanical", icon: "💧", assetCount: 189, properties: ["Flow Rate", "Head", "Power", "Material"] },
  { id: "at4", name: "Meter", category: "Instrumentation", icon: "📊", assetCount: 2450, properties: ["Type", "Accuracy Class", "Communication Protocol"] },
  { id: "at5", name: "Generator", category: "Electrical", icon: "🔋", assetCount: 45, properties: ["Capacity", "Fuel Type", "Phase", "Frequency"] },
  { id: "at6", name: "Conveyor", category: "Mechanical", icon: "➡️", assetCount: 78, properties: ["Length", "Speed", "Belt Type", "Load Capacity"] },
  { id: "at7", name: "Compressor", category: "Mechanical", icon: "🌀", assetCount: 92, properties: ["Type", "Pressure", "Flow Rate", "Drive Type"] },
  { id: "at8", name: "Heat Exchanger", category: "Thermal", icon: "🔥", assetCount: 67, properties: ["Type", "Duty", "Surface Area", "Material"] },
];

export const siteSummary = {
  "dewa-transmission": [],
  t1: [
    { site: "Nairobi Substation", assetCount: 45, onlineCount: 38, criticalAlerts: 2 },
    { site: "Mombasa Hub", assetCount: 32, onlineCount: 30, criticalAlerts: 0 },
    { site: "Kisumu Station", assetCount: 28, onlineCount: 22, criticalAlerts: 1 },
  ],
  t2: [
    { site: "Kericho Factory", assetCount: 67, onlineCount: 62, criticalAlerts: 1 },
    { site: "Nandi Facility", assetCount: 34, onlineCount: 33, criticalAlerts: 0 },
  ],
  t3: [
    { site: "Athi River Plant", assetCount: 124, onlineCount: 118, criticalAlerts: 3 },
    { site: "Mombasa Plant", assetCount: 89, onlineCount: 85, criticalAlerts: 1 },
  ],
  "t-upstream": [
    { site: "Pad A", assetCount: 3, onlineCount: 3, criticalAlerts: 0 },
    { site: "Central Facility", assetCount: 2, onlineCount: 2, criticalAlerts: 0 },
  ],
  "alpha-upstream": [
    { site: "Pad A", assetCount: 3, onlineCount: 3, criticalAlerts: 0 },
    { site: "Central Facility", assetCount: 2, onlineCount: 2, criticalAlerts: 0 },
  ],
};

// Unified security alerts combining legacy and upstream data
const legacySecurityAlerts: SecurityAlert[] = [
  {
    id: "sa1",
    tenantId: "t1",
    title: "Unauthorized Access Attempt",
    description: "Multiple failed login attempts detected from unknown IP address",
    severity: "critical",
    status: "new",
    affectedAsset: "Main Transformer T1",
    affectedAssetId: "a1",
    timestamp: "2024-01-15T14:23:00Z",
    detectedBy: "IDS System",
    assignedTo: "John Doe",
    category: "unauthorized-access"
  },
  {
    id: "sa2",
    tenantId: "t3",
    title: "Outdated Firmware Detected",
    description: "Critical firmware update available for PLC controller",
    severity: "high",
    status: "acknowledged",
    affectedAsset: "Kiln K-01",
    affectedAssetId: "c1",
    timestamp: "2024-01-15T12:15:00Z",
    detectedBy: "Vulnerability Scanner",
    assignedTo: "Jane Smith",
    category: "configuration-change"
  },
  {
    id: "sa3",
    tenantId: "t2",
    title: "Unusual Network Traffic",
    description: "Abnormal data transfer pattern detected on industrial network",
    severity: "medium",
    status: "investigating",
    affectedAsset: "Tea Dryer TD-01",
    affectedAssetId: "b1",
    timestamp: "2024-01-15T10:45:00Z",
    detectedBy: "Network Monitor",
    category: "malware"
  }
];

// Upstream Energy Management System Data
export const upstreamEnergyMeters: UpstreamEnergyMeter[] = [
  {
    id: "em-wh-01",
    name: "Wellpad A Feeder Meter",
    scope: "Pad A",
    energyTypes: ["electricity"],
    linkedAssets: ["WH-01", "ESP-07", "P-21"],
    currentKW: 145.2,
    status: "Normal"
  },
  {
    id: "em-gc-11",
    name: "Compressor Station Meter",
    scope: "Central Facility",
    energyTypes: ["electricity", "gas"],
    linkedAssets: ["GC-11", "KO-03"],
    currentKW: 892.7,
    status: "High"
  },
  {
    id: "em-camp",
    name: "Camp & Utilities Meter",
    scope: "Camp / Common Services",
    energyTypes: ["electricity"],
    linkedAssets: [],
    currentKW: 67.3,
    status: "Normal"
  }
];

export const transmissionEnergyMeters: UpstreamEnergyMeter[] = [
  {
    id: "em-sub-01",
    name: "Dubai Main Incomer",
    scope: "Dubai Main Substation",
    energyTypes: ["electricity"],
    linkedAssets: ["sub-1", "m-1"],
    currentKW: 2450.5,
    status: "Normal"
  },
  {
    id: "em-sub-02",
    name: "Jebel Ali Port Feeder",
    scope: "Jebel Ali Main Substation",
    energyTypes: ["electricity"],
    linkedAssets: ["sub-2", "m-4"],
    currentKW: 1850.2,
    status: "Normal"
  },
  {
    id: "em-sub-03",
    name: "South Airport Incomer",
    scope: "Dubai South Substation",
    energyTypes: ["electricity"],
    linkedAssets: ["sub-4"],
    currentKW: 1250.8,
    status: "Normal"
  }
];

// Generate 24-hour telemetry data
const generateTelemetryData = (meterId: string, baseKW: number): EnergyTelemetry => {
  const timestamps: string[] = [];
  const kW: number[] = [];
  const kWh: number[] = [];

  const now = new Date();
  let cumulativeKWh = 0;

  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    timestamps.push(timestamp.toISOString());

    // Generate realistic load variation (±20% of base)
    const variation = 0.8 + Math.random() * 0.4;
    const currentKW = baseKW * variation;
    kW.push(Math.round(currentKW * 10) / 10);

    // Accumulate kWh (assuming hourly readings)
    cumulativeKWh += currentKW;
    kWh.push(Math.round(cumulativeKWh * 10) / 10);
  }

  return {
    meterId,
    timestamp: timestamps,
    kWh,
    kW
  };
};

export const upstreamEnergyTelemetry: Record<string, EnergyTelemetry> = {
  "em-wh-01": generateTelemetryData("em-wh-01", 145.2),
  "em-gc-11": generateTelemetryData("em-gc-11", 892.7),
  "em-camp": generateTelemetryData("em-camp", 67.3),
  "em-sub-01": generateTelemetryData("em-sub-01", 2450.5),
  "em-sub-02": generateTelemetryData("em-sub-02", 1850.2),
  "em-sub-03": generateTelemetryData("em-sub-03", 1250.8)
};

export const upstreamEnergyBaselines: EnergyBaseline[] = [
  {
    meterId: "em-wh-01",
    baselineKWhPerDay: 3480, // 145 kW * 24 hours
    baselineKWhPerBBL: 2.5, // kWh per barrel produced
    baselineKWhPerMSCF: undefined
  },
  {
    meterId: "em-gc-11",
    baselineKWhPerDay: 21425, // 892.7 kW * 24 hours
    baselineKWhPerBBL: undefined,
    baselineKWhPerMSCF: 15.2 // kWh per thousand standard cubic feet
  },
  {
    meterId: "em-camp",
    baselineKWhPerDay: 1615, // 67.3 kW * 24 hours
    baselineKWhPerBBL: undefined,
    baselineKWhPerMSCF: undefined
  },
  {
    meterId: "em-sub-01",
    baselineKWhPerDay: 58800, // 2450 kW * 24 hours
    baselineKWhPerBBL: undefined,
    baselineKWhPerMSCF: undefined
  },
  {
    meterId: "em-sub-02",
    baselineKWhPerDay: 44400, // 1850 kW * 24 hours
    baselineKWhPerBBL: undefined,
    baselineKWhPerMSCF: undefined
  }
];

export const securityAlerts: SecurityAlert[] = [
  ...legacySecurityAlerts,
  ...upstreamSecurityAlerts.map(migrateUpstreamAlert)
];

// Unified user data combining legacy and upstream users
const legacyUsers: SecurityUser[] = [
  {
    id: "u1",
    tenantId: "t1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Security Administrator",
    roles: ["Security Administrator", "Auditor"],
    status: "active",
    lastLogin: "2024-01-15T14:30:00Z",
    sites: ["Nairobi Substation", "Mombasa Hub"],
    department: "IT Security",
    createdAt: "2023-06-01T00:00:00Z"
  },
  {
    id: "u2",
    tenantId: "t2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Operations Manager",
    roles: ["Operations Manager"],
    status: "active",
    lastLogin: "2024-01-15T13:45:00Z",
    sites: ["Kericho Factory", "Nandi Facility"],
    department: "Operations",
    createdAt: "2023-03-15T00:00:00Z"
  },
  {
    id: "u3",
    tenantId: "t3",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "System Engineer",
    roles: ["System Engineer", "Viewer"],
    status: "active",
    lastLogin: "2024-01-15T11:20:00Z",
    sites: ["Athi River Plant"],
    department: "Engineering",
    createdAt: "2023-08-20T00:00:00Z"
  },
  {
    id: "u4",
    tenantId: "t1",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    role: "Compliance Officer",
    roles: ["Compliance Officer", "Auditor"],
    status: "active",
    lastLogin: "2024-01-15T09:00:00Z",
    sites: ["Nairobi Substation", "Kisumu Station", "Mombasa Hub"],
    department: "Compliance",
    createdAt: "2023-01-10T00:00:00Z"
  },
  {
    id: "u5",
    tenantId: "t3",
    name: "Robert Brown",
    email: "robert.brown@example.com",
    role: "Viewer",
    roles: ["Viewer"],
    status: "inactive",
    lastLogin: "2024-01-10T16:00:00Z",
    sites: ["Mombasa Plant"],
    department: "Operations",
    createdAt: "2023-11-05T00:00:00Z"
  },
  {
    id: "u6",
    tenantId: "t1",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "Security Analyst",
    roles: ["Security Analyst"],
    status: "locked",
    lastLogin: "2024-01-14T18:30:00Z",
    sites: ["Nairobi Substation"],
    department: "IT Security",
    createdAt: "2023-09-12T00:00:00Z"
  }
];

export const users: SecurityUser[] = [
  ...legacyUsers,
  ...securityUsers.map(migrateSecurityUser)
];

// Role mock data
export const roles: Role[] = [
  {
    id: "r1",
    tenantId: "t1",
    name: "Security Administrator",
    description: "Full access to security features and settings",
    permissions: ["security.read", "security.write", "security.delete", "users.manage", "audit.read"],
    userCount: 1,
    isSystem: true
  },
  {
    id: "r2",
    tenantId: "t2",
    name: "Operations Manager",
    description: "Manage operational aspects and view security data",
    permissions: ["assets.read", "assets.write", "security.read", "alerts.manage"],
    userCount: 1,
    isSystem: false
  },
  {
    id: "r3",
    tenantId: "t3",
    name: "System Engineer",
    description: "Technical access to systems and configurations",
    permissions: ["assets.read", "assets.write", "config.read", "config.write"],
    userCount: 1,
    isSystem: false
  },
  {
    id: "r4",
    tenantId: "t1",
    name: "Compliance Officer",
    description: "Access to compliance and audit features",
    permissions: ["compliance.read", "compliance.write", "audit.read", "reports.generate"],
    userCount: 1,
    isSystem: false
  },
  {
    id: "r5",
    tenantId: "t1",
    name: "Security Analyst",
    description: "Analyze security alerts and incidents",
    permissions: ["security.read", "alerts.read", "alerts.write", "audit.read"],
    userCount: 1,
    isSystem: false
  },
  {
    id: "r6",
    tenantId: "t1",
    name: "Auditor",
    description: "Read-only access to audit logs and compliance data",
    permissions: ["audit.read", "compliance.read", "reports.generate"],
    userCount: 2,
    isSystem: true
  },
  {
    id: "r7",
    tenantId: "t3",
    name: "Viewer",
    description: "Read-only access to basic information",
    permissions: ["assets.read", "security.read"],
    userCount: 2,
    isSystem: true
  }
];

// Unified assets data combining legacy OT assets and upstream assets
export const assets: SecurityAsset[] = [
  ...upstreamOtAssets.map(migrateUpstreamAsset)
];

// Legacy OT Asset Security mock data (for backward compatibility)
export const otAssetSecurity: OtAssetSecurity[] = [
  {
    tenantId: "t1",
    assetId: "a1",
    assetName: "Main Transformer T1",
    assetType: "Transformer",
    site: "Nairobi Substation",
    criticality: "critical",
    securityStatus: "at-risk",
    vulnerabilityCount: 3,
    openAlerts: 2,
    lastSecurityScan: "2024-01-15T08:00:00Z",
    riskScore: 78,
    networkExposure: "internal",
    patchStatus: "pending"
  },
  {
    tenantId: "t1",
    assetId: "a3",
    assetName: "Backup Generator BG-1",
    assetType: "Generator",
    site: "Nairobi Substation",
    criticality: "critical",
    securityStatus: "vulnerable",
    vulnerabilityCount: 5,
    openAlerts: 1,
    lastSecurityScan: "2024-01-14T10:00:00Z",
    riskScore: 85,
    networkExposure: "dmz",
    patchStatus: "overdue"
  },
  {
    tenantId: "t2",
    assetId: "b1",
    assetName: "Tea Dryer TD-01",
    assetType: "Dryer",
    site: "Kericho Factory",
    criticality: "critical",
    securityStatus: "secure",
    vulnerabilityCount: 0,
    openAlerts: 1,
    lastSecurityScan: "2024-01-15T12:00:00Z",
    riskScore: 25,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },
  {
    tenantId: "t3",
    assetId: "c1",
    assetName: "Kiln K-01",
    assetType: "Kiln",
    site: "Athi River Plant",
    criticality: "critical",
    securityStatus: "at-risk",
    vulnerabilityCount: 2,
    openAlerts: 1,
    lastSecurityScan: "2024-01-15T06:00:00Z",
    riskScore: 65,
    networkExposure: "internal",
    patchStatus: "pending"
  },
  {
    tenantId: "t1",
    assetId: "a4",
    assetName: "Distribution Transformer DT-5",
    assetType: "Transformer",
    site: "Mombasa Hub",
    criticality: "high",
    securityStatus: "secure",
    vulnerabilityCount: 1,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T09:00:00Z",
    riskScore: 35,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },
  {
    tenantId: "t1",
    assetId: "a6",
    assetName: "Circuit Breaker CB-12",
    assetType: "Breaker",
    site: "Kisumu Station",
    criticality: "high",
    securityStatus: "unknown",
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-10T14:00:00Z",
    riskScore: 50,
    networkExposure: "internal",
    patchStatus: "pending"
  },
  {
    tenantId: "t1",
    assetId: "a7",
    assetName: "Power Quality Analyzer PQA-3",
    assetType: "Analyzer",
    site: "Kisumu Station",
    criticality: "medium",
    securityStatus: "secure",
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T11:00:00Z",
    riskScore: 20,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  },
  {
    tenantId: "t1",
    assetId: "a5",
    assetName: "Smart Meter SM-1001",
    assetType: "Meter",
    site: "Mombasa Hub",
    criticality: "low",
    securityStatus: "secure",
    vulnerabilityCount: 0,
    openAlerts: 0,
    lastSecurityScan: "2024-01-15T07:00:00Z",
    riskScore: 15,
    networkExposure: "internal",
    patchStatus: "up-to-date"
  }
];

export const upstreamTariffs: UpstreamTariffs = {
  electricityUsdPerKWh: 0.12, // $0.12 per kWh
  gasUsdPerMMBtu: 4.50, // $4.50 per MMBtu
  dieselUsdPerLitre: 1.25 // $1.25 per litre
};

export const upstreamEmissionFactors: UpstreamEmissionFactors = {
  electricityKgCo2PerKWh: 0.45, // 0.45 kg CO2 per kWh (grid electricity)
  gasKgCo2PerMMBtu: 53.06, // 53.06 kg CO2 per MMBtu (natural gas)
  dieselKgCo2PerLitre: 2.68 // 2.68 kg CO2 per litre (diesel fuel)
};

// Unified compliance standards combining legacy and upstream data
const legacyComplianceStandards: ComplianceStandard[] = [
  {
    id: "cs1",
    tenantId: "t1",
    name: "IEC 62443",
    fullName: "IEC 62443 - Industrial Automation and Control Systems Security",
    description: "International standard for industrial automation and control systems security",
    complianceScore: 85,
    status: "compliant",
    applicableScope: {
      sites: ["Nairobi Substation", "Mombasa Hub", "Kisumu Station"],
      assetTypes: ["Transformer", "Generator", "Breaker"],
      departments: ["Operations", "IT Security"]
    },
    requirements: [
      {
        id: "req1",
        code: "SR 1.1",
        title: "User identification and authentication",
        status: "compliant",
        evidence: "Multi-factor authentication implemented",
        lastChecked: "2024-01-10T00:00:00Z"
      },
      {
        id: "req2",
        code: "SR 1.2",
        title: "Use control",
        status: "compliant",
        evidence: "Role-based access control active",
        lastChecked: "2024-01-10T00:00:00Z"
      },
      {
        id: "req3",
        code: "SR 2.1",
        title: "Network segmentation",
        status: "in-progress",
        evidence: "Segmentation in progress for Zone B",
        lastChecked: "2024-01-12T00:00:00Z"
      },
      {
        id: "req4",
        code: "SR 3.1",
        title: "Communication integrity",
        status: "compliant",
        evidence: "TLS 1.3 encryption enabled",
        lastChecked: "2024-01-10T00:00:00Z"
      }
    ],
    lastAudit: "2023-12-15T00:00:00Z",
    nextAudit: "2024-06-15T00:00:00Z"
  }
];

// =============================================================================
// EMS Extended Mock Data
// =============================================================================

// Submeters by asset
export const upstreamSubmeters: Submeter[] = [
  {
    id: "sm-esp-07",
    name: "ESP-07 Power Meter",
    assetId: "ESP-07",
    energyType: "electricity",
    status: "Normal",
    currentValue: 45.2,
    unit: "kW"
  },
  {
    id: "sm-gc-11",
    name: "GC-11 Gas Meter",
    assetId: "GC-11",
    energyType: "gas",
    status: "High",
    currentValue: 892.7,
    unit: "kW"
  },
  {
    id: "sm-gc-11-elec",
    name: "GC-11 Electric Motor",
    assetId: "GC-11",
    energyType: "electricity",
    status: "Normal",
    currentValue: 125.3,
    unit: "kW"
  },
  {
    id: "sm-p-21",
    name: "P-21 Pump Motor",
    assetId: "P-21",
    energyType: "electricity",
    status: "Normal",
    currentValue: 25.0,
    unit: "kW"
  },
  {
    id: "sm-wh-01-elec",
    name: "WH-01 Control Systems",
    assetId: "WH-01",
    energyType: "electricity",
    status: "Normal",
    currentValue: 8.5,
    unit: "kW"
  },
  {
    id: "sm-ko-03-elec",
    name: "KO-03 Instrumentation",
    assetId: "KO-03",
    energyType: "electricity",
    status: "Normal",
    currentValue: 2.1,
    unit: "kW"
  },
  {
    id: "sm-camp-hvac",
    name: "Camp HVAC System",
    assetId: "CAMP-01",
    energyType: "electricity",
    status: "Normal",
    currentValue: 35.2,
    unit: "kW"
  },
  {
    id: "sm-camp-lighting",
    name: "Camp Lighting",
    assetId: "CAMP-01",
    energyType: "electricity",
    status: "Normal",
    currentValue: 12.8,
    unit: "kW"
  },
  {
    id: "sm-gen-01",
    name: "Backup Generator",
    assetId: "GEN-01",
    energyType: "diesel",
    status: "Normal",
    currentValue: 0.0,
    unit: "L/hr"
  }
];

// Power quality data with 24-hour history
const generatePowerQualityHistory = (baseValue: number, variance: number): number[] => {
  const history: number[] = [];
  for (let i = 0; i < 24; i++) {
    const variation = (Math.random() - 0.5) * variance;
    history.push(Math.round((baseValue + variation) * 100) / 100);
  }
  return history;
};

export const upstreamPowerQuality: Record<string, PowerQuality> = {
  "em-wh-01": {
    meterId: "em-wh-01",
    powerFactor: 0.92,
    thdPct: 3.2,
    voltageV: 480,
    frequencyHz: 60.1,
    sagEventsCount: 2,
    swellEventsCount: 0,
    timestamp: Array.from({ length: 24 }, (_, i) => {
      const now = new Date();
      return new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
    }),
    powerFactorHistory: generatePowerQualityHistory(0.92, 0.05),
    thdHistory: generatePowerQualityHistory(3.2, 0.8),
    voltageHistory: generatePowerQualityHistory(480, 15)
  },
  "em-gc-11": {
    meterId: "em-gc-11",
    powerFactor: 0.88,
    thdPct: 4.1,
    voltageV: 4160,
    frequencyHz: 59.9,
    sagEventsCount: 1,
    swellEventsCount: 1,
    timestamp: Array.from({ length: 24 }, (_, i) => {
      const now = new Date();
      return new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
    }),
    powerFactorHistory: generatePowerQualityHistory(0.88, 0.06),
    thdHistory: generatePowerQualityHistory(4.1, 1.2),
    voltageHistory: generatePowerQualityHistory(4160, 80)
  },
  "em-camp": {
    meterId: "em-camp",
    powerFactor: 0.95,
    thdPct: 2.1,
    voltageV: 480,
    frequencyHz: 60.0,
    sagEventsCount: 0,
    swellEventsCount: 0,
    timestamp: Array.from({ length: 24 }, (_, i) => {
      const now = new Date();
      return new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString();
    }),
    powerFactorHistory: generatePowerQualityHistory(0.95, 0.02),
    thdHistory: generatePowerQualityHistory(2.1, 0.5),
    voltageHistory: generatePowerQualityHistory(480, 8)
  }
};

// Energy anomalies
export const upstreamEnergyAnomalies: EnergyAnomaly[] = [
  {
    id: "anom-001",
    meterId: "em-wh-01",
    timestamp: "2024-12-16T14:30:00Z",
    type: "spike",
    magnitudePct: 25,
    severity: "Medium",
    description: "Unexpected demand spike during normal operations",
    resolved: false,
    estimatedCostImpact: 150
  },
  {
    id: "anom-002",
    meterId: "em-gc-11",
    timestamp: "2024-12-16T08:15:00Z",
    type: "baseline_drift",
    magnitudePct: 12,
    severity: "Low",
    description: "Gradual increase in baseline consumption over 7 days",
    resolved: false,
    estimatedCostImpact: 320
  },
  {
    id: "anom-003",
    meterId: "em-camp",
    timestamp: "2024-12-16T22:45:00Z",
    type: "standby_waste",
    magnitudePct: 35,
    severity: "High",
    description: "High standby consumption during off-hours",
    resolved: true,
    estimatedCostImpact: 85
  },
  {
    id: "anom-004",
    meterId: "em-gc-11",
    timestamp: "2024-12-15T16:20:00Z",
    type: "power_quality",
    magnitudePct: 8,
    severity: "Medium",
    description: "Power factor degradation affecting efficiency",
    resolved: false,
    estimatedCostImpact: 200
  },
  {
    id: "anom-005",
    meterId: "em-wh-01",
    timestamp: "2024-12-15T11:10:00Z",
    type: "spike",
    magnitudePct: 45,
    severity: "Critical",
    description: "Equipment startup causing demand spike",
    resolved: true,
    estimatedCostImpact: 75
  }
];

// Transmission-specific energy anomalies
export const transmissionEnergyAnomalies: EnergyAnomaly[] = [
  {
    id: "tx-anom-001",
    meterId: "tx-meter-ss1-incomer",
    timestamp: "2024-12-16T14:30:00Z",
    type: "grid_losses",
    magnitudePct: 18,
    severity: "High",
    description: "Excessive transmission losses detected on 220kV line",
    resolved: false,
    estimatedCostImpact: 2500,
    substationName: "Central Substation",
    substationId: "ss-central",
    feederName: "Feeder 220-A",
    feederId: "feeder-220a",
    voltageLevel: 220
  },
  {
    id: "tx-anom-002",
    meterId: "tx-meter-ss2-feeder",
    timestamp: "2024-12-16T09:45:00Z",
    type: "voltage_deviation",
    magnitudePct: 12,
    severity: "Medium",
    description: "Voltage sag detected on 132kV feeder during peak load",
    resolved: false,
    estimatedCostImpact: 1200,
    substationName: "North Substation",
    substationId: "ss-north",
    feederName: "Feeder 132-B",
    feederId: "feeder-132b",
    voltageLevel: 132
  },
  {
    id: "tx-anom-003",
    meterId: "tx-meter-ss1-transformer",
    timestamp: "2024-12-16T16:20:00Z",
    type: "load_imbalance",
    magnitudePct: 25,
    severity: "Critical",
    description: "Severe load imbalance across transformer phases",
    resolved: false,
    estimatedCostImpact: 3500,
    substationName: "Central Substation",
    substationId: "ss-central",
    feederName: "Transformer T1",
    feederId: "transformer-t1",
    voltageLevel: 220
  },
  {
    id: "tx-anom-004",
    meterId: "tx-meter-ss3-incomer",
    timestamp: "2024-12-15T22:15:00Z",
    type: "power_quality",
    magnitudePct: 15,
    severity: "High",
    description: "High THD detected on 400kV grid connection",
    resolved: true,
    estimatedCostImpact: 1800,
    substationName: "South Substation",
    substationId: "ss-south",
    feederName: "Grid Incomer 400kV",
    feederId: "incomer-400",
    voltageLevel: 400
  },
  {
    id: "tx-anom-005",
    meterId: "tx-meter-ss2-feeder",
    timestamp: "2024-12-15T11:30:00Z",
    type: "grid_losses",
    magnitudePct: 22,
    severity: "Critical",
    description: "Abnormal losses indicating potential equipment degradation",
    resolved: false,
    estimatedCostImpact: 4200,
    substationName: "North Substation",
    substationId: "ss-north",
    feederName: "Feeder 132-A",
    feederId: "feeder-132a",
    voltageLevel: 132
  },
  {
    id: "tx-anom-006",
    meterId: "tx-meter-ss1-feeder",
    timestamp: "2024-12-15T08:00:00Z",
    type: "voltage_deviation",
    magnitudePct: 8,
    severity: "Low",
    description: "Minor voltage fluctuation during load switching",
    resolved: true,
    estimatedCostImpact: 500,
    substationName: "Central Substation",
    substationId: "ss-central",
    feederName: "Feeder 220-B",
    feederId: "feeder-220b",
    voltageLevel: 220
  },
  {
    id: "tx-anom-007",
    meterId: "tx-meter-ss3-transformer",
    timestamp: "2024-12-14T19:45:00Z",
    type: "load_imbalance",
    magnitudePct: 16,
    severity: "Medium",
    description: "Phase imbalance on transformer secondary side",
    resolved: false,
    estimatedCostImpact: 1500,
    substationName: "South Substation",
    substationId: "ss-south",
    feederName: "Transformer T2",
    feederId: "transformer-t2",
    voltageLevel: 132
  },
  {
    id: "tx-anom-008",
    meterId: "tx-meter-ss2-incomer",
    timestamp: "2024-12-14T14:20:00Z",
    type: "spike",
    magnitudePct: 35,
    severity: "High",
    description: "Sudden demand spike during capacitor bank switching",
    resolved: true,
    estimatedCostImpact: 800,
    substationName: "North Substation",
    substationId: "ss-north",
    feederName: "Grid Incomer 132kV",
    feederId: "incomer-132",
    voltageLevel: 132
  }
];

// Controllable loads for demand response
export const upstreamControllableLoads: ControllableLoad[] = [
  {
    id: "cl-esp-07",
    name: "ESP-07 Variable Drive",
    assetId: "ESP-07",
    loadType: "pump",
    sheddingPriority: 3,
    minOffTimeMin: 15,
    maxShedMin: 60,
    currentKW: 45.2,
    status: "available"
  },
  {
    id: "cl-gc-11-motor",
    name: "GC-11 Motor Drive",
    assetId: "GC-11",
    loadType: "compressor",
    sheddingPriority: 1,
    minOffTimeMin: 5,
    maxShedMin: 30,
    currentKW: 125.3,
    status: "available"
  },
  {
    id: "cl-p-21",
    name: "P-21 Transfer Pump",
    assetId: "P-21",
    loadType: "pump",
    sheddingPriority: 4,
    minOffTimeMin: 10,
    maxShedMin: 45,
    currentKW: 25.0,
    status: "available"
  },
  {
    id: "cl-camp-hvac",
    name: "Camp HVAC System",
    assetId: "CAMP-01",
    loadType: "hvac",
    sheddingPriority: 5,
    minOffTimeMin: 30,
    maxShedMin: 120,
    currentKW: 35.2,
    status: "available"
  },
  {
    id: "cl-camp-lighting",
    name: "Camp Non-Essential Lighting",
    assetId: "CAMP-01",
    loadType: "lighting",
    sheddingPriority: 6,
    minOffTimeMin: 60,
    maxShedMin: 240,
    currentKW: 8.5,
    status: "available"
  }
];

// Generator, UPS, and renewable assets
export const upstreamGeneratorUpsRenewable: GeneratorUpsRenewable[] = [
  {
    id: "gen-01",
    name: "Emergency Diesel Generator",
    type: "generator",
    capacityKw: 500,
    status: "offline",
    fuelType: "diesel",
    currentOutput: 0
  },
  {
    id: "gen-02",
    name: "Gas-Fired Generator",
    type: "generator",
    capacityKw: 750,
    status: "offline",
    fuelType: "gas",
    currentOutput: 0
  },
  {
    id: "ups-01",
    name: "Control Systems UPS",
    type: "ups",
    capacityKw: 25,
    status: "online",
    fuelType: "battery",
    currentOutput: 12.5
  },
  {
    id: "ups-02",
    name: "Communications UPS",
    type: "ups",
    capacityKw: 10,
    status: "online",
    fuelType: "battery",
    currentOutput: 4.2
  },
  {
    id: "solar-01",
    name: "Camp Solar Array",
    type: "solar",
    capacityKw: 100,
    status: "online",
    fuelType: "solar",
    currentOutput: 65.3
  },
  {
    id: "solar-02",
    name: "Wellpad Solar System",
    type: "solar",
    capacityKw: 50,
    status: "maintenance",
    fuelType: "solar",
    currentOutput: 0
  }
];

// Demand response signals and events
export const upstreamDemandResponseSignals: DemandResponseSignal[] = [
  {
    id: "dr-001",
    timestamp: "2024-12-16T15:30:00Z",
    eventType: "peak_shaving",
    requestedReductionKw: 75,
    durationMin: 60,
    status: "active"
  },
  {
    id: "dr-002",
    timestamp: "2024-12-16T09:15:00Z",
    eventType: "load_shifting",
    requestedReductionKw: 50,
    durationMin: 120,
    status: "completed"
  },
  {
    id: "dr-003",
    timestamp: "2024-12-15T18:45:00Z",
    eventType: "emergency",
    requestedReductionKw: 200,
    durationMin: 30,
    status: "completed"
  },
  {
    id: "dr-004",
    timestamp: "2024-12-15T14:20:00Z",
    eventType: "peak_shaving",
    requestedReductionKw: 100,
    durationMin: 90,
    status: "cancelled"
  }
];

// Report templates
export const upstreamReportTemplates: ReportTemplate[] = [
  {
    id: "rpt-energy-daily",
    name: "Daily Energy Summary",
    description: "Daily energy consumption and cost summary by meter and asset",
    frequency: "daily",
    lastRunAt: "2024-12-16T06:00:00Z",
    category: "energy"
  },
  {
    id: "rpt-emissions-monthly",
    name: "Monthly Emissions Report",
    description: "CO2 emissions breakdown by scope and energy type",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:00:00Z",
    category: "emissions"
  },
  {
    id: "rpt-compliance-quarterly",
    name: "Quarterly Compliance Report",
    description: "Energy compliance status and regulatory reporting",
    frequency: "quarterly",
    lastRunAt: "2024-10-01T09:00:00Z",
    category: "compliance"
  },
  {
    id: "rpt-cost-weekly",
    name: "Weekly Cost Analysis",
    description: "Energy cost breakdown and variance analysis",
    frequency: "weekly",
    lastRunAt: "2024-12-09T07:00:00Z",
    category: "cost"
  },
  {
    id: "rpt-intensity-monthly",
    name: "Energy Intensity Scorecard",
    description: "kWh/BBL and CO2/BBL intensity metrics with benchmarks",
    frequency: "monthly",
    lastRunAt: "2024-12-01T08:30:00Z",
    category: "energy"
  },
  {
    id: "rpt-pq-weekly",
    name: "Power Quality Summary",
    description: "Power quality events and compliance metrics",
    frequency: "weekly",
    lastRunAt: "2024-12-09T07:30:00Z",
    category: "compliance"
  }
];

// Export jobs
export const upstreamExportJobs: ExportJob[] = [
  {
    id: "exp-001",
    dataset: "Energy Consumption Data",
    format: "csv",
    requestedAt: "2024-12-16T10:30:00Z",
    status: "completed",
    deliveredAt: "2024-12-16T10:35:00Z"
  },
  {
    id: "exp-002",
    dataset: "Emissions Report",
    format: "pdf",
    requestedAt: "2024-12-16T09:15:00Z",
    status: "completed",
    deliveredAt: "2024-12-16T09:22:00Z"
  },
  {
    id: "exp-003",
    dataset: "Power Quality Events",
    format: "xlsx",
    requestedAt: "2024-12-16T11:45:00Z",
    status: "processing"
  },
  {
    id: "exp-004",
    dataset: "Cost Analysis",
    format: "csv",
    requestedAt: "2024-12-16T08:20:00Z",
    status: "failed"
  },
  {
    id: "exp-005",
    dataset: "Anomaly Investigation",
    format: "pdf",
    requestedAt: "2024-12-15T16:30:00Z",
    status: "completed",
    deliveredAt: "2024-12-15T16:38:00Z"
  }
];

// Production context data
export const upstreamProductionContext: ProductionContext = {
  barrelsPerDay: 1250,
  mscfPerDay: 850,
  runtimeHoursPerDay: 22.5,
  lastUpdated: "2024-12-16T12:00:00Z"
};

// Enhanced baselines and benchmarks for all meters
export const upstreamEnergyBaselinesExtended: EnergyBaseline[] = [
  {
    meterId: "em-wh-01",
    baselineKWhPerDay: 3480, // 145 kW * 24 hours
    baselineKWhPerBBL: 2.78, // kWh per barrel produced (3480/1250)
    baselineKWhPerMSCF: undefined
  },
  {
    meterId: "em-gc-11",
    baselineKWhPerDay: 21425, // 892.7 kW * 24 hours
    baselineKWhPerBBL: undefined,
    baselineKWhPerMSCF: 25.2 // kWh per thousand standard cubic feet (21425/850)
  },
  {
    meterId: "em-camp",
    baselineKWhPerDay: 1615, // 67.3 kW * 24 hours
    baselineKWhPerBBL: 1.29, // Allocated per barrel (1615/1250)
    baselineKWhPerMSCF: undefined
  }
];

// Benchmark data for comparison
export const upstreamEnergyBenchmarks = {
  industryAverages: {
    kWhPerBBL: 3.2,
    co2KgPerBBL: 1.44,
    kWhPerMSCF: 28.5,
    co2KgPerMSCF: 12.8
  },
  bestInClass: {
    kWhPerBBL: 2.1,
    co2KgPerBBL: 0.95,
    kWhPerMSCF: 18.2,
    co2KgPerMSCF: 8.2
  },
  currentPerformance: {
    kWhPerBBL: 2.78,
    co2KgPerBBL: 1.25,
    kWhPerMSCF: 25.2,
    co2KgPerMSCF: 11.3
  }
};

// =============================================================================
// EMS Extended Mock Data Types
// =============================================================================

// Note: Submeter interface is defined above

export interface PowerQuality {
  meterId: string;
  powerFactor: number;
  thdPct: number;
  voltageV: number;
  frequencyHz: number;
  sagEventsCount: number;
  swellEventsCount: number;
  timestamp: string[];
  powerFactorHistory?: number[];
  thdHistory?: number[];
  voltageHistory?: number[];
}

export interface EnergyAnomaly {
  id: string;
  meterId: string;
  timestamp: string;
  type: "spike" | "baseline_drift" | "power_quality" | "standby_waste" | "grid_losses" | "voltage_deviation" | "load_imbalance";
  magnitudePct: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  resolved: boolean;
  estimatedCostImpact?: number;
  // Transmission-specific context
  substationName?: string;
  substationId?: string;
  feederName?: string;
  feederId?: string;
  voltageLevel?: number;
}

export interface ControllableLoad {
  id: string;
  name: string;
  assetId: string;
  loadType: "pump" | "compressor" | "lighting" | "hvac" | "capacitor_bank" | "transformer_tap" | "battery_storage";
  sheddingPriority: number;
  minOffTimeMin: number;
  maxShedMin: number;
  currentKW: number;
  status: "available" | "shedding" | "unavailable" | "maintenance";
}

export interface GeneratorUpsRenewable {
  id: string;
  name: string;
  type: "generator" | "ups" | "solar";
  capacityKw: number;
  status: "online" | "offline" | "maintenance";
  fuelType?: "diesel" | "gas" | "battery" | "solar";
  currentOutput?: number;
}

export interface DemandResponseSignal {
  id: string;
  timestamp: string;
  eventType: "peak_shaving" | "load_shifting" | "emergency";
  requestedReductionKw: number;
  durationMin: number;
  status: "pending" | "active" | "completed" | "cancelled";
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly";
  lastRunAt?: string;
  category: "energy" | "emissions" | "compliance" | "cost";
}

export interface ExportJob {
  id: string;
  dataset: string;
  format: "csv" | "pdf" | "xlsx";
  requestedAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  deliveredAt?: string;
}

export interface ProductionContext {
  barrelsPerDay: number;
  mscfPerDay: number;
  runtimeHoursPerDay: number;
  lastUpdated: string;
}

// Note: UpstreamTelemetry and UpstreamAlert interfaces are defined above
// Note: generateTimeSeriesData function is defined above

export const upstreamTelemetry: UpstreamTelemetry = {
  "WH-01": {
    pressure: generateTimeSeriesData(2850, 50, "psi", "Normal"),
    temperature: generateTimeSeriesData(185, 10, "°F", "Normal"),
    flowRate: generateTimeSeriesData(1250, 100, "bbl/day", "Normal"),
  },
  "ESP-07": {
    motorCurrent: generateTimeSeriesData(45.2, 3, "A", "Normal"),
    intakePressure: generateTimeSeriesData(1850, 75, "psi", "Normal"),
    dischargePressure: generateTimeSeriesData(3200, 150, "psi", "Normal"),
    vibration: generateTimeSeriesData(2.1, 0.3, "mm/s", "Normal"),
  },
  "GC-11": {
    suctionPressure: generateTimeSeriesData(850, 40, "psi", "Normal"),
    dischargePressure: generateTimeSeriesData(1450, 80, "psi", "Warning"),
    gasTemp: generateTimeSeriesData(165, 15, "°F", "Normal"),
    vibration: generateTimeSeriesData(4.8, 0.8, "mm/s", "Warning"),
  },
  "P-21": {
    flowRate: generateTimeSeriesData(850, 60, "bbl/hr", "Normal"),
    suctionPressure: generateTimeSeriesData(120, 15, "psi", "Normal"),
    dischargePressure: generateTimeSeriesData(450, 30, "psi", "Normal"),
    motorCurrent: generateTimeSeriesData(28.5, 2, "A", "Normal"),
  },
  "KO-03": {
    pressure: generateTimeSeriesData(25, 5, "psi", "Critical"),
    temperature: generateTimeSeriesData(95, 8, "°F", "Critical"),
    level: generateTimeSeriesData(65, 10, "%", "Critical"),
    flowRate: generateTimeSeriesData(200, 50, "scf/min", "Critical"),
  },
};

export const complianceStandards: ComplianceStandard[] = [
  ...legacyComplianceStandards,
  ...upstreamComplianceStandards.map(migrateUpstreamComplianceStandard)
];

// Unified audit log entries combining legacy and upstream data
const legacyAuditLogEntries: AuditLogEntry[] = [
  {
    id: "al1",
    tenantId: "t1",
    timestamp: "2024-01-15T14:30:00Z",
    eventType: "login",
    category: "authentication",
    user: "John Doe",
    userId: "u1",
    action: "User login",
    resource: "Security Dashboard",
    resourceType: "application",
    outcome: "success",
    ipAddress: "192.168.1.100",
    sessionId: "sess-12345",
    details: "Successful login from trusted network",
    severity: "info"
  },
  {
    id: "al2",
    tenantId: "t1",
    timestamp: "2024-01-15T14:23:00Z",
    eventType: "login-failed",
    category: "authentication",
    user: "unknown",
    userId: "unknown",
    action: "Failed login attempt",
    resource: "Security Dashboard",
    resourceType: "application",
    outcome: "failure",
    ipAddress: "203.0.113.45",
    sessionId: "sess-12344",
    details: "Multiple failed login attempts from unknown IP",
    severity: "critical"
  },
  {
    id: "al3",
    tenantId: "t2",
    timestamp: "2024-01-15T13:45:00Z",
    eventType: "config-change",
    category: "configuration",
    user: "Jane Smith",
    userId: "u2",
    action: "Modified firewall rule",
    resource: "Firewall-01",
    resourceType: "network-device",
    outcome: "success",
    ipAddress: "192.168.1.105",
    sessionId: "sess-12343",
    details: "Updated firewall rule to allow port 443",
    severity: "warning"
  },
  {
    id: "al4",
    tenantId: "t3",
    timestamp: "2024-01-15T13:20:00Z",
    eventType: "access-denied",
    category: "authorization",
    user: "Robert Brown",
    userId: "u5",
    action: "Attempted to access restricted resource",
    resource: "Security Settings",
    resourceType: "configuration",
    outcome: "failure",
    ipAddress: "192.168.1.110",
    sessionId: "sess-12342",
    details: "User lacks required permissions",
    severity: "warning"
  },
  {
    id: "al5",
    tenantId: "t1",
    timestamp: "2024-01-15T12:15:00Z",
    eventType: "data-export",
    category: "data-access",
    user: "Sarah Williams",
    userId: "u4",
    action: "Exported compliance report",
    resource: "Compliance Data",
    resourceType: "report",
    outcome: "success",
    ipAddress: "192.168.1.108",
    sessionId: "sess-12341",
    details: "Exported IEC 62443 compliance report",
    severity: "info"
  },
  {
    id: "al6",
    tenantId: "t3",
    timestamp: "2024-01-15T11:20:00Z",
    eventType: "system-update",
    category: "system",
    user: "Mike Johnson",
    userId: "u3",
    action: "Applied security patch",
    resource: "Main Transformer T1",
    resourceType: "asset",
    outcome: "success",
    ipAddress: "192.168.1.112",
    sessionId: "sess-12340",
    details: "Applied firmware update v2.3.1",
    severity: "info"
  },
  {
    id: "al7",
    tenantId: "t2",
    timestamp: "2024-01-15T10:45:00Z",
    eventType: "alert-created",
    category: "system",
    user: "System",
    userId: "system",
    action: "Created security alert",
    resource: "Tea Dryer TD-01",
    resourceType: "asset",
    outcome: "success",
    ipAddress: "127.0.0.1",
    sessionId: "sess-system",
    details: "Unusual network traffic detected",
    severity: "warning"
  },
  {
    id: "al8",
    tenantId: "t1",
    timestamp: "2024-01-15T09:00:00Z",
    eventType: "role-assigned",
    category: "authorization",
    user: "John Doe",
    userId: "u1",
    action: "Assigned role to user",
    resource: "User: Emily Davis",
    resourceType: "user",
    outcome: "success",
    ipAddress: "192.168.1.100",
    sessionId: "sess-12339",
    details: "Assigned Security Analyst role",
    severity: "info"
  },
  {
    id: "al9",
    tenantId: "t1",
    timestamp: "2024-01-15T08:30:00Z",
    eventType: "backup-completed",
    category: "system",
    user: "System",
    userId: "system",
    action: "Completed scheduled backup",
    resource: "Database",
    resourceType: "system",
    outcome: "success",
    ipAddress: "127.0.0.1",
    sessionId: "sess-system",
    details: "Daily backup completed successfully",
    severity: "info"
  },
  {
    id: "al10",
    tenantId: "t1",
    timestamp: "2024-01-14T18:30:00Z",
    eventType: "account-locked",
    category: "authentication",
    user: "System",
    userId: "system",
    action: "Locked user account",
    resource: "User: Emily Davis",
    resourceType: "user",
    outcome: "success",
    ipAddress: "127.0.0.1",
    sessionId: "sess-system",
    details: "Account locked after 5 failed login attempts",
    severity: "critical"
  }
];

export const auditLogEntries: AuditLogEntry[] = [
  ...legacyAuditLogEntries,
  ...securityAuditEntries.map(migrateSecurityAuditEntry)
];

// Data Protection Status mock data
export const dataProtectionStatus: DataProtectionStatus[] = [
  {
    tenantId: "t1",
    category: "encryption",
    name: "Data Encryption",
    status: "healthy",
    metrics: [
      { label: "Data at Rest", value: "AES-256", status: "good" },
      { label: "Data in Transit", value: "TLS 1.3", status: "good" },
      { label: "Encrypted Volumes", value: "24/24", status: "good" },
      { label: "Key Rotation", value: "Current", status: "good" }
    ],
    policies: [
      {
        id: "dp-1",
        name: "Data Encryption Policy",
        description: "All data must be encrypted at rest and in transit",
        enabled: true,
        scope: ["Database", "File Storage", "Network Traffic"],
        compliance: ["ISO 27001", "IEC 62443"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T10:00:00Z"
  },
  {
    tenantId: "tenant-1",
    category: "backup",
    name: "Backup & Recovery",
    status: "healthy",
    metrics: [
      { label: "Last Backup", value: "2 hours ago", status: "good" },
      { label: "Backup Success Rate", value: "100%", status: "good" },
      { label: "Recovery Time Objective", value: "4 hours", status: "good" },
      { label: "Backup Storage Used", value: "2.3 TB", status: "good" }
    ],
    policies: [
      {
        id: "dp-test-2",
        name: "Daily Backup Policy",
        description: "All critical data must be backed up daily",
        enabled: true,
        scope: ["Database", "Configuration Files", "User Data"],
        compliance: ["ISO 27001", "NIST CSF"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T10:00:00Z"
  },
  {
    tenantId: "tenant-1",
    category: "retention",
    name: "Data Retention",
    status: "healthy",
    metrics: [
      { label: "Audit Logs", value: "90 days", status: "good" },
      { label: "User Activity", value: "60 days", status: "good" },
      { label: "System Logs", value: "30 days", status: "good" },
      { label: "Archived Data", value: "7 years", status: "good" }
    ],
    policies: [
      {
        id: "dp-test-3",
        name: "Audit Log Retention",
        description: "Audit logs must be retained for at least 90 days",
        enabled: true,
        scope: ["Security Logs", "Access Logs", "Change Logs"],
        compliance: ["ISO 27001", "IEC 62443", "NERC CIP"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T10:00:00Z"
  },
  {
    tenantId: "tenant-1",
    category: "access-control",
    name: "Access Control",
    status: "healthy",
    metrics: [
      { label: "Active Users", value: "45", status: "good" },
      { label: "Failed Login Attempts", value: "3", status: "good" },
      { label: "MFA Enabled", value: "100%", status: "good" },
      { label: "Privileged Accounts", value: "8", status: "good" }
    ],
    policies: [
      {
        id: "dp-test-4",
        name: "Multi-Factor Authentication",
        description: "All users must use MFA for authentication",
        enabled: true,
        scope: ["All Users", "Admin Accounts"],
        compliance: ["ISO 27001", "IEC 62443", "NIST CSF"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T10:00:00Z"
  },
  {
    tenantId: "ksa-upstream-jv",
    category: "encryption",
    name: "SCADA & Telemetry Encryption",
    status: "healthy",
    metrics: [
      { label: "SCADA Data at Rest", value: "AES-256", status: "good" },
      { label: "Pipeline Telemetry", value: "TLS 1.3", status: "good" },
      { label: "SIS Configuration", value: "Encrypted", status: "good" },
      { label: "Key Rotation Status", value: "Current", status: "good" }
    ],
    policies: [
      {
        id: "dp-upstream-1",
        name: "SCADA Telemetry Encryption",
        description: "All SCADA telemetry data must be encrypted using AES-256 at rest and TLS 1.3 in transit",
        enabled: true,
        scope: ["SCADA Systems", "Pipeline Telemetry", "Well Data"],
        compliance: ["API 1164", "IEC 62443", "NIST 800-82"]
      },
      {
        id: "dp-upstream-2",
        name: "SIS Configuration Protection",
        description: "Safety Instrumented System configurations must be encrypted and access-controlled",
        enabled: true,
        scope: ["SIS Controllers", "ESD Systems", "Safety Logic"],
        compliance: ["IEC 62443", "API 1164"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T14:00:00Z"
  },
  {
    tenantId: "ksa-upstream-jv",
    category: "backup",
    name: "Critical System Backups",
    status: "healthy",
    metrics: [
      { label: "SCADA Config Backup", value: "4 hours ago", status: "good" },
      { label: "SIS Logic Backup", value: "2 hours ago", status: "good" },
      { label: "Pipeline Settings", value: "6 hours ago", status: "good" },
      { label: "Backup Integrity", value: "100%", status: "good" }
    ],
    policies: [
      {
        id: "dp-upstream-3",
        name: "Critical System Backup Policy",
        description: "SCADA configurations, SIS logic, and pipeline control settings must be backed up every 6 hours",
        enabled: true,
        scope: ["SCADA Configurations", "SIS Logic", "Pipeline Control Settings", "Wellhead Configurations"],
        compliance: ["API 1164", "IEC 62443"]
      },
      {
        id: "dp-upstream-4",
        name: "Safety System Backup Verification",
        description: "Safety-critical system backups must be verified for integrity every 24 hours",
        enabled: true,
        scope: ["SIS Controllers", "ESD Systems", "Fire & Gas Systems"],
        compliance: ["IEC 62443", "API 1164"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T14:00:00Z"
  },
  {
    tenantId: "ksa-upstream-jv",
    category: "retention",
    name: "Upstream Data Retention",
    status: "healthy",
    metrics: [
      { label: "Process Data", value: "7 years", status: "good" },
      { label: "Safety Events", value: "10 years", status: "good" },
      { label: "Security Logs", value: "3 years", status: "good" },
      { label: "Configuration Changes", value: "5 years", status: "good" }
    ],
    policies: [
      {
        id: "dp-upstream-5",
        name: "Process Data Retention",
        description: "Production and process data must be retained for 7 years per regulatory requirements",
        enabled: true,
        scope: ["Production Data", "Process Variables", "Well Performance Data"],
        compliance: ["API 1164", "Local Regulations"]
      },
      {
        id: "dp-upstream-6",
        name: "Safety Event Retention",
        description: "Safety-related events and SIS activations must be retained for 10 years",
        enabled: true,
        scope: ["SIS Activations", "ESD Events", "Safety Alarms"],
        compliance: ["IEC 62443", "API 1164", "Local Safety Regulations"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T14:00:00Z"
  },
  {
    tenantId: "ksa-upstream-jv",
    category: "access-control",
    name: "OT System Access Control",
    status: "warning",
    metrics: [
      { label: "Active OT Users", value: 89, status: "good" },
      { label: "Remote Sessions (24h)", value: 12, status: "good" },
      { label: "Failed Access Attempts", value: 8, status: "warning" },
      { label: "MFA Coverage", value: "94%", status: "warning" }
    ],
    policies: [
      {
        id: "dp-upstream-7",
        name: "OT System Access Control",
        description: "All access to OT systems must be authenticated and authorized with role-based permissions",
        enabled: true,
        scope: ["SCADA Systems", "SIS Controllers", "Pipeline Control", "Wellhead Systems"],
        compliance: ["IEC 62443", "API 1164", "NIST 800-82"]
      },
      {
        id: "dp-upstream-8",
        name: "Remote Access Security",
        description: "Remote access to upstream systems requires MFA and session monitoring",
        enabled: true,
        scope: ["Remote SCADA Access", "Vendor Access", "Engineering Workstations"],
        compliance: ["IEC 62443", "API 1164"]
      }
    ],
    violations: 1,
    lastChecked: "2024-01-15T14:00:00Z"
  },
  {
    tenantId: "offshore-field-alpha",
    category: "encryption",
    name: "Platform Data Encryption",
    status: "healthy",
    metrics: [
      { label: "Platform SCADA", value: "AES-256", status: "good" },
      { label: "Satellite Comms", value: "Encrypted", status: "good" },
      { label: "Safety Systems", value: "Protected", status: "good" },
      { label: "Key Management", value: "Automated", status: "good" }
    ],
    policies: [
      {
        id: "dp-offshore-1",
        name: "Offshore Platform Encryption",
        description: "All platform control and safety data must be encrypted for satellite transmission",
        enabled: true,
        scope: ["Platform Control", "Safety Systems", "Production Data"],
        compliance: ["API 1164", "IEC 62443"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T13:30:00Z"
  },
  {
    tenantId: "offshore-field-alpha",
    category: "backup",
    name: "Platform System Backups",
    status: "healthy",
    metrics: [
      { label: "Control System Backup", value: "3 hours ago", status: "good" },
      { label: "Safety Logic Backup", value: "1 hour ago", status: "good" },
      { label: "Satellite Link Status", value: "Online", status: "good" },
      { label: "Onshore Sync", value: "Synchronized", status: "good" }
    ],
    policies: [
      {
        id: "dp-offshore-2",
        name: "Platform Backup Policy",
        description: "Platform systems must be backed up every 4 hours with onshore synchronization",
        enabled: true,
        scope: ["Platform Control", "Safety Systems", "Production Systems"],
        compliance: ["API 1164", "IEC 62443"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T13:30:00Z"
  },
  {
    tenantId: "onshore-field-bravo",
    category: "encryption",
    name: "Field Data Protection",
    status: "healthy",
    metrics: [
      { label: "Well Data Encryption", value: "AES-256", status: "good" },
      { label: "Pipeline Telemetry", value: "TLS 1.3", status: "good" },
      { label: "Field Gateway", value: "Secured", status: "good" },
      { label: "Certificate Status", value: "Valid", status: "good" }
    ],
    policies: [
      {
        id: "dp-onshore-1",
        name: "Field Data Encryption Policy",
        description: "All well and pipeline data must be encrypted during transmission and storage",
        enabled: true,
        scope: ["Well Data", "Pipeline Systems", "Field Devices"],
        compliance: ["API 1164", "IEC 62443", "NIST 800-82"]
      }
    ],
    violations: 0,
    lastChecked: "2024-01-15T14:15:00Z"
  }
];

export const upstreamAssetTypes: AssetType[] = [
  { id: "wellhead", name: "Wellhead", category: "Production", icon: "🛢️", assetCount: 1, properties: ["Pressure", "Temperature", "Flow Rate", "Choke Position"] },
  { id: "esp-pump", name: "ESP Pump", category: "Artificial Lift", icon: "⚡", assetCount: 1, properties: ["Motor Current", "Intake Pressure", "Discharge Pressure", "Vibration"] },
  { id: "gas-compressor", name: "Gas Compressor", category: "Gas Processing", icon: "🌀", assetCount: 1, properties: ["Suction Pressure", "Discharge Pressure", "Gas Temperature", "Vibration"] },
  { id: "crude-pump", name: "Crude Transfer Pump", category: "Transfer", icon: "💧", assetCount: 1, properties: ["Flow Rate", "Suction Pressure", "Discharge Pressure", "Motor Current"] },
  { id: "flare-ko", name: "Flare KO Drum", category: "Safety", icon: "🔥", assetCount: 1, properties: ["Pressure", "Temperature", "Level", "Flow Rate"] },
];

const upstreamAssetTypesDisplay: AssetType[] = upstreamAssetTypes;

// Upstream alerts for root cause diagnostics
export const upstreamAlerts: UpstreamAlert[] = [
  {
    id: "alert-001",
    title: "High Vibration Detected",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    severity: "Warning",
    timestamp: "2024-01-15T14:30:00Z",
    description: "Vibration levels exceeded normal operating range (4.8 mm/s vs 3.0 mm/s threshold)",
    likelyCauses: [
      "Bearing wear or misalignment",
      "Rotor imbalance due to fouling",
      "Foundation looseness or settling",
      "Coupling misalignment",
      "Blade or vane damage"
    ],
    correctiveActions: [
      "Perform vibration analysis to identify frequency patterns",
      "Inspect coupling alignment and foundation bolts",
      "Check bearing condition and lubrication",
      "Schedule balancing if rotor imbalance confirmed",
      "Consider temporary load reduction if vibration increases"
    ],
    status: "Investigating"
  },
  {
    id: "alert-002",
    title: "Pressure System Failure",
    assetId: "KO-03",
    assetName: "Flare KO Drum KO-03",
    severity: "Critical",
    timestamp: "2024-01-15T08:15:00Z",
    description: "System pressure dropped to 25 psi, below minimum operating threshold of 30 psi",
    likelyCauses: [
      "Downstream valve malfunction or blockage",
      "Internal vessel damage or corrosion",
      "Instrumentation failure or calibration drift",
      "Upstream process upset affecting flow",
      "Safety relief valve premature opening"
    ],
    correctiveActions: [
      "Immediately isolate vessel and depressurize safely",
      "Inspect all downstream valves and piping",
      "Perform internal inspection for damage or blockage",
      "Calibrate pressure instrumentation",
      "Review upstream process conditions and controls"
    ],
    status: "Active"
  },
  {
    id: "alert-003",
    title: "Motor Current Anomaly",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    severity: "Warning",
    timestamp: "2024-01-15T12:45:00Z",
    description: "Motor current fluctuating between 42-48A, outside normal range of 44-46A",
    likelyCauses: [
      "Pump cavitation due to low suction pressure",
      "Impeller wear or damage",
      "Motor bearing deterioration",
      "Electrical supply voltage fluctuations",
      "Downhole cable insulation degradation"
    ],
    correctiveActions: [
      "Monitor suction pressure and adjust if necessary",
      "Check electrical supply quality and voltage stability",
      "Perform motor insulation resistance test",
      "Review pump performance curves and operating point",
      "Schedule downhole inspection if current trend continues"
    ],
    status: "Investigating"
  },
  {
    id: "alert-004",
    title: "Flow Rate Decline",
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    severity: "Warning",
    timestamp: "2024-01-15T10:20:00Z",
    description: "Production flow rate decreased from 1250 to 1180 bbl/day over past 48 hours",
    likelyCauses: [
      "Reservoir pressure depletion",
      "Wellbore damage or sand production",
      "Choke or surface equipment restriction",
      "Formation water breakthrough",
      "Artificial lift system inefficiency"
    ],
    correctiveActions: [
      "Analyze reservoir pressure trends and decline curves",
      "Inspect surface equipment for restrictions or damage",
      "Review choke settings and optimize if needed",
      "Consider well stimulation or workover operations",
      "Monitor water cut and gas-oil ratio trends"
    ],
    status: "Investigating"
  },
  {
    id: "alert-005",
    title: "Temperature Excursion",
    assetId: "P-21",
    assetName: "Crude Transfer Pump P-21",
    timestamp: "2024-01-14T16:30:00Z",
    severity: "Information",
    status: "Investigating",
    description: "Pump casing temperature reached 95°F, approaching high alarm of 100°F",
    likelyCauses: [
      "Bearing lubrication degradation",
      "Pump operating at low flow conditions",
      "Ambient temperature increase",
      "Cooling system inefficiency",
      "Internal recirculation or bypass issues"
    ],
    correctiveActions: [
      "Check bearing lubrication level and condition",
      "Verify pump operating point against performance curve",
      "Inspect cooling system operation and flow rates",
      "Monitor ambient conditions and ventilation",
      "Consider flow rate adjustment to optimal range"
    ]
  }
];

// End of consolidated dataProtectionStatus


// Note: These exports are now populated from the unified data above
// They are kept for backward compatibility

// Helper functions for accessing security mock data by tenant
export function getSecurityAlertsByTenant(tenantId: string): SecurityAlert[] {
  return securityAlerts.filter(alert => alert.tenantId === tenantId);
}

export function getUsersByTenant(tenantId: string): SecurityUser[] {
  return users.filter(user => user.tenantId === tenantId);
}

export function getRolesByTenant(tenantId: string): Role[] {
  return roles.filter(role => role.tenantId === tenantId);
}

export function getOtAssetSecurityByTenant(tenantId: string): OtAssetSecurity[] {
  return otAssetSecurity.filter(asset => asset.tenantId === tenantId);
}

export function getComplianceStandardsByTenant(tenantId: string): ComplianceStandard[] {
  return complianceStandards.filter((standard: ComplianceStandard) => standard.tenantId === tenantId);
}

export function getAuditLogEntriesByTenant(tenantId: string): AuditLogEntry[] {
  return auditLogEntries.filter((entry: AuditLogEntry) => entry.tenantId === tenantId);
}

export function getDataProtectionStatusByTenant(tenantId: string): DataProtectionStatus[] {
  return dataProtectionStatus.filter((status: DataProtectionStatus) => status.tenantId === tenantId);
}

// =============================================================================
// Additional Unified Data Exports (from upstream sources)
// =============================================================================

// Export upstream-specific data with unified structure
export { securityZones } from "./upstreamSecurityMockData";
export { conduits } from "./upstreamSecurityMockData";
// export { upstreamAssetTypes } from "./upstreamMockData"; // Conflicting export removed
export { remoteSessions } from "./upstreamSecurityMockData";
export { incidentCases } from "./upstreamSecurityMockData";
export { anomalySignals } from "./upstreamSecurityMockData";
export { securityControls } from "./upstreamSecurityMockData";
export { riskEntries } from "./upstreamSecurityMockData";
export { accessPolicies } from "./upstreamSecurityMockData";

// =============================================================================
// Unified Helper Functions
// =============================================================================

// Asset-related functions
export function getAssetsByTenant(tenantId: string): SecurityAsset[] {
  return assets.filter(asset => asset.tenantId === tenantId);
}

export function getUpstreamAssets(tenantId: string): SecurityAsset[] {
  return assets.filter(asset => asset.tenantId === tenantId && asset.oilGas);
}

export function getSafetyCriticalAssets(tenantId: string): SecurityAsset[] {
  return assets.filter(asset =>
    asset.tenantId === tenantId &&
    asset.oilGas &&
    (asset.oilGas.criticality === 'safety-critical' || asset.oilGas.inSafetyLoop)
  );
}

// Site-related functions
export function getSitesByTenant(tenantId: string): Site[] {
  return sites.filter(site => site.tenantId === tenantId);
}

export function getUpstreamSites(tenantId: string): Site[] {
  return sites.filter(site => site.tenantId === tenantId && site.oilGas);
}

// Alert-related functions
export function getUpstreamSecurityAlerts(tenantId: string): SecurityAlert[] {
  return securityAlerts.filter(alert =>
    alert.tenantId === tenantId
  );
}

export function getSafetyCriticalAlerts(tenantId: string): SecurityAlert[] {
  return securityAlerts.filter(alert =>
    alert.tenantId === tenantId && alert.severity === 'critical'
  );
}

// User-related functions
export function getUpstreamUsers(tenantId: string): SecurityUser[] {
  return users.filter(user => user.tenantId === tenantId && user.oilGas);
}

export function searchUsers(tenantId: string, searchQuery: string): SecurityUser[] {
  const query = searchQuery.toLowerCase();
  return users.filter(user =>
    user.tenantId === tenantId && (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.role && user.role.toLowerCase().includes(query))
    )
  );
}

// Compliance-related functions
export function getUpstreamComplianceStandards(tenantId: string): ComplianceStandard[] {
  return complianceStandards.filter((standard: ComplianceStandard) =>
    standard.tenantId === tenantId
  );
}

// Remote session functions
export function getRemoteSessionsByTenant(tenantId: string): RemoteSession[] {
  return remoteSessions.filter(session => session.tenantId === tenantId);
}

export function getActiveRemoteSessions(tenantId: string): RemoteSession[] {
  return remoteSessions.filter(session =>
    session.tenantId === tenantId && session.status === 'active'
  );
}

// Security zone functions
export function getSecurityZonesByTenant(tenantId: string): SecurityZone[] {
  return securityZones.filter(zone => zone.tenantId === tenantId);
}

// Risk and control functions
export function getRiskEntriesByTenant(tenantId: string): RiskEntry[] {
  return riskEntries.filter(risk => risk.tenantId === tenantId);
}

export function getSecurityControlsByTenant(tenantId: string): SecurityControl[] {
  return securityControls.filter(control => control.tenantId === tenantId);
}

// Access policy functions
export function getAccessPoliciesByTenant(tenantId: string): AccessPolicy[] {
  return accessPolicies.filter(policy => policy.tenantId === tenantId);
}

// Security policy functions
export function getSecurityPoliciesByTenant(tenantId: string): SecurityPolicy[] {
  return upstreamSecurityMockData.getSecurityPoliciesByTenant(tenantId);
}

// Security exception functions
export function getSecurityExceptionsByTenant(tenantId: string) {
  return upstreamSecurityMockData.getSecurityExceptionsByTenant(tenantId);
}
// Performance Feature Mock Data
export const performancePanels: PerformancePanel[] = [
  // Cross-Sector Core
  {
    id: "perf-001",
    name: "Line 1 Performance",
    type: "line" as const,
    asset: "Production Line 1",
    site: "Athi River Plant",
    oee: 78.5,
    availability: 92.3,
    performance: 87.2,
    quality: 97.6,
    lastUpdated: "5 minutes ago",
    oeeMetrics: {
      availability: 92.3,
      performance: 87.2,
      quality: 97.6,
      overall: 78.5,
      target: 85.0,
      variance: -6.5,
      trend: "declining" as const
    },
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-002",
    name: "Line 2 Performance",
    type: "line" as const,
    asset: "Production Line 2",
    site: "Athi River Plant",
    oee: 65.2,
    availability: 85.4,
    performance: 79.8,
    quality: 95.7,
    lastUpdated: "3 minutes ago",
    oeeMetrics: {
      availability: 85.4,
      performance: 79.8,
      quality: 95.7,
      overall: 65.2,
      target: 80.0,
      variance: -14.8,
      trend: "declining" as const
    },
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  // Oil & Gas - Upstream
  {
    id: "perf-upstream-001",
    name: "Well Pad Alpha Performance",
    type: "line" as const,
    asset: "Well Pad Alpha",
    site: "Permian Basin",
    oee: 82.1,
    availability: 89.5,
    performance: 91.8,
    quality: 99.9,
    lastUpdated: "2 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    oeeMetrics: {
      availability: 89.5,
      performance: 91.8,
      quality: 99.9,
      overall: 82.1,
      target: 85.0,
      variance: -2.9,
      trend: "stable" as const
    },
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-upstream-002",
    name: "Well Pad Beta Performance",
    type: "line" as const,
    asset: "Well Pad Beta",
    site: "Eagle Ford",
    oee: 76.3,
    availability: 85.2,
    performance: 89.6,
    quality: 99.8,
    lastUpdated: "4 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    oeeMetrics: {
      availability: 85.2,
      performance: 89.6,
      quality: 99.8,
      overall: 76.3,
      target: 80.0,
      variance: -3.7,
      trend: "improving" as const
    },
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-upstream-003",
    name: "Well Deferment Analysis",
    type: "line" as const,
    asset: "Field Operations",
    site: "Bakken Formation",
    oee: 73.8,
    availability: 81.2,
    performance: 90.9,
    quality: 99.9,
    lastUpdated: "6 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    oeeMetrics: {
      availability: 81.2,
      performance: 90.9,
      quality: 99.9,
      overall: 73.8,
      target: 80.0,
      variance: -6.2,
      trend: "declining" as const
    },
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  }
];

// Loss Analysis Mock Data
export const losses: Loss[] = [
  {
    category: "Equipment Failure",
    duration: 45,
    frequency: 3,
    impact: 12.5
  },
  {
    category: "Setup/Changeover",
    duration: 30,
    frequency: 8,
    impact: 8.2
  },
  {
    category: "Minor Stoppages",
    duration: 25,
    frequency: 15,
    impact: 6.8
  },
  {
    category: "Reduced Speed",
    duration: 60,
    frequency: 5,
    impact: 15.3
  },
  {
    category: "Quality Defects",
    duration: 20,
    frequency: 12,
    impact: 4.2
  }
];

// Bottleneck Analysis Mock Data
export const bottlenecks: Bottleneck[] = [
  {
    id: "bottleneck-001",
    asset: "Production Line 1",
    constraint: "Line Speed Limitation",
    severity: "high" as const,
    impact: "Reduces overall throughput by 15%"
  },
  {
    id: "bottleneck-002",
    asset: "Production Line 2",
    constraint: "Material Feed Rate",
    severity: "medium" as const,
    impact: "Causes intermittent slowdowns"
  },
  {
    id: "bottleneck-003",
    asset: "Well Pad Alpha",
    constraint: "Pump Capacity",
    severity: "high" as const,
    impact: "Limits production to 80% of potential"
  },
  {
    id: "bottleneck-004",
    asset: "Field Operations",
    constraint: "Pipeline Pressure",
    severity: "low" as const,
    impact: "Minor flow restrictions during peak demand"
  }
];

// Duplicate performancePanels removed - already declared above

// Duplicate losses removed - already declared above

// Duplicate bottlenecks removed - already declared above

// Lean Execution (SIM) Feature Mock Data
export const simBoards: SIMBoard[] = [
  // Cross-Sector Core
  {
    id: "sim-001",
    name: "Day Shift - Line 1",
    shift: "Day",
    date: "2024-12-10",
    status: "on-track",
    kpis: [
      { id: "kpi-1", name: "Production Rate", target: 150, actual: 142, unit: "units/hour", status: "warning", trend: "stable", variance: -5.3 }
    ],
    events: [
      { id: "evt-1", eventType: "maintenance", description: "Scheduled maintenance", timestamp: "2024-12-10T08:00:00Z", impact: "low", status: "resolved" }
    ],
    actions: [
      { id: "act-1", description: "Check conveyor alignment", priority: "medium", status: "completed", assignee: "John Doe", dueTime: "2024-12-10T10:00:00Z", completedTime: "2024-12-10T09:45:00Z" }
    ],
    metrics: {
      shiftPerformance: 85.2,
      targetAchievement: 94.7,
      eventCount: 3,
      actionCompletionRate: 100
    }
  },
  {
    id: "sim-002",
    name: "Night Shift - Line 1",
    shift: "Night",
    date: "2024-12-09",
    status: "at-risk",
    kpis: [
      { id: "kpi-2", name: "Production Rate", target: 150, actual: 135, unit: "units/hour", status: "warning", trend: "declining", variance: -10.0 }
    ],
    events: [
      { id: "evt-2", eventType: "breakdown", description: "Equipment failure", timestamp: "2024-12-09T22:00:00Z", impact: "high", status: "active" }
    ],
    actions: [
      { id: "act-2", description: "Repair equipment", priority: "high", status: "in-progress", assignee: "Jane Smith", dueTime: "2024-12-10T02:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 78.5,
      targetAchievement: 90.0,
      eventCount: 5,
      actionCompletionRate: 80
    }
  },
  {
    id: "sim-003",
    name: "Day Shift - Line 2",
    shift: "Day",
    date: "2024-12-10",
    status: "behind",
    kpis: [
      { id: "kpi-3", name: "Production Rate", target: 150, actual: 125, unit: "units/hour", status: "critical", trend: "declining", variance: -16.7 }
    ],
    events: [
      { id: "evt-3", eventType: "quality", description: "Quality issue detected", timestamp: "2024-12-10T09:00:00Z", impact: "medium", status: "active" }
    ],
    actions: [
      { id: "act-3", description: "Investigate quality issue", priority: "high", status: "pending", assignee: "Mike Johnson", dueTime: "2024-12-10T11:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 72.3,
      targetAchievement: 83.3,
      eventCount: 7,
      actionCompletionRate: 60
    }
  },
  // Oil & Gas - Upstream
  {
    id: "sim-upstream-001",
    name: "Day Shift - Pad Alpha",
    shift: "Day",
    date: "2024-12-10",
    status: "on-track",
    sector: "Oil & Gas",
    subsector: "Upstream",
    kpis: [
      { id: "kpi-up-1", name: "Well Uptime", target: 95, actual: 97, unit: "%", status: "good", trend: "stable", variance: 2.1 }
    ],
    events: [
      { id: "evt-up-1", eventType: "production", description: "Normal operations", timestamp: "2024-12-10T08:00:00Z", impact: "low", status: "resolved" }
    ],
    actions: [
      { id: "act-up-1", description: "Monitor well pressure", priority: "medium", status: "completed", assignee: "Field Operator", dueTime: "2024-12-10T10:00:00Z", completedTime: "2024-12-10T09:30:00Z" }
    ],
    metrics: {
      shiftPerformance: 92.5,
      targetAchievement: 102.1,
      eventCount: 2,
      actionCompletionRate: 100
    }
  },
  {
    id: "sim-upstream-002",
    name: "Night Shift - Field Operations",
    shift: "Night",
    date: "2024-12-09",
    status: "at-risk",
    sector: "Oil & Gas",
    subsector: "Upstream",
    kpis: [
      { id: "kpi-up-2", name: "Well Uptime", target: 95, actual: 88, unit: "%", status: "warning", trend: "declining", variance: -7.4 }
    ],
    events: [
      { id: "evt-up-2", eventType: "alarm", description: "ESP pump alarm", timestamp: "2024-12-09T23:00:00Z", impact: "high", status: "active" }
    ],
    actions: [
      { id: "act-up-2", description: "Check ESP pump", priority: "high", status: "in-progress", assignee: "Night Operator", dueTime: "2024-12-10T01:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 82.1,
      targetAchievement: 92.6,
      eventCount: 4,
      actionCompletionRate: 75
    }
  },
  {
    id: "sim-upstream-003",
    name: "Day Shift - Well Monitoring",
    shift: "Day",
    date: "2024-12-10",
    status: "behind",
    sector: "Oil & Gas",
    subsector: "Upstream",
    kpis: [
      { id: "kpi-up-3", name: "Well Uptime", target: 95, actual: 85, unit: "%", status: "critical", trend: "declining", variance: -10.5 }
    ],
    events: [
      { id: "evt-up-3", eventType: "shutdown", description: "Well shutdown", timestamp: "2024-12-10T07:00:00Z", impact: "high", status: "active" }
    ],
    actions: [
      { id: "act-up-3", description: "Investigate shutdown", priority: "high", status: "pending", assignee: "Senior Operator", dueTime: "2024-12-10T09:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 75.8,
      targetAchievement: 89.5,
      eventCount: 6,
      actionCompletionRate: 67
    }
  },
  // Power - Transmission
  {
    id: "sim-transmission-001",
    name: "Day Shift - North Grid",
    shift: "Day",
    date: "2024-12-10",
    status: "on-track",
    sector: "Power",
    subsector: "Transmission",
    kpis: [
      { id: "kpi-tx-1", name: "System Loading", target: 85, actual: 78, unit: "%", status: "good", trend: "stable", variance: -8.2 }
    ],
    events: [
      { id: "evt-tx-1", eventType: "switching", description: "Planned switching", timestamp: "2024-12-10T08:00:00Z", impact: "low", status: "resolved" }
    ],
    actions: [
      { id: "act-tx-1", description: "Monitor grid stability", priority: "medium", status: "completed", assignee: "Control Operator", dueTime: "2024-12-10T10:00:00Z", completedTime: "2024-12-10T09:45:00Z" }
    ],
    metrics: {
      shiftPerformance: 94.2,
      targetAchievement: 91.8,
      eventCount: 2,
      actionCompletionRate: 100
    }
  },
  {
    id: "sim-transmission-002",
    name: "Night Shift - Control Center",
    shift: "Night",
    date: "2024-12-09",
    status: "at-risk",
    sector: "Power",
    subsector: "Transmission",
    kpis: [
      { id: "kpi-tx-2", name: "System Loading", target: 85, actual: 92, unit: "%", status: "warning", trend: "improving", variance: 8.2 }
    ],
    events: [
      { id: "evt-tx-2", eventType: "trip", description: "Line trip", timestamp: "2024-12-09T22:30:00Z", impact: "high", status: "active" }
    ],
    actions: [
      { id: "act-tx-2", description: "Restore line", priority: "high", status: "in-progress", assignee: "Night Operator", dueTime: "2024-12-10T01:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 86.7,
      targetAchievement: 108.2,
      eventCount: 3,
      actionCompletionRate: 67
    }
  },
  {
    id: "sim-transmission-003",
    name: "Evening Shift - Switching Ops",
    shift: "Evening",
    date: "2024-12-10",
    status: "on-track",
    sector: "Power",
    subsector: "Transmission",
    kpis: [
      { id: "kpi-tx-3", name: "System Loading", target: 85, actual: 82, unit: "%", status: "good", trend: "stable", variance: -3.5 }
    ],
    events: [
      { id: "evt-tx-3", eventType: "maintenance", description: "Scheduled maintenance", timestamp: "2024-12-10T18:00:00Z", impact: "low", status: "resolved" }
    ],
    actions: [
      { id: "act-tx-3", description: "Complete switching", priority: "medium", status: "completed", assignee: "Evening Operator", dueTime: "2024-12-10T20:00:00Z", completedTime: "2024-12-10T19:30:00Z" }
    ],
    metrics: {
      shiftPerformance: 91.5,
      targetAchievement: 96.5,
      eventCount: 1,
      actionCompletionRate: 100
    }
  },
  // FMCG - Food & Beverage
  {
    id: "sim-fmcg-001",
    name: "Day Shift - Bottling Line",
    shift: "Day",
    date: "2024-12-10",
    status: "behind",
    sector: "FMCG",
    subsector: "Food & Beverage",
    kpis: [
      { id: "kpi-fmcg-1", name: "Line OEE", target: 85, actual: 72, unit: "%", status: "critical", trend: "declining", variance: -15.3 }
    ],
    events: [
      { id: "evt-fmcg-1", eventType: "changeover", description: "SKU changeover", timestamp: "2024-12-10T09:00:00Z", impact: "medium", status: "active" }
    ],
    actions: [
      { id: "act-fmcg-1", description: "Complete changeover", priority: "high", status: "in-progress", assignee: "Line Operator", dueTime: "2024-12-10T11:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 78.2,
      targetAchievement: 84.7,
      eventCount: 5,
      actionCompletionRate: 80
    }
  },
  {
    id: "sim-fmcg-002",
    name: "Night Shift - Packaging",
    shift: "Night",
    date: "2024-12-09",
    status: "on-track",
    sector: "FMCG",
    subsector: "Food & Beverage",
    kpis: [
      { id: "kpi-fmcg-2", name: "Line OEE", target: 85, actual: 88, unit: "%", status: "good", trend: "improving", variance: 3.5 }
    ],
    events: [
      { id: "evt-fmcg-2", eventType: "quality", description: "Quality check passed", timestamp: "2024-12-09T23:00:00Z", impact: "low", status: "resolved" }
    ],
    actions: [
      { id: "act-fmcg-2", description: "Monitor quality", priority: "medium", status: "completed", assignee: "Quality Tech", dueTime: "2024-12-10T01:00:00Z", completedTime: "2024-12-10T00:45:00Z" }
    ],
    metrics: {
      shiftPerformance: 92.8,
      targetAchievement: 103.5,
      eventCount: 2,
      actionCompletionRate: 100
    }
  },
  {
    id: "sim-fmcg-003",
    name: "Day Shift - Changeover Mgmt",
    shift: "Day",
    date: "2024-12-10",
    status: "at-risk",
    sector: "FMCG",
    subsector: "Food & Beverage",
    kpis: [
      { id: "kpi-fmcg-3", name: "Line OEE", target: 85, actual: 79, unit: "%", status: "warning", trend: "stable", variance: -7.1 }
    ],
    events: [
      { id: "evt-fmcg-3", eventType: "material", description: "Material shortage", timestamp: "2024-12-10T10:00:00Z", impact: "medium", status: "active" }
    ],
    actions: [
      { id: "act-fmcg-3", description: "Resolve material shortage", priority: "high", status: "pending", assignee: "Supply Coordinator", dueTime: "2024-12-10T12:00:00Z" }
    ],
    metrics: {
      shiftPerformance: 84.6,
      targetAchievement: 92.9,
      eventCount: 4,
      actionCompletionRate: 75
    }
  }
];

export const simMetrics: SIMMetric[] = [
  { name: "Production Rate", target: 150, actual: 142, unit: "units/hour", status: "warning" },
  { name: "Quality Rate", target: 98.5, actual: 97.2, unit: "%", status: "warning" },
  { name: "Availability", target: 95.0, actual: 96.8, unit: "%", status: "good" },
  { name: "OEE", target: 85.0, actual: 78.5, unit: "%", status: "critical" },
  { name: "Cycle Time", target: 24, actual: 25.3, unit: "seconds", status: "warning" },
  { name: "Scrap Rate", target: 2.0, actual: 2.8, unit: "%", status: "critical" }
];

export const issues: Issue[] = [
  {
    id: "iss-001",
    title: "Conveyor belt misalignment causing jams",
    category: "Equipment",
    priority: "high",
    status: "in-progress",
    assignee: "John Doe",
    createdAt: "2024-12-10T08:30:00Z"
  },
  {
    id: "iss-002",
    title: "Temperature sensor reading inconsistent values",
    category: "Instrumentation",
    priority: "medium",
    status: "open",
    assignee: "Jane Smith",
    createdAt: "2024-12-10T10:15:00Z"
  },
  {
    id: "iss-003",
    title: "Quality control station offline",
    category: "System",
    priority: "high",
    status: "resolved",
    assignee: "Mike Johnson",
    createdAt: "2024-12-09T14:20:00Z"
  },
  {
    id: "iss-004",
    title: "Raw material shortage affecting production",
    category: "Supply Chain",
    priority: "medium",
    status: "open",
    assignee: "Sarah Wilson",
    createdAt: "2024-12-10T09:45:00Z"
  },
  {
    id: "iss-005",
    title: "Operator training needed for new equipment",
    category: "Training",
    priority: "low",
    status: "in-progress",
    assignee: "David Brown",
    createdAt: "2024-12-08T16:00:00Z"
  }
];

// Continuous Improvement (CI) Feature Mock Data
export const ciProjects: CIProject[] = [
  // Cross-Sector Core
  {
    id: "ci-001",
    title: "Reduce Changeover Time on Line 1",
    stage: "implementation",
    priority: "high",
    owner: "John Doe",
    createdAt: "2024-11-15",
    targetKPI: "Changeover Time",
    targetImprovement: "-25%",
    objectives: ["Reduce changeover time by 25%", "Improve line efficiency", "Standardize procedures"],
    timeline: {
      startDate: "2024-11-15",
      endDate: "2024-12-31",
      milestones: [
        { id: "m1", name: "Analysis Complete", dueDate: "2024-11-30", status: "completed", deliverables: ["Current state analysis"] }
      ],
      currentPhase: "implementation",
      completionPercentage: 65
    },
    resources: [
      { id: "r1", type: "human", name: "Project Team", allocation: 80, availability: "available" }
    ],
    outcomes: [
      { id: "o1", metric: "Changeover Time", baseline: 45, target: 34, unit: "minutes", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-002",
    title: "Improve Energy Efficiency",
    stage: "analysis",
    priority: "medium",
    owner: "Jane Smith",
    createdAt: "2024-11-20",
    targetKPI: "Energy Consumption",
    targetImprovement: "-15%",
    objectives: ["Reduce energy consumption by 15%", "Identify energy waste", "Implement efficiency measures"],
    timeline: {
      startDate: "2024-11-20",
      endDate: "2025-02-28",
      milestones: [
        { id: "m2", name: "Energy Audit", dueDate: "2024-12-15", status: "in-progress", deliverables: ["Energy audit report"] }
      ],
      currentPhase: "analysis",
      completionPercentage: 25
    },
    resources: [
      { id: "r2", type: "human", name: "Energy Team", allocation: 60, availability: "available" }
    ],
    outcomes: [
      { id: "o2", metric: "Energy Consumption", baseline: 1000, target: 850, unit: "kWh/day", status: "not-started" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-003",
    title: "Optimize Process Control",
    stage: "validation",
    priority: "high",
    owner: "Mike Johnson",
    createdAt: "2024-10-30",
    targetKPI: "Quality Rate",
    targetImprovement: "+3%",
    objectives: ["Improve quality rate by 3%", "Reduce defects", "Optimize control parameters"],
    timeline: {
      startDate: "2024-10-30",
      endDate: "2024-12-15",
      milestones: [
        { id: "m3", name: "Control Optimization", dueDate: "2024-11-30", status: "completed", deliverables: ["Optimized parameters"] }
      ],
      currentPhase: "validation",
      completionPercentage: 85
    },
    resources: [
      { id: "r3", type: "human", name: "Process Team", allocation: 70, availability: "available" }
    ],
    outcomes: [
      { id: "o3", metric: "Quality Rate", baseline: 95.5, target: 98.5, actual: 97.8, unit: "%", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  // Oil & Gas - Upstream
  {
    id: "ci-upstream-001",
    title: "Reduce Well Alpha-7 Deferment",
    stage: "implementation",
    priority: "high",
    owner: "Sarah Johnson",
    createdAt: "2024-11-15",
    targetKPI: "Well Uptime",
    targetImprovement: "+5%",
    sector: "Oil & Gas",
    subsector: "Upstream",
    objectives: ["Increase well uptime by 5%", "Reduce deferment hours", "Improve ESP reliability"],
    timeline: {
      startDate: "2024-11-15",
      endDate: "2024-12-31",
      milestones: [
        { id: "m4", name: "ESP Analysis", dueDate: "2024-12-01", status: "completed", deliverables: ["ESP performance analysis"] }
      ],
      currentPhase: "implementation",
      completionPercentage: 70
    },
    resources: [
      { id: "r4", type: "human", name: "Well Team", allocation: 90, availability: "available" }
    ],
    outcomes: [
      { id: "o4", metric: "Well Uptime", baseline: 85, target: 90, actual: 88, unit: "%", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-upstream-002",
    title: "Flow Assurance Optimization",
    stage: "analysis",
    priority: "medium",
    owner: "Mike Chen",
    createdAt: "2024-11-20",
    targetKPI: "Flow Stability",
    targetImprovement: "30% deviation reduction",
    sector: "Oil & Gas",
    subsector: "Upstream",
    objectives: ["Reduce flow deviation by 30%", "Improve flow stability", "Optimize pipeline operations"],
    timeline: {
      startDate: "2024-11-20",
      endDate: "2025-01-31",
      milestones: [
        { id: "m5", name: "Flow Analysis", dueDate: "2024-12-20", status: "in-progress", deliverables: ["Flow analysis report"] }
      ],
      currentPhase: "analysis",
      completionPercentage: 30
    },
    resources: [
      { id: "r5", type: "human", name: "Flow Team", allocation: 50, availability: "available" }
    ],
    outcomes: [
      { id: "o5", metric: "Flow Stability", baseline: 100, target: 70, unit: "% deviation", status: "not-started" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-upstream-003",
    title: "Lifting Cost Reduction",
    stage: "backlog",
    priority: "medium",
    owner: "David Park",
    createdAt: "2024-12-01",
    targetKPI: "Energy per Barrel",
    targetImprovement: "-12%",
    sector: "Oil & Gas",
    subsector: "Upstream",
    objectives: ["Reduce energy per barrel by 12%", "Optimize lifting operations", "Improve energy efficiency"],
    timeline: {
      startDate: "2024-12-01",
      endDate: "2025-03-31",
      milestones: [
        { id: "m6", name: "Energy Assessment", dueDate: "2024-12-31", status: "pending", deliverables: ["Energy assessment"] }
      ],
      currentPhase: "backlog",
      completionPercentage: 0
    },
    resources: [
      { id: "r6", type: "human", name: "Energy Team", allocation: 40, availability: "limited" }
    ],
    outcomes: [
      { id: "o6", metric: "Energy per Barrel", baseline: 45, target: 40, unit: "kWh/bbl", status: "not-started" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  // Power - Transmission
  {
    id: "ci-transmission-001",
    title: "Reduce Relay Misoperations",
    stage: "implementation",
    priority: "high",
    owner: "Lisa Rodriguez",
    createdAt: "2024-11-10",
    targetKPI: "Relay Reliability",
    targetImprovement: "50% reduction",
    sector: "Power",
    subsector: "Transmission",
    objectives: ["Reduce relay misoperations by 50%", "Improve protection reliability", "Update relay settings"],
    timeline: {
      startDate: "2024-11-10",
      endDate: "2024-12-31",
      milestones: [
        { id: "m7", name: "Relay Settings Review", dueDate: "2024-12-01", status: "completed", deliverables: ["Updated relay settings"] }
      ],
      currentPhase: "implementation",
      completionPercentage: 75
    },
    resources: [
      { id: "r7", type: "human", name: "Protection Team", allocation: 80, availability: "available" }
    ],
    outcomes: [
      { id: "o7", metric: "Relay Misoperations", baseline: 10, target: 5, actual: 6, unit: "per month", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-transmission-002",
    title: "Transmission Loss Reduction",
    stage: "validation",
    priority: "medium",
    owner: "James Wilson",
    createdAt: "2024-10-25",
    targetKPI: "Line Losses",
    targetImprovement: "-8%",
    sector: "Power",
    subsector: "Transmission",
    objectives: ["Reduce line losses by 8%", "Optimize power flow", "Improve system efficiency"],
    timeline: {
      startDate: "2024-10-25",
      endDate: "2024-12-15",
      milestones: [
        { id: "m8", name: "Loss Analysis", dueDate: "2024-11-15", status: "completed", deliverables: ["Loss analysis report"] }
      ],
      currentPhase: "validation",
      completionPercentage: 90
    },
    resources: [
      { id: "r8", type: "human", name: "System Team", allocation: 60, availability: "available" }
    ],
    outcomes: [
      { id: "o8", metric: "Line Losses", baseline: 3.5, target: 3.2, actual: 3.3, unit: "%", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-transmission-003",
    title: "Grid Reliability Enhancement",
    stage: "analysis",
    priority: "high",
    owner: "Maria Garcia",
    createdAt: "2024-11-18",
    targetKPI: "SAIDI Performance",
    targetImprovement: "15 min reduction",
    sector: "Power",
    subsector: "Transmission",
    objectives: ["Reduce SAIDI by 15 minutes", "Improve grid reliability", "Enhance outage response"],
    timeline: {
      startDate: "2024-11-18",
      endDate: "2025-02-28",
      milestones: [
        { id: "m9", name: "Reliability Study", dueDate: "2024-12-31", status: "in-progress", deliverables: ["Reliability study"] }
      ],
      currentPhase: "analysis",
      completionPercentage: 40
    },
    resources: [
      { id: "r9", type: "human", name: "Reliability Team", allocation: 70, availability: "available" }
    ],
    outcomes: [
      { id: "o9", metric: "SAIDI", baseline: 60, target: 45, unit: "minutes", status: "not-started" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  // FMCG - Food & Beverage
  {
    id: "ci-fmcg-001",
    title: "SMED Implementation - Line 3",
    stage: "implementation",
    priority: "high",
    owner: "David Park",
    createdAt: "2024-11-12",
    targetKPI: "Changeover Time",
    targetImprovement: "40% reduction",
    sector: "FMCG",
    subsector: "Food & Beverage",
    objectives: ["Reduce changeover time by 40%", "Implement SMED methodology", "Standardize changeover procedures"],
    timeline: {
      startDate: "2024-11-12",
      endDate: "2024-12-31",
      milestones: [
        { id: "m10", name: "SMED Training", dueDate: "2024-12-01", status: "completed", deliverables: ["SMED training completion"] }
      ],
      currentPhase: "implementation",
      completionPercentage: 80
    },
    resources: [
      { id: "r10", type: "human", name: "SMED Team", allocation: 90, availability: "available" }
    ],
    outcomes: [
      { id: "o10", metric: "Changeover Time", baseline: 60, target: 36, actual: 42, unit: "minutes", status: "in-progress" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-fmcg-002",
    title: "Scrap/Waste Reduction",
    stage: "verified",
    priority: "medium",
    owner: "Anna Thompson",
    createdAt: "2024-09-20",
    targetKPI: "Waste Rate",
    targetImprovement: "-25%",
    sector: "FMCG",
    subsector: "Food & Beverage",
    objectives: ["Reduce waste rate by 25%", "Improve material utilization", "Optimize production processes"],
    timeline: {
      startDate: "2024-09-20",
      endDate: "2024-11-30",
      milestones: [
        { id: "m11", name: "Waste Analysis", dueDate: "2024-10-15", status: "completed", deliverables: ["Waste analysis report"] }
      ],
      currentPhase: "verified",
      completionPercentage: 100
    },
    resources: [
      { id: "r11", type: "human", name: "Waste Team", allocation: 50, availability: "available" }
    ],
    outcomes: [
      { id: "o11", metric: "Waste Rate", baseline: 4.0, target: 3.0, actual: 2.8, unit: "%", status: "achieved" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  },
  {
    id: "ci-fmcg-003",
    title: "Material Yield Improvement",
    stage: "analysis",
    priority: "medium",
    owner: "Robert Kim",
    createdAt: "2024-11-22",
    targetKPI: "Packaging Yield",
    targetImprovement: "+3.5%",
    sector: "FMCG",
    subsector: "Food & Beverage",
    objectives: ["Improve packaging yield by 3.5%", "Optimize material usage", "Reduce packaging waste"],
    timeline: {
      startDate: "2024-11-22",
      endDate: "2025-01-31",
      milestones: [
        { id: "m12", name: "Yield Analysis", dueDate: "2024-12-31", status: "in-progress", deliverables: ["Yield analysis"] }
      ],
      currentPhase: "analysis",
      completionPercentage: 20
    },
    resources: [
      { id: "r12", type: "human", name: "Packaging Team", allocation: 60, availability: "available" }
    ],
    outcomes: [
      { id: "o12", metric: "Packaging Yield", baseline: 95.0, target: 98.5, unit: "%", status: "not-started" }
    ],
    name: "",
    description: "",
    status: "",
    assignee: "",
    dueDate: ""
  }
];

export const rootCauses: RootCause[] = [
  {
    id: "rc-001",
    category: "Equipment",
    description: "Worn conveyor belt causing irregular movement",
    evidence: ["Vibration analysis report", "Visual inspection photos", "Maintenance logs"],
    verified: true
  },
  {
    id: "rc-002",
    category: "Process",
    description: "Inconsistent operator procedures during changeover",
    evidence: ["Time study data", "Operator interviews", "Video analysis"],
    verified: false
  },
  {
    id: "rc-003",
    category: "Material",
    description: "Raw material quality variations affecting process stability",
    evidence: ["Supplier quality reports", "Incoming inspection data", "Process control charts"],
    verified: true
  }
];

export const countermeasures: Countermeasure[] = [
  {
    id: "cm-001",
    description: "Replace conveyor belt and realign system",
    status: "in-progress",
    owner: "John Doe",
    dueDate: "2024-12-15",
    type: "",
    assignee: ""
  },
  {
    id: "cm-002",
    description: "Develop standardized changeover procedure",
    status: "planned",
    owner: "Jane Smith",
    dueDate: "2024-12-20",
    type: "",
    assignee: ""
  },
  {
    id: "cm-003",
    description: "Implement supplier quality agreement",
    status: "completed",
    owner: "Mike Johnson",
    dueDate: "2024-12-05",
    type: "",
    assignee: ""
  },
  {
    id: "cm-004",
    description: "Install additional temperature sensors",
    status: "in-progress",
    owner: "Sarah Wilson",
    dueDate: "2024-12-18",
    type: "",
    assignee: ""
  }
];

// AI-Assisted Optimisation Feature Mock Data
export const optimisationOpportunities: OptimisationOpportunity[] = [
  // Cross-Sector Core
  {
    id: "opt-001",
    title: "Optimize Line 1 Speed Settings",
    rank: 1,
    category: "Performance",
    potentialImpact: "+3.2% OEE",
    confidence: 87,
    status: "new",
    impactScore: 87,
    confidenceScore: 87,
    assessment: {
      impactEstimation: {
        quantitativeImpact: 3.2,
        qualitativeImpact: ["Improved throughput", "Better efficiency"],
        timeframe: "3 months",
        confidenceLevel: 87,
        assumptions: ["Current equipment condition", "Operator training"]
      },
      feasibilityEvaluation: {
        technicalFeasibility: "high",
        operationalFeasibility: "high",
        economicFeasibility: "high",
        constraints: ["Equipment limitations"],
        enablers: ["Existing control system"]
      },
      riskAssessment: {
        risks: [
          { id: "r1", description: "Equipment wear", probability: "low", impact: "medium", mitigation: "Regular maintenance" }
        ],
        overallRiskLevel: "low",
        mitigationStrategies: ["Gradual implementation", "Monitoring"]
      },
      resourceRequirements: [
        { type: "human", description: "Engineering support", quantity: 40, unit: "hours", availability: "available" }
      ]
    },
    businessCase: {
      costBenefitAnalysis: {
        implementationCosts: [
          { category: "Engineering", amount: 5000, currency: "USD", timeframe: "one-time", confidence: "high" }
        ],
        operationalCosts: [],
        benefits: [
          { category: "Productivity", amount: 15000, currency: "USD", timeframe: "annual", confidence: "high" }
        ],
        netBenefit: 10000
      },
      roiProjections: [
        { year: 1, investment: 5000, returns: 15000, cumulativeROI: 200 }
      ],
      financialMetrics: {
        npv: 12000,
        irr: 250,
        paybackPeriod: 4,
        breakEvenPoint: 4
      },
      strategicAlignment: "Aligns with operational excellence goals"
    },
    approvalStatus: {
      currentStage: "assessment",
      stakeholders: [
        { id: "s1", name: "Operations Manager", role: "Approver", influence: "high", support: "supportive", feedback: "Looks promising" }
      ],
      decisions: [],
      nextSteps: ["Complete technical assessment", "Prepare business case"]
    },
    tracking: {
      progress: [],
      milestones: [],
      outcomes: []
    }
  },
  {
    id: "opt-002",
    title: "Adjust Process Parameters",
    rank: 2,
    category: "Quality",
    potentialImpact: "+2.1% Quality Rate",
    confidence: 92,
    status: "under-review",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-003",
    title: "Implement Dynamic Scheduling",
    rank: 3,
    category: "Efficiency",
    potentialImpact: "-12% Changeover Time",
    confidence: 78,
    status: "approved",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  // Oil & Gas - Upstream
  {
    id: "opt-upstream-001",
    title: "Optimize ESP Settings - Well Beta-3",
    rank: 4,
    category: "Well Performance",
    potentialImpact: "+180 bbl/day",
    confidence: 92,
    status: "new",
    sector: "Oil & Gas",
    subsector: "Upstream",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-upstream-002",
    title: "Gathering System Pressure Optimization",
    rank: 5,
    category: "Gathering System",
    potentialImpact: "+95 bbl/day, -8% energy",
    confidence: 87,
    status: "under-review",
    sector: "Oil & Gas",
    subsector: "Upstream",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-upstream-003",
    title: "Flow Assurance Stability",
    rank: 6,
    category: "Flow Assurance",
    potentialImpact: "30% deviation reduction",
    confidence: 84,
    status: "approved",
    sector: "Oil & Gas",
    subsector: "Upstream",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  // Power - Transmission
  {
    id: "opt-transmission-001",
    title: "Load Balancing Optimization",
    rank: 7,
    category: "Loading Optimization",
    potentialImpact: "12% loading improvement",
    confidence: 89,
    status: "new",
    sector: "Power",
    subsector: "Transmission",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-transmission-002",
    title: "Switching Path Optimization",
    rank: 8,
    category: "Congestion Relief",
    potentialImpact: "2.5MW loss reduction",
    confidence: 85,
    status: "under-review",
    sector: "Power",
    subsector: "Transmission",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-transmission-003",
    title: "Grid Stability Enhancement",
    rank: 9,
    category: "Grid Stability",
    potentialImpact: "8 min SAIDI reduction",
    confidence: 91,
    status: "approved",
    sector: "Power",
    subsector: "Transmission",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  // FMCG - Food & Beverage
  {
    id: "opt-fmcg-001",
    title: "SKU Sequencing Optimization",
    rank: 10,
    category: "Production Scheduling",
    potentialImpact: "15% throughput increase",
    confidence: 91,
    status: "new",
    sector: "FMCG",
    subsector: "Food & Beverage",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-fmcg-002",
    title: "Line Speed vs Scrap Balance",
    rank: 11,
    category: "Line Speed",
    potentialImpact: "20min changeover reduction",
    confidence: 88,
    status: "under-review",
    sector: "FMCG",
    subsector: "Food & Beverage",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  },
  {
    id: "opt-fmcg-003",
    title: "Recipe Optimization",
    rank: 12,
    category: "Recipe",
    potentialImpact: "12% material savings",
    confidence: 86,
    status: "approved",
    sector: "FMCG",
    subsector: "Food & Beverage",
    impactScore: 0,
    confidenceScore: 0,
    assessment: undefined,
    businessCase: undefined,
    approvalStatus: undefined,
    tracking: undefined
  }
];

export const recommendations: Recommendation[] = [
  {
    id: "rec-001",
    description: "Increase line speed by 5% during peak efficiency hours",
    rationale: "Historical data shows optimal performance window between 10-14:00",
    confidence: 87,
    estimatedImpact: "+3.2% OEE improvement"
  },
  {
    id: "rec-002",
    description: "Adjust kiln temperature curve based on material composition",
    rationale: "AI model identified correlation between material properties and optimal temperature",
    confidence: 92,
    estimatedImpact: "+2.1% quality improvement"
  },
  {
    id: "rec-003",
    description: "Implement predictive maintenance schedule for critical components",
    rationale: "Failure pattern analysis suggests optimal maintenance intervals",
    confidence: 78,
    estimatedImpact: "-40% unplanned downtime"
  }
];

export const playbooks: Playbook[] = [
  {
    id: "pb-001",
    name: "Line Speed Optimization",
    category: "Performance",
    description: "Step-by-step guide for optimizing production line speed settings",
    applicability: 95
  },
  {
    id: "pb-002",
    name: "Quality Control Enhancement",
    category: "Quality",
    description: "Best practices for implementing advanced quality control measures",
    applicability: 88
  },
  {
    id: "pb-003",
    name: "Energy Efficiency Improvement",
    category: "Energy",
    description: "Comprehensive approach to reducing energy consumption",
    applicability: 76
  },
  {
    id: "pb-004",
    name: "Predictive Maintenance Setup",
    category: "Maintenance",
    description: "Implementation guide for predictive maintenance systems",
    applicability: 82
  }
];

export const scenarios: Scenario[] = [
  {
    id: "sc-001",
    name: "Increased Production Scenario",
    parameters: { lineSpeed: 105, qualityThreshold: 97.5, maintenanceInterval: 168 },
    projectedOutcome: "+3.2% OEE, +5% throughput, -2% quality rate",
    confidence: 87
  },
  {
    id: "sc-002",
    name: "Quality Focus Scenario",
    parameters: { lineSpeed: 95, qualityThreshold: 99.0, maintenanceInterval: 120 },
    projectedOutcome: "+2.1% quality rate, -1.5% throughput, +1% OEE",
    confidence: 92
  },
  {
    id: "sc-003",
    name: "Balanced Optimization",
    parameters: { lineSpeed: 100, qualityThreshold: 98.0, maintenanceInterval: 144 },
    projectedOutcome: "+2.8% OEE, +3% throughput, +1.2% quality rate",
    confidence: 85
  }
];

export const sectors: NavigationSector[] = [
  {
    id: "oil-gas",
    name: "Oil & Gas",
    subsectors: ["Upstream", "Midstream", "Downstream"]
  },
  {
    id: "power",
    name: "Power & Utilities",
    subsectors: ["Generation", "Transmission", "Distribution"]
  },
  {
    id: "fmcg",
    name: "FMCG & Manufacturing",
    subsectors: ["Food & Beverage", "Consumer Goods", "Industrial Manufacturing"]
  },
  {
    id: "mining",
    name: "Mining & Metals",
    subsectors: ["Extraction", "Processing", "Refining"]
  }
];

// Note: Performance data is defined above in the main sections

// ============================================================================
// COMPREHENSIVE SECTOR-SPECIFIC MOCK DATA
// ============================================================================

// Oil & Gas - Upstream Performance Data with detailed terminology and units
export const upstreamPerformancePanels: UpstreamPerformancePanel[] = [
  {
    id: "perf-upstream-detailed-001",
    name: "Eagle Ford Well Pad Alpha",
    asset: "Well Pad Alpha",
    site: "Eagle Ford Shale",
    oee: 82.1,
    availability: 89.5,
    performance: 91.8,
    quality: 99.9,
    lastUpdated: "2 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    wellUptime: 89.5,
    plannedProduction: 1200, // barrels per day
    actualProduction: 1102, // barrels per day
    energyPerBarrel: 45.2, // kWh per barrel
    flowAssuranceStatus: "stable",
    defermentHours: 2.5,
    energyIntensity: 12.8, // kWh per MSCF
    wellCount: 12,
    activeWells: 11,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-upstream-detailed-002",
    name: "Permian Basin Pad Beta",
    asset: "Well Pad Beta",
    site: "Permian Basin",
    oee: 76.3,
    availability: 85.2,
    performance: 89.6,
    quality: 99.8,
    lastUpdated: "4 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    wellUptime: 85.2,
    plannedProduction: 950, // barrels per day
    actualProduction: 851, // barrels per day
    energyPerBarrel: 48.7, // kWh per barrel
    flowAssuranceStatus: "deviation",
    defermentHours: 4.2,
    energyIntensity: 14.1, // kWh per MSCF
    wellCount: 8,
    activeWells: 7,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-upstream-detailed-003",
    name: "Bakken Formation Field Gamma",
    asset: "Field Operations Gamma",
    site: "Bakken Formation",
    oee: 73.8,
    availability: 81.2,
    performance: 90.9,
    quality: 99.9,
    lastUpdated: "6 minutes ago",
    sector: "Oil & Gas",
    subsector: "Upstream",
    wellUptime: 81.2,
    plannedProduction: 1850, // barrels per day
    actualProduction: 1682, // barrels per day
    energyPerBarrel: 52.3, // kWh per barrel
    flowAssuranceStatus: "critical",
    defermentHours: 8.7,
    energyIntensity: 15.9, // kWh per MSCF
    wellCount: 18,
    activeWells: 15,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  }
];

export const wellDefermentData: WellDeferment[] = [
  {
    wellId: "WL-001",
    wellName: "Alpha-7",
    padName: "Pad Alpha",
    fieldName: "Eagle Ford",
    defermentType: "ESP Failure",
    duration: 12.5, // hours
    impact: 150, // barrels lost
    status: "active",
    rootCause: "Motor overheating due to high sand content",
    timestamp: "2024-12-15T08:30:00Z"
  },
  {
    wellId: "WL-002",
    wellName: "Beta-3",
    padName: "Pad Beta",
    fieldName: "Permian Basin",
    defermentType: "Flow Assurance",
    duration: 6.2, // hours
    impact: 95, // barrels lost
    status: "resolved",
    rootCause: "Wax buildup in tubing string",
    timestamp: "2024-12-14T14:15:00Z"
  },
  {
    wellId: "WL-003",
    wellName: "Gamma-12",
    padName: "Pad Gamma",
    fieldName: "Bakken Formation",
    defermentType: "Separator Shutdown",
    duration: 18.3, // hours
    impact: 285, // barrels lost
    status: "active",
    rootCause: "High-high level trip on separator vessel",
    timestamp: "2024-12-15T02:45:00Z"
  }
];

export const productionTrainBottlenecks: ProductionTrainBottleneck[] = [
  {
    trainId: "PT-001",
    trainName: "Alpha Production Train",
    bottleneckType: "separator-capacity",
    severity: "high",
    throughputImpact: 15, // percentage
    pressureReading: 850, // psi
    temperatureReading: 185, // degrees F
    flowRate: 1200 // barrels per day
  },
  {
    trainId: "PT-002",
    trainName: "Beta Trunkline System",
    bottleneckType: "trunkline-throughput",
    severity: "medium",
    throughputImpact: 8, // percentage
    pressureReading: 1250, // psi
    temperatureReading: 165, // degrees F
    flowRate: 2850 // barrels per day
  },
  {
    trainId: "PT-003",
    trainName: "Gamma Gathering System",
    bottleneckType: "gathering-system",
    severity: "high",
    throughputImpact: 22, // percentage
    pressureReading: 650, // psi
    temperatureReading: 145, // degrees F
    flowRate: 3200 // barrels per day
  }
];

export const upstreamEnergyMetrics: UpstreamEnergyMetrics[] = [
  {
    kwhPerBarrel: 45.2,
    kwhPerMSCF: 12.8,
    totalEnergyConsumption: 52800, // kWh
    energyEfficiencyTrend: "improving"
  },
  {
    kwhPerBarrel: 48.7,
    kwhPerMSCF: 14.1,
    totalEnergyConsumption: 41450, // kWh
    energyEfficiencyTrend: "stable"
  },
  {
    kwhPerBarrel: 52.3,
    kwhPerMSCF: 15.9,
    totalEnergyConsumption: 87950, // kWh
    energyEfficiencyTrend: "declining"
  }
];

// Power - Transmission Performance Data with electrical terminology and units
export const transmissionPerformancePanels: TransmissionPerformancePanel[] = [
  {
    id: "perf-transmission-detailed-001",
    name: "North Regional Grid",
    asset: "North Transmission Grid",
    site: "North Regional Control Center",
    oee: 96.8,
    availability: 98.2,
    performance: 98.5,
    quality: 99.9,
    lastUpdated: "1 minute ago",
    sector: "Power",
    subsector: "Transmission",
    lineLoading: 78.5, // percentage
    transformerLoading: 82.1, // percentage
    transmissionLosses: 2.8, // percentage
    saidi: 45.2, // minutes
    saifi: 0.85, // interruptions per customer
    tripCount: 3,
    networkConstraints: 2,
    congestionLevel: 15.3 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-transmission-detailed-002",
    name: "East Grid Operations",
    asset: "East Transmission Grid",
    site: "East Control Center",
    oee: 94.5,
    availability: 96.8,
    performance: 97.6,
    quality: 99.9,
    lastUpdated: "3 minutes ago",
    sector: "Power",
    subsector: "Transmission",
    lineLoading: 85.2, // percentage
    transformerLoading: 88.7, // percentage
    transmissionLosses: 3.1, // percentage
    saidi: 62.8, // minutes
    saifi: 1.12, // interruptions per customer
    tripCount: 5,
    networkConstraints: 4,
    congestionLevel: 28.6 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-transmission-detailed-003",
    name: "West Grid Complex",
    asset: "West Transmission Lines",
    site: "West Control Center",
    oee: 92.1,
    availability: 95.4,
    performance: 96.5,
    quality: 99.9,
    lastUpdated: "2 minutes ago",
    sector: "Power",
    subsector: "Transmission",
    lineLoading: 91.8, // percentage
    transformerLoading: 94.2, // percentage
    transmissionLosses: 3.5, // percentage
    saidi: 78.5, // minutes
    saifi: 1.45, // interruptions per customer
    tripCount: 7,
    networkConstraints: 6,
    congestionLevel: 42.1 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  }
];

export const relayMisoperationData: RelayMisoperation[] = [
  {
    relayId: "REL-001",
    relayName: "North Grid Relay 138kV",
    location: "Substation Alpha",
    misoperationType: "false-trip",
    timestamp: "2024-12-15T10:25:00Z",
    impact: "15 MW load interrupted for 45 minutes",
    status: "investigating",
    faultType: "Ground fault",
    voltageLevel: 138 // kV
  },
  {
    relayId: "REL-002",
    relayName: "East Grid Protection 345kV",
    location: "Substation Beta",
    misoperationType: "failure-to-trip",
    timestamp: "2024-12-14T16:42:00Z",
    impact: "Backup protection operated, 2 second delay",
    status: "resolved",
    faultType: "Phase-to-phase fault",
    voltageLevel: 345 // kV
  },
  {
    relayId: "REL-003",
    relayName: "West Grid Differential 500kV",
    location: "Substation Gamma",
    misoperationType: "slow-trip",
    timestamp: "2024-12-15T07:18:00Z",
    impact: "Extended fault clearing time, equipment stress",
    status: "investigating",
    faultType: "Transformer internal fault",
    voltageLevel: 500 // kV
  }
];

export const networkConstraintData: NetworkConstraint[] = [
  {
    constraintId: "NC-001",
    location: "North-East Corridor",
    constraintType: "thermal",
    severity: "high",
    congestionLevel: 85.2, // percentage
    loadingMW: 1250,
    voltageStability: 92.5, // percentage
    thermalLimit: 1500 // MW
    ,
    constraintName: ""
  },
  {
    constraintId: "NC-002",
    location: "Central Hub Interface",
    constraintType: "voltage",
    severity: "medium",
    congestionLevel: 62.8, // percentage
    loadingMW: 850,
    voltageStability: 88.3, // percentage
    thermalLimit: 1200 // MW
    ,
    constraintName: ""
  },
  {
    constraintId: "NC-003",
    location: "West Import Path",
    constraintType: "stability",
    severity: "high",
    congestionLevel: 78.9, // percentage
    loadingMW: 1850,
    voltageStability: 85.1, // percentage
    thermalLimit: 2200 // MW
    ,
    constraintName: ""
  }
];

export const transmissionLossMetrics: TransmissionLossMetrics[] = [
  {
    lineLosses: 2.1, // percentage
    transformerLosses: 0.7, // percentage
    systemEfficiency: 97.2, // percentage
    totalLossMW: 45.8
  },
  {
    lineLosses: 2.4, // percentage
    transformerLosses: 0.8, // percentage
    systemEfficiency: 96.8, // percentage
    totalLossMW: 52.3
  },
  {
    lineLosses: 2.8, // percentage
    transformerLosses: 0.9, // percentage
    systemEfficiency: 96.3, // percentage
    totalLossMW: 68.7
  }
];

// FMCG - Food & Beverage Performance Data with manufacturing terminology and units
export const fmcgPerformancePanels: FMCGPerformancePanel[] = [
  {
    id: "perf-fmcg-detailed-001",
    name: "Bottling Line 3 Dallas",
    asset: "Bottling Line 3",
    site: "Dallas Beverage Facility",
    oee: 75.2,
    availability: 88.5,
    performance: 85.0,
    quality: 99.9,
    lastUpdated: "3 minutes ago",
    sector: "FMCG",
    subsector: "Food & Beverage",
    lineOEE: 75.2,
    changeoverEfficiency: 68.5, // percentage
    packagingYield: 97.8, // percentage
    batchYield: 98.5, // percentage
    scrapRate: 1.2, // percentage
    microStopFrequency: 12, // per hour
    fillingAccuracy: 99.2, // percentage
    labelingAccuracy: 98.8, // percentage
    wastePercentage: 2.2 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-fmcg-detailed-002",
    name: "Packaging Line 1 Chicago",
    asset: "Packaging Line 1",
    site: "Chicago Food Plant",
    oee: 68.9,
    availability: 82.1,
    performance: 83.9,
    quality: 99.8,
    lastUpdated: "5 minutes ago",
    sector: "FMCG",
    subsector: "Food & Beverage",
    lineOEE: 68.9,
    changeoverEfficiency: 62.3, // percentage
    packagingYield: 96.5, // percentage
    batchYield: 97.8, // percentage
    scrapRate: 1.8, // percentage
    microStopFrequency: 18, // per hour
    fillingAccuracy: 98.9, // percentage
    labelingAccuracy: 98.2, // percentage
    wastePercentage: 3.1 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  },
  {
    id: "perf-fmcg-detailed-003",
    name: "Multi-SKU Line Atlanta",
    asset: "Multi-SKU Production Line",
    site: "Atlanta Manufacturing Plant",
    oee: 71.4,
    availability: 85.7,
    performance: 83.3,
    quality: 99.9,
    lastUpdated: "4 minutes ago",
    sector: "FMCG",
    subsector: "Food & Beverage",
    lineOEE: 71.4,
    changeoverEfficiency: 58.9, // percentage
    packagingYield: 95.8, // percentage
    batchYield: 96.9, // percentage
    scrapRate: 2.1, // percentage
    microStopFrequency: 22, // per hour
    fillingAccuracy: 98.5, // percentage
    labelingAccuracy: 97.8, // percentage
    wastePercentage: 3.8 // percentage
    ,
    type: "asset",
    oeeMetrics: undefined,
    lossCategories: [],
    bottlenecks: [],
    trends: [],
    benchmarks: []
  }
];

export const changeoverAnalysisData: ChangeoverAnalysis[] = [
  {
    lineId: "LINE-001",
    lineName: "Bottling Line 3",
    fromSKU: "Cola 500ml",
    toSKU: "Orange 500ml",
    plannedDuration: 45, // minutes
    actualDuration: 52, // minutes
    efficiency: 86.5, // percentage
    setupTime: 18, // minutes
    cleaningTime: 22, // minutes
    materialChangeTime: 12, // minutes
    wasteGenerated: 285 // units
    ,
    changeoverTime: 0,
    targetTime: 0
  },
  {
    lineId: "LINE-002",
    lineName: "Packaging Line 1",
    fromSKU: "Cereal 400g",
    toSKU: "Cereal 600g",
    plannedDuration: 35, // minutes
    actualDuration: 42, // minutes
    efficiency: 83.3, // percentage
    setupTime: 15, // minutes
    cleaningTime: 18, // minutes
    materialChangeTime: 9, // minutes
    wasteGenerated: 156 // units
    ,
    changeoverTime: 0,
    targetTime: 0
  },
  {
    lineId: "LINE-003",
    lineName: "Multi-SKU Line",
    fromSKU: "Snack Pack A",
    toSKU: "Snack Pack B",
    plannedDuration: 28, // minutes
    actualDuration: 38, // minutes
    efficiency: 73.7, // percentage
    setupTime: 12, // minutes
    cleaningTime: 16, // minutes
    materialChangeTime: 10, // minutes
    wasteGenerated: 198 // units
  }
];

export const packagingYieldData: PackagingYield[] = [
  {
    materialType: "PET Bottles",
    plannedUsage: 10000,
    actualUsage: 10250,
    yieldPercentage: 97.6,
    wasteAmount: 250,
    costImpact: 125.50,
    rootCauseCategory: "Machine adjustment",
    lineId: "",
    lineName: "",
    targetYield: 0
  },
  {
    materialType: "Aluminum Cans",
    plannedUsage: 15000,
    actualUsage: 15450,
    yieldPercentage: 97.1,
    wasteAmount: 450,
    costImpact: 189.75,
    rootCauseCategory: "Material handling",
    lineId: "",
    lineName: "",
    targetYield: 0
  },
  {
    materialType: "Cardboard Boxes",
    plannedUsage: 5000,
    actualUsage: 5125,
    yieldPercentage: 97.6,
    wasteAmount: 125,
    costImpact: 62.25,
    rootCauseCategory: "Setup variation",
    lineId: "",
    lineName: "",
    targetYield: 0
  }
];

export const batchConsistencyData: BatchConsistency[] = [
  {
    batchId: "BATCH-001",
    recipeId: "RCP-Cola-001",
    productName: "Cola Classic",
    consistencyScore: 87.3,
    targetScore: 90.0,
    targetYield: 98.5, // percentage
    actualYield: 97.8, // percentage
    yieldVariance: -0.7, // percentage
    qualityParameters: {
      "Sugar Content": 10.2,
      "CO2 Level": 3.8,
      "pH": 2.52,
      "Temperature": 4.1
    },
    deviationAnalysis: ["Sugar content slightly low", "CO2 within spec", "pH optimal"]
  },
  {
    batchId: "BATCH-002",
    recipeId: "RCP-Orange-001",
    productName: "Orange Juice",
    consistencyScore: 92.1,
    targetScore: 88.0,
    targetYield: 97.8, // percentage
    actualYield: 98.2, // percentage
    yieldVariance: 0.4, // percentage
    qualityParameters: {
      "Vitamin C": 45.2,
      "Acidity": 0.85,
      "Brix": 11.8,
      "Temperature": 3.9
    },
    deviationAnalysis: ["Vitamin C excellent", "Acidity perfect", "Brix slightly high"]
  }
];

// PA (Process Automation) Template Data
// Note: interfaces are defined at the top of the file

// ============================================================================
// PA (Process Automation) Template Data
// ============================================================================

// ============================================================================
// Oil & Gas (Upstream) Templates
// ============================================================================

export const oilGasUpstreamTagMappings: TagMapping[] = [
  {
    id: "tm-og-001",
    name: "Wellhead Pressure",
    description: "Wellhead pressure measurement mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "WH-001.Pressure",
    targetVariable: "Well_001_Pressure",
    dataType: "float",
    unit: "psi",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-002",
    name: "Wellhead Temperature",
    description: "Wellhead temperature measurement mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "WH-001.Temperature",
    targetVariable: "Well_001_Temperature",
    dataType: "float",
    unit: "°F",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-003",
    name: "Choke Position",
    description: "Production choke position mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "WH-001.ChokePosition",
    targetVariable: "Well_001_Choke",
    dataType: "float",
    unit: "%",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-004",
    name: "ESP Speed",
    description: "Electric submersible pump speed mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "ESP-01.Speed",
    targetVariable: "ESP_01_Speed",
    dataType: "float",
    unit: "Hz",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-005",
    name: "ESP Current",
    description: "ESP motor current mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "ESP-01.Current",
    targetVariable: "ESP_01_Current",
    dataType: "float",
    unit: "A",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-006",
    name: "Separator Level",
    description: "Production separator level mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "SEP-A.Level",
    targetVariable: "Separator_A_Level",
    dataType: "float",
    unit: "%",
    scalingFactor: 1.0
  },
  {
    id: "tm-og-007",
    name: "Tank Level",
    description: "Storage tank level mapping",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "TANK-01.Level",
    targetVariable: "Tank_01_Level",
    dataType: "float",
    unit: "%",
    scalingFactor: 1.0
  }
];

export const oilGasUpstreamControlModels: ControlModel[] = [
  {
    id: "cm-og-001",
    name: "Well Control Model",
    description: "State machine for well operations",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Shut-in", "Startup", "Flowing", "Test", "Trip"],
    currentState: "Flowing",
    transitions: [
      { from: "Shut-in", to: "Startup", condition: "Manual start command" },
      { from: "Startup", to: "Flowing", condition: "Pressure stabilized" },
      { from: "Flowing", to: "Test", condition: "Test scheduled" },
      { from: "Test", to: "Flowing", condition: "Test complete" },
      { from: "Flowing", to: "Trip", condition: "Pressure anomaly detected" }
    ]
  },
  {
    id: "cm-og-002",
    name: "ESP Pump Model",
    description: "State machine for ESP operations",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Off", "Starting", "Running", "Degraded", "Trip"],
    currentState: "Running",
    transitions: [
      { from: "Off", to: "Starting", condition: "Start command" },
      { from: "Starting", to: "Running", condition: "Speed reached setpoint" },
      { from: "Running", to: "Degraded", condition: "High vibration detected" },
      { from: "Running", to: "Trip", condition: "Overcurrent detected" }
    ]
  },
  {
    id: "cm-og-003",
    name: "Separator Model",
    description: "State machine for separator operations",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Normal", "High-Level", "High-High-Level", "Bypass"],
    currentState: "Normal",
    transitions: [
      { from: "Normal", to: "High-Level", condition: "Level > 70%" },
      { from: "High-Level", to: "High-High-Level", condition: "Level > 85%" },
      { from: "High-High-Level", to: "Bypass", condition: "Level > 95%" },
      { from: "Bypass", to: "Normal", condition: "Level < 50%" }
    ]
  }
];

export const oilGasUpstreamActionBindings: ActionBinding[] = [
  {
    id: "ab-og-001",
    name: "Choke Open",
    description: "Open production choke valve",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "open_choke",
    actuator: "WH-001.Choke",
    parameters: { rate: 5, unit: "%/min" }
  },
  {
    id: "ab-og-002",
    name: "Choke Close",
    description: "Close production choke valve",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "close_choke",
    actuator: "WH-001.Choke",
    parameters: { rate: 5, unit: "%/min" }
  },
  {
    id: "ab-og-003",
    name: "ESP Start",
    description: "Start ESP pump",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "start_esp",
    actuator: "ESP-01.VFD",
    parameters: { rampRate: 2, targetSpeed: 50, unit: "Hz" }
  },
  {
    id: "ab-og-004",
    name: "Separator Dump Valve",
    description: "Control separator dump valve",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "control_dump_valve",
    actuator: "SEP-A.DumpValve",
    parameters: { mode: "level_control", setpoint: 60, unit: "%" }
  }
];

export const oilGasUpstreamTriggers: Trigger[] = [
  {
    id: "tr-og-001",
    name: "Pressure Anomaly",
    description: "Detect abnormal wellhead pressure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "WH-001.Pressure < 500 OR WH-001.Pressure > 2000",
    actions: ["alarm", "close_choke", "notify_operator"],
    priority: "critical"
  },
  {
    id: "tr-og-002",
    name: "Water Cut High",
    description: "Detect high water cut in production",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "Well_001_WaterCut > 80",
    actions: ["alarm", "log_event", "notify_production_engineer"],
    priority: "high"
  },
  {
    id: "tr-og-003",
    name: "ESP Trip",
    description: "Detect ESP motor trip condition",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "ESP-01.Current > 150 OR ESP-01.Vibration > 10",
    actions: ["stop_esp", "alarm", "notify_maintenance"],
    priority: "critical"
  },
  {
    id: "tr-og-004",
    name: "Separator High Level",
    description: "Detect high level in separator",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "SEP-A.Level > 85",
    actions: ["open_dump_valve", "alarm", "reduce_inlet_flow"],
    priority: "high"
  }
];

export const oilGasUpstreamAlarmRules: AlarmRule[] = [
  {
    id: "ar-og-001",
    name: "High Pressure Alarm",
    description: "Classify and route high pressure alarms",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Process Alarm",
    severity: "critical",
    routing: ["control_room", "production_engineer", "sms_alert"],
    autoAcknowledge: false,
    escalationTime: 300
  },
  {
    id: "ar-og-002",
    name: "ESP Vibration Warning",
    description: "Classify ESP vibration warnings",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Equipment Warning",
    severity: "warning",
    routing: ["maintenance_team", "email"],
    autoAcknowledge: false,
    escalationTime: 600
  },
  {
    id: "ar-og-003",
    name: "Tank Level Info",
    description: "Tank level information messages",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Information",
    severity: "info",
    routing: ["control_room"],
    autoAcknowledge: true
  },
  {
    id: "ar-og-004",
    name: "Separator High Level",
    description: "Separator high level alarm routing",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Process Alarm",
    severity: "alarm",
    routing: ["control_room", "field_operator"],
    autoAcknowledge: false,
    escalationTime: 180
  }
];

export const oilGasUpstreamEventPatterns: EventPattern[] = [
  {
    id: "ep-og-001",
    name: "Well Decline Pattern",
    description: "Detect gradual well production decline",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Trend Analysis",
    events: ["pressure_reading", "flow_rate_reading", "choke_position"],
    timeWindow: 86400,
    matchCondition: "flow_rate decreasing AND pressure stable AND choke_position unchanged",
    actions: ["notify_production_engineer", "schedule_well_test", "log_decline"]
  },
  {
    id: "ep-og-002",
    name: "ESP Degradation Pattern",
    description: "Detect ESP performance degradation",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Performance Degradation",
    events: ["esp_current", "esp_vibration", "esp_temperature", "flow_rate"],
    timeWindow: 3600,
    matchCondition: "current increasing AND vibration increasing AND flow_rate decreasing",
    actions: ["alarm", "notify_maintenance", "recommend_inspection"]
  },
  {
    id: "ep-og-003",
    name: "Water Breakthrough Pattern",
    description: "Detect water breakthrough in production",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Composition Change",
    events: ["water_cut", "flow_rate", "pressure"],
    timeWindow: 7200,
    matchCondition: "water_cut rapidly increasing OVER 2 hours",
    actions: ["alarm", "notify_reservoir_engineer", "adjust_production"]
  }
];

export const oilGasUpstreamWorkflows: Workflow[] = [
  {
    id: "wf-og-001",
    name: "Well Startup",
    description: "Standard well startup procedure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "manual",
    approvalRequired: true,
    steps: [
      { id: "step1", name: "Pre-checks", action: "verify_conditions", parameters: { checks: ["pressure", "temperature", "valve_positions"] } },
      { id: "step2", name: "Open choke gradually", action: "open_choke", parameters: { rate: 5, target: 30 } },
      { id: "step3", name: "Monitor stabilization", action: "monitor", parameters: { duration: 300, parameters: ["pressure", "flow"] } },
      { id: "step4", name: "Normal operation", action: "set_state", parameters: { state: "Flowing" } }
    ]
  },
  {
    id: "wf-og-002",
    name: "Well Test",
    description: "Production well test procedure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "scheduled",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Route to test separator", action: "switch_routing", parameters: { destination: "test_separator" } },
      { id: "step2", name: "Stabilize", action: "wait_stable", parameters: { duration: 600 } },
      { id: "step3", name: "Measure rates", action: "measure", parameters: { duration: 3600, parameters: ["oil_rate", "gas_rate", "water_rate"] } },
      { id: "step4", name: "Revert routing", action: "switch_routing", parameters: { destination: "production_separator" } }
    ]
  },
  {
    id: "wf-og-003",
    name: "Separator Management",
    description: "Automatic separator level control",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "automatic",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Monitor levels", action: "monitor", parameters: { parameter: "level" } },
      { id: "step2", name: "Adjust valves", action: "control_valves", parameters: { mode: "pid", setpoint: 60 } },
      { id: "step3", name: "Control pumps", action: "control_pumps", parameters: { mode: "auto" } },
      { id: "step4", name: "Prevent overflow", action: "safety_check", parameters: { threshold: 95 } }
    ]
  },
  {
    id: "wf-og-004",
    name: "Tank Transfer",
    description: "Automated tank transfer operation",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "automatic",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Check levels", action: "verify_levels", parameters: { source_min: 20, destination_max: 80 } },
      { id: "step2", name: "Open valves", action: "open_valves", parameters: { valves: ["source_outlet", "destination_inlet"] } },
      { id: "step3", name: "Start pump", action: "start_pump", parameters: { pump: "transfer_pump_01" } },
      { id: "step4", name: "Monitor transfer", action: "monitor", parameters: { parameters: ["flow_rate", "levels"] } },
      { id: "step5", name: "Auto-stop", action: "stop_on_condition", parameters: { condition: "destination_level > 90 OR source_level < 10" } }
    ]
  }
];

// ============================================================================
// Power (Transmission) Templates
// ============================================================================

export const powerTransmissionTagMappings: TagMapping[] = [
  {
    id: "tm-pw-001",
    name: "Breaker Status",
    description: "Circuit breaker status mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "BKR-101.Status",
    targetVariable: "Breaker_101_Status",
    dataType: "boolean",
    unit: "open/closed"
  },
  {
    id: "tm-pw-002",
    name: "Breaker Command",
    description: "Circuit breaker command mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "BKR-101.Command",
    targetVariable: "Breaker_101_Command",
    dataType: "string",
    unit: "command"
  },
  {
    id: "tm-pw-003",
    name: "Line Voltage",
    description: "Transmission line voltage mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "LINE-A.Voltage",
    targetVariable: "Line_A_Voltage",
    dataType: "float",
    unit: "kV",
    scalingFactor: 1.0
  },
  {
    id: "tm-pw-004",
    name: "Line Current",
    description: "Transmission line current mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "LINE-A.Current",
    targetVariable: "Line_A_Current",
    dataType: "float",
    unit: "A",
    scalingFactor: 1.0
  },
  {
    id: "tm-pw-005",
    name: "Line Power",
    description: "Transmission line power mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "LINE-A.Power",
    targetVariable: "Line_A_Power",
    dataType: "float",
    unit: "MW",
    scalingFactor: 1.0
  },
  {
    id: "tm-pw-006",
    name: "Relay Trip Signal",
    description: "Protection relay trip signal mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "RELAY-R1.Trip",
    targetVariable: "Relay_R1_Trip",
    dataType: "boolean",
    unit: "trip/normal"
  },
  {
    id: "tm-pw-007",
    name: "Bus Voltage",
    description: "Busbar voltage mapping",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "BUS-01.Voltage",
    targetVariable: "Bus_01_Voltage",
    dataType: "float",
    unit: "kV",
    scalingFactor: 1.0
  }
];

export const powerTransmissionControlModels: ControlModel[] = [
  {
    id: "cm-pw-001",
    name: "Line Model",
    description: "State machine for transmission line operations",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["In-service", "Out-of-service", "Derated"],
    currentState: "In-service",
    transitions: [
      { from: "In-service", to: "Out-of-service", condition: "Breakers opened" },
      { from: "In-service", to: "Derated", condition: "Thermal limit exceeded" },
      { from: "Derated", to: "In-service", condition: "Temperature normal" },
      { from: "Out-of-service", to: "In-service", condition: "Breakers closed and energized" }
    ]
  },
  {
    id: "cm-pw-002",
    name: "Busbar Model",
    description: "State machine for busbar operations",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Energized", "De-energized", "Isolated"],
    currentState: "Energized",
    transitions: [
      { from: "Energized", to: "De-energized", condition: "All sources disconnected" },
      { from: "De-energized", to: "Isolated", condition: "Isolation switches opened" },
      { from: "Isolated", to: "De-energized", condition: "Isolation switches closed" },
      { from: "De-energized", to: "Energized", condition: "Source connected" }
    ]
  },
  {
    id: "cm-pw-003",
    name: "Breaker Model",
    description: "State machine for circuit breaker operations",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Open", "Closed", "Tagged", "Locked-out"],
    currentState: "Closed",
    transitions: [
      { from: "Open", to: "Closed", condition: "Close command" },
      { from: "Closed", to: "Open", condition: "Open command or trip" },
      { from: "Open", to: "Tagged", condition: "Maintenance tag applied" },
      { from: "Tagged", to: "Open", condition: "Tag removed" },
      { from: "Open", to: "Locked-out", condition: "Lockout applied" }
    ]
  }
];

export const powerTransmissionActionBindings: ActionBinding[] = [
  {
    id: "ab-pw-001",
    name: "Breaker Open",
    description: "Open circuit breaker",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "open_breaker",
    actuator: "BKR-101",
    parameters: { verification: true, timeout: 5 }
  },
  {
    id: "ab-pw-002",
    name: "Breaker Close",
    description: "Close circuit breaker",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "close_breaker",
    actuator: "BKR-101",
    parameters: { verification: true, timeout: 5, syncCheck: true }
  },
  {
    id: "ab-pw-003",
    name: "Switch Operation",
    description: "Operate disconnect switch",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "operate_switch",
    actuator: "SW-201",
    parameters: { verification: true, noLoadCheck: true }
  },
  {
    id: "ab-pw-004",
    name: "Topology Reconfiguration",
    description: "Execute named topology action",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "reconfigure_topology",
    actuator: "SCADA_System",
    parameters: { sequence: "fault_isolation_A", verification: true }
  }
];

export const powerTransmissionTriggers: Trigger[] = [
  {
    id: "tr-pw-001",
    name: "Fault Detection",
    description: "Detect fault on transmission line",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "RELAY-R1.Trip == true OR LINE-A.Current > 2000",
    actions: ["open_breakers", "alarm", "initiate_fault_isolation"],
    priority: "critical"
  },
  {
    id: "tr-pw-002",
    name: "Overload Detection",
    description: "Detect thermal overload condition",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "LINE-A.Current > 1500 AND LINE-A.Temperature > 90",
    actions: ["alarm", "derate_line", "notify_operator"],
    priority: "high"
  },
  {
    id: "tr-pw-003",
    name: "Voltage Deviation",
    description: "Detect abnormal voltage levels",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "BUS-01.Voltage < 110 OR BUS-01.Voltage > 132",
    actions: ["alarm", "adjust_tap_changer", "log_event"],
    priority: "medium"
  },
  {
    id: "tr-pw-004",
    name: "Topology Anomaly",
    description: "Detect abnormal network topology",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "Topology_State != Expected_State",
    actions: ["alarm", "verify_breaker_positions", "notify_control_center"],
    priority: "high"
  }
];

export const powerTransmissionWorkflows: Workflow[] = [
  {
    id: "wf-pw-001",
    name: "Fault Isolation",
    description: "Automatic fault isolation and sectionalizing",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "automatic",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Detect fault", action: "analyze_fault", parameters: { sources: ["relays", "current_sensors"] } },
      { id: "step2", name: "Open breakers", action: "open_breakers", parameters: { breakers: ["upstream", "downstream"] } },
      { id: "step3", name: "Isolate section", action: "isolate_section", parameters: { section: "faulted_section" } },
      { id: "step4", name: "Log event", action: "log_fault", parameters: { details: "full" } }
    ]
  },
  {
    id: "wf-pw-002",
    name: "Automatic Restoration",
    description: "FLISR - Fault Location, Isolation, and Service Restoration",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "automatic",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Identify healthy sections", action: "analyze_topology", parameters: { exclude: "faulted_sections" } },
      { id: "step2", name: "Reconfigure topology", action: "reconfigure", parameters: { mode: "restore_maximum_load" } },
      { id: "step3", name: "Restore loads", action: "close_breakers", parameters: { sequence: "calculated_sequence" } },
      { id: "step4", name: "Verify restoration", action: "verify", parameters: { checks: ["voltage", "current", "topology"] } }
    ]
  },
  {
    id: "wf-pw-003",
    name: "Planned Switching",
    description: "Planned switching operation for maintenance",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "manual",
    approvalRequired: true,
    steps: [
      { id: "step1", name: "Lock out", action: "apply_lockout", parameters: { equipment: "target_equipment" } },
      { id: "step2", name: "Verify de-energized", action: "verify_voltage", parameters: { threshold: 0, timeout: 60 } },
      { id: "step3", name: "Perform work", action: "wait_for_completion", parameters: { notification: true } },
      { id: "step4", name: "Restore", action: "remove_lockout", parameters: { equipment: "target_equipment" } },
      { id: "step5", name: "Test", action: "test_equipment", parameters: { tests: ["insulation", "operation"] } }
    ]
  }
];

export const powerTransmissionEventPatterns: EventPattern[] = [
  {
    id: "ep-pw-001",
    name: "Cascading Fault Pattern",
    description: "Detect cascading fault sequence",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Sequence Detection",
    events: ["breaker_trip", "relay_operation", "voltage_drop"],
    timeWindow: 60,
    matchCondition: "multiple breaker_trips WITHIN 60 seconds IN adjacent zones",
    actions: ["critical_alarm", "initiate_islanding", "notify_control_center"]
  },
  {
    id: "ep-pw-002",
    name: "Load Oscillation Pattern",
    description: "Detect power oscillation conditions",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Oscillation Detection",
    events: ["power_flow", "frequency", "voltage"],
    timeWindow: 300,
    matchCondition: "power_flow oscillating AND frequency deviation > 0.1Hz",
    actions: ["alarm", "adjust_damping", "notify_stability_team"]
  },
  {
    id: "ep-pw-003",
    name: "Equipment Aging Pattern",
    description: "Detect equipment aging indicators",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Condition Monitoring",
    events: ["breaker_operations", "contact_resistance", "operating_time"],
    timeWindow: 2592000,
    matchCondition: "operating_time increasing AND contact_resistance increasing OVER 30 days",
    actions: ["schedule_maintenance", "notify_asset_management", "log_condition"]
  }
];

export const powerTransmissionAlarmRules: AlarmRule[] = [
  {
    id: "ar-pw-001",
    name: "Fault Trip Alarm",
    description: "Critical fault trip alarm classification",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Protection Alarm",
    severity: "critical",
    routing: ["control_center", "shift_supervisor", "emergency_line"],
    autoAcknowledge: false,
    escalationTime: 60
  },
  {
    id: "ar-pw-002",
    name: "Overload Warning",
    description: "Thermal overload warning classification",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Operational Warning",
    severity: "warning",
    routing: ["control_center", "load_dispatcher"],
    autoAcknowledge: false,
    escalationTime: 300
  },
  {
    id: "ar-pw-003",
    name: "Voltage Deviation",
    description: "Voltage deviation alarm routing",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Quality Alarm",
    severity: "alarm",
    routing: ["control_center", "voltage_control"],
    autoAcknowledge: false,
    escalationTime: 180
  },
  {
    id: "ar-pw-004",
    name: "Breaker Status Change",
    description: "Breaker status change information",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Status Information",
    severity: "info",
    routing: ["control_center", "log_system"],
    autoAcknowledge: true
  }
];

// ============================================================================
// FMCG (Food & Beverage) Templates
// ============================================================================

export const fmcgFoodBeverageTagMappings: TagMapping[] = [
  {
    id: "tm-fb-001",
    name: "Filler Speed",
    description: "Bottle filler machine speed mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "FILLER-01.Speed",
    targetVariable: "Filler_01_Speed",
    dataType: "float",
    unit: "bottles/min",
    scalingFactor: 1.0
  },
  {
    id: "tm-fb-002",
    name: "Capper Status",
    description: "Capper machine status mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "CAPPER-01.Status",
    targetVariable: "Capper_01_Status",
    dataType: "string",
    unit: "status"
  },
  {
    id: "tm-fb-003",
    name: "Labeler Count",
    description: "Labeler bottle count mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "LABELER-01.Count",
    targetVariable: "Labeler_01_Count",
    dataType: "integer",
    unit: "bottles"
  },
  {
    id: "tm-fb-004",
    name: "Conveyor Speed",
    description: "Main conveyor speed mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "CONV-MAIN.Speed",
    targetVariable: "Conveyor_Main_Speed",
    dataType: "float",
    unit: "m/min",
    scalingFactor: 1.0
  },
  {
    id: "tm-fb-005",
    name: "Conveyor Jam Sensor",
    description: "Conveyor jam detection mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "CONV-MAIN.Jam",
    targetVariable: "Conveyor_Main_Jam",
    dataType: "boolean",
    unit: "jam/clear"
  },
  {
    id: "tm-fb-006",
    name: "Process Temperature",
    description: "Process zone temperature mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "ZONE-A.Temperature",
    targetVariable: "Zone_A_Temperature",
    dataType: "float",
    unit: "°C",
    scalingFactor: 1.0
  },
  {
    id: "tm-fb-007",
    name: "Mix Tank Level",
    description: "Product mix tank level mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "TANK-MIX.Level",
    targetVariable: "Tank_Mix_Level",
    dataType: "float",
    unit: "%",
    scalingFactor: 1.0
  },
  {
    id: "tm-fb-008",
    name: "CIP Phase",
    description: "CIP system phase mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "CIP-01.Phase",
    targetVariable: "CIP_01_Phase",
    dataType: "string",
    unit: "phase"
  },
  {
    id: "tm-fb-009",
    name: "CIP Temperature",
    description: "CIP solution temperature mapping",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    sourceTag: "CIP-01.Temperature",
    targetVariable: "CIP_01_Temperature",
    dataType: "float",
    unit: "°C",
    scalingFactor: 1.0
  }
];

export const fmcgFoodBeverageControlModels: ControlModel[] = [
  {
    id: "cm-fb-001",
    name: "Machine Model",
    description: "State machine for production machine operations",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Idle", "Starting", "Running", "Blocked", "Faulted"],
    currentState: "Running",
    transitions: [
      { from: "Idle", to: "Starting", condition: "Start command" },
      { from: "Starting", to: "Running", condition: "Speed reached setpoint" },
      { from: "Running", to: "Blocked", condition: "Downstream blockage detected" },
      { from: "Running", to: "Faulted", condition: "Fault condition detected" },
      { from: "Blocked", to: "Running", condition: "Blockage cleared" }
    ]
  },
  {
    id: "cm-fb-002",
    name: "Line Model",
    description: "State machine for production line operations",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Stopped", "Starting", "Running", "Changeover", "CIP"],
    currentState: "Running",
    transitions: [
      { from: "Stopped", to: "Starting", condition: "Start sequence initiated" },
      { from: "Starting", to: "Running", condition: "All machines running" },
      { from: "Running", to: "Changeover", condition: "Product change requested" },
      { from: "Running", to: "CIP", condition: "CIP scheduled" },
      { from: "Changeover", to: "Running", condition: "Changeover complete" },
      { from: "CIP", to: "Stopped", condition: "CIP complete" }
    ]
  },
  {
    id: "cm-fb-003",
    name: "CIP Cycle Model",
    description: "State machine for CIP operations",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    states: ["Pre-rinse", "Wash", "Rinse", "Sanitize", "Complete"],
    currentState: "Complete",
    transitions: [
      { from: "Pre-rinse", to: "Wash", condition: "Pre-rinse time elapsed" },
      { from: "Wash", to: "Rinse", condition: "Wash time elapsed and conductivity OK" },
      { from: "Rinse", to: "Sanitize", condition: "Rinse time elapsed" },
      { from: "Sanitize", to: "Complete", condition: "Sanitize time elapsed" }
    ]
  }
];

export const fmcgFoodBeverageActionBindings: ActionBinding[] = [
  {
    id: "ab-fb-001",
    name: "Machine Start",
    description: "Start production machine",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "start_machine",
    actuator: "FILLER-01",
    parameters: { rampTime: 10, targetSpeed: 300, unit: "bottles/min" }
  },
  {
    id: "ab-fb-002",
    name: "Machine Stop",
    description: "Stop production machine",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "stop_machine",
    actuator: "FILLER-01",
    parameters: { rampTime: 5, mode: "controlled" }
  },
  {
    id: "ab-fb-003",
    name: "Speed Setpoint",
    description: "Adjust machine speed setpoint",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "set_speed",
    actuator: "FILLER-01.VFD",
    parameters: { min: 100, max: 400, unit: "bottles/min" }
  },
  {
    id: "ab-fb-004",
    name: "Routing Change",
    description: "Change product routing",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "change_routing",
    actuator: "VALVE-ROUTING",
    parameters: { destinations: ["line_a", "line_b", "waste"], verification: true }
  },
  {
    id: "ab-fb-005",
    name: "CIP Program",
    description: "Execute CIP program",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    action: "run_cip",
    actuator: "CIP-01",
    parameters: { program: "standard", temperature: 80, duration: 60 }
  }
];

export const fmcgFoodBeverageTriggers: Trigger[] = [
  {
    id: "tr-fb-001",
    name: "Line Starvation",
    description: "Detect upstream starvation condition",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "CONV-MAIN.Sensor_Upstream == empty FOR 5 seconds",
    actions: ["slow_downstream", "alarm", "notify_operator"],
    priority: "high"
  },
  {
    id: "tr-fb-002",
    name: "Conveyor Jam",
    description: "Detect conveyor jam condition",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "CONV-MAIN.Jam == true",
    actions: ["stop_line", "alarm", "notify_maintenance"],
    priority: "critical"
  },
  {
    id: "tr-fb-003",
    name: "Underfill Detection",
    description: "Detect underfilled bottles",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "SCALE-01.Weight < Target_Weight - Tolerance",
    actions: ["reject_bottle", "alarm", "adjust_fill_time"],
    priority: "medium"
  },
  {
    id: "tr-fb-004",
    name: "Temperature Out of Range",
    description: "Detect process temperature deviation",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "ZONE-A.Temperature < 18 OR ZONE-A.Temperature > 25",
    actions: ["alarm", "adjust_hvac", "log_deviation"],
    priority: "high"
  },
  {
    id: "tr-fb-005",
    name: "CIP Conductivity Alarm",
    description: "Detect inadequate CIP cleaning",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    condition: "CIP-01.Conductivity < Minimum_Threshold DURING Wash",
    actions: ["extend_wash_time", "alarm", "notify_quality"],
    priority: "high"
  }
];

export const fmcgFoodBeverageWorkflows: Workflow[] = [
  {
    id: "wf-fb-001",
    name: "Line Startup",
    description: "Standard production line startup sequence",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "manual",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Initialize conveyors", action: "start_conveyors", parameters: { sequence: "upstream_to_downstream" } },
      { id: "step2", name: "Start filler", action: "start_machine", parameters: { machine: "FILLER-01", speed: 250 } },
      { id: "step3", name: "Start capper", action: "start_machine", parameters: { machine: "CAPPER-01", speed: 250 } },
      { id: "step4", name: "Start labeler", action: "start_machine", parameters: { machine: "LABELER-01", speed: 250 } },
      { id: "step5", name: "Start packer", action: "start_machine", parameters: { machine: "PACKER-01", speed: 250 } }
    ]
  },
  {
    id: "wf-fb-002",
    name: "Line Shutdown",
    description: "Standard production line shutdown sequence",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "manual",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Stop packer", action: "stop_machine", parameters: { machine: "PACKER-01" } },
      { id: "step2", name: "Stop labeler", action: "stop_machine", parameters: { machine: "LABELER-01" } },
      { id: "step3", name: "Stop capper", action: "stop_machine", parameters: { machine: "CAPPER-01" } },
      { id: "step4", name: "Stop filler", action: "stop_machine", parameters: { machine: "FILLER-01" } },
      { id: "step5", name: "Stop conveyors", action: "stop_conveyors", parameters: { sequence: "downstream_to_upstream" } },
      { id: "step6", name: "Purge lines", action: "purge", parameters: { duration: 60 } }
    ]
  },
  {
    id: "wf-fb-003",
    name: "Product Changeover",
    description: "Product changeover procedure",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "manual",
    approvalRequired: true,
    steps: [
      { id: "step1", name: "Stop line", action: "execute_workflow", parameters: { workflow: "line_shutdown" } },
      { id: "step2", name: "Purge product", action: "purge", parameters: { destination: "waste", duration: 120 } },
      { id: "step3", name: "Change parameters", action: "load_recipe", parameters: { recipe: "new_product" } },
      { id: "step4", name: "Small clean", action: "quick_clean", parameters: { areas: ["filler", "valves"] } },
      { id: "step5", name: "Restart line", action: "execute_workflow", parameters: { workflow: "line_startup" } }
    ]
  },
  {
    id: "wf-fb-004",
    name: "CIP Workflow",
    description: "Clean-in-place full cycle",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    triggerType: "scheduled",
    approvalRequired: false,
    steps: [
      { id: "step1", name: "Pre-rinse", action: "cip_phase", parameters: { phase: "pre_rinse", temperature: 40, duration: 10 } },
      { id: "step2", name: "Caustic wash", action: "cip_phase", parameters: { phase: "caustic_wash", temperature: 80, duration: 20, chemical: "NaOH" } },
      { id: "step3", name: "Rinse", action: "cip_phase", parameters: { phase: "rinse", temperature: 40, duration: 10 } },
      { id: "step4", name: "Acid wash", action: "cip_phase", parameters: { phase: "acid_wash", temperature: 70, duration: 15, chemical: "HNO3" } },
      { id: "step5", name: "Final rinse", action: "cip_phase", parameters: { phase: "final_rinse", temperature: 40, duration: 10 } },
      { id: "step6", name: "Sanitize", action: "cip_phase", parameters: { phase: "sanitize", temperature: 85, duration: 15 } }
    ]
  }
];

export const fmcgFoodBeverageAlarmRules: AlarmRule[] = [
  {
    id: "ar-fb-001",
    name: "Line Jam Critical",
    description: "Production line jam critical alarm",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Production Alarm",
    severity: "critical",
    routing: ["line_supervisor", "maintenance", "production_manager"],
    autoAcknowledge: false,
    escalationTime: 120
  },
  {
    id: "ar-fb-002",
    name: "Quality Deviation",
    description: "Product quality deviation warning",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Quality Warning",
    severity: "warning",
    routing: ["quality_control", "line_supervisor"],
    autoAcknowledge: false,
    escalationTime: 300
  },
  {
    id: "ar-fb-003",
    name: "Temperature Out of Range",
    description: "Process temperature alarm",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Process Alarm",
    severity: "alarm",
    routing: ["line_supervisor", "process_engineer"],
    autoAcknowledge: false,
    escalationTime: 180
  },
  {
    id: "ar-fb-004",
    name: "CIP Cycle Complete",
    description: "CIP cycle completion notification",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    classification: "Status Information",
    severity: "info",
    routing: ["line_supervisor", "sanitation_team"],
    autoAcknowledge: true
  }
];

export const fmcgFoodBeverageEventPatterns: EventPattern[] = [
  {
    id: "ep-fb-001",
    name: "Line Efficiency Degradation",
    description: "Detect gradual line efficiency decline",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Performance Trend",
    events: ["throughput", "reject_rate", "downtime_events"],
    timeWindow: 28800,
    matchCondition: "throughput decreasing AND reject_rate increasing OVER 8 hours",
    actions: ["notify_supervisor", "schedule_maintenance", "analyze_root_cause"]
  },
  {
    id: "ep-fb-002",
    name: "Quality Drift Pattern",
    description: "Detect product quality drift",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Quality Monitoring",
    events: ["fill_weight", "temperature", "pressure"],
    timeWindow: 3600,
    matchCondition: "fill_weight drifting from target AND temperature stable",
    actions: ["adjust_parameters", "notify_quality_control", "log_deviation"]
  },
  {
    id: "ep-fb-003",
    name: "Predictive Jam Pattern",
    description: "Predict conveyor jam before occurrence",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    patternType: "Predictive Detection",
    events: ["conveyor_speed", "motor_current", "bottle_spacing"],
    timeWindow: 300,
    matchCondition: "motor_current increasing AND bottle_spacing decreasing",
    actions: ["slow_line", "alarm", "prevent_jam"]
  }
];

// ============================================================================
// Sequences - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamSequences: Sequence[] = [
  {
    id: "seq-og-001",
    name: "Well Startup Sequence",
    description: "Detailed step-by-step well startup procedure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 900,
    steps: [
      { id: "step1", order: 1, name: "Verify wellhead pressure", action: "check_pressure", duration: 60, condition: "pressure > 0" },
      { id: "step2", order: 2, name: "Open master valve", action: "open_valve", duration: 30, parameters: { valve: "master", rate: 10 } },
      { id: "step3", order: 3, name: "Open wing valve", action: "open_valve", duration: 30, parameters: { valve: "wing", rate: 10 } },
      { id: "step4", order: 4, name: "Open choke 10%", action: "set_choke", duration: 60, parameters: { position: 10 } },
      { id: "step5", order: 5, name: "Monitor stabilization", action: "monitor", duration: 300, condition: "pressure_stable AND flow_stable" },
      { id: "step6", order: 6, name: "Open choke to 30%", action: "set_choke", duration: 120, parameters: { position: 30 } },
      { id: "step7", order: 7, name: "Final stabilization", action: "monitor", duration: 300, condition: "all_parameters_stable" }
    ]
  },
  {
    id: "seq-og-002",
    name: "ESP Startup Sequence",
    description: "Electric submersible pump startup procedure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 600,
    steps: [
      { id: "step1", order: 1, name: "Pre-start checks", action: "verify_conditions", duration: 60, condition: "all_checks_pass" },
      { id: "step2", order: 2, name: "Start VFD at 30 Hz", action: "start_vfd", duration: 30, parameters: { frequency: 30 } },
      { id: "step3", order: 3, name: "Monitor motor current", action: "monitor", duration: 120, condition: "current < max_current" },
      { id: "step4", order: 4, name: "Ramp to 40 Hz", action: "ramp_vfd", duration: 120, parameters: { target: 40, rate: 2 } },
      { id: "step5", order: 5, name: "Monitor vibration", action: "monitor", duration: 120, condition: "vibration < threshold" },
      { id: "step6", order: 6, name: "Ramp to 50 Hz", action: "ramp_vfd", duration: 150, parameters: { target: 50, rate: 2 } }
    ]
  }
];

// ============================================================================
// Sequences - Power (Transmission)
// ============================================================================

export const powerTransmissionSequences: Sequence[] = [
  {
    id: "seq-pw-001",
    name: "Breaker Closing Sequence",
    description: "Safe breaker closing procedure with verification",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 120,
    steps: [
      { id: "step1", order: 1, name: "Verify breaker open", action: "check_status", duration: 5, condition: "breaker_open" },
      { id: "step2", order: 2, name: "Check sync conditions", action: "check_sync", duration: 30, condition: "voltage_match AND phase_match" },
      { id: "step3", order: 3, name: "Enable close circuit", action: "enable_circuit", duration: 5 },
      { id: "step4", order: 4, name: "Send close command", action: "close_breaker", duration: 5 },
      { id: "step5", order: 5, name: "Verify closed status", action: "verify_status", duration: 10, condition: "breaker_closed" },
      { id: "step6", order: 6, name: "Monitor current flow", action: "monitor", duration: 60, condition: "current_normal" }
    ]
  },
  {
    id: "seq-pw-002",
    name: "Line Energization Sequence",
    description: "Transmission line energization procedure",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 300,
    steps: [
      { id: "step1", order: 1, name: "Verify line de-energized", action: "check_voltage", duration: 30, condition: "voltage == 0" },
      { id: "step2", order: 2, name: "Close source breaker", action: "close_breaker", duration: 10, parameters: { breaker: "source" } },
      { id: "step3", order: 3, name: "Monitor inrush current", action: "monitor", duration: 60, condition: "inrush_normal" },
      { id: "step4", order: 4, name: "Verify voltage buildup", action: "check_voltage", duration: 60, condition: "voltage_nominal" },
      { id: "step5", order: 5, name: "Close load breaker", action: "close_breaker", duration: 10, parameters: { breaker: "load" } },
      { id: "step6", order: 6, name: "Verify normal operation", action: "monitor", duration: 120, condition: "all_parameters_normal" }
    ]
  }
];

// ============================================================================
// Sequences - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageSequences: Sequence[] = [
  {
    id: "seq-fb-001",
    name: "Filler Startup Sequence",
    description: "Bottle filler machine startup procedure",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 180,
    steps: [
      { id: "step1", order: 1, name: "Initialize filler", action: "initialize", duration: 10 },
      { id: "step2", order: 2, name: "Prime fill valves", action: "prime_valves", duration: 30, parameters: { cycles: 3 } },
      { id: "step3", order: 3, name: "Start at low speed", action: "set_speed", duration: 20, parameters: { speed: 100 } },
      { id: "step4", order: 4, name: "Verify fill accuracy", action: "check_fill", duration: 60, condition: "weight_within_tolerance" },
      { id: "step5", order: 5, name: "Ramp to production speed", action: "ramp_speed", duration: 60, parameters: { target: 250, rate: 5 } }
    ]
  },
  {
    id: "seq-fb-002",
    name: "CIP Pre-Rinse Sequence",
    description: "CIP pre-rinse phase detailed steps",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    executionMode: "sequential",
    totalDuration: 600,
    steps: [
      { id: "step1", order: 1, name: "Open water supply", action: "open_valve", duration: 5, parameters: { valve: "water_supply" } },
      { id: "step2", order: 2, name: "Start CIP pump", action: "start_pump", duration: 10, parameters: { pump: "cip_pump" } },
      { id: "step3", order: 3, name: "Circulate water", action: "circulate", duration: 300, parameters: { temperature: 40 } },
      { id: "step4", order: 4, name: "Monitor conductivity", action: "monitor", duration: 240, condition: "conductivity_decreasing" },
      { id: "step5", order: 5, name: "Drain rinse water", action: "drain", duration: 30 },
      { id: "step6", order: 6, name: "Stop CIP pump", action: "stop_pump", duration: 5, parameters: { pump: "cip_pump" } }
    ]
  }
];

// ============================================================================
// Control Rules - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamControlRules: ControlRule[] = [
  {
    id: "cr-og-001",
    name: "Wellhead Pressure Control",
    description: "Automatic choke adjustment based on wellhead pressure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "wellhead_pressure > setpoint + deadband OR wellhead_pressure < setpoint - deadband",
    actions: ["adjust_choke_position", "log_adjustment"],
    priority: "high",
    enabled: true
  },
  {
    id: "cr-og-002",
    name: "ESP Protection Rule",
    description: "Protect ESP from overcurrent and high vibration",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "if-then",
    condition: "esp_current > max_current OR esp_vibration > max_vibration",
    actions: ["reduce_esp_speed", "alarm", "notify_operator"],
    priority: "critical",
    enabled: true
  },
  {
    id: "cr-og-003",
    name: "Separator Level Control",
    description: "Maintain separator level within operating range",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "separator_level != level_setpoint",
    actions: ["adjust_dump_valve", "control_inlet_flow"],
    priority: "high",
    enabled: true
  }
];

// ============================================================================
// Control Rules - Power (Transmission)
// ============================================================================

export const powerTransmissionControlRules: ControlRule[] = [
  {
    id: "cr-pw-001",
    name: "Voltage Regulation Rule",
    description: "Maintain bus voltage within acceptable range",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "bus_voltage < min_voltage OR bus_voltage > max_voltage",
    actions: ["adjust_tap_changer", "adjust_capacitor_banks", "log_event"],
    priority: "high",
    enabled: true
  },
  {
    id: "cr-pw-002",
    name: "Overload Protection Rule",
    description: "Prevent thermal overload of transmission lines",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "when-then",
    condition: "line_current > thermal_limit AND temperature > max_temp",
    actions: ["derate_line", "alarm", "initiate_load_shedding"],
    priority: "critical",
    enabled: true
  },
  {
    id: "cr-pw-003",
    name: "Frequency Stabilization Rule",
    description: "Maintain system frequency within limits",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "if-then",
    condition: "frequency < 59.5 OR frequency > 60.5",
    actions: ["adjust_generation", "load_shedding", "notify_control_center"],
    priority: "critical",
    enabled: true
  }
];

// ============================================================================
// Control Rules - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageControlRules: ControlRule[] = [
  {
    id: "cr-fb-001",
    name: "Fill Weight Control Rule",
    description: "Maintain fill weight within specification",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "fill_weight != target_weight",
    actions: ["adjust_fill_time", "adjust_valve_position", "log_adjustment"],
    priority: "high",
    enabled: true
  },
  {
    id: "cr-fb-002",
    name: "Line Speed Synchronization Rule",
    description: "Synchronize speeds across production line",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "filler_speed != capper_speed OR capper_speed != labeler_speed",
    actions: ["synchronize_speeds", "adjust_conveyor_speed"],
    priority: "medium",
    enabled: true
  },
  {
    id: "cr-fb-003",
    name: "Temperature Control Rule",
    description: "Maintain process temperature within specification",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "continuous",
    condition: "process_temperature < min_temp OR process_temperature > max_temp",
    actions: ["adjust_hvac", "adjust_heater", "alarm"],
    priority: "high",
    enabled: true
  },
  {
    id: "cr-fb-004",
    name: "Jam Prevention Rule",
    description: "Prevent conveyor jams by monitoring bottle spacing",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    createdBy: "system",
    ruleType: "when-then",
    condition: "bottle_spacing < min_spacing AND conveyor_speed > threshold",
    actions: ["reduce_line_speed", "alarm", "adjust_infeed"],
    priority: "high",
    enabled: true
  }
];

// ============================================================================
// Govern & Assure Interfaces
// ============================================================================



// ============================================================================
// Versions - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamVersions: Version[] = [
  {
    id: "ver-og-001",
    name: "Well Control Model v2.1",
    description: "Updated well control model with enhanced trip detection",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    createdBy: "john.smith",
    versionNumber: "2.1.0",
    previousVersion: "2.0.0",
    changeDescription: "Added new trip state transition for rapid pressure drop scenarios",
    affectedComponents: ["Well Control Model", "Pressure Monitoring", "Trip Logic"],
    approvalStatus: "approved",
    approvedBy: "sarah.johnson",
    approvedAt: "2024-01-15T14:30:00Z"
  },
  {
    id: "ver-og-002",
    name: "ESP Protection Rule v1.3",
    description: "Enhanced ESP protection with vibration monitoring",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-12T09:00:00Z",
    updatedAt: "2024-01-12T09:00:00Z",
    createdBy: "mike.davis",
    versionNumber: "1.3.0",
    previousVersion: "1.2.0",
    changeDescription: "Added vibration threshold monitoring and gradual speed reduction",
    affectedComponents: ["ESP Control Rule", "Vibration Monitoring", "Speed Control"],
    approvalStatus: "approved",
    approvedBy: "sarah.johnson",
    approvedAt: "2024-01-12T16:00:00Z"
  },
  {
    id: "ver-og-003",
    name: "Well Startup Workflow v3.0",
    description: "Major revision of well startup procedure",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "draft",
    createdAt: "2024-01-16T11:00:00Z",
    updatedAt: "2024-01-16T11:00:00Z",
    createdBy: "john.smith",
    versionNumber: "3.0.0",
    previousVersion: "2.5.0",
    changeDescription: "Complete redesign with automated stabilization monitoring and adaptive choke control",
    affectedComponents: ["Well Startup Workflow", "Choke Control", "Monitoring System"],
    approvalStatus: "pending"
  }
];

// ============================================================================
// Approvals - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamApprovals: Approval[] = [
  {
    id: "app-og-001",
    name: "Well Startup Workflow v3.0 Approval",
    description: "Approval request for major well startup workflow revision",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-16T11:30:00Z",
    updatedAt: "2024-01-16T11:30:00Z",
    createdBy: "system",
    requestType: "Workflow Change - Major",
    requestedBy: "john.smith",
    requestedAt: "2024-01-16T11:30:00Z",
    approver: "sarah.johnson",
    currentApprover: "sarah.johnson",
    approvalStatus: "pending",
    relatedRecordId: "ver-og-003",
    relatedRecordType: "Version"
  },
  {
    id: "app-og-002",
    name: "Separator Level Control Update",
    description: "Approval for updated separator level control parameters",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-14T13:00:00Z",
    updatedAt: "2024-01-14T15:45:00Z",
    createdBy: "system",
    requestType: "Control Rule Change - Minor",
    requestedBy: "mike.davis",
    requestedAt: "2024-01-14T13:00:00Z",
    approver: "sarah.johnson",
    approvalStatus: "approved",
    approvedBy: ["sarah.johnson"],
    approvedAt: "2024-01-14T15:45:00Z",
    relatedRecordId: "cr-og-003",
    relatedRecordType: "Control Rule"
  },
  {
    id: "app-og-003",
    name: "New Water Cut Trigger",
    description: "Approval for new water breakthrough detection trigger",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-13T10:00:00Z",
    updatedAt: "2024-01-13T14:20:00Z",
    createdBy: "system",
    requestType: "Trigger Creation",
    requestedBy: "john.smith",
    requestedAt: "2024-01-13T10:00:00Z",
    approver: "sarah.johnson",
    approvalStatus: "rejected",
    rejectedBy: "reservoir.engineer",
    rejectedAt: "2024-01-13T14:20:00Z",
    rejectionReason: "Threshold too sensitive, would generate excessive alarms",
    relatedRecordId: "tr-og-002",
    relatedRecordType: "Trigger"
  }
];

// ============================================================================
// Simulations - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamSimulations: Simulation[] = [
  {
    id: "sim-og-001",
    name: "Well Startup Simulation - Normal Conditions",
    description: "Simulate well startup under normal operating conditions",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-16T12:00:00Z",
    updatedAt: "2024-01-16T12:15:00Z",
    createdBy: "john.smith",
    simulationType: "workflow",
    targetRecordId: "wf-og-001",

    inputParameters: {
      initialPressure: 1500,
      temperature: 180,
      chokePosition: 0,
      wellState: "Shut-in"
    },
    expectedOutcome: "Well transitions to Flowing state within 15 minutes",
    actualOutcome: "Well reached Flowing state in 14.5 minutes, all parameters within normal range",
    simulationStatus: "completed",
    startedAt: "2024-01-16T12:00:00Z",
    completedAt: "2024-01-16T12:15:00Z",
    duration: 900,
    results: {
      finalState: "Flowing",
      finalPressure: 1450,
      finalChokePosition: 30,
      stabilizationTime: 870,
      anomaliesDetected: 0
    }
  },
  {
    id: "sim-og-002",
    name: "ESP Protection Rule Test - High Current",
    description: "Test ESP protection rule response to overcurrent condition",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-15T14:00:00Z",
    updatedAt: "2024-01-15T14:05:00Z",
    createdBy: "mike.davis",
    simulationType: "control_rule",
    targetRecordId: "cr-og-002",

    inputParameters: {
      espCurrent: 160,
      espVibration: 8,
      espSpeed: 50,
      maxCurrent: 150
    },
    expectedOutcome: "ESP speed reduced to safe level, alarm generated",
    actualOutcome: "ESP speed reduced from 50Hz to 40Hz, alarm triggered, operator notified",
    simulationStatus: "completed",
    startedAt: "2024-01-15T14:00:00Z",
    completedAt: "2024-01-15T14:05:00Z",
    duration: 300,
    results: {
      actionTaken: "reduce_esp_speed",
      newSpeed: 40,
      alarmGenerated: true,
      responseTime: 2.3
    }
  },
  {
    id: "sim-og-003",
    name: "Separator Management - High Level Scenario",
    description: "Simulate separator response to high level condition",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-14T16:00:00Z",
    updatedAt: "2024-01-14T16:00:00Z",
    createdBy: "john.smith",
    simulationType: "workflow",
    targetRecordId: "wf-og-003",

    inputParameters: {
      separatorLevel: 88,
      inletFlow: 5000,
      dumpValvePosition: 50
    },
    expectedOutcome: "Dump valve opens to prevent overflow",
    simulationStatus: "running",
    startedAt: "2024-01-14T16:00:00Z"
  }
];

// ============================================================================
// Audit Logs - Oil & Gas (Upstream)
// ============================================================================

export const oilGasUpstreamAuditLogs: AuditLog[] = [
  {
    id: "aud-og-001",
    name: "Well Control Model Updated",
    description: "Well control model configuration updated",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    createdBy: "john.smith",
    eventType: "update",
    recordType: "Control Model",
    recordId: "cm-og-001",

    changes: {
      states: {
        old: ["Shut-in", "Startup", "Flowing", "Test"],
        new: ["Shut-in", "Startup", "Flowing", "Test", "Trip"]
      },
      transitions: {
        old: "4 transitions",
        new: "5 transitions (added Trip condition)"
      }
    },
    ipAddress: "10.0.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-og-002",
    name: "Well Startup Workflow Executed",
    description: "Well startup workflow executed for Well-005",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-16T08:30:00Z",
    updatedAt: "2024-01-16T08:30:00Z",
    createdBy: "operator.jones",
    eventType: "execute",
    recordType: "Workflow",
    recordId: "wf-og-001",

    executionResult: "Success - Well transitioned to Flowing state in 14 minutes",
    ipAddress: "10.0.1.52",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-og-003",
    name: "ESP Protection Rule Approved",
    description: "ESP protection rule changes approved",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-12T16:00:00Z",
    updatedAt: "2024-01-12T16:00:00Z",
    createdBy: "sarah.johnson",
    eventType: "approve",
    recordType: "Control Rule",
    recordId: "cr-og-002",

    ipAddress: "10.0.1.38",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  {
    id: "aud-og-004",
    name: "New Trigger Created",
    description: "Water cut trigger created",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-13T10:00:00Z",
    updatedAt: "2024-01-13T10:00:00Z",
    createdBy: "john.smith",
    eventType: "create",
    recordType: "Trigger",
    recordId: "tr-og-002",
    ipAddress: "10.0.1.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-og-005",
    name: "Trigger Approval Rejected",
    description: "Water cut trigger approval rejected",
    sector: "oil-gas",
    subsector: "Upstream",
    status: "active",
    createdAt: "2024-01-13T14:20:00Z",
    updatedAt: "2024-01-13T14:20:00Z",
    createdBy: "reservoir.engineer",
    eventType: "reject",
    recordType: "Trigger",
    recordId: "tr-og-002",

    ipAddress: "10.0.1.67",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  }
];

// ============================================================================
// Versions - Power (Transmission)
// ============================================================================

export const powerTransmissionVersions: Version[] = [
  {
    id: "ver-pw-001",
    name: "FLISR Workflow v2.0",
    description: "Enhanced fault location, isolation, and service restoration",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-14T09:00:00Z",
    updatedAt: "2024-01-14T09:00:00Z",
    createdBy: "alex.chen",
    versionNumber: "2.0.0",
    previousVersion: "1.5.0",
    changeDescription: "Added AI-based fault location prediction and optimized restoration sequence",
    affectedComponents: ["Fault Isolation Workflow", "Restoration Logic", "Topology Analysis"],
    approvalStatus: "approved",
    approvedBy: "grid.operations.manager",
    approvedAt: "2024-01-14T15:00:00Z"
  },
  {
    id: "ver-pw-002",
    name: "Voltage Regulation Rule v1.2",
    description: "Updated voltage regulation with dynamic tap changer control",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-11T10:30:00Z",
    updatedAt: "2024-01-11T10:30:00Z",
    createdBy: "maria.lopez",
    versionNumber: "1.2.0",
    previousVersion: "1.1.0",
    changeDescription: "Improved tap changer coordination and added voltage deadband adjustment",
    affectedComponents: ["Voltage Control Rule", "Tap Changer Control", "Capacitor Bank Control"],
    approvalStatus: "approved",
    approvedBy: "grid.operations.manager",
    approvedAt: "2024-01-11T16:00:00Z"
  },
  {
    id: "ver-pw-003",
    name: "Breaker Control Model v3.1",
    description: "Enhanced breaker state machine with lockout logic",
    sector: "power",
    subsector: "Transmission",
    status: "draft",
    createdAt: "2024-01-17T11:00:00Z",
    updatedAt: "2024-01-17T11:00:00Z",
    createdBy: "alex.chen",
    versionNumber: "3.1.0",
    previousVersion: "3.0.0",
    changeDescription: "Added automatic lockout after multiple trip events",
    affectedComponents: ["Breaker Model", "Protection Logic", "Trip Counter"],
    approvalStatus: "pending"
  }
];

// ============================================================================
// Approvals - Power (Transmission)
// ============================================================================

export const powerTransmissionApprovals: Approval[] = [
  {
    id: "app-pw-001",
    name: "Breaker Control Model v3.1 Approval",
    description: "Approval request for breaker lockout logic enhancement",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-17T11:30:00Z",
    updatedAt: "2024-01-17T11:30:00Z",
    createdBy: "system",
    requestType: "Control Model Change - Minor",
    requestedBy: "alex.chen",
    requestedAt: "2024-01-17T11:30:00Z",
    approver: "grid.operations.manager",
    currentApprover: "grid.operations.manager",
    approvalStatus: "pending",
    relatedRecordId: "ver-pw-003",
    relatedRecordType: "Version"
  },
  {
    id: "app-pw-002",
    name: "FLISR Workflow Deployment",
    description: "Approval for FLISR v2.0 deployment to production",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-14T14:00:00Z",
    updatedAt: "2024-01-14T15:00:00Z",
    createdBy: "system",
    requestType: "Workflow Deployment - Major",
    requestedBy: "alex.chen",
    requestedAt: "2024-01-14T14:00:00Z",
    approver: "grid.operations.manager",
    approvalStatus: "approved",
    approvedBy: ["grid.operations.manager", "reliability.engineer"],
    approvedAt: "2024-01-14T15:00:00Z",
    relatedRecordId: "ver-pw-001",
    relatedRecordType: "Version"
  },
  {
    id: "app-pw-003",
    name: "Overload Protection Update",
    description: "Approval for thermal overload protection parameter changes",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-10T13:30:00Z",
    createdBy: "system",
    requestType: "Control Rule Change - Minor",
    requestedBy: "maria.lopez",
    requestedAt: "2024-01-10T09:00:00Z",
    approver: "grid.operations.manager",
    approvalStatus: "approved",
    approvedBy: ["grid.operations.manager"],
    approvedAt: "2024-01-10T13:30:00Z",
    relatedRecordId: "cr-pw-002",
    relatedRecordType: "Control Rule"
  }
];

// ============================================================================
// Simulations - Power (Transmission)
// ============================================================================

export const powerTransmissionSimulations: Simulation[] = [
  {
    id: "sim-pw-001",
    name: "FLISR Simulation - Single Line Fault",
    description: "Simulate FLISR response to single line fault",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-14T10:00:00Z",
    updatedAt: "2024-01-14T10:12:00Z",
    createdBy: "alex.chen",
    simulationType: "workflow",
    targetRecordId: "wf-pw-002",

    inputParameters: {
      faultLocation: "Line-A Zone-2",
      faultType: "phase-to-ground",
      affectedBreakers: ["BKR-101", "BKR-102"],
      healthySections: ["Zone-1", "Zone-3", "Zone-4"]
    },
    expectedOutcome: "Fault isolated, 85% of loads restored within 2 minutes",
    actualOutcome: "Fault isolated in 3.2 seconds, 87% of loads restored in 1.8 minutes",
    simulationStatus: "completed",
    startedAt: "2024-01-14T10:00:00Z",
    completedAt: "2024-01-14T10:12:00Z",
    duration: 720,
    results: {
      isolationTime: 3.2,
      restorationTime: 108,
      loadsRestored: 87,
      switchingOperations: 6,
      topologyValid: true
    }
  },
  {
    id: "sim-pw-002",
    name: "Voltage Control Test - Low Voltage Scenario",
    description: "Test voltage regulation rule response to low voltage",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-11T14:00:00Z",
    updatedAt: "2024-01-11T14:08:00Z",
    createdBy: "maria.lopez",
    simulationType: "control_rule",
    targetRecordId: "cr-pw-001",

    inputParameters: {
      busVoltage: 108,
      minVoltage: 110,
      maxVoltage: 132,
      tapPosition: 5,
      capacitorBanks: ["CB-1: OFF", "CB-2: OFF"]
    },
    expectedOutcome: "Tap changer raises voltage, capacitor banks switched on",
    actualOutcome: "Tap position changed from 5 to 7, CB-1 switched on, voltage restored to 118kV",
    simulationStatus: "completed",
    startedAt: "2024-01-11T14:00:00Z",
    completedAt: "2024-01-11T14:08:00Z",
    duration: 480,
    results: {
      finalVoltage: 118,
      tapChanges: 2,
      capacitorSwitching: 1,
      responseTime: 12.5
    }
  },
  {
    id: "sim-pw-003",
    name: "Cascading Fault Pattern Detection",
    description: "Simulate cascading fault detection and response",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
    createdBy: "alex.chen",
    simulationType: "trigger",
    targetRecordId: "ep-pw-001",

    inputParameters: {
      initialFault: "Line-A",
      subsequentTrips: ["BKR-201", "BKR-202", "BKR-203"],
      timeWindow: 45
    },
    expectedOutcome: "Cascading pattern detected, islanding initiated",
    simulationStatus: "running",
    startedAt: "2024-01-15T09:00:00Z"
  }
];

// ============================================================================
// Audit Logs - Power (Transmission)
// ============================================================================

export const powerTransmissionAuditLogs: AuditLog[] = [
  {
    id: "aud-pw-001",
    name: "FLISR Workflow Updated",
    description: "FLISR workflow upgraded to version 2.0",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-14T09:00:00Z",
    updatedAt: "2024-01-14T09:00:00Z",
    createdBy: "alex.chen",
    eventType: "update",
    recordType: "Workflow",
    recordId: "wf-pw-002",
    changes: {
      steps: {
        old: "4 steps",
        new: "4 steps (enhanced with AI prediction)"
      },
      algorithm: {
        old: "Rule-based restoration",
        new: "AI-optimized restoration sequence"
      }
    },
    ipAddress: "10.1.2.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-pw-002",
    name: "FLISR Workflow Executed",
    description: "FLISR workflow executed for Line-A fault",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-15T14:22:00Z",
    updatedAt: "2024-01-15T14:22:00Z",
    createdBy: "scada.system",
    eventType: "execute",
    recordType: "Workflow",
    recordId: "wf-pw-002",

    executionResult: "Success - Fault isolated in 3.1s, 89% loads restored in 1.9 minutes",
    ipAddress: "10.1.2.100",
    userAgent: "SCADA/AutomationEngine v5.2"
  },
  {
    id: "aud-pw-003",
    name: "Voltage Regulation Rule Approved",
    description: "Voltage regulation rule v1.2 approved for deployment",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-11T16:00:00Z",
    updatedAt: "2024-01-11T16:00:00Z",
    createdBy: "grid.operations.manager",
    eventType: "approve",
    recordType: "Control Rule",
    recordId: "cr-pw-001",

    ipAddress: "10.1.2.38",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  {
    id: "aud-pw-004",
    name: "Breaker Model Created",
    description: "New breaker control model created",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-17T11:00:00Z",
    updatedAt: "2024-01-17T11:00:00Z",
    createdBy: "alex.chen",
    eventType: "create",
    recordType: "Control Model",
    recordId: "cm-pw-003",

    ipAddress: "10.1.2.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-pw-005",
    name: "Overload Protection Deployed",
    description: "Updated overload protection rule deployed to production",
    sector: "power",
    subsector: "Transmission",
    status: "active",
    createdAt: "2024-01-10T14:00:00Z",
    updatedAt: "2024-01-10T14:00:00Z",
    createdBy: "maria.lopez",
    eventType: "update",
    recordType: "Control Rule",
    recordId: "cr-pw-002",

    changes: {
      thermalLimit: {
        old: 1400,
        new: 1500
      },
      maxTemp: {
        old: 85,
        new: 90
      }
    },
    ipAddress: "10.1.2.52",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }
];

// ============================================================================
// Versions - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageVersions: Version[] = [
  {
    id: "ver-fb-001",
    name: "CIP Workflow v2.5",
    description: "Enhanced CIP workflow with conductivity monitoring",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-13T08:00:00Z",
    updatedAt: "2024-01-13T08:00:00Z",
    createdBy: "lisa.wang",
    versionNumber: "2.5.0",
    previousVersion: "2.4.0",
    changeDescription: "Added real-time conductivity monitoring and adaptive wash time extension",
    affectedComponents: ["CIP Workflow", "Conductivity Monitoring", "Wash Phase Control"],
    approvalStatus: "approved",
    approvedBy: "quality.manager",
    approvedAt: "2024-01-13T14:00:00Z"
  },
  {
    id: "ver-fb-002",
    name: "Fill Weight Control v1.4",
    description: "Improved fill weight control with adaptive adjustment",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-10T10:00:00Z",
    createdBy: "tom.brown",
    versionNumber: "1.4.0",
    previousVersion: "1.3.0",
    changeDescription: "Added machine learning-based fill time prediction for improved accuracy",
    affectedComponents: ["Fill Weight Control Rule", "Weight Monitoring", "Fill Time Adjustment"],
    approvalStatus: "approved",
    approvedBy: "production.manager",
    approvedAt: "2024-01-10T15:30:00Z"
  },
  {
    id: "ver-fb-003",
    name: "Line Startup Sequence v3.0",
    description: "Major revision of line startup procedure",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "draft",
    createdAt: "2024-01-18T09:00:00Z",
    updatedAt: "2024-01-18T09:00:00Z",
    createdBy: "lisa.wang",
    versionNumber: "3.0.0",
    previousVersion: "2.8.0",
    changeDescription: "Complete redesign with parallel machine startup and automated synchronization",
    affectedComponents: ["Line Startup Workflow", "Machine Synchronization", "Speed Control"],
    approvalStatus: "pending"
  }
];

// ============================================================================
// Approvals - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageApprovals: Approval[] = [
  {
    id: "app-fb-001",
    name: "Line Startup Sequence v3.0 Approval",
    description: "Approval request for major line startup sequence revision",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-18T09:30:00Z",
    updatedAt: "2024-01-18T09:30:00Z",
    createdBy: "system",
    requestType: "Workflow Change - Major",
    requestedBy: "lisa.wang",
    requestedAt: "2024-01-18T09:30:00Z",
    approver: "production.manager",
    currentApprover: "production.manager",
    approvalStatus: "pending",
    relatedRecordId: "ver-fb-003",
    relatedRecordType: "Version"
  },
  {
    id: "app-fb-002",
    name: "CIP Workflow Deployment",
    description: "Approval for CIP v2.5 deployment to all lines",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-13T13:00:00Z",
    updatedAt: "2024-01-13T14:00:00Z",
    createdBy: "system",
    requestType: "Workflow Deployment - Minor",
    requestedBy: "lisa.wang",
    requestedAt: "2024-01-13T13:00:00Z",
    approver: "quality.manager",
    approvalStatus: "approved",
    approvedBy: ["quality.manager", "sanitation.supervisor"],
    approvedAt: "2024-01-13T14:00:00Z",
    relatedRecordId: "ver-fb-001",
    relatedRecordType: "Version"
  },
  {
    id: "app-fb-003",
    name: "Temperature Control Update",
    description: "Approval for process temperature control parameter changes",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-12T11:00:00Z",
    updatedAt: "2024-01-12T15:20:00Z",
    createdBy: "system",
    requestType: "Control Rule Change - Minor",
    requestedBy: "tom.brown",
    requestedAt: "2024-01-12T11:00:00Z",
    approver: "quality.manager",
    approvalStatus: "approved",
    approvedBy: ["quality.manager"],
    approvedAt: "2024-01-12T15:20:00Z",
    relatedRecordId: "cr-fb-003",
    relatedRecordType: "Control Rule"
  }
];

// ============================================================================
// Simulations - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageSimulations: Simulation[] = [
  {
    id: "sim-fb-001",
    name: "Line Startup Simulation - Normal Conditions",
    description: "Simulate production line startup under normal conditions",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-16T07:00:00Z",
    updatedAt: "2024-01-16T07:08:00Z",
    createdBy: "lisa.wang",
    simulationType: "workflow",
    targetRecordId: "wf-fb-001",

    inputParameters: {
      lineState: "Stopped",
      allMachinesReady: true,
      productType: "500ml Water Bottle",
      targetSpeed: 250
    },
    expectedOutcome: "All machines start and synchronize within 5 minutes",
    actualOutcome: "Line reached production speed in 4.5 minutes, all machines synchronized",
    simulationStatus: "completed",
    startedAt: "2024-01-16T07:00:00Z",
    completedAt: "2024-01-16T07:08:00Z",
    duration: 480,
    results: {
      startupTime: 270,
      finalSpeed: 250,
      synchronizationAchieved: true,
      rejectsDuringStartup: 12
    }
  },
  {
    id: "sim-fb-002",
    name: "Fill Weight Control Test - Underfill Scenario",
    description: "Test fill weight control response to underfill condition",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:05:00Z",
    createdBy: "tom.brown",
    simulationType: "control_rule",
    targetRecordId: "cr-fb-001",

    inputParameters: {
      currentWeight: 495,
      targetWeight: 500,
      tolerance: 3,
      fillTime: 2.5
    },
    expectedOutcome: "Fill time adjusted to achieve target weight",
    actualOutcome: "Fill time increased from 2.5s to 2.7s, weight corrected to 499.8g",
    simulationStatus: "completed",
    startedAt: "2024-01-15T10:00:00Z",
    completedAt: "2024-01-15T10:05:00Z",
    duration: 300,
    results: {
      adjustmentMade: true,
      newFillTime: 2.7,
      finalWeight: 499.8,
      correctionTime: 8.5
    }
  },
  {
    id: "sim-fb-003",
    name: "CIP Workflow Simulation - Standard Cycle",
    description: "Simulate complete CIP cycle with all phases",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-14T18:00:00Z",
    updatedAt: "2024-01-14T18:00:00Z",
    createdBy: "lisa.wang",
    simulationType: "workflow",
    targetRecordId: "wf-fb-004",

    inputParameters: {
      cipProgram: "standard",
      targetTemperature: 80,
      expectedDuration: 60
    },
    expectedOutcome: "CIP cycle completes successfully in 60 minutes",
    simulationStatus: "running",
    startedAt: "2024-01-14T18:00:00Z"
  }
];

// ============================================================================
// Audit Logs - FMCG (Food & Beverage)
// ============================================================================

export const fmcgFoodBeverageAuditLogs: AuditLog[] = [
  {
    id: "aud-fb-001",
    name: "CIP Workflow Updated",
    description: "CIP workflow upgraded to version 2.5",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-13T08:00:00Z",
    updatedAt: "2024-01-13T08:00:00Z",
    createdBy: "lisa.wang",
    eventType: "update",
    recordType: "Workflow",
    recordId: "wf-fb-004",
    changes: {
      steps: {
        old: "6 steps",
        new: "6 steps (enhanced conductivity monitoring)"
      },
      washPhase: {
        old: "Fixed 20 minute duration",
        new: "Adaptive duration based on conductivity"
      }
    },
    ipAddress: "10.2.3.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-fb-002",
    name: "Line Startup Executed",
    description: "Production line startup executed for Line-1",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-17T06:00:00Z",
    updatedAt: "2024-01-17T06:00:00Z",
    createdBy: "operator.smith",
    eventType: "execute",
    recordType: "Workflow",
    recordId: "wf-fb-001",

    executionResult: "Success - Line reached production speed in 4.2 minutes",
    ipAddress: "10.2.3.52",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-fb-003",
    name: "Fill Weight Control Approved",
    description: "Fill weight control rule v1.4 approved for deployment",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-10T15:30:00Z",
    updatedAt: "2024-01-10T15:30:00Z",
    createdBy: "production.manager",
    eventType: "approve",
    recordType: "Control Rule",
    recordId: "cr-fb-001",

    ipAddress: "10.2.3.38",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  },
  {
    id: "aud-fb-004",
    name: "Temperature Control Updated",
    description: "Process temperature control parameters updated",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-12T15:30:00Z",
    updatedAt: "2024-01-12T15:30:00Z",
    createdBy: "tom.brown",
    eventType: "update",
    recordType: "Control Rule",
    recordId: "cr-fb-003",

    changes: {
      minTemp: {
        old: 18,
        new: 17
      },
      maxTemp: {
        old: 25,
        new: 26
      }
    },
    ipAddress: "10.2.3.45",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  },
  {
    id: "aud-fb-005",
    name: "CIP Cycle Executed",
    description: "CIP cycle executed on Line-2",
    sector: "fmcg",
    subsector: "Food & Beverage",
    status: "active",
    createdAt: "2024-01-16T22:00:00Z",
    updatedAt: "2024-01-16T22:00:00Z",
    createdBy: "sanitation.operator",
    eventType: "execute",
    recordType: "Workflow",
    recordId: "wf-fb-004",

    executionResult: "Success - CIP cycle completed in 58 minutes, all phases passed",
    ipAddress: "10.2.3.67",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
  }
];

// Duplicate declarations removed - all variables already declared above

// Note: Security data variables are defined above

// Note: All data variables are defined above in their respective sections

// =============================================================================
// Asset Mode Data
// =============================================================================

export interface AssetMode {
  id: string;
  assetId: string;
  assetName: string;
  assetType: "ESP" | "compressor" | "pump" | "generator" | "hvac" | "battery" | "capacitor" | "tap_changer" | "lighting" | "ev_charger";
  currentMode: "idle" | "normal" | "high";
  availableModes: Array<{
    mode: "idle" | "normal" | "high";
    powerKw: number;
    efficiency: number;
    description: string;
    riskLevel: "Low" | "Medium" | "High";
    minRunTimeHours?: number;
    maxRunTimeHours?: number;
  }>;
  recommendations: Array<{
    id: string;
    recommendedMode: "idle" | "normal" | "high";
    rationale: string;
    expectedSavings: number;
    riskNotes: string;
    priority: "Low" | "Medium" | "High";
    implementationTime: string;
  }>;
  lastModeChange: string;
  operatingHours: number;
  nextMaintenanceHours: number;
}

// Asset modes for upstream equipment
export const upstreamAssetModes: AssetMode[] = [
  {
    id: "am-esp-07",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    assetType: "ESP",
    currentMode: "normal",
    availableModes: [
      {
        mode: "idle",
        powerKw: 5.0,
        efficiency: 0,
        description: "Pump stopped, minimal power for controls",
        riskLevel: "High",
        maxRunTimeHours: 4
      },
      {
        mode: "normal",
        powerKw: 45.2,
        efficiency: 85,
        description: "Standard operating mode for production",
        riskLevel: "Low"
      },
      {
        mode: "high",
        powerKw: 68.5,
        efficiency: 82,
        description: "High-rate production mode",
        riskLevel: "Medium",
        maxRunTimeHours: 12
      }
    ],
    recommendations: [
      {
        id: "rec-esp-01",
        recommendedMode: "high",
        rationale: "Current well pressure allows for increased production rate. Market prices favorable for higher output.",
        expectedSavings: 320,
        riskNotes: "Monitor motor temperature and vibration closely. Reduce to normal mode if temperature exceeds 185°F.",
        priority: "Medium",
        implementationTime: "Immediate"
      }
    ],
    lastModeChange: "2024-12-15T08:30:00Z",
    operatingHours: 2840,
    nextMaintenanceHours: 160
  },
  {
    id: "am-gc-11",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    assetType: "compressor",
    currentMode: "normal",
    availableModes: [
      {
        mode: "idle",
        powerKw: 25.0,
        efficiency: 0,
        description: "Compressor unloaded, auxiliary systems running",
        riskLevel: "Medium",
        maxRunTimeHours: 8
      },
      {
        mode: "normal",
        powerKw: 125.3,
        efficiency: 88,
        description: "Standard compression for gas processing",
        riskLevel: "Low"
      },
      {
        mode: "high",
        powerKw: 185.7,
        efficiency: 85,
        description: "Maximum compression for peak gas flow",
        riskLevel: "High",
        maxRunTimeHours: 6
      }
    ],
    recommendations: [
      {
        id: "rec-gc-01",
        recommendedMode: "idle",
        rationale: "Gas production is below threshold for efficient compression. Switching to idle mode during low-flow periods can save significant energy.",
        expectedSavings: 480,
        riskNotes: "Ensure gas bypass valve is functioning. Monitor suction pressure during idle periods.",
        priority: "High",
        implementationTime: "Next shift"
      },
      {
        id: "rec-gc-02",
        recommendedMode: "high",
        rationale: "Upcoming maintenance window requires processing backlog. High mode can clear inventory efficiently.",
        expectedSavings: -150,
        riskNotes: "Increased wear on compression stages. Schedule inspection after high-rate operation.",
        priority: "Low",
        implementationTime: "Next shutdown"
      }
    ],
    lastModeChange: "2024-12-14T16:45:00Z",
    operatingHours: 5240,
    nextMaintenanceHours: 760
  },
  {
    id: "am-p-21",
    assetId: "P-21",
    assetName: "Transfer Pump P-21",
    assetType: "pump",
    currentMode: "normal",
    availableModes: [
      {
        mode: "idle",
        powerKw: 2.5,
        efficiency: 0,
        description: "Pump stopped, control systems active",
        riskLevel: "Low",
        maxRunTimeHours: 24
      },
      {
        mode: "normal",
        powerKw: 25.0,
        efficiency: 78,
        description: "Standard transfer rate for production",
        riskLevel: "Low"
      },
      {
        mode: "high",
        powerKw: 38.2,
        efficiency: 75,
        description: "High-flow mode for tank transfers",
        riskLevel: "Low",
        maxRunTimeHours: 8
      }
    ],
    recommendations: [
      {
        id: "rec-p-01",
        recommendedMode: "high",
        rationale: "Tank levels indicate need for faster transfer to maintain production flow. Current system pressure supports high-flow operation.",
        expectedSavings: 85,
        riskNotes: "Monitor discharge pressure and flow rate. Reduce speed if cavitation detected.",
        priority: "Medium",
        implementationTime: "Within 2 hours"
      }
    ],
    lastModeChange: "2024-12-16T06:15:00Z",
    operatingHours: 1920,
    nextMaintenanceHours: 580
  },
  {
    id: "am-gen-01",
    assetId: "GEN-01",
    assetName: "Emergency Diesel Generator",
    assetType: "generator",
    currentMode: "idle",
    availableModes: [
      {
        mode: "idle",
        powerKw: 0,
        efficiency: 0,
        description: "Standby mode, ready for auto-start",
        riskLevel: "Low"
      },
      {
        mode: "normal",
        powerKw: 450.0,
        efficiency: 35,
        description: "Rated load operation",
        riskLevel: "Low",
        maxRunTimeHours: 24
      },
      {
        mode: "high",
        powerKw: 500.0,
        efficiency: 32,
        description: "Peak load shaving / Emergency power",
        riskLevel: "Medium",
        maxRunTimeHours: 4
      }
    ],
    recommendations: [],
    lastModeChange: "2024-12-01T08:00:00Z",
    operatingHours: 120,
    nextMaintenanceHours: 480
  }
];

// Asset modes for transmission equipment
export const transmissionAssetModes: AssetMode[] = [
  {
    id: "am-tx-hvac-dxb",
    assetId: "LOAD-DXB-HVAC-01",
    assetName: "Control Room HVAC - Dubai Main",
    assetType: "pump", // Reusing existing type, represents HVAC system
    currentMode: "normal",
    availableModes: [
      {
        mode: "normal",
        powerKw: 150.0,
        efficiency: 85,
        description: "Full cooling capacity for control room",
        riskLevel: "Low"
      },
      {
        mode: "idle",
        powerKw: 90.0,
        efficiency: 80,
        description: "Reduced cooling for demand response",
        riskLevel: "Low",
        minRunTimeHours: 0.5,
        maxRunTimeHours: 4
      },
      {
        mode: "high",
        powerKw: 30.0,
        efficiency: 60,
        description: "Standby mode - minimum operation",
        riskLevel: "Medium",
        maxRunTimeHours: 2
      }
    ],
    recommendations: [
      {
        id: "rec-hvac-dxb-01",
        recommendedMode: "idle",
        rationale: "Upcoming peak demand period. Reducing HVAC load can contribute to demand response without impacting operations.",
        expectedSavings: 180,
        riskNotes: "Monitor control room temperature. Return to normal mode if temperature exceeds 24°C.",
        priority: "Medium",
        implementationTime: "Within 30 minutes"
      }
    ],
    lastModeChange: "2025-01-22T08:30:00Z",
    operatingHours: 8640,
    nextMaintenanceHours: 720
  },
  {
    id: "am-tx-pump-dxb",
    assetId: "LOAD-DXB-PUMP-T1",
    assetName: "Transformer T1 Cooling Pump - Dubai Main",
    assetType: "pump",
    currentMode: "normal",
    availableModes: [
      {
        mode: "normal",
        powerKw: 75.0,
        efficiency: 90,
        description: "Full flow rate for transformer cooling",
        riskLevel: "Low"
      },
      {
        mode: "idle",
        powerKw: 45.0,
        efficiency: 85,
        description: "Reduced flow for demand response",
        riskLevel: "Low",
        minRunTimeHours: 1,
        maxRunTimeHours: 2
      },
      {
        mode: "high",
        powerKw: 20.0,
        efficiency: 70,
        description: "Standby mode - minimum circulation",
        riskLevel: "Medium",
        maxRunTimeHours: 4
      }
    ],
    recommendations: [
      {
        id: "rec-pump-dxb-01",
        recommendedMode: "idle",
        rationale: "Transformer load is below 60%. Reduced cooling flow is sufficient for current operating conditions.",
        expectedSavings: 90,
        riskNotes: "Monitor transformer oil temperature. Return to normal mode if temperature exceeds 75°C.",
        priority: "Low",
        implementationTime: "Next hour"
      }
    ],
    lastModeChange: "2025-01-21T14:15:00Z",
    operatingHours: 12480,
    nextMaintenanceHours: 520
  },
  {
    id: "am-tx-bess-dxb",
    assetId: "LOAD-DXB-BESS-01",
    assetName: "Battery Energy Storage System - Dubai Main",
    assetType: "compressor", // Reusing existing type, represents battery storage
    currentMode: "idle",
    availableModes: [
      {
        mode: "idle",
        powerKw: 10.0,
        efficiency: 98,
        description: "Standby mode - ready to charge or discharge",
        riskLevel: "Low"
      },
      {
        mode: "normal",
        powerKw: 2000.0,
        efficiency: 95,
        description: "Charging mode - absorbing grid power",
        riskLevel: "Low",
        minRunTimeHours: 1
      },
      {
        mode: "high",
        powerKw: 2000.0,
        efficiency: 92,
        description: "Discharging mode - supplying grid power",
        riskLevel: "Low",
        minRunTimeHours: 1
      }
    ],
    recommendations: [
      {
        id: "rec-bess-dxb-01",
        recommendedMode: "high",
        rationale: "Peak demand period approaching. Discharging battery can reduce grid demand and provide peak shaving benefits.",
        expectedSavings: 1200,
        riskNotes: "Monitor state of charge. Stop discharge at 20% SOC to preserve battery health.",
        priority: "High",
        implementationTime: "Immediate"
      },
      {
        id: "rec-bess-dxb-02",
        recommendedMode: "normal",
        rationale: "Off-peak period with low electricity prices. Charging battery now can enable peak shaving later.",
        expectedSavings: -400,
        riskNotes: "Charge to 90% SOC maximum. Monitor grid voltage during charging.",
        priority: "Medium",
        implementationTime: "Next off-peak window"
      }
    ],
    lastModeChange: "2025-01-22T06:00:00Z",
    operatingHours: 2160,
    nextMaintenanceHours: 1840
  },
  {
    id: "am-tx-ev-dxb",
    assetId: "LOAD-DXB-EV-01",
    assetName: "EV Charging Station - Dubai Main",
    assetType: "pump", // Reusing existing type, represents EV charger
    currentMode: "normal",
    availableModes: [
      {
        mode: "normal",
        powerKw: 100.0,
        efficiency: 92,
        description: "Full power charging - maximum rate",
        riskLevel: "Low"
      },
      {
        mode: "idle",
        powerKw: 50.0,
        efficiency: 90,
        description: "Reduced power charging for demand response",
        riskLevel: "Low",
        minRunTimeHours: 1
      },
      {
        mode: "high",
        powerKw: 0.0,
        efficiency: 0,
        description: "Charging off - no power consumption",
        riskLevel: "Low"
      }
    ],
    recommendations: [
      {
        id: "rec-ev-dxb-01",
        recommendedMode: "idle",
        rationale: "Peak demand period. Reducing EV charging rate can contribute to demand response while still charging vehicles.",
        expectedSavings: 150,
        riskNotes: "Ensure vehicles reach minimum charge level before end of shift.",
        priority: "Medium",
        implementationTime: "Within 1 hour"
      }
    ],
    lastModeChange: "2025-01-22T07:30:00Z",
    operatingHours: 4320,
    nextMaintenanceHours: 1680
  },
  {
    id: "am-tx-hvac-ja",
    assetId: "LOAD-JA-HVAC-01",
    assetName: "Control Room HVAC - Jebel Ali",
    assetType: "pump", // Reusing existing type, represents HVAC system
    currentMode: "normal",
    availableModes: [
      {
        mode: "normal",
        powerKw: 180.0,
        efficiency: 85,
        description: "Full cooling capacity for control room",
        riskLevel: "Low"
      },
      {
        mode: "idle",
        powerKw: 110.0,
        efficiency: 80,
        description: "Reduced cooling for demand response",
        riskLevel: "Low",
        minRunTimeHours: 0.5,
        maxRunTimeHours: 4
      },
      {
        mode: "high",
        powerKw: 35.0,
        efficiency: 60,
        description: "Standby mode - minimum operation",
        riskLevel: "Medium",
        maxRunTimeHours: 2
      }
    ],
    recommendations: [],
    lastModeChange: "2025-01-22T09:00:00Z",
    operatingHours: 7920,
    nextMaintenanceHours: 1080
  },
  {
    id: "am-tx-pump-ja",
    assetId: "LOAD-JA-PUMP-T1",
    assetName: "Transformer T1 Cooling Pump - Jebel Ali",
    assetType: "pump",
    currentMode: "normal",
    availableModes: [
      {
        mode: "normal",
        powerKw: 90.0,
        efficiency: 90,
        description: "Full flow rate for transformer cooling",
        riskLevel: "Low"
      },
      {
        mode: "idle",
        powerKw: 55.0,
        efficiency: 85,
        description: "Reduced flow for demand response",
        riskLevel: "Low",
        minRunTimeHours: 1,
        maxRunTimeHours: 2
      },
      {
        mode: "high",
        powerKw: 25.0,
        efficiency: 70,
        description: "Standby mode - minimum circulation",
        riskLevel: "Medium",
        maxRunTimeHours: 4
      }
    ],
    recommendations: [
      {
        id: "rec-pump-ja-01",
        recommendedMode: "normal",
        rationale: "Transformer load increasing. Maintain full cooling flow to ensure optimal transformer performance.",
        expectedSavings: 0,
        riskNotes: "Current mode is optimal for operating conditions.",
        priority: "Low",
        implementationTime: "No change needed"
      }
    ],
    lastModeChange: "2025-01-20T11:45:00Z",
    operatingHours: 14560,
    nextMaintenanceHours: 440
  }
];

// =============================================================================
// Efficiency Curve Data
// =============================================================================

export interface EfficiencyCurvePoint {
  flowRate: number; // % of design flow rate
  efficiency: number; // % efficiency
  powerKw: number; // Power consumption at this point
}

export interface EfficiencyCurve {
  id: string;
  assetId: string;
  assetName: string;
  assetType: "ESP" | "compressor" | "pump";
  designFlowRate: number; // Design flow rate (units depend on asset type)
  designFlowUnit: string; // "BBL/day", "MSCF/day", "GPM"
  bestEfficiencyPoint: {
    flowRatePct: number; // % of design flow
    efficiency: number; // % efficiency
    powerKw: number;
  };
  currentOperatingPoint: {
    flowRatePct: number; // % of design flow
    efficiency: number; // % efficiency
    powerKw: number;
    timestamp: string;
  };
  curvePoints: EfficiencyCurvePoint[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    targetFlowRatePct: number;
    expectedEfficiencyGain: number;
    estimatedSavings: number;
    implementationNotes: string;
  }>;
}

export const upstreamEfficiencyCurves: EfficiencyCurve[] = [
  {
    id: "ec-esp-07",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    assetType: "ESP",
    designFlowRate: 1200,
    designFlowUnit: "BBL/day",
    bestEfficiencyPoint: {
      flowRatePct: 85,
      efficiency: 87,
      powerKw: 42.5
    },
    currentOperatingPoint: {
      flowRatePct: 72,
      efficiency: 82,
      powerKw: 45.2,
      timestamp: "2024-12-16T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 20, efficiency: 45, powerKw: 25.0 },
      { flowRate: 30, efficiency: 58, powerKw: 28.5 },
      { flowRate: 40, efficiency: 68, powerKw: 32.0 },
      { flowRate: 50, efficiency: 75, powerKw: 35.8 },
      { flowRate: 60, efficiency: 80, powerKw: 39.2 },
      { flowRate: 70, efficiency: 83, powerKw: 42.1 },
      { flowRate: 80, efficiency: 86, powerKw: 44.8 },
      { flowRate: 85, efficiency: 87, powerKw: 42.5 }, // BEP
      { flowRate: 90, efficiency: 86, powerKw: 46.2 },
      { flowRate: 100, efficiency: 84, powerKw: 50.5 },
      { flowRate: 110, efficiency: 80, powerKw: 56.8 },
      { flowRate: 120, efficiency: 75, powerKw: 64.2 }
    ],
    recommendations: [
      {
        id: "rec-esp-bep-01",
        title: "Operate Closer to Best Efficiency Point",
        description: "Current operation at 72% flow rate results in 82% efficiency. Moving to 85% flow rate (BEP) would improve efficiency to 87% and reduce power consumption.",
        targetFlowRatePct: 85,
        expectedEfficiencyGain: 5,
        estimatedSavings: 125,
        implementationNotes: "Adjust choke position gradually. Monitor intake pressure and motor temperature during transition."
      }
    ]
  },
  {
    id: "ec-gc-11",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    assetType: "compressor",
    designFlowRate: 2500,
    designFlowUnit: "MSCF/day",
    bestEfficiencyPoint: {
      flowRatePct: 78,
      efficiency: 89,
      powerKw: 118.5
    },
    currentOperatingPoint: {
      flowRatePct: 65,
      efficiency: 84,
      powerKw: 125.3,
      timestamp: "2024-12-16T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 30, efficiency: 62, powerKw: 85.0 },
      { flowRate: 40, efficiency: 70, powerKw: 92.5 },
      { flowRate: 50, efficiency: 76, powerKw: 98.2 },
      { flowRate: 60, efficiency: 82, powerKw: 108.5 },
      { flowRate: 70, efficiency: 86, powerKw: 115.8 },
      { flowRate: 78, efficiency: 89, powerKw: 118.5 }, // BEP
      { flowRate: 80, efficiency: 88, powerKw: 122.1 },
      { flowRate: 90, efficiency: 85, powerKw: 135.2 },
      { flowRate: 100, efficiency: 81, powerKw: 152.8 },
      { flowRate: 110, efficiency: 76, powerKw: 175.5 },
      { flowRate: 120, efficiency: 70, powerKw: 205.2 }
    ],
    recommendations: [
      {
        id: "rec-gc-bep-01",
        title: "Optimize Gas Flow Rate for Peak Efficiency",
        description: "Current operation at 65% flow rate shows 84% efficiency. Increasing to 78% flow rate (BEP) would achieve 89% efficiency with lower specific power consumption.",
        targetFlowRatePct: 78,
        expectedEfficiencyGain: 5,
        estimatedSavings: 285,
        implementationNotes: "Coordinate with upstream production to increase gas flow. Monitor compression ratio and discharge temperature."
      },
      {
        id: "rec-gc-bep-02",
        title: "Consider Load Balancing with Parallel Units",
        description: "Operating multiple compressors closer to their BEP rather than one unit at low efficiency can improve overall system performance.",
        targetFlowRatePct: 78,
        expectedEfficiencyGain: 8,
        estimatedSavings: 450,
        implementationNotes: "Requires coordination with operations team. Evaluate startup costs vs efficiency gains."
      }
    ]
  },
  {
    id: "ec-p-21",
    assetId: "P-21",
    assetName: "Transfer Pump P-21",
    assetType: "pump",
    designFlowRate: 800,
    designFlowUnit: "GPM",
    bestEfficiencyPoint: {
      flowRatePct: 82,
      efficiency: 79,
      powerKw: 22.8
    },
    currentOperatingPoint: {
      flowRatePct: 88,
      efficiency: 76,
      powerKw: 25.0,
      timestamp: "2024-12-16T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 40, efficiency: 52, powerKw: 15.5 },
      { flowRate: 50, efficiency: 61, powerKw: 17.2 },
      { flowRate: 60, efficiency: 68, powerKw: 18.8 },
      { flowRate: 70, efficiency: 74, powerKw: 20.5 },
      { flowRate: 80, efficiency: 78, powerKw: 22.2 },
      { flowRate: 82, efficiency: 79, powerKw: 22.8 }, // BEP
      { flowRate: 90, efficiency: 77, powerKw: 24.8 },
      { flowRate: 100, efficiency: 74, powerKw: 27.5 },
      { flowRate: 110, efficiency: 69, powerKw: 31.2 },
      { flowRate: 120, efficiency: 63, powerKw: 36.8 }
    ],
    recommendations: [
      {
        id: "rec-p-bep-01",
        title: "Reduce Flow Rate to Improve Efficiency",
        description: "Current operation at 88% flow rate results in 76% efficiency. Reducing to 82% flow rate (BEP) would improve efficiency to 79% and reduce power consumption.",
        targetFlowRatePct: 82,
        expectedEfficiencyGain: 3,
        estimatedSavings: 65,
        implementationNotes: "Adjust discharge valve position. Verify downstream process can handle reduced flow rate."
      }
    ]
  }
];

// Transmission Efficiency Curves
export const transmissionEfficiencyCurves: EfficiencyCurve[] = [
  {
    id: "ec-tx-t1-dxb",
    assetId: "TX-T1-DXB",
    assetName: "Transformer T1 - Dubai Main",
    assetType: "transformer" as any,
    designFlowRate: 50, // MVA rating
    designFlowUnit: "MVA",
    bestEfficiencyPoint: {
      flowRatePct: 75,
      efficiency: 98.8,
      powerKw: 45.0 // Losses at BEP
    },
    currentOperatingPoint: {
      flowRatePct: 55,
      efficiency: 98.2,
      powerKw: 67.5, // Current losses
      timestamp: "2025-01-22T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 10, efficiency: 96.5, powerKw: 125.0 },
      { flowRate: 20, efficiency: 97.5, powerKw: 100.0 },
      { flowRate: 30, efficiency: 98.0, powerKw: 82.5 },
      { flowRate: 40, efficiency: 98.3, powerKw: 72.0 },
      { flowRate: 50, efficiency: 98.5, powerKw: 62.5 },
      { flowRate: 60, efficiency: 98.6, powerKw: 55.0 },
      { flowRate: 70, efficiency: 98.7, powerKw: 48.5 },
      { flowRate: 75, efficiency: 98.8, powerKw: 45.0 }, // BEP
      { flowRate: 80, efficiency: 98.7, powerKw: 48.0 },
      { flowRate: 90, efficiency: 98.5, powerKw: 56.5 },
      { flowRate: 100, efficiency: 98.2, powerKw: 72.0 },
      { flowRate: 110, efficiency: 97.8, powerKw: 95.0 }
    ],
    recommendations: [
      {
        id: "rec-tx-t1-load",
        title: "Optimize Transformer Loading",
        description: "Current operation at 55% load results in 98.2% efficiency with 67.5 kW losses. Increasing load to 75% (BEP) would improve efficiency to 98.8% and reduce losses to 45 kW.",
        targetFlowRatePct: 75,
        expectedEfficiencyGain: 0.6,
        estimatedSavings: 1850,
        implementationNotes: "Consider load balancing with parallel transformers. Coordinate with feeder operations to redistribute load."
      }
    ]
  },
  {
    id: "ec-tx-t2-ja",
    assetId: "TX-T2-JA",
    assetName: "Transformer T2 - Jebel Ali",
    assetType: "transformer" as any,
    designFlowRate: 100, // MVA rating
    designFlowUnit: "MVA",
    bestEfficiencyPoint: {
      flowRatePct: 70,
      efficiency: 99.0,
      powerKw: 75.0
    },
    currentOperatingPoint: {
      flowRatePct: 82,
      efficiency: 98.8,
      powerKw: 95.0,
      timestamp: "2025-01-22T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 10, efficiency: 97.0, powerKw: 250.0 },
      { flowRate: 20, efficiency: 98.0, powerKw: 200.0 },
      { flowRate: 30, efficiency: 98.5, powerKw: 165.0 },
      { flowRate: 40, efficiency: 98.7, powerKw: 140.0 },
      { flowRate: 50, efficiency: 98.8, powerKw: 120.0 },
      { flowRate: 60, efficiency: 98.9, powerKw: 95.0 },
      { flowRate: 70, efficiency: 99.0, powerKw: 75.0 }, // BEP
      { flowRate: 80, efficiency: 98.9, powerKw: 85.0 },
      { flowRate: 90, efficiency: 98.7, powerKw: 110.0 },
      { flowRate: 100, efficiency: 98.4, powerKw: 145.0 },
      { flowRate: 110, efficiency: 98.0, powerKw: 195.0 }
    ],
    recommendations: [
      {
        id: "rec-tx-t2-reduce",
        title: "Reduce Transformer Loading to BEP",
        description: "Current operation at 82% load results in 98.8% efficiency with 95 kW losses. Reducing load to 70% (BEP) would improve efficiency to 99.0% and reduce losses to 75 kW.",
        targetFlowRatePct: 70,
        expectedEfficiencyGain: 0.2,
        estimatedSavings: 1250,
        implementationNotes: "Transfer some load to parallel transformer T3. Monitor voltage levels during load transfer."
      }
    ]
  },
  {
    id: "ec-tx-t3-aw",
    assetId: "TX-T3-AW",
    assetName: "Transformer T3 - Al Aweer",
    assetType: "transformer" as any,
    designFlowRate: 75, // MVA rating
    designFlowUnit: "MVA",
    bestEfficiencyPoint: {
      flowRatePct: 72,
      efficiency: 98.9,
      powerKw: 55.0
    },
    currentOperatingPoint: {
      flowRatePct: 72,
      efficiency: 98.9,
      powerKw: 55.0,
      timestamp: "2025-01-22T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 10, efficiency: 96.8, powerKw: 187.5 },
      { flowRate: 20, efficiency: 97.8, powerKw: 150.0 },
      { flowRate: 30, efficiency: 98.3, powerKw: 123.8 },
      { flowRate: 40, efficiency: 98.5, powerKw: 108.0 },
      { flowRate: 50, efficiency: 98.7, powerKw: 93.8 },
      { flowRate: 60, efficiency: 98.8, powerKw: 82.5 },
      { flowRate: 70, efficiency: 98.9, powerKw: 72.8 },
      { flowRate: 72, efficiency: 98.9, powerKw: 55.0 }, // BEP - currently at BEP
      { flowRate: 80, efficiency: 98.8, powerKw: 72.0 },
      { flowRate: 90, efficiency: 98.6, powerKw: 84.8 },
      { flowRate: 100, efficiency: 98.3, powerKw: 108.8 },
      { flowRate: 110, efficiency: 97.9, powerKw: 146.3 }
    ],
    recommendations: []
  },
  {
    id: "ec-tx-t4-south",
    assetId: "TX-T4-SOUTH",
    assetName: "Transformer T4 - Dubai South",
    assetType: "transformer" as any,
    designFlowRate: 60, // MVA rating
    designFlowUnit: "MVA",
    bestEfficiencyPoint: {
      flowRatePct: 68,
      efficiency: 98.7,
      powerKw: 42.0
    },
    currentOperatingPoint: {
      flowRatePct: 45,
      efficiency: 98.1,
      powerKw: 68.5,
      timestamp: "2025-01-22T14:30:00Z"
    },
    curvePoints: [
      { flowRate: 10, efficiency: 96.2, powerKw: 150.0 },
      { flowRate: 20, efficiency: 97.3, powerKw: 120.0 },
      { flowRate: 30, efficiency: 97.9, powerKw: 99.0 },
      { flowRate: 40, efficiency: 98.2, powerKw: 86.4 },
      { flowRate: 50, efficiency: 98.4, powerKw: 75.0 },
      { flowRate: 60, efficiency: 98.6, powerKw: 66.0 },
      { flowRate: 68, efficiency: 98.7, powerKw: 42.0 }, // BEP
      { flowRate: 70, efficiency: 98.7, powerKw: 58.2 },
      { flowRate: 80, efficiency: 98.5, powerKw: 67.2 },
      { flowRate: 90, efficiency: 98.3, powerKw: 81.0 },
      { flowRate: 100, efficiency: 98.0, powerKw: 102.0 },
      { flowRate: 110, efficiency: 97.5, powerKw: 135.0 }
    ],
    recommendations: [
      {
        id: "rec-tx-t4-increase",
        title: "Increase Transformer Loading for Better Efficiency",
        description: "Current operation at 45% load results in 98.1% efficiency with 68.5 kW losses. Increasing load to 68% (BEP) would improve efficiency to 98.7% and reduce losses to 42 kW.",
        targetFlowRatePct: 68,
        expectedEfficiencyGain: 0.6,
        estimatedSavings: 2100,
        implementationNotes: "Transfer load from other transformers. Consider consolidating feeders to optimize transformer utilization."
      },
      {
        id: "rec-tx-t4-consolidate",
        title: "Consolidate Loads to Reduce Number of Operating Transformers",
        description: "Operating fewer transformers at higher loading can improve overall system efficiency. Consider transferring loads to other transformers and taking this unit offline during low-demand periods.",
        targetFlowRatePct: 0,
        expectedEfficiencyGain: 1.2,
        estimatedSavings: 3500,
        implementationNotes: "Requires detailed load analysis and coordination with grid operations. Ensure redundancy requirements are met."
      }
    ]
  }
];

// Note: AuditLog, Simulation, and Approval interfaces are defined above

// Event History for Alert History Timeline
export const eventHistory: import("@/types/navigation").EventHistoryItem[] = [
  {
    id: "evt-001",
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    title: "High Pressure Alert",
    description: "Wellhead pressure exceeded safe operating threshold of 3000 psi",
    category: "Alert",
    severity: "Critical",
    status: "Resolved",
    timestamp: "2024-01-20T14:23:00Z",
    duration: 45,
    rootCause: "Downstream valve partially closed causing pressure buildup",
    resolution: "Valve position corrected, pressure returned to normal range",
    assignedTo: "Operations Team A"
  },
  {
    id: "evt-002",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    title: "Motor Overheating",
    description: "ESP motor temperature reached 195°F, approaching critical limit",
    category: "Fault",
    severity: "Warning",
    status: "Investigating",
    timestamp: "2024-01-20T16:45:00Z",
    assignedTo: "Maintenance Team B"
  },
  {
    id: "evt-003",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    title: "Scheduled Maintenance",
    description: "Routine maintenance window for compressor inspection and lubrication",
    category: "Maintenance",
    severity: "Information",
    status: "Resolved",
    timestamp: "2024-01-19T08:00:00Z",
    duration: 240,
    resolution: "Maintenance completed successfully, all systems operational"
  },
  {
    id: "evt-004",
    assetId: "SEP-03",
    assetName: "Separator SEP-03",
    title: "Level Sensor Malfunction",
    description: "Liquid level sensor providing erratic readings",
    category: "Fault",
    severity: "Warning",
    status: "Resolved",
    timestamp: "2024-01-18T11:30:00Z",
    duration: 120,
    rootCause: "Sensor calibration drift due to temperature variations",
    resolution: "Sensor recalibrated and tested, readings stable",
    assignedTo: "Instrumentation Team"
  },
  {
    id: "evt-005",
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    title: "Production Optimization",
    description: "Choke position adjusted to optimize production rate",
    category: "Operational",
    severity: "Information",
    status: "Resolved",
    timestamp: "2024-01-17T09:15:00Z",
    duration: 15,
    resolution: "Production rate increased by 8% while maintaining safe pressure"
  },
  {
    id: "evt-006",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    title: "Vibration Spike",
    description: "Abnormal vibration detected on ESP motor",
    category: "Alert",
    severity: "Warning",
    status: "Resolved",
    timestamp: "2024-01-16T13:20:00Z",
    duration: 30,
    correlatedEvents: ["evt-002"],
    rootCause: "Temporary imbalance due to gas slugging",
    resolution: "Vibration returned to normal after gas slug passed through system",
    assignedTo: "Operations Team A"
  },
  {
    id: "evt-007",
    assetId: "GC-11",
    assetName: "Gas Compressor GC-11",
    title: "Unplanned Shutdown",
    description: "Compressor tripped due to high discharge pressure",
    category: "Downtime",
    severity: "Critical",
    status: "Resolved",
    timestamp: "2024-01-15T22:45:00Z",
    duration: 180,
    rootCause: "Downstream pipeline blockage caused pressure buildup",
    resolution: "Pipeline cleared, compressor restarted and operating normally",
    assignedTo: "Emergency Response Team"
  },
  {
    id: "evt-008",
    assetId: "SEP-03",
    assetName: "Separator SEP-03",
    title: "High Liquid Level",
    description: "Separator liquid level approaching high-high alarm setpoint",
    category: "Alert",
    severity: "Warning",
    status: "Resolved",
    timestamp: "2024-01-14T16:00:00Z",
    duration: 60,
    rootCause: "Increased water cut from wellhead production",
    resolution: "Dump valve cycle frequency increased, level stabilized",
    assignedTo: "Operations Team B"
  },
  {
    id: "evt-009",
    assetId: "WH-01",
    assetName: "Wellhead WH-01",
    title: "Flow Rate Deviation",
    description: "Production flow rate 15% below expected baseline",
    category: "Operational",
    severity: "Information",
    status: "Investigating",
    timestamp: "2024-01-13T10:30:00Z",
    assignedTo: "Production Engineering"
  },
  {
    id: "evt-010",
    assetId: "ESP-07",
    assetName: "ESP Pump ESP-07",
    title: "Power Consumption Increase",
    description: "ESP motor drawing 12% more power than baseline",
    category: "Alert",
    severity: "Warning",
    status: "Active",
    timestamp: "2024-01-12T14:15:00Z",
    correlatedEvents: ["evt-002", "evt-006"],
    assignedTo: "Maintenance Team B"
  }
];

// =============================================================================
// Transmission Efficiency Scope Mock Data
// =============================================================================

export interface MockTransmissionEfficiencyScope {
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
}

export const mockTransmissionEfficiencyScopes: MockTransmissionEfficiencyScope[] = [
  {
    id: "org-total",
    name: "Total Organization",
    category: "organization",
    kWhPerMWhDelivered: 1025.5,
    lossesPct: 2.8,
    loadFactor: 0.72,
    avgPowerFactor: 0.95,
    utilizationPct: 68.5,
    benchmark: {
      kWhPerMWhDelivered: 1035.0,
      lossesPct: 3.5,
      loadFactor: 0.68,
      avgPowerFactor: 0.92,
      utilizationPct: 65.0,
    },
    target: {
      kWhPerMWhDelivered: 1015.0,
      lossesPct: 2.2,
      loadFactor: 0.78,
      avgPowerFactor: 0.98,
      utilizationPct: 75.0,
    },
    trend: "down", // Improving (losses decreasing)
    status: "Normal"
  },
  {
    id: "sub-main-132kv",
    name: "Main 132kV Substation",
    category: "substation",
    kWhPerMWhDelivered: 1018.2,
    lossesPct: 1.8,
    loadFactor: 0.75,
    avgPowerFactor: 0.96,
    utilizationPct: 72.3,
    benchmark: {
      kWhPerMWhDelivered: 1025.0,
      lossesPct: 2.5,
      loadFactor: 0.70,
      avgPowerFactor: 0.93,
      utilizationPct: 68.0,
    },
    target: {
      kWhPerMWhDelivered: 1012.0,
      lossesPct: 1.2,
      loadFactor: 0.80,
      avgPowerFactor: 0.98,
      utilizationPct: 78.0,
    },
    trend: "down", // Improving
    status: "Normal"
  },
  {
    id: "sub-north-220kv",
    name: "North 220kV Substation",
    category: "substation",
    kWhPerMWhDelivered: 1032.8,
    lossesPct: 3.3,
    loadFactor: 0.68,
    avgPowerFactor: 0.94,
    utilizationPct: 64.2,
    benchmark: {
      kWhPerMWhDelivered: 1030.0,
      lossesPct: 3.0,
      loadFactor: 0.65,
      avgPowerFactor: 0.91,
      utilizationPct: 62.0,
    },
    target: {
      kWhPerMWhDelivered: 1020.0,
      lossesPct: 2.0,
      loadFactor: 0.75,
      avgPowerFactor: 0.97,
      utilizationPct: 72.0,
    },
    trend: "up", // Degrading (losses increasing)
    status: "Warning"
  },
  {
    id: "feed-industrial-01",
    name: "Industrial Feeder 01",
    category: "feeder",
    kWhPerMWhDelivered: 1015.5,
    lossesPct: 1.6,
    loadFactor: 0.82,
    avgPowerFactor: 0.97,
    utilizationPct: 78.5,
    benchmark: {
      kWhPerMWhDelivered: 1020.0,
      lossesPct: 2.0,
      loadFactor: 0.75,
      avgPowerFactor: 0.94,
      utilizationPct: 70.0,
    },
    target: {
      kWhPerMWhDelivered: 1010.0,
      lossesPct: 1.0,
      loadFactor: 0.85,
      avgPowerFactor: 0.99,
      utilizationPct: 82.0,
    },
    trend: "down", // Improving
    status: "Normal"
  },
  {
    id: "feed-residential-02",
    name: "Residential Feeder 02",
    category: "feeder",
    kWhPerMWhDelivered: 1028.3,
    lossesPct: 2.8,
    loadFactor: 0.65,
    avgPowerFactor: 0.92,
    utilizationPct: 58.7,
    benchmark: {
      kWhPerMWhDelivered: 1025.0,
      lossesPct: 2.5,
      loadFactor: 0.62,
      avgPowerFactor: 0.90,
      utilizationPct: 55.0,
    },
    target: {
      kWhPerMWhDelivered: 1018.0,
      lossesPct: 1.8,
      loadFactor: 0.72,
      avgPowerFactor: 0.96,
      utilizationPct: 68.0,
    },
    trend: "neutral", // Stable
    status: "Normal"
  },
  {
    id: "feed-commercial-03",
    name: "Commercial Feeder 03",
    category: "feeder",
    kWhPerMWhDelivered: 1045.2,
    lossesPct: 4.5,
    loadFactor: 0.58,
    avgPowerFactor: 0.88,
    utilizationPct: 52.3,
    benchmark: {
      kWhPerMWhDelivered: 1035.0,
      lossesPct: 3.5,
      loadFactor: 0.60,
      avgPowerFactor: 0.89,
      utilizationPct: 55.0,
    },
    target: {
      kWhPerMWhDelivered: 1025.0,
      lossesPct: 2.5,
      loadFactor: 0.68,
      avgPowerFactor: 0.95,
      utilizationPct: 65.0,
    },
    trend: "up", // Degrading
    status: "Critical"
  },
  {
    id: "tx-main-400-220",
    name: "Main 400/220kV Transformer",
    category: "transformer",
    kWhPerMWhDelivered: 1008.5,
    lossesPct: 0.85,
    loadFactor: 0.88,
    avgPowerFactor: 0.98,
    utilizationPct: 85.2,
    benchmark: {
      kWhPerMWhDelivered: 1012.0,
      lossesPct: 1.2,
      loadFactor: 0.82,
      avgPowerFactor: 0.96,
      utilizationPct: 78.0,
    },
    target: {
      kWhPerMWhDelivered: 1005.0,
      lossesPct: 0.5,
      loadFactor: 0.92,
      avgPowerFactor: 0.99,
      utilizationPct: 90.0,
    },
    trend: "down", // Improving
    status: "Normal"
  }
];
