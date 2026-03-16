-- Migration: Create Continuous Improvement (CI) Tables
-- Description: Creates all tables for the CI feature set including stages, projects, RCA, countermeasures, KPIs, impacts, and documents
-- Requirements: 5.1-5.7, 6.1-6.7, 7.1-7.6, 8.1-8.6, 9.1-9.5, 17.1-17.3, 19.1-19.6, 21.1-21.6

-- =====================================================
-- CI STAGES TABLE
-- =====================================================
-- Stores the CI project pipeline stages (Backlog, Analysis, Countermeasures, Implementation, Verification, Closed)
CREATE TABLE ci_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_stages_tenant_code_unique UNIQUE(tenant_id, code)
);

-- Add indexes for performance
CREATE INDEX idx_ci_stages_tenant_id ON ci_stages(tenant_id);
CREATE INDEX idx_ci_stages_sort_order ON ci_stages(sort_order);

-- Add table comment
COMMENT ON TABLE ci_stages IS 'CI project pipeline stages (Backlog, Analysis, Countermeasures, Implementation, Verification, Closed)';

-- =====================================================
-- CI PROJECTS TABLE
-- =====================================================
-- Stores CI improvement projects with stage tracking
CREATE TABLE ci_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  stage_id UUID NOT NULL REFERENCES ci_stages(id),
  site_id UUID REFERENCES sites(id),
  owner TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'on-hold', 'completed', 'cancelled')) DEFAULT 'active',
  start_date DATE,
  due_date DATE,
  summary TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_projects_tenant_ref_unique UNIQUE(tenant_id, project_ref)
);

-- Add indexes for performance
CREATE INDEX idx_ci_projects_tenant_id ON ci_projects(tenant_id);
CREATE INDEX idx_ci_projects_stage_id ON ci_projects(stage_id);
CREATE INDEX idx_ci_projects_owner ON ci_projects(owner);
CREATE INDEX idx_ci_projects_status ON ci_projects(status);
CREATE INDEX idx_ci_projects_due_date ON ci_projects(due_date);
CREATE INDEX idx_ci_projects_site_id ON ci_projects(site_id);

-- Add table comment
COMMENT ON TABLE ci_projects IS 'CI improvement projects with stage tracking and metadata';

-- =====================================================
-- CI PROJECT LINKS TABLE
-- =====================================================
-- Links CI projects to assets, grid nodes, grid lines, and alerts
CREATE TABLE ci_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  node_id UUID REFERENCES grid_nodes(id),
  line_id UUID REFERENCES grid_lines(id),
  alert_id UUID REFERENCES alerts(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_ci_project_links_project_id ON ci_project_links(project_id);
CREATE INDEX idx_ci_project_links_asset_id ON ci_project_links(asset_id);
CREATE INDEX idx_ci_project_links_node_id ON ci_project_links(node_id);
CREATE INDEX idx_ci_project_links_line_id ON ci_project_links(line_id);
CREATE INDEX idx_ci_project_links_alert_id ON ci_project_links(alert_id);

-- Add table comment
COMMENT ON TABLE ci_project_links IS 'Links CI projects to assets, grid nodes, grid lines, and alerts';

-- =====================================================
-- CI ROOT CAUSE ANALYSIS TABLE
-- =====================================================
-- Stores RCA data (5-Whys, Fishbone) in flexible JSONB format
CREATE TABLE ci_rca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  rca_type TEXT NOT NULL CHECK (rca_type IN ('5-whys', 'fishbone', 'fault-tree')),
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_rca_project_type_unique UNIQUE(project_id, rca_type)
);

-- Add indexes for performance
CREATE INDEX idx_ci_rca_project_id ON ci_rca(project_id);
CREATE INDEX idx_ci_rca_type ON ci_rca(rca_type);

-- Add table comment
COMMENT ON TABLE ci_rca IS 'Root Cause Analysis data stored in flexible JSONB format (5-Whys, Fishbone, Fault-Tree)';

-- =====================================================
-- CI COUNTERMEASURES TABLE
-- =====================================================
-- Stores countermeasures with owners, due dates, and effectiveness tracking
CREATE TABLE ci_countermeasures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cm_ref TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  owner TEXT NOT NULL,
  status TEXT CHECK (status IN ('planned', 'in-progress', 'completed', 'verified')) DEFAULT 'planned',
  due_date DATE,
  summary TEXT NOT NULL,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_countermeasures_tenant_ref_unique UNIQUE(tenant_id, cm_ref)
);

-- Add indexes for performance
CREATE INDEX idx_ci_countermeasures_tenant_id ON ci_countermeasures(tenant_id);
CREATE INDEX idx_ci_countermeasures_project_id ON ci_countermeasures(project_id);
CREATE INDEX idx_ci_countermeasures_owner ON ci_countermeasures(owner);
CREATE INDEX idx_ci_countermeasures_status ON ci_countermeasures(status);
CREATE INDEX idx_ci_countermeasures_due_date ON ci_countermeasures(due_date);

-- Add table comment
COMMENT ON TABLE ci_countermeasures IS 'Countermeasures with owners, due dates, and effectiveness tracking';

-- =====================================================
-- CI KPIS TABLE
-- =====================================================
-- Stores KPI definitions for transmission-specific metrics
CREATE TABLE ci_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kpi_code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_kpis_tenant_code_unique UNIQUE(tenant_id, kpi_code)
);

-- Add indexes for performance
CREATE INDEX idx_ci_kpis_tenant_id ON ci_kpis(tenant_id);

-- Add table comment
COMMENT ON TABLE ci_kpis IS 'KPI definitions for transmission-specific metrics (loss %, SAIDI/SAIFI, misoperation frequency, etc.)';

-- =====================================================
-- CI KPI LINKS TABLE
-- =====================================================
-- Many-to-many relationship between CI projects and KPIs
CREATE TABLE ci_kpi_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES ci_kpis(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_kpi_links_project_kpi_unique UNIQUE(project_id, kpi_id)
);

-- Add indexes for performance
CREATE INDEX idx_ci_kpi_links_project_id ON ci_kpi_links(project_id);
CREATE INDEX idx_ci_kpi_links_kpi_id ON ci_kpi_links(kpi_id);

-- Add table comment
COMMENT ON TABLE ci_kpi_links IS 'Many-to-many relationship between CI projects and KPIs';

-- =====================================================
-- CI IMPACTS TABLE
-- =====================================================
-- Stores impact measurements with baseline, target, and actual values
CREATE TABLE ci_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES ci_kpis(id) ON DELETE CASCADE,
  baseline DOUBLE PRECISION,
  target DOUBLE PRECISION,
  actual DOUBLE PRECISION,
  impact_value DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_impacts_project_kpi_unique UNIQUE(project_id, kpi_id)
);

-- Add indexes for performance
CREATE INDEX idx_ci_impacts_project_id ON ci_impacts(project_id);
CREATE INDEX idx_ci_impacts_kpi_id ON ci_impacts(kpi_id);

-- Add table comment
COMMENT ON TABLE ci_impacts IS 'Impact measurements with baseline, target, and actual values for KPI tracking';

-- =====================================================
-- CI DOCUMENTS TABLE
-- =====================================================
-- Stores document metadata (not actual files) linked to CI projects
CREATE TABLE ci_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES ci_projects(id) ON DELETE CASCADE,
  doc_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  doc_type TEXT CHECK (doc_type IN ('report', 'analysis', 'procedure', 'photo', 'diagram', 'other')) DEFAULT 'other',
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_documents_project_ref_unique UNIQUE(project_id, doc_ref)
);

-- Add indexes for performance
CREATE INDEX idx_ci_documents_project_id ON ci_documents(project_id);
CREATE INDEX idx_ci_documents_type ON ci_documents(doc_type);

-- Add table comment
COMMENT ON TABLE ci_documents IS 'Document metadata (not actual files) linked to CI projects';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ci_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_rca ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_countermeasures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_kpi_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_documents ENABLE ROW LEVEL SECURITY;

-- CI Stages policies
CREATE POLICY "ci_stages_tenant_isolation" ON ci_stages
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- CI Projects policies
CREATE POLICY "ci_projects_tenant_isolation" ON ci_projects
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- CI Project Links policies (inherit from parent project)
CREATE POLICY "ci_project_links_tenant_isolation" ON ci_project_links
  FOR ALL USING (
    project_id IN (
      SELECT id FROM ci_projects 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- CI RCA policies (inherit from parent project)
CREATE POLICY "ci_rca_tenant_isolation" ON ci_rca
  FOR ALL USING (
    project_id IN (
      SELECT id FROM ci_projects 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- CI Countermeasures policies
CREATE POLICY "ci_countermeasures_tenant_isolation" ON ci_countermeasures
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- CI KPIs policies
CREATE POLICY "ci_kpis_tenant_isolation" ON ci_kpis
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- CI KPI Links policies (inherit from parent project)
CREATE POLICY "ci_kpi_links_tenant_isolation" ON ci_kpi_links
  FOR ALL USING (
    project_id IN (
      SELECT id FROM ci_projects 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- CI Impacts policies (inherit from parent project)
CREATE POLICY "ci_impacts_tenant_isolation" ON ci_impacts
  FOR ALL USING (
    project_id IN (
      SELECT id FROM ci_projects 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- CI Documents policies (inherit from parent project)
CREATE POLICY "ci_documents_tenant_isolation" ON ci_documents
  FOR ALL USING (
    project_id IN (
      SELECT id FROM ci_projects 
      WHERE tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- =====================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGERS
-- =====================================================

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at columns
CREATE TRIGGER update_ci_projects_updated_at 
  BEFORE UPDATE ON ci_projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ci_rca_updated_at 
  BEFORE UPDATE ON ci_rca 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ci_countermeasures_updated_at 
  BEFORE UPDATE ON ci_countermeasures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ci_impacts_updated_at 
  BEFORE UPDATE ON ci_impacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VALIDATION CONSTRAINTS
-- =====================================================

-- Add constraint to ensure due_date is not in the past for active projects
ALTER TABLE ci_projects ADD CONSTRAINT ci_projects_due_date_check 
  CHECK (due_date IS NULL OR status IN ('completed', 'cancelled') OR due_date >= CURRENT_DATE);

-- Add constraint to ensure countermeasure due_date is not in the past for active countermeasures
ALTER TABLE ci_countermeasures ADD CONSTRAINT ci_countermeasures_due_date_check 
  CHECK (due_date IS NULL OR status IN ('completed', 'verified') OR due_date >= CURRENT_DATE);

-- Removd: effectiveness_score is handled by application logic and a simple range check

-- Add constraint to ensure impact_value calculation consistency
-- impact_value = (actual - baseline) / (target - baseline) * 100
ALTER TABLE ci_impacts ADD CONSTRAINT ci_impacts_calculation_check 
  CHECK (
    impact_value IS NULL OR 
    (baseline IS NOT NULL AND target IS NOT NULL AND actual IS NOT NULL AND target != baseline)
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT ALL ON ci_stages TO authenticated;
GRANT ALL ON ci_projects TO authenticated;
GRANT ALL ON ci_project_links TO authenticated;
GRANT ALL ON ci_rca TO authenticated;
GRANT ALL ON ci_countermeasures TO authenticated;
GRANT ALL ON ci_kpis TO authenticated;
GRANT ALL ON ci_kpi_links TO authenticated;
GRANT ALL ON ci_impacts TO authenticated;
GRANT ALL ON ci_documents TO authenticated;

-- Grant permissions to anon users (for local development)
GRANT ALL ON ci_stages TO anon;
GRANT ALL ON ci_projects TO anon;
GRANT ALL ON ci_project_links TO anon;
GRANT ALL ON ci_rca TO anon;
GRANT ALL ON ci_countermeasures TO anon;
GRANT ALL ON ci_kpis TO anon;
GRANT ALL ON ci_kpi_links TO anon;
GRANT ALL ON ci_impacts TO anon;
GRANT ALL ON ci_documents TO anon;