/**
 * Compliance Queries for Power Transmission Cybersecurity
 * 
 * Provides typed Supabase queries for compliance standards, controls, policies,
 * exceptions, and risk management operations.
 * Implements RLS-aware queries with proper error handling and loading states.
 * 
 * Requirements: 4.1, 4.2, 4.3, 8.1
 */

import { supabase, isSupabaseConfigured, getDataBackend } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  ComplianceStandard,
  ComplianceRequirement,
  ComplianceEvidence,
  SecurityControl,
  ControlImplementation,
  ControlTestResult,
  TransmissionSecurityPolicy,
  PolicyVersion,
  PolicyAcknowledgment,
  PolicyViolation,
  SecurityException,
  ExceptionReview,
  ExceptionExtension,
  ExceptionIncident,
  SecurityRisk,
  RiskAssessment,
  RiskMitigationAction,
  RiskMonitoringEvent,
  ComplianceStandardStatus,
  ControlImplementationStatus,
  SecurityPolicyStatus,
  ExceptionStatus,
  SecurityRiskStatus
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
 * Compliance query error class
 */
export class ComplianceQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ComplianceQueryError';
  }
}

/**
 * Ensure Supabase is connected and throw descriptive error if not
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new ComplianceQueryError(
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
    throw new ComplianceQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new ComplianceQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Compliance Standards
// ============================================================================

/**
 * Get all compliance standards for a tenant
 */
export async function getComplianceStandards(
  tenantId: string,
  options: QueryOptions = {}
): Promise<ComplianceStandard[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
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
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('name', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get compliance standards');
    }

    // Map database fields to TypeScript interface
    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      fullName: row.full_name,
      version: row.version,
      category: row.category,
      description: row.description,
      status: row.status,
      complianceScore: parseFloat(row.compliance_score) || 0,
      totalRequirements: row.total_requirements,
      metRequirements: row.met_requirements,
      partialRequirements: row.partial_requirements,
      unmetRequirements: row.unmet_requirements,
      notApplicableRequirements: row.not_applicable_requirements,
      lastAssessmentDate: row.last_assessment_date,
      lastAssessmentBy: row.last_assessment_by,
      nextAuditDate: row.next_audit_date,
      auditFrequencyMonths: row.audit_frequency_months,
      appliesToSites: row.applies_to_sites,
      appliesToZones: row.applies_to_zones,
      mandatory: row.mandatory,
      regulatoryBody: row.regulatory_body,
      standardUrl: row.standard_url,
      documentationLinks: row.documentation_links,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Legacy fields for backward compatibility
      lastAudit: row.last_assessment_date,
      nextAudit: row.next_audit_date,
      requirements: [] // Will be loaded separately if needed
    }));
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get compliance standards');
  }
}

/**
 * Get a single compliance standard by ID
 */
export async function getComplianceStandardById(
  tenantId: string,
  standardId: string
): Promise<ComplianceStandard | null> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
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
      .eq('id', standardId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get compliance standard by ID');
    }

    if (!data) {
      return null;
    }

    // Map database fields to TypeScript interface
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      fullName: data.full_name,
      version: data.version,
      category: data.category,
      description: data.description,
      status: data.status,
      complianceScore: parseFloat(data.compliance_score) || 0,
      totalRequirements: data.total_requirements,
      metRequirements: data.met_requirements,
      partialRequirements: data.partial_requirements,
      unmetRequirements: data.unmet_requirements,
      notApplicableRequirements: data.not_applicable_requirements,
      lastAssessmentDate: data.last_assessment_date,
      lastAssessmentBy: data.last_assessment_by,
      nextAuditDate: data.next_audit_date,
      auditFrequencyMonths: data.audit_frequency_months,
      appliesToSites: data.applies_to_sites,
      appliesToZones: data.applies_to_zones,
      mandatory: data.mandatory,
      regulatoryBody: data.regulatory_body,
      standardUrl: data.standard_url,
      documentationLinks: data.documentation_links,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      // Legacy fields for backward compatibility
      lastAudit: data.last_assessment_date,
      nextAudit: data.next_audit_date,
      requirements: [] // Will be loaded separately if needed
    };
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get compliance standard by ID');
  }
}

/**
 * Get compliance requirements for a standard
 */
export async function getComplianceRequirements(
  tenantId: string,
  standardId: string,
  options: QueryOptions = {}
): Promise<ComplianceRequirement[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('compliance_requirements')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('standard_id', standardId);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('requirement_id', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get compliance requirements');
    }

    return toCamelCase<ComplianceRequirement[]>(data || []);
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get compliance requirements');
  }
}

/**
 * Create a new compliance standard
 */
export async function createComplianceStandard(
  tenantId: string,
  standard: Omit<ComplianceStandard, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<ComplianceStandard> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    const { data, error } = await supabase!
      .from('compliance_standards')
      .insert({
        tenant_id: tenantUUID,
        ...standard
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create compliance standard');
    }

    return data!;
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create compliance standard');
  }
}

/**
 * Update a compliance standard
 */
export async function updateComplianceStandard(
  tenantId: string,
  standardId: string,
  updates: Partial<ComplianceStandard>
): Promise<ComplianceStandard> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    const { data, error } = await supabase!
      .from('compliance_standards')
      .update(updates)
      .eq('tenant_id', tenantUUID)
      .eq('id', standardId)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Update compliance standard');
    }

    return data!;
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Update compliance standard');
  }
}

// ============================================================================
// Security Controls
// ============================================================================

/**
 * Get all security controls for a tenant
 */
export async function getSecurityControls(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityControl[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_controls')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('control_id', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security controls');
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      standardId: row.standard_id,
      code: row.control_id,
      title: row.control_name,
      // Comprehensive mapping for UI
      controlId: row.control_id,
      controlName: row.control_name,
      controlDescription: row.control_description,
      controlType: row.control_type,
      domain: row.domain,
      description: row.control_description,
      category: row.category,
      implementationStatus: row.implementation_status,
      implementationPercentage: row.implementation_percentage || 0,
      effectivenessScore: row.effectiveness_score || 0,
      effectiveness: row.effectiveness,
      lastAssessmentDate: row.last_assessment_date,
      iec62443Mapping: row.iec_62443_mapping,
      nercCipMapping: row.nerc_cip_mapping,
      nistCsfMapping: row.nist_csf_mapping,
      appliesToAssetTypes: row.applies_to_asset_types || [],
      applicableSiteTypes: row.applies_to_asset_types || [],
      appliesToZones: row.applies_to_zones || [],
      applicableZones: row.applies_to_zones || [],
      appliesToProtocols: row.applies_to_protocols || [],
      implementationApproach: row.implementation_approach,
      implementationDate: row.implementation_date,
      responsibleParty: row.responsible_party,
      implementationCostEstimate: row.implementation_cost_estimate,
      implementationEffortHours: row.implementation_effort_hours,
      testingRequired: row.testing_required,
      testingFrequencyDays: row.testing_frequency_days,
      lastTested: row.last_tested,
      upstreamRelevance: row.criticality === 'safety-critical' ? 'critical' : row.criticality === 'production-critical' ? 'high' : 'medium',
      criticality: row.criticality, // Expose raw criticality for UI badges
      coveragePercentage: row.implementation_percentage || 0
    })) as unknown as SecurityControl[];
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security controls');
  }
}

/**
 * Get security controls by standard
 */
export async function getSecurityControlsByStandard(
  tenantId: string,
  standardId: string,
  options: QueryOptions = {}
): Promise<SecurityControl[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_controls')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('standard_id', standardId);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('control_id', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security controls by standard');
    }

    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      standardId: row.standard_id,
      code: row.control_id,
      title: row.control_name,
      // Comprehensive mapping for UI
      controlId: row.control_id,
      controlName: row.control_name,
      controlDescription: row.control_description,
      controlType: row.control_type,
      domain: row.domain,
      description: row.control_description,
      category: row.category,
      implementationStatus: row.implementation_status,
      implementationPercentage: row.implementation_percentage || 0,
      effectivenessScore: row.effectiveness_score || 0,
      effectiveness: row.effectiveness,
      lastAssessmentDate: row.last_assessment_date,
      iec62443Mapping: row.iec_62443_mapping,
      nercCipMapping: row.nerc_cip_mapping,
      nistCsfMapping: row.nist_csf_mapping,
      appliesToAssetTypes: row.applies_to_asset_types || [],
      applicableSiteTypes: row.applies_to_asset_types || [],
      appliesToZones: row.applies_to_zones || [],
      applicableZones: row.applies_to_zones || [],
      appliesToProtocols: row.applies_to_protocols || [],
      implementationApproach: row.implementation_approach,
      implementationDate: row.implementation_date,
      responsibleParty: row.responsible_party,
      implementationCostEstimate: row.implementation_cost_estimate,
      implementationEffortHours: row.implementation_effort_hours,
      testingRequired: row.testing_required,
      testingFrequencyDays: row.testing_frequency_days,
      lastTested: row.last_tested,
      upstreamRelevance: row.criticality === 'safety-critical' ? 'critical' : row.criticality === 'production-critical' ? 'high' : 'medium',
      criticality: row.criticality,
      coveragePercentage: row.implementation_percentage || 0
    })) as unknown as SecurityControl[];
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security controls by standard');
  }
}

/**
 * Create a new security control
 */
export async function createSecurityControl(
  tenantId: string,
  control: Omit<SecurityControl, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<SecurityControl> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    const { data, error } = await supabase!
      .from('security_controls')
      .insert({
        tenant_id: tenantUUID,
        ...control
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security control');
    }

    return data!;
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security control');
  }
}

// ============================================================================
// Security Policies
// ============================================================================

/**
 * Get all security policies for a tenant
 */
export async function getSecurityPolicies(
  tenantId: string,
  options: QueryOptions = {}
): Promise<TransmissionSecurityPolicy[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_policies')
      .select(`
        id,
        tenant_id,
        policy_id,
        policy_name,
        policy_description,
        policy_type,
        version,
        version_date,
        previous_version_id,
        superseded_by_id,
        status,
        effective_date,
        review_date,
        expiration_date,
        review_frequency_months,
        scope,
        enforcement_level,
        applies_to_sites,
        applies_to_zones,
        applies_to_roles,
        applies_to_asset_types,
        policy_statement,
        purpose,
        objectives,
        requirements,
        procedures,
        exceptions_allowed,
        exception_criteria,
        related_standards,
        related_controls,
        regulatory_requirements,
        created_by,
        reviewed_by,
        approved_by,
        review_date_actual,
        approval_date,
        approval_notes,
        policy_owner,
        policy_owner_role,
        responsible_parties,
        document_url,
        document_version,
        related_documents,
        training_required,
        training_materials,
        compliance_mandatory,
        compliance_tracking_enabled,
        last_compliance_check,
        compliance_rate,
        tags,
        notes,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('policy_id', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security policies');
    }

    // Map database fields to TypeScript interface
    return (data || []).map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      policyId: row.policy_id,
      policyName: row.policy_name,
      policyDescription: row.policy_description,
      policyType: row.policy_type,
      version: row.version,
      versionDate: row.version_date,
      previousVersionId: row.previous_version_id,
      supersededById: row.superseded_by_id,
      status: row.status,
      effectiveDate: row.effective_date,
      reviewDate: row.review_date,
      expirationDate: row.expiration_date,
      reviewFrequencyMonths: row.review_frequency_months || 12,
      scope: row.scope,
      enforcementLevel: row.enforcement_level,
      appliesToSites: row.applies_to_sites,
      appliesToZones: row.applies_to_zones,
      appliesToRoles: row.applies_to_roles,
      appliesToAssetTypes: row.applies_to_asset_types,
      policyStatement: row.policy_statement,
      purpose: row.purpose,
      objectives: row.objectives,
      requirements: row.requirements,
      procedures: row.procedures,
      exceptionsAllowed: row.exceptions_allowed || false,
      exceptionCriteria: row.exception_criteria,
      relatedStandards: row.related_standards,
      relatedControls: row.related_controls,
      regulatoryRequirements: row.regulatory_requirements,
      createdBy: row.created_by,
      reviewedBy: row.reviewed_by,
      approvedBy: row.approved_by,
      reviewDateActual: row.review_date_actual,
      approvalDate: row.approval_date,
      approvalNotes: row.approval_notes,
      policyOwner: row.policy_owner,
      policyOwnerRole: row.policy_owner_role,
      responsibleParties: row.responsible_parties,
      documentUrl: row.document_url,
      documentVersion: row.document_version,
      relatedDocuments: row.related_documents,
      trainingRequired: row.training_required || false,
      trainingMaterials: row.training_materials,
      complianceMandatory: row.compliance_mandatory || true,
      complianceTrackingEnabled: row.compliance_tracking_enabled || true,
      lastComplianceCheck: row.last_compliance_check,
      complianceRate: parseFloat(row.compliance_rate) || 0,
      tags: row.tags,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security policies');
  }
}

/**
 * Get active security policies
 */
export async function getActiveSecurityPolicies(
  tenantId: string,
  options: QueryOptions = {}
): Promise<TransmissionSecurityPolicy[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_policies')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', 'active');

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('policy_name', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get active security policies');
    }

    return toCamelCase<TransmissionSecurityPolicy[]>(data || []);
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get active security policies');
  }
}

/**
 * Create a new security policy
 */
export async function createSecurityPolicy(
  tenantId: string,
  policy: Omit<TransmissionSecurityPolicy, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<TransmissionSecurityPolicy> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    const { data, error } = await supabase!
      .from('security_policies')
      .insert({
        tenant_id: tenantUUID,
        ...policy
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security policy');
    }

    return data!;
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security policy');
  }
}

// ============================================================================
// Security Exceptions
// ============================================================================

/**
 * Get all security exceptions for a tenant
 */
/**
 * Get all security exceptions for a tenant
 */
export async function getSecurityExceptions(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityException[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_exceptions')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('request_date', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security exceptions');
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      exceptionId: row.exception_id,
      exceptionName: row.exception_name,
      exceptionType: row.exception_type,
      policyId: row.policy_id,
      controlId: row.control_id,
      requirementId: row.requirement_id,
      standardId: row.standard_id,
      scope: row.scope,
      appliesToSites: row.applies_to_sites,
      appliesToZones: row.applies_to_zones,
      appliesToAssets: row.applies_to_assets,
      appliesToUsers: row.applies_to_users,
      requestedBy: row.requested_by,
      requestDate: row.request_date,
      businessJustification: row.business_justification,
      technicalJustification: row.technical_justification,
      alternativeControls: row.alternative_controls,
      riskLevel: row.risk_level,
      riskDescription: row.risk_description,
      riskMitigationMeasures: row.risk_mitigation_measures,
      residualRiskLevel: row.residual_risk_level,
      residualRiskDescription: row.residual_risk_description,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewDate: row.review_date,
      reviewComments: row.review_comments,
      approvedBy: row.approved_by,
      approvalDate: row.approval_date,
      approvalConditions: row.approval_conditions,
      denialReason: row.denial_reason,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      autoExpire: row.auto_expire,
      extensionAllowed: row.extension_allowed,
      maxExtensions: row.max_extensions,
      extensionsUsed: row.extensions_used,
      requiresMonitoring: row.requires_monitoring,
      monitoringFrequencyDays: row.monitoring_frequency_days,
      lastMonitored: row.last_monitored,
      nextMonitoringDate: row.next_monitoring_date,
      complianceStatus: row.compliance_status,
      compensatingControlsRequired: row.compensating_controls_required,
      compensatingControls: row.compensating_controls,
      compensatingControlsImplemented: row.compensating_controls_implemented,
      compensatingControlsVerified: row.compensating_controls_verified,
      revoked: row.revoked,
      revokedBy: row.revoked_by,
      revocationDate: row.revocation_date,
      revocationReason: row.revocation_reason,
      auditLog: row.audit_log,
      tags: row.tags,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security exceptions');
  }
}

/**
 * Get active security exceptions
 */
export async function getActiveSecurityExceptions(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityException[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_exceptions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('status', 'active');

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('expiration_date', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get active security exceptions');
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      exceptionId: row.exception_id,
      exceptionName: row.exception_name,
      exceptionType: row.exception_type,
      policyId: row.policy_id,
      controlId: row.control_id,
      requirementId: row.requirement_id,
      standardId: row.standard_id,
      scope: row.scope,
      appliesToSites: row.applies_to_sites,
      appliesToZones: row.applies_to_zones,
      appliesToAssets: row.applies_to_assets,
      appliesToUsers: row.applies_to_users,
      requestedBy: row.requested_by,
      requestDate: row.request_date,
      businessJustification: row.business_justification,
      technicalJustification: row.technical_justification,
      alternativeControls: row.alternative_controls,
      riskLevel: row.risk_level,
      riskDescription: row.risk_description,
      riskMitigationMeasures: row.risk_mitigation_measures,
      residualRiskLevel: row.residual_risk_level,
      residualRiskDescription: row.residual_risk_description,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewDate: row.review_date,
      reviewComments: row.review_comments,
      approvedBy: row.approved_by,
      approvalDate: row.approval_date,
      approvalConditions: row.approval_conditions,
      denialReason: row.denial_reason,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      autoExpire: row.auto_expire,
      extensionAllowed: row.extension_allowed,
      maxExtensions: row.max_extensions,
      extensionsUsed: row.extensions_used,
      requiresMonitoring: row.requires_monitoring,
      monitoringFrequencyDays: row.monitoring_frequency_days,
      lastMonitored: row.last_monitored,
      nextMonitoringDate: row.next_monitoring_date,
      complianceStatus: row.compliance_status,
      compensatingControlsRequired: row.compensating_controls_required,
      compensatingControls: row.compensating_controls,
      compensatingControlsImplemented: row.compensating_controls_implemented,
      compensatingControlsVerified: row.compensating_controls_verified,
      revoked: row.revoked,
      revokedBy: row.revoked_by,
      revocationDate: row.revocation_date,
      revocationReason: row.revocation_reason,
      auditLog: row.audit_log,
      tags: row.tags,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get active security exceptions');
  }
}

/**
 * Create a new security exception
 */
export async function createSecurityException(
  tenantId: string,
  exception: Omit<SecurityException, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<SecurityException> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    // Map camelCase to snake_case for database insert
    const dbPayload = {
      tenant_id: tenantUUID,
      exception_id: exception.exceptionId,
      exception_name: exception.exceptionName,
      exception_type: exception.exceptionType,
      policy_id: exception.policyId,
      control_id: exception.controlId,
      requirement_id: exception.requirementId,
      standard_id: exception.standardId,
      scope: exception.scope,
      applies_to_sites: exception.appliesToSites,
      applies_to_zones: exception.appliesToZones,
      applies_to_assets: exception.appliesToAssets,
      applies_to_users: exception.appliesToUsers,
      requested_by: exception.requestedBy,
      request_date: exception.requestDate,
      business_justification: exception.businessJustification,
      technical_justification: exception.technicalJustification,
      alternative_controls: exception.alternativeControls,
      risk_level: exception.riskLevel,
      risk_description: exception.riskDescription,
      risk_mitigation_measures: exception.riskMitigationMeasures,
      residual_risk_level: exception.residualRiskLevel,
      residual_risk_description: exception.residualRiskDescription,
      status: exception.status,
      reviewed_by: exception.reviewedBy,
      review_date: exception.reviewDate,
      review_comments: exception.reviewComments,
      approved_by: exception.approvedBy,
      approval_date: exception.approvalDate,
      approval_conditions: exception.approvalConditions,
      denial_reason: exception.denialReason,
      effective_date: exception.effectiveDate,
      expiration_date: exception.expirationDate,
      auto_expire: exception.autoExpire,
      extension_allowed: exception.extensionAllowed,
      max_extensions: exception.maxExtensions,
      extensions_used: exception.extensionsUsed,
      requires_monitoring: exception.requiresMonitoring,
      monitoring_frequency_days: exception.monitoringFrequencyDays,
      last_monitored: exception.lastMonitored,
      next_monitoring_date: exception.nextMonitoringDate,
      compliance_status: exception.complianceStatus,
      compensating_controls_required: exception.compensatingControlsRequired,
      compensating_controls: exception.compensatingControls,
      compensating_controls_implemented: exception.compensatingControlsImplemented,
      compensating_controls_verified: exception.compensatingControlsVerified,
      revoked: exception.revoked,
      revoked_by: exception.revokedBy,
      revocation_date: exception.revocationDate,
      revocation_reason: exception.revocationReason,
      audit_log: exception.auditLog,
      tags: exception.tags,
      notes: exception.notes
    };

    const { data, error } = await supabase!
      .from('security_exceptions')
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security exception');
    }

    // Map response back to camelCase
    const row = data!;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      exceptionId: row.exception_id,
      exceptionName: row.exception_name,
      exceptionType: row.exception_type,
      policyId: row.policy_id,
      controlId: row.control_id,
      requirementId: row.requirement_id,
      standardId: row.standard_id,
      scope: row.scope,
      appliesToSites: row.applies_to_sites,
      appliesToZones: row.applies_to_zones,
      appliesToAssets: row.applies_to_assets,
      appliesToUsers: row.applies_to_users,
      requestedBy: row.requested_by,
      requestDate: row.request_date,
      businessJustification: row.business_justification,
      technicalJustification: row.technical_justification,
      alternativeControls: row.alternative_controls,
      riskLevel: row.risk_level,
      riskDescription: row.risk_description,
      riskMitigationMeasures: row.risk_mitigation_measures,
      residualRiskLevel: row.residual_risk_level,
      residualRiskDescription: row.residual_risk_description,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewDate: row.review_date,
      reviewComments: row.review_comments,
      approvedBy: row.approved_by,
      approvalDate: row.approval_date,
      approvalConditions: row.approval_conditions,
      denialReason: row.denial_reason,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      autoExpire: row.auto_expire,
      extensionAllowed: row.extension_allowed,
      maxExtensions: row.max_extensions,
      extensionsUsed: row.extensions_used,
      requiresMonitoring: row.requires_monitoring,
      monitoringFrequencyDays: row.monitoring_frequency_days,
      lastMonitored: row.last_monitored,
      nextMonitoringDate: row.next_monitoring_date,
      complianceStatus: row.compliance_status,
      compensatingControlsRequired: row.compensating_controls_required,
      compensatingControls: row.compensating_controls,
      compensatingControlsImplemented: row.compensating_controls_implemented,
      compensatingControlsVerified: row.compensating_controls_verified,
      revoked: row.revoked,
      revokedBy: row.revoked_by,
      revocationDate: row.revocation_date,
      revocationReason: row.revocation_reason,
      auditLog: row.audit_log,
      tags: row.tags,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security exception');
  }
}

// ============================================================================
// Security Risks
// ============================================================================

/**
 * Get all security risks for a tenant
 */
export async function getSecurityRisks(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityRisk[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_risks')
      .select('*')
      .eq('tenant_id', tenantUUID);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('inherent_risk_score', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get security risks');
    }

    return data || [];
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get security risks');
  }
}

/**
 * Get high and critical risks
 */
export async function getHighCriticalRisks(
  tenantId: string,
  options: QueryOptions = {}
): Promise<SecurityRisk[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('security_risks')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .in('inherent_risk_level', ['high', 'critical']);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('inherent_risk_score', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get high and critical risks');
    }

    return data || [];
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get high and critical risks');
  }
}

/**
 * Get risk mitigation actions for a risk
 */
export async function getRiskMitigationActions(
  tenantId: string,
  riskId: string,
  options: QueryOptions = {}
): Promise<RiskMitigationAction[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    let query = supabase!
      .from('risk_mitigation_actions')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('risk_id', riskId);

    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc'
      });
    } else {
      query = query.order('priority', { ascending: true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError(error, 'Get risk mitigation actions');
    }

    return data || [];
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get risk mitigation actions');
  }
}

/**
 * Create a new security risk
 */
export async function createSecurityRisk(
  tenantId: string,
  risk: Omit<SecurityRisk, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
): Promise<SecurityRisk> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      throw new ComplianceQueryError('Invalid tenant ID', 'INVALID_TENANT');
    }

    const { data, error } = await supabase!
      .from('security_risks')
      .insert({
        tenant_id: tenantUUID,
        ...risk
      })
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, 'Create security risk');
    }

    return data!;
  } catch (error) {
    if (error instanceof ComplianceQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Create security risk');
  }
}
