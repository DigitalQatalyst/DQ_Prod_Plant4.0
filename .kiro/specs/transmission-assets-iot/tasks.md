# Implementation Plan: Transmission Assets/IoT Feature Area

## Overview

This implementation plan follows a feature-set-by-feature-set rollout for the complete Assets/IoT feature area (24 pages across 7 cycles). Each cycle implements schema → seed → provider → UI → tests end-to-end before moving to the next.

**Critical Rule**: Implement ONLY the current cycle's components. Do not implement migrations, seeds, or provider methods for future cycles.

## Tasks

- [x] 1. Cycle 1: Asset Catalog & Types Foundation
  - Migrations: 012, 013
  - Seeds: 007, 008
  - Provider methods: 5
  - Pages: 4 (AssetCatalogPage, PropertySetsPage, LifecycleConfigPage, SectorProfilesPage)
  - Properties: P1, P10, P11

  - [x] 1.1 Create migration 012_create_property_sets.sql
    - Create `property_sets` table with tenant_id, name, type, fields (JSONB), description
    - Add UNIQUE constraint on (tenant_id, name)
    - Add indexes on tenant_id and type
    - _Requirements: 1.4, 1.5_

  - [x] 1.2 Create migration 013_create_lifecycle_states.sql
    - Create `lifecycle_states` table with tenant_id, asset_category, name, order_index, description
    - Add UNIQUE constraints on (tenant_id, asset_category, name) and (tenant_id, asset_category, order_index)
    - Add indexes on tenant_id and asset_category
    - _Requirements: 1.6, 1.7_

  - [x] 1.3 Create seed 007_property_sets.sql
    - Insert 5 property sets (technical, operational, safety, financial, maintenance)
    - Use CTE pattern with precondition check for tenant existence
    - Use idempotent upsert via ON CONFLICT DO UPDATE
    - Add post-seed count validation (>= 5)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 1.4 Create seed 008_lifecycle_states.sql
    - Insert 15 lifecycle states (5 states × 3 categories: electrical, protection, measurement)
    - Default states: Commissioning, In Service, Standby, Outage, Decommissioned
    - Use CTE pattern with precondition check
    - Add post-seed count validation (>= 15)
    - _Requirements: 1.7, 9.1, 9.3, 9.4_

  - [x] 1.5 Add TypeScript interfaces for Cycle 1 entities
    - Add PropertySet, PropertyField, LifecycleState interfaces to src/types/transmission.ts
    - Add PaginationParams, SortParams, ListResult, ErrorResponse common types
    - _Requirements: 8.7_

  - [x] 1.6 Implement getDefaultTransmissionTenantId() helper
    - Add to SupabaseProvider with caching
    - Query tenants by scenario_tag = 'power_transmission_demo_v1'
    - _Requirements: 8.2_

  - [x] 1.7 Implement Cycle 1 DataProvider methods
    - getPropertySetsByTenant(tenantId, params)
    - getPropertySetById(id)
    - createPropertySet(data)
    - getLifecycleStatesByCategory(tenantId, category)
    - createLifecycleState(data)
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 1.8 Create AssetCatalogPage component
    - Route: /assets/catalog
    - List asset types with pagination (default 25), sorting, search
    - Detail panel showing code, name, category, properties_schema
    - Create/Edit form with code uniqueness validation
    - Delete with referential integrity check
    - Empty state: "No asset types defined"
    - _Requirements: 1.1, 1.2, 1.3, 1.9_

  - [x] 1.9 Create PropertySetsPage component
    - Route: /assets/catalog/property-sets
    - List property sets with pagination, filtering by type
    - Detail panel showing field definitions (label, dataType, unit, required)
    - Create/Edit form
    - _Requirements: 1.4, 1.5_

  - [x] 1.10 Create LifecycleConfigPage component
    - Route: /assets/catalog/lifecycle
    - List lifecycle states grouped by category
    - Edit form with order_index uniqueness enforcement
    - _Requirements: 1.6, 1.7_

  - [x] 1.11 Create SectorProfilesPage component
    - Route: /assets/catalog/profiles
    - Read-only list of sector profiles for Power Transmission
    - _Requirements: 1.8_

  - [ ]* 1.12 Write property test for P1: Asset Type Code Uniqueness
    - **Property 1: Asset Type Code Uniqueness**
    - _For any_ tenant and any two asset types within that tenant, their codes SHALL be distinct
    - Use fast-check with minimum 100 iterations
    - **Validates: Requirements 1.3**

  - [ ]* 1.13 Write property test for P10: Seed Idempotency
    - **Property 10: Seed Idempotency**
    - _For any_ seed file, running it multiple times SHALL produce the same final state with expected counts
    - **Validates: Requirements 9.3, 9.4**

  - [ ]* 1.14 Write property test for P11: Referential Integrity on Delete
    - **Property 11: Referential Integrity on Delete**
    - _For any_ asset type with linked assets, attempting to delete it SHALL fail with an appropriate error
    - **Validates: Requirements 1.9**

  - [ ]* 1.15 Write smoke tests for Cycle 1 pages
    - Test AssetCatalogPage renders with seeded data
    - Test PropertySetsPage renders with seeded data
    - Test LifecycleConfigPage renders with seeded data
    - Test SectorProfilesPage renders

- [x] 2. Checkpoint - Cycle 1 Complete
  - Ensure all Cycle 1 tests pass
  - Verify migrations 012, 013 applied successfully
  - Verify seeds 007, 008 run idempotently
  - Verify all 4 Catalog pages render with data
  - Ask user if questions arise before proceeding to Cycle 2

- [-] 3. Cycle 2: Discovery & Onboarding
  - Migrations: 014
  - Seeds: 009
  - Provider methods: 10
  - Pages: 5 (BulkDiscoveryPage, DiscoveryAgentsPage, DiscoveryReviewPage, ManualAssetCapturePage, AssetImportPage)
  - Properties: P7, P8

  - [x] 3.1 Create migration 014_create_discovery_tables.sql
    - Create `discovery_jobs` table with tenant_id, name, type, scope (JSONB), status, found_count, errors
    - Create `discovery_agents` table with tenant_id, name, type, protocols (TEXT[]), status, assigned_scopes
    - Create `candidate_assets` table with tenant_id, discovery_job_id, suggested_name, suggested_type_id, confidence, status, raw_data
    - Create `asset_imports` table with tenant_id, name, status, source_type, record_count, imported_count, errors
    - Add all indexes and constraints per design
    - _Requirements: 2.1, 2.3, 2.5, 2.9_

  - [x] 3.2 Create seed 009_discovery_data.sql
    - Insert 3 discovery jobs (network, topology, geographic) with mix of statuses
    - Insert 3 discovery agents (ied_gateway, scada_bridge, rtu_collector)
    - Insert 6 candidate assets (3 pending, 2 approved, 1 rejected)
    - Insert 2 asset imports (1 completed, 1 failed)
    - Use CTE pattern with preconditions
    - Add post-seed count validations
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 3.3 Add TypeScript interfaces for Cycle 2 entities
    - Add DiscoveryJob, DiscoveryScope, DiscoveryAgent, CandidateAsset, AssetImport, ImportError interfaces
    - _Requirements: 8.7_

  - [x] 3.4 Implement Cycle 2 DataProvider methods
    - getDiscoveryJobsByTenant(tenantId, params)
    - createDiscoveryJob(data)
    - retryDiscoveryJob(jobId)
    - getDiscoveryAgentsByTenant(tenantId, params)
    - createDiscoveryAgent(data)
    - getCandidateAssetsByJob(jobId, params)
    - approveCandidateAsset(candidateId)
    - mergeCandidateAsset(candidateId, targetAssetId)
    - rejectCandidateAsset(candidateId)
    - getAssetImportsByTenant(tenantId, params)
    - createAssetImport(data)
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 3.5 Create BulkDiscoveryPage component
    - Route: /assets/discovery/bulk
    - List discovery jobs with status filter
    - Create job form with scope definition (network range, topology segment, geographic area)
    - Retry action for failed jobs
    - _Requirements: 2.1, 2.2, 2.11_

  - [x] 3.6 Create DiscoveryAgentsPage component
    - Route: /assets/discovery/agents
    - List agents with status/type filters
    - Display name, type, status, protocols, assigned_scopes, last_run
    - Create/Edit agent form
    - _Requirements: 2.3, 2.4_

  - [x] 3.7 Create DiscoveryReviewPage component
    - Route: /assets/discovery/review
    - List candidate assets with status filter
    - Display suggested_name, suggested_type, confidence, status
    - Actions: Approve, Merge, Reject
    - _Requirements: 2.5, 2.6, 2.7_

  - [x] 3.8 Create ManualAssetCapturePage component
    - Route: /assets/discovery/manual
    - Asset creation form with validation
    - Required: name (unique), asset_type_id, site_id
    - Optional: status, criticality, properties
    - Field-specific error display
    - _Requirements: 2.8_

  - [x] 3.9 Create AssetImportPage component
    - Route: /assets/discovery/import
    - Import wizard: upload → column mapping → preview → import
    - Support CSV and Excel formats
    - Display import summary with success/error counts
    - _Requirements: 2.9, 2.10_

  - [ ]* 3.10 Write property test for P7: Candidate Asset Action Consistency
    - **Property 7: Candidate Asset Action Consistency**
    - _For any_ candidate asset that is approved, the resulting asset SHALL have properties matching the candidate's suggested values
    - _For any_ candidate asset that is merged, the target asset SHALL be updated with the candidate's discovered data
    - **Validates: Requirements 2.6, 2.7**

  - [ ]* 3.11 Write property test for P8: Discovery Job Candidate Generation
    - **Property 8: Discovery Job Candidate Generation**
    - _For any_ completed discovery job with found_count > 0, there SHALL exist at least one candidate asset linked to that job
    - **Validates: Requirements 2.2**

  - [ ]* 3.12 Write smoke tests for Cycle 2 pages
    - Test all 5 Discovery pages render with seeded data

- [x] 4. Checkpoint - Cycle 2 Complete
  - Ensure all Cycle 2 tests pass
  - Verify migration 014 applied successfully
  - Verify seed 009 runs idempotently
  - Verify all 5 Discovery pages render with data
  - Ask user if questions arise before proceeding to Cycle 3

- [x] 5. Cycle 3: Location & Topology
  - Migrations: 018
  - Seeds: 010
  - Provider methods: 4
  - Pages: 4 (GeoLocationPage, NetworkTopologyPage, LinearAssetsPage, MobileAssetsPage)
  - Properties: P12, P15

  - [x] 5.1 Create migration 018_create_linear_asset_issues.sql
    - Create `linear_asset_issues` table with tenant_id, grid_line_id, type, description, severity, resolved_at
    - Add CHECK constraints for type enum and description min length
    - Add indexes on tenant_id, grid_line_id, severity, unresolved
    - _Requirements: 6.6, 6.7_

  - [x] 5.2 Create seed 010_linear_asset_issues.sql
    - Insert 4 issues (one per type: thermal_overload, protection_fault, insulator_damage, conductor_sag)
    - Link to existing grid_lines from seed 002
    - Use CTE pattern with preconditions
    - Add post-seed count validation (>= 4)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 5.3 Add TypeScript interfaces for Cycle 3 entities
    - Add LinearAssetIssue interface
    - _Requirements: 8.7_

  - [x] 5.4 Implement Cycle 3 DataProvider methods
    - getLinearAssetIssues(lineId, params)
    - getLinearAssetIssuesByTenant(tenantId, params)
    - createLinearAssetIssue(data)
    - resolveLinearAssetIssue(issueId)
    - _Requirements: 8.1, 8.2_

  - [x] 5.5 Create GeoLocationPage component
    - Route: /assets/location/geo
    - Map view with grid_nodes positioned by geo_lat/geo_lng
    - Filter by node_type, voltage_kv range, region
    - "Unmapped nodes" list for nodes without coordinates
    - _Requirements: 6.1, 6.2_

  - [x] 5.6 Create NetworkTopologyPage component
    - Route: /assets/location/topology
    - Graph visualization of nodes (grid_nodes) and edges (grid_lines)
    - Node display: name, voltage
    - Edge display: name, status color (green/yellow/red)
    - Line detail panel on click
    - Highlight assets at selected node/line via grid_asset_links
    - _Requirements: 6.3, 6.4, 6.10_

  - [x] 5.7 Create LinearAssetsPage component
    - Route: /assets/location/linear
    - List grid_lines with name, from_node, to_node, voltage_kv, length_km, status, issue_count
    - Filter by status, sort by name/voltage/length
    - Issue management: create issue form, issue list per line
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 5.8 Create MobileAssetsPage component
    - Route: /assets/location/mobile
    - List mobile assets (role='mobile') with last_known_location, current assignment
    - Filter by site, sort by last_known_location timestamp
    - Manual location update form
    - _Requirements: 6.8, 6.9_

  - [ ]* 5.9 Write property test for P12: Linear Asset Issue Validation
    - **Property 12: Linear Asset Issue Validation**
    - _For any_ linear asset issue creation, the type, description (min 10 chars), and severity fields SHALL be required and validated
    - **Validates: Requirements 6.7**

  - [ ]* 5.10 Write property test for P15: Topology Link Integrity
    - **Property 15: Topology Link Integrity**
    - _For any_ asset with grid_asset_links, the linked node_id or line_id SHALL reference existing grid_nodes or grid_lines
    - **Validates: Requirements 6.10**

  - [ ]* 5.11 Write smoke tests for Cycle 3 pages
    - Test all 4 Location pages render with seeded data

- [x] 6. Checkpoint - Cycle 3 Complete
  - Ensure all Cycle 3 tests pass
  - Verify migration 018 applied successfully
  - Verify seed 010 runs idempotently
  - Verify all 4 Location pages render with data
  - Ask user if questions arise before proceeding to Cycle 4

- [x] 7. Cycle 4: Connectivity & Data Points
  - Migrations: 015
  - Seeds: 011
  - Provider methods: 5
  - Pages: 5 (ConnectionEndpointsPage, TagMappingPage, StreamConfigPage, ConnectionHealthPage, SandboxStreamsPage)
  - Properties: P2

  - [x] 7.1 Create migration 015_create_connectivity_tables.sql
    - Create `connection_endpoints` table with tenant_id, name, protocol, address, port, zone, status, last_seen
    - Create `stream_configs` table with tenant_id, name, polling_interval, retention, profile, is_sandbox
    - Add CHECK constraints for protocol, zone, status, retention, profile enums
    - Add UNIQUE constraints and indexes per design
    - _Requirements: 4.1, 4.2, 4.4, 4.7, 4.8_

  - [x] 7.2 Create seed 011_connectivity_data.sql
    - Insert 6 connection endpoints (2 per protocol: IEC61850, DNP3, OPC-UA)
    - Insert 3 stream configs (high-frequency, standard, low-frequency)
    - Use CTE pattern with preconditions
    - Add post-seed count validations
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 7.3 Add TypeScript interfaces for Cycle 4 entities
    - Add ConnectionEndpoint, StreamConfig interfaces
    - _Requirements: 8.7_

  - [x] 7.4 Implement Cycle 4 DataProvider methods
    - getConnectionEndpointsByTenant(tenantId, params)
    - createConnectionEndpoint(data)
    - updateConnectionEndpointStatus(id, status)
    - getStreamConfigsByTenant(tenantId, params)
    - createStreamConfig(data)
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 7.5 Create ConnectionEndpointsPage component
    - Route: /assets/connectivity/endpoints
    - List endpoints with pagination, filtering by protocol/status/zone, sorting
    - Display name, protocol, address, port, zone, status, last_seen
    - Create/Edit form with validation (name uniqueness, address format, port range)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.11_

  - [x] 7.6 Create TagMappingPage component
    - Route: /assets/connectivity/tags
    - List tags linked to assets with asset name, protocol, address, tag name
    - Filter by asset, protocol; search by address
    - Bulk tag mapping interface
    - _Requirements: 4.5, 4.6_

  - [x] 7.7 Create StreamConfigPage component
    - Route: /assets/connectivity/streams
    - List stream configs with profile filter
    - Create/Edit form with polling_interval (min 100ms), retention, profile selection
    - Profile defaults: high-frequency (1000ms, 7d), standard (5000-60000ms, 30d), low-frequency (>60000ms, 90d+)
    - _Requirements: 4.7, 4.8_

  - [x] 7.8 Create ConnectionHealthPage component
    - Route: /assets/connectivity/health
    - Display endpoint status timeline (derived from last_seen/status)
    - Current status, last_seen timestamp, uptime percentage
    - Timeline shows last 24 hours with range selector
    - _Requirements: 4.9_

  - [x] 7.9 Create SandboxStreamsPage component
    - Route: /assets/connectivity/sandbox
    - List sandbox stream configs (is_sandbox=true)
    - Client-side simulated telemetry generation
    - "SANDBOX" badge on simulated data
    - _Requirements: 4.10_

  - [ ]* 7.10 Write property test for P2: Entity View Field Completeness
    - **Property 2: Entity View Field Completeness**
    - _For any_ entity (asset type, property set, endpoint, tag, asset, grid line), the rendered view SHALL contain all fields defined in the entity's schema
    - **Validates: Requirements 1.2, 1.5, 4.1, 4.5, 5.2, 6.4, 6.9**

  - [ ]* 7.11 Write smoke tests for Cycle 4 pages
    - Test all 5 Connectivity pages render with seeded data

- [x] 8. Checkpoint - Cycle 4 Complete
  - Ensure all Cycle 4 tests pass
  - Verify migration 015 applied successfully
  - Verify seed 011 runs idempotently
  - Verify all 5 Connectivity pages render with data
  - Ask user if questions arise before proceeding to Cycle 5

- [x] 9. Cycle 5: Portfolio Management
  - Migrations: 016
  - Seeds: 012
  - Provider methods: 6
  - Pages: 4 (AssetPortfolioPage, PortfolioExplorerPage, SavedViewsPage, CrossTenantPortfolioPage)
  - Properties: P3, P4, P5, P6, P9, P13

  - [x] 9.1 Create migration 016_create_portfolio_tables.sql
    - Create `saved_views` table with tenant_id, name, filters (JSONB), description, updated_at
    - Add UNIQUE constraint on (tenant_id, name)
    - Add index on tenant_id
    - _Requirements: 3.7_

  - [x] 9.2 Create seed 012_saved_views.sql
    - Insert 3 saved views (Critical assets, Offline assets, By site)
    - Use CTE pattern with preconditions
    - Add post-seed count validation (>= 3)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 9.3 Add TypeScript interfaces for Cycle 5 entities
    - Add SavedView, AssetFilter, PortfolioKpis interfaces
    - _Requirements: 8.7_

  - [x] 9.4 Implement Cycle 5 DataProvider methods
    - getSavedViewsByTenant(tenantId, params)
    - getSavedViewById(id)
    - createSavedView(data)
    - deleteSavedView(id)
    - getAssetPortfolioKpis(tenantId, filters)
    - getCrossTenantKpis(tenantIds)
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 9.5 Create AssetPortfolioPage component
    - Route: /assets/portfolio
    - KPI cards: total assets, online, offline, maintenance, critical alerts, warning alerts
    - Filter by site_id, asset_type_id, status, criticality, text search
    - Pagination with configurable page sizes (10, 25, 50, 100)
    - Sorting by name, status, criticality, site name
    - Empty state: "No assets match filters"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 9.6 Create PortfolioExplorerPage component
    - Route: /assets/portfolio/explorer
    - Three view modes: Tree, Network, Map
    - Tree: Site → Asset Type → Asset hierarchy using parent_asset_id
    - Network: Topology graph from grid_nodes/grid_lines
    - Map: Geographic markers from geo coordinates
    - View mode toggle persists selection
    - _Requirements: 3.6_

  - [x] 9.7 Create SavedViewsPage component
    - Route: /assets/portfolio/views
    - List saved views with name, description, created_at
    - Create form with name uniqueness validation
    - Apply view action populates filters on AssetPortfolioPage
    - Delete view action
    - _Requirements: 3.7, 3.8_

  - [x] 9.8 Create CrossTenantPortfolioPage component
    - Route: /assets/portfolio/cross-tenant
    - Aggregated metrics only: total assets, online %, alert counts per tenant
    - No individual asset data exposed
    - Tenant isolation enforced
    - _Requirements: 3.9, 3.10_

  - [-]* 9.9 Write property test for P3: Filter Result Correctness
    - **Property 3: Filter Result Correctness**
    - _For any_ list query with filter parameters, all items in the result set SHALL match the filter criteria
    - **Validates: Requirements 3.2, 6.2, 7.4**

  - [-]* 9.10 Write property test for P4: Sort Order Correctness
    - **Property 4: Sort Order Correctness**
    - _For any_ list query with sort parameters, the result set SHALL be ordered according to the specified sort field and direction
    - **Validates: Requirements 3.5**

  - [-]* 9.11 Write property test for P5: Pagination Correctness
    - **Property 5: Pagination Correctness**
    - _For any_ list query with pagination parameters (limit, offset), the result set size SHALL not exceed the limit and SHALL skip the specified offset
    - **Validates: Requirements 3.4, 8.4**

  - [-]* 9.12 Write property test for P6: Tenant Isolation
    - **Property 6: Tenant Isolation**
    - _For any_ tenant-scoped query, the result set SHALL only contain items belonging to the specified tenant
    - **Validates: Requirements 3.10, 8.6**

  - [-]* 9.13 Write property test for P9: Saved View Round-Trip
    - **Property 9: Saved View Round-Trip**
    - _For any_ saved view, creating it and then retrieving it by ID SHALL return an equivalent filter configuration
    - **Validates: Requirements 3.7, 3.8**

  - [-]* 9.14 Write property test for P13: KPI Calculation Correctness
    - **Property 13: KPI Calculation Correctness**
    - _For any_ portfolio KPI query, the total assets count SHALL equal the sum of online, offline, and maintenance counts
    - **Validates: Requirements 3.1, 7.1**

  - [-]* 9.15 Write smoke tests for Cycle 5 pages
    - Test all 4 Portfolio pages render with seeded data

- [x] 10. Checkpoint - Cycle 5 Complete
  - Ensure all Cycle 5 tests pass
  - Verify migration 016 applied successfully
  - Verify seed 012 runs idempotently
  - Verify all 4 Portfolio pages render with data
  - Ask user if questions arise before proceeding to Cycle 6

- [ ] 11. Cycle 6: Asset Detail & Context
  - Migrations: 017
  - Seeds: 013, 014
  - Provider methods: 4
  - Pages: 1 (AssetDetailPage)
  - Properties: P2 (extended)

  - [x] 11.1 Create migration 017_create_asset_detail_tables.sql
    - Create `asset_documents` table with asset_id, tenant_id, name, category, file_path, file_size, mime_type
    - Create `asset_audit_log` table with asset_id, tenant_id, action, changed_fields, old_values, new_values, user_id
    - Add CHECK constraints for category and action enums
    - Add indexes per design
    - _Requirements: 5.5, 5.6_

  - [x] 11.2 Create seed 013_asset_documents.sql
    - Insert 6 documents (2 per category: manual, drawing, certificate)
    - Link to existing assets from seed 003
    - Use CTE pattern with preconditions
    - Add post-seed count validation (>= 6)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 11.3 Create seed 014_asset_audit_log.sql
    - Insert 10 audit log entries (mix of create, update, status_change actions)
    - Link to existing assets from seed 003
    - Use CTE pattern with preconditions
    - Add post-seed count validation (>= 10)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 11.4 Add TypeScript interfaces for Cycle 6 entities
    - Add AssetDocument, AuditLogEntry, TopologyLink interfaces
    - _Requirements: 8.7_

  - [x] 11.5 Implement Cycle 6 DataProvider methods
    - getAssetDocuments(assetId)
    - createAssetDocument(data)
    - getAssetAuditLog(assetId, params)
    - getAssetTopologyLinks(assetId)
    - _Requirements: 8.1, 8.2_

  - [x] 11.6 Create AssetDetailPage component
    - Route: /assets/transmission/:assetId
    - Tabbed interface: Overview, Telemetry, Relationships, Documents, History, Compliance
    - Tab selection persists in URL
    - _Requirements: 5.1_

  - [x] 11.7 Implement Overview tab
    - Display asset properties: name, asset_type, status, criticality, site name
    - Render custom properties from properties JSONB
    - Alert summary if active alerts exist (count by severity, most recent title)
    - _Requirements: 5.2, 5.9_

  - [x] 11.8 Implement Telemetry tab
    - List linked telemetry_points with metric, unit, current value, limits
    - Empty state if no telemetry_points linked
    - _Requirements: 5.3_

  - [x] 11.9 Implement Relationships tab
    - Display parent asset (if parent_asset_id set)
    - Display child assets (where parent_asset_id = this asset)
    - Display topology links from grid_asset_links (node or line)
    - Each relationship links to related entity
    - _Requirements: 5.4_

  - [x] 11.10 Implement Documents tab
    - List documents grouped by category
    - Display name, category, file_size, mime_type, uploaded_at
    - "View" links for external references
    - _Requirements: 5.5_

  - [x] 11.11 Implement History tab
    - Display audit trail from asset_audit_log
    - Show action, changed_fields, old_values, new_values, created_at
    - Sorted newest first with pagination
    - _Requirements: 5.6_

  - [x] 11.12 Implement Compliance tab
    - Placeholder compliance status (compliant, non-compliant, pending review)
    - Notes field
    - Full framework integration deferred
    - _Requirements: 5.7_

  - [x] 11.13 Implement asset property editing
    - Edit form validates against asset_type's properties_schema
    - Field-specific errors on validation failure
    - Create audit_log entry on success
    - Refresh detail view after save
    - _Requirements: 5.8_

  - [ ]* 11.14 Write extended property test for P2: Entity View Field Completeness (Asset Detail)
    - **Property 2 (extended): Entity View Field Completeness**
    - _For any_ asset, the detail view SHALL contain all fields defined in the asset's type schema
    - **Validates: Requirements 5.2**

  - [ ]* 11.15 Write smoke test for AssetDetailPage
    - Test AssetDetailPage renders with seeded data
    - Test all tabs render correctly

- [x] 12. Checkpoint - Cycle 6 Complete
  - Ensure all Cycle 6 tests pass
  - Verify migration 017 applied successfully
  - Verify seeds 013, 014 run idempotently
  - Verify AssetDetailPage renders with all tabs
  - Ask user if questions arise before proceeding to Cycle 7

- [x] 13. Cycle 7: Dashboard & Alerts Integration
  - Migrations: None (uses existing alerts table)
  - Seeds: None (uses existing alert seeds)
  - Provider methods: 2
  - Pages: 2 (AssetsDashboard, AssetsAlerts)
  - Properties: P14

  - [x] 13.1 Implement Cycle 7 DataProvider methods
    - updateAlertStatus(alertId, status) - update alert status
    - (getAssetPortfolioKpis already implemented in Cycle 5)
    - _Requirements: 7.6, 8.1_

  - [x] 13.2 Update AssetsDashboard component
    - Route: /assets (Navigate landing page)
    - KPI widgets: Asset Health pie chart, Connectivity Status, Alert Summary
    - Recent alerts section (source_type IN ('asset', 'grid_node', 'grid_line'))
    - Sorted by created_at desc, limited to 10
    - Widget links to relevant detail pages
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.3 Update AssetsAlerts component
    - Route: /assets/alerts (List page)
    - Filter by severity, status, source_type
    - Display title, severity badge, status badge, source name, created_at
    - Pagination (default 25), sorting by created_at/severity
    - _Requirements: 7.4, 7.5_

  - [x] 13.4 Implement alert actions
    - Acknowledge: open → acknowledged
    - Start Work: acknowledged → in-progress
    - Resolve: in-progress → closed
    - Status update persists and refreshes list
    - _Requirements: 7.6_

  - [x] 13.5 Implement alert navigation
    - Click alert → navigate based on source_type:
      - 'asset' → AssetDetailPage
      - 'grid_node' → NetworkTopologyPage with node highlighted
      - 'grid_line' → LinearAssetsPage with line highlighted
    - _Requirements: 7.3_

  - [x]* 13.6 Write property test for P14: Alert Status Update Persistence
    - **Property 14: Alert Status Update Persistence**
    - _For any_ alert status update, the new status SHALL be persisted and retrievable
    - **Validates: Requirements 7.6**

  - [x]* 13.7 Write smoke tests for Cycle 7 pages
    - Test AssetsDashboard renders with KPIs and alerts
    - Test AssetsAlerts renders with filtering and actions

- [x] 14. Checkpoint - Cycle 7 Complete
  - Ensure all Cycle 7 tests pass
  - Verify AssetsDashboard and AssetsAlerts render correctly
  - Ask user if questions arise before final validation

- [x] 15. Final Validation & Integration
  - Run full property test suite (all 15 properties)
  - Verify all 7 migrations applied successfully
  - Verify all 8 seeds run idempotently
  - Verify all 36 provider methods implemented
  - Verify all 24 pages functional
  - Run `npm run build` - must succeed
  - Run `npm run lint` - must pass
  - Run `npm run test` - must pass

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each cycle implements schema → seed → provider → UI → tests end-to-end
- Do NOT implement future cycle components until current cycle is complete
- Property tests use fast-check library with minimum 100 iterations
- All queries must filter by tenant_id for tenant isolation
- Use `getDefaultTransmissionTenantId()` helper for tenant resolution
