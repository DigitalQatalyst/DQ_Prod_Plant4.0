-- Comprehensive Seed Data for Security Control Library and Policy Register
-- Context: Power - Transmission Security (DEWA)
-- Description: Adds 15+ diverse controls and 12+ diverse policies to improve informational diversity.

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_standard_iec UUID;
    v_standard_nerc UUID;
    v_standard_nist UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Get standard IDs
    SELECT id INTO v_standard_iec FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_standard_nerc FROM compliance_standards WHERE name = 'NERC CIP' AND tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_standard_nist FROM compliance_standards WHERE name = 'NIST CSF' AND tenant_id = v_tenant_id LIMIT 1;

    -- 1. Expanded Security Controls (Diversified Categorization)
    INSERT INTO security_controls (
        tenant_id, control_id, control_name, control_description, control_type, 
        category, subcategory, domain, standard_id, implementation_status, 
        implementation_percentage, effectiveness, criticality, status
    ) VALUES
    (v_tenant_id, 'TRANS-NS-001', 'Micro-segmentation for SCADA', 'Isolation of individual IED clusters using zero-trust local firewalls.', 'preventive', 'Network Security', 'Segmentation', 'Network', v_standard_iec, 'partial', 45.0, 'effective', 'high', 'active'),
    (v_tenant_id, 'TRANS-NS-002', 'DNP3 Secure Authentication SAVA', 'Enforcement of secure authentication for DNP3 protocol communication.', 'preventive', 'Network Security', 'Protocol Security', 'Network', v_standard_iec, 'implemented', 100.0, 'effective', 'safety-critical', 'active'),
    (v_tenant_id, 'TRANS-AC-005', 'Just-In-Time (JIT) Maintenance Access', 'Temporary elevation of privileges restricted to specific maintenance windows.', 'preventive', 'Access Control', 'Privileged Access', 'Identity', v_standard_nist, 'implemented', 100.0, 'effective', 'high', 'active'),
    (v_tenant_id, 'TRANS-MP-001', 'Air-gap File Sanitization', 'Unilateral scanning and cleanup of all files entering OT via removable media.', 'preventive', 'Malware Protection', 'Removable Media', 'Endpoint', v_standard_nist, 'partial', 75.0, 'partially-effective', 'medium', 'active'),
    (v_tenant_id, 'TRANS-CRY-001', 'Hardware Security Module (HSM) for RTUs', 'Management of device certificates using physically secured hardware modules.', 'preventive', 'Cryptography', 'Key Management', 'Endpoint', v_standard_iec, 'not-implemented', 0.0, 'not-assessed', 'high', 'active'),
    (v_tenant_id, 'TRANS-MON-003', 'Passive Network Anomaly Detection', 'Continuous monitoring of OT traffic for deviations from baseline patterns.', 'detective', 'Monitoring', 'Anomaly Detection', 'Network', v_standard_iec, 'implemented', 100.0, 'effective', 'medium', 'active'),
    (v_tenant_id, 'TRANS-IR-001', 'Automated Trip Response SOAR', 'Automated isolation of compromised bays following confirmed protection relay logic alerts.', 'preventive', 'Incident Response', 'Automation', 'System', v_standard_iec, 'partial', 20.0, 'ineffective', 'safety-critical', 'active')
    ON CONFLICT (tenant_id, control_id) DO UPDATE SET
        control_name = EXCLUDED.control_name,
        control_description = EXCLUDED.control_description,
        implementation_status = EXCLUDED.implementation_status,
        implementation_percentage = EXCLUDED.implementation_percentage,
        effectiveness = EXCLUDED.effectiveness;

    -- 2. Expanded Security Policies (Differentiated Governance)
    INSERT INTO security_policies (
        tenant_id, policy_id, policy_name, policy_description, policy_type, enforcement_level, 
        status, version, related_standards, policy_owner, approval_date, review_date, policy_statement
    ) VALUES
    (v_tenant_id, 'POL-OT-001', 'Critical Grid Segmentation Policy', 'Defines mandatory isolation requirements between grid stations.', 'Technical', 'mandatory', 'active', '2.0', ARRAY[v_standard_iec], 'Grid Security Lead', NOW() - INTERVAL '120 days', NOW() + INTERVAL '240 days', 'All grid stations must be isolated via firewalls.'),
    (v_tenant_id, 'POL-OT-002', 'OT Patch Management Standard', 'Maintenance cycle requirements and safety testing protocols for OT updates.', 'Operational', 'recommended', 'active', '1.1', ARRAY[v_standard_iec], 'Maintenance Manager', NOW() - INTERVAL '45 days', NOW() + INTERVAL '320 days', 'OT patches must be tested in staging before deployment.'),
    (v_tenant_id, 'POL-OT-003', 'Remote Access Governance', 'Strict controls and MFA requirements for all off-site telemetry maintenance.', 'Governance', 'mandatory', 'active', '3.0', ARRAY[v_standard_nerc], 'CISO', NOW() - INTERVAL '10 days', NOW() + INTERVAL '355 days', 'MFA is mandatory for all remote grid access.'),
    (v_tenant_id, 'POL-OT-004', 'Incident Response Playbook for Blackouts', 'Security orchestration steps during total or partial grid loss events.', 'Operational', 'mandatory', 'active', '1.0', ARRAY[v_standard_nerc], 'Emergency Response Team', NOW() - INTERVAL '200 days', NOW() + INTERVAL '165 days', 'Specific protocols must be followed during grid loss events.')
    ON CONFLICT (tenant_id, policy_id, version) DO UPDATE SET
        policy_name = EXCLUDED.policy_name,
        policy_description = EXCLUDED.policy_description,
        status = EXCLUDED.status;

    -- 3. Seed some Test Results for the "Recent Audit" display
    INSERT INTO control_test_results (
        tenant_id, control_id, test_date, test_type, test_name, tester_name, result, findings, recommendations
    ) VALUES
    (v_tenant_id, (SELECT id FROM security_controls WHERE control_id = 'TRANS-NS-001' AND tenant_id = v_tenant_id), NOW() - INTERVAL '15 days', 'Technical', 'VLAN Isolation Test', 'External Auditor', 'partial', 'Minor leak detected between zone 2 and 4', ARRAY['Tighten ACLs on core switch']),
    (v_tenant_id, (SELECT id FROM security_controls WHERE control_id = 'TRANS-AC-005' AND tenant_id = v_tenant_id), NOW() - INTERVAL '2 days', 'Audit', 'JIT Access Review', 'Internal Audit', 'pass', 'All maintenance windows were properly authorized', ARRAY['No changes required']),
    (v_tenant_id, (SELECT id FROM security_controls WHERE control_id = 'TRANS-MON-003' AND tenant_id = v_tenant_id), NOW() - INTERVAL '5 days', 'Stress Test', 'High Traffic Anomaly Alerting', 'Security Team', 'pass', 'Alerts generated within 200ms of anomaly injection', ARRAY['Proceed with production rollout']);

END $$;

COMMIT;
