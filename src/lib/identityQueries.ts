/**
 * Identity & Access Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for SSO, MFA, Session Rules, and Endpoint Baselines.
 */

import { supabase, isSupabaseConfigured, getDataBackend } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import {
    getMockDirectoryIntegrationsByTenant,
    getMockMfaRulesByTenant,
    getMockSessionRulesByTenant,
    getMockEndpointBaselinesByTenant,
} from '../data/mockSecurityData';

/**
 * Fetches all directory integrations for a specific tenant.
 */
export async function getDirectoryIntegrations(tenantId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];

    const uuid = await mapTenantIdToUUID(tenantId);
    if (!uuid) return [];

    const { data, error } = await supabase!
        .from('directory_integrations')
        .select('*')
        .eq('tenant_id', uuid)
        .order('name');

    if (error) {
        console.error('Error fetching directory integrations:', error);
        return [];
    }

    return toCamelCase(data || []);
}

/**
 * Fetches all MFA rules for a specific tenant.
 */
export async function getMfaRules(tenantId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];

    const uuid = await mapTenantIdToUUID(tenantId);
    if (!uuid) return [];

    const { data, error } = await supabase!
        .from('mfa_rules')
        .select('*')
        .eq('tenant_id', uuid)
        .order('priority');

    if (error) {
        console.error('Error fetching MFA rules:', error);
        return [];
    }

    return toCamelCase(data || []);
}

/**
 * Fetches all session rules for a specific tenant.
 */
export async function getSessionRules(tenantId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];

    const uuid = await mapTenantIdToUUID(tenantId);
    if (!uuid) return [];

    const { data, error } = await supabase!
        .from('session_rules')
        .select('*')
        .eq('tenant_id', uuid)
        .order('name');

    if (error) {
        console.error('Error fetching session rules:', error);
        return [];
    }

    return toCamelCase(data || []);
}

/**
 * Fetches all endpoint baselines for a specific tenant.
 */
export async function getEndpointBaselines(tenantId: string): Promise<any[]> {
    if (!isSupabaseConfigured()) return [];

    const uuid = await mapTenantIdToUUID(tenantId);
    if (!uuid) return [];

    const { data, error } = await supabase!
        .from('endpoint_baselines')
        .select('*')
        .eq('tenant_id', uuid)
        .order('name');

    if (error) {
        console.error('Error fetching endpoint baselines:', error);
        return [];
    }

    return toCamelCase(data || []);
}
