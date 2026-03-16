-- =============================================================================
-- DISABLE RLS GLOBALLY FOR ALL TABLES (DEVELOPMENT ONLY)
-- Description: Dynamically iterates through all tables in the public schema 
-- and disables Row Level Security. This ensures that no table is missed, 
-- regardless of when it was created or by which migration.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Iterate through all tables in the public schema
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        -- Execute ALTER TABLE ... DISABLE ROW LEVEL SECURITY for each table
        -- using quote_ident to safely handle table names with special characters
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
        -- RAISE NOTICE 'Disabled RLS for table: %', r.tablename;
    END LOOP;
END $$;

-- Log the operation for audit purposes
DO $$
BEGIN
    -- Check if tenants table exists to avoid error on fresh init
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        -- Check if security_audit_log exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_audit_log') THEN
             -- Insert log if possible (best effort)
             BEGIN
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
                    'Global RLS Disable',
                    'success'::audit_outcome,
                    'warning'::audit_severity,
                    'Disabled RLS for ALL public tables via dynamic script',
                    '{"scope": "global", "reason": "development_fix"}'::jsonb
                FROM tenants
                LIMIT 1;
             EXCEPTION WHEN OTHERS THEN
                -- Ignore errors during logging to ensure the main operation succeeds
                NULL;
             END;
        END IF;
    END IF;
END $$;

COMMIT;
