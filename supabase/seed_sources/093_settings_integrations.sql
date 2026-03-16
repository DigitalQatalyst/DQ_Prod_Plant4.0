BEGIN;

-- 1) Seed Global Integration Types
INSERT INTO integration_types (code, name, category)
VALUES
  ('SAP_PM', 'SAP Plant Maintenance', 'CMMS'),
  ('SAP_S4', 'SAP S/4HANA ERP', 'ERP'),
  ('OSI_PI', 'OSIsoft PI Historian', 'Historian'),
  ('SNOW', 'ServiceNow IT Service Management', 'Ticketing'),
  ('MAXIMO', 'IBM Maximo EAM', 'CMMS'),
  ('SCADA_HUB', 'Universal SCADA Bridge', 'SCADA'),
  ('GIS_ESRI', 'Esri ArcGIS', 'GIS'),
  ('METER_HUB', 'Smart Meter Data Management', 'MDM')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category;

-- 2) Seed Tenant Integrations
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
)
INSERT INTO integrations (tenant_id, type_code, name, status, last_sync_at, config)
SELECT 
  t.id,
  v.type,
  v.name,
  v.status,
  v.sync_at,
  v.config
FROM tenant_lookup t
CROSS JOIN (VALUES
  ('OSI_PI', 'Main PI Server', 'active', NOW() - INTERVAL '5 minutes', '{"host": "pi-main.dewa.gov", "port": 5450}'::jsonb),
  ('SAP_PM', 'DEWA SAP PM', 'active', NOW() - INTERVAL '1 hour', '{"endpoint": "https://sap.dewa.gov/api/pm", "version": "v2"}'::jsonb),
  ('SNOW', 'IT/OT Service Desk', 'active', NOW() - INTERVAL '2 hours', '{"instance": "dewa-prod", "oauth": true}'::jsonb),
  ('SCADA_HUB', 'Legacy SCADA Bridge', 'degraded', NOW() - INTERVAL '15 minutes', '{"protocols": ["DNP3", "Modbus"]}'::jsonb)
) AS v(type, name, status, sync_at, config)
ON CONFLICT (tenant_id, name) DO UPDATE SET
  status = EXCLUDED.status,
  last_sync_at = EXCLUDED.last_sync_at,
  config = EXCLUDED.config
RETURNING id, name;

-- 3) Seed Integration Mappings
-- Link integrations to sites and streams
WITH integrations_data AS (
  SELECT id, name FROM integrations
),
site_lookup AS (
  SELECT id, name FROM sites
),
stream_lookup AS (
  SELECT id FROM streams WHERE code = 'MAIN' LIMIT 1
)
INSERT INTO integration_mappings (integration_id, site_id, stream_id, mapping)
SELECT 
  i.id,
  s.id,
  st.id,
  jsonb_build_object('scope', 'site_wide', 'priority', 1)
FROM integrations_data i
CROSS JOIN site_lookup s
CROSS JOIN stream_lookup st
WHERE 
  (i.name = 'Main PI Server') OR
  (i.name = 'DEWA SAP PM' AND s.name = 'Dubai Main Substation') OR
  (i.name = 'Legacy SCADA Bridge' AND s.name = 'Jebel Ali Grid Station');

-- 4) Seed Integration Health Events
-- Create some historical health data
WITH tenant_lookup AS (
  SELECT id FROM tenants LIMIT 1
),
integrations_data AS (
  SELECT id FROM integrations
)
INSERT INTO integration_health_events (tenant_id, integration_id, status, timestamp, details)
SELECT 
  t.id,
  i.id,
  CASE 
    WHEN s.i = 1 THEN 'healthy'
    WHEN s.i = 2 THEN 'degraded'
    WHEN s.i = 3 THEN 'healthy'
    ELSE 'healthy'
  END,
  NOW() - (s.i || ' hours')::interval,
  jsonb_build_object('event_id', 'h_' || s.i, 'message', 'Periodic health check')
FROM tenant_lookup t
CROSS JOIN integrations_data i
CROSS JOIN (SELECT generate_series(1, 5) AS i) s;

-- Post-seed validation
DO $$
DECLARE
  v_type_count INTEGER;
  v_instance_count INTEGER;
  v_mapping_count INTEGER;
  v_event_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_type_count FROM integration_types;
  SELECT COUNT(*) INTO v_instance_count FROM integrations;
  SELECT COUNT(*) INTO v_mapping_count FROM integration_mappings;
  SELECT COUNT(*) INTO v_event_count FROM integration_health_events;
  
  IF v_type_count < 8 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 8 integration_types, got %', v_type_count;
  END IF;
  
  IF v_instance_count < 3 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 3 integrations, got %', v_instance_count;
  END IF;
  
  IF v_event_count < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 health events, got %', v_event_count;
  END IF;
END $$;

COMMIT;
