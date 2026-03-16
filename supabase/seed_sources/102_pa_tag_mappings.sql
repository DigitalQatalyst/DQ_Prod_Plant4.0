-- ============================================================================
-- Seed: 102_pa_tag_mappings
-- Feature: Process Automation - Integrate & Model
-- Description: Seed data for pa_tag_mappings table
-- Requirements: AC 2.1.1-2.1.7
-- ============================================================================

-- Create 15 realistic tag mappings for Transmission tenant with various data types
-- Uses CTE pattern to reference tenant and sites dynamically

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
),
sites AS (
  SELECT id, name FROM sites WHERE tenant_id = (SELECT id FROM tenant)
),
dubai_main AS (
  SELECT id FROM sites WHERE name = 'Dubai Main Substation' LIMIT 1
),
jebel_ali AS (
  SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' LIMIT 1
),
al_aweer AS (
  SELECT id FROM sites WHERE name = 'Al Aweer Regional Hub' LIMIT 1
)
INSERT INTO pa_tag_mappings (
  tenant_id,
  site_id,
  source_system,
  source_tag,
  internal_tag,
  data_type,
  unit,
  description,
  scaling_factor,
  "offset",
  is_active,
  created_by,
  updated_by
)
SELECT
  tenant.id,
  v.site_id,
  v.source_system,
  v.source_tag,
  v.internal_tag,
  v.data_type,
  v.unit,
  v.description,
  v.scaling_factor,
  v."offset",
  v.is_active,
  'system',
  'system'
FROM tenant
CROSS JOIN (VALUES
  -- Dubai Main Substation - Transformer monitoring
  ((SELECT id FROM dubai_main), 'SCADA', 'T1_VOLT_PRI', 'transformer_1_voltage_primary', 'float', 'kV', 'Transformer 1 primary voltage', 1.0, 0.0, true),
  ((SELECT id FROM dubai_main), 'SCADA', 'T1_VOLT_SEC', 'transformer_1_voltage_secondary', 'float', 'kV', 'Transformer 1 secondary voltage', 1.0, 0.0, true),
  ((SELECT id FROM dubai_main), 'SCADA', 'T1_TEMP_OIL', 'transformer_1_oil_temperature', 'float', 'Â°C', 'Transformer 1 oil temperature', 1.0, 0.0, true),
  ((SELECT id FROM dubai_main), 'SCADA', 'T1_LOAD_PCT', 'transformer_1_load_percentage', 'float', '%', 'Transformer 1 load percentage', 1.0, 0.0, true),
  ((SELECT id FROM dubai_main), 'DCS', 'BKR_01_STATUS', 'breaker_01_status', 'boolean', NULL, 'Circuit breaker 01 status (open/closed)', NULL, NULL, false),
  
  -- Jebel Ali Grid Station - Power flow monitoring
  ((SELECT id FROM jebel_ali), 'SCADA', 'LINE_A_MW', 'line_a_active_power', 'float', 'MW', 'Line A active power flow', 0.001, 0.0, true),
  ((SELECT id FROM jebel_ali), 'SCADA', 'LINE_A_MVAR', 'line_a_reactive_power', 'float', 'MVAr', 'Line A reactive power flow', 0.001, 0.0, true),
  ((SELECT id FROM jebel_ali), 'SCADA', 'LINE_A_FREQ', 'line_a_frequency', 'float', 'Hz', 'Line A frequency', 1.0, 0.0, true),
  ((SELECT id FROM jebel_ali), 'PLC', 'GEN_1_STATUS', 'generator_1_status', 'boolean', NULL, 'Generator 1 running status', NULL, NULL, true),
  ((SELECT id FROM jebel_ali), 'PLC', 'GEN_1_OUTPUT', 'generator_1_output_power', 'float', 'MW', 'Generator 1 output power', 0.001, 0.0, false),
  
  -- Al Aweer Regional Hub - Environmental monitoring
  ((SELECT id FROM al_aweer), 'SCADA', 'AMB_TEMP', 'ambient_temperature', 'float', 'Â°C', 'Ambient temperature', 1.0, 0.0, true),
  ((SELECT id FROM al_aweer), 'SCADA', 'AMB_HUM', 'ambient_humidity', 'float', '%', 'Ambient humidity', 1.0, 0.0, true),
  ((SELECT id FROM al_aweer), 'DCS', 'FAULT_ALARM', 'fault_alarm_active', 'boolean', NULL, 'Fault alarm status', NULL, NULL, true),
  ((SELECT id FROM al_aweer), 'SCADA', 'LOAD_DEMAND', 'load_demand_forecast', 'float', 'MW', 'Load demand forecast', 0.001, 0.0, true),
  ((SELECT id FROM al_aweer), 'SCADA', 'LAST_MAINT', 'last_maintenance_timestamp', 'timestamp', NULL, 'Last maintenance timestamp', NULL, NULL, true),
  ((SELECT id FROM al_aweer), 'DCS', 'FAULT_ALARM', 'fault_alarm_active', 'boolean', NULL, 'Fault alarm status', NULL, NULL, false)
) AS v(site_id, source_system, source_tag, internal_tag, data_type, unit, description, scaling_factor, "offset", is_active)
ON CONFLICT (tenant_id, source_system, source_tag) DO NOTHING;

COMMIT;

-- Verify seed data
SELECT 
  COUNT(*) as total_tag_mappings,
  COUNT(DISTINCT site_id) as sites_with_tags,
  COUNT(DISTINCT source_system) as source_systems
FROM pa_tag_mappings
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1);
