-- Verification query for CI seed data
-- Run this after executing 009_ci_seed.sql

SELECT 
  'CI Seed Verification' as report_title,
  (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as projects,
  (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as rca,
  (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as countermeasures,
  (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as kpis;

-- Expected results:
-- projects >= 12
-- rca >= 12
-- countermeasures >= 30
-- kpis >= 6
