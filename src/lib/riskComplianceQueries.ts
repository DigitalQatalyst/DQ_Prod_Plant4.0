/**
 * Risk and Compliance Supabase Queries
 * Requirements: 1.4, 10.4
 * 
 * Provides typed queries for risk and compliance summary data from Supabase.
 * Supports transmission-specific risk categories and compliance standards.
 */

import { supabase } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RiskComplianceSummary {
  id: string;
  tenant_id: string;
  site_id: string | null;
  summary_name: string;
  summary_date: string;
  reporting_period_start: string;
  reporting_period_end: string;
  summary_type: 'monthly' | 'quarterly' | 'annual' | 'ad-hoc';

  // Risk metrics
  total_risks: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  mitigated_risks: number;
  accepted_risks: number;

  // Risk scoring
  overall_risk_score: number;
  inherent_risk_score: number;
  residual_risk_score: number;
  risk_appetite_threshold: number;
  risk_tolerance_exceeded: boolean;

  // Compliance metrics
  total_standards: number;
  compliant_standards: number;
  partial_compliant_standards: number;
  non_compliant_standards: number;

  // Compliance scoring
  overall_compliance_score: number;
  iec_62443_score: number;
  nerc_cip_score: number;

  // Control metrics
  total_controls: number;
  implemented_controls: number;
  partial_controls: number;
  not_implemented_controls: number;
  control_effectiveness_score: number;

  // Incident and alert metrics
  total_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  total_alerts: number;
  critical_alerts: number;

  // Asset security metrics
  total_assets: number;
  critical_assets: number;
  vulnerable_assets: number;
  secure_assets: number;

  // Trend indicators
  risk_trend: 'improving' | 'stable' | 'degrading' | 'unknown' | null;
  compliance_trend: 'improving' | 'stable' | 'degrading' | 'unknown' | null;
  security_posture_trend: 'improving' | 'stable' | 'degrading' | 'unknown' | null;

  // Executive summary
  executive_summary: string | null;
  key_findings: string[] | null;
  recommendations: string[] | null;
  action_items: string[] | null;

  // Status
  status: 'draft' | 'in-review' | 'approved' | 'published' | 'archived';
  approved_by: string | null;
  approved_at: string | null;

  // Metadata
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceStandardStatus {
  id: string;
  summary_id: string;
  tenant_id: string;
  standard_name: string;
  standard_version: string | null;
  standard_type: 'iec-62443' | 'nerc-cip' | 'nist' | 'iso-27001' | 'other';
  compliance_status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  compliance_score: number;
  total_requirements: number;
  met_requirements: number;
  partial_requirements: number;
  unmet_requirements: number;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  assessor: string | null;
  critical_gaps: number;
  high_gaps: number;
  gap_summary: string | null;
  remediation_plan: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskComplianceTrend {
  id: string;
  tenant_id: string;
  site_id: string | null;
  trend_date: string;
  metric_name: string;
  metric_category: 'risk' | 'compliance' | 'security' | 'incident' | 'control';
  metric_value: number;
  metric_target: number | null;
  metric_threshold: number | null;
  status: 'on-target' | 'at-risk' | 'off-target' | 'unknown' | null;
  context: Record<string, any> | null;
  created_at: string;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all risk and compliance summaries for a tenant
 */
export async function getRiskComplianceSummariesByTenant(tenantId: string) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: [], error: null };

  const { data, error } = await supabase
    .from('risk_compliance_summaries')
    .select('*')
    .eq('tenant_id', uuid)
    .order('summary_date', { ascending: false });

  if (error) {
    console.error('Error fetching risk compliance summaries:', error);
    return { data: null, error };
  }

  return { data: data as RiskComplianceSummary[], error: null };
}

/**
 * Get the latest risk and compliance summary for a tenant
 */
export async function getLatestRiskComplianceSummary(tenantId: string) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: null, error: null };

  const { data, error } = await supabase
    .from('risk_compliance_summaries')
    .select('*')
    .eq('tenant_id', uuid)
    .eq('status', 'approved')
    .order('summary_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching latest risk compliance summary:', error);
    return { data: null, error };
  }

  return { data: data as RiskComplianceSummary, error: null };
}

/**
 * Get risk and compliance summaries for a specific site
 */
export async function getRiskComplianceSummariesBySite(tenantId: string, siteId: string) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: [], error: null };

  const { data, error } = await supabase
    .from('risk_compliance_summaries')
    .select('*')
    .eq('tenant_id', uuid)
    .eq('site_id', siteId)
    .order('summary_date', { ascending: false });

  if (error) {
    console.error('Error fetching site risk compliance summaries:', error);
    return { data: null, error };
  }

  return { data: data as RiskComplianceSummary[], error: null };
}

/**
 * Get compliance standard status for a summary
 */
export async function getComplianceStandardStatusBySummary(summaryId: string) {
  const { data, error } = await supabase
    .from('compliance_standard_status')
    .select('*')
    .eq('summary_id', summaryId)
    .order('compliance_score', { ascending: false });

  if (error) {
    console.error('Error fetching compliance standard status:', error);
    return { data: null, error };
  }

  return { data: data as ComplianceStandardStatus[], error: null };
}

/**
 * Get risk compliance trends for a tenant
 */
export async function getRiskComplianceTrendsByTenant(
  tenantId: string,
  metricCategory?: 'risk' | 'compliance' | 'security' | 'incident' | 'control'
) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: [], error: null };

  let query = supabase
    .from('risk_compliance_trends')
    .select('*')
    .eq('tenant_id', uuid)
    .order('trend_date', { ascending: true });

  if (metricCategory) {
    query = query.eq('metric_category', metricCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching risk compliance trends:', error);
    return { data: null, error };
  }

  return { data: data as RiskComplianceTrend[], error: null };
}

/**
 * Get risk compliance trends for a specific metric
 */
export async function getRiskComplianceTrendsByMetric(
  tenantId: string,
  metricName: string,
  startDate?: string,
  endDate?: string
) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: [], error: null };

  let query = supabase
    .from('risk_compliance_trends')
    .select('*')
    .eq('tenant_id', uuid)
    .eq('metric_name', metricName)
    .order('trend_date', { ascending: true });

  if (startDate) {
    query = query.gte('trend_date', startDate);
  }

  if (endDate) {
    query = query.lte('trend_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching metric trends:', error);
    return { data: null, error };
  }

  return { data: data as RiskComplianceTrend[], error: null };
}

/**
 * Get aggregated risk statistics for a tenant
 */
export async function getAggregatedRiskStatistics(tenantId: string) {
  const { data: summary, error } = await getLatestRiskComplianceSummary(tenantId);

  if (error || !summary) {
    return {
      data: null,
      error: error || new Error('No summary found')
    };
  }

  return {
    data: {
      totalRisks: summary.total_risks,
      criticalRisks: summary.critical_risks,
      highRisks: summary.high_risks,
      mediumRisks: summary.medium_risks,
      lowRisks: summary.low_risks,
      mitigatedRisks: summary.mitigated_risks,
      acceptedRisks: summary.accepted_risks,
      overallRiskScore: summary.overall_risk_score,
      inherentRiskScore: summary.inherent_risk_score,
      residualRiskScore: summary.residual_risk_score,
      riskTrend: summary.risk_trend,
    },
    error: null
  };
}

/**
 * Get aggregated compliance statistics for a tenant
 */
export async function getAggregatedComplianceStatistics(tenantId: string) {
  const { data: summary, error } = await getLatestRiskComplianceSummary(tenantId);

  if (error || !summary) {
    return {
      data: null,
      error: error || new Error('No summary found')
    };
  }

  return {
    data: {
      totalStandards: summary.total_standards,
      compliantStandards: summary.compliant_standards,
      partialCompliantStandards: summary.partial_compliant_standards,
      nonCompliantStandards: summary.non_compliant_standards,
      overallComplianceScore: summary.overall_compliance_score,
      iec62443Score: summary.iec_62443_score,
      nercCipScore: summary.nerc_cip_score,
      complianceTrend: summary.compliance_trend,
    },
    error: null
  };
}

/**
 * Get transmission-specific risk categories from trends
 */
export async function getTransmissionRiskCategories(tenantId: string) {
  const uuid = await mapTenantIdToUUID(tenantId);
  if (!uuid) return { data: [], error: null };

  const { data, error } = await supabase
    .from('risk_compliance_trends')
    .select('*')
    .eq('tenant_id', uuid)
    .eq('metric_category', 'risk')
    .order('trend_date', { ascending: false });

  if (error) {
    console.error('Error fetching transmission risk categories:', error);
    return { data: null, error };
  }

  // Group by metric name to get categories
  const categories = new Map<string, RiskComplianceTrend[]>();

  data.forEach((trend: RiskComplianceTrend) => {
    if (!categories.has(trend.metric_name)) {
      categories.set(trend.metric_name, []);
    }
    categories.get(trend.metric_name)?.push(trend);
  });

  return {
    data: Array.from(categories.entries()).map(([name, data]) => ({
      category: name,
      latestValue: data[0]?.metric_value || 0,
      trend: data[0]?.status || 'unknown',
      history: data
    })),
    error: null
  };
}
