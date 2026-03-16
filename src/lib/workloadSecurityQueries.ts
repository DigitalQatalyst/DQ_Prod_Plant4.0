import { supabase, isSupabaseConfigured } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  WorkloadSecurity,
  WorkloadSecuritySummary
} from '@/types/security';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export class WorkloadSecurityQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WorkloadSecurityQueryError';
  }
}

function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new WorkloadSecurityQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new WorkloadSecurityQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new WorkloadSecurityQueryError(`${operation} failed with unknown error`, 'UNKNOWN_ERROR', error);
}

// Transform database row to WorkloadSecurity interface
function transformWorkloadSecurity(row: any): WorkloadSecurity {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    workloadName: row.workload_name,
    workloadType: row.workload_type,
    workloadDescription: row.workload_description,
    deploymentEnvironment: row.deployment_environment,
    deploymentPlatform: row.deployment_platform,
    deploymentLocation: row.deployment_location,
    status: row.status,
    healthStatus: row.health_status,
    securityBaselineId: row.security_baseline_id,
    baselineVersion: row.baseline_version,
    baselineComplianceStatus: row.baseline_compliance_status,
    baselineComplianceScore: row.baseline_compliance_score,
    lastBaselineAssessment: row.last_baseline_assessment,
    hardeningLevel: row.hardening_level,
    hardeningProfile: row.hardening_profile,
    hardeningApplied: row.hardening_applied || false,
    hardeningDate: row.hardening_date,
    hardeningStandards: row.hardening_standards || [],
    osType: row.os_type,
    osVersion: row.os_version,
    osHardeningEnabled: row.os_hardening_enabled || false,
    osHardeningControls: row.os_hardening_controls || [],
    firewallEnabled: row.firewall_enabled || false,
    firewallRulesCount: row.firewall_rules_count || 0,
    antivirusEnabled: row.antivirus_enabled || false,
    antivirusUpdated: row.antivirus_updated || false,
    antivirusLastScan: row.antivirus_last_scan,
    sshEnabled: row.ssh_enabled || false,
    sshKeyOnly: row.ssh_key_only || false,
    rdpEnabled: row.rdp_enabled || false,
    privilegedAccessRestricted: row.privileged_access_restricted || false,
    networkSegmentationEnabled: row.network_segmentation_enabled || false,
    allowedInboundPorts: row.allowed_inbound_ports || [],
    allowedOutboundPorts: row.allowed_outbound_ports || [],
    networkEncryptionEnabled: row.network_encryption_enabled || false,
    patchLevel: row.patch_level,
    lastPatchedDate: row.last_patched_date,
    pendingPatchesCount: row.pending_patches_count || 0,
    criticalPatchesPending: row.critical_patches_pending || 0,
    autoPatchingEnabled: row.auto_patching_enabled || false,
    vulnerabilityScanEnabled: row.vulnerability_scan_enabled || false,
    lastVulnerabilityScan: row.last_vulnerability_scan,
    criticalVulnerabilities: row.critical_vulnerabilities || 0,
    highVulnerabilities: row.high_vulnerabilities || 0,
    mediumVulnerabilities: row.medium_vulnerabilities || 0,
    lowVulnerabilities: row.low_vulnerabilities || 0,
    configurationManagementEnabled: row.configuration_management_enabled || false,
    configurationDriftDetected: row.configuration_drift_detected || false,
    lastConfigurationCheck: row.last_configuration_check,
    loggingEnabled: row.logging_enabled || false,
    logForwardingEnabled: row.log_forwarding_enabled || false,
    logDestination: row.log_destination,
    monitoringAgentInstalled: row.monitoring_agent_installed || false,
    monitoringAgentVersion: row.monitoring_agent_version,
    complianceFrameworks: row.compliance_frameworks || [],
    lastAuditDate: row.last_audit_date,
    nextAuditDate: row.next_audit_date,
    auditFindingsCount: row.audit_findings_count || 0,
    ownerUserId: row.owner_user_id,
    securityContact: row.security_contact,
    technicalContact: row.technical_contact,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getWorkloadSecurityList(
  tenantId: string,
  options: QueryOptions = {}
): Promise<WorkloadSecurity[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    let query = supabase
      .from('workload_security')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderDirection === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get workload security list');
    }

    return (data || []).map(transformWorkloadSecurity);
  } catch (error) {
    if (error instanceof WorkloadSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get workload security list');
  }
}

export async function getWorkloadSecurityById(
  tenantId: string,
  workloadId: string
): Promise<WorkloadSecurity | null> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return null;

    const { data, error } = await supabase
      .from('workload_security')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('id', workloadId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get workload security by ID');
    }

    return data ? transformWorkloadSecurity(data) : null;
  } catch (error) {
    if (error instanceof WorkloadSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get workload security by ID');
  }
}

export async function getWorkloadSecuritySummary(
  tenantId: string
): Promise<WorkloadSecuritySummary> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return null as any;

    const { data: workloads, error: workloadsError } = await supabase
      .from('workload_security')
      .select('health_status, baseline_compliance_score, deployment_environment, workload_type, critical_vulnerabilities, pending_patches_count, configuration_drift_detected, monitoring_agent_installed')
      .eq('tenant_id', tenantUUID);

    if (workloadsError) {
      handleSupabaseError(workloadsError, 'Get workload security for summary');
    }

    const totalWorkloads = workloads?.length || 0;
    const healthyWorkloads = workloads?.filter(w => w.health_status === 'healthy').length || 0;
    const degradedWorkloads = workloads?.filter(w => w.health_status === 'degraded').length || 0;
    const criticalWorkloads = workloads?.filter(w => w.health_status === 'critical').length || 0;
    const offlineWorkloads = workloads?.filter(w => w.health_status === 'offline').length || 0;

    const averageComplianceScore = totalWorkloads > 0
      ? Math.round(workloads.reduce((sum, w) => sum + (w.baseline_compliance_score || 0), 0) / totalWorkloads)
      : 0;

    const workloadsWithCriticalVulnerabilities = workloads?.filter(w => (w.critical_vulnerabilities || 0) > 0).length || 0;
    const workloadsWithPendingPatches = workloads?.filter(w => (w.pending_patches_count || 0) > 0).length || 0;
    const workloadsWithConfigDrift = workloads?.filter(w => w.configuration_drift_detected === true).length || 0;

    const hardeningCoverage = totalWorkloads > 0
      ? Math.round((healthyWorkloads / totalWorkloads) * 100)
      : 0;

    const monitoringCoverage = totalWorkloads > 0
      ? Math.round((workloads.filter(w => w.monitoring_agent_installed === true).length / totalWorkloads) * 100)
      : 0;

    const workloadsByEnvironment: Record<string, number> = {};
    const workloadsByType: Record<string, number> = {};

    workloads?.forEach(w => {
      workloadsByEnvironment[w.deployment_environment] = (workloadsByEnvironment[w.deployment_environment] || 0) + 1;
      workloadsByType[w.workload_type] = (workloadsByType[w.workload_type] || 0) + 1;
    });

    return {
      tenantId,
      totalWorkloads,
      healthyWorkloads,
      degradedWorkloads,
      criticalWorkloads,
      offlineWorkloads,
      averageComplianceScore,
      workloadsWithCriticalVulnerabilities,
      workloadsWithPendingPatches,
      workloadsWithConfigDrift,
      hardeningCoverage,
      monitoringCoverage,
      workloadsByEnvironment: workloadsByEnvironment as any,
      workloadsByType: workloadsByType as any,
      lastAssessment: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof WorkloadSecurityQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get workload security summary');
  }
}

export function isWorkloadSecurityQueriesAvailable(): boolean {
  return isSupabaseConfigured();
}
