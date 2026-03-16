-- Direct verification without RLS filtering
SELECT 
  'CI Seed Verification (Direct)' as report_title,
  (SELECT COUNT(*) FROM ci_projects) as total_projects,
  (SELECT COUNT(*) FROM ci_rca) as total_rca,
  (SELECT COUNT(*) FROM ci_countermeasures) as total_countermeasures,
  (SELECT COUNT(*) FROM ci_kpis) as total_kpis,
  (SELECT COUNT(*) FROM ci_stages) as total_stages;

-- Show sample data
SELECT 'Sample Projects:' as info;
SELECT project_ref, title, status FROM ci_projects LIMIT 5;

SELECT 'Sample KPIs:' as info;
SELECT kpi_code, name FROM ci_kpis;
