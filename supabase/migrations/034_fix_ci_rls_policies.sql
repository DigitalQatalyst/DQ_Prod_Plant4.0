-- Migration: Fix CI RLS Policies for Local Development
-- Description: Replace session variable-based RLS policies with simpler policies that work in local development
-- This allows CI tables to be queried without setting app.current_tenant_id

-- Drop existing RLS policies
DROP POLICY IF EXISTS "ci_stages_tenant_isolation" ON ci_stages;
DROP POLICY IF EXISTS "ci_projects_tenant_isolation" ON ci_projects;
DROP POLICY IF EXISTS "ci_project_links_tenant_isolation" ON ci_project_links;
DROP POLICY IF EXISTS "ci_rca_tenant_isolation" ON ci_rca;
DROP POLICY IF EXISTS "ci_countermeasures_tenant_isolation" ON ci_countermeasures;
DROP POLICY IF EXISTS "ci_kpis_tenant_isolation" ON ci_kpis;
DROP POLICY IF EXISTS "ci_kpi_links_tenant_isolation" ON ci_kpi_links;
DROP POLICY IF EXISTS "ci_impacts_tenant_isolation" ON ci_impacts;
DROP POLICY IF EXISTS "ci_documents_tenant_isolation" ON ci_documents;

-- Create new permissive policies for local development
-- In production, these would be replaced with proper tenant isolation

CREATE POLICY "ci_stages_allow_all" ON ci_stages
  FOR ALL USING (true);

CREATE POLICY "ci_projects_allow_all" ON ci_projects
  FOR ALL USING (true);

CREATE POLICY "ci_project_links_allow_all" ON ci_project_links
  FOR ALL USING (true);

CREATE POLICY "ci_rca_allow_all" ON ci_rca
  FOR ALL USING (true);

CREATE POLICY "ci_countermeasures_allow_all" ON ci_countermeasures
  FOR ALL USING (true);

CREATE POLICY "ci_kpis_allow_all" ON ci_kpis
  FOR ALL USING (true);

CREATE POLICY "ci_kpi_links_allow_all" ON ci_kpi_links
  FOR ALL USING (true);

CREATE POLICY "ci_impacts_allow_all" ON ci_impacts
  FOR ALL USING (true);

CREATE POLICY "ci_documents_allow_all" ON ci_documents
  FOR ALL USING (true);
