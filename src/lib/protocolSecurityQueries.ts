/**
 * Protocol Security Queries
 * 
 * Provides typed Supabase queries for transmission protocol policies, 
 * violations, and real-time monitoring stats.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
    ProtocolPolicy,
    ProtocolViolation,
    ProtocolMonitoring
} from '@/types/security';

/**
 * Check if queries are available
 */
export function isProtocolSecurityQueriesAvailable(): boolean {
    return isSupabaseConfigured();
}

/**
 * Get all protocol policies for a tenant
 */
export async function getProtocolPolicies(tenantId: string): Promise<ProtocolPolicy[]> {
    if (!isProtocolSecurityQueriesAvailable()) return [];

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return [];

        const { data, error } = await supabase!
            .from('transmission_protocol_policies')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .order('protocol');

        if (error) {
            console.error('Error fetching protocol policies:', error);
            return [];
        }

        return toCamelCase<ProtocolPolicy[]>(data || []);
    } catch (err) {
        console.error('Unexpected error fetching protocol policies:', err);
        return [];
    }
}

/**
 * Get protocol violations for a specific policy (or all if not provided)
 */
export async function getProtocolViolations(
    tenantId: string,
    policyId?: string,
    limit = 50
): Promise<ProtocolViolation[]> {
    if (!isProtocolSecurityQueriesAvailable()) return [];

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return [];

        let query = supabase!
            .from('protocol_violations')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .order('detected_at', { ascending: false })
            .limit(limit);

        if (policyId) {
            query = query.eq('policy_id', policyId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching protocol violations:', error);
            return [];
        }

        return toCamelCase<ProtocolViolation[]>(data || []);
    } catch (err) {
        console.error('Unexpected error fetching protocol violations:', err);
        return [];
    }
}

/**
 * Get monitoring stats for a protocol
 */
export async function getProtocolMonitoringStats(
    tenantId: string,
    protocol: string
): Promise<ProtocolMonitoring | null> {
    if (!isProtocolSecurityQueriesAvailable()) return null;

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) return null;

        const { data, error } = await supabase!
            .from('protocol_monitoring_stats')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .eq('protocol', protocol)
            .maybeSingle();

        if (error) {
            console.error('Error fetching protocol monitoring stats:', error);
            return null;
        }

        return data ? toCamelCase<ProtocolMonitoring>(data) : null;
    } catch (err) {
        console.error('Unexpected error fetching protocol monitoring stats:', err);
        return null;
    }
}
