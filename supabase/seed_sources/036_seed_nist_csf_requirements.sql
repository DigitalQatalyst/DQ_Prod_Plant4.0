
-- NIST CSF 2.0 Requirements
DO $$
DECLARE
    v_tenant_id UUID;
    v_nist_standard_id UUID;
BEGIN
    -- Get Tenant ID
    SELECT id INTO v_tenant_id FROM auth.users WHERE email = 'admin@power-transmission.grid' LIMIT 1;
    
    -- Get NIST CSF Standard ID
    SELECT id INTO v_nist_standard_id FROM compliance_standards 
    WHERE tenant_id = v_tenant_id AND name = 'NIST CSF';

    IF v_nist_standard_id IS NOT NULL THEN
        -- Clear existing requirements for this standard to avoid duplicates if re-running
        DELETE FROM compliance_requirements WHERE standard_id = v_nist_standard_id;

        -- GOVERN (GV) - NIST CSF 2.0
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'GV.OC-01', 'Organizational Context', 'The organizational mission, objectives, stakeholders, and legal/regulatory requirements are understood and prioritized.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.OC-02', 'Risk Appropriateness', 'Internal and external stakeholders requirements are understood.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.OC-03', 'Legal and Regulatory', 'Legal, regulatory, and contractual requirements regarding cybersecurity are understood and managed.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.RM-01', 'Risk Management Strategy', 'Risk management objectives are established and agreed to by organizational stakeholders.', 'Govern', 'critical', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'GV.RM-02', 'Risk Tolerance', 'Risk tolerance is determined and clearly expressed.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.RR-01', 'Roles and Responsibilities', 'Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture of cybersecurity risk management.', 'Govern', 'high', 'compliant', 100, false),
        (v_tenant_id, v_nist_standard_id, 'GV.RR-02', 'Cybersecurity Roles', 'Roles and responsibilities for cybersecurity risk management are established and communicated.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.PO-01', 'Policy Establishment', 'Organizational cybersecurity policy is established, communicated, and enforced.', 'Govern', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'GV.PO-02', 'Policy Improvement', 'Organizational cybersecurity policy is improved based on lessons learned.', 'Govern', 'medium', 'in-progress', 70, true),
        (v_tenant_id, v_nist_standard_id, 'GV.OV-01', 'Oversight', 'Cybersecurity risk management strategy outcomes are monitored and reviewed.', 'Govern', 'high', 'in-progress', 80, true);

        -- IDENTIFY (ID)
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'ID.AM-01', 'Asset Inventory', 'Inventories of hardware, software, services, and data are maintained.', 'Identify', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-02', 'Software Inventory', 'Software platforms and applications within the organization are inventoried.', 'Identify', 'high', 'in-progress', 85, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-03', 'Asset Categorization', 'Assets are prioritized based on their classification, criticality, and business value.', 'Identify', 'high', 'compliant', 95, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-04', 'Data Mapping', 'Data flows and processing are mapped.', 'Identify', 'medium', 'in-progress', 60, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-05', 'Resource Prioritization', 'Resources (e.g., hardware, devices, data, time, personnel, and software) are prioritized based on their classification, criticality, and business value.', 'Identify', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-07', 'External Systems', 'External information systems are cataloged.', 'Identify', 'medium', 'in-progress', 50, true),
        (v_tenant_id, v_nist_standard_id, 'ID.AM-08', 'Asset Vulnerabilities', 'Vulnerabilities are identified and documented.', 'Identify', 'critical', 'in-progress', 75, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-01', 'Risk Assessment Vulnerabilities', 'Cybersecurity vulnerabilities are identified and documented.', 'Identify', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-02', 'Threat Intelligence', 'Cyber threat intelligence is received from information sharing forums and sources.', 'Identify', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-03', 'Threat Identification', 'Threats, both internal and external, are identified and documented.', 'Identify', 'high', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-04', 'Risk Impact', 'Potential business impacts and likelihoods are identified.', 'Identify', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-05', 'Risk Response', 'Threats, vulnerabilities, likelihoods, and impacts are used to determine risk.', 'Identify', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'ID.RA-06', 'Risk Responses', 'Risk responses are identified and prioritized.', 'Identify', 'high', 'in-progress', 80, true),
        (v_tenant_id, v_nist_standard_id, 'ID.IM-01', 'Improvements', 'Improvements are identified from risk assessments.', 'Identify', 'medium', 'compliant', 90, true);

        -- PROTECT (PR)
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'PR.AA-01', 'Identity Management', 'Identities and credentials are managed.', 'Protect', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AA-02', 'Access Control', 'Physical and remote access is managed.', 'Protect', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AA-03', 'Access Permissions', 'Access permissions and authorizations are managed.', 'Protect', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AA-04', 'Least Privilege', 'Access permissions are incorporated with the principles of least privilege and separation of duties.', 'Protect', 'high', 'in-progress', 80, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AA-05', 'Authentication', 'Network integrity is protected.', 'Protect', 'critical', 'compliant', 95, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AA-06', 'Identity Proofing', 'Identities are proofed and bound to credentials.', 'Protect', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AT-01', 'Training', 'All users are informed and trained.', 'Protect', 'high', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'PR.AT-02', 'Privileged User Training', 'Privileged users understand their roles and responsibilities.', 'Protect', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.DS-01', 'Data-at-Rest', 'Data-at-rest is protected.', 'Protect', 'high', 'in-progress', 70, true),
        (v_tenant_id, v_nist_standard_id, 'PR.DS-02', 'Data-in-Transit', 'Data-in-transit is protected.', 'Protect', 'high', 'in-progress', 60, true),
        (v_tenant_id, v_nist_standard_id, 'PR.DS-10', 'Data Availability', 'Assets are formally managed throughout removal, transfers, and disposition.', 'Protect', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'PR.DS-11', 'Data Leakage', 'Data is protected against leakage.', 'Protect', 'high', 'non-compliant', 40, true),
        (v_tenant_id, v_nist_standard_id, 'PR.PS-01', 'Platform Security', 'Configuration management practices are applied.', 'Protect', 'high', 'compliant', 95, true),
        (v_tenant_id, v_nist_standard_id, 'PR.PS-02', 'Software Security', 'Software is managed throughout its lifecycle.', 'Protect', 'high', 'in-progress', 75, true),
        (v_tenant_id, v_nist_standard_id, 'PR.PS-03', 'Vulnerability Management', 'Vulnerabilities are managed.', 'Protect', 'critical', 'in-progress', 85, true);

        -- DETECT (DE)
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'DE.AE-02', 'Event Detection', 'Detected events are analyzed to understand attack targets and methods.', 'Detect', 'high', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'DE.AE-03', 'Event Collection', 'Event data are collected and correlated.', 'Detect', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'DE.AE-04', 'Impact Determination', 'Impact of events is determined.', 'Detect', 'medium', 'in-progress', 60, true),
        (v_tenant_id, v_nist_standard_id, 'DE.AE-06', 'Event Thresholds', 'Event detection thresholds are established.', 'Detect', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'DE.CM-01', 'Monitoring', 'The network is monitored to detect potential cybersecurity events.', 'Detect', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'DE.CM-02', 'Physical Monitoring', 'The physical environment is monitored to detect potential cybersecurity events.', 'Detect', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'DE.CM-03', 'User Activity', 'Personnel activity is monitored to detect potential cybersecurity events.', 'Detect', 'high', 'in-progress', 80, true),
        (v_tenant_id, v_nist_standard_id, 'DE.CM-06', 'External Activity', 'External service provider activity is monitored.', 'Detect', 'medium', 'non-compliant', 20, true),
        (v_tenant_id, v_nist_standard_id, 'DE.CM-09', 'Unauthorized Code', 'Unauthorized code is detected.', 'Detect', 'critical', 'compliant', 90, true);

        -- RESPOND (RS)
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'RS.MA-01', 'Incident Management', 'Incidents are managed.', 'Respond', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.MA-02', 'Incident Reporting', 'Incidents are reported.', 'Respond', 'high', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.MA-03', 'Incident Response Plan', 'Incident response is executed according to plan.', 'Respond', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.MA-04', 'Incident Coordination', 'Coordination with stakeholders occurs consistent with response plans.', 'Respond', 'high', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'RS.AN-03', 'Forensics', 'Forensics are performed.', 'Respond', 'medium', 'in-progress', 50, true),
        (v_tenant_id, v_nist_standard_id, 'RS.AN-06', 'Categorization', 'Incidents are categorized.', 'Respond', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.CO-02', 'Information Sharing', 'Information is shared consistent with response plans.', 'Respond', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.MI-01', 'Containment', 'Incidents are contained.', 'Respond', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RS.MI-02', 'Mitigation', 'Incidents are mitigated.', 'Respond', 'critical', 'compliant', 100, true);

        -- RECOVER (RC)
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_nist_standard_id, 'RC.RP-01', 'Recovery Plan', 'Recovery plan is executed.', 'Recover', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_nist_standard_id, 'RC.IM-01', 'Recovery Improvement', 'Recovery planning and processes are improved.', 'Recover', 'medium', 'in-progress', 60, true),
        (v_tenant_id, v_nist_standard_id, 'RC.IM-02', 'Lessons Learned', 'Recovery strategies are updated.', 'Recover', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_nist_standard_id, 'RC.CO-03', 'Recovery Communications', 'Recovery activities are communicated.', 'Recover', 'medium', 'compliant', 100, true);

    END IF;
END $$;
