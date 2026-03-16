# Security Feature Area - Design Document (Upstream Oil & Gas)

## Overview

The Security feature area provides comprehensive cybersecurity management capabilities for upstream oil & gas operations within the Plant4.0 platform. It implements 45 features organized into 7 feature sets, following the nLVE (Navigate → List → View → Edit) pattern with a 3-column layout (MenuPane, ListPane, WorkPane).

The design is optimized for upstream O&G contexts including:
- **Sites**: Well pads, offshore platforms, CPF/GPF, pipeline stations, gathering stations
- **Assets**: Wellhead PLCs, RTUs, SIS, DCS, SCADA, pipeline valves, compressors
- **Standards**: API 1164, IEC 62443, NIST CSF, NIST 800-82
- **Threats**: Valve manipulation, pressure anomalies, SIS trips, unauthorized remote access
- **Zones**: Field, Control, SIS, DMZ, Corporate network segmentation

## Architecture

### Component Structure

```
src/
├── pages/
│   └── security/
│       ├── posture/
│       │   ├── SecurityOverviewDashboard.tsx
│       │   ├── PostureBySite.tsx
│       │   ├── ControlCoverageView.tsx
│       │   ├── RiskComplianceSummary.tsx
│       │   └── VendorAdvisorSummary.tsx
│       ├── identity/
│       │   ├── UserRoleDirectory.tsx
│       │   ├── AccessPolicies.tsx
│       │   ├── PrivilegedAccessControls.tsx
│       │   ├── DirectorySsoIntegration.tsx
│       │   ├── IdentityAccessLogs.tsx
│       │   ├── ApiKeysServicePrincipals.tsx
│       │   ├── MfaSessionRules.tsx
│       │   └── SecretsCertificatesVault.tsx
│       ├── ot/
│       │   ├── ZoneConduitModel.tsx
│       │   ├── OtAssetInventory.tsx
│       │   ├── GatewayAgentPosture.tsx
│       │   ├── EndpointBaselines.tsx
│       │   ├── RemoteAccessSessions.tsx
│       │   ├── EncryptionProtocolPolicy.tsx
│       │   ├── IotFieldDeviceSecurity.tsx
│       │   └── NetworkExposureView.tsx
│       ├── compliance/
│       │   ├── SecurityStandardsScope.tsx
│       │   ├── SecurityControlLibrary.tsx
│       │   ├── SecurityPolicyRegister.tsx
│       │   ├── ExceptionsWaivers.tsx
│       │   ├── AuditReadinessView.tsx
│       │   └── RiskRegister.tsx
│       ├── threats/
│       │   ├── SecurityAlertInbox.tsx
│       │   ├── IncidentCases.tsx
│       │   ├── AnomalySignals.tsx
│       │   ├── ResponsePlaybooks.tsx
│       │   ├── BasicSoarActions.tsx
│       │   ├── ThreatIntelligence.tsx
│       │   └── ImpactBlastRadius.tsx
│       ├── logging/
│       │   ├── SecurityAuditLog.tsx
│       │   ├── ConfigChangeHistory.tsx
│       │   ├── CentralLogExplorer.tsx
│       │   ├── LogRetentionSettings.tsx
│       │   ├── FileConfigIntegrity.tsx
│       │   └── ForensicSnapshots.tsx
│       └── platform/
│           ├── PlatformDataProtection.tsx
│           ├── EncryptionKeyManagement.tsx
│           ├── BackupRecoveryConfig.tsx
│           ├── WorkloadSecurityHardening.tsx
│           └── ApplicationSecurityStatus.tsx
├── data/
│   ├── mockData.ts (extended with upstream O&G security data)
│   └── upstreamSecurityData.ts (new file for upstream-specific data)
└── types/
    └── security.ts (security-specific TypeScript interfaces)
```

### Navigation Structure

The Security feature area is organized into 7 feature sets with 45 total features:

**Security (CS)**
- **Posture & Dashboards** (5 features)
  - 1.1 Security Overview Dashboard → /security/posture/overview
  - 1.2 Posture by Site / Facility → /security/posture/sites
  - 1.3 Control Coverage View → /security/posture/controls
  - 1.4 Risk & Compliance Summary → /security/posture/risk-compliance
  - 1.5 Vendor / Advisor Security Summary → /security/posture/vendor-advisor
- **Identity & Access** (8 features)
  - 2.1 User & Role Directory → /security/identity/users
  - 2.2 Access Policies & Scopes → /security/identity/policies
  - 2.3 Privileged Access Controls → /security/identity/privileged
  - 2.4 Directory & SSO Integration → /security/identity/sso
  - 2.5 Identity & Access Logs → /security/identity/logs
  - 2.6 API Keys & Service Principals → /security/identity/api-keys
  - 2.7 MFA, Session & Token Rules → /security/identity/mfa-sessions
  - 2.8 Secrets & Certificates Vault View → /security/identity/secrets
- **OT/IoT Security** (8 features)
  - 3.1 Zone & Conduit Model → /security/ot/zones
  - 3.2 OT Asset Inventory & Criticality → /security/ot/ot-inventory
  - 3.3 Gateway & Agent Security Posture → /security/ot/gateways
  - 3.4 Endpoint Baselines & Compliance → /security/ot/baselines
  - 3.5 Remote Access & Session View → /security/ot/remote-sessions
  - 3.6 Encryption & Protocol Policy → /security/ot/protocol-policy
  - 3.7 IoT / Field Device Security Posture → /security/ot/iot-security
  - 3.8 Network Exposure View → /security/ot/exposure
- **Compliance & Governance** (6 features)
  - 4.1 Standards & Applicable Scope → /security/compliance/standards
  - 4.2 Security Control Library → /security/compliance/controls
  - 4.3 Security Policy Register → /security/compliance/policies
  - 4.4 Exceptions & Waivers → /security/compliance/exceptions
  - 4.5 Audit Readiness View → /security/compliance/audit
  - 4.6 Risk Register → /security/compliance/risks
- **Threats & Incidents** (7 features)
  - 5.1 Security Alert Inbox → /security/threats/alerts
  - 5.2 Incident Cases → /security/threats/incidents
  - 5.3 Anomaly Signals → /security/threats/anomalies
  - 5.4 Response Playbooks → /security/threats/playbooks
  - 5.5 Basic SOAR Actions → /security/threats/soar
  - 5.6 Threat Intelligence Integration → /security/threats/intel
  - 5.7 Impact & Blast Radius View → /security/threats/impact
- **Logging & Forensics** (6 features)
  - 6.1 Security Audit Log → /security/logging/audit-log
  - 6.2 Configuration & Asset Change History → /security/logging/config-history
  - 6.3 Central Log Explorer → /security/logging/log-explorer
  - 6.4 Log Retention & Export Settings → /security/logging/retention
  - 6.5 File & Config Integrity Monitoring → /security/logging/integrity
  - 6.6 Forensic Snapshots → /security/logging/snapshots
- **Platform Protection** (5 features)
  - 7.1 Platform Data Protection Overview → /security/platform/data-protection
  - 7.2 Platform Encryption & Key Mgmt View → /security/platform/encryption
  - 7.3 Backup & Recovery Configuration → /security/platform/backups
  - 7.4 Workload Security & Hardening → /security/platform/workloads
  - 7.5 Platform Application Security Status → /security/platform/app-security


## Components and Interfaces

### Common Layout Pattern (nLVE)

All 45 security features follow the nLVE pattern:

**ListPane (Middle Column)**
- Displays upstream-relevant groupings (sites, zones, assets, incidents, policies)
- Includes columns echoing upstream context:
  - Site type (Platform / Well Pad / CPF / Pipeline Station)
  - Asset criticality (Safety-Critical, Production-Critical)
  - Zone (Field / Control / SIS / DMZ / Corporate)
  - Severity/status where applicable
- Provides filters (site type, severity, zone, role, etc.)
- Supports search functionality

**WorkPane (Right Column)**
- Empty state: "Select a [site/policy/incident] to view details"
- When selected, shows:
  - Header with upstream-specific info (site type, field, basin)
  - Cards/tabs/tables reflecting upstream operator perspective
  - Related data (OT assets, remote sessions, controls, alerts)
- Uses tabs for multi-aspect views (Details / Related Alerts / Audit Trail / Impact)

### Key Component Designs

#### 1. Security Overview Dashboard (1.1)
**Layout:**
- ListPane: Quick access to security areas with upstream site summary
- WorkPane: Dashboard with KPI cards, charts, recent activity

**Key Elements:**
- KPI Cards: Total Alerts, Compliance Score (API 1164, IEC 62443), Critical OT Assets, Active Remote Sessions
- Alert severity breakdown by upstream site type
- Recent security events timeline with affected wells/platforms
- Compliance status by standard
- Top 5 critical assets (SIS, wellhead PLCs, pipeline valves)

#### 2. Posture by Site / Facility (1.2)
**Layout:**
- ListPane: Sites grouped by type (Well Pad, Platform, CPF, Pipeline Station)
- WorkPane: Site security details with tabs

**Key Elements:**
- Site list with type badges and security status
- Zone compliance visualization per site
- Remote access status indicators
- OT asset health summary
- Tabs: Overview / Zones / Assets / Remote Access / Compliance

#### 3. Zone & Conduit Model (3.1)
**Layout:**
- ListPane: Zones organized by site with conduit connections
- WorkPane: Zone details with network topology

**Key Elements:**
- Zone hierarchy (Field → Control → SIS → DMZ → Corporate)
- Conduit visualization showing cross-zone communications
- Policy compliance per conduit
- Assets within each zone
- Tabs: Topology / Assets / Conduits / Policies

#### 4. Remote Access & Session View (3.5)
**Layout:**
- ListPane: Active and recent remote sessions
- WorkPane: Session details with activity log

**Key Elements:**
- Session list with user, source, destination, duration
- Vendor vs internal user indicators
- Safety-critical system access highlighting
- Session activity timeline
- Tabs: Details / Commands / Data Transfer / Audit

#### 5. Incident Cases (5.2)
**Layout:**
- ListPane: Incident cases with severity and status
- WorkPane: Incident details with investigation timeline

**Key Elements:**
- Incident list with upstream-specific categories
- Affected assets (wells, platforms, pipelines)
- Investigation timeline
- Containment actions
- Tabs: Details / Timeline / Evidence / Impact / Lessons Learned

#### 6. Anomaly Signals (5.3)
**Layout:**
- ListPane: Detected anomalies with type and severity
- WorkPane: Anomaly details with baseline comparison

**Key Elements:**
- Anomaly types: Pressure spikes, flow anomalies, valve state changes, SIS trips
- Baseline comparison charts
- Correlation with other events
- Affected upstream parameters
- Tabs: Signal Details / Baseline / Correlations / Actions


## Data Models

### Upstream Tenant & Site Models

```typescript
interface UpstreamTenant {
  id: string;
  name: string;
  type: 'national-oil-company' | 'upstream-jv' | 'field-operator';
  region: string;
  basin?: string;
}

interface UpstreamSite {
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
```

### Security Zone & Conduit Models

```typescript
interface SecurityZone {
  id: string;
  tenantId: string;
  siteId: string;
  name: string;
  type: 'field' | 'control' | 'sis' | 'dmz' | 'corporate';
  level: number; // IEC 62443 security level
  assetCount: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  policies: string[];
}

interface Conduit {
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
}
```

### Upstream OT Asset Models

```typescript
interface UpstreamOtAsset {
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
```

### Remote Access & Session Models

```typescript
interface RemoteSession {
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
```

### Security Alert & Incident Models

```typescript
interface UpstreamSecurityAlert {
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

interface IncidentCase {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
  category: 'well-control-tampering' | 'pipeline-manipulation' | 'sis-override' |
            'unauthorized-remote-access' | 'data-exfiltration' | 'malware-infection';
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
}
```

### Anomaly Signal Model

```typescript
interface AnomalySignal {
  id: string;
  tenantId: string;
  siteId: string;
  assetId: string;
  type: 'pressure-spike' | 'flow-anomaly' | 'valve-state-change' | 'sis-trip' |
        'temperature-deviation' | 'vibration-anomaly' | 'communication-loss';
  severity: 'critical' | 'high' | 'medium' | 'low';
  parameter: string;
  baselineValue: number;
  observedValue: number;
  deviation: number;
  unit: string;
  detectedAt: string;
  correlatedEvents: string[];
  potentialCause: string;
  isSafetyRelated: boolean;
}
```


### Compliance & Policy Models

```typescript
interface UpstreamComplianceStandard {
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

interface SecurityControl {
  id: string;
  tenantId: string;
  standardId: string;
  code: string;
  title: string;
  description: string;
  category: 'access-control' | 'network-security' | 'monitoring' | 'incident-response' |
            'data-protection' | 'physical-security' | 'change-management';
  implementationStatus: 'implemented' | 'partial' | 'planned' | 'not-applicable';
  applicableSiteTypes: string[];
  applicableZones: string[];
  upstreamRelevance: 'critical' | 'high' | 'medium' | 'low';
  coveragePercentage: number;
}

interface SecurityException {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  policyId: string;
  policyName: string;
  scope: string[];
  riskLevel: 'high' | 'medium' | 'low';
  compensatingControls: string[];
  approvedBy: string;
  approvalDate: string;
  expirationDate: string;
  status: 'active' | 'expired' | 'revoked';
  affectsSafetyCritical: boolean;
}

interface RiskEntry {
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
```

### Response & Forensics Models

```typescript
interface ResponsePlaybook {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: 'isolate-platform' | 'close-pipeline-segment' | 'lockdown-remote-access' |
            'sis-override-response' | 'well-control-incident' | 'malware-containment';
  applicableIncidentTypes: string[];
  steps: PlaybookStep[];
  escalationProcedure: string;
  lastUpdated: string;
  approvedBy: string;
}

interface PlaybookStep {
  order: number;
  action: string;
  responsible: string;
  timeLimit?: string;
  decisionPoint?: boolean;
  options?: string[];
}

interface SoarAction {
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

interface ForensicSnapshot {
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
```

### Gateway & Integration Models

```typescript
interface FieldGateway {
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

interface ApiKeyServicePrincipal {
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
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation and routing completeness
*For any* security feature in the 45-feature specification, there should exist a corresponding navigation entry and route configuration that renders the correct component
**Validates: Requirements 8.3, 9.1, 9.2**

### Property 2: Tenant data isolation
*For any* security data query (alerts, users, assets, incidents, etc.) and any tenant context, all returned data should belong exclusively to the current tenant
**Validates: Requirements 12.1, 12.2**

### Property 3: User search filtering
*For any* search query in the user directory, all returned users should have names, emails, or roles that contain the search query (case-insensitive)
**Validates: Requirements 2.1.5**

### Property 4: Criticality level filtering
*For any* selected criticality level filter in the OT asset inventory, all displayed assets should have that criticality level
**Validates: Requirements 3.2.3**

### Property 5: Audit log date range filtering
*For any* date range filter applied to the audit log, all displayed entries should have timestamps within that date range (inclusive)
**Validates: Requirements 6.1.3**

### Property 6: Alert severity ordering
*For any* list of security alerts, when sorted by severity, critical alerts should appear before high, high before medium, and medium before low severity alerts
**Validates: Requirements 5.1.5**

### Property 7: Site grouping by type
*For any* list of upstream sites, when grouped by type, all sites within a group should have the same site type (well-pad, offshore-platform, cpf, pipeline-station, etc.)
**Validates: Requirements 1.2.1**

### Property 8: Zone-asset association
*For any* security zone, all assets listed within that zone should have a zoneId matching the zone's id
**Validates: Requirements 3.1.1**

### Property 9: Mock data completeness
*For any* upstream data category (tenants, sites, assets, alerts, incidents), the mock data should include at least one entry for each defined type in the specification
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 10: Safety-critical asset identification
*For any* OT asset marked as safety-critical (inSafetyLoop=true or criticality='safety-critical'), alerts and incidents affecting that asset should be flagged as isSafetyCritical
**Validates: Requirements 5.1.5, 5.2.5**

### Property 11: Remote session tenant filtering
*For any* remote session query, all returned sessions should belong to sites owned by the current tenant
**Validates: Requirements 3.5.1, 12.1**

### Property 12: Compliance score calculation
*For any* compliance standard with requirements, the compliance score should equal the percentage of requirements with status 'compliant' or 'not-applicable'
**Validates: Requirements 4.1.3**

## Error Handling

### Navigation Errors
- Invalid routes redirect to NotFound page
- Missing feature data shows empty state with helpful message
- Failed data loading shows error state with retry option

### Data Validation
- Invalid filter values reset to default
- Malformed search queries are sanitized
- Missing required fields show validation messages

### Upstream-Specific Error States
- No sites for tenant: "No upstream sites configured for this tenant"
- No assets in zone: "No OT assets found in this security zone"
- No active sessions: "No active remote sessions to upstream systems"
- No incidents: "No security incidents recorded for this period"

### User Feedback
- Loading states for async operations
- Success/error toasts for user actions
- Inline validation for form inputs
- Empty states with actionable guidance


## Testing Strategy

### Unit Testing Framework
- **Framework:** Vitest (already configured in the project)
- **Component Testing:** React Testing Library
- **Coverage Target:** Core business logic and data transformations

### Unit Test Coverage

1. **Component Rendering Tests**
   - Each of the 45 security page components renders without errors
   - Correct props are passed to child components
   - Conditional rendering based on data state
   - Empty states display correctly

2. **Data Filtering Tests**
   - User search filtering returns correct results
   - Alert severity filtering works correctly
   - Criticality level filtering returns matching assets
   - Date range filtering for audit logs
   - Site type grouping works correctly

3. **Navigation Tests**
   - All 45 routes are defined and accessible
   - Route changes update URL correctly
   - Active menu items are highlighted
   - Browser back/forward navigation works

4. **Mock Data Tests**
   - Mock data structures match TypeScript interfaces
   - All required fields are present
   - Upstream-specific data types are represented
   - Data relationships are valid (tenant → site → zone → asset)

### Property-Based Testing Framework
- **Framework:** fast-check (TypeScript property-based testing library)
- **Configuration:** Minimum 100 iterations per property test
- **Integration:** Tests will be co-located with components using `.test.ts` suffix

### Property-Based Test Implementation

Each correctness property will be implemented as a property-based test with explicit tagging:

1. **Property 1: Navigation and routing completeness**
   - Generate all 45 security feature routes
   - Verify each route has navigation entry and renders component
   - Tag: `**Feature: security-feature-area, Property 1: Navigation and routing completeness**`
   - **Validates: Requirements 8.3, 9.1, 9.2**

2. **Property 2: Tenant data isolation**
   - Generate random tenant contexts and data queries
   - Verify all returned data belongs to current tenant
   - Tag: `**Feature: security-feature-area, Property 2: Tenant data isolation**`
   - **Validates: Requirements 12.1, 12.2**

3. **Property 3: User search filtering**
   - Generate random user lists and search queries
   - Verify all results match the search criteria
   - Tag: `**Feature: security-feature-area, Property 3: User search filtering**`
   - **Validates: Requirements 2.1.5**

4. **Property 4: Criticality level filtering**
   - Generate random asset lists with varied criticality
   - Verify filtering returns only matching criticality levels
   - Tag: `**Feature: security-feature-area, Property 4: Criticality level filtering**`
   - **Validates: Requirements 3.2.3**

5. **Property 5: Audit log date range filtering**
   - Generate random audit entries with varied timestamps
   - Verify date range filtering includes only entries within range
   - Tag: `**Feature: security-feature-area, Property 5: Audit log date range filtering**`
   - **Validates: Requirements 6.1.3**

6. **Property 6: Alert severity ordering**
   - Generate random lists of alerts with varied severities
   - Verify sorting maintains correct severity order
   - Tag: `**Feature: security-feature-area, Property 6: Alert severity ordering**`
   - **Validates: Requirements 5.1.5**

7. **Property 7: Site grouping by type**
   - Generate random site lists with varied types
   - Verify grouping places all sites of same type together
   - Tag: `**Feature: security-feature-area, Property 7: Site grouping by type**`
   - **Validates: Requirements 1.2.1**

8. **Property 8: Zone-asset association**
   - Generate random zones and assets
   - Verify assets within a zone have matching zoneId
   - Tag: `**Feature: security-feature-area, Property 8: Zone-asset association**`
   - **Validates: Requirements 3.1.1**

9. **Property 9: Mock data completeness**
   - Verify mock data includes all upstream types
   - Tag: `**Feature: security-feature-area, Property 9: Mock data completeness**`
   - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

10. **Property 10: Safety-critical asset identification**
    - Generate random assets and alerts
    - Verify safety-critical assets have properly flagged alerts
    - Tag: `**Feature: security-feature-area, Property 10: Safety-critical asset identification**`
    - **Validates: Requirements 5.1.5, 5.2.5**

11. **Property 11: Remote session tenant filtering**
    - Generate random sessions across tenants
    - Verify session queries return only current tenant's sessions
    - Tag: `**Feature: security-feature-area, Property 11: Remote session tenant filtering**`
    - **Validates: Requirements 3.5.1, 12.1**

12. **Property 12: Compliance score calculation**
    - Generate random compliance standards with varied requirement statuses
    - Verify score calculation matches expected percentage
    - Tag: `**Feature: security-feature-area, Property 12: Compliance score calculation**`
    - **Validates: Requirements 4.1.3**

### Test Execution Strategy
- Unit tests run on every file save (watch mode during development)
- Property-based tests run as part of the test suite
- All tests must pass before considering a task complete
- Tests are implementation-first: implement feature, then write tests to verify
