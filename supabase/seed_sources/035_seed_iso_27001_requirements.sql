

-- ISO 27001 Requirements (Domains A.5 - A.18)
DO $$
DECLARE
    v_tenant_id UUID;
    v_iso_standard_id UUID;
    v_req_count INTEGER := 0;
BEGIN
    -- Get Tenant ID
    SELECT id INTO v_tenant_id FROM auth.users WHERE email = 'admin@power-transmission.grid' LIMIT 1;
    
    -- Get ISO 27001 Standard ID
    SELECT id INTO v_iso_standard_id FROM compliance_standards 
    WHERE tenant_id = v_tenant_id AND name = 'ISO/IEC 27001:2013';

    IF v_iso_standard_id IS NOT NULL THEN
        -- Clear existing requirements for this standard to avoid duplicates if re-running
        DELETE FROM compliance_requirements WHERE standard_id = v_iso_standard_id;

        -- A.5 Information Security Policies
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.5.1.1', 'Policies for information security', 'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.5.1.2', 'Review of the policies for information security', 'The policies for information security shall be reviewed at planned intervals or if significant changes occur to ensure their continuing suitability, adequacy and effectiveness.', 'Process', 'medium', 'compliant', 100, true);

        -- A.6 Organization of Information Security
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.6.1.1', 'Information security roles and responsibilities', 'All information security responsibilities shall be defined and allocated.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.6.1.2', 'Segregation of duties', 'Conflicting duties and areas of responsibility shall be segregated to reduce opportunities for unauthorized or unintentional modification or misuse of the organization''s assets.', 'Process', 'high', 'in-progress', 75, true),
        (v_tenant_id, v_iso_standard_id, 'A.6.1.3', 'Contact with authorities', 'Appropriate contacts with relevant authorities shall be maintained.', 'Process', 'low', 'compliant', 100, false),
        (v_tenant_id, v_iso_standard_id, 'A.6.1.4', 'Contact with special interest groups', 'Appropriate contacts with special interest groups or other specialist security forums and professional associations shall be maintained.', 'Process', 'low', 'compliant', 100, false),
        (v_tenant_id, v_iso_standard_id, 'A.6.1.5', 'Information security in project management', 'Information security shall be addressed in project management, regardless of the type of the project.', 'Process', 'medium', 'in-progress', 60, true);

        -- A.7 Human Resource Security
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.7.1.1', 'Screening', 'Background verification checks on all candidates for employment shall be carried out in accordance with relevant laws, regulations and ethics and shall be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.7.1.2', 'Terms and conditions of employment', 'The contractual agreements with employees and contractors shall state their and the organization''s responsibilities for information security.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.7.2.1', 'Management responsibilities', 'Management shall require all employees and contractors to apply information security in accordance with the established policies and procedures of the organization.', 'Process', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.7.2.2', 'Information security awareness, education and training', 'All employees of the organization and, where relevant, contractors shall receive appropriate awareness education and training and regular updates in organizational policies and procedures, as relevant for their job function.', 'Training', 'high', 'in-progress', 80, true),
        (v_tenant_id, v_iso_standard_id, 'A.7.2.3', 'Disciplinary process', 'There shall be a formal and communicated disciplinary process in place to take action against employees who have committed a confirmed information security breach.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.7.3.1', 'Termination or change of employment responsibilities', 'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, communicated to the employee or contractor and enforced.', 'Process', 'medium', 'compliant', 100, true);

        -- A.8 Asset Management
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.8.1.1', 'Inventory of assets', 'Assets associated with information and information processing facilities shall be identified and an inventory of these assets shall be drawn up and maintained.', 'Technical', 'high', 'in-progress', 85, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.1.2', 'Ownership of assets', 'Assets maintained in the inventory shall be owned.', 'Process', 'medium', 'compliant', 95, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.1.3', 'Acceptable use of assets', 'Rules for the acceptable use of information and of assets associated with information and information processing facilities shall be identified, documented and implemented.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.1.4', 'Return of assets', 'All employees and external party users shall return all of the organizational assets in their possession upon termination of their employment, contract or agreement.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.2.1', 'Classification of information', 'Information shall be classified in terms of legal requirements, value, criticality and sensitivity to unauthorised disclosure or modification.', 'Process', 'high', 'in-progress', 60, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.2.2', 'Labelling of information', 'An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.', 'Process', 'medium', 'non-compliant', 30, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.2.3', 'Handling of assets', 'Procedures for handling assets shall be developed and implemented in accordance with the information classification scheme adopted by the organization.', 'Process', 'medium', 'in-progress', 50, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.3.1', 'Management of removable media', 'Procedures shall be implemented for the management of removable media in accordance with the classification scheme adopted by the organization.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.3.2', 'Disposal of media', 'Media shall be disposed of securely when no longer required, using formal procedures.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.8.3.3', 'Physical media transfer', 'Media containing information shall be protected against unauthorized access, misuse or corruption during transportation.', 'Process', 'medium', 'compliant', 100, true);

        -- A.9 Access Control
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.9.1.1', 'Access control policy', 'An access control policy shall be established, documented and reviewed based on business and information security requirements.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.1.2', 'Access to networks and network services', 'Users shall only be provided with access to the network and network services that they have been specifically authorized to use.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.1', 'User registration and de-registration', 'A formal user registration and de-registration process shall be implemented to enable assignment of access rights.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.2', 'User access provisioning', 'A formal user access provisioning process shall be implemented to assign or revoke access rights for all user types to all systems and services.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.3', 'Management of privileged access rights', 'The allocation and use of privileged access rights shall be restricted and controlled.', 'Technical', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.4', 'Management of secret authentication information of users', 'The allocation of secret authentication information shall be controlled through a formal management process.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.5', 'Review of user access rights', 'Asset owners shall review users'' access rights at regular intervals.', 'Process', 'medium', 'in-progress', 70, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.2.6', 'Removal or adjustment of access rights', 'The access rights of all employees and external party users to information and information processing facilities shall be removed upon termination of their employment, contract or agreement, or adjusted upon change.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.3.1', 'Use of secret authentication information', 'Users shall be required to follow the organization''s practices in the use of secret authentication information.', 'Process', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.4.1', 'Information access restriction', 'Access to information and application system functions shall be restricted in accordance with the access control policy.', 'Technical', 'high', 'compliant', 95, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.4.2', 'Secure log-on procedures', 'Where required by the access control policy, access to systems and applications shall be controlled by a secure log-on procedure.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.4.3', 'Password management system', 'Password management systems shall be interactive and shall ensure quality passwords.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.4.4', 'Use of privileged utility programs', 'The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.9.4.5', 'Access control to program source code', 'Access to program source code shall be restricted.', 'Technical', 'medium', 'compliant', 100, true);

        -- A.10 Cryptography
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.10.1.1', 'Policy on the use of cryptographic controls', 'A policy on the use of cryptographic controls for protection of information shall be developed and implemented.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.10.1.2', 'Key management', 'A policy on the use, protection and lifetime of cryptographic keys shall be developed and implemented through their whole lifecycle.', 'Technical', 'critical', 'in-progress', 80, true);

        -- A.11 Physical and Environmental Security
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.11.1.1', 'Physical security perimeter', 'Security perimeters shall be defined and used to protect areas that contain either sensitive or critical information and information processing facilities.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.1.2', 'Physical entry controls', 'Secure areas shall be protected by appropriate entry controls to ensure that only authorized personnel are allowed access.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.1.3', 'Securing offices, rooms and facilities', 'Physical security for offices, rooms and facilities shall be designed and applied.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.1.4', 'Protecting against external and environmental threats', 'Physical protection against natural disasters, malicious attack or accidents shall be designed and applied.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.1.5', 'Working in secure areas', 'Procedures for working in secure areas shall be designed and applied.', 'Process', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.1.6', 'Delivery and loading areas', 'Access points such as delivery and loading areas and other points where unauthorized persons could enter the premises shall be controlled and, if possible, isolated from information processing facilities to avoid unauthorized access.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.1', 'Equipment siting and protection', 'Equipment shall be sited and protected to reduce the risks from environmental threats and hazards, and opportunities for unauthorized access.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.2', 'Supporting utilities', 'Equipment shall be protected from power failures and other disruptions caused by failures in supporting utilities.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.3', 'Cabling security', 'Power and telecommunications cabling carrying data or supporting information services shall be protected from interception, interference or damage.', 'Technical', 'medium', 'in-progress', 80, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.4', 'Equipment maintenance', 'Equipment shall be correctly maintained to ensure its continued availability and integrity.', 'Process', 'medium', 'compliant', 95, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.5', 'Removal of assets', 'Equipment, information or software shall not be taken off-site without prior authorization.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.6', 'Security of equipment and assets off-premises', 'Security shall be applied to off-site assets taking into account the different risks of working outside the organization''s premises.', 'Policy', 'medium', 'in-progress', 60, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.7', 'Secure disposal or re-use of equipment', 'All items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.8', 'Unattended user equipment', 'Users shall ensure that unattended equipment has appropriate protection.', 'Policy', 'low', 'compliant', 80, false),
        (v_tenant_id, v_iso_standard_id, 'A.11.2.9', 'Clear desk and clear screen policy', 'A clear desk policy for papers and removable storage media and a clear screen policy for information processing facilities shall be adopted.', 'Policy', 'low', 'non-compliant', 40, true);

        -- A.12 Operations Security
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.12.1.1', 'Documented operating procedures', 'Operating procedures shall be documented and made available to all users who need them.', 'Process', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.1.2', 'Change management', 'Changes to the organization, business processes, information processing facilities and systems that affect information security shall be controlled.', 'Process', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.1.3', 'Capacity management', 'The use of resources shall be monitored, tuned and projections made of future capacity requirements to ensure the required system performance.', 'Technical', 'medium', 'compliant', 95, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.1.4', 'Separation of development, testing and operational environments', 'Development, testing, and operational environments shall be separated to reduce the risks of unauthorized access or changes to the operational environment.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.2.1', 'Controls against malware', 'Detection, prevention and recovery controls to protect against malware shall be implemented, combined with appropriate user awareness.', 'Technical', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.3.1', 'Information backup', 'Backup copies of information, software and system images shall be taken and tested regularly in accordance with an agreed backup policy.', 'Technical', 'critical', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.4.1', 'Event logging', 'Event logs recording user activities, exceptions, faults and information security events shall be produced, kept and regularly reviewed.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.4.2', 'Protection of log information', 'Logging facilities and log information shall be protected against tampering and unauthorized access.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.4.3', 'Administrator and operator logs', 'System administrator and system operator activities shall be logged and the logs protected and regularly reviewed.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.4.4', 'Clock synchronization', 'The clocks of all relevant information processing systems within an organization or security domain shall be synchronized to a single reference time source.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.5.1', 'Installation of software on operational systems', 'Procedures shall be implemented to control the installation of software on operational systems.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.6.1', 'Management of technical vulnerabilities', 'Information about technical vulnerabilities of information systems being used shall be obtained in a timely fashion, the organization''s exposure to such vulnerabilities evaluated and appropriate measures taken to address the associated risk.', 'Process', 'critical', 'in-progress', 80, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.6.2', 'Restrictions on software installation', 'Rules governing the installation of software by users shall be established and implemented.', 'Policy', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.12.7.1', 'Information systems audit controls', 'Audit requirements and activities involving verification of operational systems shall be carefully planned and agreed to minimize disruptions to business processes.', 'Process', 'medium', 'compliant', 100, true);

        -- A.13 Communications Security
        INSERT INTO compliance_requirements (
            tenant_id, standard_id, requirement_id, title, description, 
            category, priority, status, implementation_percentage, evidence_required
        ) VALUES
        (v_tenant_id, v_iso_standard_id, 'A.13.1.1', 'Network controls', 'Networks shall be managed and controlled to protect information in systems and applications.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.1.2', 'Security of network services', 'Security mechanisms, service levels and management requirements of all network services shall be identified and included in network services agreements, whether these services are provided in-house or outsourced.', 'Process', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.1.3', 'Segregation in networks', 'Groups of information services, users and information systems shall be segregated on networks.', 'Technical', 'high', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.2.1', 'Information transfer policies and procedures', 'Formal transfer policies, procedures and controls shall be in place to protect the transfer of information through the use of all types of communication facilities.', 'Process', 'medium', 'compliant', 90, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.2.2', 'Agreements on information transfer', 'Agreements shall address the secure transfer of business information between the organization and external parties.', 'Legal', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.2.3', 'Electronic messaging', 'Information involved in electronic messaging shall be appropriately protected.', 'Technical', 'medium', 'compliant', 100, true),
        (v_tenant_id, v_iso_standard_id, 'A.13.2.4', 'Confidentiality or non-disclosure agreements', 'Requirements for confidentiality or non-disclosure agreements reflecting the organization''s needs for the protection of information shall be identified, regularly reviewed and documented.', 'Legal', 'high', 'compliant', 100, true);

    END IF;
END $$;
