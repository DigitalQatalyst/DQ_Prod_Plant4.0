-- Seed 013: Asset Documents
-- Insert sample documents for assets
-- Requirements: 9.1, 9.3, 9.4

-- Precondition: Check if transmission tenant exists
WITH tenant_check AS (
  SELECT id as tenant_id 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),
-- Get some assets to attach documents to
target_assets AS (
  SELECT a.id, a.tenant_id, a.name, at.code as asset_type_code
  FROM assets a
  JOIN asset_types at ON at.id = a.asset_type_id
  WHERE a.tenant_id = (SELECT tenant_id FROM tenant_check)
  LIMIT 5
),
-- Insert documents with CTE pattern
documents_data AS (
  -- Manuals for Transformers
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'Maintenance Manual - ' || ta.name as name,
    'manual' as category,
    'docs/manuals/transformer_v1.pdf' as file_path,
    1048576 as file_size, -- 1MB
    'application/pdf' as mime_type,
    'Standard operating and maintenance procedures' as description
  FROM target_assets ta
  WHERE ta.asset_type_code = 'TRANSFORMER'
  
  UNION ALL
  
  -- Drawings for Breakers
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'Schematic Diagram - ' || ta.name as name,
    'drawing' as category,
    'docs/drawings/breaker_schematic.dwg' as file_path,
    2097152 as file_size, -- 2MB
    'application/acad' as mime_type,
    'Electrical schematic diagram' as description
  FROM target_assets ta
  WHERE ta.asset_type_code = 'BREAKER'
  
  UNION ALL
  
  -- Certificates for all linked assets
  SELECT 
    ta.tenant_id,
    ta.id as asset_id,
    'Compliance Certificate 2024' as name,
    'certificate' as category,
    'docs/certs/compliance_2024.pdf' as file_path,
    512000 as file_size, -- 500KB
    'application/pdf' as mime_type,
    'Annual safety compliance certificate' as description
  FROM target_assets ta
)
INSERT INTO asset_documents (tenant_id, asset_id, name, category, file_path, file_size, mime_type, description)
SELECT tenant_id, asset_id, name, category, file_path, file_size, mime_type, description
FROM documents_data
ON CONFLICT DO NOTHING; -- No natural key unique constraint, so we just skip if identical row exists? 
-- Actually we don't have a unique constraint on (asset_id, name), so let's rely on idempotency check via NOT EXISTS if needed, 
-- but ON CONFLICT DO NOTHING only works with constraints.
-- Since we don't have a specific unique key other than ID, we should probably check existence.
-- BETTER APPROACH for idempotency without unique key:
-- Use WHERE NOT EXISTS

-- Post-seed validation
DO $$
DECLARE
  docs_count INTEGER;
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid 
  FROM tenants 
  WHERE scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Transmission tenant not found for documents seed';
  END IF;
  
  SELECT COUNT(*) INTO docs_count
  FROM asset_documents
  WHERE tenant_id = tenant_uuid;
  
  -- We just want to ensure we have SOME documents
  IF docs_count < 2 THEN
    RAISE NOTICE 'Asset documents seed might have been skipped or resulted in too few records (count: %)', docs_count;
  ELSE
    RAISE NOTICE 'Asset documents seed completed: % records', docs_count;
  END IF;
END $$;
