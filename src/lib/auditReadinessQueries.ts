/**
 * Audit Readiness Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for audit readiness data based on compliance standards.
 * Implements RLS-aware queries with proper error handling and loading states.
 * 
 * Requirements: 4.5
 */

import { supabase, isSupabaseConfigured } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type { AuditReadiness, AuditRequirement, AuditEvidence } from '@/types/security';

/**
 * Query result wrapper with loading and error states
 */
export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Audit readiness query error class
 */
export class AuditReadinessQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AuditReadinessQueryError';
  }
}

/**
 * Ensure Supabase is connected and throw descriptive error if not
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new AuditReadinessQueryError(
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
    throw new AuditReadinessQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new AuditReadinessQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

/**
 * Calculate days until audit date
 */
function calculateDaysUntilAudit(auditDate: string | null): number {
  if (!auditDate) return -1;

  const today = new Date();
  const audit = new Date(auditDate);
  const diffTime = audit.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Determine preparation status based on compliance score and days until audit
 */
function determinePreparationStatus(complianceScore: number, daysUntilAudit: number): string {
  if (daysUntilAudit < 0) return 'overdue';
  if (complianceScore >= 90) return 'ready';
  if (complianceScore >= 70 || daysUntilAudit > 60) return 'in-progress';
  return 'not-started';
}

/**
 * Get audit readiness data for a tenant based on compliance standards
 */
export async function getAuditReadinessByTenant(tenantId: string): Promise<AuditReadiness[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    // Get compliance standards with upcoming audits
    const { data: standards, error } = await supabase!
      .from('compliance_standards')
      .select(`
        id,
        tenant_id,
        name,
        full_name,
        version,
        category,
        description,
        status,
        compliance_score,
        total_requirements,
        met_requirements,
        partial_requirements,
        unmet_requirements,
        not_applicable_requirements,
        last_assessment_date,
        last_assessment_by,
        next_audit_date,
        audit_frequency_months,
        applies_to_sites,
        applies_to_zones,
        mandatory,
        regulatory_body,
        standard_url,
        documentation_links,
        notes,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantUUID)
      .not('next_audit_date', 'is', null)
      .order('next_audit_date', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get audit readiness data');
    }

    if (!standards || standards.length === 0) {
      return [];
    }

    // Transform compliance standards into audit readiness format
    const auditReadiness: AuditReadiness[] = standards.map(standard => {
      const daysUntilAudit = calculateDaysUntilAudit(standard.next_audit_date);
      const preparationStatus = determinePreparationStatus(standard.compliance_score || 0, daysUntilAudit);

      // Determine audit type based on regulatory body and standard name
      let auditType: 'regulatory' | 'certification' | 'internal' | 'third-party' = 'internal';
      if (standard.regulatory_body) {
        auditType = 'regulatory';
      } else if (standard.name?.includes('ISO') || standard.name?.includes('IEC')) {
        auditType = 'certification';
      } else if (standard.mandatory) {
        auditType = 'regulatory';
      }

      // Generate critical gaps based on unmet requirements
      const criticalGaps: string[] = [];
      if ((standard.unmet_requirements || 0) > 0) {
        criticalGaps.push(`${standard.unmet_requirements} critical requirements not implemented`);
      }
      if ((standard.compliance_score || 0) < 70) {
        criticalGaps.push('Overall compliance score below acceptable threshold');
      }
      if (daysUntilAudit > 0 && daysUntilAudit <= 30 && (standard.compliance_score || 0) < 90) {
        criticalGaps.push('Audit approaching with insufficient preparation time');
      }

      return {
        id: standard.id,
        tenantId: standard.tenant_id,
        name: `${standard.name} Audit Preparation`,
        description: standard.description || `Audit preparation for ${standard.full_name || standard.name} compliance`,
        type: auditType,
        standard: standard.name,
        scope: {
          siteTypes: ['substation', 'grid-station', 'regional-hub'], // Transmission-specific
          assetTypes: ['transformer', 'circuit-breaker', 'protection-relay', 'rtu', 'scada-node'], // Transmission assets
          zones: standard.applies_to_zones || ['control', 'protection', 'scada', 'corporate'],
          departments: ['Operations', 'Engineering', 'Maintenance', 'Security']
        },
        scheduledDate: standard.next_audit_date || new Date().toISOString(),
        preparationStatus: preparationStatus as any,
        overallReadiness: standard.compliance_score || 0,
        requirements: [], // Will be loaded separately
        criticalGaps,
        assignedCoordinator: standard.last_assessment_by || 'Security Team',
        createdAt: standard.created_at || new Date().toISOString(),
        updatedAt: standard.updated_at || new Date().toISOString(),
        daysUntilAudit
      };
    });

    return toCamelCase<AuditReadiness[]>(auditReadiness);
  } catch (error) {
    if (error instanceof AuditReadinessQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit readiness by tenant');
  }
}

/**
 * Get audit requirements for a specific standard
 */
export async function getAuditRequirements(
  tenantId: string,
  standardId: string
): Promise<AuditRequirement[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data: requirements, error } = await supabase!
      .from('compliance_requirements')
      .select(`
        id,
        tenant_id,
        standard_id,
        requirement_id,
        title,
        description,
        category,
        status,
        implementation_percentage,
        evidence_required,
        evidence_provided,
        gaps_identified,
        assigned_to,
        due_date,
        priority,
        last_updated,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantUUID)
      .eq('standard_id', standardId)
      .order('requirement_id', { ascending: true });

    if (error) {
      handleSupabaseError(error, 'Get audit requirements');
    }

    if (!requirements) {
      return [];
    }

    // Transform compliance requirements into audit requirement format
    return requirements.map(req => ({
      id: req.id,
      code: req.requirement_id,
      title: req.title,
      description: req.description || '',
      category: mapRequirementCategory(req.category),
      status: mapRequirementStatus(req.status, req.implementation_percentage),
      evidenceStatus: req.evidence_provided ? 'available' : req.evidence_required ? 'missing' : 'not-required',
      evidenceItems: [], // Will be loaded separately if needed
      gaps: req.gaps_identified || [],
      assignedTo: req.assigned_to,
      dueDate: req.due_date,
      priority: req.priority || 'medium',
      upstreamRelevance: 'operational', // Default for transmission
      lastUpdated: req.last_updated || req.updated_at || new Date().toISOString()
    }));
  } catch (error) {
    if (error instanceof AuditReadinessQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit requirements');
  }
}

/**
 * Map database requirement category to audit requirement category
 */
function mapRequirementCategory(dbCategory: string | null): 'documentation' | 'technical-control' | 'process' | 'training' | 'evidence' {
  if (!dbCategory) return 'documentation';

  switch (dbCategory.toLowerCase()) {
    case 'technical':
    case 'technical-control':
    case 'control':
      return 'technical-control';
    case 'process':
    case 'procedural':
      return 'process';
    case 'training':
    case 'awareness':
      return 'training';
    case 'evidence':
    case 'audit':
      return 'evidence';
    default:
      return 'documentation';
  }
}

/**
 * Map database requirement status to audit requirement status
 */
function mapRequirementStatus(
  dbStatus: string | null,
  implementationPercentage: number | null
): 'complete' | 'in-progress' | 'not-started' | 'gap-identified' {
  if (!dbStatus) return 'not-started';

  switch (dbStatus.toLowerCase()) {
    case 'compliant':
    case 'implemented':
    case 'complete':
      return 'complete';
    case 'in-progress':
    case 'partial':
      return 'in-progress';
    case 'non-compliant':
    case 'gap':
    case 'failed':
      return 'gap-identified';
    case 'not-applicable':
    case 'not-started':
    default:
      return 'not-started';
  }
}

/**
 * Get audit evidence for a specific requirement
 */
export async function getAuditEvidence(
  tenantId: string,
  requirementId: string
): Promise<AuditEvidence[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data: evidence, error } = await supabase!
      .from('compliance_evidence')
      .select(`
        id,
        tenant_id,
        requirement_id,
        evidence_type,
        evidence_name,
        evidence_description,
        file_path,
        file_size,
        file_format,
        status,
        collected_date,
        collected_by,
        verified_date,
        verified_by,
        expiration_date,
        metadata,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantUUID)
      .eq('requirement_id', requirementId)
      .order('collected_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get audit evidence');
    }

    if (!evidence) {
      return [];
    }

    // Transform compliance evidence into audit evidence format
    return evidence.map(ev => ({
      id: ev.id,
      type: mapEvidenceType(ev.evidence_type),
      name: ev.evidence_name,
      description: ev.evidence_description || '',
      location: ev.file_path || 'Not specified',
      status: mapEvidenceStatus(ev.status),
      lastUpdated: ev.updated_at || ev.created_at || new Date().toISOString(),
      size: ev.file_size ? formatFileSize(ev.file_size) : undefined,
      format: ev.file_format || undefined
    }));
  } catch (error) {
    if (error instanceof AuditReadinessQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get audit evidence');
  }
}

/**
 * Map database evidence type to audit evidence type
 */
function mapEvidenceType(dbType: string | null): 'document' | 'screenshot' | 'log-export' | 'configuration' | 'certificate' | 'report' {
  if (!dbType) return 'document';

  switch (dbType.toLowerCase()) {
    case 'screenshot':
    case 'image':
      return 'screenshot';
    case 'log':
    case 'log-export':
    case 'logs':
      return 'log-export';
    case 'configuration':
    case 'config':
    case 'settings':
      return 'configuration';
    case 'certificate':
    case 'cert':
    case 'key':
      return 'certificate';
    case 'report':
    case 'assessment':
    case 'scan':
      return 'report';
    default:
      return 'document';
  }
}

/**
 * Map database evidence status to audit evidence status
 */
function mapEvidenceStatus(dbStatus: string | null): 'available' | 'missing' | 'outdated' | 'under-review' {
  if (!dbStatus) return 'missing';

  switch (dbStatus.toLowerCase()) {
    case 'available':
    case 'verified':
    case 'approved':
      return 'available';
    case 'outdated':
    case 'expired':
      return 'outdated';
    case 'under-review':
    case 'pending':
    case 'reviewing':
      return 'under-review';
    default:
      return 'missing';
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}