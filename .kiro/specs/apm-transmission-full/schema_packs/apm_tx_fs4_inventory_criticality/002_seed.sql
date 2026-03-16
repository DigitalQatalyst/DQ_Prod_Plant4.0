-- FS4: Asset Inventory & Criticality - Seed Script
-- This script seeds transmission-specific telemetry parameters, assets, relationships,
-- FMEA library, spare parts, and criticality models.
-- 
-- Requirements: 6.1-6.5, 30.1-30.9, 3.6, 30.5, 30.6, 2.2
--
-- This seed script is idempotent using natural key upserts (ON CONFLICT ... DO UPDATE).

-- =============================================================================
-- SUBTASK 3.1: Seed transmission telemetry parameters
-- Requirements: 6.1-6.5
-- =============================================================================

-- Create telemetry_parameters table if it doesn't exist (baseline compatibility)
CREATE TABLE IF NOT EXISTS telemetry_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parameter_type TEXT NOT NULL,
  unit TEXT NOT NULL,
  parameter_role TEXT DEFAULT 'diagnostic',
  warning_min NUMERIC,
  warning_max NUMERIC,
  critical_min NUMERIC,
  critical_max NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_telemetry_param_name_type UNIQUE(name, parameter_type)
);

-- Transformer Parameters (Requirement 6.1)
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role, warning_min, warning_max, critical_min, critical_max, description)
VALUES
  ('top_oil_temp', 'temperature', '°C', 'health_driver', NULL, 85, NULL, 95, 'Transformer top oil temperature'),
  ('winding_hot_spot', 'temperature', '°C', 'health_driver', NULL, 110, NULL, 120, 'Transformer winding hotspot temperature'),
  ('load_current', 'current', 'A', 'health_driver', NULL, NULL, NULL, NULL, 'Transformer load current'),
  ('dga_h2', 'concentration', 'ppm', 'diagnostic', NULL, 100, NULL, 1000, 'Dissolved Gas Analysis - Hydrogen'),
  ('dga_ch4', 'concentration', 'ppm', 'diagnostic', NULL, 120, NULL, 1000, 'Dissolved Gas Analysis - Methane'),
  ('dga_c2h2', 'concentration', 'ppm', 'diagnostic', NULL, 35, NULL, 100, 'Dissolved Gas Analysis - Acetylene'),
  ('moisture_ppm', 'concentration', 'ppm', 'diagnostic', NULL, 30, NULL, 50, 'Oil moisture content'),
  ('bushing_power_factor', 'percentage', '%', 'diagnostic', NULL, 0.5, NULL, 1.0, 'Bushing power factor'),
  ('oltc_operations_count', 'count', 'ops', 'context', NULL, NULL, NULL, NULL, 'On-Load Tap Changer operations count'),
  ('vibration', 'acceleration', 'mm/s', 'diagnostic', NULL, 7.1, NULL, 11.2, 'Transformer vibration level'),
  ('cooling_fan_status', 'status', 'bool', 'context', NULL, NULL, NULL, NULL, 'Cooling fan operational status')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role,
      warning_min = EXCLUDED.warning_min,
      warning_max = EXCLUDED.warning_max,
      critical_min = EXCLUDED.critical_min,
      critical_max = EXCLUDED.critical_max,
      description = EXCLUDED.description;

-- Circuit Breaker Parameters (Requirement 6.2)
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role, warning_min, warning_max, critical_min, critical_max, description)
VALUES
  ('sf6_pressure', 'pressure', 'bar', 'health_driver', 5.0, NULL, 4.5, NULL, 'SF6 gas pressure'),
  ('sf6_density', 'density', 'kg/m³', 'health_driver', 40, NULL, 35, NULL, 'SF6 gas density'),
  ('contact_wear_percent', 'percentage', '%', 'health_driver', NULL, 70, NULL, 85, 'Contact wear percentage'),
  ('operation_count', 'count', 'ops', 'context', NULL, NULL, NULL, NULL, 'Breaker operation count'),
  ('trip_coil_current', 'current', 'A', 'diagnostic', 3.5, 6.0, 3.0, 7.0, 'Trip coil current'),
  ('mechanism_time', 'time', 'ms', 'diagnostic', NULL, 60, NULL, 80, 'Operating mechanism time'),
  ('partial_discharge', 'charge', 'pC', 'diagnostic', NULL, 500, NULL, 1000, 'Partial discharge level')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role,
      warning_min = EXCLUDED.warning_min,
      warning_max = EXCLUDED.warning_max,
      critical_min = EXCLUDED.critical_min,
      critical_max = EXCLUDED.critical_max,
      description = EXCLUDED.description;

-- Transmission Line Parameters (Requirement 6.3)
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role, warning_min, warning_max, critical_min, critical_max, description)
VALUES
  ('conductor_temp', 'temperature', '°C', 'health_driver', NULL, 75, NULL, 90, 'Conductor temperature'),
  ('sag_estimate', 'distance', 'm', 'diagnostic', NULL, NULL, NULL, NULL, 'Estimated conductor sag'),
  ('wind_speed', 'speed', 'm/s', 'context', NULL, NULL, NULL, NULL, 'Wind speed at line location'),
  ('current', 'current', 'A', 'health_driver', NULL, NULL, NULL, NULL, 'Line current'),
  ('fault_indicator_status', 'status', 'bool', 'diagnostic', NULL, NULL, NULL, NULL, 'Fault indicator status'),
  ('lightning_counter', 'count', 'strikes', 'context', NULL, NULL, NULL, NULL, 'Lightning strike counter')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role,
      warning_min = EXCLUDED.warning_min,
      warning_max = EXCLUDED.warning_max,
      critical_min = EXCLUDED.critical_min,
      critical_max = EXCLUDED.critical_max,
      description = EXCLUDED.description;

-- Protection Relay Parameters (Requirement 6.4)
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role, warning_min, warning_max, critical_min, critical_max, description)
VALUES
  ('trip_events', 'count', 'events', 'diagnostic', NULL, NULL, NULL, NULL, 'Relay trip event count'),
  ('self_test_status', 'status', 'bool', 'health_driver', NULL, NULL, NULL, NULL, 'Relay self-test status'),
  ('comms_latency', 'time', 'ms', 'diagnostic', NULL, 100, NULL, 200, 'Communication latency'),
  ('goose_status', 'status', 'bool', 'diagnostic', NULL, NULL, NULL, NULL, 'GOOSE message status'),
  ('time_sync_offset', 'time', 'ms', 'diagnostic', NULL, 10, NULL, 50, 'Time synchronization offset')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role,
      warning_min = EXCLUDED.warning_min,
      warning_max = EXCLUDED.warning_max,
      critical_min = EXCLUDED.critical_min,
      critical_max = EXCLUDED.critical_max,
      description = EXCLUDED.description;

-- Substation Environment Parameters (Requirement 6.5)
INSERT INTO telemetry_parameters (name, parameter_type, unit, parameter_role, warning_min, warning_max, critical_min, critical_max, description)
VALUES
  ('ambient_temp', 'temperature', '°C', 'context', NULL, 40, NULL, 50, 'Ambient temperature'),
  ('humidity', 'percentage', '%', 'context', NULL, 80, NULL, 95, 'Relative humidity'),
  ('intrusion_door_status', 'status', 'bool', 'diagnostic', NULL, NULL, NULL, NULL, 'Intrusion door status'),
  ('smoke_fire_alarm', 'status', 'bool', 'diagnostic', NULL, NULL, NULL, NULL, 'Smoke/fire alarm status'),
  ('dc_bus_voltage', 'voltage', 'V', 'health_driver', 100, 140, 90, 150, 'DC bus voltage')
ON CONFLICT (name, parameter_type) DO UPDATE
  SET unit = EXCLUDED.unit,
      parameter_role = EXCLUDED.parameter_role,
      warning_min = EXCLUDED.warning_min,
      warning_max = EXCLUDED.warning_max,
      critical_min = EXCLUDED.critical_min,
      critical_max = EXCLUDED.critical_max,
      description = EXCLUDED.description;

-- =============================================================================
-- SUBTASK 3.2: Seed substation and bay assets
-- Requirements: 30.1
-- =============================================================================

-- Seed 1 substation asset
INSERT INTO assets (sector, name, asset_type, location, asset_tag, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, metadata)
VALUES
  ('power_transmission', 'Substation Alpha', 'substation_bay', 'Grid Zone North', 'SUB-ALPHA-001', 'online', 'Critical', 'operate', 220, '2015-06-15', '{"capacity_mva": 500, "num_bays": 4}')
ON CONFLICT (sector, name, location) DO UPDATE
  SET asset_type = EXCLUDED.asset_type,
      asset_tag = EXCLUDED.asset_tag,
      operational_status = EXCLUDED.operational_status,
      criticality = EXCLUDED.criticality,
      lifecycle_stage = EXCLUDED.lifecycle_stage,
      voltage_kv = EXCLUDED.voltage_kv,
      commissioning_date = EXCLUDED.commissioning_date,
      metadata = EXCLUDED.metadata,
      updated_at = NOW();

-- Get the substation ID for parent references
DO $
DECLARE
  substation_id UUID;
BEGIN
  SELECT id INTO substation_id FROM assets WHERE sector = 'power_transmission' AND name = 'Substation Alpha' AND location = 'Grid Zone North';

  -- Seed 4 bay assets with parent_asset_id referencing substation
  INSERT INTO assets (sector, name, asset_type, location, asset_tag, parent_asset_id, bay_code, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, metadata)
  VALUES
    ('power_transmission', 'Bay 1 - Line In', 'substation_bay', 'Grid Zone North', 'BAY-01', substation_id, 'BAY-01', 'online', 'Critical', 'operate', 220, '2015-06-15', '{"function": "line_in"}'),
    ('power_transmission', 'Bay 2 - Transformer', 'substation_bay', 'Grid Zone North', 'BAY-02', substation_id, 'BAY-02', 'online', 'Critical', 'operate', 220, '2015-06-15', '{"function": "transformer"}'),
    ('power_transmission', 'Bay 3 - Line Out', 'substation_bay', 'Grid Zone North', 'BAY-03', substation_id, 'BAY-03', 'online', 'Important', 'operate', 220, '2015-06-15', '{"function": "line_out"}'),
    ('power_transmission', 'Bay 4 - Capacitor Bank', 'substation_bay', 'Grid Zone North', 'BAY-04', substation_id, 'BAY-04', 'online', 'Standard', 'operate', 220, '2015-06-15', '{"function": "reactive_compensation"}')
  ON CONFLICT (sector, name, location) DO UPDATE
    SET asset_type = EXCLUDED.asset_type,
        asset_tag = EXCLUDED.asset_tag,
        parent_asset_id = EXCLUDED.parent_asset_id,
        bay_code = EXCLUDED.bay_code,
        operational_status = EXCLUDED.operational_status,
        criticality = EXCLUDED.criticality,
        lifecycle_stage = EXCLUDED.lifecycle_stage,
        voltage_kv = EXCLUDED.voltage_kv,
        commissioning_date = EXCLUDED.commissioning_date,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
END $;

-- =============================================================================
-- SUBTASK 3.3: Seed transmission equipment assets
-- Requirements: 30.2, 30.9
-- =============================================================================

DO $
DECLARE
  bay1_id UUID;
  bay2_id UUID;
  bay3_id UUID;
BEGIN
  -- Get bay IDs for parent references
  SELECT id INTO bay1_id FROM assets WHERE sector = 'power_transmission' AND name = 'Bay 1 - Line In' AND location = 'Grid Zone North';
  SELECT id INTO bay2_id FROM assets WHERE sector = 'power_transmission' AND name = 'Bay 2 - Transformer' AND location = 'Grid Zone North';
  SELECT id INTO bay3_id FROM assets WHERE sector = 'power_transmission' AND name = 'Bay 3 - Line Out' AND location = 'Grid Zone North';

  -- Seed 2 power transformers with bay parents
  INSERT INTO assets (sector, name, asset_type, location, asset_tag, parent_asset_id, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, owner_org_unit, metadata)
  VALUES
    ('power_transmission', 'TX-001', 'power_transformer', 'Grid Zone North', 'TX-001', bay2_id, 'online', 'Critical', 'operate', 220, '2015-08-20', 'Grid Operations', '{"rated_mva": 250, "cooling_type": "ONAN", "manufacturer": "ABB"}'),
    ('power_transmission', 'TX-002', 'power_transformer', 'Grid Zone North', 'TX-002', bay2_id, 'maintenance', 'Critical', 'maintain', 220, '2016-03-10', 'Grid Operations', '{"rated_mva": 250, "cooling_type": "ONAF", "manufacturer": "Siemens"}')
  ON CONFLICT (sector, name, location) DO UPDATE
    SET asset_type = EXCLUDED.asset_type,
        asset_tag = EXCLUDED.asset_tag,
        parent_asset_id = EXCLUDED.parent_asset_id,
        operational_status = EXCLUDED.operational_status,
        criticality = EXCLUDED.criticality,
        lifecycle_stage = EXCLUDED.lifecycle_stage,
        voltage_kv = EXCLUDED.voltage_kv,
        commissioning_date = EXCLUDED.commissioning_date,
        owner_org_unit = EXCLUDED.owner_org_unit,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

  -- Seed 4 circuit breakers with bay parents
  INSERT INTO assets (sector, name, asset_type, location, asset_tag, parent_asset_id, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, owner_org_unit, metadata)
  VALUES
    ('power_transmission', 'CB-101', 'circuit_breaker', 'Grid Zone North', 'CB-101', bay1_id, 'online', 'Critical', 'operate', 220, '2015-06-20', 'Grid Operations', '{"rated_current": 2000, "interrupting_capacity": 40, "mechanism_type": "spring"}'),
    ('power_transmission', 'CB-102', 'circuit_breaker', 'Grid Zone North', 'CB-102', bay2_id, 'online', 'Critical', 'operate', 220, '2015-07-15', 'Grid Operations', '{"rated_current": 2000, "interrupting_capacity": 40, "mechanism_type": "spring"}'),
    ('power_transmission', 'CB-103', 'circuit_breaker', 'Grid Zone North', 'CB-103', bay3_id, 'online', 'Important', 'operate', 220, '2015-08-01', 'Grid Operations', '{"rated_current": 1600, "interrupting_capacity": 31.5, "mechanism_type": "hydraulic"}'),
    ('power_transmission', 'CB-104', 'circuit_breaker', 'Grid Zone North', 'CB-104', bay3_id, 'offline', 'Standard', 'refurbish', 220, '2010-04-12', 'Grid Operations', '{"rated_current": 1600, "interrupting_capacity": 31.5, "mechanism_type": "pneumatic"}')
  ON CONFLICT (sector, name, location) DO UPDATE
    SET asset_type = EXCLUDED.asset_type,
        asset_tag = EXCLUDED.asset_tag,
        parent_asset_id = EXCLUDED.parent_asset_id,
        operational_status = EXCLUDED.operational_status,
        criticality = EXCLUDED.criticality,
        lifecycle_stage = EXCLUDED.lifecycle_stage,
        voltage_kv = EXCLUDED.voltage_kv,
        commissioning_date = EXCLUDED.commissioning_date,
        owner_org_unit = EXCLUDED.owner_org_unit,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

  -- Seed 2 transmission lines
  INSERT INTO assets (sector, name, asset_type, location, asset_tag, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, owner_org_unit, metadata)
  VALUES
    ('power_transmission', 'LINE-N01', 'transmission_line', 'Grid Zone North to Central', 'LINE-N01', 'online', 'Critical', 'operate', 220, '2014-11-05', 'Grid Operations', '{"length_km": 45, "conductor_type": "ACSR", "thermal_rating": 1200}'),
    ('power_transmission', 'LINE-N02', 'transmission_line', 'Grid Zone North to East', 'LINE-N02', 'online', 'Important', 'operate', 220, '2016-09-18', 'Grid Operations', '{"length_km": 32, "conductor_type": "ACSR", "thermal_rating": 1000}')
  ON CONFLICT (sector, name, location) DO UPDATE
    SET asset_type = EXCLUDED.asset_type,
        asset_tag = EXCLUDED.asset_tag,
        operational_status = EXCLUDED.operational_status,
        criticality = EXCLUDED.criticality,
        lifecycle_stage = EXCLUDED.lifecycle_stage,
        voltage_kv = EXCLUDED.voltage_kv,
        commissioning_date = EXCLUDED.commissioning_date,
        owner_org_unit = EXCLUDED.owner_org_unit,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

  -- Seed 2 protection relays
  INSERT INTO assets (sector, name, asset_type, location, asset_tag, parent_asset_id, operational_status, criticality, lifecycle_stage, voltage_kv, commissioning_date, owner_org_unit, metadata)
  VALUES
    ('power_transmission', 'RELAY-001', 'protection_relay', 'Grid Zone North', 'RELAY-001', bay1_id, 'online', 'Critical', 'operate', 220, '2015-06-25', 'Protection Engineering', '{"relay_type": "distance", "manufacturer": "SEL", "model": "SEL-421"}'),
    ('power_transmission', 'RELAY-002', 'protection_relay', 'Grid Zone North', 'RELAY-002', bay2_id, 'online', 'Critical', 'operate', 220, '2015-07-20', 'Protection Engineering', '{"relay_type": "differential", "manufacturer": "GE", "model": "D60"}'  )
  ON CONFLICT (sector, name, location) DO UPDATE
    SET asset_type = EXCLUDED.asset_type,
        asset_tag = EXCLUDED.asset_tag,
        parent_asset_id = EXCLUDED.parent_asset_id,
        operational_status = EXCLUDED.operational_status,
        criticality = EXCLUDED.criticality,
        lifecycle_stage = EXCLUDED.lifecycle_stage,
        voltage_kv = EXCLUDED.voltage_kv,
        commissioning_date = EXCLUDED.commissioning_date,
        owner_org_unit = EXCLUDED.owner_org_unit,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
END $;

-- =============================================================================
-- SUBTASK 3.4: Seed asset relationships
-- Requirements: 30.8
-- =============================================================================

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  line_n01_id UUID;
  line_n02_id UUID;
  relay1_id UUID;
  relay2_id UUID;
  bay1_id UUID;
  bay2_id UUID;
  bay3_id UUID;
BEGIN
  -- Get asset IDs for relationship creation
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';
  SELECT id INTO line_n02_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N02';
  SELECT id INTO relay1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-001';
  SELECT id INTO relay2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-002';
  SELECT id INTO bay1_id FROM assets WHERE sector = 'power_transmission' AND bay_code = 'BAY-01';
  SELECT id INTO bay2_id FROM assets WHERE sector = 'power_transmission' AND bay_code = 'BAY-02';
  SELECT id INTO bay3_id FROM assets WHERE sector = 'power_transmission' AND bay_code = 'BAY-03';

  -- Create connected_to relationships between transformers and breakers
  INSERT INTO asset_relationships (from_asset_id, to_asset_id, relation_type, metadata)
  VALUES
    (tx1_id, cb102_id, 'connected_to', '{"connection_point": "HV_bushing"}'),
    (tx2_id, cb102_id, 'connected_to', '{"connection_point": "HV_bushing"}'),
    (cb101_id, cb102_id, 'connected_to', '{"connection_point": "busbar"}'),
    (cb102_id, cb103_id, 'connected_to', '{"connection_point": "busbar"}')
  ON CONFLICT (from_asset_id, to_asset_id, relation_type) DO UPDATE
    SET metadata = EXCLUDED.metadata;

  -- Create feeds_to relationships for power flow
  INSERT INTO asset_relationships (from_asset_id, to_asset_id, relation_type, metadata)
  VALUES
    (line_n01_id, cb101_id, 'feeds_to', '{"direction": "incoming"}'),
    (cb103_id, line_n02_id, 'feeds_to', '{"direction": "outgoing"}'),
    (tx1_id, cb102_id, 'feeds_to', '{"direction": "step_down"}')
  ON CONFLICT (from_asset_id, to_asset_id, relation_type) DO UPDATE
    SET metadata = EXCLUDED.metadata;

  -- Create protects relationships for relays
  INSERT INTO asset_relationships (from_asset_id, to_asset_id, relation_type, metadata)
  VALUES
    (relay1_id, line_n01_id, 'protects', '{"protection_zone": "line", "scheme": "distance"}'),
    (relay1_id, cb101_id, 'protects', '{"protection_zone": "breaker_failure"}'),
    (relay2_id, tx1_id, 'protects', '{"protection_zone": "transformer", "scheme": "differential"}'),
    (relay2_id, tx2_id, 'protects', '{"protection_zone": "transformer", "scheme": "differential"}')
  ON CONFLICT (from_asset_id, to_asset_id, relation_type) DO UPDATE
    SET metadata = EXCLUDED.metadata;

  -- Create in_bay relationships (already handled by parent_asset_id, but explicit relationships for clarity)
  INSERT INTO asset_relationships (from_asset_id, to_asset_id, relation_type, metadata)
  VALUES
    (cb101_id, bay1_id, 'in_bay', '{}'),
    (cb102_id, bay2_id, 'in_bay', '{}'),
    (cb103_id, bay3_id, 'in_bay', '{}'),
    (tx1_id, bay2_id, 'in_bay', '{}'),
    (tx2_id, bay2_id, 'in_bay', '{}'),
    (relay1_id, bay1_id, 'in_bay', '{}'),
    (relay2_id, bay2_id, 'in_bay', '{}')
  ON CONFLICT (from_asset_id, to_asset_id, relation_type) DO UPDATE
    SET metadata = EXCLUDED.metadata;
END $;

-- =============================================================================
-- SUBTASK 3.5: Seed FMEA library
-- Requirements: 3.6, 30.5
-- =============================================================================

-- FMEA entries for power_transformer
INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('power_transformer', 'Winding insulation breakdown', 'Thermal aging, moisture ingress, electrical stress', 'Complete transformer failure, fire risk', 10, 3, 4, 'Regular DGA testing, moisture monitoring, thermal imaging'),
  ('power_transformer', 'OLTC contact failure', 'Contact wear, carbon buildup, spring fatigue', 'Voltage regulation failure, arcing', 8, 5, 5, 'OLTC operation counter monitoring, contact resistance testing'),
  ('power_transformer', 'Bushing failure', 'Moisture ingress, power factor degradation', 'Phase-to-ground fault, outage', 9, 3, 6, 'Annual power factor testing, visual inspection'),
  ('power_transformer', 'Cooling system failure', 'Fan motor failure, pump failure, radiator blockage', 'Overheating, reduced capacity', 7, 4, 3, 'Temperature monitoring, cooling system maintenance'),
  ('power_transformer', 'Core insulation failure', 'Manufacturing defect, overheating', 'Increased losses, localized heating', 6, 2, 7, 'Thermal monitoring, load profile analysis')
ON CONFLICT (asset_type, failure_mode) DO UPDATE
  SET failure_cause = EXCLUDED.failure_cause,
      failure_effect = EXCLUDED.failure_effect,
      severity = EXCLUDED.severity,
      occurrence = EXCLUDED.occurrence,
      detection = EXCLUDED.detection,
      recommended_actions = EXCLUDED.recommended_actions,
      updated_at = NOW();

-- FMEA entries for circuit_breaker
INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('circuit_breaker', 'SF6 gas leak', 'Seal degradation, gasket failure', 'Loss of insulation, arc quenching failure', 9, 4, 3, 'SF6 density monitoring, annual leak testing'),
  ('circuit_breaker', 'Contact wear excessive', 'High fault current interruption, normal wear', 'Failure to interrupt, welding', 10, 3, 5, 'Operation counter tracking, contact resistance measurement'),
  ('circuit_breaker', 'Operating mechanism failure', 'Spring fatigue, hydraulic leak, pneumatic failure', 'Failure to operate on command', 10, 2, 4, 'Mechanism timing tests, preventive maintenance'),
  ('circuit_breaker', 'Trip coil failure', 'Coil burnout, connection failure', 'Failure to trip on protection signal', 10, 2, 6, 'Trip coil current monitoring, periodic trip testing'),
  ('circuit_breaker', 'Control circuit failure', 'Wiring degradation, relay failure', 'Loss of remote control', 6, 3, 4, 'Control circuit testing, relay replacement schedule')
ON CONFLICT (asset_type, failure_mode) DO UPDATE
  SET failure_cause = EXCLUDED.failure_cause,
      failure_effect = EXCLUDED.failure_effect,
      severity = EXCLUDED.severity,
      occurrence = EXCLUDED.occurrence,
      detection = EXCLUDED.detection,
      recommended_actions = EXCLUDED.recommended_actions,
      updated_at = NOW();

-- FMEA entries for transmission_line
INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('transmission_line', 'Conductor breakage', 'Fatigue, corrosion, ice loading, galloping', 'Line outage, supply interruption', 9, 2, 5, 'Aerial inspection, vibration dampers, ice monitoring'),
  ('transmission_line', 'Insulator flashover', 'Contamination, lightning, switching surge', 'Line trip, equipment damage', 8, 4, 3, 'Insulator washing, lightning arresters, surge protection'),
  ('transmission_line', 'Tower structural failure', 'Foundation failure, corrosion, extreme weather', 'Line collapse, extended outage', 10, 1, 7, 'Structural inspections, foundation monitoring, corrosion protection'),
  ('transmission_line', 'Excessive sag', 'High temperature, overloading', 'Ground clearance violation, flashover risk', 7, 3, 4, 'Conductor temperature monitoring, dynamic line rating')
ON CONFLICT (asset_type, failure_mode) DO UPDATE
  SET failure_cause = EXCLUDED.failure_cause,
      failure_effect = EXCLUDED.failure_effect,
      severity = EXCLUDED.severity,
      occurrence = EXCLUDED.occurrence,
      detection = EXCLUDED.detection,
      recommended_actions = EXCLUDED.recommended_actions,
      updated_at = NOW();

-- FMEA entries for protection_relay
INSERT INTO fmea_entries (asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, recommended_actions)
VALUES
  ('protection_relay', 'Relay malfunction', 'Firmware bug, hardware failure, settings error', 'Failure to trip or false trip', 10, 2, 5, 'Self-test monitoring, periodic relay testing, firmware updates'),
  ('protection_relay', 'Communication failure', 'Network issue, fiber cut, protocol error', 'Loss of remote monitoring and control', 6, 4, 3, 'Communication latency monitoring, redundant paths'),
  ('protection_relay', 'CT/VT input failure', 'Secondary circuit open, burden too high', 'Incorrect measurement, protection failure', 9, 2, 6, 'Secondary circuit testing, burden calculation verification'),
  ('protection_relay', 'Time synchronization loss', 'GPS antenna failure, network time loss', 'Incorrect fault location, event sequencing errors', 5, 3, 4, 'Time sync offset monitoring, redundant time sources')
ON CONFLICT (asset_type, failure_mode) DO UPDATE
  SET failure_cause = EXCLUDED.failure_cause,
      failure_effect = EXCLUDED.failure_effect,
      severity = EXCLUDED.severity,
      occurrence = EXCLUDED.occurrence,
      detection = EXCLUDED.detection,
      recommended_actions = EXCLUDED.recommended_actions,
      updated_at = NOW();

-- =============================================================================
-- SUBTASK 3.6: Seed spare parts library
-- Requirements: 30.6
-- =============================================================================

-- Seed spare parts
INSERT INTO spare_parts (part_number, description, applicable_asset_types, lead_time_days, on_hand_quantity, reorder_point, unit_cost)
VALUES
  ('BUSH-220-OIP', 'Oil-Impregnated Paper Bushing 220kV', ARRAY['power_transformer'], 180, 2, 1, 45000.00),
  ('OLTC-CONT-SET', 'OLTC Contact Set with Springs', ARRAY['power_transformer'], 90, 4, 2, 12000.00),
  ('SF6-SEAL-KIT', 'SF6 Breaker Seal Replacement Kit', ARRAY['circuit_breaker'], 30, 8, 3, 2500.00),
  ('CB-MECH-SPRING', 'Circuit Breaker Mechanism Spring Assembly', ARRAY['circuit_breaker'], 60, 3, 1, 8500.00),
  ('RELAY-CARD-CPU', 'Protection Relay CPU Card', ARRAY['protection_relay'], 45, 5, 2, 3200.00),
  ('RELAY-CARD-IO', 'Protection Relay I/O Card', ARRAY['protection_relay'], 45, 6, 2, 1800.00),
  ('CT-SEC-FUSE', 'CT Secondary Circuit Fuse 5A', ARRAY['ct', 'protection_relay'], 14, 20, 10, 45.00),
  ('INSULATOR-POLY', 'Polymer Insulator 220kV', ARRAY['transmission_line'], 120, 10, 5, 1200.00)
ON CONFLICT (part_number) DO UPDATE
  SET description = EXCLUDED.description,
      applicable_asset_types = EXCLUDED.applicable_asset_types,
      lead_time_days = EXCLUDED.lead_time_days,
      on_hand_quantity = EXCLUDED.on_hand_quantity,
      reorder_point = EXCLUDED.reorder_point,
      unit_cost = EXCLUDED.unit_cost,
      updated_at = NOW();

-- Link spare parts to specific assets via asset_spare_parts
DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  relay1_id UUID;
  relay2_id UUID;
  bush_id UUID;
  oltc_id UUID;
  sf6_seal_id UUID;
  cb_spring_id UUID;
  relay_cpu_id UUID;
  relay_io_id UUID;
  ct_fuse_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO relay1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-001';
  SELECT id INTO relay2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'RELAY-002';

  -- Get spare part IDs
  SELECT id INTO bush_id FROM spare_parts WHERE part_number = 'BUSH-220-OIP';
  SELECT id INTO oltc_id FROM spare_parts WHERE part_number = 'OLTC-CONT-SET';
  SELECT id INTO sf6_seal_id FROM spare_parts WHERE part_number = 'SF6-SEAL-KIT';
  SELECT id INTO cb_spring_id FROM spare_parts WHERE part_number = 'CB-MECH-SPRING';
  SELECT id INTO relay_cpu_id FROM spare_parts WHERE part_number = 'RELAY-CARD-CPU';
  SELECT id INTO relay_io_id FROM spare_parts WHERE part_number = 'RELAY-CARD-IO';
  SELECT id INTO ct_fuse_id FROM spare_parts WHERE part_number = 'CT-SEC-FUSE';

  -- Link critical spares to transformers
  INSERT INTO asset_spare_parts (asset_id, spare_part_id, quantity_required, is_critical)
  VALUES
    (tx1_id, bush_id, 3, true),
    (tx1_id, oltc_id, 1, true),
    (tx2_id, bush_id, 3, true),
    (tx2_id, oltc_id, 1, true)
  ON CONFLICT (asset_id, spare_part_id) DO UPDATE
    SET quantity_required = EXCLUDED.quantity_required,
        is_critical = EXCLUDED.is_critical;

  -- Link critical spares to circuit breakers
  INSERT INTO asset_spare_parts (asset_id, spare_part_id, quantity_required, is_critical)
  VALUES
    (cb101_id, sf6_seal_id, 1, true),
    (cb101_id, cb_spring_id, 1, true),
    (cb102_id, sf6_seal_id, 1, true),
    (cb102_id, cb_spring_id, 1, true),
    (cb103_id, sf6_seal_id, 1, false),
    (cb103_id, cb_spring_id, 1, false)
  ON CONFLICT (asset_id, spare_part_id) DO UPDATE
    SET quantity_required = EXCLUDED.quantity_required,
        is_critical = EXCLUDED.is_critical;

  -- Link spares to protection relays
  INSERT INTO asset_spare_parts (asset_id, spare_part_id, quantity_required, is_critical)
  VALUES
    (relay1_id, relay_cpu_id, 1, true),
    (relay1_id, relay_io_id, 2, false),
    (relay1_id, ct_fuse_id, 10, false),
    (relay2_id, relay_cpu_id, 1, true),
    (relay2_id, relay_io_id, 2, false),
    (relay2_id, ct_fuse_id, 10, false)
  ON CONFLICT (asset_id, spare_part_id) DO UPDATE
    SET quantity_required = EXCLUDED.quantity_required,
        is_critical = EXCLUDED.is_critical;
END $;

-- =============================================================================
-- SUBTASK 3.7: Seed criticality model
-- Requirements: 2.2
-- =============================================================================

-- Seed criticality scoring model for power_transmission sector
INSERT INTO asset_criticality_model (sector, safety_weight, production_weight, environmental_weight, detectability_weight)
VALUES
  ('power_transmission', 0.35, 0.30, 0.20, 0.15)
ON CONFLICT (sector) DO UPDATE
  SET safety_weight = EXCLUDED.safety_weight,
      production_weight = EXCLUDED.production_weight,
      environmental_weight = EXCLUDED.environmental_weight,
      detectability_weight = EXCLUDED.detectability_weight;

-- =============================================================================
-- Seed Script Complete
-- =============================================================================

