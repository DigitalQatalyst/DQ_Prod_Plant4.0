-- ============================================================================
-- APM Transmission FS2: Predictive & Prescriptive Maintenance - Seed Script
-- ============================================================================
-- Feature Set: FS2 - Predictive & Prescriptive Maintenance
-- Requirements: 16.1-16.7, 17.1-17.7, 18.1-18.8, 19.1-19.7
--
-- This script populates initial data for:
-- - Failure predictions and RUL estimation
-- - Condition-Based Maintenance (CBM) triggers
-- - Maintenance recommendations
-- - Risk scoring models
--
-- Dependencies:
-- - FS4: Asset Inventory & Criticality (assets, spare_parts)
-- - FS1: Asset Health & Diagnostics (telemetry_parameters, health_scores)
-- - FS3: Asset Performance & Utilisation (downtime_events)
--
-- Idempotency: This script uses natural key upserts (ON CONFLICT ... DO UPDATE)
-- ============================================================================

-- =============================================================================
-- SUBTASK 35.1: Seed failure predictions
-- Requirements: 16.1-16.7
-- =============================================================================

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO cb104_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-104';

  -- Transformer TX-001: High risk insulation degradation (7-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    tx1_id,
    NOW(),
    78.5,
    85.0,
    7,
    'high',
    45,
    ARRAY['dga_c2h2_elevated', 'moisture_ppm_high', 'bushing_power_factor_degraded']
  ) ON CONFLICT DO NOTHING;

  -- Transformer TX-001: High risk insulation degradation (30-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    tx1_id,
    NOW(),
    65.2,
    82.0,
    30,
    'high',
    45,
    ARRAY['dga_c2h2_elevated', 'moisture_ppm_high', 'bushing_power_factor_degraded']
  ) ON CONFLICT DO NOTHING;

  -- Transformer TX-001: Medium risk insulation degradation (90-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    tx1_id,
    NOW(),
    45.8,
    78.0,
    90,
    'medium',
    45,
    ARRAY['dga_c2h2_elevated', 'moisture_ppm_high']
  ) ON CONFLICT DO NOTHING;

  -- Transformer TX-002: Low risk (7-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    tx2_id,
    NOW(),
    12.3,
    88.0,
    7,
    'low',
    1825,
    ARRAY['normal_operation']
  ) ON CONFLICT DO NOTHING;

  -- Transformer TX-002: Low risk (30-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    tx2_id,
    NOW(),
    18.5,
    85.0,
    30,
    'low',
    1825,
    ARRAY['normal_operation']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-101: Critical risk mechanism wear (7-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb101_id,
    NOW(),
    92.3,
    90.0,
    7,
    'critical',
    15,
    ARRAY['contact_wear_critical', 'operation_count_high', 'mechanism_time_degraded']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-101: Critical risk mechanism wear (30-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb101_id,
    NOW(),
    85.7,
    88.0,
    30,
    'critical',
    15,
    ARRAY['contact_wear_critical', 'operation_count_high', 'mechanism_time_degraded']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-102: Medium risk SF6 degradation (30-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb102_id,
    NOW(),
    42.5,
    80.0,
    30,
    'medium',
    180,
    ARRAY['sf6_density_declining', 'sf6_pressure_low']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-102: Medium risk SF6 degradation (90-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb102_id,
    NOW(),
    35.2,
    75.0,
    90,
    'medium',
    180,
    ARRAY['sf6_density_declining']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-103: Low risk (7-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb103_id,
    NOW(),
    8.5,
    92.0,
    7,
    'low',
    3650,
    ARRAY['normal_operation']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-104: High risk contact wear (30-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb104_id,
    NOW(),
    68.3,
    83.0,
    30,
    'high',
    60,
    ARRAY['contact_wear_high', 'operation_count_elevated']
  ) ON CONFLICT DO NOTHING;

  -- Breaker CB-104: High risk contact wear (90-day horizon)
  INSERT INTO failure_predictions (
    asset_id,
    prediction_date,
    failure_probability,
    confidence,
    time_horizon_days,
    risk_level,
    rul_days,
    contributing_factors
  ) VALUES (
    cb104_id,
    NOW(),
    55.7,
    80.0,
    90,
    'high',
    60,
    ARRAY['contact_wear_high', 'operation_count_elevated']
  ) ON CONFLICT DO NOTHING;

END $;


-- =============================================================================
-- SUBTASK 35.2: Seed CBM triggers
-- Requirements: 17.1-17.7
-- =============================================================================

DO $
DECLARE
  sf6_density_param_id UUID;
  sf6_pressure_param_id UUID;
  top_oil_temp_param_id UUID;
  dga_c2h2_param_id UUID;
  dga_h2_param_id UUID;
  contact_wear_param_id UUID;
  moisture_ppm_param_id UUID;
BEGIN
  -- Get parameter IDs
  SELECT id INTO sf6_density_param_id FROM telemetry_parameters WHERE name = 'sf6_density' AND parameter_type = 'density';
  SELECT id INTO sf6_pressure_param_id FROM telemetry_parameters WHERE name = 'sf6_pressure' AND parameter_type = 'pressure';
  SELECT id INTO top_oil_temp_param_id FROM telemetry_parameters WHERE name = 'top_oil_temp' AND parameter_type = 'temperature';
  SELECT id INTO dga_c2h2_param_id FROM telemetry_parameters WHERE name = 'dga_c2h2' AND parameter_type = 'concentration';
  SELECT id INTO dga_h2_param_id FROM telemetry_parameters WHERE name = 'dga_h2' AND parameter_type = 'concentration';
  SELECT id INTO contact_wear_param_id FROM telemetry_parameters WHERE name = 'contact_wear_percent' AND parameter_type = 'percentage';
  SELECT id INTO moisture_ppm_param_id FROM telemetry_parameters WHERE name = 'moisture_ppm' AND parameter_type = 'concentration';

  -- CBM Trigger 1: SF6 density critical threshold
  -- Natural key: name (unique trigger names)
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'SF6 Density Critical - Immediate Inspection Required',
    sf6_density_param_id,
    'less_than',
    1.30,
    'Perform immediate SF6 gas analysis and leak detection. Schedule breaker inspection within 24 hours. Check for gas leakage and contamination.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 2: SF6 pressure low warning
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'SF6 Pressure Low Warning - Schedule Inspection',
    sf6_pressure_param_id,
    'less_than',
    5.5,
    'Schedule SF6 gas top-up within 7 days. Inspect breaker seals and gaskets for potential leaks.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 3: Transformer oil temperature warning
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'Transformer Oil Temperature Warning - Check Cooling',
    top_oil_temp_param_id,
    'greater_than',
    85.0,
    'Inspect cooling system operation. Check cooling fans, radiators, and oil pumps. Verify load conditions and ambient temperature. Consider load reduction if temperature persists.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 4: DGA C2H2 critical (acetylene indicates arcing)
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'DGA Acetylene Critical - Arcing Detected',
    dga_c2h2_param_id,
    'greater_than',
    35.0,
    'CRITICAL: Acetylene detected indicates internal arcing. Perform immediate offline inspection. Schedule transformer outage for internal inspection within 48 hours. Prepare for potential winding or tap changer replacement.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 5: DGA H2 rate of change (hydrogen trending)
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'DGA Hydrogen Rate of Change - Trending Analysis',
    dga_h2_param_id,
    'rate_of_change_exceeds',
    50.0,
    'Hydrogen generation rate exceeds normal. Increase DGA sampling frequency to weekly. Perform Duval Triangle analysis. Monitor for thermal hotspots.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 6: Contact wear critical threshold
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'Breaker Contact Wear Critical - Replacement Required',
    contact_wear_param_id,
    'greater_than',
    75.0,
    'CRITICAL: Contact wear exceeds 75%. Schedule immediate breaker contact replacement. Prepare spare contact assemblies. Plan outage window for maintenance.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 7: Moisture in transformer oil warning
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'Transformer Moisture Warning - Oil Treatment Required',
    moisture_ppm_param_id,
    'greater_than',
    25.0,
    'Moisture content exceeds safe limits. Schedule oil filtration and drying treatment. Check for water ingress sources. Inspect breather and seals.',
    true
  ) ON CONFLICT DO NOTHING;

  -- CBM Trigger 8: Transformer oil temperature critical
  INSERT INTO cbm_triggers (
    name,
    parameter_id,
    condition_operator,
    threshold_value,
    recommended_action,
    is_active
  ) VALUES (
    'Transformer Oil Temperature Critical - Load Reduction',
    top_oil_temp_param_id,
    'greater_than',
    95.0,
    'CRITICAL: Oil temperature critical. Reduce load immediately by 25%. Inspect cooling system for failures. Prepare for emergency transformer outage if temperature continues to rise.',
    true
  ) ON CONFLICT DO NOTHING;

END $;


-- =============================================================================
-- SUBTASK 35.3: Seed maintenance recommendations
-- Requirements: 18.1-18.8
-- =============================================================================

DO $
DECLARE
  tx1_id UUID;
  tx2_id UUID;
  cb101_id UUID;
  cb102_id UUID;
  cb103_id UUID;
  cb104_id UUID;
  line_n01_id UUID;
  
  -- Spare part IDs
  bush_220_id UUID;
  sf6_cyl_id UUID;
  contact_kit_id UUID;
  oil_filter_id UUID;
  
  -- CBM trigger IDs
  sf6_density_trigger_id UUID;
  oil_temp_trigger_id UUID;
  dga_c2h2_trigger_id UUID;
  contact_wear_trigger_id UUID;
  moisture_trigger_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO tx1_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-001';
  SELECT id INTO tx2_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'TX-002';
  SELECT id INTO cb101_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-101';
  SELECT id INTO cb102_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-102';
  SELECT id INTO cb103_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-103';
  SELECT id INTO cb104_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'CB-104';
  SELECT id INTO line_n01_id FROM assets WHERE sector = 'power_transmission' AND asset_tag = 'LINE-N01';

  -- Get spare part IDs (using natural keys from FS4 seed)
  SELECT id INTO bush_220_id FROM spare_parts WHERE part_number = 'BUSH-220-OIP';
  SELECT id INTO sf6_cyl_id FROM spare_parts WHERE part_number = 'SF6-CYL-50KG';
  SELECT id INTO contact_kit_id FROM spare_parts WHERE part_number = 'CB-CONTACT-KIT';
  SELECT id INTO oil_filter_id FROM spare_parts WHERE part_number = 'TX-OIL-FILTER';

  -- Get CBM trigger IDs
  SELECT id INTO sf6_density_trigger_id FROM cbm_triggers WHERE name = 'SF6 Density Critical - Immediate Inspection Required';
  SELECT id INTO oil_temp_trigger_id FROM cbm_triggers WHERE name = 'Transformer Oil Temperature Warning - Check Cooling';
  SELECT id INTO dga_c2h2_trigger_id FROM cbm_triggers WHERE name = 'DGA Acetylene Critical - Arcing Detected';
  SELECT id INTO contact_wear_trigger_id FROM cbm_triggers WHERE name = 'Breaker Contact Wear Critical - Replacement Required';
  SELECT id INTO moisture_trigger_id FROM cbm_triggers WHERE name = 'Transformer Moisture Warning - Oil Treatment Required';

  -- Recommendation 1: CB-101 Contact Replacement (from failure prediction - CRITICAL)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    cb101_id,
    'replacement',
    'Replace circuit breaker contacts due to critical wear (92.3% failure probability in 7 days). Contact wear exceeds 75% threshold. Immediate action required to prevent catastrophic failure.',
    95.0,
    CURRENT_DATE + INTERVAL '7 days',
    ARRAY[contact_kit_id],
    contact_wear_trigger_id,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 2: TX-001 Internal Inspection (from failure prediction - HIGH)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    tx1_id,
    'inspection',
    'Perform internal transformer inspection due to elevated DGA acetylene levels indicating potential arcing. Schedule offline inspection within 48 hours. Prepare for potential winding or tap changer replacement.',
    92.0,
    CURRENT_DATE + INTERVAL '2 days',
    ARRAY[bush_220_id],
    dga_c2h2_trigger_id,
    'scheduled',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 3: CB-102 SF6 Gas Top-up (from CBM trigger - MEDIUM)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    cb102_id,
    'repair',
    'SF6 gas density below critical threshold. Perform leak detection, seal inspection, and gas top-up. Monitor density after refill to ensure no ongoing leakage.',
    68.0,
    CURRENT_DATE + INTERVAL '7 days',
    ARRAY[sf6_cyl_id],
    sf6_density_trigger_id,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 4: TX-001 Oil Filtration (from CBM trigger - MEDIUM)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    tx1_id,
    'cleaning',
    'Transformer oil moisture content exceeds 25 ppm. Perform oil filtration and drying treatment. Inspect breather and seals for water ingress sources.',
    65.0,
    CURRENT_DATE + INTERVAL '14 days',
    ARRAY[oil_filter_id],
    moisture_trigger_id,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 5: CB-104 Contact Inspection (from failure prediction - HIGH)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    cb104_id,
    'inspection',
    'Breaker contact wear approaching critical levels (68.3% failure probability in 30 days). Schedule inspection and prepare for contact replacement within 60 days.',
    72.0,
    CURRENT_DATE + INTERVAL '30 days',
    ARRAY[contact_kit_id],
    NULL,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 6: TX-002 Routine Inspection (LOW priority)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    tx2_id,
    'inspection',
    'Routine annual transformer inspection. All parameters within normal ranges. Perform visual inspection, oil sampling, and bushing tests.',
    25.0,
    CURRENT_DATE + INTERVAL '90 days',
    NULL,
    NULL,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 7: CB-103 Calibration (LOW priority)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    cb103_id,
    'calibration',
    'Scheduled breaker timing and travel calibration. All parameters normal. Routine maintenance as per manufacturer recommendations.',
    20.0,
    CURRENT_DATE + INTERVAL '120 days',
    NULL,
    NULL,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 8: TX-001 Cooling System Check (from CBM trigger - MEDIUM)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    tx1_id,
    'repair',
    'Transformer oil temperature elevated. Inspect cooling fans, radiators, and oil pumps. Clean radiator fins and verify fan operation.',
    58.0,
    CURRENT_DATE + INTERVAL '7 days',
    NULL,
    oil_temp_trigger_id,
    'scheduled',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 9: LINE-N01 Insulator Inspection (routine)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    line_n01_id,
    'inspection',
    'Routine transmission line insulator inspection. Check for contamination, cracks, and flashover marks. Clean insulators as needed.',
    35.0,
    CURRENT_DATE + INTERVAL '60 days',
    NULL,
    NULL,
    'open',
    NULL
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 10: CB-101 Emergency Replacement (COMPLETED example)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    cb101_id,
    'replacement',
    'Emergency SF6 gas cylinder replacement due to critical leak detected during routine inspection.',
    88.0,
    CURRENT_DATE - INTERVAL '7 days',
    ARRAY[sf6_cyl_id],
    sf6_density_trigger_id,
    'completed',
    'SF6 gas cylinder replaced successfully. Leak was traced to faulty valve seal. New seal installed and system pressure tested. Gas density restored to 1.38 kg/m³. No further leaks detected.'
  ) ON CONFLICT DO NOTHING;

  -- Recommendation 11: TX-002 Oil Sampling (CANCELLED example)
  INSERT INTO maintenance_recommendations (
    asset_id,
    recommendation_type,
    description,
    priority_score,
    due_date,
    required_spares,
    source_trigger_id,
    status,
    completion_notes
  ) VALUES (
    tx2_id,
    'inspection',
    'Scheduled oil sampling for DGA analysis.',
    30.0,
    CURRENT_DATE - INTERVAL '14 days',
    NULL,
    NULL,
    'cancelled',
    'Cancelled due to recent comprehensive oil analysis performed during unplanned outage. Next sampling scheduled for 6 months from now.'
  ) ON CONFLICT DO NOTHING;

END $;


-- =============================================================================
-- SUBTASK 35.4: Seed risk scoring model
-- Requirements: 19.1, 19.2
-- =============================================================================

-- Seed risk scoring model for power_transmission sector
-- Natural key: sector (unique constraint)
-- Weights should sum to 1.0 for normalized scoring
INSERT INTO risk_scoring_model (
  sector,
  criticality_weight,
  health_weight,
  failure_probability_weight,
  performance_deviation_weight
) VALUES (
  'power_transmission',
  0.35,  -- 35% weight on asset criticality (safety, production impact)
  0.30,  -- 30% weight on current health score
  0.25,  -- 25% weight on failure probability predictions
  0.10   -- 10% weight on performance deviations from benchmarks
) ON CONFLICT (sector) DO UPDATE SET
  criticality_weight = EXCLUDED.criticality_weight,
  health_weight = EXCLUDED.health_weight,
  failure_probability_weight = EXCLUDED.failure_probability_weight,
  performance_deviation_weight = EXCLUDED.performance_deviation_weight;

-- =============================================================================
-- Seed Script Complete
-- =============================================================================

