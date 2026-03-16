import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:8000';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
    console.log('Starting Risk, Compliance, and Vendor data seeding...');

    // 1. Get Tenant ID
    const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('name', 'DEWA - Transmission')
        .single();

    if (tenantError || !tenants) {
        console.error('DEWA tenant not found:', tenantError);
        return;
    }
    const tenantId = tenants.id;
    console.log('Using tenant ID:', tenantId);

    // 1.5 Cleanup existing data for this tenant
    console.log('Cleaning up existing data...');
    // Delete in order to satisfy FK constraints
    await supabase.from('compliance_standard_status').delete().eq('tenant_id', tenantId);
    await supabase.from('risk_compliance_trends').delete().eq('tenant_id', tenantId);
    await supabase.from('risk_compliance_summaries').delete().eq('tenant_id', tenantId);

    await supabase.from('vendor_contact_history').delete().eq('tenant_id', tenantId);
    await supabase.from('vendor_security_findings').delete().eq('tenant_id', tenantId);
    await supabase.from('vendor_security_assessments').delete().eq('tenant_id', tenantId);
    console.log('Cleanup finished.');

    // 2. Risk & Compliance Summaries
    const summaries = [
        {
            tenant_id: tenantId,
            summary_name: 'Q4 2025 Security Compliance Summary',
            summary_date: '2025-12-31T00:00:00Z',
            reporting_period_start: '2025-10-01T00:00:00Z',
            reporting_period_end: '2025-12-31T00:00:00Z',
            summary_type: 'quarterly',
            total_risks: 45,
            critical_risks: 3,
            high_risks: 12,
            medium_risks: 20,
            low_risks: 10,
            mitigated_risks: 35,
            accepted_risks: 5,
            overall_risk_score: 42.5,
            overall_compliance_score: 88.0,
            iec_62443_score: 85.0,
            nerc_cip_score: 92.0,
            total_standards: 5,
            compliant_standards: 3,
            total_controls: 120,
            implemented_controls: 95,
            control_effectiveness_score: 82.0,
            total_assets: 1540,
            critical_assets: 250,
            vulnerable_assets: 45,
            secure_assets: 1495,
            risk_trend: 'improving',
            compliance_trend: 'stable',
            status: 'approved',
            executive_summary: 'Overall security posture remains strong with significant progress in NERC CIP compliance. Focus for next quarter is on legacy relay firmware updates.',
            key_findings: ['Legacy firmware in 12 substations', 'Improved monitoring coverage', 'Pending MFA enforcement for some regional hubs'],
            recommendations: ['Accelerate patching for high-criticality assets', 'Conduct additional red-team exercise']
        },
        {
            tenant_id: tenantId,
            summary_name: 'Monthly Security Status - November 2025',
            summary_date: '2025-11-30T00:00:00Z',
            reporting_period_start: '2025-11-01T00:00:00Z',
            reporting_period_end: '2025-11-30T00:00:00Z',
            summary_type: 'monthly',
            total_risks: 42,
            critical_risks: 2,
            high_risks: 15,
            medium_risks: 15,
            low_risks: 10,
            mitigated_risks: 30,
            accepted_risks: 3,
            overall_risk_score: 48.0,
            overall_compliance_score: 86.5,
            total_standards: 5,
            compliant_standards: 2,
            total_controls: 120,
            implemented_controls: 90,
            status: 'approved',
            risk_trend: 'stable',
            compliance_trend: 'improving'
        },
        {
            tenant_id: tenantId,
            summary_name: 'Q3 2025 Security Compliance Summary',
            summary_date: '2025-09-30T00:00:00Z',
            reporting_period_start: '2025-07-01T00:00:00Z',
            reporting_period_end: '2025-09-30T00:00:00Z',
            summary_type: 'quarterly',
            total_risks: 50,
            critical_risks: 5,
            high_risks: 15,
            medium_risks: 20,
            low_risks: 10,
            mitigated_risks: 30,
            accepted_risks: 5,
            overall_risk_score: 55.0,
            overall_compliance_score: 82.0,
            iec_62443_score: 80.0,
            nerc_cip_score: 85.0,
            total_standards: 5,
            compliant_standards: 2,
            total_controls: 120,
            implemented_controls: 85,
            control_effectiveness_score: 75.0,
            total_assets: 1500,
            critical_assets: 240,
            vulnerable_assets: 60,
            secure_assets: 1440,
            risk_trend: 'stable',
            compliance_trend: 'improving',
            status: 'approved'
        },
        {
            tenant_id: tenantId,
            summary_name: 'Q2 2025 Security Compliance Summary',
            summary_date: '2025-06-30T00:00:00Z',
            reporting_period_start: '2025-04-01T00:00:00Z',
            reporting_period_end: '2025-06-30T00:00:00Z',
            summary_type: 'quarterly',
            total_risks: 55,
            critical_risks: 6,
            high_risks: 18,
            medium_risks: 21,
            low_risks: 10,
            mitigated_risks: 25,
            accepted_risks: 6,
            overall_risk_score: 62.0,
            overall_compliance_score: 78.5,
            iec_62443_score: 75.0,
            nerc_cip_score: 80.0,
            total_standards: 4,
            compliant_standards: 1,
            total_controls: 120,
            implemented_controls: 80,
            status: 'approved'
        },
        {
            tenant_id: tenantId,
            summary_name: 'Q1 2025 Security Compliance Summary',
            summary_date: '2025-03-31T00:00:00Z',
            reporting_period_start: '2025-01-01T00:00:00Z',
            reporting_period_end: '2025-03-31T00:00:00Z',
            summary_type: 'quarterly',
            total_risks: 60,
            critical_risks: 8,
            high_risks: 22,
            medium_risks: 20,
            low_risks: 10,
            mitigated_risks: 20,
            accepted_risks: 8,
            overall_risk_score: 68.5,
            overall_compliance_score: 75.0,
            iec_62443_score: 70.0,
            nerc_cip_score: 75.0,
            total_standards: 4,
            compliant_standards: 1,
            total_controls: 120,
            implemented_controls: 75,
            status: 'approved'
        }
    ];

    const { data: insertedSummaries, error: summaryError } = await supabase
        .from('risk_compliance_summaries')
        .insert(summaries)
        .select();

    if (summaryError) {
        console.error('Error inserting summaries:', summaryError);
        return;
    }
    console.log('Inserted summaries:', insertedSummaries.length);

    // 3. Compliance Standard Status
    const q4Summary = insertedSummaries.find(s => s.summary_name.includes('Q4'));
    if (q4Summary) {
        const standardStatuses = [
            {
                summary_id: q4Summary.id,
                tenant_id: tenantId,
                standard_name: 'IEC 62443-3-3',
                standard_type: 'iec-62443',
                compliance_status: 'partial',
                compliance_score: 85.0,
                total_requirements: 45,
                met_requirements: 38,
                partial_requirements: 5,
                unmet_requirements: 2,
                critical_gaps: 1,
                gap_summary: 'Missing MFA on legacy HMI systems.',
                remediation_plan: 'Hardware tokens deployment in Q1 2026.'
            },
            {
                summary_id: q4Summary.id,
                tenant_id: tenantId,
                standard_name: 'NERC CIP-007-6',
                standard_type: 'nerc-cip',
                compliance_status: 'compliant',
                compliance_score: 95.0,
                total_requirements: 20,
                met_requirements: 19,
                partial_requirements: 1,
                unmet_requirements: 0,
                critical_gaps: 0,
                high_gaps: 0
            },
            {
                summary_id: q4Summary.id,
                tenant_id: tenantId,
                standard_name: 'ISO 27001:2022',
                standard_type: 'iso-27001',
                compliance_status: 'compliant',
                compliance_score: 90.0,
                total_requirements: 114,
                met_requirements: 102,
                partial_requirements: 10,
                unmet_requirements: 2,
                critical_gaps: 0,
                high_gaps: 0
            }
        ];

        const { error: stdError } = await supabase.from('compliance_standard_status').insert(standardStatuses);
        if (stdError) console.error('Error inserting standard status:', stdError);
        else console.log('Inserted standard statuses');
    }

    // 4. Risk Compliance Trends
    const trends = [
        { tenant_id: tenantId, metric_name: 'Overall Risk Score', metric_category: 'risk', metric_value: 52.0, trend_date: '2025-10-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Overall Risk Score', metric_category: 'risk', metric_value: 48.0, trend_date: '2025-11-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Overall Risk Score', metric_category: 'risk', metric_value: 42.5, trend_date: '2025-12-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Compliance Score', metric_category: 'compliance', metric_value: 82.0, trend_date: '2025-10-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Compliance Score', metric_category: 'compliance', metric_value: 86.5, trend_date: '2025-11-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Compliance Score', metric_category: 'compliance', metric_value: 88.0, trend_date: '2025-12-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Switching Manipulation', metric_category: 'risk', metric_value: 65.0, trend_date: '2025-12-01T00:00:00Z' },
        { tenant_id: tenantId, metric_name: 'Relay Tampering', metric_category: 'risk', metric_value: 45.0, trend_date: '2025-12-01T00:00:00Z' }
    ];

    const { error: trendError } = await supabase.from('risk_compliance_trends').insert(trends);
    if (trendError) console.error('Error inserting trends:', trendError);
    else console.log('Inserted trends');

    // 5. Vendor Security Assessments
    const vendorAssessments = [
        {
            tenant_id: tenantId,
            vendor_name: 'ABB Power Grids',
            vendor_type: 'equipment-manufacturer',
            system_name: 'Relion 670 Series Relays',
            system_version: 'v2.2',
            system_type: 'protection-relay',
            system_criticality: 'safety-critical',
            overall_security_score: 82.0,
            risk_score: 25.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-11-15T00:00:00Z',
            next_assessment_date: '2026-05-15T00:00:00Z',
            contract_start_date: '2025-01-01T00:00:00Z',
            contract_end_date: '2027-12-31T00:00:00Z',
            iec_62443_certified: true,
            iec_62443_level: 2,
            certifications: ['ISO 27001', 'Achilles Level 2'],
            compliance_standards: ['IEC 62443', 'NERC CIP'],
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Siemens Energy',
            vendor_type: 'system-integrator',
            system_name: 'Spectrum Power 7 SCADA',
            system_version: 'v7.4',
            system_type: 'scada',
            system_criticality: 'production-critical',
            overall_security_score: 75.0,
            risk_score: 40.0,
            trust_level: 'conditional',
            status: 'completed',
            assessment_date: '2025-12-10T00:00:00Z',
            contract_start_date: '2025-06-01T00:00:00Z',
            contract_end_date: '2026-05-31T00:00:00Z',
            certifications: ['ISO 27001'],
            critical_findings: 1,
            high_findings: 2,
            assessment_type: 'initial'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Schneider Electric',
            vendor_type: 'software-provider',
            system_name: 'EcoStruxure Asset Advisor',
            system_version: 'v4.1',
            system_type: 'application',
            system_criticality: 'medium',
            overall_security_score: 88.0,
            risk_score: 15.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-10-20T00:00:00Z',
            assessment_type: 'initial'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'GE Digital',
            vendor_type: 'software-provider',
            system_name: 'GridOS Transmission',
            system_version: 'v2.0',
            system_type: 'application',
            system_criticality: 'production-critical',
            overall_security_score: 80.0,
            risk_score: 22.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-11-05T00:00:00Z',
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Microsoft',
            vendor_type: 'service-provider',
            system_name: 'Azure IoT Hub (Regional)',
            system_version: 'SaaS',
            system_type: 'service',
            system_criticality: 'high',
            overall_security_score: 94.0,
            risk_score: 10.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-09-12T00:00:00Z',
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Cisco Systems',
            vendor_type: 'equipment-manufacturer',
            system_name: 'Industrial Ethernet 4000',
            system_version: 'v15.2',
            system_type: 'gateway',
            system_criticality: 'production-critical',
            overall_security_score: 85.0,
            risk_score: 18.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-08-15T00:00:00Z',
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Hitachi Energy',
            vendor_type: 'equipment-manufacturer',
            system_name: 'MicroSCADA Pro',
            system_version: 'v9.4',
            system_type: 'scada',
            system_criticality: 'production-critical',
            overall_security_score: 72.0,
            risk_score: 45.0,
            trust_level: 'conditional',
            status: 'completed',
            assessment_date: '2025-12-01T00:00:00Z',
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Rockwell Automation',
            vendor_type: 'equipment-manufacturer',
            system_name: 'Allen-Bradley ControlLogix',
            system_version: 'v32',
            system_type: 'rtu',
            system_criticality: 'safety-critical',
            overall_security_score: 78.0,
            risk_score: 32.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-11-20T00:00:00Z',
            assessment_type: 'periodic'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Honeywell',
            vendor_type: 'system-integrator',
            system_name: 'Experion PKS',
            system_version: 'v511',
            system_type: 'scada',
            system_criticality: 'production-critical',
            overall_security_score: 70.0,
            risk_score: 50.0,
            trust_level: 'restricted',
            status: 'in-progress',
            assessment_date: '2025-12-15T00:00:00Z',
            assessment_type: 'initial'
        },
        {
            tenant_id: tenantId,
            vendor_name: 'Emerson',
            vendor_type: 'equipment-manufacturer',
            system_name: 'Ovation Control System',
            system_version: 'v3.7',
            system_type: 'scada',
            system_criticality: 'production-critical',
            overall_security_score: 84.0,
            risk_score: 20.0,
            trust_level: 'trusted',
            status: 'approved',
            assessment_date: '2025-07-20T00:00:00Z',
            assessment_type: 'periodic'
        }
    ];

    const { data: insertedVendors, error: vendorError } = await supabase
        .from('vendor_security_assessments')
        .insert(vendorAssessments)
        .select();

    if (vendorError) {
        console.error('Error inserting vendor assessments:', vendorError);
    } else {
        console.log('Inserted vendor assessments:', insertedVendors.length);

        // 6. Vendor Findings
        const siemens = insertedVendors.find(v => v.vendor_name === 'Siemens Energy');
        if (siemens) {
            const findings = [
                {
                    assessment_id: siemens.id,
                    tenant_id: tenantId,
                    finding_title: 'Unpatched Critical CVE-2025-1234',
                    finding_description: 'Remote code execution vulnerability in web interface.',
                    finding_category: 'patch-management',
                    severity: 'critical',
                    remediation_recommendation: 'Apply security patch v7.4.2 immediately.',
                    remediation_priority: 'immediate',
                    remediation_status: 'open',
                    remediation_due_date: '2026-01-15T00:00:00Z'
                },
                {
                    assessment_id: siemens.id,
                    tenant_id: tenantId,
                    finding_title: 'Weak Default Password Policy',
                    finding_description: 'Default configuration allows 8-character passwords.',
                    finding_category: 'authentication',
                    severity: 'high',
                    remediation_recommendation: 'Update password policy to minimum 14 characters.',
                    remediation_priority: 'high',
                    remediation_status: 'in-progress'
                }
            ];
            await supabase.from('vendor_security_findings').insert(findings);
            console.log('Inserted Siemens findings');

            // 7. Vendor Contact History
            const contacts = [
                {
                    assessment_id: siemens.id,
                    tenant_id: tenantId,
                    contact_date: '2025-12-11T10:00:00Z',
                    contact_type: 'email',
                    contact_subject: 'Critical Finding Notification',
                    contact_summary: 'Notified Siemens of CVE-2025-1234. They confirmed receipt.',
                    follow_up_required: true,
                    follow_up_date: '2025-12-18T00:00:00Z'
                }
            ];
            await supabase.from('vendor_contact_history').insert(contacts);
            console.log('Inserted contact history');
        }
    }

    console.log('Diverse data seeding completed!');
}

seedData();
