/**
 * Application Security Queries
 * Supabase queries for application security scans and vulnerability tracking
 * Requirements: 7.5
 */

import { supabase } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import { toCamelCase } from './dataMapping';

// ============================================================================
// TYPES
// ============================================================================

export interface ApplicationSecurityScan {
  id: string;
  tenantId: string;

  // Application identification
  applicationName: string;
  applicationType: 'web_application' | 'api_service' | 'mobile_app' | 'desktop_app' | 'scada_hmi' | 'data_analytics';
  applicationDescription?: string;
  applicationVersion?: string;

  // Application details
  deploymentEnvironment: 'production' | 'staging' | 'development' | 'test';
  deploymentUrl?: string;
  repositoryUrl?: string;

  // Scan information
  scanId: string;
  scanType: 'sast' | 'dast' | 'sca' | 'container_scan' | 'dependency_scan' | 'penetration_test';
  scanTool: string;
  scanStatus: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

  // Scan execution
  scanStartedAt?: string;
  scanCompletedAt?: string;
  scanDurationSeconds?: number;
  scanTriggeredBy?: string;

  // Scan results summary
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  infoFindings: number;

  // Security score
  securityScore?: number;
  securityGrade?: string;
  previousSecurityScore?: number;
  scoreTrend?: 'improving' | 'stable' | 'declining';

  // Vulnerability categories
  injectionVulnerabilities: number;
  authenticationVulnerabilities: number;
  authorizationVulnerabilities: number;
  cryptographyVulnerabilities: number;
  configurationVulnerabilities: number;
  dependencyVulnerabilities: number;

  // Compliance findings
  owaspTop10Violations: number;
  cweTop25Violations: number;
  pciDssViolations: number;
  hipaaViolations: number;

  // Code quality metrics
  linesOfCode?: number;
  codeCoveragePercent?: number;
  technicalDebtHours?: number;
  codeSmells: number;

  // Remediation status
  findingsResolved: number;
  findingsInProgress: number;
  findingsOpen: number;
  findingsAcceptedRisk: number;
  findingsFalsePositive: number;

  // Risk assessment
  overallRiskLevel: 'critical' | 'high' | 'medium' | 'low' | 'minimal' | 'unknown';
  exploitabilityScore?: number;
  impactScore?: number;

  // Scan configuration
  scanScope?: string;
  scanDepth?: string;
  scanConfiguration?: Record<string, unknown>;

  // Findings details
  findingsSummary?: Record<string, unknown>;
  scanReportUrl?: string;
  scanReportPath?: string;

  // Responsible parties
  applicationOwner?: string;
  securityContact?: string;
  developmentTeam?: string;

  findings: any[];

  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all application security scans for a tenant
 */
export async function getApplicationSecurityScans(tenantId: string) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('scan_completed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching application security scans:', error);
    return [];
  }

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scans by application name
 */
export async function getApplicationSecurityScansByApplication(
  tenantId: string,
  applicationName: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('application_name', applicationName)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scans by scan type
 */
export async function getApplicationSecurityScansByType(
  tenantId: string,
  scanType: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('scan_type', scanType)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scans by environment
 */
export async function getApplicationSecurityScansByEnvironment(
  tenantId: string,
  environment: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('deployment_environment', environment)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get high-risk application security scans (critical or high findings)
 */
export async function getHighRiskApplicationScans(tenantId: string) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .or('critical_findings.gt.0,high_findings.gt.3')
    .order('critical_findings', { ascending: false })
    .order('high_findings', { ascending: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scan by ID
 */
export async function getApplicationSecurityScanById(
  tenantId: string,
  scanId: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('id', scanId)
    .single();

  if (error) {
    console.error('Error fetching application security scan by ID:', error);
    throw error;
  }

  return toCamelCase<ApplicationSecurityScan>({ ...data, findings: [] });
}

/**
 * Get application security scans by status
 */
export async function getApplicationSecurityScansByStatus(
  tenantId: string,
  status: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('scan_status', status)
    .order('scan_started_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scans by risk level
 */
export async function getApplicationSecurityScansByRiskLevel(
  tenantId: string,
  riskLevel: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('overall_risk_level', riskLevel)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security scans by security grade
 */
export async function getApplicationSecurityScansByGrade(
  tenantId: string,
  grade: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('security_grade', grade)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}

/**
 * Get application security summary statistics
 */
export async function getApplicationSecuritySummary(tenantId: string) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('scan_status', 'completed');

  if (error) {
    console.error('Error fetching application security summary:', error);
    throw error;
  }

  // Use toCamelCase to ensure property access works if needed, but the logic below assumes we extracted values directly.
  // Actually, we should map them FIRST if we use CamelCase logic.
  const scans = toCamelCase<ApplicationSecurityScan[]>(data as any[]);

  // Calculate summary statistics
  const totalScans = scans.length;
  const totalApplications = new Set(scans.map(s => s.applicationName)).size;
  const totalFindings = scans.reduce((sum, s) => sum + s.totalFindings, 0);
  const criticalFindings = scans.reduce((sum, s) => sum + s.criticalFindings, 0);
  const highFindings = scans.reduce((sum, s) => sum + s.highFindings, 0);
  const mediumFindings = scans.reduce((sum, s) => sum + s.mediumFindings, 0);
  const lowFindings = scans.reduce((sum, s) => sum + s.lowFindings, 0);

  const avgSecurityScore = scans.filter(s => s.securityScore !== null && s.securityScore !== undefined)
    .reduce((sum, s) => sum + (s.securityScore || 0), 0) / scans.filter(s => s.securityScore !== null && s.securityScore !== undefined).length;

  const highRiskApps = scans.filter(s =>
    s.overallRiskLevel === 'critical' || s.overallRiskLevel === 'high'
  ).length;

  return {
    totalScans,
    totalApplications,
    totalFindings,
    criticalFindings,
    highFindings,
    mediumFindings,
    lowFindings,
    avgSecurityScore: Math.round(avgSecurityScore || 0),
    highRiskApps,
  };
}

/**
 * Search application security scans
 */
export async function searchApplicationSecurityScans(
  tenantId: string,
  searchQuery: string
) {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('application_security_scans')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .or(`application_name.ilike.%${searchQuery}%,application_description.ilike.%${searchQuery}%,scan_tool.ilike.%${searchQuery}%`)
    .order('scan_completed_at', { ascending: false, nullsFirst: false });

  if (error) return [];

  return toCamelCase<ApplicationSecurityScan[]>((data as any[]).map(scan => ({ ...scan, findings: [] })));
}
