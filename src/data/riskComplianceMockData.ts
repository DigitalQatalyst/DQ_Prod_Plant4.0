/**
 * Mock Data for Risk and Compliance
 * Provides fallback data for tenants not yet in Supabase.
 */

import { RiskComplianceSummary, ComplianceStandardStatus, RiskComplianceTrend } from '../lib/riskComplianceQueries';

export const getMockRiskComplianceSummary = (tenantId: string, sector: string = 'power'): RiskComplianceSummary => {
    const isPower = sector === 'power';

    return {
        id: `mock-summary-${tenantId}`,
        tenant_id: tenantId,
        site_id: null,
        summary_name: `${isPower ? 'Transmission' : 'Upstream'} Risk & Compliance Summary`,
        summary_date: new Date().toISOString(),
        reporting_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        reporting_period_end: new Date().toISOString(),
        summary_type: 'monthly',

        // Risk metrics
        total_risks: isPower ? 12 : 18,
        critical_risks: isPower ? 1 : 3,
        high_risks: isPower ? 3 : 5,
        medium_risks: isPower ? 6 : 7,
        low_risks: isPower ? 2 : 3,
        mitigated_risks: isPower ? 8 : 10,
        accepted_risks: isPower ? 2 : 4,

        // Risk scoring
        overall_risk_score: isPower ? 42 : 58,
        inherent_risk_score: isPower ? 75 : 85,
        residual_risk_score: isPower ? 35 : 45,
        risk_appetite_threshold: 50,
        risk_tolerance_exceeded: !isPower,

        // Compliance metrics
        total_standards: isPower ? 4 : 5,
        compliant_standards: isPower ? 2 : 2,
        partial_compliant_standards: isPower ? 1 : 2,
        non_compliant_standards: isPower ? 1 : 1,

        // Compliance scoring
        overall_compliance_score: isPower ? 82 : 74,
        iec_62443_score: isPower ? 85 : 78,
        nerc_cip_score: isPower ? 78 : 0, // NERC CIP usually power-specific

        // Control metrics
        total_controls: 45,
        implemented_controls: 32,
        partial_controls: 8,
        not_implemented_controls: 5,
        control_effectiveness_score: 72,

        // Incident and alert metrics
        total_incidents: 4,
        critical_incidents: 0,
        resolved_incidents: 4,
        total_alerts: 125,
        critical_alerts: 2,

        // Asset security metrics
        total_assets: 156,
        critical_assets: 24,
        vulnerable_assets: 12,
        secure_assets: 144,

        // Trend indicators
        risk_trend: 'improving',
        compliance_trend: 'stable',
        security_posture_trend: 'improving',

        executive_summary: `This is a mock executive summary for ${tenantId}. ${isPower ? 'Physical security of substations' : 'Remote wellhead access'} remains a key focus area.`,
        key_findings: [
            isPower ? 'Substation 4 perimeter fence requires repair' : 'Wellhead PLC firmware update required on Pad Alpha',
            'Regular security awareness training completed for all staff',
            'Third-party access logs were reviewed with no anomalies found'
        ],
        recommendations: [
            'Implement MFA for all remote engineering access',
            'Schedule quarterly vulnerability scans for critical assets'
        ],
        action_items: [
            'Update incident response plan by end of Q1',
            'Review firewall rules for control network'
        ],

        status: 'approved',
        approved_by: 'System Administrator (Mock)',
        approved_at: new Date().toISOString(),
        notes: 'This data is automatically generated for demonstration purposes.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
};

export const getMockComplianceStatuses = (summaryId: string): ComplianceStandardStatus[] => {
    return [
        {
            id: 'mock-cs-1',
            summary_id: summaryId,
            tenant_id: 'mock',
            standard_name: 'IEC 62443-2-4',
            standard_version: '2019',
            standard_type: 'iec-62443',
            compliance_status: 'compliant',
            compliance_score: 92,
            total_requirements: 24,
            met_requirements: 22,
            partial_requirements: 2,
            unmet_requirements: 0,
            last_assessment_date: new Date().toISOString(),
            next_assessment_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            assessor: 'Internal Audit',
            critical_gaps: 0,
            high_gaps: 0,
            gap_summary: null,
            remediation_plan: null,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'mock-cs-2',
            summary_id: summaryId,
            tenant_id: 'mock',
            standard_name: 'NERC CIP-002-5.1',
            standard_version: 'v5',
            standard_type: 'nerc-cip',
            compliance_status: 'partial',
            compliance_score: 75,
            total_requirements: 18,
            met_requirements: 12,
            partial_requirements: 4,
            unmet_requirements: 2,
            last_assessment_date: new Date().toISOString(),
            next_assessment_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            assessor: 'Third Party Regulator',
            critical_gaps: 1,
            high_gaps: 2,
            gap_summary: 'Asset inventory classification pending for secondary substations',
            remediation_plan: 'Complete asset tagging project by end of month',
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];
};

export const getMockTrends = (tenantId: string): RiskComplianceTrend[] => {
    const categories: ('risk' | 'compliance' | 'security' | 'incident' | 'control')[] = ['risk', 'compliance', 'security'];
    const trends: RiskComplianceTrend[] = [];

    const now = new Date();

    categories.forEach(category => {
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            trends.push({
                id: `mock-trend-${category}-${i}`,
                tenant_id: tenantId,
                site_id: null,
                trend_date: date.toISOString(),
                metric_name: `Overall ${category.charAt(0).toUpperCase() + category.slice(1)} Score`,
                metric_category: category,
                metric_value: 60 + Math.random() * 30,
                metric_target: 85,
                metric_threshold: 70,
                status: 'on-target',
                context: null,
                created_at: date.toISOString()
            });
        }
    });

    return trends;
};
