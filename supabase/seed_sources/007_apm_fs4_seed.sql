-- ============================================================================
-- APM Transmission FS4: Asset Inventory & Criticality - Seed Script
-- ============================================================================
-- This script seeds the database with transmission-specific reference data:
-- - Criticality scoring model for power transmission
-- - FMEA library entries for transmission asset types
-- - Sample spare parts catalog
-- - Asset type to spare parts mappings
--
-- Requirements: 2.1-2.7, 3.1-3.7, 5.1-5.7, 30.5, 30.6
-- Idempotent: Uses ON CONFLICT to safely re-run
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Seed Criticality Scoring Model
-- ============================================================================

INSERT INTO asset_criticality_model (
  sector,
  model_version,
  safety_weight,
  production_impact_weight,
  environmental_impact_weight,
  detectability_weight,
  description
) VALUES (
  'power_transmission',
  'v1',
  0.35,  -- Safety is highest priority in transmission
  0.30,  -- Production/grid impact
  0.20,  -- Environmental impact
  0.15,  -- Detectability
  'Criticality scoring model for power transmission assets. Emphasizes safety and grid reliability.'
)
ON CONFLICT (sector, model_version) 
DO UPDATE SET
  safety_weight = EXCLUDED.safety_weight,
  production_impact_weight = EXCLUDED.production_impact_weight,
  environmental_impact_weight = EXCLUDED.environmental_impact_weight,
  detectability_weight = EXCLUDED.detectability_weight,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- 2. Seed FMEA Library - Power Transformers
-- ============================================================================

INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('TRANSFORMER', 'Insulation Breakdown', 'Moisture ingress, thermal aging, electrical stress', 'Complete transformer failure, fire risk, extended outage', 10, 4, 6, 'Regular oil sampling (DGA), moisture monitoring, thermal imaging'),
  ('TRANSFORMER', 'Winding Hot Spot Overheating', 'Overloading, cooling system failure, blocked radiators', 'Accelerated aging, insulation damage, potential failure', 8, 5, 4, 'Load monitoring, cooling system maintenance, thermal sensors'),
  ('TRANSFORMER', 'Bushing Failure', 'Contamination, moisture, mechanical stress', 'Phase-to-ground fault, transformer outage', 9, 3, 5, 'Visual inspection, power factor testing, infrared scanning'),
  ('TRANSFORMER', 'OLTC Contact Wear', 'Frequent operations, arcing, contamination', 'Tap changer failure, voltage regulation loss', 7, 6, 3, 'Operation counter monitoring, oil quality testing, contact resistance measurement'),
  ('TRANSFORMER', 'Core Insulation Failure', 'Manufacturing defect, mechanical stress', 'Localized heating, efficiency loss', 6, 2, 7, 'Acoustic monitoring, vibration analysis, thermal imaging'),
  ('TRANSFORMER', 'Cooling System Failure', 'Fan/pump failure, radiator blockage', 'Overheating, load capacity reduction', 7, 5, 2, 'Regular maintenance, temperature monitoring, redundant cooling'),
  ('TRANSFORMER', 'Oil Leak', 'Gasket degradation, weld failure, corrosion', 'Oil level drop, moisture ingress risk', 6, 4, 3, 'Visual inspection, oil level monitoring, gasket replacement'),
  ('TRANSFORMER', 'Dissolved Gas Abnormality', 'Partial discharge, overheating, arcing', 'Indicator of internal fault developing', 8, 4, 4, 'Monthly DGA testing, trend analysis, gas relay monitoring')
ON CONFLICT (asset_type, failure_mode) 
DO UPDATE SET
  failure_cause = EXCLUDED.failure_cause,
  failure_effect = EXCLUDED.failure_effect,
  severity = EXCLUDED.severity,
  occurrence = EXCLUDED.occurrence,
  detection = EXCLUDED.detection,
  recommended_actions = EXCLUDED.recommended_actions,
  updated_at = NOW();

-- ============================================================================
-- 3. Seed FMEA Library - Circuit Breakers
-- ============================================================================

INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('BREAKER', 'SF6 Gas Leak', 'Seal degradation, mechanical damage', 'Loss of insulation, arc quenching capability', 9, 3, 4, 'SF6 density monitoring, annual leak testing, seal inspection'),
  ('BREAKER', 'Contact Wear Excessive', 'High fault current interruption, frequent operations', 'Failure to interrupt fault, welding risk', 10, 4, 5, 'Operation counter tracking, contact resistance testing, timing tests'),
  ('BREAKER', 'Operating Mechanism Failure', 'Spring fatigue, lubrication loss, linkage wear', 'Failure to open/close on command', 10, 3, 6, 'Mechanism timing tests, lubrication schedule, spring tension checks'),
  ('BREAKER', 'Trip Coil Failure', 'Coil burnout, connection failure', 'Breaker fails to trip on protection signal', 10, 2, 7, 'Trip circuit monitoring, coil resistance testing, backup protection'),
  ('BREAKER', 'Partial Discharge Activity', 'Insulation defect, contamination', 'Progressive insulation degradation', 7, 4, 5, 'Partial discharge testing, SF6 purity monitoring'),
  ('BREAKER', 'Control Circuit Malfunction', 'Wiring failure, relay malfunction', 'Loss of remote control capability', 6, 4, 3, 'Control circuit testing, relay maintenance, backup local control')
ON CONFLICT (asset_type, failure_mode) 
DO UPDATE SET
  failure_cause = EXCLUDED.failure_cause,
  failure_effect = EXCLUDED.failure_effect,
  severity = EXCLUDED.severity,
  occurrence = EXCLUDED.occurrence,
  detection = EXCLUDED.detection,
  recommended_actions = EXCLUDED.recommended_actions,
  updated_at = NOW();

-- ============================================================================
-- 4. Seed FMEA Library - Transmission Lines
-- ============================================================================

INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('LINE', 'Conductor Breakage', 'Fatigue, corrosion, ice loading, galloping', 'Line outage, potential cascade failure', 9, 2, 8, 'Visual inspection, vibration dampers, tension monitoring'),
  ('LINE', 'Insulator Flashover', 'Contamination, moisture, lightning', 'Line trip, potential equipment damage', 8, 5, 3, 'Insulator washing, condition monitoring, lightning arresters'),
  ('LINE', 'Tower Structure Failure', 'Foundation failure, corrosion, extreme weather', 'Line collapse, extended outage', 10, 1, 9, 'Foundation inspection, corrosion protection, structural analysis'),
  ('LINE', 'Excessive Conductor Sag', 'High temperature, overloading', 'Ground clearance violation, trip risk', 7, 6, 4, 'Dynamic line rating, sag monitoring, load management'),
  ('LINE', 'Lightning Strike Damage', 'Direct strike, inadequate shielding', 'Equipment damage, line outage', 8, 4, 5, 'Shield wire maintenance, surge arresters, lightning counters')
ON CONFLICT (asset_type, failure_mode) 
DO UPDATE SET
  failure_cause = EXCLUDED.failure_cause,
  failure_effect = EXCLUDED.failure_effect,
  severity = EXCLUDED.severity,
  occurrence = EXCLUDED.occurrence,
  detection = EXCLUDED.detection,
  recommended_actions = EXCLUDED.recommended_actions,
  updated_at = NOW();

-- ============================================================================
-- 5. Seed FMEA Library - Protection Relays
-- ============================================================================

INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('RELAY', 'Relay Misoperation', 'Setting error, CT/VT failure, firmware bug', 'Unnecessary trip or failure to trip', 9, 3, 6, 'Setting verification, self-test monitoring, event analysis'),
  ('RELAY', 'Communication Failure', 'Network issue, protocol error, hardware fault', 'Loss of remote monitoring/control', 6, 5, 3, 'Communication monitoring, redundant paths, regular testing'),
  ('RELAY', 'Time Synchronization Loss', 'GPS failure, network time protocol issue', 'Incorrect event sequencing, protection coordination issues', 7, 3, 4, 'Redundant time sources, sync monitoring, backup oscillator'),
  ('RELAY', 'Self-Test Failure', 'Hardware degradation, software fault', 'Unreliable protection, hidden fault', 8, 2, 5, 'Regular functional testing, firmware updates, spare relay availability')
ON CONFLICT (asset_type, failure_mode) 
DO UPDATE SET
  failure_cause = EXCLUDED.failure_cause,
  failure_effect = EXCLUDED.failure_effect,
  severity = EXCLUDED.severity,
  occurrence = EXCLUDED.occurrence,
  detection = EXCLUDED.detection,
  recommended_actions = EXCLUDED.recommended_actions,
  updated_at = NOW();

-- ============================================================================
-- 6. Seed Spare Parts Catalog - Transformers
-- ============================================================================

INSERT INTO spare_parts (part_number, description, applicable_asset_types, lead_time_days, on_hand_quantity, reorder_point, unit_cost, supplier)
VALUES
  ('TX-BUSH-132', '132kV Transformer Bushing', ARRAY['TRANSFORMER'], 90, 2, 1, 45000.00, 'ABB'),
  ('TX-OIL-MIN', 'Transformer Mineral Oil (1000L)', ARRAY['TRANSFORMER'], 14, 5000, 2000, 2500.00, 'Shell'),
  ('TX-OLTC-CONT', 'OLTC Contact Set', ARRAY['TRANSFORMER'], 120, 1, 1, 85000.00, 'Maschinenfabrik Reinhausen'),
  ('TX-COOL-FAN', 'Cooling Fan Assembly', ARRAY['TRANSFORMER'], 30, 4, 2, 12000.00, 'Local Supplier'),
  ('TX-GASKET-KIT', 'Transformer Gasket Kit', ARRAY['TRANSFORMER'], 7, 10, 3, 500.00, 'Local Supplier'),
  ('TX-TEMP-SENSOR', 'Winding Temperature Sensor', ARRAY['TRANSFORMER'], 21, 6, 2, 1200.00, 'Siemens'),
  ('TX-OIL-FILTER', 'Oil Filtration Cartridge', ARRAY['TRANSFORMER'], 14, 20, 5, 350.00, 'Local Supplier')
ON CONFLICT (part_number) 
DO UPDATE SET
  description = EXCLUDED.description,
  applicable_asset_types = EXCLUDED.applicable_asset_types,
  lead_time_days = EXCLUDED.lead_time_days,
  on_hand_quantity = EXCLUDED.on_hand_quantity,
  reorder_point = EXCLUDED.reorder_point,
  unit_cost = EXCLUDED.unit_cost,
  supplier = EXCLUDED.supplier,
  updated_at = NOW();

-- ============================================================================
-- 7. Seed Spare Parts Catalog - Circuit Breakers
-- ============================================================================

INSERT INTO spare_parts (part_number, description, applicable_asset_types, lead_time_days, on_hand_quantity, reorder_point, unit_cost, supplier)
VALUES
  ('CB-SF6-CYL', 'SF6 Gas Cylinder (50kg)', ARRAY['BREAKER'], 7, 10, 3, 3500.00, 'Air Liquide'),
  ('CB-CONTACT-SET', 'Main Contact Set', ARRAY['BREAKER'], 90, 2, 1, 65000.00, 'ABB'),
  ('CB-OPER-MECH', 'Operating Mechanism Assembly', ARRAY['BREAKER'], 120, 1, 1, 125000.00, 'Siemens'),
  ('CB-TRIP-COIL', 'Trip Coil 110VDC', ARRAY['BREAKER'], 30, 4, 2, 2500.00, 'Local Supplier'),
  ('CB-AUX-SWITCH', 'Auxiliary Switch Block', ARRAY['BREAKER'], 21, 6, 2, 800.00, 'Local Supplier'),
  ('CB-SEAL-KIT', 'SF6 Seal Replacement Kit', ARRAY['BREAKER'], 14, 8, 3, 1200.00, 'ABB')
ON CONFLICT (part_number) 
DO UPDATE SET
  description = EXCLUDED.description,
  applicable_asset_types = EXCLUDED.applicable_asset_types,
  lead_time_days = EXCLUDED.lead_time_days,
  on_hand_quantity = EXCLUDED.on_hand_quantity,
  reorder_point = EXCLUDED.reorder_point,
  unit_cost = EXCLUDED.unit_cost,
  supplier = EXCLUDED.supplier,
  updated_at = NOW();

-- ============================================================================
-- 8. Seed Spare Parts Catalog - Transmission Lines
-- ============================================================================

INSERT INTO spare_parts (part_number, description, applicable_asset_types, lead_time_days, on_hand_quantity, reorder_point, unit_cost, supplier)
VALUES
  ('LINE-INSUL-POLY', 'Polymer Insulator 132kV', ARRAY['LINE'], 45, 20, 10, 450.00, 'NGK'),
  ('LINE-DAMP-VIB', 'Vibration Damper', ARRAY['LINE'], 14, 50, 20, 85.00, 'Local Supplier'),
  ('LINE-CONN-COMP', 'Compression Connector', ARRAY['LINE'], 7, 100, 30, 120.00, 'Local Supplier'),
  ('LINE-SURGE-ARR', 'Line Surge Arrester', ARRAY['LINE'], 30, 10, 5, 3500.00, 'ABB'),
  ('LINE-SPACER', 'Conductor Spacer', ARRAY['LINE'], 14, 40, 15, 95.00, 'Local Supplier')
ON CONFLICT (part_number) 
DO UPDATE SET
  description = EXCLUDED.description,
  applicable_asset_types = EXCLUDED.applicable_asset_types,
  lead_time_days = EXCLUDED.lead_time_days,
  on_hand_quantity = EXCLUDED.on_hand_quantity,
  reorder_point = EXCLUDED.reorder_point,
  unit_cost = EXCLUDED.unit_cost,
  supplier = EXCLUDED.supplier,
  updated_at = NOW();

-- ============================================================================
-- 9. Seed Asset Type to Spare Parts Mappings
-- ============================================================================

-- Link critical spare parts to transformer asset type
INSERT INTO asset_spare_parts (asset_type, spare_part_id, quantity_required, is_critical)
SELECT 
  'TRANSFORMER',
  id,
  CASE part_number
    WHEN 'TX-BUSH-132' THEN 3
    WHEN 'TX-OLTC-CONT' THEN 1
    WHEN 'TX-OIL-MIN' THEN 1
    ELSE 1
  END,
  CASE part_number
    WHEN 'TX-BUSH-132' THEN true
    WHEN 'TX-OLTC-CONT' THEN true
    WHEN 'TX-OIL-MIN' THEN true
    ELSE false
  END
FROM spare_parts
WHERE part_number IN ('TX-BUSH-132', 'TX-OIL-MIN', 'TX-OLTC-CONT', 'TX-COOL-FAN', 'TX-GASKET-KIT', 'TX-TEMP-SENSOR')
ON CONFLICT (asset_type, spare_part_id) DO NOTHING;

-- Link critical spare parts to breaker asset type
INSERT INTO asset_spare_parts (asset_type, spare_part_id, quantity_required, is_critical)
SELECT 
  'BREAKER',
  id,
  CASE part_number
    WHEN 'CB-CONTACT-SET' THEN 1
    WHEN 'CB-OPER-MECH' THEN 1
    WHEN 'CB-SF6-CYL' THEN 2
    ELSE 1
  END,
  CASE part_number
    WHEN 'CB-CONTACT-SET' THEN true
    WHEN 'CB-OPER-MECH' THEN true
    WHEN 'CB-SF6-CYL' THEN true
    ELSE false
  END
FROM spare_parts
WHERE part_number IN ('CB-SF6-CYL', 'CB-CONTACT-SET', 'CB-OPER-MECH', 'CB-TRIP-COIL', 'CB-SEAL-KIT')
ON CONFLICT (asset_type, spare_part_id) DO NOTHING;

-- Link spare parts to transmission line asset type
INSERT INTO asset_spare_parts (asset_type, spare_part_id, quantity_required, is_critical)
SELECT 
  'LINE',
  id,
  CASE part_number
    WHEN 'LINE-INSUL-POLY' THEN 5
    WHEN 'LINE-SURGE-ARR' THEN 2
    ELSE 1
  END,
  CASE part_number
    WHEN 'LINE-INSUL-POLY' THEN true
    WHEN 'LINE-SURGE-ARR' THEN true
    ELSE false
  END
FROM spare_parts
WHERE part_number IN ('LINE-INSUL-POLY', 'LINE-DAMP-VIB', 'LINE-SURGE-ARR', 'LINE-CONN-COMP')
ON CONFLICT (asset_type, spare_part_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Seed Complete
-- ============================================================================
-- Seeded data:
-- - 1 criticality scoring model for power_transmission
-- - 19 FMEA entries across 4 asset types
-- - 18 spare parts in catalog
-- - Asset type to spare parts mappings
--
-- All inserts use ON CONFLICT to ensure idempotency
-- ============================================================================
