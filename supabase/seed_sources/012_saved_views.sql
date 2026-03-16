-- Seed 012: Saved Views
-- Insert sample saved views for the transmission tenant

-- Precondition: Check if transmission tenant exists
WITH tenant_check AS (
  SELECT id as tenant_id 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Insert saved views with CTE pattern
saved_views_data AS (
  SELECT 
    tc.tenant_id,
    'Critical Assets' as name,
    '{"criticality": "critical"}' as filters,
    'Assets with critical priority level' as description
  FROM tenant_check tc
  
  UNION ALL
  
  SELECT 
    tc.tenant_id,
    'Offline Assets' as name,
    '{"status": "offline"}' as filters,
    'Assets currently offline or out of service' as description
  FROM tenant_check tc
  
  UNION ALL
  
  SELECT 
    tc.tenant_id,
    'By Site Filter' as name,
    '{"siteId": ""}' as filters,
    'Template for filtering assets by specific site' as description
  FROM tenant_check tc
)
INSERT INTO saved_views (tenant_id, name, filters, description)
SELECT tenant_id, name, filters::jsonb, description
FROM saved_views_data
ON CONFLICT (tenant_id, name) DO UPDATE SET
  filters = EXCLUDED.filters,
  description = EXCLUDED.description,
  updated_at = now();

-- Post-seed validation: Ensure minimum count
DO $$
DECLARE
  saved_views_count INTEGER;
  tenant_uuid UUID;
BEGIN
  -- Get tenant ID
  SELECT id INTO tenant_uuid 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Transmission tenant not found for saved views seed';
  END IF;
  
  -- Check saved views count
  SELECT COUNT(*) INTO saved_views_count
  FROM saved_views
  WHERE tenant_id = tenant_uuid;
  
  IF saved_views_count < 3 THEN
    RAISE EXCEPTION 'Saved views seed failed: expected >= 3, got %', saved_views_count;
  END IF;
  
  RAISE NOTICE 'Saved views seed completed: % records for tenant %', saved_views_count, tenant_uuid;
END $$;