/**
 * Control Coverage Queries for Power Transmission Cybersecurity
 * 
 * Provides queries for control coverage assessments, gap analysis, and compliance tracking.
 * Implements IEC 62443 and NERC CIP control coverage monitoring.
 * Requirements: 1.3, 4.1, 4.2
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type {
  ControlCoverageAssessment,
  ControlCoverageDetail,
  ControlCoverageSummary,
  ControlsByStandard,
  GapAnalysis,
  GapDetail,
  GapSeverity,
  RemediationStatus
} from '@/types/security';
import { mapTenantIdToUUID } from './tenantMapping';

/**
 * Control coverage query error class
 */
export class ControlCoverageQueryError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ControlCoverageQueryError';
  }
}

/**
 * Ensure Supabase is connected
 */
function ensureSupabaseConnected(): void {
  if (!isSupabaseConfigured() || !supabase) {
    throw new ControlCoverageQueryError(
      'Supabase client not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}

/**
 * Handle Supabase query errors
 */
function handleSupabaseError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new ControlCoverageQueryError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new ControlCoverageQueryError(`${operation} failed: Unknown error`, 'UNKNOWN_ERROR', error);
}

// ============================================================================
// Control Coverage Assessment Queries
// ============================================================================

/**
 * Get all control coverage assessments for a tenant
 */
export async function getControlCoverageAssessments(
  tenantId: string
): Promise<ControlCoverageAssessment[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('control_coverage_assessments')
      .select(`
        *,
        sites (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantUUID)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get control coverage assessments');
    }

    return (data || []).map(assessment => ({
      id: assessment.id,
      tenantId: assessment.tenant_id,
      siteId: assessment.site_id,
      siteName: assessment.sites?.name,
      assessmentName: assessment.assessment_name,
      assessmentDate: assessment.assessment_date,
      assessor: assessment.assessor,
      assessmentType: assessment.assessment_type,
      standardName: assessment.standard_name,
      standardVersion: assessment.standard_version,
      totalControls: assessment.total_controls,
      implementedControls: assessment.implemented_controls,
      partialControls: assessment.partial_controls,
      notImplementedControls: assessment.not_implemented_controls,
      notApplicableControls: assessment.not_applicable_controls,
      coverageScore: assessment.coverage_score,
      effectivenessScore: assessment.effectiveness_score,
      maturityLevel: assessment.maturity_level,
      status: assessment.status,
      complianceStatus: assessment.compliance_status,
      criticalGaps: assessment.critical_gaps,
      highGaps: assessment.high_gaps,
      mediumGaps: assessment.medium_gaps,
      lowGaps: assessment.low_gaps,
      gapSummary: assessment.gap_summary,
      remediationPlan: assessment.remediation_plan,
      targetCompletionDate: assessment.target_completion_date,
      nextAssessmentDate: assessment.next_assessment_date,
      notes: assessment.notes,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at
    }));
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get control coverage assessments');
  }
}

/**
 * Get control coverage assessment by ID
 */
export async function getControlCoverageAssessmentById(
  tenantId: string,
  assessmentId: string
): Promise<ControlCoverageAssessment | null> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return null;
    }

    const { data, error } = await supabase!
      .from('control_coverage_assessments')
      .select(`
        *,
        sites (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantUUID)
      .eq('id', assessmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      handleSupabaseError(error, 'Get control coverage assessment by ID');
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      siteId: data.site_id,
      siteName: data.sites?.name,
      assessmentName: data.assessment_name,
      assessmentDate: data.assessment_date,
      assessor: data.assessor,
      assessmentType: data.assessment_type,
      standardName: data.standard_name,
      standardVersion: data.standard_version,
      totalControls: data.total_controls,
      implementedControls: data.implemented_controls,
      partialControls: data.partial_controls,
      notImplementedControls: data.not_implemented_controls,
      notApplicableControls: data.not_applicable_controls,
      coverageScore: data.coverage_score,
      effectivenessScore: data.effectiveness_score,
      maturityLevel: data.maturity_level,
      status: data.status,
      complianceStatus: data.compliance_status,
      criticalGaps: data.critical_gaps,
      highGaps: data.high_gaps,
      mediumGaps: data.medium_gaps,
      lowGaps: data.low_gaps,
      gapSummary: data.gap_summary,
      remediationPlan: data.remediation_plan,
      targetCompletionDate: data.target_completion_date,
      nextAssessmentDate: data.next_assessment_date,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get control coverage assessment by ID');
  }
}

/**
 * Get control coverage details for an assessment
 */
export async function getControlCoverageDetails(
  tenantId: string,
  assessmentId: string
): Promise<ControlCoverageDetail[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('control_coverage_details')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('assessment_id', assessmentId)
      .order('control_id'); // Original was 'control_id', instruction changed to 'control_code' but that's not in the type. Reverting to 'control_id'.

    if (error) {
      handleSupabaseError(error, 'Get control coverage details');
    }

    return (data || []).map(detail => ({
      id: detail.id,
      assessmentId: detail.assessment_id,
      tenantId: detail.tenant_id,
      controlId: detail.control_id,
      controlName: detail.control_name,
      controlDescription: detail.control_description,
      controlCategory: detail.control_category,
      implementationStatus: detail.implementation_status,
      effectiveness: detail.effectiveness,
      evidence: detail.evidence,
      validationMethod: detail.validation_method,
      lastValidated: detail.last_validated,
      gapSeverity: detail.gap_severity,
      gapDescription: detail.gap_description,
      remediationAction: detail.remediation_action,
      remediationOwner: detail.remediation_owner,
      remediationDueDate: detail.remediation_due_date,
      remediationStatus: detail.remediation_status,
      notes: detail.notes,
      createdAt: detail.created_at,
      updatedAt: detail.updated_at
    }));
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get control coverage details');
  }
}

/**
 * Get control coverage summaries for dashboard
 */
export async function getControlCoverageSummaries(
  tenantId: string
): Promise<ControlCoverageSummary[]> {
  ensureSupabaseConnected();

  try {
    // Map frontend tenant ID to Supabase UUID
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) {
      return [];
    }

    const { data, error } = await supabase!
      .from('control_coverage_assessments')
      .select(`
          id,
          assessment_name,
          standard_name,
          site_id,
          assessment_date,
          coverage_score,
          effectiveness_score,
          status,
          compliance_status,
          total_controls,
          implemented_controls,
          critical_gaps,
          high_gaps,
          next_assessment_date,
          sites (
            name
          )
        `)
      .eq('tenant_id', tenantUUID)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get control coverage summaries');
    }

    return (data || []).map(summary => ({
      assessmentId: summary.id,
      assessmentName: summary.assessment_name,
      standardName: summary.standard_name,
      siteId: summary.site_id,
      siteName: Array.isArray(summary.sites) ? (summary.sites as any)[0]?.name : (summary.sites as any)?.name,
      assessmentDate: summary.assessment_date,
      coverageScore: summary.coverage_score,
      effectivenessScore: summary.effectiveness_score,
      status: summary.status,
      complianceStatus: summary.compliance_status,
      totalControls: summary.total_controls,
      implementedControls: summary.implemented_controls,
      criticalGaps: summary.critical_gaps,
      highGaps: summary.high_gaps,
      next_assessment_date: summary.next_assessment_date
    }));
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get control coverage summaries');
  }
}

/**
 * Get controls grouped by standard
 */
export async function getControlsByStandard(
  tenantId: string
): Promise<ControlsByStandard[]> {
  ensureSupabaseConnected();

  try {
    // Get all assessments
    const assessments = await getControlCoverageAssessments(tenantId);

    // Group by standard
    const standardsMap = new Map<string, ControlsByStandard>();

    for (const assessment of assessments) {
      const key = `${assessment.standardName}-${assessment.standardVersion || ''}`;

      if (!standardsMap.has(key)) {
        standardsMap.set(key, {
          standardName: assessment.standardName,
          standardVersion: assessment.standardVersion,
          assessmentCount: 0,
          averageCoverageScore: 0,
          averageEffectivenessScore: 0,
          totalControls: 0,
          implementedControls: 0,
          partialControls: 0,
          notImplementedControls: 0,
          criticalGaps: 0,
          highGaps: 0,
          controls: []
        });
      }

      const standard = standardsMap.get(key)!;
      standard.assessmentCount++;
      standard.averageCoverageScore += assessment.coverageScore;
      standard.averageEffectivenessScore += assessment.effectivenessScore;
      standard.totalControls += assessment.totalControls;
      standard.implementedControls += assessment.implementedControls;
      standard.partialControls += assessment.partialControls;
      standard.notImplementedControls += assessment.notImplementedControls;
      standard.criticalGaps += assessment.criticalGaps;
      standard.highGaps += assessment.highGaps;

      // Get controls for this assessment
      const controls = await getControlCoverageDetails(tenantId, assessment.id);
      standard.controls.push(...controls);
    }

    // Calculate averages
    const result: ControlsByStandard[] = [];
    for (const standard of standardsMap.values()) {
      if (standard.assessmentCount > 0) {
        standard.averageCoverageScore = Math.round(standard.averageCoverageScore / standard.assessmentCount);
        standard.averageEffectivenessScore = Math.round(standard.averageEffectivenessScore / standard.assessmentCount);
      }
      result.push(standard);
    }

    return result;
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get controls by standard');
  }
}

/**
 * Get gap analysis for an assessment
 */
export async function getGapAnalysis(
  tenantId: string,
  assessmentId: string
): Promise<GapAnalysis | null> {
  ensureSupabaseConnected();

  try {
    const assessment = await getControlCoverageAssessmentById(tenantId, assessmentId);
    if (!assessment) {
      return null;
    }

    const details = await getControlCoverageDetails(tenantId, assessmentId);

    const criticalGaps: GapDetail[] = [];
    const highGaps: GapDetail[] = [];
    const mediumGaps: GapDetail[] = [];
    const lowGaps: GapDetail[] = [];

    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    let deferred = 0;

    for (const detail of details) {
      // Only consider details with a valid gap severity (not null, undefined, or 'none')
      const severityStr = detail.gapSeverity as string;
      if (severityStr && severityStr !== 'none') {
        const mappedRemediationStatus = (detail.remediationStatus as string) === 'not-started' ? 'pending' : (detail.remediationStatus || 'pending');

        const gap: GapDetail = {
          controlId: detail.controlId,
          controlName: detail.controlName,
          controlCategory: detail.controlCategory,
          gapSeverity: detail.gapSeverity as GapSeverity,
          gapDescription: detail.gapDescription || 'No description provided',
          remediationAction: detail.remediationAction,
          remediationOwner: detail.remediationOwner,
          remediationDueDate: detail.remediationDueDate,
          remediationStatus: mappedRemediationStatus as RemediationStatus
        };

        switch (severityStr) {
          case 'critical':
            criticalGaps.push(gap);
            break;
          case 'high':
            highGaps.push(gap);
            break;
          case 'medium':
            mediumGaps.push(gap);
            break;
          case 'low':
            lowGaps.push(gap);
            break;
        }

        switch (mappedRemediationStatus) {
          case 'pending':
            notStarted++;
            break;
          case 'in-progress':
            inProgress++;
            break;
          case 'completed':
            completed++;
            break;
          case 'deferred':
            deferred++;
            break;
        }
      }
    }

    return {
      assessmentId: assessment.id,
      standardName: assessment.standardName,
      totalGaps: criticalGaps.length + highGaps.length + mediumGaps.length + lowGaps.length,
      criticalGaps,
      highGaps,
      mediumGaps,
      lowGaps,
      remediationProgress: {
        notStarted,
        inProgress,
        completed,
        deferred
      }
    };
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get gap analysis');
  }
}

/**
 * Get assessments by standard name
 */
export async function getAssessmentsByStandard(
  tenantId: string,
  standardName: string
): Promise<ControlCoverageAssessment[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase!
      .from('control_coverage_assessments')
      .select(`
        *,
        sites (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantUUID)
      .eq('standard_name', standardName)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get assessments by standard');
    }

    return (data || []).map(assessment => ({
      id: assessment.id,
      tenantId: assessment.tenant_id,
      siteId: assessment.site_id,
      siteName: assessment.sites?.name,
      assessmentName: assessment.assessment_name,
      assessmentDate: assessment.assessment_date,
      assessor: assessment.assessor,
      assessmentType: assessment.assessment_type,
      standardName: assessment.standard_name,
      standardVersion: assessment.standard_version,
      totalControls: assessment.total_controls,
      implementedControls: assessment.implemented_controls,
      partialControls: assessment.partial_controls,
      notImplementedControls: assessment.not_implemented_controls,
      notApplicableControls: assessment.not_applicable_controls,
      coverageScore: assessment.coverage_score,
      effectivenessScore: assessment.effectiveness_score,
      maturityLevel: assessment.maturity_level,
      status: assessment.status,
      complianceStatus: assessment.compliance_status,
      criticalGaps: assessment.critical_gaps,
      highGaps: assessment.high_gaps,
      mediumGaps: assessment.medium_gaps,
      lowGaps: assessment.low_gaps,
      gapSummary: assessment.gap_summary,
      remediationPlan: assessment.remediation_plan,
      targetCompletionDate: assessment.target_completion_date,
      nextAssessmentDate: assessment.next_assessment_date,
      notes: assessment.notes,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at
    }));
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get assessments by standard');
  }
}

/**
 * Get assessments by site
 */
export async function getAssessmentsBySite(
  tenantId: string,
  siteId: string
): Promise<ControlCoverageAssessment[]> {
  ensureSupabaseConnected();

  try {
    const tenantUUID = await mapTenantIdToUUID(tenantId);
    if (!tenantUUID) return [];

    const { data, error } = await supabase!
      .from('control_coverage_assessments')
      .select(`
        *,
        sites (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantUUID)
      .eq('site_id', siteId)
      .order('assessment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, 'Get assessments by site');
    }

    return (data || []).map(assessment => ({
      id: assessment.id,
      tenantId: assessment.tenant_id,
      siteId: assessment.site_id,
      siteName: assessment.sites?.name,
      assessmentName: assessment.assessment_name,
      assessmentDate: assessment.assessment_date,
      assessor: assessment.assessor,
      assessmentType: assessment.assessment_type,
      standardName: assessment.standard_name,
      standardVersion: assessment.standard_version,
      totalControls: assessment.total_controls,
      implementedControls: assessment.implemented_controls,
      partialControls: assessment.partial_controls,
      notImplementedControls: assessment.not_implemented_controls,
      notApplicableControls: assessment.not_applicable_controls,
      coverageScore: assessment.coverage_score,
      effectivenessScore: assessment.effectiveness_score,
      maturityLevel: assessment.maturity_level,
      status: assessment.status,
      complianceStatus: assessment.compliance_status,
      criticalGaps: assessment.critical_gaps,
      highGaps: assessment.high_gaps,
      mediumGaps: assessment.medium_gaps,
      lowGaps: assessment.low_gaps,
      gapSummary: assessment.gap_summary,
      remediationPlan: assessment.remediation_plan,
      targetCompletionDate: assessment.target_completion_date,
      nextAssessmentDate: assessment.next_assessment_date,
      notes: assessment.notes,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at
    }));
  } catch (error) {
    if (error instanceof ControlCoverageQueryError) {
      throw error;
    }
    handleSupabaseError(error, 'Get assessments by site');
  }
}
