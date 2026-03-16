/**
 * Security Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for security user management and identity operations.
 * Implements RLS-aware queries with proper error handling and loading states.
 */

import { supabase, isSupabaseConfigured, getDataBackend } from './supabase';
import { toCamelCase } from './dataMapping';
import {
  getMockSecurityUsersByTenant,
  getMockAccessPoliciesByTenant,
  getMockAccessRulesByPolicy,
  getMockPrivilegedAccessSessionsByTenant,
  getMockAuditLogEntriesByTenant,
} from '@/data/mockSecurityData';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  SecurityUser,
  AccessPolicy,
  AccessRule,
  PrivilegedAccessSession,
  SecretsCertificate,
  CertificateRotationHistory,
  ApiKey,
  ServicePrincipal,
  SecurityAuditLogEntry,
  AuditRetentionPolicy,
  AuditSearchQuery,
  AuditExportRequest,
  TransmissionRole,
  UserStatus,
  PolicyStatus,
  SecretStatus
} from '@/types/security';

/**
 * Query result wrapper with loading and error states
 */
export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Query options for filtering and pagination
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Security query error class
 */
export class SecurityQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SecurityQueryError';
  }
}

/**
 * Ensure Supabase is connected and throw descriptive error if not
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new SecurityQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

/**
 * Handle Supabase query errors with proper typing
 */
function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new SecurityQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new SecurityQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Security Users
// ============================================================================

/**
 * Get all security users for a tenant with RLS enforcement
 */
export async function getSecurityUsers(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityUser[]> {
  // Use mock data in mock mode
  if (getDataBackend() === 'mock') {
    let users = getMockSecurityUsersByTenant(tenantId);

    // Apply sorting
    if (options.orderBy) {
      const key = options.orderBy as keyof SecurityUser;
      users = [...users].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = start + (options.limit || users.length);
      users = users.slice(start, end);
    }

    return users;
  }

  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_users')
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
      handleSupabaseError(error, 'Get security users');
    }

    return toCamelCase<SecurityUser[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security users');
  }
}

/**
 * Get a single security user by ID
 */
export async function getSecurityUserById(
  tenantId: string,
  userId: string
): Promise<SecurityUser | null> {
  try {
    ensureSupabaseConnected();

    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
      .from('security_users')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      handleSupabaseError(error, 'Get security user by ID');
    }

    return toCamelCase<SecurityUser | null>(data);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security user by ID');
  }
}

/**
 * Get security users by role
 */
export async function getSecurityUsersByRole(
  tenantId: string,
  role: TransmissionRole
): Promise<SecurityUser[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('security_users')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('role', role)
      .order('full_name');

    if (error) {
      handleSupabaseError(error, 'Get security users by role');
    }

    return toCamelCase<SecurityUser[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security users by role');
  }
}

/**
 * Get security users by status
 */
export async function getSecurityUsersByStatus(
  tenantId: string,
  status: UserStatus
): Promise<SecurityUser[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('security_users')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', status)
      .order('last_login', { ascending: false, nullsFirst: false });

    if (error) {
      handleSupabaseError(error, 'Get security users by status');
    }

    return toCamelCase<SecurityUser[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security users by status');
  }
}

/**
 * Create a new security user
 */
export async function createSecurityUser(
  user: Omit<SecurityUser, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SecurityUser> {
  ensureSupabaseConnected();

  try {
    // The user object should already contain the tenant_id, which will be a UUID.
    // No need to map here as the input `user` should have the correct tenant_id.
    const { data, error } = await supabase!
      .from('security_users')
      .insert([user])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security user');
    }

    return toCamelCase<SecurityUser>(data);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security user');
  }
}

/**
 * Update a security user
 */
export async function updateSecurityUser(
  tenantId: string,
  userId: string,
  updates: Partial<Omit<SecurityUser, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
): Promise<SecurityUser> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new SecurityQueryError('Invalid tenant ID provided for update', 'INVALID_TENANT_ID');
    }

    const { data, error } = await supabase!
      .from('security_users')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update security user');
    }

    return toCamelCase<SecurityUser>(data);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update security user');
  }
}

/**
 * Delete a security user
 */
export async function deleteSecurityUser(
  tenantId: string,
  userId: string
): Promise<void> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new SecurityQueryError('Invalid tenant ID provided for deletion', 'INVALID_TENANT_ID');
    }

    const { error } = await supabase!
      .from('security_users')
      .delete()
      .eq('tenant_id', tenantUUID)
      .eq('id', userId);

    if (error) {
      handleSupabaseError(error, 'Delete security user');
    }
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Delete security user');
  }
}

/**
 * Track user activity (update last_login)
 */
export async function trackUserActivity(
  tenantId: string,
  userId: string
): Promise<void> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new SecurityQueryError('Invalid tenant ID provided for tracking activity', 'INVALID_TENANT_ID');
    }

    const { error } = await supabase!
      .from('security_users')
      .update({
        last_login: new Date().toISOString(),
        failed_login_attempts: 0
      })
      .eq('tenant_id', tenantUUID)
      .eq('id', userId);

    if (error) {
      handleSupabaseError(error, 'Track user activity');
    }
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Track user activity');
  }
}

/**
 * Increment failed login attempts
 */
export async function incrementFailedLoginAttempts(
  tenantId: string,
  userId: string
): Promise<number> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new SecurityQueryError('Invalid tenant ID provided for incrementing failed attempts', 'INVALID_TENANT_ID');
    }

    // First get current count
    const { data: user, error: fetchError } = await supabase!
      .from('security_users')
      .select('failed_login_attempts')
      .eq('tenant_id', tenantUUID)
      .eq('id', userId)
      .single();

    if (fetchError) {
      handleSupabaseError(fetchError, 'Get failed login attempts');
    }

    const newCount = (user?.failed_login_attempts || 0) + 1;

    // Update with new count
    const { error: updateError } = await supabase!
      .from('security_users')
      .update({ failed_login_attempts: newCount })
      .eq('tenant_id', tenantUUID)
      .eq('id', userId);

    if (updateError) {
      handleSupabaseError(updateError, 'Increment failed login attempts');
    }

    return newCount;
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Increment failed login attempts');
  }
}

// ============================================================================
// Access Policies
// ============================================================================

/**
 * Get all access policies for a tenant
 */
export async function getAccessPolicies(
  tenantId: string,
  options: QueryOptions = {}
): Promise<AccessPolicy[]> {
  // Use mock data in mock mode
  if (getDataBackend() === 'mock') {
    let policies = getMockAccessPoliciesByTenant(tenantId);

    // Apply sorting
    if (options.orderBy) {
      const key = options.orderBy as keyof AccessPolicy;
      policies = [...policies].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderDirection === 'desc' ? -comparison : comparison;
      });
    } else {
      // Default sort by priority
      policies = [...policies].sort((a, b) => a.priority - b.priority);
    }

    // Apply pagination
    if (options.limit) {
      policies = policies.slice(0, options.limit);
    }

    return policies;
  }

  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('access_policies')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('priority');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get access policies');
    }

    return toCamelCase<AccessPolicy[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get access policies');
  }
}

/**
 * Get access policies by status
 */
export async function getAccessPoliciesByStatus(
  tenantId: string,
  status: PolicyStatus
): Promise<AccessPolicy[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('access_policies')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', status)
      .order('priority');

    if (error) {
      handleSupabaseError(error, 'Get access policies by status');
    }

    return toCamelCase<AccessPolicy[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get access policies by status');
  }
}

/**
 * Get access rules for a policy
 */
export async function getAccessRulesForPolicy(
  tenantId: string,
  policyId: string
): Promise<AccessRule[]> {
  // Use mock data in mock mode
  if (getDataBackend() === 'mock') {
    const rules = getMockAccessRulesByPolicy(tenantId, policyId);
    return [...rules].sort((a, b) => a.ruleOrder - b.ruleOrder);
  }

  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('access_rules')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('policy_id', policyId)
      .order('rule_order');

    if (error) {
      handleSupabaseError(error, 'Get access rules for policy');
    }

    return toCamelCase<AccessRule[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get access rules for policy');
  }
}

// ============================================================================
// Privileged Access Sessions
// ============================================================================

/**
 * Get privileged access sessions for a tenant
 */
export async function getPrivilegedAccessSessions(
  tenantId: string,
  options: QueryOptions = {}
): Promise<PrivilegedAccessSession[]> {
  // Use mock data in mock mode
  if (getDataBackend() === 'mock') {
    let sessions = getMockPrivilegedAccessSessionsByTenant(tenantId);

    // Apply sorting
    if (options.orderBy) {
      const key = options.orderBy as keyof PrivilegedAccessSession;
      sessions = [...sessions].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderDirection === 'desc' ? -comparison : comparison;
      });
    } else {
      // Default sort by created_at descending
      sessions = [...sessions].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Apply pagination
    if (options.limit) {
      sessions = sessions.slice(0, options.limit);
    }

    return sessions;
  }

  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('privileged_access_sessions')
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

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get privileged access sessions');
    }

    return toCamelCase<PrivilegedAccessSession[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get privileged access sessions');
  }
}

/**
 * Get active privileged access sessions
 */
export async function getActivePrivilegedAccessSessions(
  tenantId: string
): Promise<PrivilegedAccessSession[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('privileged_access_sessions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', 'active')
      .order('actual_start', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get active privileged access sessions');
    }

    return toCamelCase<PrivilegedAccessSession[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get active privileged access sessions');
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Create a security audit log entry
 */
export async function createAuditLogEntry(
  entry: Omit<SecurityAuditLogEntry, 'id' | 'createdAt'>
): Promise<SecurityAuditLogEntry> {
  ensureSupabaseConnected();

  try {
    const { data, error } = await supabase!
      .from('security_audit_log')
      .insert([entry])
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create audit log entry');
    }

    return toCamelCase<SecurityAuditLogEntry>(data);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create audit log entry');
  }
}

/**
 * Search audit log entries with filters
 */
export async function searchAuditLogEntries(
  tenantId: string,
  filters: {
    eventType?: string;
    severity?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
  },
  options: QueryOptions = {}
): Promise<SecurityAuditLogEntry[]> {
  // Use mock data in mock mode
  if (getDataBackend() === 'mock') {
    let entries = getMockAuditLogEntriesByTenant(tenantId);

    // Apply filters
    if (filters.eventType) {
      entries = entries.filter(e => e.eventType === filters.eventType);
    }
    if (filters.severity) {
      entries = entries.filter(e => e.severity === filters.severity);
    }
    if (filters.userId) {
      entries = entries.filter(e => e.userId === filters.userId);
    }
    if (filters.dateFrom) {
      entries = entries.filter(e => e.eventTimestamp >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      entries = entries.filter(e => e.eventTimestamp <= filters.dateTo!);
    }
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      entries = entries.filter(e =>
        e.eventName.toLowerCase().includes(search) ||
        e.eventDescription.toLowerCase().includes(search) ||
        e.actionPerformed.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    if (options.orderBy) {
      const key = options.orderBy as keyof SecurityAuditLogEntry;
      entries = [...entries].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return options.orderDirection === 'desc' ? -comparison : comparison;
      });
    } else {
      // Default sort by event_timestamp descending
      entries = [...entries].sort((a, b) =>
        new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime()
      );
    }

    // Apply pagination
    if (options.offset || options.limit) {
      const start = options.offset || 0;
      const end = start + (options.limit || entries.length);
      entries = entries.slice(start, end);
    }

    return entries;
  }

  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_audit_log')
      .select('*')
      .eq('tenant_id', tenantUUID);

    // Apply filters
    if (filters.eventType) {
      query = query.eq('event_type', filters.eventType);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.dateFrom) {
      query = query.gte('event_timestamp', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('event_timestamp', filters.dateTo);
    }
    if (filters.searchText) {
      query = query.or(`event_name.ilike.%${filters.searchText}%,event_description.ilike.%${filters.searchText}%,action_performed.ilike.%${filters.searchText}%`);
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('event_timestamp', { ascending: false });
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Search audit log entries');
    }

    return toCamelCase<SecurityAuditLogEntry[]>(data || []);
  } catch (error) {
    if (error instanceof SecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Search audit log entries');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate user role assignment
 */
export function validateUserRole(role: string): role is TransmissionRole {
  const validRoles: TransmissionRole[] = ['operator', 'engineer', 'supervisor', 'administrator', 'auditor'];
  return validRoles.includes(role as TransmissionRole);
}

/**
 * Validate user status
 */
export function validateUserStatus(status: string): status is UserStatus {
  const validStatuses: UserStatus[] = ['active', 'inactive', 'suspended'];
  return validStatuses.includes(status as UserStatus);
}

/**
 * Check if user has required role for operation
 */
export function hasRequiredRole(userRole: TransmissionRole, requiredRoles: TransmissionRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Get role hierarchy level (higher number = more privileges)
 */
export function getRoleLevel(role: TransmissionRole): number {
  const roleLevels: Record<TransmissionRole, number> = {
    'operator': 1,
    'engineer': 2,
    'supervisor': 3,
    'auditor': 3,
    'administrator': 4
  };
  return roleLevels[role] || 0;
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: TransmissionRole, targetRole: TransmissionRole): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

/**
 * Get API keys for a tenant
 */
export async function getApiKeys(
  tenantId: string
): Promise<any[]> {
  ensureSupabaseConnected();

  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase!
    .from('api_keys')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'Get API keys');
  }

  return toCamelCase(data || []);
}

/**
 * Get service principals for a tenant
 */
export async function getServicePrincipals(
  tenantId: string
): Promise<any[]> {
  ensureSupabaseConnected();

  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase!
    .from('service_principals')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (error) {
    handleSupabaseError(error, 'Get service principals');
  }

  return toCamelCase(data || []);
}