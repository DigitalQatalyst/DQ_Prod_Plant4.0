-- Migration: Disable RLS for Optimisation Tables (Development Only)
-- Description: Disables Row Level Security on all opt_ tables for development purposes
-- WARNING: This is for local development only. Never run in production.

-- Disable RLS on optimisation tables
ALTER TABLE opt_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE opt_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE opt_playbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE opt_opportunity_playbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE opt_simulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE opt_publish_events DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they were created in 016_create_optimisation_tables.sql)
DROP POLICY IF EXISTS opt_opportunities_tenant_isolation ON opt_opportunities;
DROP POLICY IF EXISTS opt_recommendations_tenant_isolation ON opt_recommendations;
DROP POLICY IF EXISTS opt_playbooks_tenant_isolation ON opt_playbooks;
DROP POLICY IF EXISTS opt_opportunity_playbooks_tenant_isolation ON opt_opportunity_playbooks;
DROP POLICY IF EXISTS opt_simulations_tenant_isolation ON opt_simulations;
DROP POLICY IF EXISTS opt_publish_events_tenant_isolation ON opt_publish_events;

-- Add comment
COMMENT ON TABLE opt_opportunities IS 'AI-identified optimization opportunities ranked by impact score and confidence (RLS DISABLED for dev)';
COMMENT ON TABLE opt_recommendations IS 'Specific actionable recommendations for optimization opportunities (RLS DISABLED for dev)';
COMMENT ON TABLE opt_playbooks IS 'Reusable best-practice playbooks for common optimization scenarios (RLS DISABLED for dev)';
COMMENT ON TABLE opt_opportunity_playbooks IS 'Links opportunities to applicable playbooks with relevance scoring (RLS DISABLED for dev)';
COMMENT ON TABLE opt_simulations IS 'Simulation results for recommendations (load flow, voltage analysis, etc.) (RLS DISABLED for dev)';
COMMENT ON TABLE opt_publish_events IS 'Tracks when opportunities/recommendations are published to SIM or CI systems (RLS DISABLED for dev)';
