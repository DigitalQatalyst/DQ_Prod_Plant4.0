-- ============================================================================
-- Seed: apm_alerts for Real-time Alerts & Severity Levels page
-- Target: Local Supabase (DQ_Prod_Plant4.0_Skunk)
-- Assets: Real IDs from the assets table
-- ============================================================================

DO $$
DECLARE
  dubai_main_feeder_id    UUID := 'faf16156-0fc8-4f26-9bdf-602d5848a4eb'; -- Dubai Main Feeder Meter
  dubai_400kv_bay1_id     UUID := '98f57675-4f81-49aa-a417-650d30ee0bbb'; -- Dubai 400kV Bay 1
  dubai_132kv_feeder_id   UUID := 'ddac273b-7274-4e1d-b7f4-dc995263dfa5'; -- Dubai 132kV Feeder CB
  dubai_400kv_incomer_id  UUID := 'a85c8111-25a5-435c-aae0-043214e383c1'; -- Dubai 400kV Incomer CB
  dubai_t2_transformer_id UUID := '116ac6c3-39b9-4b39-9f9d-969e57682fb2'; -- Dubai T2 Backup Transformer
  dubai_t1_transformer_id UUID := 'adf029ad-9c1c-4e6a-9a83-4b249808b468'; -- Dubai T1 Main Transformer
  jbal_import_meter_id    UUID := 'e250b567-b08b-4f0d-a802-c3822bc67b5c'; -- Jebel Ali Import Meter
  jbal_400kv_bay1_id      UUID := 'b2e89186-1141-4e64-8c90-e8f44a01f146'; -- Jebel Ali 400kV Bay 1
  jbal_132kv_feeder_id    UUID := '7c74f681-b647-49e1-ac15-538146fcd1a9'; -- Jebel Ali 132kV Feeder CB
  jbal_400kv_incomer_id   UUID := 'f82d5acb-64c4-4375-992a-21ecdd138b8b'; -- Jebel Ali 400kV Incomer CB
  jbal_t1_transformer_id  UUID := 'b7f4396f-3646-4e7d-b968-aa8906c30c59'; -- Jebel Ali T1 Main Transformer
  alaweer_meter_id        UUID := '1687d74f-7caf-4a41-a3fc-1b348837d92a'; -- Al Aweer Regional Meter
  alaweer_220kv_bay_id    UUID := '2c2b42f0-d7b8-4443-aeeb-fc2a6c9d2ab7'; -- Al Aweer 220kV Bay 1
  alaweer_incomer_id      UUID := 'e284b8ff-7b5b-4af3-bdee-44c76247ab18'; -- Al Aweer 220kV Incomer CB
  alaweer_t1_id           UUID := 'eb7a0d7d-926d-47a5-abe6-0efde56ecf95'; -- Al Aweer T1 Main Transformer
BEGIN

-- ============================================================================
-- EMERGENCY alerts (most severe — shown in red flash on dashboards)
-- ============================================================================

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  dubai_t1_transformer_id,
  'temperature_emergency',
  'emergency',
  'telemetry',
  'Top oil temperature at emergency level: 108°C (Critical limit: 95°C). Immediate de-loading required.',
  NOW() - INTERVAL '22 minutes',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  dubai_400kv_incomer_id,
  'sf6_pressure_emergency',
  'emergency',
  'telemetry',
  'SF6 gas pressure critically low: 3.9 bar (min: 4.5 bar). Switchgear operation unsafe — lockout initiated.',
  NOW() - INTERVAL '48 minutes',
  'ack',
  'operator_khalid',
  NOW() - INTERVAL '40 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  jbal_400kv_incomer_id,
  'busbar_fault_emergency',
  'emergency',
  'diagnostic',
  'Busbar partial discharge at emergency level: 2850 pC. Possible insulation flashover risk.',
  NOW() - INTERVAL '1 hour 10 minutes',
  'ack',
  'engineer_aisha',
  NOW() - INTERVAL '55 minutes'
);

-- ============================================================================
-- CRITICAL alerts
-- ============================================================================

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  dubai_t1_transformer_id,
  'thermal_anomaly_critical',
  'critical',
  'diagnostic',
  'Thermal anomaly: Abnormal winding hot-spot gradient detected (ΔT = 28°C above baseline). DGA acetylene rising.',
  NOW() - INTERVAL '1 hour 35 minutes',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  dubai_132kv_feeder_id,
  'trip_coil_failure_critical',
  'critical',
  'telemetry',
  'Trip coil 1 current deviation: 180 mA measured, expected 210–250 mA. Secondary trip coil active — primary unreliable.',
  NOW() - INTERVAL '2 hours 15 minutes',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  jbal_t1_transformer_id,
  'failure_prediction_critical',
  'critical',
  'prediction',
  'Failure probability 78% within 7 days. Oil leakage and thermal stress pattern matches historical failure signatures.',
  NOW() - INTERVAL '3 hours',
  'ack',
  'engineer_aisha',
  NOW() - INTERVAL '2 hours 30 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  alaweer_220kv_bay_id,
  'protection_relay_critical',
  'critical',
  'diagnostic',
  'Protection relay self-test failed: Zone 1 distance element non-responsive. Backup protection only.',
  NOW() - INTERVAL '4 hours 20 minutes',
  'ack',
  'operator_khalid',
  NOW() - INTERVAL '4 hours'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  dubai_400kv_bay1_id,
  'capacitor_bank_critical',
  'critical',
  'telemetry',
  'Capacitor bank unbalance: Phase C current 14.2% higher than A/B. Internal element failure suspected.',
  NOW() - INTERVAL '5 hours',
  'ack',
  'engineer_hassan',
  NOW() - INTERVAL '4 hours 45 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  alaweer_t1_id,
  'insulation_resistance_critical',
  'critical',
  'diagnostic',
  'HV winding insulation resistance dropped to 820 MΩ (baseline: 4200 MΩ). Moisture ingress or insulation breakdown.',
  NOW() - INTERVAL '6 hours',
  'ack',
  'engineer_aisha',
  NOW() - INTERVAL '5 hours 30 minutes'
);

-- ============================================================================
-- WARNING alerts
-- ============================================================================

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  dubai_t2_transformer_id,
  'load_factor_warning',
  'warning',
  'telemetry',
  'Load factor 91% — sustained high loading for 6+ hours. Thermal aging accelerating. Consider load transfer.',
  NOW() - INTERVAL '35 minutes',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  jbal_132kv_feeder_id,
  'contact_wear_warning',
  'warning',
  'telemetry',
  'Contact wear index: 76% of maintenance limit. Nominal replacement threshold 80%. Schedule inspection.',
  NOW() - INTERVAL '2 hours 45 minutes',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  dubai_main_feeder_id,
  'harmonics_distortion_warning',
  'warning',
  'telemetry',
  'Total Harmonic Distortion (THD) elevated: 6.8% (limit: 5%). Likely non-linear load growth on feeder.',
  NOW() - INTERVAL '3 hours 30 minutes',
  'ack',
  'engineer_hassan',
  NOW() - INTERVAL '3 hours'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  jbal_400kv_bay1_id,
  'cooling_fan_warning',
  'warning',
  'telemetry',
  'Cooling fan group 2 offline. Operating on reduced cooling capacity. ONAN mode only — thermal headroom reduced.',
  NOW() - INTERVAL '4 hours 10 minutes',
  'ack',
  'operator_khalid',
  NOW() - INTERVAL '3 hours 50 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  alaweer_incomer_id,
  'voltage_imbalance_warning',
  'warning',
  'telemetry',
  'Phase voltage imbalance: 3.4% (limit: 3%). Phase B low: 216.4 kV vs expected 220 kV. Investigate upstream source.',
  NOW() - INTERVAL '5 hours 40 minutes',
  'ack',
  'engineer_aisha',
  NOW() - INTERVAL '5 hours 20 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  dubai_t2_transformer_id,
  'dga_hydrogen_warning',
  'warning',
  'diagnostic',
  'DGA hydrogen level: 320 ppm (warning: 300 ppm). Trend showing 15 ppm/day increase. Monitor closely.',
  NOW() - INTERVAL '7 hours',
  'ack',
  'engineer_hassan',
  NOW() - INTERVAL '6 hours 30 minutes'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  alaweer_meter_id,
  'ct_saturation_warning',
  'warning',
  'diagnostic',
  'Current transformer saturation detected during last fault event. Accuracy class may be compromised. Verification required.',
  NOW() - INTERVAL '9 hours',
  'ack',
  'engineer_hassan',
  NOW() - INTERVAL '8 hours 30 minutes'
);

-- ============================================================================
-- INFO alerts
-- ============================================================================

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  dubai_400kv_bay1_id,
  'maintenance_due_info',
  'info',
  'manual',
  'Scheduled maintenance window due in 5 days: Annual SF6 density check and contact inspection.',
  NOW() - INTERVAL '1 hour',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state)
VALUES (
  jbal_import_meter_id,
  'firmware_update_info',
  'info',
  'manual',
  'Firmware update available for IED (v4.2.1 → v4.3.0). Includes protection logic improvements and bug fixes.',
  NOW() - INTERVAL '2 hours',
  'open'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  dubai_t1_transformer_id,
  'oil_sampling_info',
  'info',
  'manual',
  'Routine oil sampling completed. Results within normal limits. Next sampling scheduled in 6 months.',
  NOW() - INTERVAL '1 day 5 hours',
  'ack',
  'engineer_aisha',
  NOW() - INTERVAL '1 day 4 hours'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at)
VALUES (
  alaweer_t1_id,
  'operation_count_milestone_info',
  'info',
  'telemetry',
  'Cumulative operation count reached 3,000 cycles. Mid-life inspection recommended per maintenance plan.',
  NOW() - INTERVAL '2 days 3 hours',
  'ack',
  'engineer_hassan',
  NOW() - INTERVAL '2 days 2 hours'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes)
VALUES (
  jbal_t1_transformer_id,
  'inspection_complete_info',
  'info',
  'manual',
  'Annual thermographic inspection completed. No hotspots detected on HV bushings or cable terminations.',
  NOW() - INTERVAL '3 days',
  'closed',
  'engineer_aisha',
  NOW() - INTERVAL '3 days',
  'engineer_aisha',
  NOW() - INTERVAL '2 days 20 hours',
  'All clear. Bushings TIR <0.5%, cable termination temperatures within spec.'
);

INSERT INTO apm_alerts (asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes)
VALUES (
  dubai_132kv_feeder_id,
  'software_config_update_info',
  'info',
  'manual',
  'Protection scheme settings updated following engineering review. Relay coordination study applied.',
  NOW() - INTERVAL '4 days',
  'closed',
  'engineer_hassan',
  NOW() - INTERVAL '4 days',
  'engineer_hassan',
  NOW() - INTERVAL '3 days 18 hours',
  'Settings verified and tested. FAT report filed.'
);

RAISE NOTICE 'Seeded apm_alerts: %', (SELECT COUNT(*) FROM apm_alerts);
RAISE NOTICE 'Emergency: %, Critical: %, Warning: %, Info: %',
  (SELECT COUNT(*) FROM apm_alerts WHERE severity = 'emergency'),
  (SELECT COUNT(*) FROM apm_alerts WHERE severity = 'critical'),
  (SELECT COUNT(*) FROM apm_alerts WHERE severity = 'warning'),
  (SELECT COUNT(*) FROM apm_alerts WHERE severity = 'info');

-- ============================================================================
-- Seed: apm_alert_history for state transition audit trail
-- ============================================================================

DO $hist$
DECLARE
  aid UUID;
BEGIN
  -- History for the acknowledged emergency alerts
  SELECT id INTO aid FROM apm_alerts WHERE alert_type = 'sf6_pressure_emergency' LIMIT 1;
  IF aid IS NOT NULL THEN
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'open', 'ack', 'operator_khalid', NOW() - INTERVAL '40 minutes', 'Lockout applied. Maintenance team dispatched.');
  END IF;

  SELECT id INTO aid FROM apm_alerts WHERE alert_type = 'busbar_fault_emergency' LIMIT 1;
  IF aid IS NOT NULL THEN
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'open', 'ack', 'engineer_aisha', NOW() - INTERVAL '55 minutes', 'PD meter deployed for continuous monitoring. Engineering review initiated.');
  END IF;

  SELECT id INTO aid FROM apm_alerts WHERE alert_type = 'failure_prediction_critical' LIMIT 1;
  IF aid IS NOT NULL THEN
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'open', 'ack', 'engineer_aisha', NOW() - INTERVAL '2 hours 30 minutes', 'Emergency maintenance work order raised. Shutdown window requested from DEWA Control Centre.');
  END IF;

  SELECT id INTO aid FROM apm_alerts WHERE alert_type = 'inspection_complete_info' LIMIT 1;
  IF aid IS NOT NULL THEN
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'open', 'ack', 'engineer_aisha', NOW() - INTERVAL '3 days', 'Inspection confirmed complete by site team.');
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'ack', 'closed', 'engineer_aisha', NOW() - INTERVAL '2 days 20 hours', 'Closed after verification. Report archived.');
  END IF;

  SELECT id INTO aid FROM apm_alerts WHERE alert_type = 'software_config_update_info' LIMIT 1;
  IF aid IS NOT NULL THEN
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'open', 'ack', 'engineer_hassan', NOW() - INTERVAL '4 days', 'Change management approval received.');
    INSERT INTO apm_alert_history (alert_id, previous_state, new_state, changed_by, changed_at, notes)
    VALUES (aid, 'ack', 'closed', 'engineer_hassan', NOW() - INTERVAL '3 days 18 hours', 'Settings applied and verified in service.');
  END IF;

  RAISE NOTICE 'Seeded apm_alert_history: %', (SELECT COUNT(*) FROM apm_alert_history);
END $hist$;

END $$;
