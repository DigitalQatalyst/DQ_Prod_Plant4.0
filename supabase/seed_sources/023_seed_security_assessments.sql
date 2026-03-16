-- =============================================================================
-- SEED DATA: Security Assessments
-- Description: Seed data for control coverage, risk compliance, and vendor security assessments
-- Requirements: 1.3, 1.4, 1.5
-- =============================================================================

-- Note: This seed data assumes tenants and sites from previous migrations exist
-- Using DEWA tenant from existing seed data

BEGIN;

-- =============================================================================
-- CONTROL COVERAGE ASSESSMENTS
-- =============================================================================

-- IEC 62443 Assessment for DEWA Jebel Ali Power Station
INSERT INTO control_coverage_assessments (
  id, tenant_id, site_id, assessment_name, assessment_date, assessor,
  assessment_type, standard_name, standard_version,
  total_controls, implemented_controls, partial_controls, 
  not_implemented_controls, not_applicable_controls,
  coverage_score, effectiveness_score, maturity_level,
  status, compliance_status,
  critical_gaps, high_gaps, medium_gaps, low_gaps,
  gap_summary, remediation_plan, target_completion_date, next_assessment_date,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(), 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' LIMIT 1),
  'IEC 62443-3-3 Security Level 2 Assessment - Jebel Ali', 
  NOW() - INTERVAL '45 days', 
  'Fatima Al Zahra',
  'iec-62443', 
  'IEC 62443-3-3', 
  '2013',
  85, 68, 12, 5, 0,
  88.24, 85.50, 2,
  'completed', 
  'partial',
  2, 3, 8, 4,
  'Overall strong security posture with some gaps in network segmentation and access control. Critical gaps identified in remote access monitoring and encryption key management.',
  'Implement enhanced network segmentation for process control zone. Deploy MFA for all privileged access. Upgrade encryption protocols to AES-256.',
  NOW() + INTERVAL '90 days',
  NOW() + INTERVAL '365 days',
  'Assessment conducted during planned maintenance window. All critical systems reviewed.',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days'
);

-- NERC CIP Assessment for DEWA Control Centre
INSERT INTO control_coverage_assessments (
  id, tenant_id, site_id, assessment_name, assessment_date, assessor,
  assessment_type, standard_name, standard_version,
  total_controls, implemented_controls, partial_controls, 
  not_implemented_controls, not_applicable_controls,
  coverage_score, effectiveness_score, maturity_level,
  status, compliance_status,
  critical_gaps, high_gaps, medium_gaps, low_gaps,
  gap_summary, remediation_plan, target_completion_date, next_assessment_date,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(), 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM sites WHERE name = 'Dubai Main Substation' LIMIT 1),
  'NERC CIP Compliance Assessment - Control Centre', 
  NOW() - INTERVAL '30 days', 
  'Mohammed bin Rashid',
  'nerc-cip', 
  'NERC CIP Version 6', 
  'v6',
  120, 105, 10, 5, 0,
  91.67, 88.00, 3,
  'completed', 
  'compliant',
  0, 2, 5, 3,
  'Strong compliance with NERC CIP requirements. Minor gaps in personnel training documentation and incident response testing frequency.',
  'Complete quarterly incident response drills. Update training records for all operators. Enhance logging for CIP-007 compliance.',
  NOW() + INTERVAL '60 days',
  NOW() + INTERVAL '180 days',
  'Annual compliance assessment. All BES Cyber Systems reviewed and documented.',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
);

-- Combined Assessment for DEWA Al Aweer Power Station
INSERT INTO control_coverage_assessments (
  id, tenant_id, site_id, assessment_name, assessment_date, assessor,
  assessment_type, standard_name, standard_version,
  total_controls, implemented_controls, partial_controls, 
  not_implemented_controls, not_applicable_controls,
  coverage_score, effectiveness_score, maturity_level,
  status, compliance_status,
  critical_gaps, high_gaps, medium_gaps, low_gaps,
  gap_summary, remediation_plan, target_completion_date, next_assessment_date,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(), 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM sites WHERE name = 'Al Aweer Regional Hub' LIMIT 1),
  'Combined IEC 62443 & UAE Cybersecurity Assessment', 
  NOW() - INTERVAL '15 days', 
  'Ahmed Al Mansouri',
  'combined', 
  'IEC 62443 + UAE Cyber Law', 
  '2023',
  95, 78, 14, 3, 0,
  89.47, 86.20, 2,
  'in-progress', 
  'partial',
  1, 4, 9, 3,
  'Good overall security posture. Critical gap in backup system testing. High priority gaps in vulnerability management and patch deployment processes.',
  'Implement automated vulnerability scanning. Establish monthly backup restoration testing. Deploy centralized patch management system.',
  NOW() + INTERVAL '120 days',
  NOW() + INTERVAL '365 days',
  'Assessment in progress. Final report expected within 2 weeks.',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
);

-- Control details for the above assessment
INSERT INTO control_coverage_details (
  assessment_id, tenant_id, control_id, control_name, control_description, 
  control_category, implementation_status, effectiveness, gap_severity,
  gap_description, remediation_action, remediation_owner, remediation_due_date, remediation_status
)
SELECT 
  id, tenant_id, 'IEC-62443-4-2-CR-1.1', 'Device Identification and Authentication', 
  'All human users shall be identified and authenticated before allowing logical access to the control system.',
  'access-control', 'implemented', 'effective', 'none',
  NULL::TEXT, NULL::TEXT, 'Fatima Al Zahra', NULL::TIMESTAMPTZ, 'completed'
FROM control_coverage_assessments WHERE assessment_name = 'Combined IEC 62443 & UAE Cybersecurity Assessment'
UNION ALL
SELECT 
  id, tenant_id, 'IEC-62443-4-2-CR-2.1', 'Authorization Enforcement', 
  'The control system shall provide the capability to enforce assigned authorizations based on authenticated identities.',
  'access-control', 'implemented', 'effective', 'none',
  NULL::TEXT, NULL::TEXT, 'Fatima Al Zahra', NULL::TIMESTAMPTZ, 'completed'
FROM control_coverage_assessments WHERE assessment_name = 'Combined IEC 62443 & UAE Cybersecurity Assessment'
UNION ALL
SELECT 
  id, tenant_id, 'IEC-62443-4-2-CR-3.1', 'Communication Integrity', 
  'The control system shall provide the capability to protect the integrity of data in transit on the control system networks.',
  'data-protection', 'partial', 'partially-effective', 'medium',
  'Encryption is not enforced on all process control network segments (PCN). Some legacy serial-to-ethernet converters lack encryption support.',
  'Deploy hardware-based VPN concentrators for legacy segments and enable TLS 1.3 on all modern HMI-to-PLC communication links.',
  'Ahmed Al Mansouri', NOW() + INTERVAL '45 days', 'in-progress'
FROM control_coverage_assessments WHERE assessment_name = 'Combined IEC 62443 & UAE Cybersecurity Assessment'
UNION ALL
SELECT 
  id, tenant_id, 'IEC-62443-4-2-CR-5.1', 'Network Segmentation', 
  'Control systems shall be partitioned into security zones and conduits.',
  'network-security', 'implemented', 'effective', 'none',
  NULL::TEXT, NULL::TEXT, 'Mohammed bin Rashid', NULL::TIMESTAMPTZ, 'completed'
FROM control_coverage_assessments WHERE assessment_name = 'Combined IEC 62443 & UAE Cybersecurity Assessment'
UNION ALL
SELECT 
  id, tenant_id, 'IEC-62443-4-1-SR-7.1', 'Vulnerability Management', 
  'Establish a process for identifying, analyzing, and mitigating security vulnerabilities.',
  'monitoring', 'not-implemented', 'ineffective', 'high',
  'No formal vulnerability management process established for OT assets. Reliance on manual checks which are inconsistent across grid stations.',
  'Implement automated vulnerability scanning specifically designed for OT (e.g., passive scanning). Integrate scanning with centralized compliance dashboard.',
  'Sarah Al Nuaimi', NOW() + INTERVAL '60 days', 'not-started'
FROM control_coverage_assessments WHERE assessment_name = 'Combined IEC 62443 & UAE Cybersecurity Assessment';

-- =============================================================================
-- RISK AND COMPLIANCE SUMMARIES
-- =============================================================================

-- Q4 2023 Risk & Compliance Summary for DEWA
INSERT INTO risk_compliance_summaries (
  id, tenant_id, site_id, summary_name, summary_date,
  reporting_period_start, reporting_period_end, summary_type,
  total_risks, critical_risks, high_risks, medium_risks, low_risks,
  mitigated_risks, accepted_risks,
  overall_risk_score, inherent_risk_score, residual_risk_score,
  risk_appetite_threshold, risk_tolerance_exceeded,
  total_standards, compliant_standards, partial_compliant_standards, non_compliant_standards,
  overall_compliance_score, iec_62443_score, nerc_cip_score,
  total_controls, implemented_controls, partial_controls, not_implemented_controls,
  control_effectiveness_score,
  total_incidents, critical_incidents, resolved_incidents,
  total_alerts, critical_alerts,
  total_assets, critical_assets, vulnerable_assets, secure_assets,
  risk_trend, compliance_trend, security_posture_trend,
  executive_summary, key_findings, recommendations, action_items,
  status, approved_by, approved_at,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NULL,
  'Q4 2023 DEWA Cybersecurity Risk & Compliance Summary',
  NOW() - INTERVAL '10 days',
  '2023-10-01'::timestamp,
  '2023-12-31'::timestamp,
  'quarterly',
  45, 3, 12, 22, 8,
  28, 5,
  42.50, 68.00, 42.50,
  50.00, FALSE,
  5, 3, 2, 0,
  88.40, 88.24, 91.67,
  300, 251, 36, 13,
  86.75,
  8, 1, 6,
  127, 8,
  850, 285, 45, 805,
  'improving', 'stable', 'improving',
  'DEWA demonstrated strong cybersecurity posture in Q4 2023 with 88.4% overall compliance score. Risk levels remain within acceptable thresholds. Three critical risks identified related to legacy system vulnerabilities, all with active mitigation plans.',
  ARRAY[
    'IEC 62443 compliance improved from 85% to 88.24% through enhanced network segmentation',
    'NERC CIP compliance maintained at 91.67% with zero critical findings',
    'Incident response time improved by 35% through automation',
    'Vulnerability remediation rate increased to 92% for critical findings',
    'Three critical cyber incidents successfully contained with no operational impact'
  ],
  ARRAY[
    'Accelerate legacy system modernization program to address remaining critical risks',
    'Implement continuous monitoring for all critical assets',
    'Enhance security awareness training for operational staff',
    'Deploy advanced threat detection capabilities for EMS and SCADA systems',
    'Establish formal vendor security assessment program'
  ],
  ARRAY[
    'Complete MFA deployment for all privileged accounts by Q1 2024',
    'Conduct penetration testing of control centre systems',
    'Update incident response playbooks for transmission-specific scenarios',
    'Implement automated vulnerability scanning for OT networks'
  ],
  'approved',
  'Saeed Al Tayer',
  NOW() - INTERVAL '5 days',
  'Quarterly executive summary presented to board. All action items tracked in project management system.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '5 days'
);

-- Monthly Summary for DEWA Jebel Ali Power Station
INSERT INTO risk_compliance_summaries (
  id, tenant_id, site_id, summary_name, summary_date,
  reporting_period_start, reporting_period_end, summary_type,
  total_risks, critical_risks, high_risks, medium_risks, low_risks,
  mitigated_risks, accepted_risks,
  overall_risk_score, inherent_risk_score, residual_risk_score,
  risk_appetite_threshold, risk_tolerance_exceeded,
  total_standards, compliant_standards, partial_compliant_standards, non_compliant_standards,
  overall_compliance_score, iec_62443_score, nerc_cip_score,
  total_controls, implemented_controls, partial_controls, not_implemented_controls,
  control_effectiveness_score,
  total_incidents, critical_incidents, resolved_incidents,
  total_alerts, critical_alerts,
  total_assets, critical_assets, vulnerable_assets, secure_assets,
  risk_trend, compliance_trend, security_posture_trend,
  executive_summary, key_findings, recommendations, action_items,
  status, approved_by, approved_at,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM sites WHERE name = 'Jebel Ali Grid Station' LIMIT 1),
  'January 2024 Jebel Ali Security Summary',
  NOW() - INTERVAL '5 days',
  '2024-01-01'::timestamp,
  '2024-01-31'::timestamp,
  'monthly',
  18, 2, 5, 9, 2,
  12, 2,
  38.75, 62.00, 38.75,
  45.00, FALSE,
  3, 2, 1, 0,
  87.50, 88.24, 0.00,
  85, 68, 12, 5,
  85.50,
  3, 1, 2,
  42, 3,
  285, 95, 12, 273,
  'stable', 'improving', 'stable',
  'Jebel Ali Power Station maintained strong security posture in January 2024. One critical incident (coordinated cyber attack) was successfully contained. Security controls effectiveness at 85.5%.',
  ARRAY[
    'Successfully defended against coordinated cyber attack targeting turbine control systems',
    'Completed quarterly vulnerability assessment with 92% remediation rate',
    'Enhanced monitoring detected 3 unauthorized access attempts, all blocked',
    'Patch compliance improved to 94% for critical systems'
  ],
  ARRAY[
    'Implement additional network segmentation for process control zone',
    'Deploy behavioral analytics for anomaly detection',
    'Enhance physical security integration with cyber monitoring'
  ],
  ARRAY[
    'Complete network segmentation project by end of Q1',
    'Deploy endpoint detection and response (EDR) on all HMI workstations',
    'Conduct tabletop exercise for cyber incident response'
  ],
  'approved',
  'Ahmed Al Mansouri',
  NOW() - INTERVAL '2 days',
  'Monthly site security review. Incident response effectiveness validated.',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '2 days'
);

-- =============================================================================
-- COMPLIANCE STANDARD STATUS (linked to summaries)
-- =============================================================================

-- IEC 62443 Status for Q4 Summary
INSERT INTO compliance_standard_status (
  id, summary_id, tenant_id,
  standard_name, standard_version, standard_type,
  compliance_status, compliance_score,
  total_requirements, met_requirements, partial_requirements, unmet_requirements,
  last_assessment_date, next_assessment_date, assessor,
  critical_gaps, high_gaps, gap_summary, remediation_plan,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM risk_compliance_summaries WHERE summary_name = 'Q4 2023 DEWA Cybersecurity Risk & Compliance Summary' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'IEC 62443-3-3',
  '2013',
  'iec-62443',
  'partial',
  88.24,
  85, 68, 12, 5,
  NOW() - INTERVAL '45 days',
  NOW() + INTERVAL '365 days',
  'Fatima Al Zahra',
  2, 3,
  'Strong compliance with IEC 62443 security levels 1 and 2. Gaps primarily in advanced monitoring and encryption key management.',
  'Deploy centralized key management system. Implement continuous monitoring for all security zones.',
  'Assessment covers all generation and transmission facilities.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- NERC CIP Status for Q4 Summary
INSERT INTO compliance_standard_status (
  id, summary_id, tenant_id,
  standard_name, standard_version, standard_type,
  compliance_status, compliance_score,
  total_requirements, met_requirements, partial_requirements, unmet_requirements,
  last_assessment_date, next_assessment_date, assessor,
  critical_gaps, high_gaps, gap_summary, remediation_plan,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM risk_compliance_summaries WHERE summary_name = 'Q4 2023 DEWA Cybersecurity Risk & Compliance Summary' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'NERC CIP Version 6',
  'v6',
  'nerc-cip',
  'compliant',
  91.67,
  120, 105, 10, 5,
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '180 days',
  'Mohammed bin Rashid',
  0, 2,
  'Full compliance with NERC CIP critical infrastructure protection requirements. Minor documentation gaps.',
  'Complete training documentation updates. Enhance incident response drill frequency.',
  'Covers all BES Cyber Systems and associated Electronic Security Perimeters.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- UAE Cybersecurity Law Status
INSERT INTO compliance_standard_status (
  id, summary_id, tenant_id,
  standard_name, standard_version, standard_type,
  compliance_status, compliance_score,
  total_requirements, met_requirements, partial_requirements, unmet_requirements,
  last_assessment_date, next_assessment_date, assessor,
  critical_gaps, high_gaps, gap_summary, remediation_plan,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM risk_compliance_summaries WHERE summary_name = 'Q4 2023 DEWA Cybersecurity Risk & Compliance Summary' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'UAE Federal Decree-Law No. 5 of 2012',
  '2023',
  'other',
  'compliant',
  92.00,
  50, 45, 4, 1,
  NOW() - INTERVAL '60 days',
  NOW() + INTERVAL '365 days',
  'Mohammed bin Rashid',
  0, 1,
  'Strong compliance with UAE Cybersecurity Law requirements for critical infrastructure. One high-priority gap in data localization.',
  'Complete data residency assessment. Implement data classification framework.',
  'Annual compliance review conducted by UAE Cyber Security Council.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- =============================================================================
-- RISK COMPLIANCE TRENDS (Historical Data)
-- =============================================================================

-- Risk Score Trends (Last 6 months)
INSERT INTO risk_compliance_trends (tenant_id, site_id, trend_date, metric_name, metric_category, metric_value, metric_target, metric_threshold, status, context)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NULL,
  NOW() - (interval '1 month' * generate_series),
  'Overall Risk Score',
  'risk',
  45.0 - (generate_series * 2.5),
  40.0,
  50.0,
  CASE 
    WHEN 45.0 - (generate_series * 2.5) <= 40.0 THEN 'on-target'
    WHEN 45.0 - (generate_series * 2.5) <= 50.0 THEN 'at-risk'
    ELSE 'off-target'
  END,
  jsonb_build_object(
    'period', 'monthly',
    'improvement_initiatives', ARRAY['Network segmentation', 'Vulnerability management', 'Incident response automation']
  )
FROM generate_series(0, 5) AS generate_series;

-- Compliance Score Trends
INSERT INTO risk_compliance_trends (tenant_id, site_id, trend_date, metric_name, metric_category, metric_value, metric_target, metric_threshold, status, context)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NULL,
  NOW() - (interval '1 month' * generate_series),
  'Overall Compliance Score',
  'compliance',
  82.0 + (generate_series * 1.1),
  90.0,
  85.0,
  CASE 
    WHEN 82.0 + (generate_series * 1.1) >= 90.0 THEN 'on-target'
    WHEN 82.0 + (generate_series * 1.1) >= 85.0 THEN 'at-risk'
    ELSE 'off-target'
  END,
  jsonb_build_object(
    'period', 'monthly',
    'standards', ARRAY['IEC 62443', 'NERC CIP', 'UAE Cyber Law']
  )
FROM generate_series(0, 5) AS generate_series;

-- Control Effectiveness Trends
INSERT INTO risk_compliance_trends (tenant_id, site_id, trend_date, metric_name, metric_category, metric_value, metric_target, metric_threshold, status, context)
SELECT 
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NULL,
  NOW() - (interval '1 month' * generate_series),
  'Control Effectiveness Score',
  'control',
  80.0 + (generate_series * 1.3),
  90.0,
  85.0,
  CASE 
    WHEN 80.0 + (generate_series * 1.3) >= 90.0 THEN 'on-target'
    WHEN 80.0 + (generate_series * 1.3) >= 85.0 THEN 'at-risk'
    ELSE 'off-target'
  END,
  jsonb_build_object(
    'period', 'monthly',
    'control_categories', ARRAY['Access Control', 'Network Security', 'Monitoring']
  )
FROM generate_series(0, 5) AS generate_series;

-- =============================================================================
-- VENDOR SECURITY ASSESSMENTS
-- =============================================================================

-- General Electric - Turbine Control Systems
INSERT INTO vendor_security_assessments (
  id, tenant_id,
  vendor_name, vendor_id, vendor_type,
  vendor_contact_name, vendor_contact_email, vendor_contact_phone,
  system_name, system_version, system_type, system_criticality,
  assessment_date, assessment_type, assessor, assessment_method,
  overall_security_score, risk_score, trust_level,
  authentication_score, authorization_score, encryption_score,
  patch_management_score, incident_response_score, data_protection_score,
  certifications, compliance_standards,
  iec_62443_certified, iec_62443_level,
  known_vulnerabilities, critical_vulnerabilities, high_vulnerabilities,
  medium_vulnerabilities, low_vulnerabilities,
  critical_findings, high_findings, medium_findings, low_findings,
  findings_summary,
  recommendations, required_actions, remediation_plan, remediation_deadline,
  contract_start_date, contract_end_date,
  sla_requirements, security_requirements,
  status, approval_status, approved_by, approved_at,
  next_assessment_date, assessment_frequency,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'General Electric',
  'GE-001',
  'equipment-manufacturer',
  'John Anderson',
  'john.anderson@ge.com',
  '+1-555-0123',
  'Mark VIe Turbine Control System',
  'R07.04',
  'scada',
  'production-critical',
  NOW() - INTERVAL '60 days',
  'periodic',
  'Fatima Al Zahra',
  'combined',
  82.50,
  35.00,
  'trusted',
  85.00, 80.00, 78.00,
  88.00, 75.00, 82.00,
  ARRAY['ISO 27001', 'IEC 62443-4-1', 'SOC 2 Type II'],
  ARRAY['IEC 62443', 'NERC CIP', 'NIST CSF'],
  TRUE,
  2,
  8, 0, 2, 4, 2,
  0, 2, 4, 2,
  'GE Mark VIe system demonstrates strong security posture with IEC 62443 SL2 certification. Two high-priority findings related to default credentials and outdated firmware versions. Vendor responsive to security inquiries.',
  ARRAY[
    'Upgrade all Mark VIe controllers to latest firmware version R07.06',
    'Implement centralized credential management for all turbine controllers',
    'Enable encrypted communication between HMI and controllers',
    'Deploy intrusion detection for turbine control network'
  ],
  ARRAY[
    'Change all default passwords within 30 days',
    'Schedule firmware upgrade during next maintenance window',
    'Provide security configuration hardening guide'
  ],
  'Firmware upgrade scheduled for Q2 2024 maintenance window. Credential management system deployment in progress. GE to provide updated security baseline documentation.',
  NOW() + INTERVAL '90 days',
  '2020-01-15'::timestamp,
  '2024-12-31'::timestamp,
  '99.5% availability, 4-hour response time for critical issues, quarterly security updates',
  'IEC 62443 SL2 compliance required, encrypted communications, role-based access control, audit logging enabled',
  'completed',
  'approved',
  'Ahmed Al Mansouri',
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '365 days',
  'annual',
  'Comprehensive assessment including on-site audit and penetration testing. Vendor cooperation excellent.',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '30 days'
);

-- ABB - Protection Relays
INSERT INTO vendor_security_assessments (
  id, tenant_id,
  vendor_name, vendor_id, vendor_type,
  vendor_contact_name, vendor_contact_email, vendor_contact_phone,
  system_name, system_version, system_type, system_criticality,
  assessment_date, assessment_type, assessor, assessment_method,
  overall_security_score, risk_score, trust_level,
  authentication_score, authorization_score, encryption_score,
  patch_management_score, incident_response_score, data_protection_score,
  certifications, compliance_standards,
  iec_62443_certified, iec_62443_level,
  known_vulnerabilities, critical_vulnerabilities, high_vulnerabilities,
  medium_vulnerabilities, low_vulnerabilities,
  critical_findings, high_findings, medium_findings, low_findings,
  findings_summary,
  recommendations, required_actions, remediation_plan, remediation_deadline,
  contract_start_date, contract_end_date,
  sla_requirements, security_requirements,
  status, approval_status, approved_by, approved_at,
  next_assessment_date, assessment_frequency,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'ABB',
  'ABB-001',
  'equipment-manufacturer',
  'Lars Svensson',
  'lars.svensson@abb.com',
  '+46-555-0456',
  'REG670 Protection Relay',
  '2.2.5',
  'protection-relay',
  'safety-critical',
  NOW() - INTERVAL '45 days',
  'periodic',
  'Fatima Al Zahra',
  'documentation-review',
  88.00,
  25.00,
  'trusted',
  92.00, 90.00, 85.00,
  90.00, 82.00, 88.00,
  ARRAY['IEC 62443-4-2', 'IEC 61850 Certified', 'ISO 27001'],
  ARRAY['IEC 62443', 'IEC 61850', 'IEEE 1686'],
  TRUE,
  3,
  3, 0, 0, 2, 1,
  0, 0, 2, 1,
  'ABB REG670 relays demonstrate excellent security with IEC 62443 SL3 certification. Strong authentication and encryption capabilities. Minor findings related to SNMP configuration and syslog integration.',
  ARRAY[
    'Disable SNMPv1/v2, enable SNMPv3 with authentication',
    'Configure secure syslog forwarding to central logging system',
    'Implement role-based access control for engineering access',
    'Enable IEC 62351 security extensions for IEC 61850 communications'
  ],
  ARRAY[
    'Update SNMP configuration on all REG670 relays',
    'Deploy centralized syslog server with TLS support',
    'Document role-based access procedures'
  ],
  'SNMP configuration updates in progress. Syslog server deployment scheduled for Q1 2024. ABB providing updated security configuration templates.',
  NOW() + INTERVAL '60 days',
  '2018-06-01'::timestamp,
  '2025-05-31'::timestamp,
  '99.9% availability, 2-hour response for safety-critical issues, firmware updates within 30 days of release',
  'IEC 62443 SL3 compliance, IEC 62351 security, encrypted communications, secure boot, audit logging',
  'completed',
  'approved',
  'Fatima Al Zahra',
  NOW() - INTERVAL '20 days',
  NOW() + INTERVAL '365 days',
  'annual',
  'Documentation review and configuration audit. ABB security practices exceed industry standards.',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '20 days'
);

-- Schneider Electric - SCADA System
INSERT INTO vendor_security_assessments (
  id, tenant_id,
  vendor_name, vendor_id, vendor_type,
  vendor_contact_name, vendor_contact_email, vendor_contact_phone,
  system_name, system_version, system_type, system_criticality,
  assessment_date, assessment_type, assessor, assessment_method,
  overall_security_score, risk_score, trust_level,
  authentication_score, authorization_score, encryption_score,
  patch_management_score, incident_response_score, data_protection_score,
  certifications, compliance_standards,
  iec_62443_certified, iec_62443_level,
  known_vulnerabilities, critical_vulnerabilities, high_vulnerabilities,
  medium_vulnerabilities, low_vulnerabilities,
  critical_findings, high_findings, medium_findings, low_findings,
  findings_summary,
  recommendations, required_actions, remediation_plan, remediation_deadline,
  contract_start_date, contract_end_date,
  sla_requirements, security_requirements,
  status, approval_status, approved_by, approved_at,
  next_assessment_date, assessment_frequency,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Schneider Electric',
  'SE-001',
  'software-provider',
  'Marie Dubois',
  'marie.dubois@se.com',
  '+33-555-0789',
  'ClearSCADA',
  '2020 R2 SP1',
  'scada',
  'production-critical',
  NOW() - INTERVAL '30 days',
  'periodic',
  'Mohammed bin Rashid',
  'on-site-audit',
  85.00,
  30.00,
  'trusted',
  88.00, 85.00, 82.00,
  90.00, 80.00, 85.00,
  ARRAY['ISO 27001', 'IEC 62443-4-1', 'Achilles Level 2'],
  ARRAY['IEC 62443', 'NERC CIP', 'NIST CSF'],
  TRUE,
  2,
  5, 0, 1, 3, 1,
  0, 1, 3, 1,
  'Schneider ClearSCADA demonstrates good security posture with IEC 62443 SL2 certification. One high-priority finding related to database encryption. Regular security updates provided by vendor.',
  ARRAY[
    'Enable transparent data encryption (TDE) for SCADA database',
    'Implement application whitelisting on SCADA servers',
    'Deploy multi-factor authentication for remote access',
    'Enhance audit logging for configuration changes'
  ],
  ARRAY[
    'Enable database encryption within 60 days',
    'Deploy MFA for all remote access accounts',
    'Update audit log retention policy to 2 years'
  ],
  'Database encryption implementation in progress. MFA deployment scheduled for Q1 2024. Schneider providing enhanced audit logging configuration.',
  NOW() + INTERVAL '75 days',
  '2019-03-01'::timestamp,
  '2024-02-28'::timestamp,
  '99.7% availability, 24/7 support, monthly security patches, quarterly feature updates',
  'IEC 62443 SL2 compliance, encrypted communications, role-based access, comprehensive audit logging, backup and recovery',
  'completed',
  'conditional',
  'Ahmed Al Mansouri',
  NOW() - INTERVAL '15 days',
  NOW() + INTERVAL '365 days',
  'annual',
  'On-site audit conducted. Conditional approval pending database encryption implementation.',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '15 days'
);

-- Fortinet - Network Security
INSERT INTO vendor_security_assessments (
  id, tenant_id,
  vendor_name, vendor_id, vendor_type,
  vendor_contact_name, vendor_contact_email, vendor_contact_phone,
  system_name, system_version, system_type, system_criticality,
  assessment_date, assessment_type, assessor, assessment_method,
  overall_security_score, risk_score, trust_level,
  authentication_score, authorization_score, encryption_score,
  patch_management_score, incident_response_score, data_protection_score,
  certifications, compliance_standards,
  iec_62443_certified, iec_62443_level,
  known_vulnerabilities, critical_vulnerabilities, high_vulnerabilities,
  medium_vulnerabilities, low_vulnerabilities,
  critical_findings, high_findings, medium_findings, low_findings,
  findings_summary,
  recommendations, required_actions, remediation_plan, remediation_deadline,
  contract_start_date, contract_end_date,
  sla_requirements, security_requirements,
  status, approval_status, approved_by, approved_at,
  next_assessment_date, assessment_frequency,
  notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'Fortinet',
  'FORTI-001',
  'equipment-manufacturer',
  'David Chen',
  'david.chen@fortinet.com',
  '+1-555-0321',
  'FortiGate 3000D Firewall',
  '7.2.3',
  'gateway',
  'production-critical',
  NOW() - INTERVAL '20 days',
  'periodic',
  'Mohammed bin Rashid',
  'combined',
  90.00,
  20.00,
  'trusted',
  95.00, 92.00, 90.00,
  95.00, 88.00, 90.00,
  ARRAY['Common Criteria EAL4+', 'FIPS 140-2', 'ICSA Labs Certified'],
  ARRAY['NERC CIP', 'NIST CSF', 'PCI DSS'],
  FALSE,
  0,
  2, 0, 0, 1, 1,
  0, 0, 1, 1,
  'Fortinet FortiGate demonstrates excellent security with Common Criteria EAL4+ certification. Strong threat protection and VPN capabilities. Minor finding related to firmware update scheduling.',
  ARRAY[
    'Implement automated firmware update testing in lab environment',
    'Enable advanced threat protection features',
    'Configure geo-blocking for non-essential countries',
    'Enhance logging integration with SIEM'
  ],
  ARRAY[
    'Schedule firmware updates during maintenance windows',
    'Enable ATP features on all security policies',
    'Configure enhanced logging'
  ],
  'Firmware update process being automated. ATP features deployment in progress. SIEM integration enhancement scheduled for Q1 2024.',
  NOW() + INTERVAL '45 days',
  '2021-09-01'::timestamp,
  '2026-08-31'::timestamp,
  '99.99% availability, 1-hour response for critical issues, monthly firmware updates, 24/7 support',
  'Common Criteria EAL4+, FIPS 140-2, encrypted management, role-based administration, comprehensive logging',
  'completed',
  'approved',
  'Mohammed bin Rashid',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '180 days',
  'semi-annual',
  'Comprehensive assessment including penetration testing. Fortinet security practices exemplary.',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '10 days'
);

-- =============================================================================
-- VENDOR SECURITY FINDINGS (Detailed findings for assessments)
-- =============================================================================

-- GE Mark VIe Findings
INSERT INTO vendor_security_findings (
  id, assessment_id, tenant_id,
  finding_id, finding_title, finding_description, finding_category,
  severity, risk_level, likelihood, impact,
  evidence, affected_components, cve_ids,
  remediation_recommendation, remediation_priority, remediation_status,
  remediation_owner, remediation_due_date,
  verification_method, notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'Mark VIe Turbine Control System' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'GE-FIND-001',
  'Default Credentials Present on Engineering Workstation',
  'Engineering workstation for Mark VIe system contains default credentials that have not been changed since installation. This poses a significant security risk as default credentials are publicly documented.',
  'authentication',
  'high',
  'high',
  'high',
  'medium',
  'Default credentials verified during on-site audit. Documentation review confirmed credentials match factory defaults.',
  ARRAY['Engineering Workstation', 'ToolboxST Software', 'Mark VIe Controllers'],
  ARRAY[]::text[],
  'Immediately change all default credentials to strong, unique passwords. Implement password policy requiring 90-day rotation for engineering accounts. Enable account lockout after 3 failed attempts.',
  'immediate',
  'in-progress',
  'John Anderson (GE)',
  NOW() + INTERVAL '30 days',
  'Password change verification and policy enforcement testing',
  'GE committed to credential change within 30 days. DEWA to verify completion.',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '10 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'Mark VIe Turbine Control System' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'GE-FIND-002',
  'Outdated Firmware Version with Known Vulnerabilities',
  'Mark VIe controllers running firmware version R07.04 which contains two known vulnerabilities addressed in R07.06. Vulnerabilities relate to buffer overflow in communication stack.',
  'patch-management',
  'high',
  'high',
  'medium',
  'high',
  'Firmware version verified on all 9 turbine controllers. GE security bulletin SB-2023-045 documents vulnerabilities.',
  ARRAY['Mark VIe Controllers (Units 1-9)', 'Communication Modules'],
  ARRAY['CVE-2023-12345', 'CVE-2023-12346'],
  'Upgrade all Mark VIe controllers to firmware version R07.06 or later. Schedule upgrade during planned maintenance window. Test in lab environment before production deployment.',
  'high',
  'open',
  'John Anderson (GE)',
  NOW() + INTERVAL '90 days',
  'Firmware version verification post-upgrade',
  'Firmware upgrade scheduled for Q2 2024 maintenance window. Lab testing to begin in March 2024.',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '60 days'
);

-- Schneider ClearSCADA Finding
INSERT INTO vendor_security_findings (
  id, assessment_id, tenant_id,
  finding_id, finding_title, finding_description, finding_category,
  severity, risk_level, likelihood, impact,
  evidence, affected_components, cve_ids,
  remediation_recommendation, remediation_priority, remediation_status,
  remediation_owner, remediation_due_date,
  verification_method, notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'ClearSCADA' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'SE-FIND-001',
  'SCADA Database Not Encrypted at Rest',
  'ClearSCADA database storing operational data, alarm history, and configuration is not encrypted at rest. Database contains sensitive information about grid operations and control system configuration.',
  'data-protection',
  'high',
  'high',
  'medium',
  'high',
  'Database configuration review confirmed TDE not enabled. Database files stored on unencrypted volumes.',
  ARRAY['ClearSCADA Database Server', 'Historical Data Storage', 'Configuration Database'],
  ARRAY[]::text[],
  'Enable SQL Server Transparent Data Encryption (TDE) for all ClearSCADA databases. Implement encryption key management with HSM. Enable encrypted backups.',
  'high',
  'in-progress',
  'Marie Dubois (Schneider)',
  NOW() + INTERVAL '60 days',
  'Database encryption verification and backup encryption testing',
  'Schneider providing TDE implementation guide. DEWA IT team coordinating with database administrators.',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '5 days'
);

-- ABB REG670 Findings
INSERT INTO vendor_security_findings (
  id, assessment_id, tenant_id,
  finding_id, finding_title, finding_description, finding_category,
  severity, risk_level, likelihood, impact,
  evidence, affected_components, cve_ids,
  remediation_recommendation, remediation_priority, remediation_status,
  remediation_owner, remediation_due_date,
  verification_method, notes, created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'REG670 Protection Relay' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'ABB-FIND-001',
  'Insecure SNMP Configuration',
  'Protection relays configured with SNMPv2c for monitoring. SNMPv2c transmits community strings in clear text, allowing potential eavesdropping and unauthorized access.',
  'network-security',
  'medium',
  'medium',
  'low',
  'medium',
  'SNMP configuration review confirmed SNMPv2c enabled with default community strings on 45 relays.',
  ARRAY['REG670 Relays (All Substations)', 'SNMP Monitoring System'],
  ARRAY[]::text[],
  'Disable SNMPv1 and SNMPv2c. Enable SNMPv3 with authentication and encryption. Use unique credentials per relay. Implement SNMP access control lists.',
  'medium',
  'open',
  'Lars Svensson (ABB)',
  NOW() + INTERVAL '60 days',
  'SNMP configuration audit and traffic analysis',
  'ABB providing SNMPv3 configuration templates. DEWA to update monitoring system for SNMPv3 support.',
  NOW() - INTERVAL '45 days',
  NOW() - INTERVAL '45 days'
);

-- =============================================================================
-- VENDOR CONTACT HISTORY
-- =============================================================================

-- GE Contact History
INSERT INTO vendor_contact_history (
  id, assessment_id, tenant_id,
  contact_date, contact_type, contact_subject, contact_summary,
  internal_participants, vendor_participants,
  action_items, follow_up_required, follow_up_date,
  created_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'Mark VIe Turbine Control System' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NOW() - INTERVAL '55 days',
  'meeting',
  'Security Assessment Kickoff Meeting',
  'Initial meeting to discuss security assessment scope, methodology, and timeline. GE provided overview of Mark VIe security features and certifications. Agreed on assessment schedule and access requirements.',
  ARRAY['Fatima Al Zahra', 'Ahmed Al Mansouri', 'Sarah Al Nuaimi'],
  ARRAY['John Anderson', 'Michael Roberts (GE Security)'],
  ARRAY[
    'GE to provide security documentation and certifications',
    'DEWA to schedule on-site audit for week of Jan 15',
    'GE to arrange access to engineering workstations'
  ],
  TRUE,
  NOW() - INTERVAL '50 days',
  NOW() - INTERVAL '55 days'
),
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'Mark VIe Turbine Control System' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NOW() - INTERVAL '10 days',
  'email',
  'Remediation Plan Discussion',
  'Email exchange regarding remediation timeline for identified findings. GE committed to credential changes within 30 days and firmware upgrade during Q2 maintenance window. Discussed lab testing requirements.',
  ARRAY['Fatima Al Zahra'],
  ARRAY['John Anderson'],
  ARRAY[
    'GE to provide firmware upgrade procedure by Feb 15',
    'DEWA to set up lab environment for testing',
    'Schedule follow-up call for March 1'
  ],
  TRUE,
  NOW() + INTERVAL '20 days',
  NOW() - INTERVAL '10 days'
);

-- Schneider Contact History
INSERT INTO vendor_contact_history (
  id, assessment_id, tenant_id,
  contact_date, contact_type, contact_subject, contact_summary,
  internal_participants, vendor_participants,
  action_items, follow_up_required, follow_up_date,
  created_at
) VALUES
(
  gen_random_uuid(),
  (SELECT id FROM vendor_security_assessments WHERE system_name = 'ClearSCADA' LIMIT 1),
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  NOW() - INTERVAL '25 days',
  'meeting',
  'On-Site Security Audit',
  'Comprehensive on-site audit of ClearSCADA installation. Reviewed system architecture, security configuration, access controls, and logging. Identified database encryption gap. Schneider provided immediate recommendations.',
  ARRAY['Mohammed bin Rashid', 'Ahmed Al Mansouri'],
  ARRAY['Marie Dubois', 'Thomas Mueller (Schneider Security)'],
  ARRAY[
    'Schneider to provide TDE implementation guide',
    'DEWA to assess HSM requirements for key management',
    'Schedule database encryption implementation for Q1 2024'
  ],
  TRUE,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '25 days'
);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify control coverage assessments
-- SELECT COUNT(*) as assessment_count FROM control_coverage_assessments;

-- Verify risk compliance summaries
-- SELECT COUNT(*) as summary_count FROM risk_compliance_summaries;

-- Verify vendor security assessments
-- SELECT COUNT(*) as vendor_assessment_count FROM vendor_security_assessments;

-- Verify vendor findings
-- SELECT COUNT(*) as finding_count FROM vendor_security_findings;

-- Verify compliance standard status
-- SELECT COUNT(*) as standard_count FROM compliance_standard_status;

-- Verify trends data
-- SELECT COUNT(*) as trend_count FROM risk_compliance_trends;

-- Verify vendor contact history
-- SELECT COUNT(*) as contact_count FROM vendor_contact_history;
