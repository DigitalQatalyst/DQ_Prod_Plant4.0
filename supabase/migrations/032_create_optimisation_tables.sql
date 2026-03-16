-- Migration: Create Optimisation (AI-powered) Tables
-- Description: Creates all tables for the Optimisation feature set including opportunities, recommendations, playbooks, simulations, and publish events
-- Requirements: 10.1-10.6, 11.1-11.6, 12.1-12.6, 13.1-13.6, 14.1-14.7, 17.1-17.3, 19.1-19.6, 21.1-21.6

-- =====================================================
-- OPTIMISATION OPPORTUNITIES TABLE
-- =====================================================
-- Stores AI-identified optimization opportunities ranked by impact
CREATE TABLE opt_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opp_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('loss-reduction', 'reliability', 'loading', 'voltage', 'asset-health', 'operational-efficiency')),
  status TEXT CHECK (status IN ('identified', 'analyzing', 'planning', 'published', 'archived')) DEFAULT 'identified',
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  rank_score DOUBLE PRECISION NOT NULL CHECK (rank_score >= 0 AND rank_score <= 100),
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  estimated_impact_mwh DOUBLE PRECISION,
  estimated_impact_cost DOUBLE PRECISION,
  estimated_savings DOUBLE PRECISION,
  description TEXT NOT NULL,
  analysis JSONB DEFAULT '{}',
  site_id UUID REFERENCES sites(id),
  asset_id UUID REFERENCES assets(id),
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  telemetry_point_id UUID REFERENCES telemetry_points(id),
  identified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_opportunities_tenant_ref_unique UNIQUE(tenant_id, opp_ref)
);

-- Add indexes for performance
CREATE INDEX idx_opt_opportunities_tenant_id ON opt_opportunities(tenant_id);
CREATE INDEX idx_opt_opportunities_status ON opt_opportunities(status);
CREATE INDEX idx_opt_opportunities_rank_score ON opt_opportunities(rank_score DESC);
CREATE INDEX idx_opt_opportunities_confidence ON opt_opportunities(confidence DESC);
CREATE INDEX idx_opt_opportunities_category ON opt_opportunities(category);
CREATE INDEX idx_opt_opportunities_site_id ON opt_opportunities(site_id);
CREATE INDEX idx_opt_opportunities_asset_id ON opt_opportunities(asset_id);
CREATE INDEX idx_opt_opportunities_identified_at ON opt_opportunities(identified_at DESC);

-- Add table comment
COMMENT ON TABLE opt_opportunities IS 'AI-identified optimization opportunities ranked by impact score and confidence';

-- =====================================================
-- OPTIMISATION RECOMMENDATIONS TABLE
-- =====================================================
-- Stores specific actionable recommendations for opportunities
CREATE TABLE opt_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  rec_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('operational-change', 'asset-upgrade', 'maintenance', 'configuration', 'control-adjustment', 'load-redistribution')),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('draft', 'pending-review', 'approved', 'rejected', 'published')) DEFAULT 'draft',
  estimated_effort_hours DOUBLE PRECISION,
  estimated_cost DOUBLE PRECISION,
  estimated_benefit DOUBLE PRECISION,
  implementation_steps JSONB DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '[]',
  created_by TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_recommendations_tenant_ref_unique UNIQUE(tenant_id, rec_ref)
);

-- Add indexes for performance
CREATE INDEX idx_opt_recommendations_tenant_id ON opt_recommendations(tenant_id);
CREATE INDEX idx_opt_recommendations_opportunity_id ON opt_recommendations(opportunity_id);
CREATE INDEX idx_opt_recommendations_status ON opt_recommendations(status);
CREATE INDEX idx_opt_recommendations_priority ON opt_recommendations(priority);
CREATE INDEX idx_opt_recommendations_action_type ON opt_recommendations(action_type);

-- Add table comment
COMMENT ON TABLE opt_recommendations IS 'Specific actionable recommendations for optimization opportunities';

-- =====================================================
-- OPTIMISATION PLAYBOOKS TABLE
-- =====================================================
-- Stores reusable best-practice playbooks for common optimization scenarios
CREATE TABLE opt_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  playbook_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('loss-reduction', 'reliability', 'loading', 'voltage', 'asset-health', 'operational-efficiency')),
  description TEXT NOT NULL,
  applicability_criteria JSONB DEFAULT '{}',
  steps JSONB DEFAULT '[]',
  expected_outcomes JSONB DEFAULT '[]',
  success_metrics JSONB DEFAULT '[]',
  case_studies JSONB DEFAULT '[]',
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_playbooks_tenant_ref_unique UNIQUE(tenant_id, playbook_ref)
);

-- Add indexes for performance
CREATE INDEX idx_opt_playbooks_tenant_id ON opt_playbooks(tenant_id);
CREATE INDEX idx_opt_playbooks_category ON opt_playbooks(category);
CREATE INDEX idx_opt_playbooks_is_active ON opt_playbooks(is_active);

-- Add table comment
COMMENT ON TABLE opt_playbooks IS 'Reusable best-practice playbooks for common optimization scenarios';

-- =====================================================
-- OPPORTUNITY-PLAYBOOK LINKS TABLE
-- =====================================================
-- Many-to-many relationship between opportunities and applicable playbooks
CREATE TABLE opt_opportunity_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES opt_playbooks(id) ON DELETE CASCADE,
  relevance_score DOUBLE PRECISION CHECK (relevance_score >= 0 AND relevance_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_opportunity_playbooks_unique UNIQUE(opportunity_id, playbook_id)
);

-- Add indexes for performance
CREATE INDEX idx_opt_opportunity_playbooks_opportunity_id ON opt_opportunity_playbooks(opportunity_id);
CREATE INDEX idx_opt_opportunity_playbooks_playbook_id ON opt_opportunity_playbooks(playbook_id);

-- Add table comment
COMMENT ON TABLE opt_opportunity_playbooks IS 'Links opportunities to applicable playbooks with relevance scoring';

-- =====================================================
-- OPTIMISATION SIMULATIONS TABLE
-- =====================================================
-- Stores simulation results for recommendations (e.g., load flow, voltage analysis)
CREATE TABLE opt_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES opt_recommendations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opt_opportunities(id) ON DELETE CASCADE,
  sim_ref TEXT NOT NULL,
  sim_type TEXT NOT NULL CHECK (sim_type IN ('load-flow', 'voltage-stability', 'reliability', 'economic', 'thermal', 'contingency')),
  scenario_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')) DEFAULT 'pending',
  input_parameters JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  warnings JSONB DEFAULT '[]',
  errors JSONB DEFAULT '[]',
  run_duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_simulations_tenant_ref_unique UNIQUE(tenant_id, sim_ref)
);

-- Add indexes for performance
CREATE INDEX idx_opt_simulations_tenant_id ON opt_simulations(tenant_id);
CREATE INDEX idx_opt_simulations_recommendation_id ON opt_simulations(recommendation_id);
CREATE INDEX idx_opt_simulations_opportunity_id ON opt_simulations(opportunity_id);
CREATE INDEX idx_opt_simulations_sim_type ON opt_simulations(sim_type);
CREATE INDEX idx_opt_simulations_status ON opt_simulations(status);

-- Add table comment
COMMENT ON TABLE opt_simulations IS 'Simulation results for recommendations (load flow, voltage analysis, etc.)';

-- =====================================================
-- OPTIMISATION PUBLISH EVENTS TABLE
-- =====================================================
-- Tracks when opportunities/recommendations are published to SIM or CI systems
CREATE TABLE opt_publish_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_ref TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('opportunity', 'recommendation')),
  source_id UUID NOT NULL,
  target_system TEXT NOT NULL CHECK (target_system IN ('sim', 'ci')),
  target_type TEXT NOT NULL CHECK (target_type IN ('switching-order', 'outage', 'issue', 'action', 'ci-project', 'countermeasure')),
  target_id UUID,
  status TEXT CHECK (status IN ('pending', 'published', 'failed', 'rolled-back')) DEFAULT 'pending',
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  published_by TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT opt_publish_events_tenant_ref_unique UNIQUE(tenant_id, event_ref)
);

-- Add indexes for performance
CREATE INDEX idx_opt_publish_events_tenant_id ON opt_publish_events(tenant_id);
CREATE INDEX idx_opt_publish_events_source_id ON opt_publish_events(source_id);
CREATE INDEX idx_opt_publish_events_target_id ON opt_publish_events(target_id);
CREATE INDEX idx_opt_publish_events_target_system ON opt_publish_events(target_system);
CREATE INDEX idx_opt_publish_events_status ON opt_publish_events(status);
CREATE INDEX idx_opt_publish_events_published_at ON opt_publish_events(published_at DESC);

-- Add table comment
COMMENT ON TABLE opt_publish_events IS 'Tracks when opportunities/recommendations are published to SIM or CI systems';

-- =====================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =====================================================

-- Function to update updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for opportunities
CREATE TRIGGER update_opt_opportunities_updated_at
  BEFORE UPDATE ON opt_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for recommendations
CREATE TRIGGER update_opt_recommendations_updated_at
  BEFORE UPDATE ON opt_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for playbooks
CREATE TRIGGER update_opt_playbooks_updated_at
  BEFORE UPDATE ON opt_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Note: RLS is disabled for dev (014_disable_rls_for_dev.sql)
-- These policies are defined for future production use

-- Enable RLS on all tables
ALTER TABLE opt_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_opportunity_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opt_publish_events ENABLE ROW LEVEL SECURITY;

-- Create policies for opportunities (tenant isolation)
CREATE POLICY opt_opportunities_tenant_isolation ON opt_opportunities
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create policies for recommendations (tenant isolation)
CREATE POLICY opt_recommendations_tenant_isolation ON opt_recommendations
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create policies for playbooks (tenant isolation)
CREATE POLICY opt_playbooks_tenant_isolation ON opt_playbooks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create policies for opportunity-playbook links (via opportunity)
CREATE POLICY opt_opportunity_playbooks_tenant_isolation ON opt_opportunity_playbooks
  USING (
    opportunity_id IN (
      SELECT id FROM opt_opportunities 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- Create policies for simulations (tenant isolation)
CREATE POLICY opt_simulations_tenant_isolation ON opt_simulations
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create policies for publish events (tenant isolation)
CREATE POLICY opt_publish_events_tenant_isolation ON opt_publish_events
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
