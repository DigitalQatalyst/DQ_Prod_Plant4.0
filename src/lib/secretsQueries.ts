/**
 * Secrets and Certificates Management Supabase Queries
 * Requirements: 2.8, 7.2, 9.2, 9.3, 9.4
 * 
 * Provides typed queries for secrets, certificates, API keys, and service principals.
 * Supports transmission-specific certificate types and rotation tracking.
 */

import { supabase, isSupabaseConfigured, getDataBackend } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
    SecretsCertificate,
    CertificateRotationHistory,
    ApiKey,
    ServicePrincipal,
    SecretType,
    CertificateType,
    SecretStatus
} from '@/types/security';

export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}

export class SecretsQueryError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly details?: unknown
    ) {
        super(message);
        this.name = 'SecretsQueryError';
    }
}

function ensureSupabaseConnected(): void {
    if (!isSupabaseConfigured() || !supabase) {
        throw new SecretsQueryError(
            'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
            'SUPABASE_NOT_CONFIGURED'
        );
    }
}

function handleSupabaseError(error: unknown, operation: string): never {
    if (error && typeof error === 'object' && 'message' in error) {
        throw new SecretsQueryError(
            `${operation} failed: ${(error as { message: string }).message}`,
            (error as { code?: string }).code,
            error
        );
    }
    throw new SecretsQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// Transform database row to SecretsCertificate interface
function transformSecretsCertificate(row: any): SecretsCertificate {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        description: row.description || '',
        secretType: row.secret_type,
        certificateType: row.certificate_type,
        encryptionKeyId: row.encryption_key_id,
        subjectDn: row.subject_dn,
        issuerDn: row.issuer_dn,
        serialNumber: row.serial_number,
        fingerprintSha256: row.fingerprint_sha256,
        status: row.status,
        createdDate: row.created_date,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        lastRotated: row.last_rotated,
        rotationIntervalDays: row.rotation_interval_days || 365,
        usageCount: row.usage_count || 0,
        lastUsed: row.last_used,
        usedBySystems: row.used_by_systems || [],
        protocol: row.protocol,
        assetIds: row.asset_ids || [],
        zoneIds: row.zone_ids || [],
        accessRoles: row.access_roles || [],
        requiresApproval: row.requires_approval ?? true,
        createdBy: row.created_by,
        approvedBy: row.approved_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// Transform database row to CertificateRotationHistory interface
function transformRotationHistory(row: any): CertificateRotationHistory {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        certificateId: row.certificate_id,
        rotationType: row.rotation_type,
        oldFingerprint: row.old_fingerprint,
        newFingerprint: row.new_fingerprint,
        rotationReason: row.rotation_reason,
        rotationRequestedAt: row.rotation_requested_at,
        rotationCompletedAt: row.rotation_completed_at,
        requestedBy: row.requested_by,
        completedBy: row.completed_by,
        status: row.status,
        errorMessage: row.error_message,
        affectedSystems: row.affected_systems || [],
        rollbackPlan: row.rollback_plan,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

/**
 * Get all secrets and certificates for a tenant
 */
export async function getSecretsCertificates(
    tenantId: string,
    options: QueryOptions = {}
): Promise<SecretsCertificate[]> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return [];
        }

        let query = supabase!
            .from('secrets_certificates')
            .select('*')
            .eq('tenant_id', tenantUUID);

        if (options.orderBy) {
            query = query.order(options.orderBy, {
                ascending: options.orderDirection !== 'desc'
            });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
        }

        const { data, error } = await query;

        if (error) {
            handleSupabaseError(error, 'Get secrets and certificates');
        }

        return (data || []).map(transformSecretsCertificate);
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get secrets and certificates');
    }
}

/**
 * Get a single secret/certificate by ID
 */
export async function getSecretById(
    tenantId: string,
    secretId: string
): Promise<SecretsCertificate | null> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return null;
        }

        const { data, error } = await supabase!
            .from('secrets_certificates')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .eq('id', secretId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            handleSupabaseError(error, 'Get secret by ID');
        }

        return data ? transformSecretsCertificate(data) : null;
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get secret by ID');
    }
}

/**
 * Get certificate rotation history
 */
export async function getCertificateRotationHistory(
    tenantId: string,
    certificateId?: string,
    options: QueryOptions = {}
): Promise<CertificateRotationHistory[]> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return [];
        }

        let query = supabase!
            .from('certificate_rotation_history')
            .select('*')
            .eq('tenant_id', tenantUUID);

        if (certificateId) {
            query = query.eq('certificate_id', certificateId);
        }

        if (options.orderBy) {
            query = query.order(options.orderBy, {
                ascending: options.orderDirection !== 'desc'
            });
        } else {
            query = query.order('rotation_requested_at', { ascending: false });
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            handleSupabaseError(error, 'Get certificate rotation history');
        }

        return (data || []).map(transformRotationHistory);
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get certificate rotation history');
    }
}

/**
 * Get secrets by type
 */
export async function getSecretsByType(
    tenantId: string,
    secretType: SecretType
): Promise<SecretsCertificate[]> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return [];
        }

        const { data, error } = await supabase!
            .from('secrets_certificates')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .eq('secret_type', secretType)
            .order('created_at', { ascending: false });

        if (error) {
            handleSupabaseError(error, 'Get secrets by type');
        }

        return (data || []).map(transformSecretsCertificate);
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get secrets by type');
    }
}

/**
 * Get secrets by status
 */
export async function getSecretsByStatus(
    tenantId: string,
    status: SecretStatus
): Promise<SecretsCertificate[]> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return [];
        }

        const { data, error } = await supabase!
            .from('secrets_certificates')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .eq('status', status)
            .order('valid_until', { ascending: true });

        if (error) {
            handleSupabaseError(error, 'Get secrets by status');
        }

        return (data || []).map(transformSecretsCertificate);
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get secrets by status');
    }
}

/**
 * Get expiring certificates (expiring within specified days)
 */
export async function getExpiringCertificates(
    tenantId: string,
    daysThreshold: number = 30
): Promise<SecretsCertificate[]> {
    ensureSupabaseConnected();

    try {
        const tenantUUID = await mapTenantIdToUUID(tenantId);
        if (!tenantUUID) {
            return [];
        }

        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

        const { data, error } = await supabase!
            .from('secrets_certificates')
            .select('*')
            .eq('tenant_id', tenantUUID)
            .eq('secret_type', 'certificate')
            .lte('valid_until', thresholdDate.toISOString())
            .gte('valid_until', new Date().toISOString())
            .order('valid_until', { ascending: true });

        if (error) {
            handleSupabaseError(error, 'Get expiring certificates');
        }

        return (data || []).map(transformSecretsCertificate);
    } catch (error) {
        if (error instanceof SecretsQueryError) {
            throw error;
        }
        handleSupabaseError(error, 'Get expiring certificates');
    }
}

export function isSecretsQueriesAvailable(): boolean {
    return isSupabaseConfigured();
}
