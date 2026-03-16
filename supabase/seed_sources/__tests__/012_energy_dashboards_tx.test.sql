-- Test file for 012_energy_dashboards_tx.sql seed data
-- This file validates the structure and content of the seed data

-- Test 1: Verify tariff natural key uniqueness
SELECT 
  'Test 1: Tariff natural key uniqueness' as test_name,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT (org_id, tariff_code)) 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM energy_tariffs;

-- Test 2: Verify dashboard natural key uniqueness
SELECT 
  'Test 2: Dashboard natural key uniqueness' as test_name,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT (org_id, dashboard_code)) 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM dashboard_definitions;

-- Test 3: Verify tariff date validity
SELECT 
  'Test 3: Tariff date validity' as test_name,
  CASE 
    WHEN COUNT(*) = 0 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM energy_tariffs
WHERE expiry_date IS NOT NULL AND expiry_date <= effective_date;

-- Test 4: Verify default tariff exists
SELECT 
  'Test 4: Default tariff exists' as test_name,
  CASE 
    WHEN COUNT(*) > 0 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM energy_tariffs
WHERE default_tariff = true AND active = true;

-- Test 5: Verify public dashboards exist
SELECT 
  'Test 5: Public dashboards exist' as test_name,
  CASE 
    WHEN COUNT(*) > 0 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM dashboard_definitions
WHERE public_dashboard = true AND published = true;

-- Test 6: Verify export job status validity
SELECT 
  'Test 6: Export job status validity' as test_name,
  CASE 
    WHEN COUNT(*) = 0 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM export_jobs
WHERE status NOT IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled');

-- Test 7: Verify dashboard config is valid JSON
SELECT 
  'Test 7: Dashboard config is valid JSON' as test_name,
  CASE 
    WHEN COUNT(*) = 0 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result
FROM dashboard_definitions
WHERE config IS NULL OR NOT (config ? 'widgets');
