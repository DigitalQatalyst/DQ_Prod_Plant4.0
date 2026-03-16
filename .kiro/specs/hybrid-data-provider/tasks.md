# Implementation Plan: Hybrid Data Provider for Power Transmission

## Overview

This implementation follows a PR-based approach to incrementally add hybrid data provider support for Power Transmission while keeping Upstream O&G on mocks. Tasks are ordered to minimize risk and enable early validation.

## Tasks

- [x] 1. Add TypeScript types for Transmission entities
  - Create `src/types/transmission.ts` with GridNode, GridLine, TransmissionAsset, TransmissionKpis interfaces
  - Export types from `src/types/index.ts`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Extend DataProvider interface with Transmission methods
  - [x] 2.1 Add Transmission method signatures to DataProvider interface
    - Add `getTransmissionTenants()`, `getGridNodesByTenant()`, `getGridLinesByTenant()`, `getTransmissionAssetsByTenant()`, `getTransmissionOverviewKpis()` to `src/lib/data/DataProvider.ts`
    - Import Transmission types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 Add stub implementations to MockProvider
    - Add Transmission methods returning empty arrays to `src/lib/data/providers/MockProvider.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.3 Add stub implementations to SupabaseProvider
    - Add Transmission methods with `notImplemented()` calls to `src/lib/data/providers/SupabaseProvider.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Implement HybridProvider
  - [x] 3.1 Create HybridProvider class
    - Create `src/lib/data/providers/HybridProvider.ts`
    - Implement delegation logic: Transmission methods → SupabaseProvider, others → MockProvider
    - Add singleton pattern with `getHybridProvider()`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [x] 3.2 Update provider factory for hybrid mode
    - Update `src/lib/data/index.ts` to return HybridProvider when `VITE_DATA_BACKEND=hybrid`
    - Update `src/lib/supabase.ts` to support 'hybrid' backend type
    - Update `src/vite-env.d.ts` with 'hybrid' type
    - _Requirements: 1.1_
  - [ ]* 3.3 Write property test for delegation routing
    - **Property 1: Hybrid Provider Delegation Routing**
    - **Validates: Requirements 1.2, 1.3**
  - [ ]* 3.4 Write property test for error propagation
    - **Property 2: Error Propagation Without Fallback**
    - **Validates: Requirements 1.4**

- [x] 4. Checkpoint - Verify hybrid provider wiring
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `VITE_DATA_BACKEND=hybrid` returns HybridProvider
  - Verify app still works with `VITE_DATA_BACKEND=mock`

- [x] 5. Create core database schema migration
  - [x] 5.1 Create tenants table migration
    - Create `supabase/migrations/001_create_tenants.sql`
    - Include id, name, sector, subsector, scenario_tag columns
    - _Requirements: 3.1_
  - [x] 5.2 Create sites table migration
    - Create `supabase/migrations/002_create_sites.sql`
    - Include foreign key to tenants
    - _Requirements: 3.2_
  - [x] 5.3 Create asset_types table migration
    - Create `supabase/migrations/003_create_asset_types.sql`
    - Include JSONB properties_schema column
    - _Requirements: 3.3_
  - [x] 5.4 Create assets table migration
    - Create `supabase/migrations/004_create_assets.sql`
    - Include foreign keys to tenants, sites, asset_types, parent_asset
    - Include JSONB properties column
    - _Requirements: 3.4_
  - [x] 5.5 Create alerts table migration
    - Create `supabase/migrations/005_create_alerts.sql`
    - Include source_type enum, JSONB payload
    - _Requirements: 3.5_
  - [x] 5.6 Create tags and telemetry_points tables migration
    - Create `supabase/migrations/006_create_telemetry.sql`
    - Include tags and telemetry_points tables
    - _Requirements: 3.6, 3.7_

- [x] 6. Create Power Transmission domain schema migration
  - [x] 6.1 Create grid_nodes table migration
    - Create `supabase/migrations/007_create_grid_nodes.sql`
    - Include node_type, voltage_kv, geo coordinates
    - _Requirements: 4.1_
  - [x] 6.2 Create grid_lines table migration
    - Create `supabase/migrations/008_create_grid_lines.sql`
    - Include foreign keys to grid_nodes for from/to
    - _Requirements: 4.2_
  - [x] 6.3 Create grid_asset_links table migration
    - Create `supabase/migrations/009_create_grid_asset_links.sql`
    - Include check constraint for node_id OR line_id
    - _Requirements: 4.3_
  - [ ]* 6.4 Write property test for foreign key constraints
    - **Property 5: Foreign Key Referential Integrity**
    - **Validates: Requirements 3.8, 4.4, 4.5**

- [x] 7. Checkpoint - Verify database schema
  - Ensure all tests pass, ask the user if questions arise.
  - Run migrations against local Supabase
  - Verify all tables created with correct columns and constraints

- [x] 8. Create seed data for Power Transmission demo
  - [x] 8.1 Create tenant and sites seed
    - Create `supabase/seed/001_transmission_tenant.sql`
    - Insert Kenya Power tenant with sector='power', subsector='transmission'
    - Insert 3 sites (Nairobi, Mombasa, Kisumu)
    - _Requirements: 5.1, 5.2_
  - [x] 8.2 Create grid topology seed
    - Create `supabase/seed/002_grid_topology.sql`
    - Insert 5 grid nodes and 6 grid lines forming connected network
    - _Requirements: 5.3_
  - [x] 8.3 Create assets seed
    - Create `supabase/seed/003_assets.sql`
    - Insert asset types (TRANSFORMER, BREAKER, BAY, METER)
    - Insert 15 assets distributed across sites
    - _Requirements: 5.4_
  - [x] 8.4 Create telemetry and alerts seed
    - Create `supabase/seed/004_telemetry_alerts.sql`
    - Insert 30 telemetry points for voltage, current, temperature
    - Insert 12 alerts with mixed source_types
    - _Requirements: 5.5, 5.6_
  - [x] 8.5 Create operational data seed
    - Create `supabase/seed/005_operational.sql`
    - Insert automation workflows, alarm rules, CI projects
    - _Requirements: 5.7, 5.8_

- [x] 9. Implement SupabaseProvider Transmission methods
  - [x] 9.1 Implement getTransmissionTenants
    - Query tenants table filtering by sector='power'
    - Map database rows to TransmissionTenant type
    - _Requirements: 6.1_
  - [x] 9.2 Implement getGridNodesByTenant
    - Query grid_nodes table filtering by tenant_id
    - Map database rows to GridNode type
    - _Requirements: 6.2_
  - [x] 9.3 Implement getGridLinesByTenant
    - Query grid_lines table filtering by tenant_id
    - Map database rows to GridLine type
    - _Requirements: 6.3_
  - [x] 9.4 Implement getTransmissionAssetsByTenant
    - Query assets table with join to asset_types
    - Filter by tenant_id
    - Map to TransmissionAsset type
    - _Requirements: 6.4_
  - [x] 9.5 Implement getTransmissionOverviewKpis
    - Compute KPIs from assets, alerts, grid_nodes, grid_lines
    - Use aggregate queries or SQL view
    - _Requirements: 6.5_
  - [ ]* 9.6 Write property test for sector filtering
    - **Property 3: Transmission Method Sector Filtering**
    - **Validates: Requirements 2.6, 6.1**
  - [ ]* 9.7 Write property test for tenant filtering
    - **Property 4: Tenant Filtering Consistency**
    - **Validates: Requirements 6.2, 6.3, 6.4**
  - [ ]* 9.8 Write property test for KPI consistency
    - **Property 6: KPI Computation Consistency**
    - **Validates: Requirements 6.5**
  - [ ]* 9.9 Write property test for error messages
    - **Property 7: Database Error Messages**
    - **Validates: Requirements 6.6**

- [x] 10. Checkpoint - Verify Transmission data flow
  - Ensure all tests pass, ask the user if questions arise.
  - Test with `VITE_DATA_BACKEND=hybrid`
  - Verify Transmission methods return seeded data
  - Verify generic methods still return mock data

- [x] 11. Update environment configuration
  - [x] 11.1 Update .env files
    - Add `VITE_DATA_BACKEND=hybrid` option to `.env.example`
    - Document hybrid mode in `.env.example` comments
    - _Requirements: 1.1_
  - [x] 11.2 Update SUPABASE_SETUP.md documentation
    - Add Phase C completion notes
    - Document hybrid mode usage
    - Add troubleshooting section
    - _Requirements: 1.1_

- [x] 12. Final checkpoint - End-to-end verification
  - Ensure all tests pass, ask the user if questions arise.
  - Verify hybrid mode works with real Supabase connection
  - Verify mock mode still works without Supabase
  - Verify no breaking changes to existing Upstream pages

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Migrations should be run in order (001, 002, 003...)
- Seed files should be run after all migrations complete
