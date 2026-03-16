-- Sample Data for Operational Excellence Database
-- This script populates the database with mock data for testing and development

-- Insert Sectors (reference data)
INSERT INTO sectors (code, name, subsectors) VALUES
('oil-gas', 'Oil & Gas', '["Upstream", "Midstream", "Downstream"]'),
('power', 'Power', '["Generation", "Transmission", "Distribution"]'),
('fmcg', 'FMCG', '["Food & Beverage", "Personal Care & Cosmetics", "Household Care", "Health & Wellness (OTC)"]'),
('water', 'Water', '["Water Supply & Treatment", "Distribution & Networks", "Wastewater & Reuse"]'),
('mining', 'Mining', '["Metal Ores", "Mineral Fuels", "Industrial Minerals", "Gemstones"]');

-- Insert Tenants
INSERT INTO tenants (id, name, sector, subsector) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Acme Manufacturing', 'FMCG', 'Food & Beverage'),
('550e8400-e29b-41d4-a716-446655440002', 'PetroTech Energy', 'Oil & Gas', 'Upstream'),
('550e8400-e29b-41d4-a716-446655440003', 'GridPower Transmission', 'Power', 'Transmission');

-- Insert Sites
INSERT INTO sites (id, tenant_id, name, location, timezone) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Athi River Plant', 'Athi River, Kenya', 'Africa/Nairobi'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Dallas Facility', 'Dallas, TX, USA', 'America/Chicago'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'Permian Basin', 'Texas, USA', 'America/Chicago'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'Eagle Ford', 'Texas, USA', 'America/Chicago'),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'Regional Control Center', 'Austin, TX, USA', 'America/Chicago');

-- Insert Assets
INSERT INTO assets (id, site_id, name, type, description) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Production Line 1', 'Production Line', 'Main bottling line for beverages'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Production Line 2', 'Production Line', 'Secondary bottling line'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'Bottling Line 3', 'Production Line', 'High-speed bottling line'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 'Well Pad Alpha', 'Well Pad', 'Primary well pad with 12 wells'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 'Well Pad Beta', 'Well Pad', 'Secondary well pad with 8 wells'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440005', 'North Transmission Grid', 'Transmission Grid', 'Primary transmission grid serving northern region'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440005', 'East Transmission Grid', 'Transmission Grid', 'Transmission grid serving eastern region');

-- Insert Performance Panels
INSERT INTO performance_panels (
    id, tenant_id, asset_id, name, oee, availability, performance, quality, 
    sector, subsector, changeover_efficiency, packaging_yield, scrap_rate
) VALUES
('880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 
 'Line 1 Performance', 78.5, 92.3, 87.2, 97.6, 'FMCG', 'Food & Beverage', 85.2, 94.8, 2.4),
('880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 
 'Line 2 Performance', 65.2, 85.4, 79.8, 95.7, 'FMCG', 'Food & Beverage', 78.9, 92.1, 4.3);

INSERT INTO performance_panels (
    id, tenant_id, asset_id, name, oee, availability, performance, quality, 
    sector, subsector, well_uptime, planned_production, actual_production, energy_per_barrel, deferment_hours
) VALUES
('880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440004', 
 'Well Pad Alpha Performance', 82.1, 89.5, 91.8, 99.9, 'Oil & Gas', 'Upstream', 89.5, 1200.0, 1098.0, 15.2, 2.5),
('880e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 
 'Well Pad Beta Performance', 76.3, 85.2, 89.6, 99.8, 'Oil & Gas', 'Upstream', 85.2, 800.0, 720.0, 16.8, 3.2);

INSERT INTO performance_panels (
    id, tenant_id, asset_id, name, oee, availability, performance, quality, 
    sector, subsector, line_loading, transformer_loading, transmission_losses, saidi, saifi, trip_count
) VALUES
('880e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440006', 
 'North Grid Performance', 96.8, 98.2, 98.5, 99.9, 'Power', 'Transmission', 75.2, 68.9, 2.1, 45.2, 0.8, 2),
('880e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007', 
 'East Grid Performance', 94.5, 96.8, 97.6, 99.9, 'Power', 'Transmission', 82.1, 71.5, 2.8, 52.1, 1.2, 3);

-- Insert Performance Losses
INSERT INTO performance_losses (performance_panel_id, category, duration_minutes, frequency, impact_percentage) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Planned Downtime', 120, 2, 15.2),
('880e8400-e29b-41d4-a716-446655440001', 'Unplanned Downtime', 85, 4, 12.8),
('880e8400-e29b-41d4-a716-446655440001', 'Speed Loss', 180, 8, 8.7),
('880e8400-e29b-41d4-a716-446655440001', 'Quality Loss', 45, 3, 4.3),
('880e8400-e29b-41d4-a716-446655440002', 'Setup/Changeover', 95, 6, 7.1),
('880e8400-e29b-41d4-a716-446655440002', 'Minor Stoppages', 65, 12, 5.9);

-- Insert Performance Bottlenecks
INSERT INTO performance_bottlenecks (performance_panel_id, asset_id, constraint_description, severity, impact_description) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Conveyor Belt Speed Limitation', 'high', 'Reduces throughput by 15%'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'Temperature Control Instability', 'medium', 'Quality variations in 8% of batches'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004', 'Separator Capacity Constraint', 'high', 'Limits production by 12%');

-- Insert SIM Boards
INSERT INTO sim_boards (
    id, tenant_id, site_id, name, shift_name, shift_date, status, 
    sector, subsector, line_name, current_sku, hourly_target, hourly_actual, 
    blocking_events, starving_events, changeover_status, quality_status
) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 
 'Day Shift - Line 1', 'Day', '2024-12-10', 'on-track', 'FMCG', 'Food & Beverage', 
 'Production Line 1', 'Cola 500ml', 150, 142, 2, 1, 'none', 'normal'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 
 'Night Shift - Line 1', 'Night', '2024-12-09', 'at-risk', 'FMCG', 'Food & Beverage', 
 'Production Line 1', 'Water 1L', 120, 98, 4, 3, 'in-progress', 'deviation');

INSERT INTO sim_boards (
    id, tenant_id, site_id, name, shift_name, shift_date, status, 
    sector, subsector, field_name, pad_name, well_count, active_wells, 
    barrel_at_risk, separator_status, trunkline_status, pressure_reading, flow_rate
) VALUES
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 
 'Day Shift - Pad Alpha', 'Day', '2024-12-10', 'on-track', 'Oil & Gas', 'Upstream', 
 'Permian Field', 'Well Pad Alpha', 12, 11, 150.0, 'normal', 'normal', 850.5, 1098.0),
('990e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 
 'Night Shift - Field Operations', 'Night', '2024-12-09', 'at-risk', 'Oil & Gas', 'Upstream', 
 'Eagle Ford Field', 'Well Pad Beta', 8, 7, 200.0, 'abnormal', 'normal', 780.2, 720.0);

INSERT INTO sim_boards (
    id, tenant_id, site_id, name, shift_name, shift_date, status, 
    sector, subsector, control_center, system_loading, outage_count, 
    switching_orders_count, system_status, grid_stability, voltage_profile
) VALUES
('990e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 
 'Day Shift - North Grid', 'Day', '2024-12-10', 'on-track', 'Power', 'Transmission', 
 'Regional Control Center', 75.2, 0, 3, 'normal', 98.5, 'normal'),
('990e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 
 'Night Shift - Control Center', 'Night', '2024-12-09', 'at-risk', 'Power', 'Transmission', 
 'Regional Control Center', 82.1, 1, 5, 'alert', 96.8, 'high');

-- Insert SIM Metrics
INSERT INTO sim_metrics (sim_board_id, name, target_value, actual_value, unit, status) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'Production Rate', 150.0, 142.0, 'units/hour', 'warning'),
('990e8400-e29b-41d4-a716-446655440001', 'Quality Rate', 98.5, 97.2, '%', 'warning'),
('990e8400-e29b-41d4-a716-446655440001', 'Availability', 95.0, 96.8, '%', 'good'),
('990e8400-e29b-41d4-a716-446655440001', 'OEE', 85.0, 78.5, '%', 'critical'),
('990e8400-e29b-41d4-a716-446655440003', 'Well Uptime', 95.0, 89.5, '%', 'warning'),
('990e8400-e29b-41d4-a716-446655440003', 'Production Rate', 1200.0, 1098.0, 'bbl/day', 'warning'),
('990e8400-e29b-41d4-a716-446655440005', 'System Loading', 80.0, 75.2, '%', 'good'),
('990e8400-e29b-41d4-a716-446655440005', 'Grid Stability', 99.0, 98.5, '%', 'good');

-- Insert Issues
INSERT INTO issues (id, tenant_id, sim_board_id, title, category, priority, status, assignee, description) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 
 'Conveyor belt misalignment causing jams', 'Equipment', 'high', 'in-progress', 'John Doe', 
 'Belt alignment issue causing frequent jams and production delays'),
('aa0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440002', 
 'Temperature sensor reading inconsistent values', 'Instrumentation', 'medium', 'open', 'Jane Smith', 
 'Temperature sensor providing erratic readings affecting process control'),
('aa0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440003', 
 'Well Alpha-7 showing declining production', 'Production', 'high', 'in-progress', 'Mike Johnson', 
 'Production decline observed in Well Alpha-7, investigating potential causes'),
('aa0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440005', 
 'Relay misoperation on Line 345kV', 'Protection', 'high', 'resolved', 'Sarah Wilson', 
 'Protection relay false trip resolved, system restored to normal operation');

-- Insert CI Projects
INSERT INTO ci_projects (
    id, tenant_id, title, stage, priority, owner, target_kpi, target_improvement, 
    sector, subsector, description, start_date, completion_percentage
) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'Reduce Changeover Time on Line 1', 'implementation', 'high', 'John Doe', 
 'Changeover Time', '-25%', 'FMCG', 'Food & Beverage', 
 'SMED implementation to reduce changeover time from 45 to 30 minutes', '2024-11-15', 65.0),
('bb0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 
 'Improve Energy Efficiency', 'analysis', 'medium', 'Jane Smith', 
 'Energy Consumption', '-15%', 'FMCG', 'Food & Beverage', 
 'Energy optimization project targeting 15% reduction in consumption', '2024-11-20', 25.0),
('bb0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 
 'Reduce Well Alpha-7 Deferment', 'implementation', 'high', 'Sarah Johnson', 
 'Well Uptime', '+5%', 'Oil & Gas', 'Upstream', 
 'Artificial lift optimization to improve well performance', '2024-11-15', 40.0),
('bb0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 
 'Reduce Relay Misoperations', 'validation', 'high', 'Lisa Rodriguez', 
 'Relay Reliability', '50% reduction', 'Power', 'Transmission', 
 'Protection system upgrade to reduce misoperations', '2024-10-25', 85.0);

-- Insert Root Causes
INSERT INTO root_causes (id, ci_project_id, category, description, evidence, verified) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'Equipment', 
 'Worn conveyor belt causing irregular movement', 
 '["Vibration analysis report", "Visual inspection photos", "Maintenance logs"]', true),
('cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', 'Process', 
 'Inconsistent operator procedures during changeover', 
 '["Time study data", "Operator interviews", "Video analysis"]', false),
('cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440003', 'Equipment', 
 'ESP pump efficiency degradation', 
 '["Pump performance curves", "Downhole pressure data", "Flow test results"]', true);

-- Insert Countermeasures
INSERT INTO countermeasures (id, ci_project_id, root_cause_id, description, status, owner, due_date) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440001', 
 'Replace conveyor belt and realign system', 'in-progress', 'John Doe', '2024-12-15'),
('dd0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440002', 
 'Develop standardized changeover procedure', 'planned', 'Jane Smith', '2024-12-20'),
('dd0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440002', NULL, 
 'Install additional temperature sensors', 'in-progress', 'Sarah Wilson', '2024-12-18'),
('dd0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440003', 'cc0e8400-e29b-41d4-a716-446655440003', 
 'Replace ESP pump with higher efficiency model', 'planned', 'Mike Johnson', '2025-01-15');

-- Insert Optimisation Opportunities
INSERT INTO optimisation_opportunities (
    id, tenant_id, title, rank_priority, category, potential_impact, 
    confidence_percentage, status, sector, subsector, description
) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 
 'Optimize Line 1 Speed Settings', 1, 'Performance', '+3.2% OEE', 87.0, 'new', 
 'FMCG', 'Food & Beverage', 'AI-identified opportunity to optimize line speed for maximum OEE'),
('ee0e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 
 'Adjust Process Parameters', 2, 'Quality', '+2.1% Quality Rate', 92.0, 'under-review', 
 'FMCG', 'Food & Beverage', 'Process parameter optimization for improved quality'),
('ee0e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 
 'Optimize ESP Settings - Well Beta-3', 1, 'Well Performance', '+180 bbl/day', 92.0, 'new', 
 'Oil & Gas', 'Upstream', 'ESP optimization for increased production'),
('ee0e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 
 'Load Balancing Optimization', 1, 'Loading Optimization', '12% loading improvement', 89.0, 'approved', 
 'Power', 'Transmission', 'Grid load balancing optimization for improved efficiency');

-- Insert Recommendations
INSERT INTO recommendations (id, optimisation_opportunity_id, description, rationale, confidence_percentage, estimated_impact) VALUES
('ff0e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440001', 
 'Increase line speed by 5% during peak efficiency hours', 
 'Historical data shows optimal performance window between 10-14:00', 87.0, '+3.2% OEE improvement'),
('ff0e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440002', 
 'Adjust kiln temperature curve based on material composition', 
 'AI model identified correlation between material properties and optimal temperature', 92.0, '+2.1% quality improvement'),
('ff0e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440003', 
 'Increase ESP frequency to 55Hz during peak hours', 
 'Pump performance curves indicate optimal efficiency at higher frequency', 92.0, '+180 bbl/day production increase');

-- Insert Playbooks
INSERT INTO playbooks (id, name, category, description, applicability_percentage, content) VALUES
('110e8400-e29b-41d4-a716-446655440001', 'Line Speed Optimization', 'Performance', 
 'Step-by-step guide for optimizing production line speed settings', 95.0, 
 '{"steps": ["Analyze historical performance data", "Identify optimal speed ranges", "Test incremental changes", "Monitor quality impact", "Implement optimal settings"]}'),
('110e8400-e29b-41d4-a716-446655440002', 'Quality Control Enhancement', 'Quality', 
 'Best practices for implementing advanced quality control measures', 88.0, 
 '{"steps": ["Establish baseline measurements", "Implement statistical process control", "Train operators on quality standards", "Set up automated alerts", "Continuous monitoring"]}'),
('110e8400-e29b-41d4-a716-446655440003', 'Well Performance Optimization', 'Production', 
 'Comprehensive guide for optimizing oil well performance', 82.0, 
 '{"steps": ["Analyze production decline curves", "Evaluate artificial lift options", "Optimize ESP settings", "Monitor flow assurance", "Implement predictive maintenance"]}');

-- Insert Scenarios
INSERT INTO scenarios (id, optimisation_opportunity_id, name, parameters, projected_outcome, confidence_percentage) VALUES
('120e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440001', 
 'Increased Production Scenario', 
 '{"lineSpeed": 105, "qualityThreshold": 97.5, "maintenanceInterval": 168}', 
 '+3.2% OEE, +5% throughput, -2% quality rate', 87.0),
('120e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440002', 
 'Quality Focus Scenario', 
 '{"lineSpeed": 95, "qualityThreshold": 99.0, "maintenanceInterval": 120}', 
 '+2.1% quality rate, -1.5% throughput, +1% OEE', 92.0),
('120e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440003', 
 'ESP Optimization Scenario', 
 '{"frequency": 55, "pumpDepth": 8500, "flowRate": 180}', 
 '+180 bbl/day, +5% energy efficiency', 92.0);

-- Create some views for common queries
CREATE VIEW performance_summary AS
SELECT 
    pp.id,
    pp.name,
    t.name as tenant_name,
    s.name as site_name,
    a.name as asset_name,
    pp.oee,
    pp.availability,
    pp.performance,
    pp.quality,
    pp.sector,
    pp.subsector,
    pp.last_updated
FROM performance_panels pp
JOIN tenants t ON pp.tenant_id = t.id
JOIN assets a ON pp.asset_id = a.id
JOIN sites s ON a.site_id = s.id;

CREATE VIEW active_issues_summary AS
SELECT 
    i.id,
    i.title,
    i.category,
    i.priority,
    i.status,
    i.assignee,
    t.name as tenant_name,
    sb.name as sim_board_name,
    i.created_at
FROM issues i
JOIN tenants t ON i.tenant_id = t.id
LEFT JOIN sim_boards sb ON i.sim_board_id = sb.id
WHERE i.status IN ('open', 'in-progress');

CREATE VIEW ci_projects_summary AS
SELECT 
    cp.id,
    cp.title,
    cp.stage,
    cp.priority,
    cp.owner,
    cp.target_kpi,
    cp.target_improvement,
    cp.completion_percentage,
    t.name as tenant_name,
    cp.sector,
    cp.subsector,
    COUNT(cm.id) as countermeasures_count,
    COUNT(CASE WHEN cm.status = 'completed' THEN 1 END) as completed_countermeasures
FROM ci_projects cp
JOIN tenants t ON cp.tenant_id = t.id
LEFT JOIN countermeasures cm ON cp.id = cm.ci_project_id
GROUP BY cp.id, t.name;

CREATE VIEW optimisation_opportunities_summary AS
SELECT 
    oo.id,
    oo.title,
    oo.rank_priority,
    oo.category,
    oo.potential_impact,
    oo.confidence_percentage,
    oo.status,
    t.name as tenant_name,
    oo.sector,
    oo.subsector,
    COUNT(r.id) as recommendations_count,
    COUNT(sc.id) as scenarios_count
FROM optimisation_opportunities oo
JOIN tenants t ON oo.tenant_id = t.id
LEFT JOIN recommendations r ON oo.id = r.optimisation_opportunity_id
LEFT JOIN scenarios sc ON oo.id = sc.optimisation_opportunity_id
GROUP BY oo.id, t.name;

-- Add comments to views
COMMENT ON VIEW performance_summary IS 'Summary view of performance panels with tenant, site, and asset information';
COMMENT ON VIEW active_issues_summary IS 'Summary of active (open/in-progress) issues across all tenants';
COMMENT ON VIEW ci_projects_summary IS 'Summary of CI projects with countermeasure counts and completion status';
COMMENT ON VIEW optimisation_opportunities_summary IS 'Summary of optimization opportunities with related recommendations and scenarios';