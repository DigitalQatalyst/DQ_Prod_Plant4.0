-- =============================================================================
-- DISABLE RLS FOR CORE TABLES
-- Description: Disable Row Level Security for core infrastructure tables
-- Note: This should be removed or replaced with proper RLS in production
-- =============================================================================

-- Core infrastructure tables
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE sites DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_nodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE grid_asset_links DISABLE ROW LEVEL SECURITY;

-- Log the operation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        INSERT INTO security_audit_log (
            tenant_id,
            event_type,
            event_category,
            event_name,
            outcome,
            severity,
            action_performed,
            additional_data
        ) 
        SELECT 
            id,
            'configuration_change'::audit_event_type,
            'system',
            'RLS Disabled - Core Tables',
            'success'::audit_outcome,
            'warning'::audit_severity,
            'Disabled RLS for core infrastructure tables for development/testing',
            '{"scope": "core_tables", "reason": "development"}'::jsonb
        FROM tenants
        LIMIT 1;
    END IF;
END $$;
