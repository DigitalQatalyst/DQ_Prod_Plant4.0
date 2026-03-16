-- Seed data for anomaly_signals
-- Requirements: 5.1, 5.2, 8.1

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_dubai_site_id UUID;
    v_jebel_site_id UUID;
    v_aweer_site_id UUID;
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;
    
    -- Get sites
    SELECT id INTO v_dubai_site_id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = v_tenant_id;
    SELECT id INTO v_jebel_site_id FROM sites WHERE name = 'Jebel Ali Grid Station' AND tenant_id = v_tenant_id;
    SELECT id INTO v_aweer_site_id FROM sites WHERE name = 'Al Aweer Regional Hub' AND tenant_id = v_tenant_id;

    -- Clear existing anomaly signals for this tenant
    DELETE FROM anomaly_signals WHERE tenant_id = v_tenant_id;

    -- Insert Anomaly Signals
    INSERT INTO anomaly_signals (
        tenant_id, site_id, signal_name, anomaly_type, observed_value, 
        expected_value, deviation_percentage, severity, status,
        confidence_score, investigation_notes, contributing_factors,
        detected_at
    ) VALUES
    -- Critical Active Anomalies
    (
        v_tenant_id, v_jebel_site_id, 'Phase Current Imbalance', 'load-pattern', 
        15.2, 5.0, 204.0, 'critical', 'confirmed',
        0.95, 'Severe phase imbalance detected on transmission line TL-400-01',
        ARRAY['phase-conductor-issue', 'unbalanced-load'],
        NOW() - INTERVAL '2 hours'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'SCADA Comm Failure', 'communication-pattern', 
        0.0, 1.0, -100.0, 'critical', 'investigating',
        0.98, 'Complete loss of SCADA communication with remote terminal unit',
        ARRAY['network-failure', 'equipment-malfunction'],
        NOW() - INTERVAL '30 minutes'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Breaker Trip Cascade Pattern', 'timing-deviation',
        4.2, 0.0, 420.0, 'critical', 'detected',
        0.93, 'Abnormal cascade pattern detected across multiple circuit breakers suggesting coordinated attack',
        ARRAY['cyber-attack-suspected', 'protection-system-anomaly'],
        NOW() - INTERVAL '1 hour'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Transformer Temperature Spike', 'performance-degradation',
        105.8, 75.0, 41.1, 'critical', 'investigating',
        0.91, 'Sudden transformer temperature increase without corresponding load change',
        ARRAY['cooling-system-failure', 'internal-fault-suspected'],
        NOW() - INTERVAL '45 minutes'
    ),

    -- High Severity Anomalies
    (
        v_tenant_id, v_jebel_site_id, 'Voltage Deviation @ Jebel Ali', 'frequency-anomaly',
        425.8, 400.0, 6.45, 'high', 'detected',
        0.92, 'Voltage deviation detected on 400kV bus during peak load conditions',
        ARRAY['load-spike', 'transformer-tap-change'],
        NOW() - INTERVAL '3 hours'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Protection Relay Anomaly', 'performance-degradation', 
        1.0, 0.0, 100.0, 'high', 'detected',
        0.90, 'Unexpected protection relay trip without apparent fault condition',
        ARRAY['relay-malfunction', 'communication-error'],
        NOW() - INTERVAL '4 hours'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Excessive CB Operations', 'timing-deviation', 
        12.0, 2.0, 500.0, 'high', 'detected',
        0.87, 'Excessive circuit breaker operations detected in control center',
        ARRAY['control-system-issue', 'operator-error'],
        NOW() - INTERVAL '5 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'DNP3 Protocol Anomaly', 'communication-pattern',
        245.0, 120.0, 104.2, 'high', 'investigating',
        0.89, 'Unusual DNP3 message frequency spike on RTU communication channel',
        ARRAY['cyber-attack-suspected', 'device-malfunction'],
        NOW() - INTERVAL '6 hours'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'IEC 61850 GOOSE Flood', 'communication-pattern',
        8500.0, 500.0, 1600.0, 'high', 'confirmed',
        0.94, 'GOOSE message flooding detected on substation LAN',
        ARRAY['cyber-attack-confirmed', 'network-attack'],
        NOW() - INTERVAL '2 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Harmonic Distortion Increase', 'load-pattern',
        12.5, 5.0, 150.0, 'high', 'investigating',
        0.86, 'Total harmonic distortion exceeding limits on 132kV feeder',
        ARRAY['power-electronics-malfunction', 'resonance-condition'],
        NOW() - INTERVAL '8 hours'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'RTU Authentication Failures', 'communication-pattern',
        47.0, 2.0, 2250.0, 'high', 'confirmed',
        0.96, 'Multiple authentication failures detected on RTU connections',
        ARRAY['brute-force-attack', 'credential-compromise-attempt'],
        NOW() - INTERVAL '3 hours'
    ),

    -- Medium Severity Anomalies
    (
        v_tenant_id, v_dubai_site_id, 'System Frequency Drop', 'frequency-anomaly', 
        49.85, 50.0, -0.30, 'medium', 'investigating',
        0.88, 'Frequency deviation below nominal during morning load ramp',
        ARRAY['generation-trip', 'load-increase'],
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'Transformer Overload Warning', 'load-pattern', 
        105.2, 85.0, 23.8, 'medium', 'confirmed',
        0.85, 'Main transformer operating above rated capacity during peak hours',
        ARRAY['high-demand', 'cooling-system-issue'],
        NOW() - INTERVAL '12 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Reactive Power Flux', 'load-pattern', 
        -45.2, -20.0, 126.0, 'medium', 'resolved',
        0.82, 'Abnormal reactive power flow indicating voltage regulation issues',
        ARRAY['capacitor-bank-failure', 'voltage-regulator-issue'],
        NOW() - INTERVAL '2 days'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Communication Latency Increase', 'timing-deviation',
        850.0, 200.0, 325.0, 'medium', 'investigating',
        0.84, 'Increased network latency on SCADA communication links',
        ARRAY['network-congestion', 'switch-performance-degradation'],
        NOW() - INTERVAL '10 hours'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'Bay Controller Memory Usage', 'performance-degradation',
        92.5, 70.0, 32.1, 'medium', 'detected',
        0.81, 'Bay controller memory usage approaching capacity',
        ARRAY['memory-leak', 'configuration-issue'],
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Power Factor Deviation', 'load-pattern',
        0.82, 0.95, -13.7, 'medium', 'investigating',
        0.79, 'Power factor below target on transmission feeder',
        ARRAY['reactive-load-increase', 'compensation-failure'],
        NOW() - INTERVAL '6 hours'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'SCADA Database Query Spike', 'performance-degradation',
        4500.0, 1200.0, 275.0, 'medium', 'detected',
        0.83, 'Unusual increase in database query rate',
        ARRAY['data-exfiltration-suspected', 'misconfigured-application'],
        NOW() - INTERVAL '5 hours'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'Modbus Exception Codes', 'communication-pattern',
        125.0, 15.0, 733.3, 'medium', 'investigating',
        0.88, 'High rate of Modbus exception responses from field devices',
        ARRAY['device-configuration-error', 'firmware-bug'],
        NOW() - INTERVAL '18 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Load Forecasting Divergence', 'load-pattern',
        15.8, 5.0, 216.0, 'medium', 'confirmed',
        0.77, 'Actual load significantly diverging from ML forecasting model predictions',
        ARRAY['model-drift', 'unexpected-consumption-pattern'],
        NOW() - INTERVAL '4 hours'
    ),

    -- Low Severity / Resolved Anomalies
    (
        v_tenant_id, v_aweer_site_id, 'HMI Response Time Degradation', 'performance-degradation',
        2.8, 1.5, 86.7, 'low', 'resolved',
        0.76, 'HMI screen refresh rate slower than baseline',
        ARRAY['system-resource-contention', 'background-process'],
        NOW() - INTERVAL '3 days'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'NTP Time Sync Drift', 'timing-deviation',
        450.0, 50.0, 800.0, 'low', 'resolved',
        0.92, 'Time synchronization drift detected on bay controllers',
        ARRAY['ntp-server-unreachable', 'network-issue'],
        NOW() - INTERVAL '4 days'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'Historian Data Gap', 'communication-pattern',
        5.0, 0.0, 500.0, 'low', 'resolved',
        0.74, 'Short data gaps detected in process historian',
        ARRAY['network-transient', 'buffer-overflow'],
        NOW() - INTERVAL '5 days'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Redundant Link Asymmetry', 'load-pattern',
        85.2, 50.0, 70.4, 'low', 'investigating',
        0.73, 'Traffic imbalance detected on redundant communication paths',
        ARRAY['routing-issue', 'link-degradation'],
        NOW() - INTERVAL '1 day'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Energy Meter Reading Uncertainty', 'performance-degradation',
        0.8, 0.2, 300.0, 'low', 'detected',
        0.71, 'Increased uncertainty in revenue meter readings',
        ARRAY['calibration-drift', 'environmental-factors'],
        NOW() - INTERVAL '2 days'
    ),

    -- False Positives
    (
        v_tenant_id, v_jebel_site_id, 'Load Spike - Scheduled Test', 'load-pattern',
        120.5, 80.0, 50.6, 'medium', 'false-positive',
        0.78, 'Load spike flagged by ML but was planned switching operation',
        ARRAY['scheduled-maintenance', 'planned-event'],
        NOW() - INTERVAL '7 days'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Frequency Transient - Generator Start', 'frequency-anomaly',
        49.75, 50.0, -0.50, 'medium', 'false-positive',
        0.80, 'Frequency deviation during generator synchronization',
        ARRAY['normal-operation', 'transient-event'],
        NOW() - INTERVAL '8 days'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Communication Burst - Firmware Update', 'communication-pattern',
        8500.0, 500.0, 1600.0, 'low', 'false-positive',
        0.69, 'Communication spike during scheduled firmware update',
        ARRAY['scheduled-maintenance', 'firmware-distribution'],
        NOW() - INTERVAL '10 days'
    ),

    -- Additional Recent Detected Anomalies
    (
        v_tenant_id, v_jebel_site_id, 'Tap Changer Operation Frequency', 'timing-deviation',
        45.0, 10.0, 350.0, 'medium', 'detected',
        0.85, 'Excessive tap changer operations on load transformer',
        ARRAY['voltage-instability', 'control-system-oscillation'],
        NOW() - INTERVAL '7 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'Alarm Rate Anomaly', 'communication-pattern',
        350.0, 50.0, 600.0, 'high', 'investigating',
        0.91, 'Abnormally high alarm generation rate from substation automation',
        ARRAY['alarm-flood-attack', 'system-malfunction'],
        NOW() - INTERVAL '2 hours'
    ),
    (
        v_tenant_id, v_aweer_site_id, 'Encryption Handshake Failures', 'communication-pattern',
        28.0, 1.0, 2700.0, 'high', 'confirmed',
        0.93, 'High rate of TLS handshake failures on encrypted SCADA channels',
        ARRAY['certificate-issue', 'man-in-the-middle-suspected'],
        NOW() - INTERVAL '4 hours'
    ),
    (
        v_tenant_id, v_jebel_site_id, 'Substation Battery Voltage Drop', 'performance-degradation',
        48.2, 54.0, -10.7, 'medium', 'investigating',
        0.87, 'Station battery voltage below normal operating range',
        ARRAY['battery-aging', 'charger-malfunction'],
        NOW() - INTERVAL '9 hours'
    ),
    (
        v_tenant_id, v_dubai_site_id, 'IED Configuration Change Detected', 'timing-deviation',
        1.0, 0.0, 100.0, 'high', 'confirmed',
        0.94, 'Unauthorized configuration change detected on intelligent electronic device',
        ARRAY['cyber-attack-suspected', 'insider-threat-possible'],
        NOW() - INTERVAL '1 hour'
    );

END $$;

COMMIT;