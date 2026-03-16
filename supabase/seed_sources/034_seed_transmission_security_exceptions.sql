-- Seed data for transmission security exceptions and waivers
-- Description: Populate security exceptions and waivers for power transmission cybersecurity
-- Requirements: 4.4, 10.4

-- Insert transmission-specific security exceptions
INSERT INTO security_exceptions (
  tenant_id,
  exception_id,
  exception_name,
  exception_type,
  policy_id,
  control_id,
  requirement_id,
  scope,
  applies_to_sites,
  applies_to_zones,
  applies_to_assets,
  requested_by,
  request_date,
  business_justification,
  technical_justification,
  alternative_controls,
  risk_level,
  risk_description,
  risk_mitigation_measures,
  residual_risk_level,
  residual_risk_description,
  status,
  reviewed_by,
  review_date,
  review_comments,
  approved_by,
  approval_date,
  approval_conditions,
  effective_date,
  expiration_date,
  auto_expire,
  extension_allowed,
  max_extensions,
  extensions_used,
  requires_monitoring,
  monitoring_frequency_days,
  last_monitored,
  next_monitoring_date,
  compliance_status,
  compensating_controls_required,
  compensating_controls,
  compensating_controls_implemented,
  compensating_controls_verified,
  notes,
  tags
) VALUES 
-- Legacy Protection Relay Exception
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'EXC-TRANS-001',
  'Legacy Protection Relay IEC 62351 Exception',
  'control-exception',
  null,
  (SELECT id FROM security_controls WHERE control_id = 'TRANS-NS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  'asset',
  ARRAY[(SELECT id FROM sites WHERE name = 'Al Aweer Substation' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1)],
  ARRAY['protection-systems'],
  null, -- Will be populated with specific relay asset IDs
  (SELECT id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-10T10:00:00Z',
  'Legacy protection relays at Al Aweer Substation do not support IEC 62351 security extensions. Replacement scheduled for Q3 2024 but current relays are critical for system protection.',
  'Existing Schneider P543 relays manufactured in 2015 do not have firmware capability for IEC 62351. Hardware replacement required but cannot be performed until planned outage window.',
  'Enhanced network monitoring, dedicated VLAN isolation, and additional physical security controls implemented',
  'medium',
  'Legacy relays communicate using unencrypted IEC 61850 GOOSE messages, potentially vulnerable to man-in-the-middle attacks',
  ARRAY[
    'Isolated VLAN with strict firewall rules',
    'Enhanced physical security at relay panels',
    'Continuous network monitoring with anomaly detection',
    'Regular security assessments and penetration testing'
  ],
  'low',
  'With compensating controls, residual risk reduced to acceptable level until hardware replacement',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-15T14:00:00Z',
  'Exception approved based on strong compensating controls and definitive replacement timeline',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-18T16:00:00Z',
  ARRAY[
    'Hardware replacement must be completed by September 30, 2024',
    'Monthly security monitoring reports required',
    'Any security incidents must trigger immediate review'
  ],
  '2024-01-20T00:00:00Z',
  '2024-09-30T23:59:59Z',
  true,
  true,
  1,
  0,
  true,
  30,
  '2024-01-20T09:00:00Z',
  '2024-02-20T09:00:00Z',
  'compliant',
  true,
  ARRAY[
    'Dedicated VLAN with firewall protection',
    'Enhanced physical access controls',
    'Continuous network monitoring',
    'Monthly security assessments'
  ],
  true,
  true,
  'Exception granted for legacy equipment with strong compensating controls',
  ARRAY['legacy-equipment', 'protection-relays', 'iec-62351', 'temporary']
),

-- Emergency Access Exception
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'EXC-TRANS-002',
  'Emergency SCADA Access Without MFA',
  'policy-exception',
  (SELECT id FROM security_policies WHERE policy_id = 'POL-TRANS-AC-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  null,
  'system',
  null, -- Applies to all sites
  ARRAY['scada-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-05T08:00:00Z',
  'During major grid emergencies, operators may need immediate SCADA access when MFA tokens are unavailable or malfunctioning. Grid stability takes precedence over security controls.',
  'Emergency situations may occur outside normal hours when MFA token support is limited. Backup authentication methods needed for critical system restoration.',
  'Emergency access accounts with strong passwords, immediate logging, and mandatory post-incident review',
  'high',
  'Emergency access without MFA increases risk of unauthorized access during critical periods',
  ARRAY[
    'Emergency access limited to designated senior operators',
    'All emergency access logged and monitored in real-time',
    'Mandatory security review within 4 hours',
    'Emergency access automatically expires after 24 hours'
  ],
  'medium',
  'With strict controls and immediate review, risk is manageable for emergency situations',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-08T11:00:00Z',
  'Exception approved for genuine emergencies with strict monitoring and review requirements',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-10T09:00:00Z',
  ARRAY[
    'Emergency access only for declared grid emergencies',
    'Maximum 3 designated emergency accounts',
    'All usage must be reviewed within 4 hours',
    'Annual review of emergency access procedures'
  ],
  '2024-01-15T00:00:00Z',
  '2025-01-15T00:00:00Z',
  true,
  true,
  2,
  0,
  true,
  7, -- Weekly monitoring due to high risk
  '2024-01-15T10:00:00Z',
  '2024-01-22T10:00:00Z',
  'compliant',
  true,
  ARRAY[
    'Real-time access monitoring and alerting',
    'Mandatory post-incident security review',
    'Emergency access session recording',
    'Immediate notification to security team'
  ],
  true,
  true,
  'Critical exception for grid emergency situations with comprehensive monitoring',
  ARRAY['emergency-access', 'grid-emergency', 'mfa-exception', 'high-risk']
),

-- Vendor Access Waiver
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'WAIV-TRANS-001',
  'Vendor Remote Access Compliance Waiver',
  'compliance-waiver',
  null,
  null,
  (SELECT id FROM compliance_requirements WHERE requirement_id = 'IEC-62443-3-3-SR-2.1' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'system',
  null, -- Applies to all sites
  ARRAY['maintenance-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2023-12-20T14:00:00Z',
  'Critical protection relay firmware updates require vendor remote access using proprietary tools that do not integrate with our RBAC system. Vendor access is essential for system reliability.',
  'Vendor proprietary maintenance tools cannot authenticate through our Active Directory system. Direct relay access required for firmware updates and diagnostics.',
  'Dedicated vendor access network segment with enhanced monitoring and session recording',
  'medium',
  'Vendor access bypasses standard role-based access controls, creating potential for unauthorized actions',
  ARRAY[
    'Vendor access limited to dedicated network segment',
    'All vendor sessions recorded and monitored',
    'Vendor personnel must be escorted by DEWA staff',
    'Access limited to specific maintenance windows'
  ],
  'low',
  'Compensating controls and supervision reduce risk to acceptable levels',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2023-12-28T10:00:00Z',
  'Waiver approved based on operational necessity and strong compensating controls',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-02T13:00:00Z',
  ARRAY[
    'Vendor access only during approved maintenance windows',
    'DEWA staff must supervise all vendor activities',
    'Session recordings must be reviewed within 24 hours',
    'Quarterly review of vendor access procedures'
  ],
  '2024-01-05T00:00:00Z',
  '2024-07-05T00:00:00Z',
  true,
  true,
  1,
  0,
  true,
  14, -- Bi-weekly monitoring
  '2024-01-05T12:00:00Z',
  '2024-01-19T12:00:00Z',
  'compliant',
  true,
  ARRAY[
    'Dedicated vendor network segment',
    'Session recording and monitoring',
    'Mandatory staff supervision',
    'Access time restrictions'
  ],
  true,
  true,
  'Operational necessity waiver with comprehensive oversight controls',
  ARRAY['vendor-access', 'maintenance', 'rbac-waiver', 'supervised']
),

-- Temporary Deviation for System Upgrade
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'DEV-TRANS-001',
  'SCADA System Upgrade Security Deviation',
  'temporary-deviation',
  (SELECT id FROM security_policies WHERE policy_id = 'POL-TRANS-NS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  null,
  'system',
  ARRAY[(SELECT id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1)],
  ARRAY['scada-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-12T16:00:00Z',
  'SCADA system upgrade requires temporary relaxation of network segmentation rules to allow data migration between old and new systems.',
  'System upgrade process requires direct network connectivity between legacy and new SCADA systems for data migration. Standard network segmentation must be temporarily modified.',
  'Enhanced monitoring during migration period with dedicated security personnel oversight',
  'medium',
  'Temporary network configuration changes may create additional attack vectors during migration',
  ARRAY[
    'Migration limited to scheduled maintenance window',
    'Dedicated security monitoring during entire process',
    'Network changes documented and approved',
    'Immediate restoration of segmentation post-migration'
  ],
  'low',
  'Short duration and enhanced monitoring minimize residual risk',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-15T09:00:00Z',
  'Deviation approved for critical system upgrade with enhanced monitoring',
  (SELECT id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-16T11:00:00Z',
  ARRAY[
    'Migration must be completed within 48-hour window',
    'Security team must monitor entire process',
    'Network segmentation must be restored immediately',
    'Post-migration security validation required'
  ],
  '2024-01-20T00:00:00Z',
  '2024-01-22T23:59:59Z',
  true,
  false, -- No extensions allowed for temporary deviation
  0,
  0,
  true,
  1, -- Daily monitoring during deviation period
  '2024-01-20T08:00:00Z',
  '2024-01-21T08:00:00Z',
  'compliant',
  true,
  ARRAY[
    'Continuous security monitoring',
    'Dedicated security personnel oversight',
    'Real-time network traffic analysis',
    'Immediate incident response capability'
  ],
  true,
  true,
  'Short-term deviation for critical system upgrade with intensive monitoring',
  ARRAY['system-upgrade', 'temporary', 'network-segmentation', 'migration']
);

-- Insert additional exceptions with denial_reason support
INSERT INTO security_exceptions (
  tenant_id,
  exception_id,
  exception_name,
  exception_type,
  policy_id,
  control_id,
  requirement_id,
  scope,
  applies_to_sites,
  applies_to_zones,
  applies_to_assets,
  requested_by,
  request_date,
  business_justification,
  technical_justification,
  alternative_controls,
  risk_level,
  risk_description,
  risk_mitigation_measures,
  residual_risk_level,
  residual_risk_description,
  status,
  reviewed_by,
  review_date,
  review_comments,
  approved_by,
  approval_date,
  approval_conditions,
  denial_reason,
  effective_date,
  expiration_date,
  auto_expire,
  extension_allowed,
  max_extensions,
  extensions_used,
  requires_monitoring,
  monitoring_frequency_days,
  last_monitored,
  next_monitoring_date,
  compliance_status,
  compensating_controls_required,
  compensating_controls,
  compensating_controls_implemented,
  compensating_controls_verified,
  notes,
  tags
) VALUES 
-- Pending Exception: Firewall Bypass for Testing
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'EXC-TRANS-003',
  'Temporary Firewall Bypass for New Relay Testing',
  'temporary-deviation',
  null,
  (SELECT id FROM security_controls WHERE control_id = 'TRANS-NS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  'site',
  ARRAY[(SELECT id FROM sites WHERE name = 'Jebel Ali Substation' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1)],
  ARRAY['scada-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'sarah.alnuaimi' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-02-14T10:00:00Z',
  'Testing new substation automation gateway requires temporary direct access from vendor cloud to test lab VLAN.',
  'Gateway firewall rules currently block the specific MQTT ports needed for vendor telemetry during the validation phase.',
  'Dedicated test VLAN, source IP filtering, and temporary credentials',
  'medium',
  'Temporary exposure of test lab network to external cloud services',
  ARRAY['Restricted to test lab VLAN only', 'Active monitoring by security team', 'Account disabled after 8 hours'],
  'low',
  'Controlled test environment minimizes potential impact on production systems',
  'pending',
  null, null, null, null, null, null, null, null, null,
  false, false, 0, 0, false, 1, null, null, 'unknown',
  true, ARRAY['VLAN isolation', 'IP filtering'], false, false,
  'Awaiting management approval for test window',
  ARRAY['testing', 'firewall', 'vendor-access']
),
-- Expired Exception: Legacy OS Upgrade
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'EXC-TRANS-004',
  'Legacy Windows 7 HMI Exception',
  'control-exception',
  null,
  (SELECT id FROM security_controls WHERE control_id = 'TRANS-NS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  'asset',
  ARRAY[(SELECT id FROM sites WHERE name = 'Dubai Main Substation' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1)],
  ARRAY['scada-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'ahmed.almansouri' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2023-01-05T08:00:00Z',
  'Engineering terminal at Dubai Main runs legacy protection software only compatible with Windows 7.',
  'Software vendor has no update path. System is standalone but connected to scada network for data collection.',
  'Network isolation via air-gap or dedicated firewall',
  'high',
  'Unpatched operating system vulnerable to known exploits if network segmentation fails',
  ARRAY['Antivirus with legacy support', 'USB port blocking', 'Strict network ACLs'],
  'medium',
  'Risk mitigated through extreme segmentation but OS remains vulnerable',
  'expired',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2023-01-10T11:00:00Z',
  'Approved for one year. Upgrade to Windows 10 LTSC required by Jan 2024.',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2023-01-12T09:00:00Z',
  ARRAY['Upgrade required by expiration date', 'No internet access allowed'],
  null, -- denial_reason
  '2023-01-15T00:00:00Z',
  '2024-01-15T00:00:00Z',
  true, false, 0, 0, true, 30, '2023-12-15T10:00:00Z', '2024-01-14T10:00:00Z', 'non-compliant',
  true, ARRAY['Air-gap compliance'], true, true,
  'Exception has expired. System must be upgraded or disconnected immediately.',
  ARRAY['legacy-os', 'windows-7', 'expired']
),
-- Denied Exception: Administrator Password Sharing
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'EXC-TRANS-005',
  'Shared Admin Account for Maintenance Team',
  'policy-exception',
  (SELECT id FROM security_policies WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  null,
  null,
  'system',
  null,
  ARRAY['scada-network', 'corporate-network'],
  null,
  (SELECT id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-02-10T14:00:00Z',
  'Maintenance team requests a shared administrator account to simplify password management during multi-shift outages.',
  'Multiple technicians need access to the same systems. Individual accounts perceived as overly complex for relay testing.',
  'None proposed',
  'critical',
  'Complete loss of accountability. Password compromise would affect all systems.',
  null,
  'critical',
  'Unacceptable risk to critical national infrastructure',
  'denied',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-02-11T09:00:00Z',
  'Direct violation of core security principles (non-repudiation) and NERC CIP requirements. Request denied.',
  null, null,
  null, -- approval_conditions
  'Management must use a privileged access management (PAM) solution instead.', -- denial_reason
  null, null, false, false, 0, 0, false, 0, null, null, 'non-compliant',
  false, null, false, false,
  'Security policy violation. Request rejected.',
  ARRAY['policy-violation', 'account-sharing', 'denied']
),
-- Policy Waiver: Temporary Physical Security Bypass
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'WAIV-TRANS-002',
  'Substation Construction Physical Security Waiver',
  'compliance-waiver',
  null,
  null,
  (SELECT id FROM compliance_requirements WHERE requirement_id = 'CIP-002-5.1-R1' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'site',
  ARRAY[(SELECT id FROM sites WHERE name = 'Silicon Oasis Switching Station' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1)],
  ARRAY['field-devices'],
  null,
  (SELECT id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-20T11:00:00Z',
  'Construction work at Silicon Oasis substation requires disabling some perimeter intrusion sensors temporarily.',
  'Work activities (drilling, vibration) trigger false alarms in seismic and infrared sensors.',
  'Increased 24/7 physical security patrol and temporary floodlighting',
  'medium',
  'Reduced detection capability for unauthorized perimeter breach',
  ARRAY['Security guards stationed at active zones', 'Temporary fence installation'],
  'low',
  'Physical presence compensates for disabled electronic sensors',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-22T14:00:00Z',
  'Approved for construction duration only. Guards must maintain logbooks.',
  (SELECT id FROM security_users WHERE username = 'mohammed.binrashid' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-23T10:00:00Z',
  ARRAY['Perimeter must be restored by end of shift each day', 'Guards must have radio contact with SOC'],
  null, -- denial_reason
  '2024-01-25T00:00:00Z',
  '2024-03-25T23:59:59Z',
  true, true, 1, 0, true, 7, '2024-02-10T12:00:00Z', '2024-02-17T12:00:00Z', 'compliant',
  true, ARRAY['Guard patrol logs'], true, true,
  'Construction ongoing. Physical security measures verified weekly.',
  ARRAY['physical-security', 'construction', 'approved']
);

-- Insert exception reviews
INSERT INTO exception_reviews (
  tenant_id,
  exception_id,
  review_date,
  review_type,
  reviewer_id,
  reviewer_role,
  findings,
  risk_assessment_current,
  compensating_controls_effective,
  compliance_maintained,
  recommendation,
  recommendation_details,
  action_items,
  follow_up_required,
  follow_up_date,
  notes
) VALUES
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM security_exceptions WHERE exception_id = 'EXC-TRANS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-20T09:00:00Z',
  'initial',
  (SELECT id FROM security_users WHERE username = 'sarah.alnuaimi' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'Security Analyst',
  'Compensating controls are functioning effectively. Network monitoring shows no anomalous activity. Physical security enhancements verified.',
  true,
  true,
  true,
  'continue',
  'Exception controls are working well. Recommend continuing with current monitoring approach.',
  ARRAY['Verify hardware replacement timeline', 'Review monthly monitoring reports'],
  true,
  '2024-02-20T09:00:00Z',
  'Initial review shows strong control implementation. Hardware replacement on track.'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM security_exceptions WHERE exception_id = 'EXC-TRANS-002' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-15T10:00:00Z',
  'initial',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'Security Manager',
  'Emergency access procedures documented and tested. No unauthorized usage detected. Monitoring systems functioning correctly.',
  true,
  true,
  true,
  'continue',
  'Exception is well-controlled with appropriate monitoring. Continue current approach.',
  ARRAY['Test emergency access procedures quarterly', 'Review access logs weekly'],
  true,
  '2024-01-22T10:00:00Z',
  'Emergency access controls properly implemented. Regular testing recommended.'
);

-- Insert extension request (for the legacy relay exception)
INSERT INTO exception_extensions (
  tenant_id,
  exception_id,
  requested_by,
  request_date,
  extension_reason,
  requested_new_expiration,
  status,
  approved_by,
  approval_date,
  approved_new_expiration,
  approval_conditions,
  notes
) VALUES
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM security_exceptions WHERE exception_id = 'EXC-TRANS-001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  (SELECT id FROM security_users WHERE username = 'omar.alfalasi' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-08-15T14:00:00Z',
  'Hardware delivery delayed by 6 weeks due to supply chain issues. Vendor confirms new delivery date of November 15, 2024.',
  '2024-11-30T23:59:59Z',
  'approved',
  (SELECT id FROM security_users WHERE username = 'fatima.alzahra' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-08-20T11:00:00Z',
  '2024-11-30T23:59:59Z',
  ARRAY[
    'Enhanced monitoring during extension period',
    'Weekly status reports on hardware delivery',
    'No further extensions permitted'
  ],
  'Extension approved due to supply chain delays beyond DEWA control. This is the final extension.'
);

-- Insert sample exception incident
INSERT INTO exception_incidents (
  tenant_id,
  exception_id,
  incident_date,
  incident_type,
  incident_description,
  severity,
  impact_description,
  affected_systems,
  response_actions,
  remediation_required,
  remediation_plan,
  remediation_status,
  exception_review_triggered,
  exception_revoked,
  notes
) VALUES
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM security_exceptions WHERE exception_id = 'EXC-TRANS-002' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  '2024-01-18T02:30:00Z',
  'security-event',
  'Emergency SCADA access used during grid disturbance event. Access properly authorized and documented.',
  'low',
  'No security impact. Emergency access used appropriately during legitimate grid emergency.',
  ARRAY['SCADA system', 'Emergency access account'],
  ARRAY[
    'Emergency access logged and monitored',
    'Security team notified immediately',
    'Post-incident review completed within 4 hours',
    'Access session recorded and reviewed'
  ],
  false,
  null,
  'completed',
  true,
  false,
  'Proper use of emergency access exception during legitimate grid emergency. All procedures followed correctly.'
);

-- NEW: Bulk Security Exceptions Generation
DO $$
DECLARE
    v_tenant_id UUID;
    v_user_id UUID;
    v_reviewer_id UUID;
    v_approver_id UUID;
    v_site_id UUID;
    v_target_id UUID;
    v_target_type TEXT;
    v_status TEXT;
    v_risk TEXT;
    v_counter INT;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
    SELECT id INTO v_user_id FROM security_users WHERE username = 'omar.alfalasi' LIMIT 1;
    SELECT id INTO v_reviewer_id FROM security_users WHERE username = 'fatima.alzahra' LIMIT 1;
    SELECT id INTO v_approver_id FROM security_users WHERE username = 'fatima.alzahra' LIMIT 1;

    FOR v_counter IN 1..25 LOOP
        -- Randomly select target type and ID
        v_target_type := (ARRAY['control-exception', 'policy-exception', 'compliance-waiver'])[floor(random() * 3 + 1)];
        
        v_target_id := NULL;
        IF v_target_type = 'control-exception' THEN
            SELECT id INTO v_target_id FROM security_controls WHERE tenant_id = v_tenant_id ORDER BY random() LIMIT 1;
        ELSIF v_target_type = 'policy-exception' THEN
            SELECT id INTO v_target_id FROM security_policies WHERE tenant_id = v_tenant_id ORDER BY random() LIMIT 1;
        ELSE 
            SELECT id INTO v_target_id FROM compliance_requirements WHERE tenant_id = v_tenant_id ORDER BY random() LIMIT 1;
        END IF;

        -- Random status and risk
        v_status := (ARRAY['pending', 'under-review', 'approved', 'denied', 'expired', 'active'])[floor(random() * 6 + 1)];
        v_risk := (ARRAY['low', 'medium', 'high', 'critical'])[floor(random() * 4 + 1)];

        -- Only insert if we found a valid target
        IF v_target_id IS NOT NULL THEN
            INSERT INTO security_exceptions (
                tenant_id, exception_id, exception_name, exception_type,
                control_id, policy_id, requirement_id,
                scope, requested_by, request_date,
                business_justification, risk_level, status,
                reviewed_by, review_date, approved_by, approval_date,
                expiration_date, denial_reason, risk_description
            ) VALUES (
                v_tenant_id,
                'EXC-AUTO-' || v_counter,
                'Automated Exception ' || v_counter,
                v_target_type::exception_type, -- Cast to enum
                CASE WHEN v_target_type = 'control-exception' THEN v_target_id ELSE NULL END,
                CASE WHEN v_target_type = 'policy-exception' THEN v_target_id ELSE NULL END,
                CASE WHEN v_target_type = 'compliance-waiver' THEN v_target_id ELSE NULL END,
                'system',
                v_user_id,
                NOW() - (random() * 90 || ' days')::INTERVAL,
                'Operational constraint requiring temporary deviation for system upgrade/maintenance.',
                v_risk::risk_level, -- Cast to enum
                v_status::exception_status, -- Cast to enum
                CASE WHEN v_status IN ('approved', 'denied', 'active', 'expired') THEN v_reviewer_id ELSE NULL END,
                CASE WHEN v_status IN ('approved', 'denied', 'active', 'expired') THEN NOW() - (random() * 10 || ' days')::INTERVAL ELSE NULL END,
                CASE WHEN v_status IN ('approved', 'active', 'expired') THEN v_approver_id ELSE NULL END,
                CASE WHEN v_status IN ('approved', 'active', 'expired') THEN NOW() - (random() * 5 || ' days')::INTERVAL ELSE NULL END,
                NOW() + (random() * 180 || ' days')::INTERVAL,
                CASE WHEN v_status = 'denied' THEN 'Risk level too high for proposed business justification.' ELSE NULL END,
                'Automated risk assessment: Potential exposure of ' || v_target_type || ' during maintenance window.'
            );
        END IF;
    END LOOP;
END $$;