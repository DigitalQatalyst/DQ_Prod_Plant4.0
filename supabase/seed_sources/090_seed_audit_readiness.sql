
-- Seed data for Audit Readiness View
-- Adds various standards with different audit states (Overdue, Upcoming, Ready)

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get Tenant ID
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;

    -- PCI DSS v4.0 (Payment Card Industry Data Security Standard)
    -- Scenario: Overdue Audit, Critical Gaps
    INSERT INTO compliance_standards (
        tenant_id, name, full_name, version, category, description, status, 
        compliance_score, total_requirements, met_requirements, partial_requirements, unmet_requirements, not_applicable_requirements,
        last_assessment_date, next_audit_date, audit_frequency_months, 
        applies_to_zones, mandatory, regulatory_body, notes
    ) VALUES (
        v_tenant_id,
        'PCI DSS',
        'Payment Card Industry Data Security Standard',
        '4.0',
        'regulatory',
        'Security standard for organizations that handle branded credit cards from the major card schemes.',
        'non-compliant',
        45.5,
        12, 5, 2, 5, 0,
        NOW() - INTERVAL '14 months', -- Last audit 14 months ago
        NOW() - INTERVAL '2 months',  -- Next audit was 2 months ago (Overdue)
        12,
        ARRAY['corporate-network', 'billing-systems'],
        true,
        'PCI Security Standards Council',
        'Audit overdue. Critical gaps in encryption and access control.'
    );

    -- SOC 2 Type II (Service Organization Control)
    -- Scenario: Audit Ready, High Score
    INSERT INTO compliance_standards (
        tenant_id, name, full_name, version, category, description, status, 
        compliance_score, total_requirements, met_requirements, partial_requirements, unmet_requirements, not_applicable_requirements,
        last_assessment_date, next_audit_date, audit_frequency_months, 
        applies_to_zones, mandatory, regulatory_body, notes
    ) VALUES (
        v_tenant_id,
        'SOC 2 Type II',
        'Service Organization Control 2',
        '2017',
        'cybersecurity',
        'Auditing procedure that ensures your service providers securely manage your data to protect the interests of your organization and the privacy of its clients.',
        'compliant',
        98.0,
        61, 60, 1, 0, 0,
        NOW() - INTERVAL '6 months',
        NOW() + INTERVAL '6 months', -- Audit in 6 months
        12,
        ARRAY['cloud-services', 'corporate-network'],
        false,
        'AICPA',
        'Ready for next audit cycle. Minor observation in change management.'
    );

    -- GDPR (General Data Protection Regulation)
    -- Scenario: In Progress, Approaching Audit
    INSERT INTO compliance_standards (
        tenant_id, name, full_name, version, category, description, status, 
        compliance_score, total_requirements, met_requirements, partial_requirements, unmet_requirements, not_applicable_requirements,
        last_assessment_date, next_audit_date, audit_frequency_months, 
        applies_to_zones, mandatory, regulatory_body, notes
    ) VALUES (
        v_tenant_id,
        'GDPR',
        'General Data Protection Regulation',
        '2016/679',
        'regulatory',
        'Regulation in EU law on data protection and privacy in the European Union and the European Economic Area.',
        'in-progress',
        72.0,
        99, 70, 20, 9, 0,
        NOW() - INTERVAL '10 months',
        NOW() + INTERVAL '2 months', -- Audit in 2 months
        12,
        ARRAY['corporate-network', 'hr-systems', 'customer-portal'],
        true,
        'European Data Protection Board',
        'Audit approaching. Focus on Data Subject Access Requests (DSAR) and consent management.'
    );

    -- ISO 22301 (Business Continuity)
    -- Scenario: Just Started, Low Score
    INSERT INTO compliance_standards (
        tenant_id, name, full_name, version, category, description, status, 
        compliance_score, total_requirements, met_requirements, partial_requirements, unmet_requirements, not_applicable_requirements,
        last_assessment_date, next_audit_date, audit_frequency_months, 
        applies_to_zones, mandatory, regulatory_body, notes
    ) VALUES (
        v_tenant_id,
        'ISO 22301',
        'Security and resilience — Business continuity management systems',
        '2019',
        'cybersecurity',
        'Standard for Business Continuity Management Systems (BCMS) to prepare for, respond to, and recover from disruptions.',
        'in-progress',
        30.0,
        50, 15, 10, 25, 0,
        NULL,
        NOW() + INTERVAL '9 months',
        12,
        ARRAY['all-zones'],
        false,
        'ISO',
        'Implementation phase. Business Impact Analysis (BIA) in progress.'
    );

    -- DOE C2M2 (Cybersecurity Capability Maturity Model)
    -- Scenario: Maturity Assessment
    INSERT INTO compliance_standards (
        tenant_id, name, full_name, version, category, description, status, 
        compliance_score, total_requirements, met_requirements, partial_requirements, unmet_requirements, not_applicable_requirements,
        last_assessment_date, next_audit_date, audit_frequency_months, 
        applies_to_zones, mandatory, regulatory_body, notes
    ) VALUES (
        v_tenant_id,
        'DOE C2M2',
        'Cybersecurity Capability Maturity Model',
        '2.0',
        'cybersecurity',
        'Voluntary model to evaluate cybersecurity capabilities and prioritize investments.',
        'compliant',
        85.0,
        350, 300, 40, 10, 0,
        NOW() - INTERVAL '3 months',
        NOW() + INTERVAL '21 months', -- 2 year cycle
        24,
        ARRAY['critical-infrastructure'],
        false,
        'US Department of Energy',
        'Targeting MIL-3 across all domains.'
    );

END $$;
