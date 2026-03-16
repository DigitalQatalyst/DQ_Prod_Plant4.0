-- Seed Data: Optimisation (AI-powered opportunities and recommendations)
-- Description: Seeds opportunities, recommendations, playbooks, simulations, and publish events for DEWA - Transmission tenant
-- Requirements: 20.1, 20.2, 20.3, 20.4, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6

-- =====================================================
-- PRECONDITION ASSERTIONS
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_site_count INT;
  v_asset_count INT;
  v_telemetry_count INT;
BEGIN
  -- Check that DEWA - Transmission tenant exists
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Precondition failed: DEWA - Transmission tenant not found';
  END IF;

  -- Check that sites exist
  SELECT COUNT(*) INTO v_site_count FROM sites WHERE tenant_id = v_tenant_id;
  IF v_site_count < 3 THEN
    RAISE EXCEPTION 'Precondition failed: Need at least 3 sites, found %', v_site_count;
  END IF;

  -- Check that assets exist
  SELECT COUNT(*) INTO v_asset_count FROM assets WHERE tenant_id = v_tenant_id;
  IF v_asset_count < 10 THEN
    RAISE EXCEPTION 'Precondition failed: Need at least 10 assets, found %', v_asset_count;
  END IF;

  -- Check that telemetry points exist
  SELECT COUNT(*) INTO v_telemetry_count FROM telemetry_points WHERE tenant_id = v_tenant_id;
  IF v_telemetry_count < 10 THEN
    RAISE EXCEPTION 'Precondition failed: Need at least 10 telemetry points, found %', v_telemetry_count;
  END IF;

  RAISE NOTICE 'All preconditions met for optimisation seed data';
END $$;

-- =====================================================
-- CLEAN CTE PATTERN: Fetch IDs
-- =====================================================

WITH tenant_data AS (
  SELECT id as tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1
),
sites_data AS (
  SELECT s.id as site_id, s.name as site_name
  FROM sites s, tenant_data t
  WHERE s.tenant_id = t.tenant_id
  LIMIT 3
),
assets_data AS (
  SELECT a.id as asset_id, a.name as asset_name
  FROM assets a, tenant_data t
  WHERE a.tenant_id = t.tenant_id
  LIMIT 20
),
nodes_data AS (
  SELECT g.id as node_id, g.name as node_name
  FROM grid_nodes g, tenant_data t
  WHERE g.tenant_id = t.tenant_id
  LIMIT 10
),
lines_data AS (
  SELECT g.id as line_id, g.name as line_name
  FROM grid_lines g, tenant_data t
  WHERE g.tenant_id = t.tenant_id
  LIMIT 10
),
telemetry_data AS (
  SELECT tp.id as tp_id, tp.metric as metric_name
  FROM telemetry_points tp, tenant_data t
  WHERE tp.tenant_id = t.tenant_id
  LIMIT 20
),

-- =====================================================
-- INSERT PLAYBOOKS (10 reusable best-practice playbooks)
-- =====================================================

playbooks_insert AS (
  INSERT INTO opt_playbooks (tenant_id, playbook_ref, title, category, description, applicability_criteria, steps, expected_outcomes, success_metrics, case_studies, version, is_active, created_by)
  SELECT 
    t.tenant_id,
    'PB-' || LPAD(row_number() OVER ()::TEXT, 3, '0'),
    playbook.title,
    playbook.category,
    playbook.description,
    playbook.applicability_criteria::jsonb,
    playbook.steps::jsonb,
    playbook.expected_outcomes::jsonb,
    playbook.success_metrics::jsonb,
    playbook.case_studies::jsonb,
    '1.0',
    true,
    'AI System'
  FROM tenant_data t
  CROSS JOIN (VALUES
    ('Loss Reduction - Transformer Loading Optimization', 'loss-reduction', 'Optimize transformer loading to reduce technical losses', 
     '{"min_loading_pct": 30, "max_loading_pct": 70, "loss_threshold_pct": 5}',
     '[{"step": 1, "action": "Analyze transformer loading patterns", "duration": "2 hours"}, {"step": 2, "action": "Identify overloaded and underloaded transformers", "duration": "1 hour"}, {"step": 3, "action": "Redistribute loads across transformers", "duration": "4 hours"}, {"step": 4, "action": "Monitor and validate loss reduction", "duration": "1 week"}]',
     '[{"outcome": "Reduced technical losses by 15-25%"}, {"outcome": "Improved transformer utilization"}, {"outcome": "Extended asset life"}]',
     '[{"metric": "Technical Loss %", "baseline": 8.5, "target": 6.5}, {"metric": "Average Loading %", "baseline": 65, "target": 55}]',
     '[{"site": "Al Quoz Substation", "savings": "$125,000/year", "implementation_time": "2 weeks"}]'),
    
    ('Reliability - SAIDI Improvement through Fault Prediction', 'reliability', 'Use predictive analytics to prevent outages',
     '{"saidi_threshold": 120, "fault_history_required": true}',
     '[{"step": 1, "action": "Deploy fault prediction models", "duration": "1 week"}, {"step": 2, "action": "Identify high-risk assets", "duration": "3 days"}, {"step": 3, "action": "Schedule preventive maintenance", "duration": "2 weeks"}, {"step": 4, "action": "Perform thermal imaging", "duration": "2 days"}, {"step": 5, "action": "Verify protection settings", "duration": "1 day"}, {"step": 6, "action": "Monitor reliability metrics", "duration": "ongoing"}]',
     '[{"outcome": "20-30% reduction in unplanned outages"}, {"outcome": "Improved SAIDI from 120 to 85 minutes/year"}]',
     '[{"metric": "SAIDI", "baseline": 120, "target": 85}, {"metric": "Unplanned Outages", "baseline": 45, "target": 32}]',
     '[{"site": "Business Bay Substation", "improvement": "35% SAIDI reduction", "timeframe": "6 months"}]'),
    
    ('Loading - Peak Demand Management', 'loading', 'Shift loads to reduce peak demand and prevent overloading',
     '{"peak_loading_threshold": 85, "load_shifting_potential": true}',
     '[{"step": 1, "action": "Analyze peak demand patterns", "duration": "1 week"}, {"step": 2, "action": "Identify load shifting opportunities", "duration": "3 days"}, {"step": 3, "action": "Coordinate with customers for load shifting", "duration": "2 weeks"}, {"step": 4, "action": "Implement demand response program", "duration": "1 month"}]',
     '[{"outcome": "15% reduction in peak demand"}, {"outcome": "Avoided infrastructure upgrades worth $2M"}]',
     '[{"metric": "Peak Loading %", "baseline": 92, "target": 78}, {"metric": "Infrastructure Cost Avoidance", "value": 2000000}]',
     '[{"site": "Dubai Mall Feeder", "savings": "$350,000/year", "avoided_capex": "$2M"}]'),
    
    ('Voltage - Reactive Power Optimization', 'voltage', 'Optimize reactive power to improve voltage profiles',
     '{"voltage_deviation_threshold": 5, "power_factor_min": 0.85}',
     '[{"step": 1, "action": "Analyze voltage profiles", "duration": "1 week"}, {"step": 2, "action": "Identify reactive power compensation needs", "duration": "3 days"}, {"step": 3, "action": "Deploy capacitor banks", "duration": "3 weeks"}, {"step": 4, "action": "Tune automatic voltage regulation", "duration": "1 week"}, {"step": 5, "action": "Perform harmonic analysis", "duration": "2 days"}, {"step": 6, "action": "Coordinate with upstream network", "duration": "3 days"}, {"step": 7, "action": "Verify voltage stability margin", "duration": "1 day"}]',
     '[{"outcome": "Voltage deviations reduced to <3%"}, {"outcome": "Power factor improved to >0.95"}, {"outcome": "Reduced line losses by 10%"}]',
     '[{"metric": "Voltage Deviation %", "baseline": 6.2, "target": 2.8}, {"metric": "Power Factor", "baseline": 0.88, "target": 0.96}]',
     '[{"site": "Jebel Ali Industrial", "improvement": "12% loss reduction", "roi_months": 18}]'),
    
    ('Asset Health - Condition-Based Maintenance', 'asset-health', 'Transition from time-based to condition-based maintenance',
     '{"asset_age_min": 10, "failure_rate_threshold": 0.05}',
     '[{"step": 1, "action": "Install condition monitoring sensors", "duration": "2 weeks"}, {"step": 2, "action": "Establish sensor baselines", "duration": "1 week"}, {"step": 3, "action": "Integrate with CMMS", "duration": "2 weeks"}, {"step": 4, "action": "Train maintenance teams", "duration": "1 week"}, {"step": 5, "action": "Implement predictive maintenance workflows", "duration": "1 month"}]',
     '[{"outcome": "25% reduction in maintenance costs"}, {"outcome": "40% reduction in asset failures"}, {"outcome": "Extended asset life by 5 years"}]',
     '[{"metric": "Maintenance Cost", "baseline": 500000, "target": 375000}, {"metric": "Asset Failures", "baseline": 20, "target": 12}]',
     '[{"site": "Al Qusais Substation", "savings": "$125,000/year", "failure_reduction": "45%"}]'),
    
    ('Operational Efficiency - Automated Switching Operations', 'operational-efficiency', 'Automate routine switching to reduce human error',
     '{"manual_operations_per_month": 50, "error_rate_threshold": 0.02}',
     '[{"step": 1, "action": "Map switching sequences", "duration": "2 weeks"}, {"step": 2, "action": "Deploy SCADA automation", "duration": "3 weeks"}]',
     '[{"outcome": "80% of routine switches automated"}, {"outcome": "Human error reduced by 90%"}, {"outcome": "Switching time reduced by 60%"}]',
     '[{"metric": "Automated Switches %", "baseline": 0, "target": 80}, {"metric": "Switching Errors", "baseline": 12, "target": 1}]',
     '[{"site": "Dubai Creek", "time_savings": "200 hours/year", "error_elimination": "95%"}]'),
    
    ('Loss Reduction - Feeder Reconfiguration', 'loss-reduction', 'Reconfigure network topology to minimize losses',
     '{"feeders_count": 10, "reconfiguration_potential": true}',
     '[{"step": 1, "action": "Run load flow analysis on all configurations", "duration": "1 week"}, {"step": 2, "action": "Identify optimal topology", "duration": "3 days"}, {"step": 3, "action": "Plan switching sequence", "duration": "1 week"}, {"step": 4, "action": "Execute reconfiguration", "duration": "2 days"}]',
     '[{"outcome": "8-12% reduction in feeder losses"}, {"outcome": "Improved voltage profiles"}, {"outcome": "Better load balancing"}]',
     '[{"metric": "Feeder Loss %", "baseline": 4.5, "target": 4.0}, {"metric": "Voltage Deviation", "baseline": 5.2, "target": 3.5}]',
     '[{"site": "Deira Distribution", "savings": "$85,000/year", "implementation_time": "1 week"}]'),
    
    ('Reliability - Protection Coordination Review', 'reliability', 'Optimize protection settings to reduce nuisance trips',
     '{"nuisance_trips_per_year": 20, "coordination_review_age": 5}',
     '[{"step": 1, "action": "Audit existing protection settings", "duration": "2 weeks"}, {"step": 2, "action": "Update fault study", "duration": "1 week"}, {"step": 3, "action": "Perform TCC mapping", "duration": "1 week"}, {"step": 4, "action": "Identify coordination gaps", "duration": "3 days"}, {"step": 5, "action": "Update relay settings", "duration": "2 weeks"}, {"step": 6, "action": "Test and verify", "duration": "1 week"}]',
     '[{"outcome": "60% reduction in nuisance trips"}, {"outcome": "Improved selectivity"}, {"outcome": "Reduced downtime"}]',
     '[{"metric": "Nuisance Trips", "baseline": 24, "target": 10}, {"metric": "SAIFI", "baseline": 1.2, "target": 0.8}]',
     '[{"site": "Jumeirah Network", "trip_reduction": "65%", "saifi_improvement": "0.4"}]'),
    
    ('Loading - Distributed Generation Integration', 'loading', 'Integrate solar PV to reduce grid loading',
     '{"solar_potential_kw": 500, "peak_loading_threshold": 90}',
     '[{"step": 1, "action": "Assess solar generation potential", "duration": "1 week"}, {"step": 2, "action": "Design grid integration", "duration": "2 weeks"}, {"step": 3, "action": "Install solar arrays", "duration": "3 months"}, {"step": 4, "action": "Commission and monitor", "duration": "2 weeks"}]',
     '[{"outcome": "20% reduction in peak loading"}, {"outcome": "Deferred infrastructure upgrades"}, {"outcome": "Carbon reduction"}]',
     '[{"metric": "Peak Loading %", "baseline": 94, "target": 75}, {"metric": "Solar Generation kWh/year", "value": 650000}]',
     '[{"site": "Green Community", "capex_avoidance": "$1.5M", "carbon_reduction": "450 tons/year"}]'),
    
    ('Voltage - On-Load Tap Changer Optimization', 'voltage', 'Optimize OLTC settings for better voltage control',
     '{"oltc_equipped": true, "tap_change_frequency": "high"}',
     '[{"step": 1, "action": "Analyze tap change patterns", "duration": "1 week"}, {"step": 2, "action": "Identify optimal tap positions", "duration": "3 days"}, {"step": 3, "action": "Implement automatic voltage control", "duration": "2 weeks"}, {"step": 4, "action": "Perform maintenance cycle", "duration": "1 week"}, {"step": 5, "action": "Monitor and fine-tune", "duration": "1 month"}]',
     '[{"outcome": "Voltage regulation within ±2%"}, {"outcome": "Reduced tap wear"}, {"outcome": "Lower losses"}]',
     '[{"metric": "Voltage Regulation %", "baseline": 4.5, "target": 1.8}, {"metric": "Tap Operations/day", "baseline": 45, "target": 25}]',
     '[{"site": "Marina District", "voltage_quality": "95% improvement", "maintenance_reduction": "40%"}]')
  ) AS playbook(title, category, description, applicability_criteria, steps, expected_outcomes, success_metrics, case_studies)
  ON CONFLICT (tenant_id, playbook_ref) DO NOTHING
  RETURNING id, playbook_ref, category
),

-- =====================================================
-- INSERT OPPORTUNITIES (20 AI-identified opportunities)
-- =====================================================

opportunities_insert AS (
  INSERT INTO opt_opportunities (
    tenant_id, opp_ref, title, category, status, priority, rank_score, confidence,
    estimated_impact_mwh, estimated_impact_cost, estimated_savings, description, analysis,
    site_id, asset_id, node_id, line_id, telemetry_point_id, identified_at
  )
  SELECT 
    t.tenant_id,
    'OPP-' || LPAD(row_number() OVER ()::TEXT, 4, '0'),
    opp.title,
    opp.category,
    opp.status,
    opp.priority,
    opp.rank_score,
    opp.confidence,
    opp.estimated_impact_mwh,
    opp.estimated_impact_cost,
    opp.estimated_savings,
    opp.description,
    opp.analysis::jsonb,
    (SELECT site_id FROM sites_data ORDER BY random() LIMIT 1),
    (SELECT asset_id FROM assets_data ORDER BY random() LIMIT 1),
    (SELECT node_id FROM nodes_data ORDER BY random() LIMIT 1),
    (SELECT line_id FROM lines_data ORDER BY random() LIMIT 1),
    (SELECT tp_id FROM telemetry_data ORDER BY random() LIMIT 1),
    now() - (opp.days_ago || ' days')::INTERVAL
  FROM tenant_data t
  CROSS JOIN (VALUES
    ('Transformer T-45 Loading Optimization', 'loss-reduction', 'identified', 'critical', 95.5, 92.0, 1250.0, 85000.0, 125000.0, 
     'Transformer T-45 at Al Quoz exhibits 78% average loading with peak losses of 8.5%. Analysis indicates potential for 2% loss reduction through load redistribution.',
     '{"summary": "Critical overloading identified on T-45 during peak hours. Losses are 25% above benchmark.", "impactEstimation": {"mwhImpact": 1250, "costImpact": 85000, "qualitativeImpact": ["Reduced thermal stress on T-45", "Minimized risk of adjacent feeder overload"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Scheduled switching during off-peak"}}', 2),
    
    ('Business Bay Substation Reliability Enhancement', 'reliability', 'analyzing', 'high', 92.0, 88.0, 0, 250000.0, 180000.0,
     'Predictive models identify high fault probability (85%) on aging cable feeders. Proactive replacement can prevent 12 outages/year.',
     '{"summary": "Aging cable infrastructure shows high signal noise and partial discharge. Fault imminent within 3 months.", "impactEstimation": {"outagesPrevented": 12, "saidiImpactMinutes": 45, "qualitativeImpact": ["Improved customer satisfaction", "Reduced emergency repair costs"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "High"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Phased replacement with backup supply"}}', 5),
    
    ('Dubai Mall Feeder Peak Demand Reduction', 'loading', 'planning', 'high', 90.0, 85.0, 850.0, 180000.0, 220000.0,
     'Load shifting program can reduce peak demand by 15%, deferring $2M substation upgrade.',
     '{"summary": "Commercial load profiles show high flexibility during late evening. Demand response viable.", "impactEstimation": {"peakReductionPct": 15, "capexDeferred": 2000000, "qualitativeImpact": ["LEED certification points", "Public relations boost"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Incentive-based voluntary participation"}}', 8),
    
    ('Jebel Ali Voltage Profile Improvement', 'voltage', 'identified', 'medium', 87.0, 90.0, 0, 95000.0, 115000.0,
     'Reactive power optimization can reduce voltage deviations from 6.2% to 2.8%, improving quality and reducing losses.',
     '{"summary": "Voltage sagging noted at industrial end-points. Harmonic levels exceeding IEEE-519.", "impactEstimation": {"voltageImprovementPct": 3.4, "powerFactorTarget": 0.96, "qualitativeImpact": ["Reduced equipment overheating", "Better motor efficiency for customers"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Automatic capacitor bank controller tuning"}}', 12),
    
    ('Predictive Maintenance for Circuit Breakers', 'asset-health', 'analyzing', 'high', 85.0, 82.0, 0, 320000.0, 95000.0,
     'Condition monitoring detects degradation in 8 circuit breakers. CBM can prevent failures and reduce maintenance costs by 25%.',
     '{"summary": "Operation counter and gas pressure trends indicate 8 breakers requiring immediate overhaul.", "impactEstimation": {"costReductionPct": 25, "lifeExtensionYears": 5, "qualitativeImpact": ["Enhanced operator safety", "Regulatory compliance"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Standardized maintenance kits deployment"}}', 15),
    
    ('Creek Distribution Feeder Reconfiguration', 'loss-reduction', 'identified', 'medium', 83.0, 87.0, 650.0, 55000.0, 85000.0,
     'Network reconfiguration analysis shows 10% loss reduction potential through optimal topology.',
     '{"summary": "Topology optimization indicates 4 feeders sharing load inefficiently. Loop closing recommended.", "impactEstimation": {"lossReductionPct": 10, "voltageStabilityImprovement": "High", "qualitativeImpact": ["Better load balance", "Resilient network configuration"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Verified switching sequence simulations"}}', 18),
    
    ('Al Qusais OLTC Optimization', 'voltage', 'planning', 'low', 80.0, 85.0, 0, 45000.0, 65000.0,
     'On-load tap changer optimization can improve voltage regulation from ±4.5% to ±1.8% and reduce tap wear.',
     '{"summary": "Frequent hunting behavior noted on OLTC controllers. Settling time is too short.", "impactEstimation": {"regulationImprovementPct": 2.7, "tapWearReductionPct": 40, "qualitativeImpact": ["Extended mechanical life", "Reduced nuisance alarms"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Controller deadband adjustment"}}', 22),
    
    ('Marina District Solar Integration', 'loading', 'identified', 'medium', 78.0, 80.0, 1100.0, 105000.0, 160000.0,
     '650 kW rooftop solar integration can reduce peak loading from 94% to 75%, deferring $1.5M upgrade.',
     '{"summary": "Solar irradiance data confirms high potential for peak shaving at Substation M.", "impactEstimation": {"peakLoadingReducedPct": 19, "carbonReductionTons": 450, "qualitativeImpact": ["Green grid initiative", "Reduced peak energy purchase cost"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Smart inverter ramp rate controls"}}', 25),
    
    ('Protection Coordination Update - Jumeirah', 'reliability', 'analyzing', 'high', 92.5, 86.0, 0, 180000.0, 140000.0,
     'Outdated protection settings cause 24 nuisance trips/year. Coordination review can reduce to 10 trips/year.',
     '{"summary": "Recent network expansion has changed fault current levels. Selectivity is compromised.", "impactEstimation": {"nuisanceTripReduction": 14, "saifiImprovement": 0.4, "qualitativeImpact": ["Reduced crew call-outs", "Improved system reliability branding"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Simulated fault testing before rollout"}}', 3),
    
    ('Green Community DG Integration', 'operational-efficiency', 'planning', 'medium', 76.0, 78.0, 450.0, 75000.0, 95000.0,
     'Distributed generation integration can improve operational flexibility and reduce grid dependence.',
     '{"summary": "Microgrid capabilities can allow islanded operation for critical hubs during storms.", "impactEstimation": {"gridDependenceReductionPct": 30, "backupPowerHours": 200, "qualitativeImpact": ["Disaster resilience", "Local energy generation boost"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Synchronized transition switchgear installation"}}', 28)
,
    
    ('Deira Thermal Overload Mitigation', 'loading', 'identified', 'critical', 94.0, 91.0, 980.0, 195000.0, 240000.0,
     'Three feeders operating at 95-98% thermal capacity. Load balancing can prevent failures and reduce emergency risk.',
     '{"summary": "Feeder F-205, F-206, and F-207 showing critical thermal stress during evening peak.", "impactEstimation": {"failurePreventionPct": 85, "emergencyCostSaving": 55000, "qualitativeImpact": ["Public safety improvement", "Reliable supply to Deira market"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "High"}, "riskAssessment": {"overallRiskLevel": "High", "mitigationStrategy": "Temporary mobile substation deployment during peak"}}', 6),
    
    ('Al Barsha Substation Automation Upgrade', 'operational-efficiency', 'analyzing', 'high', 88.0, 84.0, 0, 125000.0, 175000.0,
     'SCADA automation can reduce switching time by 60% and eliminate 90% of human errors in operations.',
     '{"summary": "Manual switching backlog at Al Barsha slowing down restoration by 45 mins on average.", "impactEstimation": {"switchingTimeReductionPct": 60, "errorEliminationPct": 90, "qualitativeImpact": ["Reduced operator fatigue", "Faster network restoration"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Parallel manual/auto validation phase"}}', 10),
    
    ('Technical Loss Reduction - Zone 3', 'loss-reduction', 'identified', 'high', 91.0, 89.0, 1450.0, 115000.0, 165000.0,
     'Comprehensive loss reduction program targeting conductor upgrades, voltage optimization, and load balancing.',
     '{"summary": "Cumulative losses in Zone 3 exceeding 7.2%. High resistance noted on 33kV lines.", "impactEstimation": {"mwhImpact": 1450, "lossReductionPct": 1.4, "qualitativeImpact": ["Improved voltage at customer end", "Carbon footprint reduction"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Off-peak conductor replacement schedule"}}', 14),
    
    ('Fault Current Limiter Installation', 'reliability', 'planning', 'medium', 82.0, 81.0, 0, 285000.0, 95000.0,
     'High fault current levels (42 kA) exceed breaker ratings. FCL installation prevents equipment damage.',
     '{"summary": "Grid coupling has increased fault levels beyond legacy breaker interrupting capacity.", "impactEstimation": {"equipmentProtectionValue": 850000, "safetyImprovement": "Critical", "qualitativeImpact": ["Deferred breaker replacement", "Enhanced substation security"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "High"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Specialized FCL maintenance training"}}', 20),
    
    ('Smart Grid Sensors Deployment', 'operational-efficiency', 'analyzing', 'medium', 79.0, 83.0, 0, 95000.0, 125000.0,
     'Deploying 150 smart sensors enables real-time monitoring, faster fault detection, and predictive analytics.',
     '{"summary": "Lack of visibility on secondary feeders leading to delayed fault isolation.", "impactEstimation": {"faultDetectionMinutesReduced": 15, "dataCoveragePct": 85, "qualitativeImpact": ["Better network visibility", "Data-driven maintenance decisions"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Phased IoT mesh network rollout"}}', 24),
    
    ('Cable Thermal Monitoring System', 'asset-health', 'identified', 'medium', 81.0, 79.0, 0, 155000.0, 110000.0,
     'Underground cable thermal monitoring prevents overheating failures and extends asset life by 8 years.',
     '{"summary": "DTS systems monitoring showing hotspots on main 132kV interconnectors.", "impactEstimation": {"lifeExtensionYears": 8, "avoidedReplacementCost": 850000, "qualitativeImpact": ["Maximized cable utilization", "Early warning of insulation failure"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Integration with real-time thermal rating (RTTR) software"}}', 16),
    
    ('Demand Response Program - Commercial', 'loading', 'planning', 'high', 86.0, 87.0, 720.0, 85000.0, 135000.0,
     'Commercial customer DR program can shed 750 kW during peak, reducing grid stress and improving reliability.',
     '{"summary": "Shopping malls and hotels in Marina area show high potential for HVAC load shedding.", "impactEstimation": {"loadShedCapacityKw": 750, "gridStressReduction": "High", "qualitativeImpact": ["Community involvement", "Peak price hedge"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Automated DR signaling via AMI"}}', 11),
    
    ('Substation Battery Energy Storage', 'operational-efficiency', 'identified', 'low', 74.0, 76.0, 350.0, 425000.0, 85000.0,
     '2 MWh BESS provides peak shaving, frequency regulation, and backup power during switching operations.',
     '{"summary": "Small scale BESS pilot at Substation B to evaluate ancillary services.", "impactEstimation": {"peakShavingValue": 65000, "backupDurationHours": 2, "qualitativeImpact": ["Renewable smoothing", "Fast frequency response"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "Medium"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Safety fire suppression system integration"}}', 30),
    
    ('Power Quality Improvement - Industrial Park', 'voltage', 'analyzing', 'high', 89.0, 88.0, 0, 135000.0, 195000.0,
     'Harmonic distortion and voltage sags affect industrial customers. Active filtering improves PQ and reduces customer complaints by 85%.',
     '{"summary": "VFD loads at industrial park injecting 12.5% THD into the grid.", "impactEstimation": {"complaintReductionPct": 85, "harmonicReductionTdg": 7.5, "qualitativeImpact": ["Reliable supply for sensitive loads", "Equipment longevity"]}, "feasibilityEvaluation": {"technicalFeasibility": "High", "operationalImpact": "Low"}, "riskAssessment": {"overallRiskLevel": "Low", "mitigationStrategy": "Active power filter (APF) installation at point of common coupling"}}', 7),
    
    ('Grid Resilience Enhancement Program', 'reliability', 'identified', 'critical', 93.0, 90.0, 0, 385000.0, 295000.0,
     'Multi-faceted resilience program including hardening, redundancy, and automated restoration improves SAIDI by 35%.',
     '{"summary": "Strategic investment in critical nodes to withstand severe weather and cyber-physical threats.", "impactEstimation": {"saidiImprovementPct": 35, "benefitCostRatio": 2.4, "qualitativeImpact": ["National security enhancement", "Uninterrupted supply to critical infrastructure"]}, "feasibilityEvaluation": {"technicalFeasibility": "Medium", "operationalImpact": "High"}, "riskAssessment": {"overallRiskLevel": "Medium", "mitigationStrategy": "Comprehensive disaster recovery planning and drills"}}', 4)
  ) AS opp(title, category, status, priority, rank_score, confidence, estimated_impact_mwh, estimated_impact_cost, estimated_savings, description, analysis, days_ago)
  ON CONFLICT (tenant_id, opp_ref) DO NOTHING
  RETURNING id, opp_ref, category, rank_score
),

-- =====================================================
-- INSERT RECOMMENDATIONS (50 recommendations, 2-3 per opportunity)
-- =====================================================

recommendations_insert AS (
  INSERT INTO opt_recommendations (
    tenant_id, opportunity_id, rec_ref, title, description, action_type, priority, status,
    estimated_effort_hours, estimated_cost, estimated_benefit,
    implementation_steps, prerequisites, risks, kpis, created_by
  )
  SELECT 
    t.tenant_id,
    o.id,
    'REC-' || LPAD((row_number() OVER ())::TEXT, 4, '0'),
    rec.title,
    rec.description,
    rec.action_type,
    rec.priority,
    rec.status,
    rec.estimated_effort_hours,
    rec.estimated_cost,
    rec.estimated_benefit,
    rec.implementation_steps::jsonb,
    rec.prerequisites::jsonb,
    rec.risks::jsonb,
    rec.kpis::jsonb,
    'AI Engine'
  FROM tenant_data t
  CROSS JOIN opportunities_insert o
  CROSS JOIN LATERAL (
    SELECT * FROM (VALUES
      -- Recommendation 1 (Common)
      (o.opp_ref, 'Detailed Engineering Assessment', 'Conduct thorough site survey and technical validation', 
       'operational-change', 'high', 'approved', 24.0, 5000.0, 15000.0,
       '[{"step": 1, "action": "Site visit and measurement", "duration": "2 days"}]',
       '["Access permit", "Safety gear"]',
       '[{"risk": "Weather delays", "probability": "low"}]',
       '[{"kpi": "Assessment Accuracy", "target": 95}]'),
      
      -- Recommendation 2 (Specific based on category)
      (o.opp_ref, 
       CASE 
         WHEN o.category = 'loss-reduction' THEN 'Load Flow Optimization Run'
         WHEN o.category = 'reliability' THEN 'Protection Coordination Study'
         WHEN o.category = 'loading' THEN 'Demand Side Management Pilot'
         WHEN o.category = 'voltage' THEN 'AVR Controller Fine-tuning'
         WHEN o.category = 'asset-health' THEN 'Sensor Calibration and Integration'
         ELSE 'Operational Workflow Review'
       END,
       'Execute specialized AI-driven simulation and mapping',
       'configuration', 'medium', 'pending-review', 48.0, 12000.0, 45000.0,
       '[{"step": 1, "action": "Model configuration", "duration": "3 days"}]',
       '["Software license", "Network model"]',
       '[{"risk": "Model divergence", "probability": "medium"}]',
       '[{"kpi": "Optimization Gain", "target": 12}]'),

      -- Recommendation 3 (Execution)
      (o.opp_ref, 'Implementation Phase 1', 'Rollout of the first phase of modernization',
       'asset-upgrade', 'high', 'approved', 120.0, 85000.0, 250000.0,
       '[{"step": 1, "action": "Procurement", "duration": "2 weeks"}]',
       '["Budget approval", "Vendor selection"]',
       '[{"risk": "Supply chain delay", "probability": "medium"}]',
       '[{"kpi": "ROI", "target": 18}]')
    ) AS rec_data(parent_ref, title, description, action_type, priority, status, estimated_effort_hours, estimated_cost, estimated_benefit, implementation_steps, prerequisites, risks, kpis)
    WHERE rec_data.parent_ref = o.opp_ref
    LIMIT 3
  ) rec
  ON CONFLICT (tenant_id, rec_ref) DO NOTHING
  RETURNING id, opportunity_id, rec_ref
),

-- =====================================================
-- LINK OPPORTUNITIES TO PLAYBOOKS (20 links)
-- =====================================================

opportunity_playbook_links AS (
  INSERT INTO opt_opportunity_playbooks (opportunity_id, playbook_id, relevance_score, notes)
  SELECT 
    o.id,
    p.id,
    85.0 + (random() * 15)::NUMERIC(5,2),  -- Relevance score 85-100
    'AI-matched based on category and criteria'
  FROM opportunities_insert o
  INNER JOIN playbooks_insert p ON o.category = p.category
  WHERE random() < 0.8
  LIMIT 25
  ON CONFLICT (opportunity_id, playbook_id) DO NOTHING
  RETURNING opportunity_id, playbook_id
),

-- =====================================================
-- INSERT SIMULATIONS (12 simulation runs)
-- =====================================================

simulations_insert AS (
  INSERT INTO opt_simulations (
    tenant_id, recommendation_id, opportunity_id, sim_ref, sim_type, scenario_name, status,
    input_parameters, results, metrics, warnings, errors, run_duration_ms, started_at, completed_at
  )
  SELECT 
    t.tenant_id,
    r.id,
    o.id,
    'SIM-' || LPAD((row_number() OVER ())::TEXT, 4, '0'),
    sim.sim_type,
    sim.scenario_name,
    sim.status,
    sim.input_parameters::jsonb,
    sim.results::jsonb,
    sim.metrics::jsonb,
    sim.warnings::jsonb,
    sim.errors::jsonb,
    sim.run_duration_ms,
    now() - (sim.days_ago || ' days')::INTERVAL,
    CASE WHEN sim.status = 'completed' THEN now() - (sim.days_ago || ' days')::INTERVAL + (sim.run_duration_ms || ' milliseconds')::INTERVAL ELSE NULL END
  FROM (SELECT id, opportunity_id FROM recommendations_insert) r
  INNER JOIN (SELECT id FROM opportunities_insert) o ON r.opportunity_id = o.id
  CROSS JOIN tenant_data t
  CROSS JOIN LATERAL (
    SELECT * FROM (VALUES
      ('load-flow', 'Base Case Analysis', 'completed', 
       '{"base_loading_pct": 78, "feeders": ["F-101", "F-102", "F-103"], "time_horizon": "24h"}',
       '{"peak_loss_pct": 8.5, "optimal_loading_pct": 55, "loss_reduction_potential_pct": 23.5}',
       '{"total_loss_mwh": 145.5, "loss_cost_usd": 12458, "peak_loading_kva": 8500}',
       '[]', '[]', 4850, 3),
      
      ('voltage-stability', 'Post-Reconfiguration Scenario', 'completed',
       '{"topology": "optimized", "capacitor_banks": [2500, 1800], "power_factor_target": 0.96}',
       '{"voltage_deviation_pct": 2.8, "stability_margin": 0.42, "reactive_reserve_mvar": 4.5}',
       '{"min_voltage_pu": 0.972, "max_voltage_pu": 1.028, "power_factor": 0.961}',
       '[{"code": "W001", "message": "Capacitor bank C2 approaching limit"}]', '[]', 6250, 5)
    ) AS sim_data(sim_type, scenario_name, status, input_parameters, results, metrics, warnings, errors, run_duration_ms, days_ago)
  ) sim
  LIMIT 20
  ON CONFLICT (tenant_id, sim_ref) DO NOTHING
  RETURNING id, sim_ref
),

-- =====================================================
-- INSERT PUBLISH EVENTS (10 events: 5 to SIM, 5 to CI)
-- =====================================================

publish_events_insert AS (
  INSERT INTO opt_publish_events (
    tenant_id, event_ref, source_type, source_id, target_system, target_type, target_id, status,
    payload, published_by, published_at
  )
  SELECT 
    t.tenant_id,
    'PUB-' || LPAD((row_number() OVER ())::TEXT, 4, '0'),
    'opportunity',
    o.id,
    evt.target_system,
    evt.target_type,
    NULL,
    'published',
    evt.payload::jsonb,
    'System Operator',
    now() - (evt.days_ago || ' days')::INTERVAL
  FROM (SELECT id FROM opportunities_insert LIMIT 10) o
  CROSS JOIN tenant_data t
  CROSS JOIN LATERAL (
    SELECT * FROM (VALUES
      ('sim', 'switching-order', 
       '{"order_type": "planned", "priority": "high", "description": "Load redistribution for loss reduction", "site_id": "site-1", "estimated_duration_hours": 4}', 5),
      ('ci', 'ci-project',
       '{"title": "Grid Reliability Enhancement Program", "stage": "ANALYSIS", "priority": "critical", "summary": "Multi-faceted program to improve SAIDI by 35%"}', 4)
    ) AS evt_data(target_system, target_type, payload, days_ago)
    LIMIT 1
  ) evt
  ON CONFLICT (tenant_id, event_ref) DO NOTHING
  RETURNING id, target_system, target_type
)

-- =====================================================
-- POST-SEED VALIDATION
-- =====================================================

SELECT 
  (SELECT COUNT(*) FROM playbooks_insert) as playbooks_inserted,
  (SELECT COUNT(*) FROM opportunities_insert) as opportunities_inserted,
  (SELECT COUNT(*) FROM recommendations_insert) as recommendations_inserted,
  (SELECT COUNT(*) FROM simulations_insert) as simulations_inserted,
  (SELECT COUNT(*) FROM publish_events_insert) as publish_events_inserted;

-- Validate minimum counts
DO $$
DECLARE
  v_tenant_id UUID;
  v_playbooks INT;
  v_opportunities INT;
  v_recommendations INT;
  v_simulations INT;
  v_publish_events INT;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  SELECT COUNT(*) INTO v_playbooks FROM opt_playbooks WHERE tenant_id = v_tenant_id;
  SELECT COUNT(*) INTO v_opportunities FROM opt_opportunities WHERE tenant_id = v_tenant_id;
  SELECT COUNT(*) INTO v_recommendations FROM opt_recommendations WHERE tenant_id = v_tenant_id;
  SELECT COUNT(*) INTO v_simulations FROM opt_simulations WHERE tenant_id = v_tenant_id;
  SELECT COUNT(*) INTO v_publish_events FROM opt_publish_events WHERE tenant_id = v_tenant_id;
  
  IF v_playbooks < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 playbooks, found %', v_playbooks;
  END IF;
  
  IF v_opportunities < 20 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 20 opportunities, found %', v_opportunities;
  END IF;
  
  IF v_recommendations < 40 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 40 recommendations, found %', v_recommendations;
  END IF;
  
  IF v_simulations < 12 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 12 simulations, found %', v_simulations;
  END IF;
  
  IF v_publish_events < 10 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 10 publish events, found %', v_publish_events;
  END IF;
  
  RAISE NOTICE 'Optimisation seed data validation PASSED:';
END $$;
