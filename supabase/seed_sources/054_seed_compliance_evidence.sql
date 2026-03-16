-- Seed data for compliance evidence
-- Context: Power - Transmission Security (DEWA)
-- Description: Populate evidence for compliance requirements
-- Schema: tenant_id, requirement_id, evidence_type, evidence_name, evidence_description, 
--         file_path, file_size_bytes, collected_date, collected_by, validated, 
--         validated_date, validated_by, notes

BEGIN;

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_requirement_id UUID;
    v_req_code TEXT;
    v_evidence_type TEXT;
    v_status TEXT;
    v_file_format TEXT;
    v_file_size INT;
    v_file_path TEXT;
    v_counter INT;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@power-transmission.grid' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Tenant "DEWA - Transmission" not found. Skipping seeding.';
        RETURN;
    END IF;

    -- Clear existing evidence for this tenant to avoid duplicates during reset
    DELETE FROM compliance_evidence WHERE tenant_id = v_tenant_id;

    -- Insert Compliance Evidence
    INSERT INTO compliance_evidence (
        tenant_id, requirement_id, evidence_type, evidence_name, evidence_description, 
        file_path, file_size_bytes, collected_date, collected_by, 
        validated, validated_date, validated_by, notes
    )
    VALUES 
    -- IEC 62443 SR 1.1 Evidence
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-1.1' AND tenant_id = v_tenant_id LIMIT 1),
     'document', 'MFA Implementation Policy', 'Formal policy mandating MFA for all SCADA access.',
     '/compliance/policies/MFA_Policy_v2.pdf', 1024567, NOW() - INTERVAL '60 days', 'sarah.alnuaimi',
     true, NOW() - INTERVAL '55 days', 'fatima.alzahra', '{"version": "2.1", "signed": true}'),
    
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-1.1' AND tenant_id = v_tenant_id LIMIT 1),
     'screenshot', 'MFA Prompt on HMI', 'Screenshot showing RSA SecurID prompt on a protection engineering terminal.',
     '/compliance/evidence/mfa_hmi_prompt.png', 245000, NOW() - INTERVAL '30 days', 'ahmed.almansouri',
     true, NOW() - INTERVAL '28 days', 'sarah.alnuaimi', '{"site": "Dubai Main", "asset": "HMI-01"}'),

    -- NERC CIP CIP-002-5.1-R1 Evidence
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'CIP-002-5.1-R1' AND tenant_id = v_tenant_id LIMIT 1),
     'report', '2023 BES Asset Impact Assessment', 'Full impact assessment report for transmission assets.',
     '/compliance/reports/NERC_CIP_Impact_2023.pdf', 5420000, NOW() - INTERVAL '120 days', 'sarah.alnuaimi',
     true, NOW() - INTERVAL '115 days', 'fatima.alzahra', '{"audit_cycle": "2023-2024"}'),

    -- NESA IAS M1 Evidence
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-2.1' AND tenant_id = v_tenant_id LIMIT 1),
     'document', 'IA Risk Management Framework', 'Formal framework based on ISO 27005 for national energy entities.',
     '/compliance/frameworks/DEWA_IA_Framework.docx', 850000, NOW() - INTERVAL '180 days', 'sarah.alnuaimi',
     true, NOW() - INTERVAL '175 days', 'fatima.alzahra', '{"standard": "NESA IAS"}'),

    -- CITC Link Encryption Evidence
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-3.1' AND tenant_id = v_tenant_id LIMIT 1),
     'configuration', 'Microwave Link IPsec Config', 'Exported configuration of IPsec tunnels for Substation B link.',
     '/compliance/configs/microwave_subB_ipsec.txt', 15000, NOW() - INTERVAL '15 days', 'ahmed.almansouri',
     true, NOW() - INTERVAL '12 days', 'sarah.alnuaimi', '{"device": "Ceragon IP-20", "encryption": "AES-256"}'),

    -- More diverse evidence records
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-2.1' AND tenant_id = v_tenant_id LIMIT 1),
     'log', 'RBAC Audit Logs Oct 2023', 'Access control logs showing role enforcement.',
     '/compliance/logs/rbac_audit_oct_2023.csv', 12500000, NOW() - INTERVAL '45 days', 'sarah.alnuaimi',
     true, NOW() - INTERVAL '44 days', 'fatima.alzahra', '{}'),

    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'CIP-002-5.1-R1' AND tenant_id = v_tenant_id LIMIT 1),
     'log', 'Asset Discovery Scan Results', 'Automated asset discovery report from Nozomi Networks.',
     '/compliance/logs/asset_scan_nov_2023.json', 450000, NOW() - INTERVAL '75 days', 'ahmed.almansouri',
     true, NOW() - INTERVAL '70 days', 'sarah.alnuaimi', '{"tool": "Nozomi", "total_assets": 1250}'),

    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-1.1' AND tenant_id = v_tenant_id LIMIT 1),
     'certificate', 'ISO 27001:2022 Certification', 'Digital copy of the latest ISO 27001 certificate for Transmission Division.',
     '/compliance/certs/ISO27001_DEWA_Trans_2023.pdf', 1200000, NOW() - INTERVAL '300 days', 'corporate_security',
     true, NOW() - INTERVAL '295 days', 'fatima.alzahra', '{"body": "Bureau Veritas", "valid_until": "2026-10-30"}'),

    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-3.1' AND tenant_id = v_tenant_id LIMIT 1),
     'report', 'Network Segmentation Pen Test', 'Full penetration test report focusing on VLAN isolation.',
     '/compliance/reports/Pentest_Segmentation_2024.pdf', 3200000, NOW() - INTERVAL '10 days', 'third_party_auditor',
     false, null, null, '{"severity_found": "low"}'),

    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'CIP-002-5.1-R1' AND tenant_id = v_tenant_id LIMIT 1),
     'configuration', 'Firewall Policy - Al Aweer ESP', 'Configuration file for the ESP firewall at Al Aweer.',
     '/compliance/configs/Aweer_ESP_FW_v4.conf', 85000, NOW() - INTERVAL '18 days', 'fatima.alzahra',
     true, NOW() - INTERVAL '15 days', 'sarah.alnuaimi', '{"zone": "ESP", "site": "Al Aweer"}'),

     -- Pending evidence for ADHICS
    (v_tenant_id, 
     (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-1.1' AND tenant_id = v_tenant_id LIMIT 1), 
     'report', 'Gap Analysis - Health Data Encryption', 'Internal assessment of health data storage security.',
     '/compliance/reports/ADHICS_Gap_2024.pdf', 1800000, NOW() - INTERVAL '5 days', 'sarah.alnuaimi',
     false, null, null, '{"gap_status": "documented"}');

    -- Generate evidence records
    FOR v_counter IN 1..100 LOOP
        -- Reduced loop to avoid potential timeout or complexity issues
        SELECT id, requirement_id INTO v_requirement_id, v_req_code
        FROM compliance_requirements
        WHERE tenant_id = v_tenant_id
        ORDER BY RANDOM()
        LIMIT 1;
    END LOOP;

END $$;

COMMIT;
