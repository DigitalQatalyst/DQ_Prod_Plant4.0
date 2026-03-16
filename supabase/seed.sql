-- ============================================================================
-- Seed File Reference for Supabase Local Development
-- ============================================================================
-- This file documents the seed execution order
-- Actual seed files are configured in supabase/config.toml
--
-- IMPORTANT: Seeds are for LOCAL DEVELOPMENT ONLY
-- Do NOT automatically run seeds on staging/production
-- For remote environments, manually run seeds via Supabase Studio SQL Editor
--
-- Seed Numbering:
--   001-006: Baseline (Cycle 0)
--   007-014: Assets/IoT Feature Area (Cycles 1-6)
--   015+:    Future feature areas
-- ============================================================================

-- ============================================================================
-- Baseline Seeds (Cycle 0)
-- ============================================================================

-- 001: Create transmission tenant (DEWA - Transmission)
-- File: seed_sources/001_transmission_tenant.sql
-- Dependencies: None
-- Creates: 1 tenant with scenario_tag = 'power_transmission_demo_v1'

-- 002: Create grid topology (nodes, lines, links)
-- File: seed_sources/002_grid_topology.sql
-- Dependencies: 001 (tenant)
-- Creates: ~10 grid_nodes, ~8 grid_lines, ~15 grid_asset_links

-- 003: Create assets (transformers, breakers, meters)
-- File: seed_sources/003_assets.sql
-- Dependencies: 001 (tenant), 002 (grid topology)
-- Creates: ~20 assets across multiple types

-- 004: Create telemetry points and alerts
-- File: seed_sources/004_telemetry_alerts.sql
-- Dependencies: 003 (assets)
-- Creates: ~30 telemetry_points, ~10 alerts

-- 005: Create operational data
-- File: seed_sources/005_operational.sql
-- Dependencies: 003 (assets)
-- Creates: operational_data records

-- ============================================================================
-- Cycle 1: Asset Catalog & Types
-- ============================================================================

-- 007: Create property sets (reusable metadata field collections)
-- File: seed_sources/007_property_sets.sql
-- Dependencies: 001 (tenant)
-- Creates: 5 property_sets (technical, operational, safety, financial, maintenance)

-- 008: Create lifecycle states (asset lifecycle stage definitions)
-- File: seed_sources/008_lifecycle_states.sql
-- Dependencies: 001 (tenant)
-- Creates: 15 lifecycle_states (5 states × 3 categories)

-- ============================================================================
-- Future Cycles (Add to config.toml as implemented)
-- ============================================================================

-- Cycle 2: Discovery & Onboarding
-- File: seed_sources/009_discovery_data.sql

-- Cycle 3: Location & Topology
-- File: seed_sources/010_linear_asset_issues.sql

-- Cycle 4: Connectivity
-- File: seed_sources/011_connectivity_data.sql

-- Cycle 5: Portfolio Management
-- File: seed_sources/012_saved_views.sql

-- Cycle 6: Asset Detail
-- File: seed_sources/013_asset_documents.sql
-- File: seed_sources/014_asset_audit_log.sql

-- ============================================================================
-- Configuration
-- ============================================================================
-- Seeds are configured in supabase/config.toml under [db.seed]
-- To add new seeds, update the sql_paths array in config.toml
-- ============================================================================
