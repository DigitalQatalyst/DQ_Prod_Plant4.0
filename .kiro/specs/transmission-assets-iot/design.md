# Design Document

## Cycle Guardrail (CRITICAL)

**This is a master design document covering the entire Assets/IoT feature area.**

**Implementation Rule**: Implement ONLY the schema + seed + provider + pages for the CURRENT feature set. Defer remaining migrations and provider methods until their cycle.

- Do NOT implement migrations 012–018 + seeds 007–014 all at once
- Each cycle implements only what's needed for that feature set
- Provider methods not needed in current cycle should remain as `notImplemented()` stubs
- Pages from future cycles should not be built until their cycle

## Overview

This design document describes the architecture and implementation approach for the Transmission Assets/IoT feature area in Plant4.0. The implementation follows a feature-set-by-feature-set rollout, with each feature set completed end-to-end (schema → seed → provider → UI → tests) before moving to the next.

## Tenant Resolution Strategy

**Design Decision**: For Phase 1, use the single seeded tenant approach:

1. **Default Tenant**: Resolve tenantId by querying for `scenario_tag = 'power_transmission_demo_v1'`
2. **Provider Helper**: Add `getDefaultTransmissionTenantId()` method that caches the tenant UUID
3. **Page Context**: All Transmission pages call this helper on mount to get tenantId
4. **Future**: When multi-tenant selector is added, replace with route context / tenant selector

```typescript
// In SupabaseProvider
private cachedTenantId: string | null = null;

async getDefaultTransmissionTenantId(): Promise<string> {
  if (this.cachedTenantId) return this.cachedTenantId;
  
  const { data } = await supabase
    .from('tenants')
    .select('id')
    .eq('scenario_tag', 'power_transmission_demo_v1')
    .single();
  
  this.cachedTenantId = data?.id;
  return this.cachedTenantId;
}
```


## Architecture

### System Context

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Plant4.0 Frontend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  Catalog    │  │  Discovery  │  │  Portfolio  │  │  Detail     ││
│  │  Pages (4)  │  │  Pages (5)  │  │  Pages (4)  │  │  Page (1)   ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Connectivity│  │  Location   │  │  Dashboard  │                 │
│  │  Pages (5)  │  │  Pages (4)  │  │  Pages (2)  │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         └────────────────┴────────────────┴────────────────┘        │
│                                   │                                  │
│                          ┌────────▼────────┐                        │
│                          │  DataProvider   │                        │
│                          │   Interface     │                        │
│                          └────────┬────────┘                        │
│                                   │                                  │
│         ┌─────────────────────────┼─────────────────────────┐       │
│         │                         │                         │       │
│  ┌──────▼──────┐          ┌───────▼───────┐         ┌───────▼─────┐│
│  │MockProvider │          │HybridProvider │         │SupabaseProvider│
│  │ (Upstream)  │          │  (routing)    │         │(Transmission)││
│  └─────────────┘          └───────────────┘         └──────┬──────┘│
└─────────────────────────────────────────────────────────────┼───────┘
                                                              │
                                                     ┌────────▼────────┐
                                                     │    Supabase     │
                                                     │   PostgreSQL    │
                                                     └─────────────────┘
```

### Feature Set Rollout Order

| Order | Feature Set | Pages | Migrations | Seeds | Provider Methods | Test Focus |
|-------|-------------|-------|------------|-------|------------------|------------|
| 1 | Asset Catalog & Types | 4 | 012, 013 | 007, 008 | 5 methods | Property 1, 10, 11 |
| 2 | Discovery & Onboarding | 5 | 014 | 009 | 10 methods | Property 7, 8 |
| 3 | Location & Topology | 4 | 018 | 010 | 4 methods | Property 12, 15 |
| 4 | Connectivity | 5 | 015 | 011 | 5 methods | Property 2 |
| 5 | Portfolio Management | 4 | 016 | 012 | 6 methods | Property 3, 4, 5, 6, 9, 13 |
| 6 | Asset Detail | 1 | 017 | 013, 014 | 4 methods | Property 2 |
| 7 | Dashboard & Alerts | 2 | - | - | 2 methods | Property 14 |

**Per-Cycle Test Minimum**:
- Provider unit tests for methods added in that cycle
- 2-3 key property tests relevant to that cycle
- Smoke render tests for pages in that feature set
- Full property suite only in final cycle

## Data Layer - Migration Numbering

**Existing Baseline** (DO NOT MODIFY):
- 001-011: tenants, sites, asset_types, assets, alerts, telemetry, grid_nodes, grid_lines, grid_asset_links, unique constraints, operational_data

**New Migrations** (Assets/IoT Feature Area):
| Migration | Tables | Cycle |
|-----------|--------|-------|
| 012_create_property_sets.sql | property_sets | 1 |
| 013_create_lifecycle_states.sql | lifecycle_states | 1 |
| 014_create_discovery_tables.sql | discovery_jobs, discovery_agents, candidate_assets, asset_imports | 2 |
| 015_create_connectivity_tables.sql | connection_endpoints, stream_configs | 4 |
| 016_create_portfolio_tables.sql | saved_views | 5 |
| 017_create_asset_detail_tables.sql | asset_documents, asset_audit_log | 6 |
| 018_create_linear_asset_issues.sql | linear_asset_issues | 3 |

## Data Layer - Seed Numbering

**Existing Seeds** (DO NOT MODIFY):
- 001: transmission_tenant
- 002: grid_topology
- 003: assets
- 004: telemetry_alerts
- 005: operational

**New Seeds** (Assets/IoT Feature Area):
| Seed | Entities | Min Count | Cycle |
|------|----------|-----------|-------|
| 007_property_sets.sql | property_sets | 5 | 1 |
| 008_lifecycle_states.sql | lifecycle_states | 15 | 1 |
| 009_discovery_data.sql | discovery_jobs, discovery_agents, candidate_assets, asset_imports | 3, 3, 6, 2 | 2 |
| 010_linear_asset_issues.sql | linear_asset_issues | 4 | 3 |
| 011_connectivity_data.sql | connection_endpoints, stream_configs | 6, 3 | 4 |
| 012_saved_views.sql | saved_views | 3 | 5 |
| 013_asset_documents.sql | asset_documents | 6 | 6 |
| 014_asset_audit_log.sql | asset_audit_log | 10 | 6 |


## Data Model Design Decisions

### Tenant ID on Join-Path Tables

**Decision**: Add `tenant_id` to tables that would otherwise require joins for tenant filtering:

1. **candidate_assets**: Add `tenant_id` (derived from discovery_job on insert)
   - Simplifies RLS policies
   - Enables direct tenant filtering without join to discovery_jobs
   
2. **linear_asset_issues**: Add `tenant_id` (derived from grid_line on insert)
   - Simplifies RLS policies
   - Enables direct tenant filtering without join to grid_lines

**Updated Schema**:
```sql
-- candidate_assets with tenant_id
CREATE TABLE candidate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- ADDED
  discovery_job_id UUID NOT NULL REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  -- ... rest of columns
);

-- linear_asset_issues with tenant_id
CREATE TABLE linear_asset_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- ADDED
  grid_line_id UUID NOT NULL REFERENCES grid_lines(id) ON DELETE CASCADE,
  -- ... rest of columns
);
```

### Documents Strategy (Phase 1)

**Decision**: Metadata-only in Phase 1; Supabase Storage integration deferred.

**Phase 1 Scope**:
- `asset_documents` stores metadata only
- `file_path` is a URL/path string (external reference or placeholder)
- No actual file upload/download integration
- UI shows document list with "View" links (external) or "Coming Soon" for upload

**Phase 2 (Deferred)**:
- Supabase Storage bucket: `asset-documents`
- Signed URL generation for secure access
- Upload flow with progress indicator
- Storage policies for tenant isolation

### Connection Health Strategy (Phase 1)

**Decision**: Derive health from `last_seen` and `status` fields; no separate events table.

**Phase 1 Scope**:
- Health timeline derived from `connection_endpoints.last_seen` and `status`
- Uptime calculated as: time since last status='down' event
- UI shows current status + last_seen timestamp
- Timeline visualization is client-side interpolation

**Phase 2 (Deferred)**:
- Add `endpoint_health_events` table for historical tracking
- Store status change events with timestamps
- Enable true timeline visualization

### Sandbox Streams Strategy (Phase 1)

**Decision**: Client-side simulation only; no server-side data generation.

**Phase 1 Scope**:
- `stream_configs` with `is_sandbox: boolean` flag
- UI generates simulated data client-side based on config parameters
- Simulated data clearly marked with "SANDBOX" badge
- No persistence of simulated values

**Phase 2 (Deferred)**:
- Server-side data generation service
- `sandbox_stream_runs` table for tracking simulation sessions

### Portfolio Explorer Hierarchy Rules

**Decision**: Clear separation of view data sources.

| View Mode | Data Source | Hierarchy Logic |
|-----------|-------------|-----------------|
| Tree | assets.parent_asset_id | Site → Asset Type → Asset (parent/child) |
| Network | grid_nodes, grid_lines, grid_asset_links | Topology graph from grid tables |
| Map | grid_nodes.geo_lat/geo_lng, sites.geo_lat/geo_lng | Geographic positioning |

**Tree View Hierarchy**:
1. Level 1: Sites (from `sites` table)
2. Level 2: Asset Types (from `asset_types` table)
3. Level 3: Assets (from `assets` table, grouped by site + type)
4. Level 4: Child Assets (from `assets.parent_asset_id`)


## Components and Interfaces

### Migration SQL - Cycle 1 (Catalog)

#### 012_create_property_sets.sql
```sql
CREATE TABLE property_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('technical', 'operational', 'safety', 'financial', 'maintenance')),
  fields JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_property_sets_tenant ON property_sets(tenant_id);
CREATE INDEX idx_property_sets_type ON property_sets(type);
```

#### 013_create_lifecycle_states.sql
```sql
CREATE TABLE lifecycle_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_category TEXT NOT NULL,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, asset_category, name),
  UNIQUE(tenant_id, asset_category, order_index)
);

CREATE INDEX idx_lifecycle_states_tenant ON lifecycle_states(tenant_id);
CREATE INDEX idx_lifecycle_states_category ON lifecycle_states(asset_category);
```

### Migration SQL - Cycle 2 (Discovery)

#### 014_create_discovery_tables.sql
```sql
CREATE TABLE discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('network', 'topology', 'geographic')),
  scope JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  found_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  errors JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE discovery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ied_gateway', 'scada_bridge', 'rtu_collector')),
  protocols TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  assigned_scopes JSONB DEFAULT '[]',
  last_run TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE candidate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  discovery_job_id UUID NOT NULL REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  suggested_type_id UUID REFERENCES asset_types(id),
  suggested_hierarchy JSONB DEFAULT '{}',
  matched_existing_asset_id UUID REFERENCES assets(id),
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'merged', 'rejected')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE asset_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'preview', 'completed', 'failed')),
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'api')),
  record_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_discovery_jobs_tenant ON discovery_jobs(tenant_id);
CREATE INDEX idx_discovery_jobs_status ON discovery_jobs(status);
CREATE INDEX idx_discovery_agents_tenant ON discovery_agents(tenant_id);
CREATE INDEX idx_discovery_agents_status ON discovery_agents(status);
CREATE INDEX idx_candidate_assets_tenant ON candidate_assets(tenant_id);
CREATE INDEX idx_candidate_assets_job ON candidate_assets(discovery_job_id);
CREATE INDEX idx_candidate_assets_status ON candidate_assets(status);
CREATE INDEX idx_asset_imports_tenant ON asset_imports(tenant_id);
```


### Migration SQL - Cycle 3 (Location)

#### 018_create_linear_asset_issues.sql
```sql
CREATE TABLE linear_asset_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grid_line_id UUID NOT NULL REFERENCES grid_lines(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('thermal_overload', 'protection_fault', 'insulator_damage', 'conductor_sag')),
  description TEXT NOT NULL CHECK (length(description) >= 10),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_linear_asset_issues_tenant ON linear_asset_issues(tenant_id);
CREATE INDEX idx_linear_asset_issues_line ON linear_asset_issues(grid_line_id);
CREATE INDEX idx_linear_asset_issues_severity ON linear_asset_issues(severity);
CREATE INDEX idx_linear_asset_issues_unresolved ON linear_asset_issues(resolved_at) WHERE resolved_at IS NULL;
```

### Migration SQL - Cycle 4 (Connectivity)

#### 015_create_connectivity_tables.sql
```sql
CREATE TABLE connection_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('IEC61850', 'DNP3', 'OPC-UA', 'Modbus-TCP', 'MQTT')),
  address TEXT NOT NULL,
  port INTEGER CHECK (port IS NULL OR (port >= 1 AND port <= 65535)),
  zone TEXT CHECK (zone IS NULL OR zone IN ('IT', 'OT', 'DMZ')),
  hazardous_area TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('up', 'down', 'unknown')),
  last_seen TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE stream_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polling_interval INTEGER NOT NULL CHECK (polling_interval >= 100),
  retention TEXT NOT NULL CHECK (retention IN ('7d', '30d', '90d', '1y')),
  profile TEXT NOT NULL CHECK (profile IN ('high-frequency', 'standard', 'low-frequency')),
  asset_types TEXT[] DEFAULT '{}',
  is_sandbox BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_connection_endpoints_tenant ON connection_endpoints(tenant_id);
CREATE INDEX idx_connection_endpoints_protocol ON connection_endpoints(protocol);
CREATE INDEX idx_connection_endpoints_status ON connection_endpoints(status);
CREATE INDEX idx_stream_configs_tenant ON stream_configs(tenant_id);
CREATE INDEX idx_stream_configs_profile ON stream_configs(profile);
```

### Migration SQL - Cycle 5 (Portfolio)

#### 016_create_portfolio_tables.sql
```sql
CREATE TABLE saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_saved_views_tenant ON saved_views(tenant_id);
```

### Migration SQL - Cycle 6 (Asset Detail)

#### 017_create_asset_detail_tables.sql
```sql
CREATE TABLE asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('manual', 'drawing', 'certificate', 'sop', 'inspection')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX idx_asset_documents_tenant ON asset_documents(tenant_id);
CREATE INDEX idx_asset_documents_category ON asset_documents(category);
CREATE INDEX idx_asset_audit_log_asset ON asset_audit_log(asset_id);
CREATE INDEX idx_asset_audit_log_tenant ON asset_audit_log(tenant_id);
CREATE INDEX idx_asset_audit_log_created ON asset_audit_log(created_at DESC);
```


## Data Models - TypeScript Interfaces

```typescript
// ============================================================================
// Common Types
// ============================================================================

interface PaginationParams {
  limit?: number;  // Default: 25
  offset?: number; // Default: 0
}

interface SortParams {
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface ListResult<T> {
  data: T[];
  total: number;
}

interface ErrorResponse {
  code: 'QUERY_FAILED' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'REFERENTIAL_INTEGRITY';
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Cycle 1: Catalog Types
// ============================================================================

interface PropertySet {
  id: string;
  tenantId: string;
  name: string;
  type: 'technical' | 'operational' | 'safety' | 'financial' | 'maintenance';
  fields: PropertyField[];
  description?: string;
  createdAt: string;
}

interface PropertyField {
  id: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  unit?: string;
  required?: boolean;
}

interface LifecycleState {
  id: string;
  tenantId: string;
  assetCategory: string;
  name: string;
  orderIndex: number;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Cycle 2: Discovery Types
// ============================================================================

interface DiscoveryJob {
  id: string;
  tenantId: string;
  name: string;
  type: 'network' | 'topology' | 'geographic';
  scope: DiscoveryScope;
  status: 'pending' | 'running' | 'completed' | 'failed';
  foundCount: number;
  lastRunAt?: string;
  errors?: string[];
  description?: string;
  createdAt: string;
}

interface DiscoveryScope {
  ipRange?: string;
  nodeIds?: string[];
  geoArea?: { lat: number; lng: number; radiusKm: number };
}

interface DiscoveryAgent {
  id: string;
  tenantId: string;
  name: string;
  type: 'ied_gateway' | 'scada_bridge' | 'rtu_collector';
  protocols: string[];
  status: 'active' | 'inactive' | 'error';
  assignedScopes: DiscoveryScope[];
  lastRun?: string;
  description?: string;
  createdAt: string;
}

interface CandidateAsset {
  id: string;
  tenantId: string;
  discoveryJobId: string;
  suggestedName: string;
  suggestedTypeId?: string;
  suggestedTypeName?: string;
  suggestedHierarchy: Record<string, string>;
  matchedExistingAssetId?: string;
  confidence: number;
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  rawData?: Record<string, unknown>;
  createdAt: string;
}

interface AssetImport {
  id: string;
  tenantId: string;
  name: string;
  status: 'pending' | 'mapping' | 'preview' | 'completed' | 'failed';
  sourceType: 'csv' | 'excel' | 'api';
  recordCount: number;
  importedCount: number;
  errors?: ImportError[];
  createdAt: string;
  completedAt?: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

// ============================================================================
// Cycle 3: Location Types
// ============================================================================

interface LinearAssetIssue {
  id: string;
  tenantId: string;
  gridLineId: string;
  gridLineName?: string;
  type: 'thermal_overload' | 'protection_fault' | 'insulator_damage' | 'conductor_sag';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
}

// ============================================================================
// Cycle 4: Connectivity Types
// ============================================================================

interface ConnectionEndpoint {
  id: string;
  tenantId: string;
  name: string;
  protocol: 'IEC61850' | 'DNP3' | 'OPC-UA' | 'Modbus-TCP' | 'MQTT';
  address: string;
  port?: number;
  zone?: 'IT' | 'OT' | 'DMZ';
  hazardousArea?: string;
  status: 'up' | 'down' | 'unknown';
  lastSeen?: string;
  description?: string;
  createdAt: string;
}

interface StreamConfig {
  id: string;
  tenantId: string;
  name: string;
  pollingInterval: number;
  retention: '7d' | '30d' | '90d' | '1y';
  profile: 'high-frequency' | 'standard' | 'low-frequency';
  assetTypes: string[];
  isSandbox: boolean;
  description?: string;
  createdAt: string;
}

// ============================================================================
// Cycle 5: Portfolio Types
// ============================================================================

interface SavedView {
  id: string;
  tenantId: string;
  name: string;
  filters: AssetFilter;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface AssetFilter {
  siteId?: string;
  assetTypeId?: string;
  status?: string;
  criticality?: string;
  search?: string;
}

interface PortfolioKpis {
  totalAssets: number;
  onlineAssets: number;
  offlineAssets: number;
  maintenanceAssets: number;
  criticalAlerts: number;
  warningAlerts: number;
  assetsByType: Record<string, number>;
  assetsBySite: Record<string, number>;
}

// ============================================================================
// Cycle 6: Asset Detail Types
// ============================================================================

interface AssetDocument {
  id: string;
  assetId: string;
  tenantId: string;
  name: string;
  category: 'manual' | 'drawing' | 'certificate' | 'sop' | 'inspection';
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

interface AuditLogEntry {
  id: string;
  assetId: string;
  tenantId: string;
  action: 'create' | 'update' | 'delete' | 'status_change';
  changedFields?: string[];
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  userId?: string;
  createdAt: string;
}

interface TopologyLink {
  assetId: string;
  nodeId?: string;
  nodeName?: string;
  lineId?: string;
  lineName?: string;
}
```


## DataProvider Interface - Per-Cycle Methods

### Cycle 1: Catalog Methods (Implement in Cycle 1)
```typescript
// Add to DataProvider interface
getPropertySetsByTenant(tenantId: string, params?: PaginationParams & SortParams & { type?: string }): Promise<ListResult<PropertySet>>;
getPropertySetById(id: string): Promise<PropertySet | null>;
createPropertySet(data: Omit<PropertySet, 'id' | 'createdAt'>): Promise<PropertySet>;
getLifecycleStatesByCategory(tenantId: string, category: string): Promise<LifecycleState[]>;
createLifecycleState(data: Omit<LifecycleState, 'id' | 'createdAt'>): Promise<LifecycleState>;
```

### Cycle 2: Discovery Methods (Implement in Cycle 2)
```typescript
getDiscoveryJobsByTenant(tenantId: string, params?: PaginationParams & SortParams & { status?: string }): Promise<ListResult<DiscoveryJob>>;
createDiscoveryJob(data: Omit<DiscoveryJob, 'id' | 'createdAt' | 'foundCount'>): Promise<DiscoveryJob>;
retryDiscoveryJob(jobId: string): Promise<DiscoveryJob>;
getDiscoveryAgentsByTenant(tenantId: string, params?: PaginationParams & { status?: string; type?: string }): Promise<ListResult<DiscoveryAgent>>;
createDiscoveryAgent(data: Omit<DiscoveryAgent, 'id' | 'createdAt'>): Promise<DiscoveryAgent>;
getCandidateAssetsByJob(jobId: string, params?: PaginationParams & { status?: string }): Promise<ListResult<CandidateAsset>>;
approveCandidateAsset(candidateId: string): Promise<{ asset: TransmissionAsset; candidate: CandidateAsset }>;
mergeCandidateAsset(candidateId: string, targetAssetId: string): Promise<{ asset: TransmissionAsset; candidate: CandidateAsset }>;
rejectCandidateAsset(candidateId: string): Promise<CandidateAsset>;
getAssetImportsByTenant(tenantId: string, params?: PaginationParams): Promise<ListResult<AssetImport>>;
createAssetImport(data: Omit<AssetImport, 'id' | 'createdAt' | 'importedCount'>): Promise<AssetImport>;
```

### Cycle 3: Location Methods (Implement in Cycle 3)
```typescript
getLinearAssetIssues(lineId: string, params?: PaginationParams & { severity?: string; resolved?: boolean }): Promise<ListResult<LinearAssetIssue>>;
getLinearAssetIssuesByTenant(tenantId: string, params?: PaginationParams & { severity?: string; resolved?: boolean }): Promise<ListResult<LinearAssetIssue>>;
createLinearAssetIssue(data: Omit<LinearAssetIssue, 'id' | 'createdAt'>): Promise<LinearAssetIssue>;
resolveLinearAssetIssue(issueId: string): Promise<LinearAssetIssue>;
```

### Cycle 4: Connectivity Methods (Implement in Cycle 4)
```typescript
getConnectionEndpointsByTenant(tenantId: string, params?: PaginationParams & SortParams & { protocol?: string; status?: string; zone?: string }): Promise<ListResult<ConnectionEndpoint>>;
createConnectionEndpoint(data: Omit<ConnectionEndpoint, 'id' | 'createdAt'>): Promise<ConnectionEndpoint>;
updateConnectionEndpointStatus(id: string, status: 'up' | 'down' | 'unknown'): Promise<ConnectionEndpoint>;
getStreamConfigsByTenant(tenantId: string, params?: PaginationParams & { profile?: string }): Promise<ListResult<StreamConfig>>;
createStreamConfig(data: Omit<StreamConfig, 'id' | 'createdAt'>): Promise<StreamConfig>;
```

### Cycle 5: Portfolio Methods (Implement in Cycle 5)
```typescript
getSavedViewsByTenant(tenantId: string, params?: PaginationParams): Promise<ListResult<SavedView>>;
getSavedViewById(id: string): Promise<SavedView | null>;
createSavedView(data: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedView>;
deleteSavedView(id: string): Promise<void>;
getAssetPortfolioKpis(tenantId: string, filters?: AssetFilter): Promise<PortfolioKpis>;
getCrossTenantKpis(tenantIds: string[]): Promise<Record<string, PortfolioKpis>>;
```

### Cycle 6: Asset Detail Methods (Implement in Cycle 6)
```typescript
getAssetDocuments(assetId: string): Promise<AssetDocument[]>;
createAssetDocument(data: Omit<AssetDocument, 'id' | 'uploadedAt'>): Promise<AssetDocument>;
getAssetAuditLog(assetId: string, params?: PaginationParams): Promise<ListResult<AuditLogEntry>>;
getAssetTopologyLinks(assetId: string): Promise<TopologyLink[]>;
```

### Cycle 7: Dashboard Methods (Implement in Cycle 7)
```typescript
// Uses existing methods + getAssetPortfolioKpis from Cycle 5
// Alert methods already exist in baseline
updateAlertStatus(alertId: string, status: 'open' | 'acknowledged' | 'in-progress' | 'closed'): Promise<Alert>;
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system.*

### Cycle 1 Properties

**Property 1: Asset Type Code Uniqueness**
*For any* tenant and any two asset types within that tenant, their codes SHALL be distinct.
**Validates: Requirements 1.3**
**Test Cycle: 1**

**Property 10: Seed Idempotency**
*For any* seed file, running it multiple times SHALL produce the same final state with expected counts.
**Validates: Requirements 9.3, 9.4**
**Test Cycle: 1**

**Property 11: Referential Integrity on Delete**
*For any* asset type with linked assets, attempting to delete it SHALL fail with an appropriate error.
**Validates: Requirements 1.9**
**Test Cycle: 1**

### Cycle 2 Properties

**Property 7: Candidate Asset Action Consistency**
*For any* candidate asset that is approved, the resulting asset SHALL have properties matching the candidate's suggested values. *For any* candidate asset that is merged, the target asset SHALL be updated with the candidate's discovered data.
**Validates: Requirements 2.6, 2.7**
**Test Cycle: 2**

**Property 8: Discovery Job Candidate Generation**
*For any* completed discovery job with found_count > 0, there SHALL exist at least one candidate asset linked to that job.
**Validates: Requirements 2.2**
**Test Cycle: 2**

### Cycle 3 Properties

**Property 12: Linear Asset Issue Validation**
*For any* linear asset issue creation, the type, description (min 10 chars), and severity fields SHALL be required and validated.
**Validates: Requirements 6.7**
**Test Cycle: 3**

**Property 15: Topology Link Integrity**
*For any* asset with grid_asset_links, the linked node_id or line_id SHALL reference existing grid_nodes or grid_lines.
**Validates: Requirements 6.10**
**Test Cycle: 3**

### Cycle 4 Properties

**Property 2: Entity View Field Completeness**
*For any* entity (asset type, property set, endpoint, tag, asset, grid line), the rendered view SHALL contain all fields defined in the entity's schema.
**Validates: Requirements 1.2, 1.5, 4.1, 4.5, 5.2, 6.4, 6.9**
**Test Cycle: 4**

### Cycle 5 Properties

**Property 3: Filter Result Correctness**
*For any* list query with filter parameters, all items in the result set SHALL match the filter criteria.
**Validates: Requirements 3.2, 6.2, 7.4**
**Test Cycle: 5**

**Property 4: Sort Order Correctness**
*For any* list query with sort parameters, the result set SHALL be ordered according to the specified sort field and direction.
**Validates: Requirements 3.5**
**Test Cycle: 5**

**Property 5: Pagination Correctness**
*For any* list query with pagination parameters (limit, offset), the result set size SHALL not exceed the limit and SHALL skip the specified offset.
**Validates: Requirements 3.4, 8.4**
**Test Cycle: 5**

**Property 6: Tenant Isolation**
*For any* tenant-scoped query, the result set SHALL only contain items belonging to the specified tenant.
**Validates: Requirements 3.10, 8.6**
**Test Cycle: 5**

**Property 9: Saved View Round-Trip**
*For any* saved view, creating it and then retrieving it by ID SHALL return an equivalent filter configuration.
**Validates: Requirements 3.7, 3.8**
**Test Cycle: 5**

**Property 13: KPI Calculation Correctness**
*For any* portfolio KPI query, the total assets count SHALL equal the sum of online, offline, and maintenance counts.
**Validates: Requirements 3.1, 7.1**
**Test Cycle: 5**

### Cycle 7 Properties

**Property 14: Alert Status Update Persistence**
*For any* alert status update, the new status SHALL be persisted and retrievable.
**Validates: Requirements 7.6**
**Test Cycle: 7**


## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  code: string;        // e.g., 'QUERY_FAILED', 'VALIDATION_ERROR', 'NOT_FOUND'
  message: string;     // User-friendly message
  field?: string;      // For validation errors, the specific field
  details?: Record<string, unknown>; // Technical details for logging
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| QUERY_FAILED | 500 | Database query failed |
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Entity not found |
| CONFLICT | 409 | Unique constraint violation |
| FORBIDDEN | 403 | Tenant isolation violation |
| REFERENTIAL_INTEGRITY | 400 | Cannot delete due to references |

## Testing Strategy

### Per-Cycle Test Minimum
| Cycle | Provider Unit Tests | Property Tests | Smoke Tests |
|-------|---------------------|----------------|-------------|
| 1 | 5 methods | P1, P10, P11 | 4 pages |
| 2 | 10 methods | P7, P8 | 5 pages |
| 3 | 4 methods | P12, P15 | 4 pages |
| 4 | 5 methods | P2 | 5 pages |
| 5 | 6 methods | P3, P4, P5, P6, P9, P13 | 4 pages |
| 6 | 4 methods | P2 (extended) | 1 page |
| 7 | 2 methods | P14 | 2 pages |

### Property-Based Testing
- Use fast-check library for TypeScript
- Minimum 100 iterations per property test
- Tag format: **Feature: transmission-assets-iot, Property {number}: {property_text}**

## UI Page Plans (Summary)

### Cycle 1: Catalog (4 pages)
- AssetCatalogPage: /assets/catalog - List/View/Edit asset types
- PropertySetsPage: /assets/catalog/property-sets - List/View/Edit property sets
- LifecycleConfigPage: /assets/catalog/lifecycle - List/Edit lifecycle states
- SectorProfilesPage: /assets/catalog/profiles - List/View sector profiles (read-only)

### Cycle 2: Discovery (5 pages)
- BulkDiscoveryPage: /assets/discovery/bulk - List/View/Edit discovery jobs
- DiscoveryAgentsPage: /assets/discovery/agents - List/View/Edit agents
- DiscoveryReviewPage: /assets/discovery/review - List/View/Edit candidates
- ManualAssetCapturePage: /assets/discovery/manual - Edit (create asset form)
- AssetImportPage: /assets/discovery/import - List/View/Edit imports

### Cycle 3: Location (4 pages)
- GeoLocationPage: /assets/location/geo - Map view of grid nodes
- NetworkTopologyPage: /assets/location/topology - Graph view of topology
- LinearAssetsPage: /assets/location/linear - List/View/Edit grid lines + issues
- MobileAssetsPage: /assets/location/mobile - List/View/Edit mobile assets

### Cycle 4: Connectivity (5 pages)
- ConnectionEndpointsPage: /assets/connectivity/endpoints - List/View/Edit endpoints
- TagMappingPage: /assets/connectivity/tags - List/Edit tag mappings
- StreamConfigPage: /assets/connectivity/streams - List/View/Edit stream configs
- ConnectionHealthPage: /assets/connectivity/health - List/View health status
- SandboxStreamsPage: /assets/connectivity/sandbox - List/View/Edit sandbox streams

### Cycle 5: Portfolio (4 pages)
- AssetPortfolioPage: /assets/portfolio - List with KPIs, filters, pagination
- PortfolioExplorerPage: /assets/portfolio/explorer - Tree/Network/Map views
- SavedViewsPage: /assets/portfolio/views - List/View/Edit saved views
- CrossTenantPortfolioPage: /assets/portfolio/cross-tenant - Aggregated metrics

### Cycle 6: Asset Detail (1 page)
- AssetDetailPage: /assets/detail/:assetId - 360° view with tabs

### Cycle 7: Dashboard (2 pages)
- AssetsDashboard: /assets - KPI widgets, recent alerts
- AssetsAlerts: /assets/alerts - List/View/Edit alerts

## Definition of Done

### Per-Cycle DoD
- [ ] Migrations for cycle applied successfully
- [ ] Seeds for cycle run without errors
- [ ] Post-seed validation passes expected counts
- [ ] Provider methods for cycle implemented
- [ ] Pages for cycle render with seeded data
- [ ] Property tests for cycle passing
- [ ] Smoke tests for cycle pages passing
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Final DoD (After Cycle 7)
- [ ] All 7 migrations applied
- [ ] All 8 seeds run idempotently
- [ ] All 36 provider methods implemented
- [ ] All 24 pages functional
- [ ] All 15 property tests passing
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
