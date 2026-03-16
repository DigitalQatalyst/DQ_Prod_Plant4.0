// Unified security types supporting all industries

// =============================================================================
// SHARED ENUMS & SUPPORTING TYPES
// =============================================================================

export type ComplianceStandardStatus =
  | 'compliant'
  | 'non-compliant'
  | 'in-progress'
  | 'not-applicable'
  | 'not-assessed';

export type StandardCategory =
  | 'cybersecurity'
  | 'operational'
  | 'safety'
  | 'environmental'
  | 'regulatory';

export type ComplianceRequirementStatus =
  | 'compliant'
  | 'non-compliant'
  | 'in-progress'
  | 'not-applicable';

export type RequirementPriority =
  | 'critical'
  | 'high'
  | 'medium' | 'low';

export type ControlImplementationStatus =
  | 'implemented'
  | 'partial'
  | 'planned'
  | 'not-implemented'
  | 'not-applicable'
  | 'under-review'
  | 'failed';

export type ControlEffectiveness =
  | 'highly-effective'
  | 'effective'
  | 'partially-effective'
  | 'ineffective'
  | 'not-assessed';

export type RemediationStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'deferred'
  | 'cancelled';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SecurityControlType =
  | 'preventive'
  | 'detective'
  | 'corrective'
  | 'deterrent'
  | 'compensating'
  | 'detective-ot'
  | 'preventive-ot'
  | 'corrective-ot';

// Base Tenant interface supporting all industries
export interface Tenant {
  id: string;
  name: string;
  industry: 'utilities' | 'agriculture' | 'manufacturing' | 'oil-gas' | 'testing';

  // Oil & gas specific fields (optional)
  oilGas?: {
    type: 'national-oil-company' | 'upstream-jv' | 'field-operator' | 'utility-company' | 'agricultural-company' | 'manufacturing-company' | 'test-company';
    region: string;
    basin?: string;
  };
}

// Legacy upstream tenant interface (deprecated - use Tenant instead)
export interface UpstreamTenant {
  id: string;
  name: string;
  type: 'national-oil-company' | 'upstream-jv' | 'field-operator';
  region: string;
  basin?: string;
}

// Unified site interface supporting all industries
export interface Site {
  id: string;
  tenantId: string;
  name: string;

  // General site properties
  location?: string;

  // Oil & gas specific properties
  oilGas?: {
    type: 'well-pad' | 'offshore-platform' | 'cpf' | 'gpf' | 'gathering-station' | 'pipeline-station';
    region: string;
    basin?: string;
    field?: string;
    coordinates?: { lat: number; lng: number };
    securityPosture: 'secure' | 'at-risk' | 'critical';
    zoneCompliance: number; // 0-100
    activeRemoteSessions: number;
    criticalAssetCount: number;
  };
}

// Legacy upstream site interface (deprecated - use Site instead)
export interface UpstreamSite {
  id: string;
  tenantId: string;
  name: string;
  type: 'well-pad' | 'offshore-platform' | 'cpf' | 'gpf' | 'gathering-station' | 'pipeline-station';
  region: string;
  basin?: string;
  field?: string;
  coordinates?: { lat: number; lng: number };
  securityPosture: 'secure' | 'at-risk' | 'critical';
  zoneCompliance: number; // 0-100
  activeRemoteSessions: number;
  criticalAssetCount: number;
}

// Security Zone & Conduit Models
export interface SecurityZone {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  type?: 'field' | 'control' | 'sis' | 'dmz' | 'corporate';
  zoneType: string;
  level?: number;
  securityLevel: number;
  assetCount: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  iec62443Compliant: boolean;
  policies: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Conduit {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  sourceZoneId: string;
  targetZoneId: string;
  protocol: string;
  encrypted: boolean;
  policyCompliant: boolean;
  dataFlowDirection: 'unidirectional' | 'bidirectional';
  status?: 'active' | 'inactive' | 'pending';
}

// Unified asset interface supporting all industries
export interface Asset {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  status: 'online' | 'offline' | 'maintenance' | 'pending';
  criticality: 'critical' | 'high' | 'medium' | 'low';

  // General properties
  site?: string;
  area?: string;
  lastSeen?: string;

  // Security properties
  security?: {
    securityStatus: 'secure' | 'at-risk' | 'vulnerable' | 'unknown';
    vulnerabilityCount: number;
    openAlerts: number;
    lastSecurityScan: string;
    riskScore: number;
    networkExposure: 'internal' | 'dmz' | 'external';
    patchStatus: 'up-to-date' | 'pending' | 'overdue';
  };

  // Oil & gas specific properties
  oilGas?: {
    zoneId: string;
    firmwareVersion: string;
    type: 'wellhead-plc' | 'rtu' | 'sis' | 'dcs' | 'scada-master' | 'esd' |
    'compressor' | 'pump' | 'separator' | 'heater' | 'flare-system' |
    'pipeline-valve' | 'xmas-tree' | 'field-gateway' | 'edge-device';
    criticality: 'safety-critical' | 'production-critical' | 'high' | 'medium' | 'low';
    inSafetyLoop: boolean;
    highPressure: boolean;
  };
}

// Legacy upstream OT asset interface (deprecated - use Asset instead)
export interface UpstreamOtAsset {
  id: string;
  tenantId: string;
  siteId: string;
  zoneId: string;
  name: string;
  type: 'wellhead-plc' | 'rtu' | 'sis' | 'dcs' | 'scada-master' | 'esd' |
  'compressor' | 'pump' | 'separator' | 'heater' | 'flare-system' |
  'pipeline-valve' | 'xmas-tree' | 'field-gateway' | 'edge-device';
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  criticality: 'safety-critical' | 'production-critical' | 'high' | 'medium' | 'low';
  securityStatus: 'secure' | 'at-risk' | 'vulnerable' | 'unknown';
  inSafetyLoop: boolean;
  highPressure: boolean;
  vulnerabilityCount: number;
  openAlerts: number;
  lastSecurityScan: string;
  riskScore: number;
  networkExposure: 'internal' | 'dmz' | 'external';
  patchStatus: 'up-to-date' | 'pending' | 'overdue';
}

// OT asset security interface merged into Unified OTAssetSecurity (see Shared sections)

// Remote Access & Session Models
export interface RemoteSession {
  id: string;
  tenantId: string;
  siteId: string;
  userId: string;
  userName: string;
  userType: 'internal' | 'vendor' | 'oem' | 'consultant';
  vendorName?: string;
  sourceIp: string;
  destinationAsset: string;
  destinationAssetId: string;
  destinationZone: string;
  protocol: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'terminated';
  accessLevel: 'read-only' | 'operator' | 'engineer' | 'admin';
  isSafetyCritical: boolean;
  commandsExecuted: number;
  dataTransferred: string;
}

// Unified security alert interface supporting all industries
export interface SecurityAlert {
  id: string;
  tenantId: string;
  siteId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  timestamp: string;
  detectedBy: string;
  assignedTo?: string;

  // General properties
  affectedAsset?: string;
  affectedAssetId?: string;
  category: string; // Flexible category system

  // Oil & gas specific properties
  oilGas?: {
    affectedZone?: string;
    isSafetyCritical: boolean;
    recommendedActions: string[];
    category: 'valve-manipulation' | 'pressure-anomaly' | 'sis-trip' |
    'unauthorized-access' | 'remote-session' | 'config-change' |
    'malware' | 'network-anomaly' | 'authentication-failure';
  };
}

// Legacy upstream security alert interface (deprecated - use SecurityAlert instead)
export interface UpstreamSecurityAlert {
  id: string;
  tenantId: string;
  siteId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  category: 'valve-manipulation' | 'pressure-anomaly' | 'sis-trip' |
  'unauthorized-access' | 'remote-session' | 'config-change' |
  'malware' | 'network-anomaly' | 'authentication-failure';
  affectedAsset?: string;
  affectedAssetId?: string;
  affectedZone?: string;
  isSafetyCritical: boolean;
  timestamp: string;
  detectedBy: string;
  assignedTo?: string;
  recommendedActions: string[];
}

export interface IncidentCase {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  incidentType?: string; // High-level category
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: string; // Specific category (e.g., well-control-tampering, sis-override)
  affectedSites: string[];
  affectedAssets: string[];
  impactedWells?: number;
  impactedPipelines?: string[];
  assignedResponders: string[];
  createdAt: string;
  updatedAt: string;
  containmentActions: string[];
  lessonsLearned?: string;
  requiresRegNotification: boolean;

  // Transmission legacy fields
  oilGas?: {
    incidentType: string;
    impactLevel: string;
    containmentStatus: string;
  };
}

// Anomaly Signal Model
export interface AnomalySignal {
  id: string;
  tenantId: string;
  siteId?: string;
  assetId?: string;
  signalName?: string;
  type?: string;
  anomalyType?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  parameter?: string;
  baselineValue?: number;
  baselineId?: string;
  observedValue?: number;
  expectedValue?: number;
  deviation?: number;
  deviationPercentage?: number;
  statisticalSignificance?: number;
  unit?: string;
  detectedAt: string;
  detectionMethod?: string;
  confidenceScore?: number;
  correlatedEvents?: string[];
  potentialCause?: string;
  isSafetyRelated?: boolean;
  status?: string;
  contextData?: Record<string, unknown>;
  rawData?: Record<string, unknown>;
  contributingFactors?: string[];
}

// Compliance & Policy Models
export interface ComplianceRequirement {
  id: string;
  tenantId: string;
  standardId: string;
  code?: string;
  requirementId: string; // e.g., 'IEC-62443-2-1-4.2.3.1', 'CIP-007-6-R1'
  title?: string;
  requirementName: string;
  description?: string;
  requirementDescription?: string;
  requirementSection?: string;
  status: ComplianceRequirementStatus;
  implementationPercentage: number; // 0-100
  lastChecked?: string;
  lastAssessed?: string;
  priority?: RequirementPriority;
  riskIfNotMet?: RiskLevel;
  implementationApproach?: string;
  responsibleParty?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
  evidence?: string | string[];
  evidenceRequired?: string[];
  evidenceProvided?: string[];
  validationMethod?: string;
  lastValidated?: string;
  validatedBy?: string;
  gapDescription?: string;
  remediationPlan?: string;
  remediationStatus?: RemediationStatus;
  relatedControls?: string[];
  gaps?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Unified role interface
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

// Unified audit log entry interface
export interface AuditLogEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  eventType: string;
  category: 'authentication' | 'authorization' | 'configuration' | 'data-access' | 'system' | 'configuration-change' | 'policy-change' | 'incident-response' | 'system-access';
  user: string;
  userId: string;
  action: string;
  resource: string;
  resourceType: string;
  outcome: 'success' | 'failure' | 'partial';
  ipAddress?: string;
  sessionId?: string;
  sourceIp?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  riskLevel?: 'high' | 'medium' | 'low';
  siteId?: string;
  assetId?: string;
}

// Unified compliance standard interface supporting all industries
export interface ComplianceStandard {
  id: string;
  tenantId: string;
  name: string;
  fullName: string;
  version?: string;
  category: StandardCategory;
  description?: string;
  complianceScore: number;
  status: ComplianceStandardStatus;

  // Requirements tracking
  totalRequirements: number;
  metRequirements: number;
  partialRequirements: number;
  unmetRequirements: number;
  notApplicableRequirements: number;

  // Assessment information
  lastAssessmentDate?: string;
  lastAssessmentBy?: string;
  nextAuditDate?: string;
  auditFrequencyMonths: number;

  // Scope and applicability
  appliesToSites?: string[]; // Array of site UUIDs
  appliesToZones?: string[]; // Array of security zone types
  mandatory: boolean;

  // Documentation
  regulatoryBody?: string;
  standardUrl?: string;
  documentationLinks?: string[];

  // Legacy fields for backward compatibility
  lastAudit?: string;
  nextAudit?: string;
  requirements?: ComplianceRequirement[];

  // General scope (legacy)
  applicableScope?: {
    sites: string[];
    assetTypes: string[];
    departments: string[];
    siteTypes?: string[];
    zones?: string[];
  };

  // Oil & gas specific scope (legacy)
  oilGas?: {
    applicableScope: {
      siteTypes: string[];
      assetTypes: string[];
      zones: string[];
    };
  };

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy upstream compliance standard interface (deprecated - use ComplianceStandard instead)
export interface UpstreamComplianceStandard {
  id: string;
  tenantId: string;
  name: string; // 'API 1164' | 'IEC 62443' | 'NIST CSF' | 'NIST 800-82'
  fullName: string;
  description: string;
  complianceScore: number;
  status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-assessed';
  applicableScope: {
    siteTypes: string[];
    assetTypes: string[];
    zones: string[];
  };
  requirements: ComplianceRequirement[];
  lastAudit?: string;
  nextAudit?: string;
}

export interface SecurityControl {
  id: string;
  tenantId: string;
  controlId: string; // e.g., 'IEC-62443-3-3-SR-1.1', 'CIP-007-6-R1', 'TRANS-AC-001'
  standardId?: string;
  code?: string;
  title?: string;
  controlName?: string;
  description?: string;
  controlDescription?: string;
  controlType?: SecurityControlType;
  category: string; // 'Access Control', 'Network Security', 'Incident Response', etc.
  subcategory?: string;
  domain?: string; // 'Identity', 'Network', 'Endpoint', 'Application', 'Data'
  standardReference?: string;
  iec62443Mapping?: string;
  nercCipMapping?: string;
  nistCsfMapping?: string;
  implementationStatus: ControlImplementationStatus;
  implementationPercentage: number; // 0-100
  implementationApproach?: string;
  implementationDate?: string;
  effectiveness?: ControlEffectiveness;
  effectivenessScore?: number; // 0-100
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  appliesToAssetTypes?: string[];
  appliesToSites?: string[];
  applicableSiteTypes?: string[];
  appliesToZones?: string[];
  applicableZones?: string[];
  appliesToProtocols?: string[];
  upstreamRelevance?: 'critical' | 'high' | 'medium' | 'low';
  criticality?: string;
  responsibleParty?: string;
  responsibleRole?: string;
  backupResponsible?: string;
  evidenceRequired?: string[];
  evidenceProvided?: string[];
  validationMethod?: string;
  validationFrequencyDays?: number;
  lastValidated?: string;
  validatedBy?: string;
  testingRequired?: boolean;
  testingFrequencyDays?: number;
  lastTested?: string;
  nextTestDate?: string;
  testResults?: string;
  dependsOnControls?: string[];
  relatedControls?: string[];
  implementationCostEstimate?: number;
  implementationEffortHours?: number;
  annualMaintenanceCost?: number;
  coveragePercentage?: number;
  status?: string;
  supersededBy?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}



export interface RiskEntry {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  category: 'well-control' | 'pipeline-integrity' | 'sis-bypass' | 'remote-access' |
  'data-breach' | 'malware' | 'insider-threat' | 'supply-chain';
  likelihood: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  impact: 'catastrophic' | 'major' | 'moderate' | 'minor' | 'negligible';
  riskScore: number;
  affectedSiteTypes: string[];
  affectedAssetTypes: string[];
  treatmentStatus: 'treated' | 'in-progress' | 'accepted' | 'transferred';
  treatmentPlan: string;
  riskOwner: string;
  lastReviewDate: string;
}

// Response & Forensics Models
// Response playbook types
export type PlaybookTriggerType =
  | 'manual'
  | 'alert-based'
  | 'incident-based'
  | 'anomaly-based'
  | 'scheduled'
  | 'threshold-based';

export type PlaybookStatus =
  | 'draft'
  | 'active'
  | 'inactive'
  | 'deprecated'
  | 'testing';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type StepType =
  | 'manual-action'
  | 'automated-action'
  | 'notification'
  | 'data-collection'
  | 'analysis'
  | 'decision-point'
  | 'escalation'
  | 'documentation';

// Response playbook interface
export interface ResponsePlaybook {
  id: string;
  tenantId: string;

  // Playbook identification
  name: string;
  description?: string;
  version: string;
  category?: string; // e.g. 'incident-response', 'threat-hunting', 'containment', 'recovery'

  // Trigger configuration
  triggerType: PlaybookTriggerType;
  triggerConditions: Record<string, unknown>;
  autoExecute: boolean;

  // Scope and applicability (optional fields for specialized industries)
  applicableThreatCategories?: string[];
  applicableAssetTypes?: string[];
  applicableProtocols?: string[];
  severityThreshold?: string;

  // Playbook content
  objectives: string[];
  prerequisites: string[];
  estimatedDurationMinutes?: number;
  requiredRoles: string[];
  requiredPermissions: string[];

  // Status and lifecycle
  status: PlaybookStatus;
  isTemplate: boolean;

  // Approval and governance
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;

  // Usage tracking
  executionCount: number;
  successRate?: number;
  lastExecuted?: string;

  // Metadata
  tags: string[];
  customFields: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

export interface PlaybookStep {
  id: string;
  playbookId: string;
  tenantId: string;

  // Step identification
  stepNumber: number;
  name: string;
  description?: string;
  stepType: StepType;

  // Step configuration
  isRequired: boolean;
  isParallel: boolean;
  timeoutMinutes: number;
  retryCount: number;

  // Dependencies
  dependsOnSteps: number[];

  // Action configuration
  actionType?: string; // 'isolate-asset', 'block-ip', 'notify-team', 'collect-logs', etc.
  actionParameters: Record<string, unknown>;
  automationScript?: string;

  // Human interaction
  assignedRole?: string;
  instructions?: string;
  checklistItems: string[];

  // Validation and verification
  successCriteria: string[];
  validationScript?: string;

  // Documentation
  evidenceToCollect: string[];
  documentationTemplate?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlaybookExecution {
  id: string;
  playbookId: string;
  tenantId: string;

  // Execution context
  triggeredBy?: string; // 'manual', 'alert', 'incident', 'anomaly'
  triggerSourceId?: string; // ID of alert, incident, or anomaly that triggered this
  executedBy?: string;

  // Execution details
  executionStatus: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;

  // Progress tracking
  totalSteps?: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;

  // Results
  stepResults: PlaybookStepResult[];
  overallResult?: string;
  notes?: string;

  // Additional context from the specialized versions
  executionNotes?: string;
  lessonsLearned?: string;
  inputParameters?: Record<string, unknown>;
  executionContext?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

export interface StepExecution {
  id: string;
  executionId: string;
  stepId: string;
  tenantId: string;

  // Execution details
  executionStatus: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;

  // Assignment
  assignedTo?: string;

  // Results
  success?: boolean;
  outputData: Record<string, unknown>;
  errorMessage?: string;
  executionLog: string[];

  // Evidence and documentation
  evidenceCollected: string[];
  documentation?: string;

  // Retry tracking
  retryAttempt: number;

  createdAt: string;
  updatedAt: string;
}

export interface PlaybookStepResult {
  stepId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  output?: Record<string, unknown>;
  errorMessage?: string;
}

export interface SoarExecution {
  id: string;
  executedAt: string;
  executedBy: string;
  target: string;
  result: 'success' | 'failure' | 'partial';
  details: string;
}

export interface SoarAction {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'disable-account' | 'close-session' | 'isolate-system' | 'block-ip' |
  'quarantine-device' | 'revoke-access' | 'trigger-backup';
  targetType: 'user' | 'session' | 'asset' | 'network';
  requiresApproval: boolean;
  approvalLevel: 'operator' | 'supervisor' | 'manager';
  affectsSafetyCritical: boolean;
  executionHistory: SoarExecution[];
}

// Transmission-specific SOAR action types
export type TransmissionSoarActionType =
  | 'isolate-substation'
  | 'disconnect-line'
  | 'block-scada-access'
  | 'disable-relay'
  | 'emergency-shutdown'
  | 'backup-configuration'
  | 'reset-communication';

export type TransmissionSoarTargetType =
  | 'substation'
  | 'transmission-line'
  | 'protection-relay'
  | 'scada-system'
  | 'communication-link';

export interface TransmissionSoarAction {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: TransmissionSoarActionType;
  targetType: TransmissionSoarTargetType;
  requiresApproval: boolean;
  approvalLevel: 'operator' | 'supervisor' | 'manager';
  isCritical: boolean;
  estimatedDuration: number; // minutes
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoarActionExecution {
  id: string;
  tenantId: string;
  actionId: string;
  executedAt: string;
  executedBy: string;
  target: string;
  targetId?: string;
  result: 'success' | 'failure' | 'partial';
  details: string;
  approvedBy?: string;
  approvedAt?: string;
  duration?: number; // minutes
  createdAt: string;
}

export interface ForensicSnapshot {
  id: string;
  tenantId: string;
  incidentId?: string;
  triggerEvent: string;
  triggerType: 'sis-override' | 'pipeline-anomaly' | 'well-control-event' |
  'security-incident' | 'manual-capture';
  capturedAt: string;
  scope: string[];
  systemState: Record<string, unknown>;
  configurations: Record<string, unknown>;
  logSegments: string[];
  capturedBy: string;
  retentionUntil: string;
  isRegulatory: boolean;
}

// Gateway & Integration Models
export interface FieldGateway {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  type: 'scada-gateway' | 'rtu-concentrator' | 'protocol-converter' | 'edge-gateway';
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  latestFirmware: string;
  patchStatus: 'up-to-date' | 'pending' | 'overdue';
  hardeningScore: number;
  connectedDevices: number;
  protocols: string[];
  lastSeen: string;
  securityStatus: 'secure' | 'at-risk' | 'vulnerable';
  vulnerabilities: number;
  certificateExpiry?: string;
}

export interface ApiKeyServicePrincipal {
  id: string;
  tenantId: string;
  name: string;
  type: 'api-key' | 'service-principal';
  scope: string[];
  associatedSystem: string;
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
  usageCount: number;
  status: 'active' | 'expired' | 'revoked';
  permissions: string[];
}

// Secrets & Certificates Models
export interface SecretCertificate {
  id: string;
  tenantId: string;
  name: string;
  type: 'certificate' | 'private-key' | 'api-secret' | 'database-password' | 'encryption-key' | 'signing-key';
  description: string;
  associatedSystems: string[];
  associatedSystemNames: string[];
  createdAt: string;
  expiresAt?: string;
  lastRotated?: string;
  nextRotation?: string;
  rotationFrequency?: number; // days
  status: 'active' | 'expired' | 'expiring-soon' | 'revoked';
  algorithm?: string;
  keySize?: number;
  issuer?: string;
  subject?: string;
  usageCount?: number;
  lastUsed?: string;
  rotationHistory: SecretRotationEntry[];
  dependentSystems: string[];
  securityLevel: 'high' | 'medium' | 'low';
  isDeprecatedAlgorithm: boolean;
  daysUntilExpiry?: number;
}

export interface SecretRotationEntry {
  id: string;
  rotatedAt: string;
  rotatedBy: string;
  reason: 'scheduled' | 'compromise' | 'manual' | 'policy-change';
  previousVersion?: string;
  newVersion: string;
  status: 'success' | 'failed' | 'partial';
  notes?: string;
}

// Transmission-specific Secrets & Certificates Interfaces (aligned with database schema)
// Note: Type definitions (SecretType, CertificateType, SecretStatus, TransmissionRole) are defined later in this file

export interface SecretsCertificate {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  secretType: SecretType;
  certificateType?: CertificateType;
  encryptionKeyId: string;
  subjectDn?: string;
  issuerDn?: string;
  serialNumber?: string;
  fingerprintSha256?: string;
  status: SecretStatus;
  createdDate?: string;
  validFrom?: string;
  validUntil?: string;
  lastRotated?: string;
  rotationIntervalDays: number;
  usageCount: number;
  lastUsed?: string;
  usedBySystems: string[];
  protocol?: string;
  assetIds: string[];
  zoneIds: string[];
  accessRoles: TransmissionRole[];
  requiresApproval: boolean;
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateRotationHistory {
  id: string;
  tenantId: string;
  certificateId: string;
  rotationType: string;
  oldFingerprint?: string;
  newFingerprint?: string;
  rotationReason?: string;
  rotationRequestedAt: string;
  rotationCompletedAt?: string;
  requestedBy?: string;
  completedBy?: string;
  status: string;
  errorMessage?: string;
  affectedSystems: string[];
  rollbackPlan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  keyHash: string;
  keyPrefix: string;
  ownerUserId?: string;
  permissions: string[];
  allowedIps: string[];
  rateLimitPerHour: number;
  status: SecretStatus;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  allowedProtocols: string[];
  allowedAssetTypes: string[];
  allowedZones: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServicePrincipal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  principalType: string;
  clientId: string;
  clientSecretHash?: string;
  certificateId?: string;
  roles: TransmissionRole[];
  permissions: string[];
  scopes: string[];
  allowedSourceIps: string[];
  allowedProtocols: string[];
  status: SecretStatus;
  expiresAt?: string;
  lastAuthenticated?: string;
  authenticationCount: number;
  associatedSystems: string[];
  zoneAccess: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Unified user interface supporting all industries
export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'locked' | 'suspended';
  lastLogin?: string;
  createdAt: string;

  // General properties
  role?: string;
  roles?: string[];
  sites?: string[];
  department?: string;

  // Oil & gas specific properties
  oilGas?: {
    role: 'field-operator' | 'control-room-operator' | 'ot-engineer' | 'platform-supervisor' |
    'vendor-support' | 'soc-analyst' | 'security-manager' | 'compliance-officer';
    siteAccess: string[];
    zoneAccess: string[];
    mfaEnabled: boolean;
    privilegedAccess: boolean;
  };
}

// Legacy security user interface (deprecated - use transmission SecurityUser instead)
export interface LegacySecurityUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'field-operator' | 'control-room-operator' | 'ot-engineer' | 'platform-supervisor' |
  'vendor-support' | 'soc-analyst' | 'security-manager' | 'compliance-officer';
  status: 'active' | 'inactive' | 'suspended';
  siteAccess: string[];
  zoneAccess: string[];
  lastLogin?: string;
  mfaEnabled: boolean;
  privilegedAccess: boolean;
}

// Legacy access policy interface (deprecated - use transmission AccessPolicy instead)
export interface LegacyAccessPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  scope: {
    sites: string[];
    zones: string[];
    assetTypes: string[];
  };
  timeRestrictions?: {
    allowedHours: string;
    timezone: string;
  };
  approvalRequired: boolean;
  assignedUsers: string[];
  assignedRoles: string[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface SecurityPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  version: string;
  type: 'remote-access' | 'sis-change' | 'vendor-access' | 'data-protection' |
  'network-security' | 'incident-response' | 'change-management' | 'backup-recovery';
  status: 'active' | 'draft' | 'under-review' | 'approved' | 'retired';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  effectiveDate: string;
  expirationDate?: string;
  lastReviewDate?: string;
  nextReviewDate: string;
  approvedBy?: string;
  approvalDate?: string;
  applicableScope: {
    siteTypes: string[];
    zones: string[];
    assetTypes: string[];
  };
  content: string;
  approvalHistory: PolicyApproval[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDueForReview: boolean;
  hasPendingApproval: boolean;
}

export interface DataProtectionStatus {
  tenantId: string;
  category: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    label: string;
    value: string | number;
    status: 'good' | 'warning' | 'error';
  }[];
  policies: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    scope: string[];
    compliance: string[];
  }[];
  violations: number;
  lastChecked: string;
}

export interface PolicyApproval {
  id: string;
  version: string;
  approver: string;
  approverRole: string;
  approvalDate: string;
  status: 'approved' | 'rejected';
  comments?: string;
}

// Audit & Logging Models
export interface SecurityAuditEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  eventType: 'authentication' | 'authorization' | 'configuration-change' |
  'data-access' | 'system-access' | 'policy-change' | 'incident-response';
  userId?: string;
  userName?: string;
  sourceIp?: string;
  resource: string;
  action: string;
  outcome: 'success' | 'failure' | 'partial';
  details: string;
  riskLevel: 'high' | 'medium' | 'low';
  siteId?: string;
  assetId?: string;
}

// Audit Readiness Models
export interface AuditReadiness {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'regulatory' | 'certification' | 'internal' | 'third-party';
  standard: string; // API 1164, IEC 62443, NIST CSF, etc.
  scope: {
    siteTypes: string[];
    assetTypes: string[];
    zones: string[];
    departments: string[];
  };
  scheduledDate: string;
  preparationStatus: 'not-started' | 'in-progress' | 'ready' | 'overdue';
  overallReadiness: number; // 0-100 percentage
  requirements: AuditRequirement[];
  criticalGaps: string[];
  assignedCoordinator: string;
  createdAt: string;
  updatedAt: string;
  lastAssessment?: string;
  daysUntilAudit: number;
}

export interface AuditRequirement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'documentation' | 'technical-control' | 'process' | 'training' | 'evidence';
  status: 'complete' | 'in-progress' | 'not-started' | 'gap-identified';
  evidenceStatus: 'available' | 'partial' | 'missing' | 'under-review';
  evidenceItems: AuditEvidence[];
  gaps: string[];
  assignedTo?: string;
  dueDate?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  upstreamRelevance: 'safety-critical' | 'production-critical' | 'compliance' | 'operational';
  lastUpdated: string;
}

export interface AuditEvidence {
  id: string;
  type: 'document' | 'screenshot' | 'log-export' | 'configuration' | 'certificate' | 'report';
  name: string;
  description: string;
  location: string;
  status: 'available' | 'missing' | 'outdated' | 'under-review';
  lastUpdated: string;
  size?: string;
  format?: string;
}

// Threat Intelligence Models
export interface ThreatIntelligence {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  source: string;
  sourceType: 'commercial' | 'government' | 'open-source' | 'internal' | 'industry-sharing';
  threatType: 'ics-malware' | 'pipeline-targeting' | 'oil-gas-sector' | 'apt-group' |
  'vulnerability' | 'campaign' | 'technique' | 'infrastructure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  relevanceScore: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  publishedAt: string;
  lastUpdated: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'superseded' | 'false-positive';

  // Affected systems and infrastructure
  affectedSystems: string[];
  affectedIndustries: string[];
  targetedAssetTypes: string[];

  // Technical indicators
  indicators: ThreatIndicator[];

  // Mitigation and response
  mitigations: string[];
  recommendedActions: string[];

  // Upstream O&G specific properties
  upstreamRelevance: {
    siteTypes: string[]; // well-pad, offshore-platform, cpf, pipeline-station
    assetTypes: string[]; // wellhead-plc, sis, scada-master, pipeline-valve
    zones: string[]; // field, control, sis, dmz
    safetyImpact: boolean;
    productionImpact: boolean;
  };

  // Matching indicators for current infrastructure
  activeMatches: ThreatMatch[];

  // Related intelligence
  relatedThreats: string[];
  tags: string[];
}

export interface ThreatIndicator {
  id: string;
  type: 'ip-address' | 'domain' | 'url' | 'file-hash' | 'email' | 'registry-key' |
  'process-name' | 'service-name' | 'certificate' | 'user-agent' | 'network-signature';
  value: string;
  description?: string;
  confidence: 'high' | 'medium' | 'low';
  firstSeen: string;
  lastSeen: string;
  status: 'active' | 'inactive' | 'expired';
}

export interface ThreatMatch {
  id: string;
  indicatorId: string;
  indicatorType: string;
  indicatorValue: string;
  matchedAsset: string;
  matchedSystem: string;
  detectedAt: string;
  status: 'active' | 'investigated' | 'false-positive' | 'mitigated';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Backup and Recovery Models
export interface BackupPolicy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'scada-config' | 'sis-logic' | 'pipeline-settings' | 'wellhead-config' |
  'platform-config' | 'safety-systems' | 'historian-data' | 'security-logs';
  scope: string[];
  schedule: BackupSchedule;
  retention: BackupRetention;
  storage: BackupStorage;
  encryption: BackupEncryption;
  verification: BackupVerification;
  status: 'active' | 'inactive' | 'suspended' | 'error';
  lastBackup?: BackupExecution;
  nextBackup: string;
  backupHistory: BackupExecution[];
  recoveryTesting: RecoveryTest[];
  complianceRequirements: string[];
  upstreamContext: {
    siteTypes: string[];
    assetTypes: string[];
    safetyImpact: boolean;
    productionImpact: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface BackupSchedule {
  frequency: 'hourly' | 'every-4-hours' | 'every-6-hours' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  time?: string; // HH:MM format for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  enabled: boolean;
}

export interface BackupRetention {
  policy: 'time-based' | 'count-based' | 'hybrid';
  retentionDays?: number;
  retentionCount?: number;
  archiveAfterDays?: number;
  deleteAfterDays?: number;
  complianceRetention?: number; // days for compliance requirements
}

export interface BackupStorage {
  primary: BackupLocation;
  secondary?: BackupLocation;
  offsite?: BackupLocation;
  replication: boolean;
  compression: boolean;
  deduplication: boolean;
}

export interface BackupLocation {
  type: 'local' | 'network' | 'cloud' | 'tape' | 'offsite';
  path: string;
  capacity: string;
  used: string;
  available: string;
  status: 'online' | 'offline' | 'degraded' | 'full';
}

export interface BackupEncryption {
  enabled: boolean;
  algorithm?: string;
  keyManagement: 'local' | 'centralized' | 'cloud-kms';
  keyRotation: boolean;
  keyRotationDays?: number;
}

export interface BackupVerification {
  enabled: boolean;
  method: 'checksum' | 'restore-test' | 'file-count' | 'hybrid';
  frequency: 'every-backup' | 'daily' | 'weekly' | 'monthly';
  lastVerification?: string;
  verificationHistory: VerificationResult[];
}

export interface VerificationResult {
  id: string;
  timestamp: string;
  method: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
  filesChecked?: number;
  errorsFound?: number;
  duration: string;
}

export interface BackupExecution {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'warning';
  duration?: string;
  size: string;
  filesBackedUp: number;
  errors: number;
  warnings: number;
  details: string;
  location: string;
  verificationStatus?: 'pending' | 'passed' | 'failed';
}

export interface RecoveryTest {
  id: string;
  testDate: string;
  testType: 'full-restore' | 'partial-restore' | 'file-recovery' | 'system-recovery';
  scope: string[];
  status: 'passed' | 'failed' | 'partial' | 'cancelled';
  duration: string;
  recoveryTimeObjective: string; // Target RTO
  actualRecoveryTime: string;
  recoveryPointObjective: string; // Target RPO
  actualRecoveryPoint: string;
  issues: string[];
  recommendations: string[];
  testedBy: string;
  notes: string;
}

// Workload Security Models
export interface PlatformWorkload {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'scada-collector' | 'rtu-gateway' | 'historian-service' | 'hmi-server' |
  'data-processor' | 'alarm-server' | 'report-server' | 'backup-service' |
  'security-service' | 'communication-gateway' | 'edge-processor';
  category: 'data-collection' | 'data-processing' | 'user-interface' | 'communication' |
  'security' | 'backup' | 'reporting' | 'edge-computing';
  status: 'running' | 'stopped' | 'degraded' | 'maintenance' | 'error';
  version: string;
  lastUpdated: string;

  // Security posture
  securityScore: number; // 0-100
  hardeningScore: number; // 0-100
  vulnerabilityCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // Compliance
  complianceStatus: string[];

  // Upstream context
  upstreamContext: {
    handlesOtData: boolean;
    dataTypes: string[]; // scada-telemetry, sis-data, pipeline-data, well-data
    siteTypes: string[];
    assetTypes: string[];
    safetyImpact: boolean;
    productionImpact: boolean;
  };

  // Resource information
  resources: {
    cpu: string;
    memory: string;
    disk: string;
    status: 'normal' | 'warning' | 'critical';
  };

  // Network configuration
  networkZone: string;
  exposedPorts: number[];
  tlsEnabled: boolean;

  // Monitoring
  healthStatus: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
  lastHealthCheck: string;

  createdAt: string;
  updatedAt: string;
  managedBy: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'in-progress' | 'resolved' | 'accepted' | 'false-positive';
  type: 'vulnerability' | 'misconfiguration' | 'missing-control' | 'compliance-gap';
  recommendation: string;
  detectedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
}
// Application Security Models
export interface ApplicationSecurityScan {
  id: string;
  tenantId: string;
  applicationName: string;
  applicationVersion: string;
  applicationComponent: string;
  scanType: 'sast' | 'dast' | 'dependency' | 'container' | 'infrastructure' | 'compliance';
  scanDate: string;
  scanDuration: string;
  status: 'completed' | 'running' | 'failed' | 'cancelled';

  // Vulnerability summary
  vulnerabilitySummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };

  // Scan details
  scanDetails: {
    linesOfCode?: number;
    filesScanned?: number;
    dependenciesScanned?: number;
    rulesExecuted?: number;
    coverage?: number; // percentage
  };

  // Findings
  findings: SecurityFinding[];

  // Remediation
  remediationSummary: {
    fixed: number;
    inProgress: number;
    accepted: number;
    falsePositive: number;
  };

  // Compliance
  complianceStatus: {
    standard: string;
    score: number;
    status: 'pass' | 'fail' | 'warning';
  }[];

  // Upstream context
  upstreamContext: {
    handlesOtData: boolean;
    safetyImpact: boolean;
    productionImpact: boolean;
    dataTypes: string[];
  };

  // Scan metadata
  scannerName: string;
  scannerVersion: string;
  configurationProfile: string;
  triggeredBy: string;
  nextScan?: string;
}

// ===== POWER TRANSMISSION CYBERSECURITY TYPES =====
// Identity Management Types for Power Transmission Cybersecurity Feature Area

// Transmission-specific role enum
export type TransmissionRole =
  | 'operator'
  | 'engineer'
  | 'supervisor'
  | 'administrator'
  | 'auditor';

// User status enum
export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended';

// Security user interface for transmission cybersecurity
export interface SecurityUser {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  fullName: string;
  role: TransmissionRole;
  status: UserStatus;
  lastLogin?: string;
  failedLoginAttempts: number;
  mfaEnabled: boolean;
  accessZones: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Policy type enum
export type PolicyType =
  | 'zone-based'
  | 'role-based'
  | 'asset-based'
  | 'time-based';

// Policy status enum
export type PolicyStatus =
  | 'active'
  | 'inactive'
  | 'draft';

// Access action enum
export type AccessAction =
  | 'read'
  | 'write'
  | 'execute'
  | 'delete'
  | 'admin';

// Access effect enum
export type AccessEffect =
  | 'allow'
  | 'deny';

// Access policy interface
export interface AccessPolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  policyType: PolicyType;
  status: PolicyStatus;
  priority: number;
  appliesTo: string[];
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Access rule interface
export interface AccessRule {
  id: string;
  tenantId: string;
  policyId: string;
  ruleOrder: number;
  resourceType?: string;
  resourceId?: string;
  resourcePattern?: string;
  actions: AccessAction[];
  effect: AccessEffect;
  timeStart?: string;
  timeEnd?: string;
  daysOfWeek?: number[];
  zoneTypes?: string[];
  securityLevels?: number[];
  conditions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SessionLogEntry {
  action: string;
  details: string;
  timestamp: string;
  [key: string]: unknown;
}

// Privileged access session interface
export interface PrivilegedAccessSession {
  id: string;
  tenantId: string;
  userId: string;
  sessionType: string;
  targetResourceType: string;
  targetResourceId: string;
  requestedActions: string[];
  approvedActions: string[];
  requestedBy: string;
  approvedBy?: string;
  requestReason: string;
  approvalReason?: string;
  status: string;
  requestedStart: string;
  requestedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  isEmergency: boolean;
  emergencyJustification?: string;
  sessionLog: SessionLogEntry[];
  createdAt: string;
  updatedAt: string;
}

// Secret type enum
export type SecretType =
  | 'certificate'
  | 'private_key'
  | 'api_key'
  | 'password'
  | 'token'
  | 'shared_secret';

// Certificate type enum for transmission
export type CertificateType =
  | 'iec61850_server'
  | 'iec61850_client'
  | 'dnp3_tls'
  | 'scada_auth'
  | 'web_server'
  | 'code_signing'
  | 'ca_root'
  | 'ca_intermediate';

// Secret status enum
export type SecretStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'pending_rotation'
  | 'archived';

// Secrets and certificates interface
export interface SecretsCertificate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  secretType: SecretType;
  certificateType?: CertificateType;
  encryptedValue?: string;
  encryptionKeyId: string;
  subjectDn?: string;
  issuerDn?: string;
  serialNumber?: string;
  fingerprintSha256?: string;
  status: SecretStatus;
  createdDate: string;
  validFrom?: string;
  validUntil?: string;
  lastRotated?: string;
  rotationIntervalDays: number;
  usageCount: number;
  lastUsed?: string;
  usedBySystems: string[];
  protocol?: string;
  assetIds: string[];
  zoneIds: string[];
  accessRoles: TransmissionRole[];
  requiresApproval: boolean;
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Certificate rotation history interface
export interface CertificateRotationHistory {
  id: string;
  tenantId: string;
  certificateId: string;
  rotationType: string;
  oldFingerprint?: string;
  newFingerprint?: string;
  rotationReason?: string;
  rotationRequestedAt: string;
  rotationCompletedAt?: string;
  requestedBy?: string;
  completedBy?: string;
  status: string;
  errorMessage?: string;
  affectedSystems: string[];
  rollbackPlan?: string;
  createdAt: string;
  updatedAt: string;
}

// API key interface
export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  keyHash: string;
  keyPrefix: string;
  ownerUserId?: string;
  permissions: string[];
  allowedIps: string[];
  rateLimitPerHour: number;
  status: SecretStatus;
  expiresAt?: string;
  lastUsed?: string;
  usageCount: number;
  allowedProtocols: string[];
  allowedAssetTypes: string[];
  allowedZones: string[];
  createdAt: string;
  updatedAt: string;
}

// Service principal interface
export interface ServicePrincipal {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  principalType: string;
  clientId: string;
  clientSecretHash?: string;
  certificateId?: string;
  roles: TransmissionRole[];
  permissions: string[];
  scopes: string[];
  allowedSourceIps: string[];
  allowedProtocols: string[];
  status: SecretStatus;
  expiresAt?: string;
  lastAuthenticated?: string;
  authenticationCount: number;
  associatedSystems: string[];
  zoneAccess: string[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit event type enum
export type AuditEventType =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'configuration_change'
  | 'system_access'
  | 'privilege_escalation'
  | 'security_violation'
  | 'policy_change'
  | 'certificate_operation'
  | 'key_operation'
  | 'session_management'
  | 'alert_generation'
  | 'incident_creation'
  | 'compliance_check';

// Audit severity enum
export type AuditSeverity =
  | 'info'
  | 'warning'
  | 'high'
  | 'critical';

// Audit outcome enum
export type AuditOutcome =
  | 'success'
  | 'failure'
  | 'partial'
  | 'denied'
  | 'error';

// Security audit log entry interface
export interface SecurityAuditLogEntry {
  id: string;
  tenantId: string;
  eventType: AuditEventType;
  eventCategory: string;
  eventName: string;
  eventDescription?: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  userId?: string;
  username?: string;
  userRole?: string;
  sessionId?: string;
  sourceIp?: string;
  sourceHostname?: string;
  userAgent?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  assetId?: string;
  zoneId?: string;
  protocol?: string;
  systemComponent?: string;
  actionPerformed: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  additionalData: Record<string, unknown>;
  riskScore?: number;
  complianceImpact?: string[];
  requiresInvestigation: boolean;
  eventTimestamp: string;
  processingTimestamp: string;
  correlationId?: string;
  parentEventId?: string;
  retentionCategory: string;
  archived: boolean;
  archiveDate?: string;
  createdAt: string;
}

// Audit retention policy interface
export interface AuditRetentionPolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  eventTypes?: AuditEventType[];
  eventCategories?: string[];
  severityLevels?: AuditSeverity[];
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  complianceStandards?: string[];
  legalHold: boolean;
  active: boolean;
  priority: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit search query interface
export interface AuditSearchQuery {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  queryFilters: Record<string, unknown>;
  timeRangeHours?: number;
  createdBy: string;
  sharedWithRoles: TransmissionRole[];
  isPublic: boolean;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit export request interface
export interface AuditExportRequest {
  id: string;
  tenantId: string;
  exportName: string;
  exportFormat: string;
  dateFrom: string;
  dateTo: string;
  filters: Record<string, unknown>;
  requestedBy: string;
  requestReason: string;
  approvedBy?: string;
  status: string;
  filePath?: string;
  fileSizeBytes?: number;
  recordCount?: number;
  encryptionKeyId?: string;
  accessExpiresAt?: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Transmission-specific enumerations
export type TransmissionAssetType =
  | 'transformer'
  | 'circuit-breaker'
  | 'bay-controller'
  | 'protection-relay'
  | 'rtu'
  | 'scada-node'
  | 'meter'
  | 'switch'
  | 'capacitor-bank';

export type TransmissionProtocol =
  | 'IEC-61850'
  | 'DNP3'
  | 'IEC-60870-5-104'
  | 'Modbus-TCP'
  | 'GOOSE'
  | 'MMS';

export type TransmissionThreatCategory =
  | 'switching-manipulation'
  | 'relay-tampering'
  | 'scada-compromise'
  | 'protocol-abuse'
  | 'unauthorized-access'
  | 'data-exfiltration'
  | 'denial-of-service';

export type TransmissionZoneType =
  | 'substation-control'
  | 'protection-systems'
  | 'scada-network'
  | 'corporate-network'
  | 'field-devices'
  | 'maintenance-network';

// Grid security analysis interface
export interface GridSecurityAnalysis {
  affectedNodes: string[];
  affectedLines: string[];
  cascadeRisk: 'low' | 'medium' | 'high' | 'critical';
  isolationPossible: boolean;
  backupPaths: string[];
  estimatedImpact: {
    customersAffected: number;
    mwAtRisk: number;
    recoveryTimeHours: number;
  };
}

// ===== OT SECURITY TYPES FOR POWER TRANSMISSION =====
// Requirements: 3.1, 3.2, 3.5, 3.8, 8.4

// Security zone type enum (IEC 62443 compliant)
export type SecurityZoneType =
  | 'field'
  | 'control'
  | 'sis'
  | 'dmz'
  | 'corporate'
  | 'substation-control'
  | 'protection-systems'
  | 'scada-network'
  | 'corporate-network'
  | 'field-devices'
  | 'maintenance-network';

// Compliance status enum
export type ComplianceStatus =
  | 'compliant'
  | 'non-compliant'
  | 'partial';

// Security zone interface (IEC 62443 zone model)
export interface SecurityZone {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  type?: 'field' | 'control' | 'sis' | 'dmz' | 'corporate';
  zoneType: string;
  level?: number;
  securityLevel: number;
  assetCount: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  iec62443Compliant: boolean;
  policies: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Data flow direction enum
export type DataFlowDirection =
  | 'unidirectional'
  | 'bidirectional';

// Security conduit interface (IEC 62443 conduit model)
export interface SecurityConduit {
  id: string;
  tenantId: string;
  siteId?: string;
  name: string;
  sourceZoneId: string;
  targetZoneId: string;
  protocol: string;
  encrypted: boolean;
  policyCompliant: boolean;
  dataFlowDirection: DataFlowDirection;
  status?: 'active' | 'inactive' | 'pending';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// OT asset criticality enum
export type OTAssetCriticality =
  | 'safety-critical'
  | 'production-critical'
  | 'high'
  | 'medium'
  | 'low';

// OT asset security status enum
export type OTAssetSecurityStatus =
  | 'secure'
  | 'at-risk'
  | 'vulnerable';

// Patch status enum
export type PatchStatus =
  | 'up-to-date'
  | 'pending'
  | 'outdated';

// Network exposure enum
export type NetworkExposure =
  | 'internal'
  | 'dmz'
  | 'external';

// OT asset security interface
export interface OTAssetSecurity {
  id: string;
  tenantId: string;
  assetId: string;
  zoneId?: string;
  criticality: OTAssetCriticality;
  securityStatus: OTAssetSecurityStatus;
  riskScore: number; // 0-100
  vulnerabilityCount: number;
  patchStatus: PatchStatus;
  networkExposure: NetworkExposure;
  lastSecurityScan?: string;
  firmwareVersion?: string;
  manufacturer?: string;
  model?: string;
  inSafetyLoop: boolean;
  highPressure: boolean;
  openAlerts: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Remote session type enum
export type RemoteSessionType =
  | 'rdp'
  | 'ssh'
  | 'vnc'
  | 'web'
  | 'scada-client'
  | 'iec61850-client';

// Remote session status enum
export type RemoteSessionStatus =
  | 'active'
  | 'terminated'
  | 'expired'
  | 'failed';

// Authentication method enum
export type AuthenticationMethod =
  | 'password'
  | 'certificate'
  | 'mfa'
  | 'sso';

// Authorization status enum
export type AuthorizationStatus =
  | 'authorized'
  | 'unauthorized'
  | 'pending';

// Remote access session interface
export interface RemoteAccessSession {
  id: string;
  tenantId: string;
  siteId?: string;
  userId?: string;
  username: string;
  sessionType: RemoteSessionType;
  targetSystem: string;
  targetAssetId?: string;
  sourceIp: string;
  destinationIp: string;
  status: RemoteSessionStatus;
  authenticationMethod: AuthenticationMethod;
  authorizationStatus: AuthorizationStatus;
  sessionStart: string;
  sessionEnd?: string;
  durationSeconds?: number;
  commandsExecuted: number;
  filesTransferred: number;
  alertsTriggered: number;
  riskScore: number; // 0-100
  terminationReason?: string;
  auditTrail: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Network exposure assessment type enum
export type AssessmentType =
  | 'vulnerability-scan'
  | 'penetration-test'
  | 'configuration-audit'
  | 'network-scan'
  | 'protocol-analysis'
  | 'initial'
  | 'periodic'
  | 'renewal'
  | 'incident-driven'
  | 'audit';

// Exposure level enum
export type ExposureLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Mitigation status enum
export type MitigationStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'accepted-risk';

// Network exposure assessment interface
export interface NetworkExposureAssessment {
  id: string;
  tenantId: string;
  siteId?: string;
  assetId?: string;
  zoneId?: string;
  assessmentType: AssessmentType;
  exposureLevel: ExposureLevel;
  riskScore: number; // 0-100
  findingsCount: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  exposedServices: string[];
  exposedPorts: number[];
  vulnerableProtocols: string[];
  mitigationStatus: MitigationStatus;
  mitigationRecommendations: string[];
  assessmentDate: string;
  nextAssessmentDate?: string;
  assessor?: string;
  automated: boolean;
  findingsSummary?: string;
  detailedFindings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ===== ENDPOINT BASELINE TYPES FOR POWER TRANSMISSION =====
// Requirements: 3.4, 9.2, 9.3, 9.4

// Baseline status enum
export type BaselineStatus =
  | 'compliant'
  | 'non-compliant'
  | 'deviation-detected'
  | 'not-assessed';

// Deviation severity enum
export type DeviationSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

// Gap severity enum (reusing DeviationSeverity)
export type GapSeverity = DeviationSeverity;

// Baseline category enum
export type BaselineCategory =
  | 'configuration'
  | 'software'
  | 'network'
  | 'security'
  | 'performance';

// Endpoint baseline interface
export interface EndpointBaseline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  assetType: TransmissionAssetType;
  category: BaselineCategory;
  baselineVersion: string;
  status: BaselineStatus;
  complianceScore: number; // 0-100
  totalEndpoints: number;
  compliantEndpoints: number;
  deviatingEndpoints: number;
  criticalDeviations: number;
  highDeviations: number;
  mediumDeviations: number;
  lowDeviations: number;
  baselineRules: BaselineRule[];
  applicableZones: string[];
  applicableSites: string[];
  lastAssessment?: string;
  nextAssessment?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Baseline rule interface
export interface BaselineRule {
  id: string;
  ruleId: string;
  name: string;
  description?: string;
  category: BaselineCategory;
  severity: DeviationSeverity;
  expectedValue: string;
  checkType: 'exact' | 'range' | 'regex' | 'exists' | 'version';
  enabled: boolean;
  mandatory: boolean;
  complianceStandards?: string[];
}

// Endpoint compliance interface
export interface EndpointCompliance {
  id: string;
  tenantId: string;
  assetId: string;
  assetName: string;
  assetType: TransmissionAssetType;
  baselineId: string;
  baselineName: string;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  status: BaselineStatus;
  complianceScore: number; // 0-100
  totalRules: number;
  passedRules: number;
  failedRules: number;
  deviations: BaselineDeviation[];
  lastChecked: string;
  nextCheck?: string;
  autoRemediation: boolean;
  remediationStatus?: 'pending' | 'in-progress' | 'completed' | 'failed';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Baseline deviation interface
export interface BaselineDeviation {
  id: string;
  ruleId: string;
  ruleName: string;
  category: BaselineCategory;
  severity: DeviationSeverity;
  expectedValue: string;
  actualValue: string;
  deviationDescription: string;
  detectedAt: string;
  status: 'open' | 'acknowledged' | 'remediated' | 'accepted';
  remediationAction?: string;
  remediationDeadline?: string;
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  remediatedBy?: string;
  remediatedAt?: string;
  acceptanceReason?: string;
  complianceImpact?: string[];
}

// ===== ENCRYPTION PROTOCOL POLICY TYPES FOR POWER TRANSMISSION =====
// Requirements: 3.6, 10.5, 9.2, 9.3, 9.4

// Protocol security status enum
export type ProtocolSecurityStatus =
  | 'secure'
  | 'at-risk'
  | 'vulnerable'
  | 'deprecated';

// Protocol compliance status enum
export type ProtocolComplianceStatus =
  | 'compliant'
  | 'non-compliant'
  | 'partial'
  | 'not-assessed';

// Encryption strength enum
export type EncryptionStrength =
  | 'strong'
  | 'adequate'
  | 'weak'
  | 'none';

// Protocol policy interface
export interface ProtocolPolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  protocol: TransmissionProtocol;
  version: string;
  status: ProtocolSecurityStatus;
  complianceStatus: ProtocolComplianceStatus;
  encryptionRequired: boolean;
  encryptionStrength: EncryptionStrength;
  encryptionAlgorithm?: string;
  keyLength?: number;
  certificateRequired: boolean;
  mutualAuthRequired: boolean;
  allowedCipherSuites?: string[];
  minimumTlsVersion?: string;
  applicableZones: string[];
  applicableSites: string[];
  applicableAssetTypes: TransmissionAssetType[];
  violationCount: number;
  compliantAssets: number;
  totalAssets: number;
  complianceScore: number; // 0-100
  lastAssessment?: string;
  nextAssessment?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Protocol violation interface
export interface ProtocolViolation {
  id: string;
  tenantId: string;
  policyId: string;
  policyName: string;
  protocol: TransmissionProtocol;
  assetId: string;
  assetName: string;
  assetType: TransmissionAssetType;
  siteId?: string;
  siteName?: string;
  zoneId?: string;
  zoneName?: string;
  violationType: 'encryption-disabled' | 'weak-encryption' | 'deprecated-version' |
  'certificate-expired' | 'no-authentication' | 'weak-cipher' | 'protocol-mismatch';
  severity: DeviationSeverity;
  description: string;
  detectedAt: string;
  status: 'open' | 'acknowledged' | 'remediated' | 'accepted';
  riskScore: number; // 0-100
  remediationAction?: string;
  remediationDeadline?: string;
  assignedTo?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  remediatedBy?: string;
  remediatedAt?: string;
  acceptanceReason?: string;
  complianceImpact?: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Protocol monitoring interface
export interface ProtocolMonitoring {
  id: string;
  tenantId: string;
  protocol: TransmissionProtocol;
  totalConnections: number;
  secureConnections: number;
  insecureConnections: number;
  encryptedTraffic: number; // percentage
  averageKeyLength: number;
  certificateExpirations: number; // count expiring in next 30 days
  deprecatedVersions: number;
  violationCount: number;
  lastMonitored: string;
  topViolations: {
    type: string;
    count: number;
    severity: DeviationSeverity;
  }[];
  complianceScore: number; // 0-100
  trend: 'improving' | 'stable' | 'degrading';
}

// ===== CONTROL COVERAGE ASSESSMENT TYPES FOR POWER TRANSMISSION =====
// Requirements: 1.3, 4.1, 4.2, 9.2, 9.3, 9.4

// Assessment type enum
export type ControlAssessmentType =
  | 'iec-62443'
  | 'nerc-cip'
  | 'combined'
  | 'custom';

// Assessment status enum
export type AssessmentStatus =
  | 'in-progress'
  | 'completed'
  | 'approved'
  | 'expired';

// Enums moved to Shared Enums section at the top of the file

// Control coverage assessment interface
export interface ControlCoverageAssessment {
  id: string;
  tenantId: string;
  siteId?: string;
  siteName?: string;
  assessmentName: string;
  assessmentDate: string;
  assessor?: string;
  assessmentType: ControlAssessmentType;
  standardName: string;
  standardVersion?: string;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  notImplementedControls: number;
  notApplicableControls: number;
  coverageScore: number; // 0-100
  effectivenessScore: number; // 0-100
  maturityLevel?: number; // 0-5
  status: AssessmentStatus;
  complianceStatus: ComplianceStatus;
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
  gapSummary?: string;
  remediationPlan?: string;
  targetCompletionDate?: string;
  nextAssessmentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Control coverage detail interface
export interface ControlCoverageDetail {
  id: string;
  assessmentId: string;
  tenantId: string;
  controlId: string; // e.g., IEC-62443-3-3-SR-1.1, CIP-007-6-R1
  controlName: string;
  controlDescription?: string;
  controlCategory?: string;
  implementationStatus: ControlImplementationStatus;
  effectiveness?: ControlEffectiveness;
  evidence?: string[];
  validationMethod?: string;
  lastValidated?: string;
  gapSeverity?: GapSeverity;
  gapDescription?: string;
  remediationAction?: string;
  remediationOwner?: string;
  remediationDueDate?: string;
  remediationStatus?: RemediationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Control coverage summary interface (for dashboard display)
export interface ControlCoverageSummary {
  assessmentId: string;
  assessmentName: string;
  standardName: string;
  siteId?: string;
  siteName?: string;
  assessmentDate: string;
  coverageScore: number;
  effectivenessScore: number;
  status: AssessmentStatus;
  complianceStatus: ComplianceStatus;
  totalControls: number;
  implementedControls: number;
  criticalGaps: number;
  highGaps: number;
  nextAssessmentDate?: string;
}

// Control by standard grouping interface
export interface ControlsByStandard {
  standardName: string;
  standardVersion?: string;
  assessmentCount: number;
  averageCoverageScore: number;
  averageEffectivenessScore: number;
  totalControls: number;
  implementedControls: number;
  partialControls: number;
  notImplementedControls: number;
  criticalGaps: number;
  highGaps: number;
  controls: ControlCoverageDetail[];
}

// Gap analysis interface
export interface GapAnalysis {
  assessmentId: string;
  standardName: string;
  totalGaps: number;
  criticalGaps: GapDetail[];
  highGaps: GapDetail[];
  mediumGaps: GapDetail[];
  lowGaps: GapDetail[];
  remediationProgress: {
    notStarted: number;
    inProgress: number;
    completed: number;
    deferred: number;
  };
  estimatedRemediationCost?: number;
  estimatedRemediationTime?: number; // days
}

// Gap detail interface
export interface GapDetail {
  controlId: string;
  controlName: string;
  controlCategory?: string;
  gapSeverity: GapSeverity;
  gapDescription: string;
  remediationAction?: string;
  remediationOwner?: string;
  remediationDueDate?: string;
  remediationStatus: RemediationStatus;
  complianceImpact?: string[];
}

// =============================================================================
// VENDOR SECURITY ASSESSMENT TYPES
// =============================================================================

// Vendor security assessment type enums
export type VendorType =
  | 'equipment-manufacturer'
  | 'software-provider'
  | 'service-provider'
  | 'system-integrator'
  | 'consultant'
  | 'other';

export type SystemType =
  | 'scada'
  | 'ems'
  | 'dms'
  | 'protection-relay'
  | 'rtu'
  | 'ied'
  | 'gateway'
  | 'application'
  | 'service'
  | 'other';

export type SystemCriticality =
  | 'safety-critical'
  | 'production-critical'
  | 'high'
  | 'medium'
  | 'low';

// AssessmentType unified above

export type AssessmentMethod =
  | 'questionnaire'
  | 'on-site-audit'
  | 'documentation-review'
  | 'penetration-test'
  | 'combined';

export type TrustLevel =
  | 'trusted'
  | 'conditional'
  | 'restricted'
  | 'untrusted';

export type VendorAssessmentStatus =
  | 'in-progress'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'expired';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'conditional'
  | 'rejected';

export type AssessmentFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi-annual'
  | 'annual'
  | 'biennial';

export type FindingCategory =
  | 'authentication'
  | 'authorization'
  | 'encryption'
  | 'patch-management'
  | 'configuration'
  | 'network-security'
  | 'data-protection'
  | 'incident-response'
  | 'other';

export type FindingSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

// RiskLevel unified with other declarations

export type Likelihood =
  | 'very-high'
  | 'high'
  | 'medium'
  | 'low'
  | 'very-low';

export type Impact =
  | 'very-high'
  | 'high'
  | 'medium'
  | 'low'
  | 'very-low';

export type RemediationPriority =
  | 'immediate'
  | 'high'
  | 'medium'
  | 'low';

export type FindingRemediationStatus =
  | 'open'
  | 'in-progress'
  | 'resolved'
  | 'accepted'
  | 'deferred';

export type ContactType =
  | 'email'
  | 'phone'
  | 'meeting'
  | 'incident'
  | 'audit'
  | 'other';

// Main vendor security assessment interface
export interface VendorSecurityAssessment {
  id: string;
  tenant_id: string;

  // Vendor information
  vendor_name: string;
  vendor_id?: string;
  vendor_type: VendorType;
  vendor_contact_name?: string;
  vendor_contact_email?: string;
  vendor_contact_phone?: string;

  // System/Product information
  system_name: string;
  system_version?: string;
  system_type?: SystemType;
  system_criticality: SystemCriticality;

  // Assessment metadata
  assessment_date: string;
  assessment_type: AssessmentType;
  assessor?: string;
  assessment_method?: AssessmentMethod;

  // Security scoring
  overall_security_score: number;
  risk_score: number;
  trust_level?: TrustLevel;

  // Assessment categories
  authentication_score?: number;
  authorization_score?: number;
  encryption_score?: number;
  patch_management_score?: number;
  incident_response_score?: number;
  data_protection_score?: number;

  // Compliance and certifications
  certifications?: string[];
  compliance_standards?: string[];
  iec_62443_certified?: boolean;
  iec_62443_level?: number;

  // Vulnerabilities and risks
  known_vulnerabilities?: number;
  critical_vulnerabilities?: number;
  high_vulnerabilities?: number;
  medium_vulnerabilities?: number;
  low_vulnerabilities?: number;

  // Risk findings
  critical_findings?: number;
  high_findings?: number;
  medium_findings?: number;
  low_findings?: number;
  findings_summary?: string;

  // Recommendations
  recommendations?: string[];
  required_actions?: string[];
  remediation_plan?: string;
  remediation_deadline?: string;

  // Contract and SLA
  contract_start_date?: string;
  contract_end_date?: string;
  sla_requirements?: string;
  security_requirements?: string;

  // Status and approval
  status: VendorAssessmentStatus;
  approval_status?: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;

  // Review schedule
  next_assessment_date?: string;
  assessment_frequency?: AssessmentFrequency;

  // Metadata
  notes?: string;
  attachments?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Vendor security finding interface
export interface VendorSecurityFinding {
  id: string;
  assessment_id: string;
  tenant_id: string;

  // Finding identification
  finding_id?: string;
  finding_title: string;
  finding_description: string;
  finding_category: FindingCategory;

  // Severity and risk
  severity: FindingSeverity;
  risk_level?: RiskLevel;
  likelihood?: Likelihood;
  impact?: Impact;

  // Evidence and validation
  evidence?: string;
  affected_components?: string[];
  cve_ids?: string[];

  // Remediation
  remediation_recommendation: string;
  remediation_priority?: RemediationPriority;
  remediation_status: FindingRemediationStatus;
  remediation_owner?: string;
  remediation_due_date?: string;
  remediation_completed_date?: string;

  // Verification
  verification_method?: string;
  verified_by?: string;
  verified_at?: string;

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Vendor contact history interface
export interface VendorContactHistory {
  id: string;
  assessment_id: string;
  tenant_id: string;

  // Contact information
  contact_date: string;
  contact_type: ContactType;
  contact_subject: string;
  contact_summary?: string;

  // Participants
  internal_participants?: string[];
  vendor_participants?: string[];

  // Follow-up
  action_items?: string[];
  follow_up_required?: boolean;
  follow_up_date?: string;

  // Metadata
  attachments?: Record<string, unknown>;
  created_at: string;
}

// Vendor summary interface (for dashboard/list views)
export interface VendorSummary {
  vendor_name: string;
  vendor_type: VendorType;
  assessment_count: number;
  latest_assessment_date?: string;
  average_security_score: number;
  average_risk_score: number;
  trust_level?: TrustLevel;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  open_findings: number;
  systems: VendorSystemSummary[];
  contract_status: 'active' | 'expiring-soon' | 'expired' | 'none';
  next_assessment_date?: string;
}

// Vendor system summary interface
export interface VendorSystemSummary {
  assessment_id: string;
  system_name: string;
  system_type?: SystemType;
  system_criticality: SystemCriticality;
  security_score: number;
  risk_score: number;
  assessment_date: string;
  status: VendorAssessmentStatus;
}

// Vendor scorecard interface (detailed view)
export interface VendorScorecard {
  assessment: VendorSecurityAssessment;
  findings: VendorSecurityFinding[];
  contact_history: VendorContactHistory[];

  // Calculated metrics
  metrics: {
    overall_health: 'excellent' | 'good' | 'fair' | 'poor';
    security_trend: 'improving' | 'stable' | 'declining';
    compliance_level: 'full' | 'partial' | 'minimal' | 'none';
    response_time: string; // Average response time to security issues
    remediation_rate: number; // Percentage of findings remediated
  };

  // Risk indicators
  risk_indicators: {
    expired_certifications: number;
    overdue_assessments: boolean;
    critical_open_findings: number;
    contract_expiring_soon: boolean;
    outdated_systems: number;
  };
}


// =============================================================================
// COMPLIANCE AND GOVERNANCE TYPES FOR POWER TRANSMISSION CYBERSECURITY
// =============================================================================
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.4

// Compliance standard interface merged into Unified ComplianceStandard above

// Compliance standard interface merged into Unified ComplianceStandard above

// Status and Priority enums moved to Shared Enums section

// Compliance requirement interface merged into Unified ComplianceRequirement above

// Compliance evidence type enum
export type EvidenceType =
  | 'document'
  | 'screenshot'
  | 'log'
  | 'report'
  | 'certificate';

// Compliance evidence interface
export interface ComplianceEvidence {
  id: string;
  tenantId: string;
  requirementId: string;
  evidenceType: EvidenceType;
  evidenceName: string;
  evidenceDescription?: string;
  filePath?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  fileHash?: string;
  collectedDate: string;
  collectedBy?: string;
  validated: boolean;
  validatedDate?: string;
  validatedBy?: string;
  retentionRequired: boolean;
  retentionPeriodMonths: number;
  expirationDate?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Security control type enum moved to Shared Enums section

// Security control interface merged into Unified SecurityControl above

// Control implementation interface
export interface ControlImplementation {
  id: string;
  tenantId: string;
  controlId: string;
  implementationName: string;
  implementationDescription?: string;
  siteId?: string;
  assetId?: string;
  zoneId?: string;
  technologyUsed?: string;
  toolsUsed?: string[];
  configurationDetails?: Record<string, unknown>;
  status: ControlImplementationStatus;
  effectiveness: ControlEffectiveness;
  plannedDate?: string;
  implementationDate?: string;
  lastVerified?: string;
  nextVerification?: string;
  implementedBy?: string;
  verifiedBy?: string;
  knownIssues?: string[];
  gaps?: string[];
  remediationPlan?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Control test result interface
export interface ControlTestResult {
  id: string;
  tenantId: string;
  controlId: string;
  implementationId?: string;
  testDate: string;
  testType: string; // 'automated', 'manual', 'penetration-test', 'audit', 'review'
  testName: string;
  testDescription?: string;
  testerName?: string;
  testDurationMinutes?: number;
  testMethodology?: string;
  result: 'pass' | 'fail' | 'partial' | 'inconclusive';
  effectivenessRating?: ControlEffectiveness;
  findings?: string;
  issuesFound?: string[];
  recommendations?: string[];
  remediationRequired: boolean;
  remediationPriority?: RemediationPriority;
  evidenceFiles?: string[];
  evidenceNotes?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Security policy status enum
export type SecurityPolicyStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'active'
  | 'archived'
  | 'superseded';

// Policy scope enum
export type PolicyScope =
  | 'enterprise'
  | 'transmission'
  | 'site-specific'
  | 'zone-specific'
  | 'asset-specific';

// Policy enforcement level enum
export type PolicyEnforcementLevel =
  | 'mandatory'
  | 'recommended'
  | 'optional'
  | 'informational';

// Security policy interface
export interface TransmissionSecurityPolicy {
  id: string;
  tenantId: string;
  policyId: string; // e.g., 'POL-SEC-001', 'POL-TRANS-AC-001'
  policyName: string;
  policyDescription?: string;
  policyType: string; // 'Access Control', 'Data Protection', 'Incident Response', etc.
  version: string;
  versionDate: string;
  previousVersionId?: string;
  supersededById?: string;
  status: SecurityPolicyStatus;
  effectiveDate?: string;
  reviewDate?: string;
  expirationDate?: string;
  reviewFrequencyMonths: number;
  scope: PolicyScope;
  enforcementLevel: PolicyEnforcementLevel;
  appliesToSites?: string[];
  appliesToZones?: string[];
  appliesToRoles?: TransmissionRole[];
  appliesToAssetTypes?: TransmissionAssetType[];
  policyStatement: string;
  purpose?: string;
  objectives?: string[];
  requirements?: string[];
  procedures?: string;
  exceptionsAllowed: boolean;
  exceptionCriteria?: string;
  relatedStandards?: string[];
  relatedControls?: string[];
  regulatoryRequirements?: string[];
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  reviewDateActual?: string;
  approvalDate?: string;
  approvalNotes?: string;
  policyOwner: string;
  policyOwnerRole?: string;
  responsibleParties?: string[];
  documentUrl?: string;
  documentVersion?: string;
  relatedDocuments?: string[];
  trainingRequired: boolean;
  trainingMaterials?: string[];
  complianceMandatory: boolean;
  complianceTrackingEnabled: boolean;
  lastComplianceCheck?: string;
  complianceRate: number; // 0-100
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Policy version interface
export interface PolicyVersion {
  id: string;
  tenantId: string;
  policyId: string;
  version: string;
  versionDate: string;
  versionType: 'major' | 'minor' | 'patch' | 'emergency';
  changeSummary: string;
  changesMade?: string[];
  reasonForChange?: string;
  policyContent: Record<string, unknown>;
  createdBy?: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  createdAt: string;
}

// Policy acknowledgment interface
export interface PolicyAcknowledgment {
  id: string;
  tenantId: string;
  policyId: string;
  userId: string;
  policyVersion: string;
  acknowledgedDate: string;
  acknowledgmentMethod?: string; // 'electronic', 'training', 'manual'
  trainingCompleted: boolean;
  trainingCompletionDate?: string;
  trainingScore?: number;
  compliant: boolean;
  complianceNotes?: string;
  lastComplianceCheck?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Policy violation interface
export interface PolicyViolation {
  id: string;
  tenantId: string;
  policyId: string;
  violationDate: string;
  detectedBy?: string;
  detectionMethod?: string; // 'automated', 'audit', 'report', 'incident'
  violatorUserId?: string;
  violatorName?: string;
  violatorRole?: string;
  violationType: string;
  violationDescription: string;
  severity: DeviationSeverity;
  impactDescription?: string;
  affectedSystems?: string[];
  affectedAssets?: string[];
  responseActions?: string[];
  remediationPlan?: string;
  remediationStatus: 'open' | 'in-progress' | 'resolved' | 'closed' | 'waived';
  remediationDate?: string;
  investigationRequired: boolean;
  investigationNotes?: string;
  rootCause?: string;
  disciplinaryActionTaken: boolean;
  disciplinaryActionDescription?: string;
  relatedIncidentId?: string;
  relatedAlertId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Security exception type enum
export type SecurityExceptionType =
  | 'policy-exception'
  | 'control-exception'
  | 'compliance-waiver'
  | 'temporary-deviation'
  | 'permanent-exception'
  | 'risk-acceptance';

// Exception status enum
export type ExceptionStatus =
  | 'pending'
  | 'under-review'
  | 'approved'
  | 'denied'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'closed';

// Security exception interface
export interface SecurityException {
  id: string;
  tenantId: string;
  exceptionId: string; // e.g., 'EXC-2024-001', 'WAIV-TRANS-001'
  exceptionName: string;
  exceptionType: SecurityExceptionType;
  policyId?: string;
  controlId?: string;
  requirementId?: string;
  standardId?: string;
  scope: string; // 'site', 'zone', 'asset', 'system', 'user'
  appliesToSites?: string[];
  appliesToZones?: string[];
  appliesToAssets?: string[];
  appliesToUsers?: string[];
  requestedBy: string;
  requestDate: string;
  businessJustification: string;
  technicalJustification?: string;
  alternativeControls?: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  riskMitigationMeasures?: string[];
  residualRiskLevel?: RiskLevel;
  residualRiskDescription?: string;
  status: ExceptionStatus;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComments?: string;
  approvedBy?: string;
  approvalDate?: string;
  approvalConditions?: string[];
  denialReason?: string;
  effectiveDate?: string;
  expirationDate?: string;
  autoExpire: boolean;
  extensionAllowed: boolean;
  maxExtensions: number;
  extensionsUsed: number;
  requiresMonitoring: boolean;
  monitoringFrequencyDays: number;
  lastMonitored?: string;
  nextMonitoringDate?: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'at-risk' | 'unknown';
  compensatingControlsRequired: boolean;
  compensatingControls?: string[];
  compensatingControlsImplemented: boolean;
  compensatingControlsVerified: boolean;
  revoked: boolean;
  revokedBy?: string;
  revocationDate?: string;
  revocationReason?: string;
  auditLog?: Record<string, unknown>[];
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Exception review interface
export interface ExceptionReview {
  id: string;
  tenantId: string;
  exceptionId: string;
  reviewDate: string;
  reviewType: string; // 'initial', 'periodic', 'renewal', 'incident-triggered', 'audit'
  reviewerId: string;
  reviewerRole?: string;
  findings: string;
  riskAssessmentCurrent: boolean;
  compensatingControlsEffective?: boolean;
  complianceMaintained: boolean;
  recommendation: 'continue' | 'modify' | 'revoke' | 'extend' | 'escalate';
  recommendationDetails?: string;
  actionItems?: string[];
  followUpRequired: boolean;
  followUpDate?: string;
  followUpCompleted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Exception extension interface
export interface ExceptionExtension {
  id: string;
  tenantId: string;
  exceptionId: string;
  requestedBy: string;
  requestDate: string;
  extensionReason: string;
  requestedNewExpiration: string;
  status: ExceptionStatus;
  approvedBy?: string;
  approvalDate?: string;
  approvedNewExpiration?: string;
  approvalConditions?: string[];
  denialReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Exception incident interface
export interface ExceptionIncident {
  id: string;
  tenantId: string;
  exceptionId: string;
  incidentDate: string;
  incidentType: string; // 'security-event', 'policy-violation', 'control-failure', 'audit-finding'
  incidentDescription: string;
  severity: RiskLevel;
  impactDescription?: string;
  affectedSystems?: string[];
  affectedAssets?: string[];
  responseActions?: string[];
  remediationRequired: boolean;
  remediationPlan?: string;
  remediationStatus: 'open' | 'in-progress' | 'completed' | 'closed';
  exceptionReviewTriggered: boolean;
  exceptionRevoked: boolean;
  relatedIncidentCaseId?: string;
  relatedAlertId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Security risk status enum
export type SecurityRiskStatus =
  | 'identified'
  | 'assessed'
  | 'mitigating'
  | 'monitoring'
  | 'accepted'
  | 'transferred'
  | 'closed';

// Security risk category enum
export type SecurityRiskCategory =
  | 'cyber-attack'
  | 'insider-threat'
  | 'system-vulnerability'
  | 'configuration-error'
  | 'physical-security'
  | 'third-party'
  | 'compliance'
  | 'operational'
  | 'natural-disaster'
  | 'human-error';

// Risk treatment strategy enum
export type RiskTreatmentStrategy =
  | 'mitigate'
  | 'accept'
  | 'transfer'
  | 'avoid'
  | 'monitor';

// Security risk interface
export interface SecurityRisk {
  id: string;
  tenantId: string;
  riskId: string; // e.g., 'RISK-TRANS-2024-001', 'RISK-CYBER-001'
  riskName: string;
  riskDescription: string;
  riskCategory: SecurityRiskCategory;
  riskSubcategory?: string;
  threatScenario?: string;
  threatActor?: string; // 'nation-state', 'insider', 'hacktivist', 'criminal', 'accidental'
  attackVector?: string[];
  affectedAssetTypes?: TransmissionAssetType[];
  affectedProtocols?: TransmissionProtocol[];
  appliesToSites?: string[];
  appliesToZones?: string[];
  appliesToAssets?: string[];
  inherentLikelihood: Likelihood;
  inherentImpact: Impact;
  inherentRiskScore: number; // 0-100
  inherentRiskLevel: RiskLevel;
  residualLikelihood?: Likelihood;
  residualImpact?: Impact;
  residualRiskScore?: number; // 0-100
  residualRiskLevel?: RiskLevel;
  safetyImpact: boolean;
  safetyImpactDescription?: string;
  operationalImpactDescription?: string;
  financialImpactEstimate?: number;
  regulatoryImpactDescription?: string;
  reputationalImpactDescription?: string;
  gridStabilityImpact: boolean;
  customerImpactEstimate?: number;
  mwAtRisk?: number;
  recoveryTimeEstimateHours?: number;
  existingControls?: string[];
  controlEffectiveness?: ControlEffectiveness;
  controlGaps?: string[];
  treatmentStrategy: RiskTreatmentStrategy;
  treatmentPlan?: string;
  treatmentOwner?: string;
  treatmentOwnerRole?: string;
  treatmentBudget?: number;
  treatmentPriority?: RemediationPriority;
  status: SecurityRiskStatus;
  identifiedDate: string;
  identifiedBy?: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
  assessmentFrequencyMonths: number;
  riskAccepted: boolean;
  acceptedBy?: string;
  acceptanceDate?: string;
  acceptanceJustification?: string;
  acceptanceExpiration?: string;
  riskTransferred: boolean;
  transferredTo?: string;
  transferMechanism?: string; // 'insurance', 'contract', 'outsourcing'
  transferDate?: string;
  requiresMonitoring: boolean;
  monitoringFrequencyDays: number;
  lastMonitored?: string;
  nextMonitoringDate?: string;
  monitoringKpis?: string[];
  relatedIncidents?: string[];
  relatedVulnerabilities?: string[];
  relatedComplianceRequirements?: string[];
  closedDate?: string;
  closedBy?: string;
  closureReason?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Risk assessment interface
export interface RiskAssessment {
  id: string;
  tenantId: string;
  riskId: string;
  assessmentDate: string;
  assessmentType: string; // 'initial', 'periodic', 'triggered', 'post-incident', 'audit'
  assessorId?: string;
  assessorName?: string;
  assessmentMethod?: string; // 'qualitative', 'quantitative', 'semi-quantitative'
  likelihood: Likelihood;
  impact: Impact;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  likelihoodChanged: boolean;
  impactChanged: boolean;
  riskTrend?: 'increasing' | 'stable' | 'decreasing';
  findings?: string;
  controlEffectivenessAssessment?: string;
  recommendations?: string[];
  actionItems?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Risk mitigation action interface
export interface RiskMitigationAction {
  id: string;
  tenantId: string;
  riskId: string;
  actionName: string;
  actionDescription: string;
  actionType: string; // 'implement-control', 'enhance-control', 'process-change', 'training', 'technology'
  responsibleParty: string;
  responsibleRole?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'deferred' | 'cancelled';
  priority: RemediationPriority;
  plannedStartDate?: string;
  plannedCompletionDate: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedEffortHours?: number;
  actualEffortHours?: number;
  expectedRiskReduction?: number; // 0-100
  actualRiskReduction?: number; // 0-100
  effectivenessVerified: boolean;
  verificationDate?: string;
  verificationNotes?: string;
  implementsControlId?: string;
  dependsOnActions?: string[];
  blocksActions?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Risk monitoring event interface
export interface RiskMonitoringEvent {
  id: string;
  tenantId: string;
  riskId: string;
  eventDate: string;
  eventType: string; // 'routine-check', 'kpi-threshold', 'incident', 'control-failure', 'audit-finding'
  eventDescription: string;
  riskIndicators?: Record<string, unknown>;
  riskLevelCurrent?: RiskLevel;
  riskTrend?: 'increasing' | 'stable' | 'decreasing';
  findings?: string;
  concerns?: string[];
  positiveDevelopments?: string[];
  actionRequired: boolean;
  recommendedActions?: string[];
  escalationRequired: boolean;
  escalatedTo?: string;
  monitoredBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
// ===== THREAT MONITORING & INCIDENT RESPONSE TYPES =====
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.4

// Extended security alert types for transmission-specific threat monitoring
export type SecurityAlertSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export type SecurityAlertStatus =
  | 'new'
  | 'acknowledged'
  | 'in-progress'
  | 'investigating'
  | 'resolved'
  | 'closed';

// Extended security alert interface with transmission-specific fields
export interface TransmissionSecurityAlert {
  id: string;
  tenantId: string;
  siteId?: string;
  assetId?: string;

  // Basic alert information
  title: string;
  description?: string;
  severity: SecurityAlertSeverity;
  status: SecurityAlertStatus;
  category?: string;
  detectedBy?: string;
  assignedTo?: string;

  // Transmission-specific fields
  threatCategory?: TransmissionThreatCategory;
  affectedProtocol?: TransmissionProtocol;
  gridNodeId?: string;
  gridLineId?: string;
  correlationId?: string;
  parentAlertId?: string;
  blastRadiusAssessment?: Record<string, unknown>;
  mitigationSteps?: string[];
  evidenceCollected?: string[];
  falsePositive: boolean;
  escalationLevel: number; // 1-5

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Incident case types
export type IncidentSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type IncidentStatus =
  | 'open'
  | 'investigating'
  | 'contained'
  | 'eradicating'
  | 'recovering'
  | 'resolved'
  | 'closed';

export type IncidentType =
  | 'security-breach'
  | 'malware-infection'
  | 'unauthorized-access'
  | 'data-exfiltration'
  | 'system-compromise'
  | 'denial-of-service'
  | 'insider-threat'
  | 'physical-security'
  | 'policy-violation'
  | 'configuration-error';

export type IncidentPriority =
  | 'p1-critical'
  | 'p2-high'
  | 'p3-medium'
  | 'p4-low';

// Incident case interface merged into Unified IncidentCase above

// Incident timeline entry interface
export interface IncidentTimelineEntry {
  id: string;
  incidentId: string;
  tenantId: string;

  entryType: string; // 'status-change', 'action-taken', 'evidence-added', 'communication', 'note'
  timestamp: string;
  author?: string;

  title: string;
  description?: string;

  // Status change tracking
  oldStatus?: IncidentStatus;
  newStatus?: IncidentStatus;

  // Action tracking
  actionTaken?: string;
  actionResult?: string;

  // Evidence tracking
  evidenceType?: string;
  evidenceLocation?: string;

  // Communication tracking
  communicationType?: string; // 'internal', 'external', 'stakeholder', 'regulatory'
  recipients?: string[];

  // Metadata
  metadata: Record<string, unknown>;
  attachments: string[];

  createdAt: string;
}

// Anomaly detection types
export type AnomalyType =
  | 'communication-pattern'
  | 'data-flow'
  | 'protocol-behavior'
  | 'timing-deviation'
  | 'frequency-anomaly'
  | 'load-pattern'
  | 'configuration-drift'
  | 'access-pattern'
  | 'performance-degradation'
  | 'security-event';

export type AnomalySeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type AnomalyStatus =
  | 'detected'
  | 'investigating'
  | 'confirmed'
  | 'false-positive'
  | 'resolved'
  | 'suppressed';

export type BaselineType =
  | 'communication-frequency'
  | 'data-volume'
  | 'response-time'
  | 'error-rate'
  | 'connection-count'
  | 'protocol-usage'
  | 'load-profile'
  | 'operational-pattern';

// Behavioral baseline interface
export interface BehavioralBaseline {
  id: string;
  tenantId: string;

  // Baseline identification
  name: string;
  description?: string;
  baselineType: BaselineType;

  // Scope definition
  siteId?: string;
  assetId?: string;
  assetType?: string;
  protocol?: TransmissionProtocol;

  // Baseline parameters
  baselineData: Record<string, unknown>; // Statistical baseline data
  learningPeriodDays: number;
  confidenceThreshold: number;

  // Thresholds
  warningThreshold?: number;
  criticalThreshold?: number;

  // Status and metadata
  isActive: boolean;
  lastUpdated: string;
  nextUpdate?: string;
  updateFrequencyHours: number;

  // Training data
  trainingStartDate?: string;
  trainingEndDate?: string;
  sampleCount: number;

  createdAt: string;
  updatedAt: string;
}

// Anomaly signal interface
// Anomaly signal interface merged into Unified AnomalySignal above

// Enums moved to Shared section at the top of the file

// Response playbook interface
// Response playbook interface merged into Unified ResponsePlaybook above

// Playbook step interface
// Playbook step interface merged into Unified PlaybookStep above

// Playbook execution interfaces merged into Unified versions above

// Threat intelligence types
export type ThreatType =
  | 'malware'
  | 'apt-group'
  | 'vulnerability'
  | 'ioc-ip'
  | 'ioc-domain'
  | 'ioc-hash'
  | 'attack-pattern'
  | 'campaign'
  | 'tool'
  | 'infrastructure';

export type ThreatConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type ThreatRelevance =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type FeedStatus =
  | 'active'
  | 'inactive'
  | 'error'
  | 'maintenance';

// Threat intelligence feed interface
export interface ThreatIntelligenceFeed {
  id: string;
  tenantId: string;

  // Feed identification
  name: string;
  description?: string;
  provider: string;
  feedType: string; // 'commercial', 'open-source', 'government', 'internal'

  // Feed configuration
  feedUrl?: string;
  apiEndpoint?: string;
  authenticationMethod?: string; // 'api-key', 'oauth', 'basic-auth', 'none'
  credentials: Record<string, unknown>; // Encrypted credentials

  // Update configuration
  updateFrequencyHours: number;
  lastUpdated?: string;
  nextUpdate?: string;

  // Feed status and health
  status: FeedStatus;
  lastError?: string;
  errorCount: number;

  // Content filtering
  relevanceFilters: Record<string, unknown>;
  transmissionSpecific: boolean;

  // Statistics
  totalIndicators: number;
  activeIndicators: number;

  createdAt: string;
  updatedAt: string;
}

// Threat intelligence indicator interface
export interface ThreatIntelligenceIndicator {
  id: string;
  tenantId: string;
  feedId?: string;

  // Indicator identification
  indicatorValue: string;
  indicatorType: ThreatType;

  // Threat classification
  threatName?: string;
  threatFamily?: string;
  malwareFamily?: string;
  attackPattern?: string;

  // Confidence and relevance
  confidence: ThreatConfidence;
  relevance: ThreatRelevance;
  transmissionRelevanceScore?: number; // 0-100

  // Temporal information
  firstSeen: string;
  lastSeen: string;
  validFrom: string;
  validUntil?: string;

  // Context and attribution
  threatActor?: string;
  campaign?: string;
  targetedSectors: string[];
  targetedTechnologies: string[];

  // Transmission-specific context
  targetsOtSystems: boolean;
  targetsScada: boolean;
  targetsProtocols?: TransmissionProtocol[];
  affectsSafetySystems: boolean;

  // Technical details
  description?: string;
  killChainPhases: string[];
  tactics: string[]; // MITRE ATT&CK tactics
  techniques: string[]; // MITRE ATT&CK techniques

  // Indicators of Compromise (IoCs)
  relatedIocs: Record<string, unknown>;
  networkIndicators: Record<string, unknown>;
  fileIndicators: Record<string, unknown>;

  // Mitigation and response
  mitigationStrategies: string[];
  detectionRules: string[];
  recommendedActions: string[];

  // Correlation and relationships
  relatedIndicators: string[];
  parentCampaignId?: string;

  // Status and lifecycle
  isActive: boolean;
  isFalsePositive: boolean;
  analystNotes?: string;

  // Metadata
  tags: string[];
  customAttributes: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

// Threat intelligence match interface
export interface ThreatIntelligenceMatch {
  id: string;
  tenantId: string;
  indicatorId: string;

  // Match context
  matchType: string; // 'alert', 'log-entry', 'network-traffic', 'file-hash'
  matchSource: string;
  matchTimestamp: string;

  // Matched entity references
  alertId?: string;
  incidentId?: string;
  assetId?: string;

  // Match details
  matchedValue: string;
  matchConfidence: number; // 0.0 to 1.0
  contextData: Record<string, unknown>;

  // Analysis results
  isConfirmed: boolean;
  isFalsePositive: boolean;
  analystAssessment?: string;

  // Response tracking
  actionsTaken: string[];
  responseStatus: string; // 'new', 'investigating', 'responded', 'closed'

  createdAt: string;
  updatedAt: string;
}

// Threat campaign interface
export interface ThreatCampaign {
  id: string;
  tenantId: string;

  // Campaign identification
  name: string;
  aliases: string[];
  description?: string;

  // Attribution
  threatActor?: string;
  suspectedNationState?: string;
  motivation: string[]; // 'financial', 'espionage', 'sabotage', 'activism'

  // Campaign timeline
  firstObserved?: string;
  lastObserved?: string;
  isActive: boolean;

  // Targeting information
  targetedSectors: string[];
  targetedCountries: string[];
  targetedTechnologies: string[];
  transmissionTargeting: boolean;

  // Technical characteristics
  attackVectors: string[];
  toolsUsed: string[];
  techniquesUsed: string[];
  infrastructureUsed: string[];

  // Impact assessment
  estimatedVictims?: number;
  estimatedDamageUsd?: number;
  safetyImpactPotential: boolean;

  // Intelligence sources
  sources: string[];
  confidenceLevel: ThreatConfidence;

  // Analysis
  analystAssessment?: string;
  keyFindings: string[];
  recommendations: string[];

  createdAt: string;
  updatedAt: string;
}

// Impact assessment types
export type ImpactSeverity =
  | 'catastrophic'
  | 'major'
  | 'moderate'
  | 'minor'
  | 'negligible';

export type ImpactCategory =
  | 'operational'
  | 'safety'
  | 'financial'
  | 'regulatory'
  | 'reputational'
  | 'environmental';

export type ImpactAssessmentStatus =
  | 'draft'
  | 'in-progress'
  | 'completed'
  | 'reviewed'
  | 'approved';

export type CascadeType =
  | 'electrical'
  | 'communication'
  | 'control'
  | 'protection'
  | 'operational';

// Impact assessment interface
export interface ImpactAssessment {
  id: string;
  tenantId: string;

  // Assessment identification
  name: string;
  description?: string;
  assessmentType: string; // 'incident', 'alert', 'scenario', 'planned-outage'

  // Source references
  incidentId?: string;
  alertId?: string;

  // Assessment scope
  primarySiteId?: string;
  primaryAssetId?: string;
  primaryGridNodeId?: string;
  primaryGridLineId?: string;

  // Impact classification
  overallSeverity: ImpactSeverity;
  impactCategories: ImpactCategory[];

  // Grid topology analysis
  blastRadiusKm?: number;
  affectedVoltageLevels: string[];
  cascadePotential: boolean;
  isolationPossible: boolean;
  backupPathsAvailable: boolean;

  // Affected infrastructure
  affectedSites: string[];
  affectedAssets: string[];
  affectedGridNodes: string[];
  affectedGridLines: string[];

  // Impact metrics
  customersAffected: number;
  mwAtRisk?: number;
  estimatedOutageDurationHours?: number;
  estimatedRecoveryTimeHours?: number;

  // Financial impact
  estimatedCostUsd?: number;
  revenueLossUsd?: number;
  regulatoryFinesUsd?: number;

  // Safety and environmental impact
  safetyRiskLevel?: number; // 1-5
  environmentalImpact?: string;
  publicSafetyConcern: boolean;

  // Assessment details
  assessmentMethodology?: string;
  assumptions: string[];
  limitations: string[];
  confidenceLevel: number; // 0.0 to 1.0

  // Timeline and status
  status: ImpactAssessmentStatus;
  assessedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;

  assessmentDate: string;
  reviewDate?: string;
  approvalDate?: string;

  // Mitigation and response
  mitigationStrategies: string[];
  contingencyPlans: string[];
  recoveryProcedures: string[];

  // Documentation
  supportingDocuments: string[];
  analysisNotes?: string;
  lessonsLearned?: string;

  createdAt: string;
  updatedAt: string;
}

// Cascade analysis interface
export interface CascadeAnalysis {
  id: string;
  assessmentId: string;
  tenantId: string;

  // Cascade step identification
  cascadeStep: number;
  cascadeType: CascadeType;

  // Source and target
  sourceNodeId?: string;
  sourceLineId?: string;
  sourceAssetId?: string;

  targetNodeId?: string;
  targetLineId?: string;
  targetAssetId?: string;

  // Cascade characteristics
  propagationTimeSeconds?: number;
  probability?: number; // 0.0 to 1.0
  triggerThreshold?: number;

  // Impact details
  loadShedMw?: number;
  customersLost?: number;
  voltageImpact?: number;
  frequencyImpact?: number;

  // Mitigation factors
  protectionSystems: string[];
  automaticControls: string[];
  operatorActions: string[];

  // Analysis metadata
  analysisMethod?: string; // 'power-flow', 'contingency', 'dynamic', 'historical'
  confidenceScore?: number; // 0.0 to 1.0

  createdAt: string;
}

// Impact scenario interface
export interface ImpactScenario {
  id: string;
  tenantId: string;

  // Scenario identification
  name: string;
  description?: string;
  scenarioType: string; // 'cyber-attack', 'equipment-failure', 'natural-disaster', 'human-error'

  // Scenario parameters
  triggerConditions: Record<string, unknown>;
  affectedComponents: Record<string, unknown>;

  // Pre-calculated impacts
  baselineAssessmentId?: string;
  worstCaseCustomers?: number;
  worstCaseMw?: number;
  worstCaseDurationHours?: number;

  // Scenario metadata
  probabilityAnnual?: number; // Annual probability of occurrence
  historicalOccurrences: number;
  lastOccurrence?: string;

  // Response planning
  responsePlaybookId?: string;
  emergencyProcedures: string[];
  stakeholderNotifications: string[];

  // Status
  isActive: boolean;
  lastReviewed?: string;
  nextReview?: string;

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// LOGGING, AUDIT & FORENSICS TYPES FOR POWER TRANSMISSION CYBERSECURITY
// Feature Set 6: Logging, Audit & Forensics
// =============================================================================
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.4

// Configuration change types
export type ConfigurationChangeType =
  | 'asset_config'
  | 'network_config'
  | 'security_policy'
  | 'user_settings'
  | 'system_config';

export type ConfigurationComponentType =
  | 'protection_relay'
  | 'rtu'
  | 'scada_node'
  | 'gateway'
  | 'firewall'
  | 'switch'
  | 'router'
  | 'hmi'
  | 'engineering_station';

export type ConfigurationChangeMethod =
  | 'manual'
  | 'automated'
  | 'script'
  | 'api'
  | 'emergency';

export type ConfigurationChangeSource =
  | 'hmi'
  | 'engineering_station'
  | 'remote_access'
  | 'maintenance_tool'
  | 'scada_system';

export type ValidationStatus =
  | 'pending'
  | 'validated'
  | 'failed'
  | 'bypassed';

export type ImpactLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Configuration change interface
export interface ConfigurationChange {
  id: string;
  tenantId: string;

  // Change identification
  changeType: ConfigurationChangeType;
  componentType: ConfigurationComponentType;
  componentId: string;
  componentName?: string;

  // Asset context
  assetId?: string;
  zoneId?: string;
  siteId?: string;

  // Change details
  configurationPath: string;
  parameterName: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changeReason?: string;

  // Change metadata
  changeMethod?: ConfigurationChangeMethod;
  changeSource?: ConfigurationChangeSource;
  protocolUsed?: string;

  // Approval and validation
  requiresApproval: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
  validationStatus: ValidationStatus;
  validationErrors?: string[];

  // Impact assessment
  safetyImpact?: ImpactLevel;
  operationalImpact?: ImpactLevel;
  securityImpact?: ImpactLevel;
  affectedSystems?: string[];

  // Rollback information
  rollbackPossible: boolean;
  rollbackProcedure?: string;
  rollbackExecuted: boolean;
  rollbackTimestamp?: string;
  rollbackBy?: string;

  // User and timing
  changedBy: string;
  changeTimestamp: string;

  // Audit correlation
  auditLogId?: string;

  createdAt: string;
  updatedAt: string;
}

// Log correlation rule interface
export interface LogCorrelationRule {
  id: string;
  tenantId: string;

  // Rule identification
  name: string;
  description?: string;

  // Correlation criteria
  eventPattern: Record<string, unknown>;
  timeWindowMinutes: number;
  correlationKey: string;

  // Rule configuration
  minimumEvents: number;
  maximumEvents: number;
  severityThreshold: string;

  // Actions
  createIncident: boolean;
  escalateSeverity: boolean;
  notifyUsers: string[];

  // Rule status
  active: boolean;
  priority: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Audit log aggregation interface
export interface AuditLogAggregation {
  id: string;
  tenantId: string;

  // Aggregation period
  periodStart: string;
  periodEnd: string;
  aggregationType: 'hourly' | 'daily' | 'weekly';

  // Aggregated metrics
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  uniqueUsers: number;
  uniqueAssets: number;

  // Risk metrics
  highRiskEvents: number;
  failedAuthentications: number;
  policyViolations: number;
  configurationChanges: number;

  // Performance metrics
  avgProcessingTimeMs?: number;
  maxProcessingTimeMs?: number;

  createdAt: string;
}

// Log retention and archival types
export type ArchivalJobType =
  | 'archive'
  | 'purge'
  | 'export'
  | 'compress';

export type ArchivalJobStatus =
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused';

export type StorageType =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'archive'
  | 'glacier';

export type StorageAccessTier =
  | 'instant'
  | 'standard'
  | 'bulk';

export type StorageStatus =
  | 'active'
  | 'full'
  | 'readonly'
  | 'offline';

// Log archival job interface
export interface LogArchivalJob {
  id: string;
  tenantId: string;

  // Job identification
  jobName: string;
  jobType: ArchivalJobType;

  // Job configuration
  retentionPolicyId: string;
  scheduleCron: string;

  // Job criteria
  dateThreshold?: string;
  recordCountThreshold?: number;
  sizeThresholdMb?: number;

  // Job status
  status: ArchivalJobStatus;
  lastRun?: string;
  nextRun?: string;

  // Job results
  recordsProcessed: number;
  recordsArchived: number;
  recordsPurged: number;
  sizeProcessedMb: number;

  // Error handling
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // Performance tracking
  executionTimeSeconds?: number;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Log storage location interface
export interface LogStorageLocation {
  id: string;
  tenantId: string;

  // Storage identification
  name: string;
  storageType: StorageType;

  // Storage configuration
  storagePath: string;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;

  // Capacity and limits
  maxSizeGb?: number;
  currentSizeGb: number;
  maxRetentionDays?: number;

  // Access configuration
  accessTier: StorageAccessTier;
  readOnly: boolean;

  // Status
  status: StorageStatus;

  createdAt: string;
  updatedAt: string;
}

// Archived audit log interface
export interface ArchivedAuditLog {
  id: string;
  tenantId: string;

  // Original log reference
  originalLogId: string;

  // Archive metadata
  storageLocationId: string;
  archiveTimestamp: string;
  archivedBy: string;

  // Compressed log data
  logData: Record<string, unknown>;
  compressedSizeBytes?: number;
  originalSizeBytes?: number;
  compressionRatio?: number;

  // Retrieval tracking
  retrievalCount: number;
  lastRetrieved?: string;

  // Retention
  retentionUntil: string;
  purgeEligible: boolean;

  createdAt: string;
}

// File integrity monitoring types
export type FileIntegritySystemType =
  | 'protection_relay'
  | 'rtu'
  | 'scada_node'
  | 'gateway'
  | 'hmi'
  | 'engineering_station';

export type FileIntegrityFileType =
  | 'configuration'
  | 'firmware'
  | 'logic'
  | 'parameter'
  | 'certificate'
  | 'key'
  | 'script';

export type FileIntegrityStatus =
  | 'intact'
  | 'modified'
  | 'missing'
  | 'unknown'
  | 'error';

export type FileIntegrityCriticality =
  | 'safety-critical'
  | 'high'
  | 'medium'
  | 'low';

export type FileIntegrityViolationType =
  | 'unauthorized_modification'
  | 'unexpected_deletion'
  | 'hash_mismatch'
  | 'size_change'
  | 'permission_change';

export type FileIntegrityChangeMagnitude =
  | 'minor'
  | 'moderate'
  | 'major'
  | 'critical';

export type FileIntegrityInvestigationStatus =
  | 'new'
  | 'investigating'
  | 'authorized'
  | 'unauthorized'
  | 'false_positive'
  | 'resolved';

// File integrity monitor interface
export interface FileIntegrityMonitor {
  id: string;
  tenantId: string;

  // Monitor identification
  monitorName: string;
  description?: string;

  // Target system
  assetId?: string;
  systemType: FileIntegritySystemType;
  systemName: string;
  zoneId?: string;
  siteId?: string;

  // File/configuration path
  filePath: string;
  fileType: FileIntegrityFileType;

  // Baseline information
  baselineHash: string;
  baselineSizeBytes: number;
  baselineTimestamp: string;
  baselineVersion?: string;

  // Current state
  currentHash?: string;
  currentSizeBytes?: number;
  lastChecked?: string;
  integrityStatus: FileIntegrityStatus;

  // Monitoring configuration
  checkFrequencyMinutes: number;
  alertOnChange: boolean;
  autoRestore: boolean;

  // Criticality
  criticality: FileIntegrityCriticality;
  safetyRelated: boolean;

  // Status
  monitoringEnabled: boolean;
  lastAlertTimestamp?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// File integrity violation interface
export interface FileIntegrityViolation {
  id: string;
  tenantId: string;

  // Monitor reference
  monitorId: string;

  // Violation details
  violationType: FileIntegrityViolationType;
  detectedTimestamp: string;

  // File state at detection
  expectedHash: string;
  actualHash?: string;
  expectedSizeBytes: number;
  actualSizeBytes?: number;

  // Change details
  changeDescription?: string;
  changeMagnitude?: FileIntegrityChangeMagnitude;

  // Context
  lastKnownGoodTimestamp?: string;
  potentialChangeWindowStart?: string;
  potentialChangeWindowEnd?: string;

  // Investigation
  investigationStatus: FileIntegrityInvestigationStatus;
  investigatedBy?: string;
  investigationNotes?: string;
  resolutionTimestamp?: string;

  // Response actions
  alertGenerated: boolean;
  incidentCreated: boolean;
  incidentId?: string;
  autoRestoreAttempted: boolean;
  restoreSuccessful?: boolean;

  // Risk assessment
  riskScore: number;
  safetyImpact?: ImpactLevel;
  operationalImpact?: ImpactLevel;
  securityImpact?: ImpactLevel;

  createdAt: string;
  updatedAt: string;
}

// File integrity baseline interface
export interface FileIntegrityBaseline {
  id: string;
  tenantId: string;

  // Monitor reference
  monitorId: string;

  // Baseline version
  versionNumber: number;
  versionLabel?: string;

  // File snapshot
  fileHash: string;
  fileSizeBytes: number;
  fileContentSample?: string;

  // Metadata
  createdTimestamp: string;
  createdBy: string;
  changeReason?: string;
  approvedBy?: string;

  // Status
  isActive: boolean;
  isApproved: boolean;

  createdAt: string;
}

// File integrity check history interface
export interface FileIntegrityCheckHistory {
  id: string;
  tenantId: string;

  // Monitor reference
  monitorId: string;

  // Check details
  checkTimestamp: string;
  checkResult: 'pass' | 'fail' | 'error' | 'skipped';

  // File state
  fileHash?: string;
  fileSizeBytes?: number;
  fileExists?: boolean;

  // Performance
  checkDurationMs?: number;

  // Error handling
  errorMessage?: string;

  createdAt: string;
}

// Forensic snapshot types
export type ForensicSnapshotType =
  | 'incident_response'
  | 'scheduled'
  | 'manual'
  | 'triggered'
  | 'compliance';

export type ForensicSnapshotScope =
  | 'full'
  | 'configuration'
  | 'logs'
  | 'network'
  | 'process'
  | 'memory';

export type ForensicSnapshotStatus =
  | 'pending'
  | 'capturing'
  | 'completed'
  | 'failed'
  | 'partial';

export type ForensicComponentType =
  | 'configuration_file'
  | 'log_file'
  | 'process_list'
  | 'network_connections'
  | 'memory_dump'
  | 'registry'
  | 'event_log';

export type ForensicComponentStatus =
  | 'pending'
  | 'collected'
  | 'failed'
  | 'skipped';

export type ForensicAnalysisType =
  | 'timeline'
  | 'root_cause'
  | 'impact'
  | 'attribution'
  | 'malware';

export type ForensicAnalysisStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned';

export type ForensicEvidenceType =
  | 'log_entry'
  | 'file'
  | 'network_packet'
  | 'memory_artifact'
  | 'configuration'
  | 'screenshot';

export type ForensicEvidenceSignificance =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type ForensicRequestType =
  | 'immediate'
  | 'scheduled'
  | 'recurring';

export type ForensicRequestPriority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type ForensicRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'failed';

// Custody chain entry interface
export interface CustodyChainEntry {
  timestamp: string;
  custodianId?: string;
  fromCustodianId?: string;
  toCustodianId?: string;
  action: string;
  notes?: string;
}

// Forensic snapshot database interface
export interface ForensicSnapshotDb {
  id: string;
  tenantId: string;

  // Snapshot identification
  snapshotName: string;
  snapshotType: ForensicSnapshotType;

  // Trigger context
  triggerReason: string;
  triggeredByUser?: string;
  triggeredByAlert?: string;
  triggeredByIncident?: string;

  // Target system
  assetId?: string;
  systemType?: string;
  systemName?: string;
  zoneId?: string;
  siteId?: string;

  // Snapshot scope
  scope: ForensicSnapshotScope;

  // Snapshot timing
  captureStart: string;
  captureEnd?: string;
  captureDurationSeconds?: number;

  // Snapshot status
  status: ForensicSnapshotStatus;
  completionPercentage: number;

  // Data collection
  totalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio?: number;
  fileCount: number;

  // Storage
  storageLocation?: string;
  storagePath?: string;
  encryptionEnabled: boolean;
  encryptionKeyId?: string;

  // Chain of custody
  custodyChain: CustodyChainEntry[];
  currentCustodian?: string;

  // Integrity
  snapshotHash?: string;
  integrityVerified: boolean;
  lastIntegrityCheck?: string;

  // Retention
  retentionUntil?: string;
  legalHold: boolean;
  legalHoldReason?: string;

  // Investigation linkage
  investigationId?: string;
  caseNumber?: string;

  // Metadata
  captureMethod?: string;
  captureTool?: string;
  captureToolVersion?: string;

  // Error handling
  errorMessage?: string;
  warnings?: string[];

  createdAt: string;
  updatedAt: string;
}

// Forensic snapshot component database interface
export interface ForensicSnapshotComponentDb {
  id: string;
  tenantId: string;

  // Snapshot reference
  snapshotId: string;

  // Component identification
  componentType: ForensicComponentType;
  componentName: string;
  componentPath?: string;

  // Component data
  dataSizeBytes?: number;
  dataHash?: string;
  dataContent?: Record<string, unknown>;
  dataReference?: string;

  // Collection details
  collectionTimestamp: string;
  collectionStatus: ForensicComponentStatus;
  collectionError?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  createdAt: string;
}

// Forensic analysis session interface
export interface ForensicAnalysisSession {
  id: string;
  tenantId: string;

  // Session identification
  sessionName: string;

  // Snapshot reference
  snapshotId: string;

  // Analyst information
  analystId: string;
  analystRole?: string;

  // Session timing
  sessionStart: string;
  sessionEnd?: string;

  // Analysis details
  analysisType?: ForensicAnalysisType;
  analysisTools?: string[];

  // Findings
  findings: Record<string, unknown>[];
  indicatorsOfCompromise: Record<string, unknown>[];
  timelineEvents: Record<string, unknown>[];

  // Conclusions
  summary?: string;
  rootCause?: string;
  recommendations?: string[];

  // Status
  status: ForensicAnalysisStatus;

  // Chain of custody
  accessedComponents?: string[];
  modificationsMade?: string[];

  createdAt: string;
  updatedAt: string;
}

// Forensic evidence item interface
export interface ForensicEvidenceItem {
  id: string;
  tenantId: string;

  // Evidence identification
  evidenceNumber: string;
  evidenceType: ForensicEvidenceType;

  // Source
  snapshotId: string;
  componentId?: string;

  // Evidence details
  description: string;
  significance?: ForensicEvidenceSignificance;

  // Evidence data
  evidenceData?: Record<string, unknown>;
  evidenceFileReference?: string;
  evidenceHash?: string;

  // Context
  timestampOfEvidence?: string;
  relatedEvents?: string[];

  // Chain of custody
  collectedBy: string;
  collectionTimestamp: string;
  custodyLog: CustodyChainEntry[];

  // Legal considerations
  admissible: boolean;
  legalHold: boolean;

  // Analysis linkage
  analysisSessionId?: string;
  incidentId?: string;

  createdAt: string;
  updatedAt: string;
}

// Forensic snapshot request interface
export interface ForensicSnapshotRequest {
  id: string;
  tenantId: string;

  // Request details
  requestType: ForensicRequestType;
  priority: ForensicRequestPriority;

  // Target
  targetAssetId?: string;
  targetSystemType?: string;
  targetScope: ForensicSnapshotScope;

  // Requester
  requestedBy: string;
  requestReason: string;
  requestTimestamp: string;

  // Approval
  requiresApproval: boolean;
  approvedBy?: string;
  approvalTimestamp?: string;
  approvalNotes?: string;

  // Execution
  status: ForensicRequestStatus;
  snapshotId?: string;
  executionTimestamp?: string;

  // Scheduling (for recurring requests)
  scheduleCron?: string;
  nextExecution?: string;

  createdAt: string;
  updatedAt: string;
}

// Log search and analysis types
export interface LogSearchQuery {
  tenantId: string;

  // Search criteria
  searchText?: string;
  eventTypes?: string[];
  severities?: string[];
  outcomes?: string[];

  // Time range
  startTime?: string;
  endTime?: string;

  // Filters
  userIds?: string[];
  assetIds?: string[];
  zoneIds?: string[];
  siteIds?: string[];

  // Advanced filters
  riskScoreMin?: number;
  riskScoreMax?: number;
  correlationId?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LogSearchResult {
  logs: SecurityAuditLogEntry[];
  totalCount: number;
  aggregations?: {
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byOutcome: Record<string, number>;
    byUser: Record<string, number>;
    byAsset: Record<string, number>;
  };
}

export interface LogAnalysisMetrics {
  tenantId: string;
  timeRange: {
    start: string;
    end: string;
  };

  // Event counts
  totalEvents: number;
  criticalEvents: number;
  highRiskEvents: number;
  failedAuthentications: number;
  policyViolations: number;
  configurationChanges: number;

  // User activity
  activeUsers: number;
  topUsers: Array<{
    userId: string;
    eventCount: number;
  }>;

  // Asset activity
  affectedAssets: number;
  topAssets: Array<{
    assetId: string;
    eventCount: number;
  }>;

  // Trends
  eventTrend: Array<{
    timestamp: string;
    count: number;
  }>;

  // Anomalies
  anomalousPatterns: Array<{
    pattern: string;
    count: number;
    severity: string;
  }>;
}

// ===== PLATFORM & DATA PROTECTION TYPES FOR POWER TRANSMISSION =====
// Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.4

// Data classification level enum
export type DataClassificationLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'critical';

// Data protection measure type enum
export type DataProtectionMeasureType =
  | 'encryption-at-rest'
  | 'encryption-in-transit'
  | 'access-control'
  | 'data-masking'
  | 'tokenization'
  | 'backup'
  | 'retention-policy'
  | 'deletion-policy';

// Protection measure status enum
export type ProtectionMeasureStatus =
  | 'active'
  | 'inactive'
  | 'degraded'
  | 'failed';

// Data protection policy interface
export interface DataProtectionPolicy {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  dataCategory: string;
  classificationLevel: DataClassificationLevel;
  protectionMeasures: DataProtectionMeasureType[];
  encryptionRequired: boolean;
  encryptionAlgorithm?: string;
  keyRotationDays?: number;
  backupRequired: boolean;
  backupFrequencyHours?: number;
  retentionDays: number;
  accessControlRequired: boolean;
  allowedRoles: TransmissionRole[];
  allowedZones?: string[];
  complianceStandards: string[];
  status: ProtectionMeasureStatus;
  violationCount: number;
  complianceScore?: number;
  lastAssessment?: string;
  nextAssessment?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Data protection violation interface
export interface DataProtectionViolation {
  id: string;
  tenantId: string;
  policyId: string;
  policyName: string;
  violationType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  dataCategory: string;
  affectedRecords: number;
  violationDescription: string;
  detectedAt: string;
  detectedBy: string;
  status: 'open' | 'investigating' | 'resolved' | 'accepted';
  remediationAction?: string;
  remediatedBy?: string;
  remediatedAt?: string;
  complianceImpact?: string[];
  createdAt: string;
  updatedAt: string;
}

// Encryption key type enum
export type EncryptionKeyType =
  | 'symmetric'
  | 'asymmetric-public'
  | 'asymmetric-private'
  | 'master-key'
  | 'data-encryption-key'
  | 'key-encryption-key';

// Key algorithm enum
export type KeyAlgorithm =
  | 'AES-256'
  | 'AES-128'
  | 'RSA-2048'
  | 'RSA-4096'
  | 'ECC-P256'
  | 'ECC-P384';

// Key status enum
export type KeyStatus =
  | 'active'
  | 'inactive'
  | 'compromised'
  | 'expired'
  | 'pending-rotation'
  | 'archived';

// Key usage type enum
export type KeyUsageType =
  | 'data-encryption'
  | 'key-encryption'
  | 'signing'
  | 'authentication'
  | 'protocol-encryption';

// Encryption key interface
export interface EncryptionKey {
  id: string;
  tenantId: string;
  keyName: string;
  description?: string;
  keyType: EncryptionKeyType;
  algorithm: KeyAlgorithm;
  keyLength: number;
  keyId: string;
  keyFingerprint: string;
  status: KeyStatus;
  usageType: KeyUsageType;
  createdDate: string;
  activatedDate?: string;
  expirationDate?: string;
  lastRotated?: string;
  rotationIntervalDays: number;
  nextRotation?: string;
  usageCount: number;
  lastUsed?: string;
  usedByServices: string[];
  usedByAssets: string[];
  protectedDataCategories: string[];
  complianceStandards: string[];
  accessRoles: TransmissionRole[];
  requiresHsm: boolean;
  hsmLocation?: string;
  backupExists: boolean;
  backupLocation?: string;
  auditTrail: KeyAuditEntry[];
  createdBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Key audit entry interface
export interface KeyAuditEntry {
  id: string;
  timestamp: string;
  operation: 'created' | 'activated' | 'used' | 'rotated' | 'deactivated' | 'compromised' | 'archived';
  performedBy: string;
  details?: string;
  previousStatus?: KeyStatus;
  newStatus?: KeyStatus;
}

// Key rotation history interface
export interface KeyRotationHistory {
  id: string;
  tenantId: string;
  keyId: string;
  keyName: string;
  rotationType: 'scheduled' | 'manual' | 'emergency' | 'compliance';
  oldKeyFingerprint: string;
  newKeyFingerprint: string;
  rotationReason?: string;
  rotationRequestedAt: string;
  rotationCompletedAt?: string;
  requestedBy: string;
  completedBy?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
  errorMessage?: string;
  affectedServices: string[];
  affectedAssets: string[];
  downtime?: number;
  rollbackPlan?: string;
  createdAt: string;
  updatedAt: string;
}

// Workload type enum
export type WorkloadType =
  | 'application'
  | 'database'
  | 'web_server'
  | 'api_service'
  | 'scada_interface'
  | 'data_processor'
  | 'historian'
  | 'hmi_server'
  | 'communication_gateway';

// Deployment environment enum
export type DeploymentEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'test'
  | 'disaster_recovery';

// Deployment platform enum
export type DeploymentPlatform =
  | 'kubernetes'
  | 'docker'
  | 'vm'
  | 'bare_metal'
  | 'serverless';

// Workload status enum
export type WorkloadStatus =
  | 'active'
  | 'inactive'
  | 'maintenance'
  | 'deprecated';

// Health status enum
export type HealthStatus =
  | 'healthy'
  | 'degraded'
  | 'critical'
  | 'offline';

// Hardening level enum
export type HardeningLevel =
  | 'minimal'
  | 'standard'
  | 'enhanced'
  | 'maximum';

// Hardening profile enum
export type HardeningProfile =
  | 'cis_benchmark'
  | 'stig'
  | 'nist_800_53'
  | 'iec_62443';

// Patch level enum
export type PatchLevel =
  | 'current'
  | 'outdated'
  | 'critical_missing'
  | 'unknown';

// Workload security interface
export interface WorkloadSecurity {
  id: string;
  tenantId: string;
  workloadName: string;
  workloadType: WorkloadType;
  workloadDescription?: string;
  deploymentEnvironment: DeploymentEnvironment;
  deploymentPlatform: DeploymentPlatform;
  deploymentLocation?: string;
  status: WorkloadStatus;
  healthStatus: HealthStatus;
  securityBaselineId: string;
  baselineVersion: string;
  baselineComplianceStatus: ComplianceStatus;
  baselineComplianceScore: number; // 0-100
  lastBaselineAssessment?: string;
  hardeningLevel: HardeningLevel;
  hardeningProfile?: HardeningProfile;
  hardeningApplied: boolean;
  hardeningDate?: string;
  hardeningStandards: string[];
  osType?: string;
  osVersion?: string;
  osHardeningEnabled: boolean;
  osHardeningControls: string[];
  firewallEnabled: boolean;
  firewallRulesCount: number;
  antivirusEnabled: boolean;
  antivirusUpdated: boolean;
  antivirusLastScan?: string;
  sshEnabled: boolean;
  sshKeyOnly: boolean;
  rdpEnabled: boolean;
  privilegedAccessRestricted: boolean;
  networkSegmentationEnabled: boolean;
  allowedInboundPorts: number[];
  allowedOutboundPorts: number[];
  networkEncryptionEnabled: boolean;
  patchLevel: PatchLevel;
  lastPatchedDate?: string;
  pendingPatchesCount: number;
  criticalPatchesPending: number;
  autoPatchingEnabled: boolean;
  vulnerabilityScanEnabled: boolean;
  lastVulnerabilityScan?: string;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  configurationManagementEnabled: boolean;
  configurationDriftDetected: boolean;
  lastConfigurationCheck?: string;
  loggingEnabled: boolean;
  logForwardingEnabled: boolean;
  logDestination?: string;
  monitoringAgentInstalled: boolean;
  monitoringAgentVersion?: string;
  complianceFrameworks: string[];
  lastAuditDate?: string;
  nextAuditDate?: string;
  auditFindingsCount: number;
  ownerUserId?: string;
  securityContact?: string;
  technicalContact?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Application type enum
export type ApplicationType =
  | 'web_application'
  | 'api_service'
  | 'mobile_app'
  | 'desktop_app'
  | 'scada_hmi'
  | 'data_analytics';

// Scan type enum
export type ScanType =
  | 'sast'
  | 'dast'
  | 'sca'
  | 'container_scan'
  | 'dependency_scan'
  | 'penetration_test';

// Scan status enum
export type ScanStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Security grade enum
export type SecurityGrade =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'F';

// Score trend enum
export type ScoreTrend =
  | 'improving'
  | 'stable'
  | 'declining';

// Risk level enum
// RiskLevel moved to Shared section

// Scan scope enum
export type ScanScope =
  | 'full'
  | 'incremental'
  | 'targeted';

// Scan depth enum
export type ScanDepth =
  | 'shallow'
  | 'standard'
  | 'deep';

// Application security scan interface
export interface ApplicationSecurityScan {
  id: string;
  tenantId: string;
  applicationName: string;
  applicationType: ApplicationType;
  applicationDescription?: string;
  applicationVersion?: string;
  deploymentEnvironment: DeploymentEnvironment;
  deploymentUrl?: string;
  repositoryUrl?: string;
  scanId: string;
  scanType: ScanType;
  scanTool: string;
  scanStatus: ScanStatus;
  scanStartedAt?: string;
  scanCompletedAt?: string;
  scanDurationSeconds?: number;
  scanTriggeredBy: string;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;
  securityScore?: number; // 0-100
  securityGrade?: SecurityGrade;
  previousSecurityScore?: number;
  scoreTrend?: ScoreTrend;
  injectionVulnerabilities: number;
  authenticationVulnerabilities: number;
  authorizationVulnerabilities: number;
  cryptographyVulnerabilities: number;
  configurationVulnerabilities: number;
  dependencyVulnerabilities: number;
  owaspTop10Violations: number;
  cweTop25Violations: number;
  pciDssViolations: number;
  hipaaViolations: number;
  linesOfCode?: number;
  codeCoveragePercent?: number;
  technicalDebtHours?: number;
  codeSmells: number;
  findingsResolved: number;
  findingsInProgress: number;
  findingsOpen: number;
  findingsAcceptedRisk: number;
  findingsFalsePositive: number;
  overallRiskLevel: RiskLevel;
  exploitabilityScore?: number; // 0.0-10.0
  impactScore?: number; // 0.0-10.0
  scanScope?: ScanScope;
  scanDepth?: ScanDepth;
  scanConfiguration?: Record<string, unknown>;
  findingsSummary?: Record<string, unknown>;
  scanReportUrl?: string;
  scanReportPath?: string;
  applicationOwner?: string;
  securityContact?: string;
  developmentTeam?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Application security finding interface
export interface ApplicationSecurityFinding {
  id: string;
  tenantId: string;
  scanId: string;
  applicationName: string;
  findingType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  cweId?: string;
  owaspCategory?: string;
  cvssScore?: number;
  exploitability?: number;
  impact?: number;
  affectedComponent: string;
  affectedFile?: string;
  affectedLineNumber?: number;
  codeSnippet?: string;
  recommendation: string;
  remediationEffort?: string;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk' | 'false-positive';
  assignedTo?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  acceptanceReason?: string;
  falsePositiveReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Platform data protection summary interface
export interface PlatformDataProtectionSummary {
  tenantId: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  totalPolicies: number;
  activePolicies: number;
  violationCount: number;
  criticalViolations: number;
  highViolations: number;
  encryptionCoverage: number; // 0-100 percentage
  backupCoverage: number; // 0-100 percentage
  accessControlCoverage: number; // 0-100 percentage
  complianceScore: number; // 0-100
  lastAssessment: string;
  nextAssessment?: string;
  dataCategories: Array<{
    category: string;
    classificationLevel: DataClassificationLevel;
    recordCount: number;
    protectionStatus: 'protected' | 'partial' | 'unprotected';
  }>;
  topViolations: Array<{
    policyName: string;
    violationCount: number;
    severity: string;
  }>;
}

// Encryption key management summary interface
export interface EncryptionKeyManagementSummary {
  tenantId: string;
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  pendingRotationKeys: number;
  compromisedKeys: number;
  keysByType: Record<KeyUsageType, number>;
  keysByAlgorithm: Record<KeyAlgorithm, number>;
  averageKeyAge: number; // days
  oldestKeyAge: number; // days
  keysRequiringRotation: number;
  keysWithoutBackup: number;
  hsmProtectedKeys: number;
  complianceScore: number; // 0-100
  lastAudit?: string;
  nextAudit?: string;
}

// Workload security summary interface
export interface WorkloadSecuritySummary {
  tenantId: string;
  totalWorkloads: number;
  healthyWorkloads: number;
  degradedWorkloads: number;
  criticalWorkloads: number;
  offlineWorkloads: number;
  averageComplianceScore: number; // 0-100
  workloadsWithCriticalVulnerabilities: number;
  workloadsWithPendingPatches: number;
  workloadsWithConfigDrift: number;
  hardeningCoverage: number; // 0-100 percentage
  monitoringCoverage: number; // 0-100 percentage
  workloadsByEnvironment: Record<DeploymentEnvironment, number>;
  workloadsByType: Record<WorkloadType, number>;
  lastAssessment: string;
  nextAssessment?: string;
}

// Application security summary interface
export interface ApplicationSecuritySummary {
  tenantId: string;
  totalApplications: number;
  scannedApplications: number;
  unscannedApplications: number;
  averageSecurityScore: number; // 0-100
  applicationsWithCriticalFindings: number;
  applicationsWithHighFindings: number;
  totalOpenFindings: number;
  criticalOpenFindings: number;
  highOpenFindings: number;
  averageRemediationTime: number; // days
  scanCoverage: number; // 0-100 percentage
}
// Final cleanup of duplicated sections
