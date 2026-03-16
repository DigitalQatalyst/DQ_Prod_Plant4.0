-- Seed data for transmission compliance standards
-- Description: Populate compliance standards for power transmission cybersecurity
-- Requirements: 4.1, 10.4

-- Insert transmission-specific compliance standards
INSERT INTO compliance_standards (
  tenant_id,
  name,
  full_name,
  version,
  category,
  description,
  status,
  compliance_score,
  total_requirements,
  met_requirements,
  partial_requirements,
  unmet_requirements,
  not_applicable_requirements,
  last_assessment_date,
  next_audit_date,
  audit_frequency_months,
  applies_to_zones,
  mandatory,
  regulatory_body,
  standard_url,
  documentation_links,
  notes
) VALUES 
-- IEC 62443 for Power Transmission
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'IEC 62443',
  'Industrial Automation and Control Systems Security',
  '2018',
  'cybersecurity',
  'International standard for cybersecurity of industrial automation and control systems, specifically applied to power transmission infrastructure including substations, SCADA systems, and protection relays.',
  'in-progress',
  75.50,
  24,
  18,
  4,
  2,
  0,
  '2024-01-15T10:00:00Z',
  '2024-07-15T10:00:00Z',
  12,
  ARRAY['substation-control', 'protection-systems', 'scada-network', 'field-devices'],
  true,
  'IEC (International Electrotechnical Commission)',
  'https://www.iec.ch/dyn/www/f?p=103:23:0::::FSP_ORG_ID:1316',
  ARRAY['https://webstore.iec.ch/publication/33615', 'https://www.iec.ch/cyber-security'],
  'Applied specifically to power transmission infrastructure with focus on IEC 61850 communications and protection systems'
),

-- NERC CIP for Bulk Electric System
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'NERC CIP',
  'Critical Infrastructure Protection Standards',
  'Version 5',
  'cybersecurity',
  'North American Electric Reliability Corporation Critical Infrastructure Protection standards for bulk electric system cybersecurity, covering transmission substations and control centers.',
  'compliant',
  92.30,
  45,
  41,
  2,
  2,
  0,
  '2023-11-20T14:30:00Z',
  '2024-05-20T14:30:00Z',
  6,
  ARRAY['substation-control', 'scada-network', 'corporate-network'],
  true,
  'NERC (North American Electric Reliability Corporation)',
  'https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx',
  ARRAY['https://www.nerc.com/pa/Stand/Reliability%20Standards/CIP-002-5.1.pdf', 'https://www.nerc.com/pa/Stand/Reliability%20Standards/CIP-007-6.pdf'],
  'Mandatory for bulk electric system assets including transmission substations above 100kV'
),

-- IEEE 1686 for Substation IEDs
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'IEEE 1686',
  'Standard for Intelligent Electronic Devices Cyber Security Capabilities',
  '2013',
  'cybersecurity',
  'IEEE standard defining cyber security capabilities for intelligent electronic devices used in electric power systems, particularly protection relays and substation automation systems.',
  'in-progress',
  68.75,
  16,
  11,
  3,
  2,
  0,
  '2024-02-10T09:15:00Z',
  '2024-08-10T09:15:00Z',
  12,
  ARRAY['substation-control', 'protection-systems', 'field-devices'],
  true,
  'IEEE (Institute of Electrical and Electronics Engineers)',
  'https://standards.ieee.org/ieee/1686/5266/',
  ARRAY['https://ieeexplore.ieee.org/document/6679950'],
  'Focused on protection relays, meters, and other intelligent electronic devices in transmission substations'
),

-- ISO 27001 for Information Security Management
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'ISO 27001',
  'Information Security Management Systems',
  '2022',
  'cybersecurity',
  'International standard for information security management systems, applied to power transmission operations including SCADA networks, control centers, and corporate IT systems.',
  'in-progress',
  81.25,
  114,
  92,
  15,
  7,
  0,
  '2023-12-05T16:45:00Z',
  '2024-06-05T16:45:00Z',
  12,
  ARRAY['scada-network', 'corporate-network', 'maintenance-network'],
  false,
  'ISO (International Organization for Standardization)',
  'https://www.iso.org/isoiec-27001-information-security.html',
  ARRAY['https://www.iso.org/standard/27001', 'https://www.iso.org/standard/75652.html'],
  'Comprehensive information security framework covering all aspects of transmission system cybersecurity'
),

-- NIST Cybersecurity Framework
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'NIST CSF',
  'Cybersecurity Framework for Critical Infrastructure',
  '2.0',
  'cybersecurity',
  'NIST Cybersecurity Framework providing a policy framework of computer security guidance for critical infrastructure sectors including electric power transmission.',
  'in-progress',
  73.80,
  108,
  79,
  18,
  11,
  0,
  '2024-01-30T11:20:00Z',
  '2024-07-30T11:20:00Z',
  12,
  ARRAY['substation-control', 'protection-systems', 'scada-network', 'corporate-network'],
  false,
  'NIST (National Institute of Standards and Technology)',
  'https://www.nist.gov/cyberframework',
  ARRAY['https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.04162018.pdf', 'https://www.nist.gov/cyberframework/framework'],
  'Voluntary framework widely adopted by electric utilities for cybersecurity risk management'
),
-- ADHICS 1.0 (Abu Dhabi Health Information and Cyber Security)
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'ADHICS',
  'Abu Dhabi Health Information and Cyber Security Standard',
  '1.0',
  'regulatory',
  'Security standard for health information systems, applicable to medical facilities and occupational health centers within major transmission hubs and regional centers.',
  'in-progress',
  62.10,
  85,
  42,
  21,
  22,
  0,
  '2024-02-05T09:00:00Z',
  '2024-08-05T09:00:00Z',
  12,
  ARRAY['corporate-network', 'medical-network'],
  true,
  'Department of Health - Abu Dhabi',
  'https://www.doh.gov.ae/en/programs-initiatives/adhics',
  ARRAY['https://www.doh.gov.ae/-/media/7D5E8B1A1E1E4C7B8E8E8E8E8E8E8E8E.ashx'],
  'Mandatory for health facilities within DEWA transmission sites'
),
-- NESA IAS 1.0 (National Electronic Security Authority)
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'NESA IAS',
  'Information Assurance Standards',
  '1.0',
  'regulatory',
  'UAE national standard for information assurance, mandatory for all critical national infrastructure entities in the UAE including power transmission.',
  'compliant',
  94.50,
  188,
  175,
  8,
  5,
  0,
  '2023-10-30T11:00:00Z',
  '2024-04-30T11:00:00Z',
  6,
  ARRAY['scada-network', 'protection-systems', 'corporate-network', 'field-devices'],
  true,
  'NESA (National Electronic Security Authority)',
  'https://www.nesa.gov.ae/',
  ARRAY['https://www.nesa.gov.ae/standards/ias-v1.pdf'],
  'Top-level mandatory standard for UAE critical infrastructure'
),
-- CITC Cybersecurity Framework
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  'CITC Cybersecurity',
  'Cybersecurity Framework for Telecommunications',
  '1.0',
  'regulatory',
  'Cybersecurity requirements for telecommunications infrastructure used within the power transmission grid for SCADA and protection signaling.',
  'in-progress',
  78.40,
  64,
  45,
  12,
  7,
  0,
  '2024-01-25T14:00:00Z',
  '2024-07-25T14:00:00Z',
  12,
  ARRAY['scada-network', 'communication-links'],
  true,
  'CITC (Communications and Information Technology Commission)',
  'https://www.citc.gov.sa/en/Pages/default.aspx',
  ARRAY['https://www.citc.gov.sa/en/RulesandSystems/RegulatoryFrameworks/Pages/Cybersecurity.aspx'],
  'Applicable to OPGW and microwave communication systems'
);

-- Insert sample compliance requirements for IEC 62443
INSERT INTO compliance_requirements (
  tenant_id,
  standard_id,
  requirement_id,
  requirement_name,
  requirement_description,
  requirement_section,
  status,
  implementation_percentage,
  priority,
  risk_if_not_met,
  implementation_approach,
  responsible_party,
  target_completion_date,
  evidence_required,
  evidence_provided,
  validation_method,
  last_validated,
  validated_by,
  gap_description,
  remediation_plan,
  remediation_status,
  notes
) VALUES
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'IEC-62443-3-3-SR-1.1',
  'Identification and Authentication Control',
  'The control system shall provide the capability to identify and authenticate all users (humans, software processes, or devices) before allowing access to the control system.',
  '3-3 SR 1.1',
  'compliant',
  100.00,
  'critical',
  'critical',
  'Multi-factor authentication implemented for all transmission SCADA systems and protection relay access',
  'Cybersecurity Team',
  '2023-12-31T23:59:59Z',
  ARRAY['MFA configuration documentation', 'User access logs', 'Authentication policy'],
  ARRAY['MFA deployment guide', 'Access control matrix', 'Authentication audit logs'],
  'Automated testing and manual review',
  '2024-01-15T10:00:00Z',
  'Security Auditor',
  null,
  null,
  'completed',
  'Successfully implemented across all transmission substations'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'IEC-62443-3-3-SR-2.1',
  'Authorization Enforcement',
  'The control system shall enforce approved authorizations for logical access to information and system resources.',
  '3-3 SR 2.1',
  'in-progress',
  75.00,
  'high',
  'high',
  'Role-based access control implementation for transmission operations',
  'Operations Team',
  '2024-06-30T23:59:59Z',
  ARRAY['RBAC policy document', 'Role definitions', 'Access approval workflows'],
  ARRAY['Draft RBAC policy', 'Preliminary role matrix'],
  'Policy review and access testing',
  null,
  null,
  'Need to complete role definitions for maintenance personnel',
  'Finalize maintenance role definitions and implement approval workflows',
  'in-progress',
  'Phase 1 complete for operators and engineers, Phase 2 pending for maintenance roles'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'IEC 62443' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'IEC-62443-3-3-SR-3.1',
  'Communication Integrity',
  'The control system shall protect the integrity of transmitted information.',
  '3-3 SR 3.1',
  'non-compliant',
  25.00,
  'critical',
  'critical',
  'Implement encryption for IEC 61850 GOOSE and MMS communications',
  'Engineering Team',
  '2024-09-30T23:59:59Z',
  ARRAY['Encryption implementation plan', 'IEC 61850 security configuration', 'Communication integrity tests'],
  ARRAY['Initial security assessment'],
  'Communication protocol analysis and penetration testing',
  null,
  null,
  'IEC 61850 communications not encrypted, GOOSE messages in plaintext',
  'Deploy IEC 62351 security extensions for encrypted communications',
  'not-started',
  'Critical gap requiring immediate attention for transmission protection systems'
),
-- NERC CIP Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NERC CIP' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CIP-002-5.1-R1',
  'BES Cyber Asset Identification',
  'Identify and categorize BES Cyber Assets for high, medium, and low impact systems.',
  'CIP-002-5.1',
  'compliant',
  100.00,
  'critical',
  'critical',
  'Manual asset inventory and categorization based on voltage levels and grid impact',
  'Grid Planning Team',
  '2023-10-31T23:59:59Z',
  ARRAY['Asset inventory report', 'Categorization methodology'],
  ARRAY['BES Asset List 2023', 'Impact Assessment v3.0'],
  'Inventory audit',
  '2023-11-20T14:30:00Z',
  'Compliance Officer',
  null, null, 'completed', null
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NERC CIP' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CIP-005-6-R1',
  'Electronic Security Perimeter',
  'Protect BES Cyber Assets within an Electronic Security Perimeter (ESP).',
  'CIP-005-6',
  'in-progress',
  85.00,
  'critical',
  'critical',
  'Firewall segmentation and intrusion detection at all substation boundaries',
  'Network Team',
  '2024-05-31T23:59:59Z',
  ARRAY['Firewall rulesets', 'Network diagrams', 'Access logs'],
  ARRAY['Core firewall rules', 'Substation network map'],
  'Network scan and configuration review',
  null, null,
  'Some smaller substations awaiting firewall hardware upgrades',
  'Accelerate hardware deployment for Phase 2 substations',
  'in-progress', null
),
-- NIST CSF Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NIST CSF' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NIST-ID.AM-1',
  'Physical Asset Inventory',
  'Physical devices and systems within the organization are inventoried.',
  'Identify (ID)',
  'compliant',
  100.00,
  'high',
  'high',
  'RFID tagging and centralized CMDB for all transmission assets',
  'Asset Management Team',
  '2023-12-31T23:59:59Z',
  ARRAY['CMDB export', 'RFID scanning protocols'],
  ARRAY['Transmission CMDB Snapshot', 'Hardware inventory Q4'],
  'CMDB audit',
  '2024-01-30T11:20:00Z',
  'Asset Lead',
  null, null, 'completed', null
),
-- NESA IAS Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-IAS-M1',
  'Risk Management Framework',
  'Establish and maintain a formal information assurance risk management framework.',
  'Management (M)',
  'compliant',
  100.00,
  'critical',
  'critical',
  'Implementation of OCTAVE Allegro methodology for transmission risk assessment',
  'Risk Management Team',
  '2023-09-30T23:59:59Z',
  ARRAY['Risk Management Policy', 'Risk Register'],
  ARRAY['DEWA IAS Framework v2', 'Corporate Risk Register'],
  'Policy review',
  '2023-10-30T11:00:00Z',
  'NESA Compliance Audit',
  null, null, 'completed', null
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-IAS-T1',
  'Network Segmentation',
  'Implement appropriate network segmentation to protect critical systems.',
  'Technical (T)',
  'in-progress',
  90.00,
  'high',
  'high',
  'Zone and conduit model based on ISA/IEC 62443',
  'Security Engineering',
  '2024-03-31T23:59:59Z',
  ARRAY['Segmentation strategy', 'VLAN schedule'],
  ARRAY['Micro-segmentation plan'],
  'Penetration testing',
  null, null,
  'Finalizing segmentation between protection relay and SCADA zones',
  'Deploy Layer 3 industrial switches with ACLs',
  'in-progress', null
),
-- ADHICS Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-SEC-1',
  'Protection of Health Data',
  'Implement controls to ensure the confidentiality and integrity of health information.',
  'Section 1',
  'non-compliant',
  15.00,
  'high',
  'critical',
  'Employee health data encryption and access control',
  'HR Security',
  '2024-12-31T23:59:59Z',
  ARRAY['Encryption certificates', 'Access logs'],
  ARRAY['Initial scoping document'],
  'Security assessment',
  null, null,
  'Health data in regional centers is currently stored in unencrypted legacy DBs',
  'Migrate medical records to Oracle TDE encrypted database',
  'not-started', null
),
-- CITC Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-COMM-1',
  'Link Encryption',
  'Wireless and leased communication links must utilize approved encryption standards.',
  'Communications',
  'in-progress',
  60.00,
  'medium',
  'medium',
  'IPsec VPN and MACsec for OPGW and microwave links',
  'Comms Team',
  '2024-06-30T23:59:59Z',
  ARRAY['IPsec configuration', 'Key rotation policy'],
  ARRAY['VPN tunnel metrics'],
  'Traffic analysis',
  null, null,
  'Microwave links between substations require radio encryption firmware upgrades',
  'Roll out AES-256 firmware to all Ceragon microwave radios',
  'in-progress', null
),
-- ISO 27001 Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ISO 27001' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ISO-27001-A.8.1.1',
  'Inventory of Assets',
  'Information, other assets associated with information and information processing facilities shall be identified.',
  'Annex A.8',
  'compliant',
  100.00,
  'medium',
  'medium',
  'Enterprise Asset Management (EAM) system integrated with security tools',
  'IT Operations',
  '2023-11-30T23:59:59Z',
  ARRAY['Asset list', 'Owner assignment'],
  ARRAY['ISO Asset Inventory 2023'],
  'Audit',
  '2023-12-05T16:45:00Z',
  'ISO Lead Auditor',
  null, null, 'completed', null
);

-- NEW: Bulk Requirements for ADHICS, NESA, and CITC
INSERT INTO compliance_requirements (
  tenant_id, standard_id, requirement_id, requirement_name, requirement_description, requirement_section, status, implementation_percentage, priority, risk_if_not_met, implementation_approach, responsible_party, target_completion_date, evidence_required, validation_method, notes
)
VALUES
-- ADHICS Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-P1-3.1', 'Health Data Encryption', 'All health data must be encrypted at rest and in transit.', '3.1', 'in-progress', 60.0, 'high', 'high', 'Deploy BitLocker on all clinic workstations', 'IT Security', '2024-06-01T00:00:00Z', ARRAY['Encryption Config', 'Audit Logs'], 'Automated Scan', 'Pending older workstations'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-P1-4.2', 'Patient Consent Management', 'Systems must capture and store patient consent for data processing.', '4.2', 'compliant', 100.0, 'critical', 'high', 'Implemented in EMR module', 'Clinic Admin', '2023-12-01T00:00:00Z', ARRAY['Consent Forms', 'System Screenshots'], 'Manual Review', 'Fully verified'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-P2-1.5', 'Access Control logs', 'Maintain logs of all access to health records for 5 years.', '1.5', 'non-compliant', 20.0, 'medium', 'medium', 'Configure SIEM retention for clinic subnet', 'SOC Team', '2024-09-01T00:00:00Z', ARRAY['Log Retention Policy', 'SIEM Config'], 'Audit', 'Storage sizing required'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-P3-2.2', 'Third Party Audits', 'Annual third-party security audits for health systems.', '2.2', 'in-progress', 80.0, 'high', 'medium', 'Contracted with PWC', 'Compliance Manager', '2024-05-01T00:00:00Z', ARRAY['Audit Contract', 'Audit Report'], 'Document Review', 'Scheduled for next month'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-T1-5.1', 'Workstation Locking', 'Auto-lock workstations after 5 minutes of inactivity.', '5.1', 'compliant', 100.0, 'medium', 'low', 'GPO Policy enforced', 'IT Ops', '2023-01-01T00:00:00Z', ARRAY['GPO Report'], 'Automated Check', 'Enforced globally'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-T2-6.3', 'Orphaned Account Removal', 'Remove accounts of terminated employees within 24 hours.', '6.3', 'in-progress', 50.0, 'high', 'high', 'HR-IT Integration automation', 'IAM Team', '2024-07-01T00:00:00Z', ARRAY['HR Process Doc', 'Ticket Logs'], 'Process Audit', 'Manual process currently'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'ADHICS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'ADHICS-T3-1.1', 'Network Segmentation', 'Isolate medical devices from corporate network.', '1.1', 'compliant', 100.0, 'critical', 'critical', 'VLAN 105 implemented', 'Network Team', '2023-06-01T00:00:00Z', ARRAY['Network Diagram', 'Switch Config'], 'Penetration Test', 'Verified by recent test'
),

-- NESA IAS Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-M1.1', 'Information Security Policy', 'Establish and maintain an information security policy.', 'M1.1', 'compliant', 100.0, 'medium', 'high', 'Corporate Policy v4.0 published', 'CISO', '2022-01-01T00:00:00Z', ARRAY['Policy Document'], 'Document Review', 'Annual review complete'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-M2.3', 'Risk Assessment', 'Conduct annual risk assessments for critical assets.', 'M2.3', 'in-progress', 90.0, 'critical', 'critical', '2024 Assessment underway', 'Risk Manager', '2024-12-31T00:00:00Z', ARRAY['Risk Register', 'Assessment Report'], 'Meeting Minutes', 'Draft report under review'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-T1.2', 'Asset Inventory', 'Maintain an up-to-date inventory of all information assets.', 'T1.2', 'in-progress', 75.0, 'high', 'medium', 'Deploying Claroty for OT discovery', 'OT Security', '2024-08-01T00:00:00Z', ARRAY['Asset Inventory List'], 'Automated Scan', 'IT complete, OT pending'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-T2.1', 'Cryptography', 'Use approved cryptographic algorithms for data protection.', 'T2.1', 'compliant', 100.0, 'high', 'high', 'AES-256 standard enforced', 'Architecture Board', '2023-03-01T00:00:00Z', ARRAY['Encryption Standards', 'Config Audits'], 'Audit', null
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-T3.4', 'Vulnerability Management', 'Scan and patch systems regularly.', 'T3.4', 'non-compliant', 40.0, 'critical', 'critical', 'Patching cycle implementation', 'Ops Team', '2024-10-01T00:00:00Z', ARRAY['Scan Reports', 'Patch Logs'], 'Vulnerability Scan', 'Legacy systems challenging'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-T4.1', 'Physical Entry Controls', 'Secure areas must be protected by appropriate entry controls.', 'T4.1', 'compliant', 100.0, 'medium', 'medium', 'Biometric access at data centers', 'Physical Security', '2022-06-01T00:00:00Z', ARRAY['Access Logs', 'CCTV'], 'Physical Inspection', 'Maintained by FM'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'NESA IAS' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'NESA-O1.1', 'Incident Management', 'Establish incident response procedures.', 'O1.1', 'in-progress', 85.0, 'high', 'critical', 'Playbook development', 'SOC Lead', '2024-05-01T00:00:00Z', ARRAY['IR Plan', 'Drill Reports'], 'Drill Execution', 'Tabletop exercise planned'
),

-- CITC Requirements
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-CS-001', 'Data Sovereignty', 'All subscriber data must remain within the kingdom/country.', '1.0', 'compliant', 100.0, 'critical', 'critical', 'Local hosting only', 'Legal/Compliance', '2021-01-01T00:00:00Z', ARRAY['Hosting Contracts'], 'Legal Review', 'Verified'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-CS-002', 'Communication Encryption', 'Encrypt all critical communication links.', '2.1', 'non-compliant', 30.0, 'high', 'critical', 'Upgrade microwave links to support AES', 'Telecom Engineering', '2024-11-01T00:00:00Z', ARRAY['Link Configs'], 'Traffic Analysis', 'Old hardware limitation'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-CS-003', 'DDoS Protection', 'Implement anti-DDoS measures for external facing interfaces.', '3.5', 'compliant', 100.0, 'high', 'high', 'ISP Level scrubbing + Edge protection', 'Network Security', '2023-08-01T00:00:00Z', ARRAY['Service Agreement', 'Attack Reports'], 'External Test', 'Tested quarterly'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-CS-004', 'Supply Chain Security', 'Vet all telecom equipment suppliers.', '4.1', 'in-progress', 60.0, 'medium', 'high', 'New procurement policy', 'Procurement', '2024-04-01T00:00:00Z', ARRAY['Vendor Questionnaires'], 'Process Audit', 'Ongoing integration'
),
(
  (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1),
  (SELECT id FROM compliance_standards WHERE name = 'CITC Cybersecurity' AND tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1) LIMIT 1),
  'CITC-CS-005', 'Critical System Redundancy', 'Ensure N+1 redundancy for core switching.', '5.2', 'compliant', 100.0, 'high', 'critical', 'Dual core switches at all hubs', 'Telecom Ops', '2022-12-01T00:00:00Z', ARRAY['Network Topology', 'Failover Logs'], 'Failover Test', 'Annual test successful'
);

-- Update compliance scores based on requirements
UPDATE compliance_standards 
SET 
  compliance_score = (
    SELECT CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'compliant') * 100.0 +
         COUNT(*) FILTER (WHERE status = 'in-progress') * 
         COALESCE(AVG(implementation_percentage) FILTER (WHERE status = 'in-progress'), 0)) /
        COUNT(*) FILTER (WHERE status != 'not-applicable'),
        2
      )
    END
    FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id
  ),
  total_requirements = (
    SELECT COUNT(*) FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id
  ),
  met_requirements = (
    SELECT COUNT(*) FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id 
    AND status = 'compliant'
  ),
  partial_requirements = (
    SELECT COUNT(*) FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id 
    AND status = 'in-progress'
  ),
  unmet_requirements = (
    SELECT COUNT(*) FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id 
    AND status = 'non-compliant'
  ),
  not_applicable_requirements = (
    SELECT COUNT(*) FROM compliance_requirements 
    WHERE standard_id = compliance_standards.id 
    AND status = 'not-applicable'
  )
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1);
