-- ============================================================================
-- Disable Row Level Security (RLS) on All Tables
-- ============================================================================
-- This migration disables RLS on all tables in the database for development
-- and testing purposes. This allows unrestricted access to all data.
--
-- WARNING: This should only be used in development/testing environments.
-- For production, proper RLS policies should be implemented.
-- ============================================================================

BEGIN;

-- Disable RLS on core tables
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on telemetry tables
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_points DISABLE ROW LEVEL SECURITY;

-- Disable RLS on grid topology tables
ALTER TABLE grid_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_asset_links DISABLE ROW LEVEL SECURITY;

-- Disable RLS on operational data table
ALTER TABLE operational_data DISABLE ROW LEVEL SECURITY;

-- Disable RLS on APM transmission tables
ALTER TABLE asset_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_criticality_model DISABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_spare_parts DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- RLS Disabled on All Tables
-- ============================================================================
-- The following tables now have RLS disabled:
-- - tenants
-- - sites
-- - asset_types
-- - assets
-- - alerts
-- - tags
-- - telemetry_points
-- - grid_nodes
-- - grid_lines
-- - grid_asset_links
-- - operational_data
-- - asset_relationships
-- - asset_lifecycle_events
-- - asset_criticality_model
-- - fmea_entries
-- - spare_parts
-- - asset_spare_parts
-- ============================================================================
