# Requirements Document

## Introduction

This feature introduces a hybrid data provider architecture that enables Power Transmission pages to use Supabase while keeping Upstream Oil & Gas pages on local mocks. This allows gradual migration to a real database without disrupting existing functionality, supporting parallel demo capabilities for both sectors.

## Glossary

- **HybridProvider**: A data provider that delegates calls to either SupabaseProvider or MockProvider based on the method being called
- **Transmission_Method**: Provider methods specific to Power Transmission domain (e.g., `getGridNodesByTenant`, `getTransmissionAssetsByTenant`)
- **Core_Schema**: Database tables shared across all feature areas (tenants, sites, assets, alerts, tags)
- **Domain_Power_Schema**: Database tables specific to Power Transmission topology (grid_nodes, grid_lines)
- **Seed_Data**: Initial demo dataset for Power Transmission tenant with cross-area coverage
- **VITE_DATA_BACKEND**: Environment variable controlling data backend mode (mock | supabase | hybrid)

## Requirements

### Requirement 1: Hybrid Provider Mode

**User Story:** As a developer, I want to run the app in hybrid mode, so that Power Transmission uses Supabase while Upstream O&G continues using mocks.

#### Acceptance Criteria

1. WHEN `VITE_DATA_BACKEND` is set to `hybrid`, THE HybridProvider SHALL be instantiated by the provider factory
2. WHEN a Transmission-specific method is called on HybridProvider, THE HybridProvider SHALL delegate to SupabaseProvider
3. WHEN a non-Transmission method is called on HybridProvider, THE HybridProvider SHALL delegate to MockProvider
4. IF SupabaseProvider throws an error for a Transmission method, THEN THE HybridProvider SHALL propagate the error without falling back to mock
5. THE HybridProvider SHALL implement all methods defined in the DataProvider interface

### Requirement 2: Transmission-Specific Provider Methods

**User Story:** As a developer, I want dedicated provider methods for Transmission data, so that I can clearly separate Transmission queries from generic/Upstream queries.

#### Acceptance Criteria

1. THE DataProvider interface SHALL include `getTransmissionTenants()` returning Transmission-sector tenants
2. THE DataProvider interface SHALL include `getGridNodesByTenant(tenantId)` returning grid topology nodes
3. THE DataProvider interface SHALL include `getGridLinesByTenant(tenantId)` returning grid topology lines
4. THE DataProvider interface SHALL include `getTransmissionAssetsByTenant(tenantId)` returning Transmission assets
5. THE DataProvider interface SHALL include `getTransmissionOverviewKpis(tenantId)` returning dashboard KPIs
6. WHEN any Transmission method is called, THE method SHALL filter results to Power Transmission sector only

### Requirement 3: Core Database Schema

**User Story:** As a developer, I want a core database schema that works across all sectors, so that future migrations can reuse the same structure.

#### Acceptance Criteria

1. THE Core_Schema SHALL include a `tenants` table with id, name, sector, subsector, and scenario_tag columns
2. THE Core_Schema SHALL include a `sites` table with id, tenant_id, name, region, geo_lat, and geo_lng columns
3. THE Core_Schema SHALL include an `asset_types` table with id, tenant_id, code, name, category, and properties_schema (JSONB) columns
4. THE Core_Schema SHALL include an `assets` table with id, tenant_id, site_id, asset_type_id, name, status, criticality, parent_asset_id, and properties (JSONB) columns
5. THE Core_Schema SHALL include an `alerts` table with id, tenant_id, source_type, source_id, severity, status, title, created_at, and payload (JSONB) columns
6. THE Core_Schema SHALL include a `tags` table for protocol/address mapping with tenant_id, asset_id, protocol, and address columns
7. THE Core_Schema SHALL include a `telemetry_points` table with tenant_id, asset_id, tag_id, metric, unit, and limits (JSONB) columns
8. WHEN a table has tenant_id, THE table SHALL have a foreign key constraint to tenants.id

### Requirement 4: Power Transmission Domain Schema

**User Story:** As a developer, I want Power Transmission-specific tables for grid topology, so that Transmission pages can display realistic network data.

#### Acceptance Criteria

1. THE Domain_Power_Schema SHALL include a `grid_nodes` table with id, tenant_id, site_id, name, node_type, voltage_kv, region, geo_lat, and geo_lng columns
2. THE Domain_Power_Schema SHALL include a `grid_lines` table with id, tenant_id, name, from_node_id, to_node_id, voltage_kv, length_km, and status columns
3. THE Domain_Power_Schema SHALL include a `grid_asset_links` table with asset_id, node_id (nullable), and line_id (nullable) columns
4. WHEN grid_lines references from_node_id or to_node_id, THE table SHALL have foreign key constraints to grid_nodes.id
5. WHEN grid_asset_links references node_id or line_id, THE table SHALL have foreign key constraints to the respective tables

### Requirement 5: Seed Data for Power Transmission Demo

**User Story:** As a demo presenter, I want pre-populated Transmission data across all feature areas, so that the UI shows realistic content without manual setup.

#### Acceptance Criteria

1. THE Seed_Data SHALL include 1 tenant with sector='power' and subsector='transmission' and scenario_tag='power_transmission_demo_v1'
2. THE Seed_Data SHALL include 2-3 sites representing substations or regions
3. THE Seed_Data SHALL include 5 grid nodes and 6 grid lines forming a connected topology
4. THE Seed_Data SHALL include 10-20 assets of types TRANSFORMER, BREAKER, BAY, and METER
5. THE Seed_Data SHALL include 20-40 telemetry points covering line loading, voltage, breaker status, and temperature metrics
6. THE Seed_Data SHALL include 10-15 alerts with mixed source_types (asset, grid_node, grid_line, security, automation)
7. THE Seed_Data SHALL include 2-3 automation workflows and 2-3 alarm rules
8. THE Seed_Data SHALL include 3-5 CI projects or SIM issues for Operational Excellence pages

### Requirement 6: SupabaseProvider Transmission Method Implementation

**User Story:** As a developer, I want SupabaseProvider to implement Transmission methods with real database queries, so that Transmission pages display live data.

#### Acceptance Criteria

1. WHEN `getTransmissionTenants()` is called, THE SupabaseProvider SHALL query tenants table filtering by sector='power'
2. WHEN `getGridNodesByTenant(tenantId)` is called, THE SupabaseProvider SHALL query grid_nodes table filtering by tenant_id
3. WHEN `getGridLinesByTenant(tenantId)` is called, THE SupabaseProvider SHALL query grid_lines table filtering by tenant_id
4. WHEN `getTransmissionAssetsByTenant(tenantId)` is called, THE SupabaseProvider SHALL query assets table joining with asset_types and filtering by tenant_id
5. WHEN `getTransmissionOverviewKpis(tenantId)` is called, THE SupabaseProvider SHALL compute KPIs from assets, alerts, and telemetry_points tables
6. IF a database query fails, THEN THE SupabaseProvider SHALL throw an error with descriptive message including the operation name

### Requirement 7: TypeScript Type Definitions

**User Story:** As a developer, I want TypeScript types for all Transmission entities, so that I get compile-time safety when working with Transmission data.

#### Acceptance Criteria

1. THE types module SHALL export a `GridNode` interface matching the grid_nodes table structure
2. THE types module SHALL export a `GridLine` interface matching the grid_lines table structure
3. THE types module SHALL export a `TransmissionAsset` interface extending the base Asset type with Transmission-specific properties
4. THE types module SHALL export a `TransmissionKpis` interface for overview dashboard metrics
5. WHEN provider methods return Transmission entities, THE return types SHALL use the defined interfaces
