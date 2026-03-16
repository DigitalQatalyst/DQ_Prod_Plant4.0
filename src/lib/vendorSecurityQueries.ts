/**
 * Vendor Security Assessment Queries
 * 
 * Supabase queries for vendor security assessments, findings, and contact history.
 * Supports transmission-specific vendor risk assessment and security scorecard functionality.
 * 
 * Requirements: 1.5
 */

import { supabase } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  VendorSecurityAssessment,
  VendorSecurityFinding,
  VendorContactHistory,
  VendorSummary,
  VendorSystemSummary,
  VendorScorecard,
} from '@/types/security';

// =============================================================================
// VENDOR SECURITY ASSESSMENTS
// =============================================================================

/**
 * Get all vendor security assessments for a tenant
 */
export async function getVendorSecurityAssessmentsByTenant(
  tenantId: string
): Promise<VendorSecurityAssessment[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_security_assessments')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('Error fetching vendor security assessments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get vendor security assessment by ID
 */
export async function getVendorSecurityAssessmentById(
  assessmentId: string
): Promise<VendorSecurityAssessment | null> {
  const { data, error } = await supabase
    .from('vendor_security_assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (error) {
    console.error('Error fetching vendor security assessment:', error);
    throw error;
  }

  return data;
}

/**
 * Get vendor security assessments by vendor name
 */
export async function getVendorSecurityAssessmentsByVendor(
  tenantId: string,
  vendorName: string
): Promise<VendorSecurityAssessment[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_security_assessments')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('vendor_name', vendorName)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('Error fetching vendor assessments by vendor:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get vendor security assessments by system criticality
 */
export async function getVendorSecurityAssessmentsByCriticality(
  tenantId: string,
  criticality: string
): Promise<VendorSecurityAssessment[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_security_assessments')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('system_criticality', criticality)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('Error fetching vendor assessments by criticality:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get vendor security assessments with critical findings
 */
export async function getVendorSecurityAssessmentsWithCriticalFindings(
  tenantId: string
): Promise<VendorSecurityAssessment[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_security_assessments')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .gt('critical_findings', 0)
    .order('critical_findings', { ascending: false });

  if (error) {
    console.error('Error fetching assessments with critical findings:', error);
    throw error;
  }

  return data || [];
}

// =============================================================================
// VENDOR SECURITY FINDINGS
// =============================================================================

/**
 * Get all findings for a vendor security assessment
 */
export async function getVendorSecurityFindingsByAssessment(
  assessmentId: string
): Promise<VendorSecurityFinding[]> {
  const { data, error } = await supabase
    .from('vendor_security_findings')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('severity', { ascending: true }); // critical first

  if (error) {
    console.error('Error fetching vendor security findings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get open findings for a vendor security assessment
 */
export async function getOpenVendorSecurityFindings(
  assessmentId: string
): Promise<VendorSecurityFinding[]> {
  const { data, error } = await supabase
    .from('vendor_security_findings')
    .select('*')
    .eq('assessment_id', assessmentId)
    .in('remediation_status', ['open', 'in-progress'])
    .order('severity', { ascending: true });

  if (error) {
    console.error('Error fetching open vendor security findings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get critical findings across all vendor assessments for a tenant
 */
export async function getCriticalVendorFindings(
  tenantId: string
): Promise<VendorSecurityFinding[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_security_findings')
    .select('*, vendor_security_assessments!inner(vendor_name, system_name)')
    .eq('tenant_id', tenantUUID)
    .eq('severity', 'critical')
    .in('remediation_status', ['open', 'in-progress'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching critical vendor findings:', error);
    throw error;
  }

  return data || [];
}

// =============================================================================
// VENDOR CONTACT HISTORY
// =============================================================================

/**
 * Get contact history for a vendor security assessment
 */
export async function getVendorContactHistory(
  assessmentId: string
): Promise<VendorContactHistory[]> {
  const { data, error } = await supabase
    .from('vendor_contact_history')
    .select('*')
    .eq('assessment_id', assessmentId)
    .order('contact_date', { ascending: false });

  if (error) {
    console.error('Error fetching vendor contact history:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get recent vendor contacts for a tenant
 */
export async function getRecentVendorContacts(
  tenantId: string,
  limit: number = 10
): Promise<VendorContactHistory[]> {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('vendor_contact_history')
    .select('*, vendor_security_assessments!inner(vendor_name, system_name)')
    .eq('tenant_id', tenantUUID)
    .order('contact_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent vendor contacts:', error);
    throw error;
  }

  return data || [];
}

// =============================================================================
// VENDOR SUMMARIES AND AGGREGATIONS
// =============================================================================

/**
 * Get vendor summary grouped by vendor name
 */
export async function getVendorSummaries(
  tenantId: string
): Promise<VendorSummary[]> {
  // Get all assessments for the tenant
  const assessments = await getVendorSecurityAssessmentsByTenant(tenantId);

  // Group by vendor name
  const vendorMap = new Map<string, VendorSecurityAssessment[]>();

  assessments.forEach(assessment => {
    const existing = vendorMap.get(assessment.vendor_name) || [];
    existing.push(assessment);
    vendorMap.set(assessment.vendor_name, existing);
  });

  // Create summaries
  const summaries: VendorSummary[] = [];

  for (const [vendorName, vendorAssessments] of vendorMap.entries()) {
    // Sort by date to get latest
    const sortedAssessments = [...vendorAssessments].sort(
      (a, b) => new Date(b.assessment_date).getTime() - new Date(a.assessment_date).getTime()
    );

    const latestAssessment = sortedAssessments[0];

    // Calculate averages
    const avgSecurityScore = vendorAssessments.reduce((sum, a) => sum + a.overall_security_score, 0) / vendorAssessments.length;
    const avgRiskScore = vendorAssessments.reduce((sum, a) => sum + a.risk_score, 0) / vendorAssessments.length;

    // Sum findings
    const totalFindings = vendorAssessments.reduce((sum, a) =>
      sum + (a.critical_findings || 0) + (a.high_findings || 0) + (a.medium_findings || 0) + (a.low_findings || 0), 0
    );
    const criticalFindings = vendorAssessments.reduce((sum, a) => sum + (a.critical_findings || 0), 0);
    const highFindings = vendorAssessments.reduce((sum, a) => sum + (a.high_findings || 0), 0);

    // Get open findings count (would need to query findings table for accurate count)
    const openFindings = criticalFindings + highFindings; // Simplified

    // Create system summaries
    const systems: VendorSystemSummary[] = vendorAssessments.map(a => ({
      assessment_id: a.id,
      system_name: a.system_name,
      system_type: a.system_type,
      system_criticality: a.system_criticality,
      security_score: a.overall_security_score,
      risk_score: a.risk_score,
      assessment_date: a.assessment_date,
      status: a.status,
    }));

    // Determine contract status
    let contractStatus: 'active' | 'expiring-soon' | 'expired' | 'none' = 'none';
    if (latestAssessment.contract_end_date) {
      const endDate = new Date(latestAssessment.contract_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        contractStatus = 'expired';
      } else if (daysUntilExpiry <= 90) {
        contractStatus = 'expiring-soon';
      } else {
        contractStatus = 'active';
      }
    }

    summaries.push({
      vendor_name: vendorName,
      vendor_type: latestAssessment.vendor_type,
      assessment_count: vendorAssessments.length,
      latest_assessment_date: latestAssessment.assessment_date,
      average_security_score: Math.round(avgSecurityScore * 100) / 100,
      average_risk_score: Math.round(avgRiskScore * 100) / 100,
      trust_level: latestAssessment.trust_level,
      total_findings: totalFindings,
      critical_findings: criticalFindings,
      high_findings: highFindings,
      open_findings: openFindings,
      systems,
      contract_status: contractStatus,
      next_assessment_date: latestAssessment.next_assessment_date,
    });
  }

  // Sort by risk score (highest first)
  return summaries.sort((a, b) => b.average_risk_score - a.average_risk_score);
}

/**
 * Get vendor scorecard with detailed metrics
 */
export async function getVendorScorecard(
  assessmentId: string
): Promise<VendorScorecard | null> {
  // Get assessment
  const assessment = await getVendorSecurityAssessmentById(assessmentId);
  if (!assessment) return null;

  // Get findings
  const findings = await getVendorSecurityFindingsByAssessment(assessmentId);

  // Get contact history
  const contactHistory = await getVendorContactHistory(assessmentId);

  // Calculate metrics
  const totalFindings = findings.length;
  const resolvedFindings = findings.filter(f => f.remediation_status === 'resolved').length;
  const remediationRate = totalFindings > 0 ? (resolvedFindings / totalFindings) * 100 : 0;

  const criticalOpenFindings = findings.filter(
    f => f.severity === 'critical' && f.remediation_status !== 'resolved'
  ).length;

  // Determine overall health
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
  if (assessment.overall_security_score >= 90 && criticalOpenFindings === 0) {
    overallHealth = 'excellent';
  } else if (assessment.overall_security_score >= 75 && criticalOpenFindings <= 1) {
    overallHealth = 'good';
  } else if (assessment.overall_security_score >= 60 || criticalOpenFindings <= 3) {
    overallHealth = 'fair';
  } else {
    overallHealth = 'poor';
  }

  // Determine security trend (would need historical data for accurate trend)
  const securityTrend: 'improving' | 'stable' | 'declining' = 'stable';

  // Determine compliance level
  let complianceLevel: 'full' | 'partial' | 'minimal' | 'none' = 'none';
  if (assessment.iec_62443_certified && (assessment.compliance_standards?.length || 0) >= 2) {
    complianceLevel = 'full';
  } else if ((assessment.compliance_standards?.length || 0) >= 1) {
    complianceLevel = 'partial';
  } else if ((assessment.certifications?.length || 0) > 0) {
    complianceLevel = 'minimal';
  }

  // Calculate average response time (simplified)
  const responseTime = '2-3 business days';

  // Check risk indicators
  const expiredCertifications = 0; // Would need certification expiry tracking
  const overdueAssessments = assessment.next_assessment_date
    ? new Date(assessment.next_assessment_date) < new Date()
    : false;

  const contractExpiringSoon = assessment.contract_end_date
    ? (() => {
      const endDate = new Date(assessment.contract_end_date);
      const now = new Date();
      const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
    })()
    : false;

  const outdatedSystems = (assessment.known_vulnerabilities || 0) > 5 ? 1 : 0;

  return {
    assessment,
    findings,
    contact_history: contactHistory,
    metrics: {
      overall_health: overallHealth,
      security_trend: securityTrend,
      compliance_level: complianceLevel,
      response_time: responseTime,
      remediation_rate: Math.round(remediationRate),
    },
    risk_indicators: {
      expired_certifications: expiredCertifications,
      overdue_assessments: overdueAssessments,
      critical_open_findings: criticalOpenFindings,
      contract_expiring_soon: contractExpiringSoon,
      outdated_systems: outdatedSystems,
    },
  };
}

/**
 * Get vendor statistics for dashboard
 */
export async function getVendorStatistics(tenantId: string) {
  const assessments = await getVendorSecurityAssessmentsByTenant(tenantId);

  // Get unique vendors
  const uniqueVendors = new Set(assessments.map(a => a.vendor_name));

  // Count by trust level
  const trustedVendors = assessments.filter(a => a.trust_level === 'trusted').length;
  const conditionalVendors = assessments.filter(a => a.trust_level === 'conditional').length;
  const restrictedVendors = assessments.filter(a => a.trust_level === 'restricted').length;

  // Count by criticality
  const safetyCriticalSystems = assessments.filter(a => a.system_criticality === 'safety-critical').length;
  const productionCriticalSystems = assessments.filter(a => a.system_criticality === 'production-critical').length;

  // Sum findings
  const totalCriticalFindings = assessments.reduce((sum, a) => sum + (a.critical_findings || 0), 0);
  const totalHighFindings = assessments.reduce((sum, a) => sum + (a.high_findings || 0), 0);

  // Average scores
  const avgSecurityScore = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + a.overall_security_score, 0) / assessments.length
    : 0;
  const avgRiskScore = assessments.length > 0
    ? assessments.reduce((sum, a) => sum + a.risk_score, 0) / assessments.length
    : 0;

  // Count assessments needing attention
  const assessmentsNeedingAttention = assessments.filter(
    a => (a.critical_findings || 0) > 0 || a.overall_security_score < 70
  ).length;

  return {
    totalVendors: uniqueVendors.size,
    totalAssessments: assessments.length,
    trustedVendors,
    conditionalVendors,
    restrictedVendors,
    safetyCriticalSystems,
    productionCriticalSystems,
    totalCriticalFindings,
    totalHighFindings,
    averageSecurityScore: Math.round(avgSecurityScore * 100) / 100,
    averageRiskScore: Math.round(avgRiskScore * 100) / 100,
    assessmentsNeedingAttention,
  };
}
