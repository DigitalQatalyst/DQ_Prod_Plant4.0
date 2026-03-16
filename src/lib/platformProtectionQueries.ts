/**
 * Platform Data Protection Queries
 * 
 * Provides typed Supabase queries for data protection policies, violations, and metrics.
 * Implements RLS-aware queries with proper error handling.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
    DataProtectionPolicy,
    DataProtectionViolation,
    DataClassificationLevel,
    ProtectionMeasureStatus,
    DataProtectionMeasureType
} from '@/types/security';

/**
 * Check if Platform Protection queries are available
 */
export function isPlatformProtectionQueriesAvailable(): boolean {
    return isSupabaseConfigured();
}

/**
 * Get data protection policies for a tenant
 */
export async function getDataProtectionPolicies(tenantId: string): Promise<DataProtectionPolicy[]> {
    if (!isPlatformProtectionQueriesAvailable()) {
        return [];
    }

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return [];

        const { data, error } = await supabase!
            .from('data_protection_policies')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .order('policy_name');

        if (error) {
            console.error('Error fetching data protection policies:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log(`No data protection policies found for tenant UUID: ${tenantUUID}`);
            return [];
        }

        console.log(`Successfully fetched ${data.length} data protection policies for tenant ${tenantId}`);

        // Fetch violation counts for these policies
        const { data: violationCounts } = await supabase!
            .from('data_protection_violations')
            .select('policy_id')
            .eq('tenant_id', tenantUUID)
            .eq('status', 'open');

        const countsMap = (violationCounts || []).reduce((acc: Record<string, number>, v: any) => {
            if (v.policy_id) {
                acc[v.policy_id] = (acc[v.policy_id] || 0) + 1;
            }
            return acc;
        }, {});

        // Map Supabase data to DataProtectionPolicy interface
        return data.map((policy: any) => {
            // Derive protection measures from flags
            const measures: DataProtectionMeasureType[] = [];
            if (policy.encryption_required) measures.push('encryption-at-rest');
            if (policy.encryption_in_transit) measures.push('encryption-in-transit');
            if (policy.backup_required) measures.push('backup');
            if (policy.access_control_required) measures.push('access-control');
            if (policy.retention_period_days) measures.push('retention-policy');
            if (policy.deletion_required) measures.push('deletion-policy');

            return {
                id: policy.id,
                tenantId: tenantId, // Keep original tenant ID for frontend consistency
                name: policy.policy_name,
                description: policy.policy_description || '',
                dataCategory: policy.data_category || 'general',
                classificationLevel: policy.data_classification as DataClassificationLevel,
                protectionMeasures: measures,
                encryptionRequired: policy.encryption_required || false,
                encryptionAlgorithm: policy.encryption_algorithm,
                backupRequired: policy.backup_required || false,
                retentionDays: policy.retention_period_days || 0,
                accessControlRequired: policy.access_control_required || false,
                allowedRoles: [], // Not directly in this table, would need join
                allowedZones: policy.applies_to_zones || [],
                complianceStandards: policy.regulatory_requirements || [],
                status: (policy.status === 'draft' ? 'inactive' : policy.status === 'active' ? 'active' : 'inactive') as ProtectionMeasureStatus,
                violationCount: countsMap[policy.id] || 0,
                lastAssessment: policy.last_reviewed_date ? new Date(policy.last_reviewed_date).toISOString() : undefined,
                nextAssessment: policy.next_review_date ? new Date(policy.next_review_date).toISOString() : undefined,
                approvedAt: policy.approval_date ? new Date(policy.approval_date).toISOString() : undefined,
                createdAt: policy.created_at,
                updatedAt: policy.updated_at
            };
        });
    } catch (err) {
        console.error('Unexpected error fetching data protection policies:', err);
        return [];
    }
}

/**
 * Get data protection violations for a tenant
 */
export async function getDataProtectionViolations(
    tenantId: string,
    options: { limit?: number } = {}
): Promise<DataProtectionViolation[]> {
    if (!isPlatformProtectionQueriesAvailable()) {
        return [];
    }

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return [];

        let query = supabase!
            .from('data_protection_violations')
            .select('*, policy:data_protection_policies(policy_name)')
            .eq('tenant_id', tenantUUID)
            .order('violation_timestamp', { ascending: false });

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching data protection violations:', error);
            return [];
        }

        if (!data) return [];

        return data.map((violation: any) => ({
            id: violation.id,
            tenantId: tenantId,
            policyId: violation.policy_id || '',
            policyName: violation.policy?.policy_name || 'Unknown Policy',
            violationType: violation.violation_type,
            severity: violation.severity,
            dataCategory: violation.affected_data_classification || 'unknown',
            affectedRecords: violation.records_affected || 0,
            violationDescription: violation.description,
            detectedAt: violation.violation_timestamp,
            detectedBy: violation.detection_method || 'system',
            status: violation.status,
            remediationAction: violation.remediation_actions && violation.remediation_actions.length > 0
                ? violation.remediation_actions[0]
                : undefined,
            remediatedAt: violation.remediation_timestamp,
            createdAt: violation.created_at,
            updatedAt: violation.updated_at
        }));
    } catch (err) {
        console.error('Unexpected error fetching data protection violations:', err);
        return [];
    }
}

/**
 * Get platform data protection summary
 */
export async function getPlatformDataProtectionSummary(tenantId: string): Promise<any> {
    if (!isPlatformProtectionQueriesAvailable()) {
        return null;
    }

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return null;

        // Fetch latest metrics
        const { data: metricsData, error: metricsError } = await supabase!
            .from('data_protection_metrics')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .order('metric_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (metricsError) {
            console.error('Error fetching data protection metrics:', metricsError);
        }

        // Fetch counts ensuring we catch data even if metrics table is empty
        const { count: policyCount } = await supabase!
            .from('data_protection_policies')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantUUID);

        const { count: activePolicyCount } = await supabase!
            .from('data_protection_policies')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantUUID)
            .eq('status', 'active');

        const { count: violationCount } = await supabase!
            .from('data_protection_violations')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantUUID)
            .eq('status', 'open');

        const { count: criticalViolationCount } = await supabase!
            .from('data_protection_violations')
            .select('*', { count: 'exact', head: true })
            .eq('severity', 'critical')
            .eq('status', 'open');

        // Combine data
        const metrics = metricsData || {};

        return toCamelCase({
            totalPolicies: policyCount || 0,
            activePolicies: activePolicyCount || 0,
            violationCount: violationCount || 0,
            criticalViolations: criticalViolationCount || 0,
            encryptionCoverage: metrics.encryption_coverage_percent || 0,
            backupCoverage: metrics.backup_coverage_percent || 0,
            accessControlCoverage: metrics.policy_compliance_rate || 0, // Using compliance rate as proxy
            complianceScore: metrics.compliance_rate || 0,
            lastAssessment: metrics.created_at || new Date().toISOString()
        });
    } catch (err) {
        console.error('Unexpected error fetching summary:', err);
        return null;
    }
}
