# Requirements Document

## Introduction

This document defines the requirements for implementing the complete Assets/IoT feature area for the Power Transmission subsector within Plant4.0. The implementation will use Supabase as the single source of truth, building upon the existing baseline of tenant, sites, asset_types, assets, grid_nodes, grid_lines, tags, telemetry_points, alerts, and operational_data tables already seeded for the "DEWA - Transmission" tenant.

The feature area encompasses 24 pages across 6 functional domains: Discovery & Onboarding, Portfolio Management, Asset Catalog & Types, Connectivity & Data Points, Asset Detail & Context, and Location/Topology/Linear Assets.

## Transmission Scope Boundary

This specification is scoped exclusively to the Power Transmission subsector:

- **Primary Tenant**: DEWA - Transmission (power/transmission/power_transmission_demo_v1)
- **Tenant Isolation**: All queries MUST filter by tenant_id; no cross-tenant data leakage
- **Upstream O&G Isolation**: Upstream Oil & Gas remains mock-backed via MockProvider; this spec does NOT migrate upstream data
- **Cross-Tenant Features**: Cross-tenant portfolio comparison is aggregated metrics only; individual asset data is never exposed across tenants
- **HybridProvider Routing**: Transmission methods route to SupabaseProvider; Upstream methods route to MockProvider

## Glossary

- **Tenant**: An organization or business unit with isolated data in the multi-tenant system
- **Asset**: A physical or logical entity (transformer, breaker, bay, meter) tracked in the system
- **Asset_Type**: A classification template defining asset categories and property schemas
- **Grid_Node**: A topology node representing substations, junctions, or plants in the transmission network
- **Grid_Line**: A transmission line connecting two grid nodes with voltage and length properties
- **Tag**: A protocol/address mapping for telemetry data collection (IEC61850, DNP3, Modbus) - EXISTS in baseline
- **Telemetry_Point**: A metric definition with units and limits linked to an asset and optionally a tag - EXISTS in baseline
- **Stream_Config**: NEW table for data collection and retention policy configuration (polling interval, retention, profile)
- **Property_Set**: NEW table for reusable metadata field collections that can be applied to asset types
- **Connection_Endpoint**: NEW table for protocol endpoints for industrial data collection (OPC-UA, IEC61850, DNP3)
- **Discovery_Job**: NEW table for automated processes to detect assets across networks or topology segments
- **Discovery_Agent**: NEW table for gateways or collectors that perform discovery operations
- **Candidate_Asset**: NEW table for assets discovered but pending review/approval
- **Linear_Asset_Issue**: NEW table for issues tracked on grid_lines (thermal overload, protection fault, etc.)
- **Saved_View**: NEW table for user-defined filter presets for quick access to asset collections
- **Lifecycle_State**: NEW table for stages in an asset's operational lifecycle
- **nLVE**: Navigate → List → View → Edit pattern for UI page design
- **DataProvider**: The abstraction layer for all data access in the application


## Page-to-Requirement Mapping Matrix

| Page | File | Domain | Primary Requirements |
|------|------|--------|---------------------|
| Assets Dashboard | AssetsDashboard.tsx | Root | 7.1, 7.2, 7.3 |
| Assets Alerts | AssetsAlerts.tsx | Root | 7.4, 7.5, 7.6 |
| Asset Catalog | AssetCatalogPage.tsx | Catalog | 1.1, 1.2, 1.3, 1.9 |
| Property Sets | PropertySetsPage.tsx | Catalog | 1.4, 1.5 |
| Lifecycle Config | LifecycleConfigPage.tsx | Catalog | 1.6, 1.7 |
| Sector Profiles | SectorProfilesPage.tsx | Catalog | 1.8 |
| Bulk Discovery | BulkDiscoveryPage.tsx | Discovery | 2.1, 2.2, 2.11 |
| Discovery Agents | DiscoveryAgentsPage.tsx | Discovery | 2.3, 2.4 |
| Manual Asset Capture | ManualAssetCapturePage.tsx | Discovery | 2.8 |
| Asset Import | AssetImportPage.tsx | Discovery | 2.9, 2.10 |
| Discovery Review | DiscoveryReviewPage.tsx | Discovery | 2.5, 2.6, 2.7 |
| Connection Endpoints | ConnectionEndpointsPage.tsx | Connectivity | 4.1, 4.2, 4.3, 4.4, 4.11 |
| Tag Mapping | TagMappingPage.tsx | Connectivity | 4.5, 4.6 |
| Stream Config | StreamConfigPage.tsx | Connectivity | 4.7, 4.8 |
| Connection Health | ConnectionHealthPage.tsx | Connectivity | 4.9 |
| Sandbox Streams | SandboxStreamsPage.tsx | Connectivity | 4.10 |
| Geo Location | GeoLocationPage.tsx | Location | 6.1, 6.2 |
| Network Topology | NetworkTopologyPage.tsx | Location | 6.3, 6.4, 6.10 |
| Linear Assets | LinearAssetsPage.tsx | Location | 6.5, 6.6, 6.7 |
| Mobile Assets | MobileAssetsPage.tsx | Location | 6.8, 6.9 |
| Asset Portfolio | AssetPortfolioPage.tsx | Portfolio | 3.1, 3.2, 3.3, 3.4, 3.5 |
| Portfolio Explorer | PortfolioExplorerPage.tsx | Portfolio | 3.6 |
| Saved Views | SavedViewsPage.tsx | Portfolio | 3.7, 3.8 |
| Cross-Tenant Portfolio | CrossTenantPortfolioPage.tsx | Portfolio | 3.9, 3.10 |
| Asset Detail | AssetDetailPage.tsx | Detail | 5.1-5.9 |

## Data Model Expansion Expectations

### New Tables Required (Tenant-Scoped)

| Domain | Table | Purpose |
|--------|-------|---------|
| Catalog | property_sets | Reusable metadata field collections |
| Catalog | lifecycle_states | Asset lifecycle stage definitions |
| Discovery | discovery_jobs | Automated discovery job tracking |
| Discovery | discovery_agents | Gateway/collector management |
| Discovery | candidate_assets | Pending discovered assets |
| Discovery | asset_imports | Bulk import tracking |
| Connectivity | connection_endpoints | Protocol endpoint management |
| Connectivity | stream_configs | Data collection policies |
| Portfolio | saved_views | User filter presets |
| Location | linear_asset_issues | Grid line issue tracking |
| Detail | asset_documents | Document metadata (file storage deferred) |
| Detail | asset_audit_log | Change history (system-only initially) |

### Existing Tables (Reused)
- tenants, sites, asset_types, assets (baseline)
- grid_nodes, grid_lines, grid_asset_links (topology baseline)
- tags, telemetry_points (telemetry baseline)
- alerts (alerts baseline)


## Non-Functional Requirements

### NFR-1: Performance
1. THE System SHALL use pagination (default page size 25) for all list queries to avoid unbounded selects
2. THE System SHALL create indexes on tenant_id, status, criticality, and foreign key columns
3. THE System SHALL limit initial page load queries to essential data; defer secondary data to lazy loading
4. THE System SHALL target < 500ms response time for list queries with < 1000 records

### NFR-2: Reliability
1. THE System SHALL display loading states during all async operations
2. THE System SHALL display error states with retry options on query failures
3. THE System SHALL display empty states with helpful messages when no data exists
4. THE System SHALL implement graceful degradation when Supabase is unavailable (show cached data or clear error)
5. THE System SHALL validate seed health via post-seed count assertions

### NFR-3: Security
1. THE System SHALL enforce tenant_id filtering on all queries (RLS-ready design)
2. THE System SHALL not expose individual asset data in cross-tenant views
3. THE System SHALL validate user input server-side before database mutations
4. THE System SHALL sanitize error messages to avoid leaking internal details

### NFR-4: Observability
1. THE System SHALL log failed provider calls with error codes and messages
2. THE System SHALL use consistent error response format across all provider methods
3. THE System SHALL include tenant_id in all log entries for traceability

## Minimum Seed Coverage Targets

| Domain | Entity | Minimum Count | Notes |
|--------|--------|---------------|-------|
| Catalog | property_sets | 5 | One per type (technical, operational, safety, financial, maintenance) |
| Catalog | lifecycle_states | 15 | 5 states × 3 categories (electrical, protection, measurement) |
| Discovery | discovery_jobs | 3 | One per type (network, topology, geographic) |
| Discovery | discovery_agents | 3 | One per type (IED Gateway, SCADA Bridge, RTU Collector) |
| Discovery | candidate_assets | 6 | Mix of pending (3), approved (2), rejected (1) |
| Discovery | asset_imports | 2 | One completed, one failed |
| Connectivity | connection_endpoints | 6 | Two per major protocol (IEC61850, DNP3, OPC-UA) |
| Connectivity | stream_configs | 3 | One per profile (high-frequency, standard, low-frequency) |
| Portfolio | saved_views | 3 | Critical assets, offline assets, by site |
| Location | linear_asset_issues | 4 | One per issue type |
| Detail | asset_documents | 6 | Two per category (manual, drawing, certificate) |
| Detail | asset_audit_log | 10 | Sample change history entries |

## Deferred / Out of Scope

The following features are explicitly deferred to future cycles:

1. **Document Binary Storage**: Initial implementation stores metadata only; actual file upload/download deferred
2. **User Identity in Audit Trail**: Initial audit log is system-only; user_id tracking deferred until auth integration
3. **Compliance Framework Mapping**: Initial compliance tab shows placeholder status; full framework integration deferred
4. **Real-time Telemetry Streaming**: Initial telemetry shows historical data; WebSocket streaming deferred
5. **Mobile Asset GPS Tracking**: Initial mobile assets show manual location updates; real-time GPS deferred
6. **Discovery Job Execution**: Initial discovery jobs are seeded with results; actual network scanning deferred
7. **Upstream O&G Migration**: Upstream remains mock-backed; no Supabase migration in this spec


## Requirements

### Requirement 1: Asset Catalog & Types Foundation

**User Story:** As a transmission asset manager, I want to define and manage asset type libraries with property schemas, so that I can standardize asset definitions across the organization.

#### Acceptance Criteria

1.1 WHEN a user navigates to the Asset Catalog page, THE System SHALL display all asset types for the current tenant organized by category (electrical, protection, switching, measurement); the list SHALL support pagination (default 25), sorting by code/name/category, and search by name; empty state SHALL display "No asset types defined" with create action
_Pages: AssetCatalogPage_

1.2 WHEN a user views an asset type, THE System SHALL display the type's code, name, category, and properties_schema in a detail panel; properties_schema SHALL render as a formatted field list showing label, dataType, unit, and required status
_Pages: AssetCatalogPage_

1.3 WHEN a user creates a new asset type, THE System SHALL validate that the code is unique within the tenant; IF code already exists, THEN return error "Asset type code '{code}' already exists" AND prevent creation; on success, list SHALL refresh to show new type
_Pages: AssetCatalogPage_

1.4 THE System SHALL support property sets that define reusable metadata field collections; property sets SHALL be tenant-scoped and have a type (technical, operational, safety, financial, maintenance)
_Pages: PropertySetsPage_

1.5 WHEN a user views property sets, THE System SHALL display field definitions including label, dataType, unit, and required status; list SHALL support pagination and filtering by type
_Pages: PropertySetsPage_

1.6 THE System SHALL support lifecycle state configuration per asset category; states SHALL have name, order_index, and optional description
_Pages: LifecycleConfigPage_

1.7 WHEN a user configures lifecycle states, THE System SHALL enforce ordering (order_index must be unique within category) and allow custom states; default states: Commissioning, In Service, Standby, Outage, Decommissioned
_Pages: LifecycleConfigPage_

1.8 THE System SHALL support sector profiles that pre-configure asset types for Power Transmission; profiles SHALL be read-only system-defined configurations
_Pages: SectorProfilesPage_

1.9 IF a user attempts to delete an asset type with linked assets, THEN THE System SHALL prevent deletion AND display error "Cannot delete asset type: {count} assets are linked"; deletion SHALL only succeed when no assets reference the type
_Pages: AssetCatalogPage_

### Requirement 2: Discovery & Onboarding

**User Story:** As a transmission engineer, I want to discover and onboard assets through automated and manual processes, so that I can efficiently populate the asset registry.

#### Acceptance Criteria

2.1 WHEN a user creates a bulk discovery job, THE System SHALL allow scope definition by: network range (IP CIDR), topology segment (node IDs), or geographic area (lat/lng/radius); job SHALL be created with status='pending' and found_count=0
_Pages: BulkDiscoveryPage_

2.2 WHEN a discovery job completes (status='completed'), THE System SHALL have created candidate_assets with suggested_name, suggested_type_id, suggested_hierarchy, and confidence score (0.0-1.0); found_count SHALL equal count of candidate_assets for that job
_Pages: BulkDiscoveryPage_

2.3 THE System SHALL support discovery agents of types: ied_gateway, scada_bridge, rtu_collector; each agent SHALL have protocols array (IEC61850, DNP3, OPC-UA, Modbus-TCP) and status (active, inactive, error)
_Pages: DiscoveryAgentsPage_

2.4 WHEN a user views discovery agents, THE System SHALL display agent name, type, status, protocols, assigned_scopes, and last_run timestamp; list SHALL support filtering by status and type
_Pages: DiscoveryAgentsPage_

2.5 WHEN a user reviews candidate assets, THE System SHALL display suggested_name, suggested_type, confidence, and status; actions available: Approve, Merge (if matched_existing_asset_id exists), Reject
_Pages: DiscoveryReviewPage_

2.6 WHEN a candidate asset is approved, THE System SHALL create a new asset with: name=suggested_name, asset_type_id=suggested_type_id, properties from raw_data; candidate status SHALL update to 'approved'; asset list SHALL include new asset
_Pages: DiscoveryReviewPage_

2.7 WHEN a candidate asset is merged, THE System SHALL update the matched_existing_asset with properties from raw_data; candidate status SHALL update to 'merged'; existing asset SHALL reflect merged properties
_Pages: DiscoveryReviewPage_

2.8 THE System SHALL support manual asset capture with form validation; required fields: name (unique within tenant), asset_type_id, site_id; optional fields: status, criticality, properties; on validation failure, display field-specific errors
_Pages: ManualAssetCapturePage_

2.9 WHEN a user imports assets from file, THE System SHALL support CSV and Excel (.xlsx) formats; import wizard SHALL include: upload step, column mapping step, preview step, import step; column mapping SHALL suggest matches based on header names
_Pages: AssetImportPage_

2.10 WHEN an import completes, THE System SHALL update asset_imports record with: status='completed' or 'failed', imported_count, errors array with row-specific error details; UI SHALL display summary with success/error counts and downloadable error report
_Pages: AssetImportPage_

2.11 IF a discovery job fails (status='failed'), THEN THE System SHALL populate errors array with failure details AND allow retry action that resets status to 'pending'
_Pages: BulkDiscoveryPage_


### Requirement 3: Portfolio Management

**User Story:** As a grid operations manager, I want to view and manage my asset portfolio with flexible filtering and visualization, so that I can understand asset distribution and health.

#### Acceptance Criteria

3.1 WHEN a user views the Asset Portfolio page, THE System SHALL display KPI cards showing: total assets, online count, offline count, maintenance count, critical alerts count, warning alerts count; KPIs SHALL be computed from current filtered dataset
_Pages: AssetPortfolioPage_

3.2 THE System SHALL support filtering by: site_id, asset_type_id, status (online/offline/maintenance), criticality (low/medium/high/critical), and text search (name contains); filters SHALL be combinable (AND logic); clear filters action SHALL reset all
_Pages: AssetPortfolioPage_

3.3 WHEN a user applies filters, THE System SHALL update the asset list AND recalculate KPI cards to reflect filtered dataset; loading state SHALL display during query; empty state SHALL display "No assets match filters" with clear filters action
_Pages: AssetPortfolioPage_

3.4 THE System SHALL support pagination with configurable page sizes (10, 25, 50, 100); default page size SHALL be 25; pagination controls SHALL show current page, total pages, and total count
_Pages: AssetPortfolioPage_

3.5 THE System SHALL support sorting by: name (asc/desc), status, criticality, site name; default sort SHALL be name ascending; sort indicator SHALL show current sort field and direction
_Pages: AssetPortfolioPage_

3.6 WHEN a user views the Portfolio Explorer, THE System SHALL offer three view modes: Tree (hierarchy by site → type → asset), Network (topology graph from grid_nodes/grid_lines), Map (geographic with markers at geo coordinates); view mode toggle SHALL persist selection
_Pages: PortfolioExplorerPage_

3.7 THE System SHALL support saved views that persist filter configurations; saved_view record SHALL store: name, filters (JSON), description, created_at, updated_at
_Pages: SavedViewsPage_

3.8 WHEN a user creates a saved view, THE System SHALL validate name uniqueness within tenant; on success, view SHALL appear in saved views list; applying a saved view SHALL populate filters and refresh asset list
_Pages: SavedViewsPage_

3.9 THE System SHALL support cross-tenant portfolio comparison for advisor personas; cross-tenant view SHALL display aggregated metrics only: total assets, online %, alert counts per tenant; no individual asset data exposed
_Pages: CrossTenantPortfolioPage_

3.10 WHEN viewing cross-tenant data, THE System SHALL enforce tenant isolation; queries SHALL use tenant_id IN (...) for authorized tenants only; individual asset records SHALL NOT be returned in cross-tenant queries
_Pages: CrossTenantPortfolioPage_

### Requirement 4: Connectivity & Data Points

**User Story:** As a SCADA engineer, I want to configure data collection endpoints and tag mappings, so that I can integrate telemetry from field devices.

#### Acceptance Criteria

4.1 WHEN a user views Connection Endpoints, THE System SHALL display all endpoints with: name, protocol, address, port, zone, status, last_seen; list SHALL support pagination, filtering by protocol/status/zone, and sorting by name/status
_Pages: ConnectionEndpointsPage_

4.2 THE System SHALL support protocols: IEC61850, DNP3, OPC-UA, Modbus-TCP, MQTT; protocol SHALL be stored as TEXT with CHECK constraint for valid values
_Pages: ConnectionEndpointsPage_

4.3 WHEN a user creates an endpoint, THE System SHALL validate: name uniqueness within tenant, address format (IP:port or hostname for TCP protocols, topic path for MQTT), port range (1-65535 if specified); on validation failure, display field-specific errors
_Pages: ConnectionEndpointsPage_

4.4 THE System SHALL support network zone classification: IT, OT, DMZ; zone SHALL be optional but recommended; zone filter SHALL be available in endpoint list
_Pages: ConnectionEndpointsPage_

4.5 WHEN a user views Tag Mapping, THE System SHALL display tags linked to assets with: asset name, protocol, address, tag name; list SHALL support filtering by asset, protocol, and search by address
_Pages: TagMappingPage_

4.6 THE System SHALL support bulk tag mapping; bulk mapping interface SHALL allow: select multiple assets, define protocol/address pattern, preview mappings, confirm creation; created tags SHALL appear in tag list
_Pages: TagMappingPage_

4.7 WHEN a user configures stream settings, THE System SHALL allow: polling_interval (milliseconds, min 100), retention period (7d, 30d, 90d, 1y), profile selection; stream_config record SHALL store these values
_Pages: StreamConfigPage_

4.8 THE System SHALL support stream profiles: high-frequency (polling ≤ 1000ms, retention 7d), standard (polling 5000-60000ms, retention 30d), low-frequency (polling > 60000ms, retention 90d+); profile selection SHALL set default polling/retention values
_Pages: StreamConfigPage_

4.9 WHEN a user views Connection Health, THE System SHALL display: endpoint status timeline (up/down events over time), current status, last_seen timestamp, uptime percentage; timeline SHALL show last 24 hours by default with range selector
_Pages: ConnectionHealthPage_

4.10 THE System SHALL support sandbox streams for demo/testing; sandbox stream SHALL generate simulated telemetry data based on configured parameters; sandbox data SHALL be clearly marked as simulated
_Pages: SandboxStreamsPage_

4.11 IF an endpoint status changes to 'down' (last_seen > threshold), THEN THE System SHALL create an alert with: source_type='connectivity', severity='warning', title='Endpoint {name} offline'; alert SHALL link to endpoint detail
_Pages: ConnectionEndpointsPage_


### Requirement 5: Asset Detail & Context

**User Story:** As a maintenance engineer, I want to view comprehensive asset information in a 360° view, so that I can understand asset context and make informed decisions.

#### Acceptance Criteria

5.1 WHEN a user views an asset detail page, THE System SHALL display tabbed interface with sections: Overview, Telemetry, Relationships, Documents, History, Compliance; default tab SHALL be Overview; tab selection SHALL persist in URL
_Pages: AssetDetailPage_

5.2 THE System SHALL display asset properties in Overview tab including: name, asset_type (code + name), status, criticality, site name, and custom properties from properties JSONB; properties SHALL render based on asset_type's properties_schema
_Pages: AssetDetailPage_

5.3 WHEN viewing Telemetry tab, THE System SHALL display: list of linked telemetry_points with metric, unit, current value (if available), limits; historical trend chart for selected metric; empty state if no telemetry_points linked
_Pages: AssetDetailPage_

5.4 WHEN viewing Relationships tab, THE System SHALL display: parent asset (if parent_asset_id set), child assets (assets where parent_asset_id = this asset), topology links (grid_asset_links showing connected node/line); each relationship SHALL link to related entity
_Pages: AssetDetailPage_

5.5 THE System SHALL support document attachments with categorization; asset_documents record SHALL store: name, category (manual, drawing, certificate, sop, inspection), file_path, file_size, mime_type; Documents tab SHALL list documents grouped by category
_Pages: AssetDetailPage_

5.6 WHEN viewing History tab, THE System SHALL display audit trail from asset_audit_log: action (create, update, delete, status_change), changed_fields, old_values, new_values, created_at; entries SHALL be sorted newest first with pagination
_Pages: AssetDetailPage_

5.7 THE System SHALL support compliance tracking with status indicators; Compliance tab SHALL display placeholder compliance status (compliant, non-compliant, pending review) with notes field; full compliance framework integration deferred
_Pages: AssetDetailPage_

5.8 WHEN a user edits asset properties, THE System SHALL validate against the asset type's properties_schema; IF property value fails schema validation, THEN display field-specific error; on success, create audit_log entry and refresh detail view
_Pages: AssetDetailPage_

5.9 IF an asset has active alerts (status IN ('open', 'acknowledged', 'in-progress')), THEN THE System SHALL display alert summary in Overview tab showing: count by severity, most recent alert title; clicking summary SHALL navigate to filtered alerts view
_Pages: AssetDetailPage_

### Requirement 6: Location, Topology & Linear Assets

**User Story:** As a transmission planner, I want to visualize network topology and manage linear assets, so that I can understand grid connectivity and plan maintenance.

#### Acceptance Criteria

6.1 WHEN a user views the Geo Location page, THE System SHALL display a map with grid_nodes positioned by geo_lat/geo_lng coordinates; nodes without coordinates SHALL be listed separately as "Unmapped nodes"
_Pages: GeoLocationPage_

6.2 THE System SHALL support filtering nodes by: node_type (substation, junction, plant), voltage_kv range (min/max), region; filters SHALL update map markers and unmapped list
_Pages: GeoLocationPage_

6.3 WHEN a user views Network Topology, THE System SHALL display nodes (grid_nodes) and edges (grid_lines) in a graph visualization; nodes SHALL show name and voltage; edges SHALL show name and status color (green=active, yellow=maintenance, red=offline)
_Pages: NetworkTopologyPage_

6.4 THE System SHALL display line properties in topology view: name, voltage_kv, length_km, status, from_node name, to_node name; clicking a line SHALL show detail panel with full properties
_Pages: NetworkTopologyPage_

6.5 WHEN a user views Linear Assets, THE System SHALL display grid_lines as linear assets with: name, from_node, to_node, voltage_kv, length_km, status, issue_count; list SHALL support filtering by status and sorting by name/voltage/length
_Pages: LinearAssetsPage_

6.6 THE System SHALL support issue types for linear assets: thermal_overload, protection_fault, insulator_damage, conductor_sag; linear_asset_issues record SHALL store: grid_line_id, type, description, severity, created_at, resolved_at
_Pages: LinearAssetsPage_

6.7 WHEN a user creates a linear asset issue, THE System SHALL require: type (from enum), description (min 10 chars), severity (low, medium, high, critical); on success, issue SHALL appear in line's issue list; issue_count SHALL increment
_Pages: LinearAssetsPage_

6.8 THE System SHALL support mobile asset tracking for service vehicles and portable equipment; mobile assets SHALL have: role='mobile', last_known_location (lat, lng, timestamp), assigned_location (site_id); initial implementation uses manual location updates
_Pages: MobileAssetsPage_

6.9 WHEN viewing mobile assets, THE System SHALL display: asset name, type, last_known_location (with timestamp), current assignment (site name); list SHALL support filtering by site and sorting by last_known_location timestamp
_Pages: MobileAssetsPage_

6.10 THE System SHALL integrate grid_asset_links to show asset-topology connections; asset detail Relationships tab SHALL show linked node (if node_id set) or linked line (if line_id set); topology views SHALL highlight assets at selected node/line
_Pages: NetworkTopologyPage, AssetDetailPage_


### Requirement 7: Dashboard & Alerts Integration

**User Story:** As a control room operator, I want to see asset health and alerts on a dashboard, so that I can monitor system status and respond to issues.

#### Acceptance Criteria

7.1 WHEN a user views the Assets Dashboard (Navigate landing page), THE System SHALL display KPI widgets: Asset Health (online/offline/maintenance pie chart), Connectivity Status (endpoints up/down), Alert Summary (critical/warning/info counts); widgets SHALL link to relevant detail pages
_Pages: AssetsDashboard_

7.2 THE System SHALL display recent alerts section showing alerts where source_type='asset' OR source_type='grid_node' OR source_type='grid_line'; alerts SHALL be sorted by created_at desc, limited to 10 most recent
_Pages: AssetsDashboard_

7.3 WHEN a user clicks an alert in dashboard, THE System SHALL navigate to: asset detail page (if source_type='asset'), topology page with node highlighted (if source_type='grid_node'), linear assets page with line highlighted (if source_type='grid_line')
_Pages: AssetsDashboard_

7.4 THE System SHALL support alert filtering on Assets Alerts page by: severity (info, warning, critical), status (open, acknowledged, in-progress, closed), source_type; filters SHALL be combinable; clear filters action SHALL reset all
_Pages: AssetsAlerts_

7.5 WHEN viewing Assets Alerts page (List page), THE System SHALL display all asset-related alerts with: title, severity badge, status badge, source name, created_at; list SHALL support pagination (default 25), sorting by created_at/severity
_Pages: AssetsAlerts_

7.6 THE System SHALL support alert acknowledgment and status updates; available actions: Acknowledge (open → acknowledged), Start Work (acknowledged → in-progress), Resolve (in-progress → closed); status update SHALL persist to alerts table and refresh list
_Pages: AssetsAlerts_

### Requirement 8: Data Provider Integration

**User Story:** As a developer, I want all data access to go through the DataProvider interface, so that I can switch between mock and Supabase backends.

#### Acceptance Criteria

8.1 THE System SHALL implement all new data access methods in the DataProvider interface; methods SHALL follow naming convention: get{Entity}sByTenant, get{Entity}ById, create{Entity}, update{Entity}, delete{Entity}

8.2 THE System SHALL implement SupabaseProvider methods for all Transmission Assets/IoT queries; each method SHALL use typed Supabase client with proper table/column names

8.3 WHEN a query fails, THE System SHALL return error with: code (e.g., 'QUERY_FAILED'), message (user-friendly), details (technical info for logging); error SHALL NOT expose internal database details

8.4 THE System SHALL support pagination parameters (limit: number, offset: number) for all list queries; default limit SHALL be 25; queries SHALL return { data: T[], total: number }

8.5 THE System SHALL support sorting parameters (sortBy: string, sortDir: 'asc' | 'desc') for all list queries; invalid sortBy values SHALL fall back to default sort

8.6 THE System SHALL filter by tenant_id for all tenant-scoped queries; tenant_id SHALL be required parameter; queries without tenant_id SHALL throw error

8.7 THE System SHALL use typed interfaces for all query results; interfaces SHALL match database schema with camelCase property names

8.8 IF Supabase is not configured (missing env vars), THEN THE System SHALL log warning and HybridProvider SHALL route Transmission methods to MockProvider gracefully

### Requirement 9: Seed Data Quality

**User Story:** As a QA engineer, I want seed data to be validated and idempotent, so that I can reliably reset the demo environment.

#### Acceptance Criteria

9.1 THE System SHALL use CTE pattern with precondition assertions in all seed files; preconditions SHALL verify required parent data exists before inserting

9.2 WHEN a precondition fails, THE System SHALL raise exception with message format: "PRECONDITION FAILED: {description}. Run {dependency_seed}.sql first."

9.3 THE System SHALL use idempotent upserts via natural keys (ON CONFLICT DO UPDATE); natural keys SHALL be defined via UNIQUE constraints on business key columns

9.4 WHEN a seed completes, THE System SHALL validate expected counts; IF count < minimum, THEN raise exception: "SEED {filename} FAILED: expected >= {min} {entity}, found {actual}"

9.5 THE System SHALL maintain seed order dependencies in supabase/config.toml; seed files SHALL be numbered to enforce order (001, 002, ...)

9.6 THE System SHALL not introduce mock data drift; no new files in src/data/mockData.ts or similar; all Transmission data SHALL come from Supabase
