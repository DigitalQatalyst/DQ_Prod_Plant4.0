/**
 * Risk Management Supabase Queries
 * Requirements: 4.6, 10.4, 8.1, 8.4
 * 
 * Provides typed queries for security risk register data from Supabase.
 * Supports transmission-specific risk categories and mitigation tracking.
 */

import { supabase } from './supabase';
import { mapTenantIdToUUID } from './tenantMapping';
import type { 
  SecurityRisk, 
  RiskAssessment, 
  RiskMitigationAction, 
  RiskMonitoringEvent,
  SecurityRiskCategory
} from '@/types/security';

// ============================================================================
// RISK REGISTER QUERIES
// ============================================================================

/**
 * Get all security risks for a tenant
 * Requirements: 4.6, 8.1
 */
export async function getSecurityRisksByTenant(tenantId: string): Promise<SecurityRisk[]> {
  // Map frontend tenant ID to Supabase UUID
  const supabaseTenantId = await mapTenantIdToUUID(tenantId);
  
  if (!supabaseTenantId) {
    // Return empty array for tenants not in Supabase (e.g., mock upstream tenants)
    return [];
  }

  const { data, error } = await supabase
    .from('security_risks')
    .select('*')
    .eq('tenant_id', supabaseTenantId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching security risks:', error);
    throw error;
  }

  // Transform snake_case to camelCase to match TypeScript interface
  return (data || []).map(risk => ({
    id: risk.id,
    tenantId: risk.tenant_id,
    riskId: risk.risk_id,
    riskName: risk.risk_name,
    riskDescription: risk.risk_description,
    riskCategory: risk.risk_category,
    riskSubcategory: risk.risk_subcategory,
    threatScenario: risk.threat_scenario,
    threatActor: risk.threat_actor,
    attackVector: risk.attack_vector,
    affectedAssetTypes: risk.affected_asset_types,
    affectedProtocols: risk.affected_protocols,
    appliesToSites: risk.applies_to_sites,
    appliesToZones: risk.applies_to_zones,
    appliesToAssets: risk.applies_to_assets,
    inherentLikelihood: risk.inherent_likelihood,
    inherentImpact: risk.inherent_impact,
    inherentRiskScore: risk.inherent_risk_score,
    inherentRiskLevel: risk.inherent_risk_level,
    residualLikelihood: risk.residual_likelihood,
    residualImpact: risk.residual_impact,
    residualRiskScore: risk.residual_risk_score,
    residualRiskLevel: risk.residual_risk_level,
    safetyImpact: risk.safety_impact || false,
    safetyImpactDescription: risk.safety_impact_description,
    operationalImpactDescription: risk.operational_impact_description,
    financialImpactEstimate: risk.financial_impact_estimate,
    regulatoryImpactDescription: risk.regulatory_impact_description,
    reputationalImpactDescription: risk.reputational_impact_description,
    gridStabilityImpact: risk.grid_stability_impact || false,
    customerImpactEstimate: risk.customer_impact_estimate,
    mwAtRisk: risk.mw_at_risk,
    recoveryTimeEstimateHours: risk.recovery_time_estimate_hours,
    existingControls: risk.existing_controls,
    controlEffectiveness: risk.control_effectiveness,
    controlGaps: risk.control_gaps,
    treatmentStrategy: risk.treatment_strategy,
    treatmentPlan: risk.treatment_plan,
    treatmentOwner: risk.treatment_owner,
    treatmentOwnerRole: risk.treatment_owner_role,
    treatmentBudget: risk.treatment_budget,
    treatmentPriority: risk.treatment_priority,
    status: risk.status,
    identifiedDate: risk.identified_date,
    identifiedBy: risk.identified_by,
    lastAssessmentDate: risk.last_assessment_date,
    nextAssessmentDate: risk.next_assessment_date,
    assessmentFrequencyMonths: risk.assessment_frequency_months || 6,
    riskAccepted: risk.risk_accepted || false,
    acceptedBy: risk.accepted_by,
    acceptanceDate: risk.acceptance_date,
    acceptanceJustification: risk.acceptance_justification,
    acceptanceExpiration: risk.acceptance_expiration,
    riskTransferred: risk.risk_transferred || false,
    transferredTo: risk.transferred_to,
    transferMechanism: risk.transfer_mechanism,
    requiresMonitoring: risk.requires_monitoring || true,
    monitoringFrequencyDays: risk.monitoring_frequency_days || 30,
    lastMonitored: risk.last_monitored,
    nextMonitoringDate: risk.next_monitoring_date,
    monitoringKpis: risk.monitoring_kpis,
    relatedIncidents: risk.related_incidents,
    relatedVulnerabilities: risk.related_vulnerabilities,
    relatedComplianceRequirements: risk.related_compliance_requirements,
    closedDate: risk.closed_date,
    closedBy: risk.closed_by,
    closureReason: risk.closure_reason,
    tags: risk.tags,
    notes: risk.notes,
    createdAt: risk.created_at,
    updatedAt: risk.updated_at
  }));
}

/**
 * Get security risk by ID
 * Requirements: 4.6, 8.1
 */
export async function getSecurityRiskById(riskId: string): Promise<SecurityRisk | null> {
  const { data, error } = await supabase
    .from('security_risks')
    .select('*')
    .eq('id', riskId)
    .single();

  if (error) {
    console.error('Error fetching security risk:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new security risk
 * Requirements: 4.6, 8.1
 */
export async function createSecurityRisk(risk: Omit<SecurityRisk, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityRisk> {
  const { data, error } = await supabase
    .from('security_risks')
    .insert([risk])
    .select()
    .single();

  if (error) {
    console.error('Error creating security risk:', error);
    throw error;
  }

  return data;
}

/**
 * Update security risk
 * Requirements: 4.6, 8.1
 */
export async function updateSecurityRisk(riskId: string, updates: Partial<SecurityRisk>): Promise<SecurityRisk> {
  const { data, error } = await supabase
    .from('security_risks')
    .update(updates)
    .eq('id', riskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating security risk:', error);
    throw error;
  }

  return data;
}

/**
 * Delete security risk
 * Requirements: 4.6, 8.1
 */
export async function deleteSecurityRisk(riskId: string): Promise<void> {
  const { error } = await supabase
    .from('security_risks')
    .delete()
    .eq('id', riskId);

  if (error) {
    console.error('Error deleting security risk:', error);
    throw error;
  }
}

// ============================================================================
// RISK ASSESSMENT QUERIES
// ============================================================================

/**
 * Get risk assessments for a risk
 * Requirements: 4.6, 8.1
 */
export async function getRiskAssessmentsByRisk(riskId: string): Promise<RiskAssessment[]> {
  const { data, error } = await supabase
    .from('risk_assessments')
    .select('*')
    .eq('risk_id', riskId)
    .order('assessment_date', { ascending: false });

  if (error) {
    console.error('Error fetching risk assessments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create risk assessment
 * Requirements: 4.6, 8.1
 */
export async function createRiskAssessment(assessment: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskAssessment> {
  const { data, error } = await supabase
    .from('risk_assessments')
    .insert([assessment])
    .select()
    .single();

  if (error) {
    console.error('Error creating risk assessment:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// RISK MITIGATION QUERIES
// ============================================================================

/**
 * Get mitigation actions for a risk
 * Requirements: 4.6, 8.1
 */
export async function getRiskMitigationActionsByRisk(riskId: string): Promise<RiskMitigationAction[]> {
  const { data, error } = await supabase
    .from('risk_mitigation_actions')
    .select('*')
    .eq('risk_id', riskId)
    .order('planned_completion_date', { ascending: true });

  if (error) {
    console.error('Error fetching risk mitigation actions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create mitigation action
 * Requirements: 4.6, 8.1
 */
export async function createRiskMitigationAction(action: Omit<RiskMitigationAction, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskMitigationAction> {
  const { data, error } = await supabase
    .from('risk_mitigation_actions')
    .insert([action])
    .select()
    .single();

  if (error) {
    console.error('Error creating risk mitigation action:', error);
    throw error;
  }

  return data;
}

/**
 * Update mitigation action
 * Requirements: 4.6, 8.1
 */
export async function updateRiskMitigationAction(actionId: string, updates: Partial<RiskMitigationAction>): Promise<RiskMitigationAction> {
  const { data, error } = await supabase
    .from('risk_mitigation_actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating risk mitigation action:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// RISK MONITORING QUERIES
// ============================================================================

/**
 * Get monitoring events for a risk
 * Requirements: 4.6, 8.1
 */
export async function getRiskMonitoringEventsByRisk(riskId: string): Promise<RiskMonitoringEvent[]> {
  const { data, error } = await supabase
    .from('risk_monitoring_events')
    .select('*')
    .eq('risk_id', riskId)
    .order('event_date', { ascending: false });

  if (error) {
    console.error('Error fetching risk monitoring events:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create monitoring event
 * Requirements: 4.6, 8.1
 */
export async function createRiskMonitoringEvent(event: Omit<RiskMonitoringEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<RiskMonitoringEvent> {
  const { data, error } = await supabase
    .from('risk_monitoring_events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error('Error creating risk monitoring event:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// RISK ANALYTICS QUERIES
// ============================================================================

/**
 * Get risk summary statistics for a tenant
 * Requirements: 4.6, 10.4
 */
export interface RiskSummaryStats {
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  negligibleRisks: number;
  identifiedRisks: number;
  assessedRisks: number;
  mitigatingRisks: number;
  monitoringRisks: number;
  acceptedRisks: number;
  transferredRisks: number;
  closedRisks: number;
  overdueMitigations: number;
  overdueAssessments: number;
  safetyImpactRisks: number;
  gridStabilityRisks: number;
  cyberAttackRisks: number;
  insiderThreatRisks: number;
  systemVulnerabilityRisks: number;
  averageRiskScore: number;
}

export async function getRiskSummaryStats(tenantId: string): Promise<RiskSummaryStats> {
  // Map frontend tenant ID to Supabase UUID
  const supabaseTenantId = await mapTenantIdToUUID(tenantId);
  
  if (!supabaseTenantId) {
    // Return empty stats for tenants not in Supabase (e.g., mock upstream tenants)
    return {
      totalRisks: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      negligibleRisks: 0,
      identifiedRisks: 0,
      assessedRisks: 0,
      mitigatingRisks: 0,
      monitoringRisks: 0,
      acceptedRisks: 0,
      transferredRisks: 0,
      closedRisks: 0,
      overdueMitigations: 0,
      overdueAssessments: 0,
      safetyImpactRisks: 0,
      gridStabilityRisks: 0,
      cyberAttackRisks: 0,
      insiderThreatRisks: 0,
      systemVulnerabilityRisks: 0,
      averageRiskScore: 0
    };
  }

  const { data: risks, error } = await supabase
    .from('security_risks')
    .select('*')
    .eq('tenant_id', supabaseTenantId);

  if (error) {
    console.error('Error fetching risk summary stats:', error);
    throw error;
  }

  const totalRisks = risks?.length || 0;
  
  if (totalRisks === 0) {
    return {
      totalRisks: 0,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 0,
      lowRisks: 0,
      negligibleRisks: 0,
      identifiedRisks: 0,
      assessedRisks: 0,
      mitigatingRisks: 0,
      monitoringRisks: 0,
      acceptedRisks: 0,
      transferredRisks: 0,
      closedRisks: 0,
      overdueMitigations: 0,
      overdueAssessments: 0,
      safetyImpactRisks: 0,
      gridStabilityRisks: 0,
      cyberAttackRisks: 0,
      insiderThreatRisks: 0,
      systemVulnerabilityRisks: 0,
      averageRiskScore: 0,
    };
  }

  const now = new Date();
  
  const stats: RiskSummaryStats = {
    totalRisks,
    criticalRisks: risks.filter(r => r.inherent_risk_level === 'critical').length,
    highRisks: risks.filter(r => r.inherent_risk_level === 'high').length,
    mediumRisks: risks.filter(r => r.inherent_risk_level === 'medium').length,
    lowRisks: risks.filter(r => r.inherent_risk_level === 'low').length,
    negligibleRisks: risks.filter(r => r.inherent_risk_level === 'negligible').length,
    identifiedRisks: risks.filter(r => r.status === 'identified').length,
    assessedRisks: risks.filter(r => r.status === 'assessed').length,
    mitigatingRisks: risks.filter(r => r.status === 'mitigating').length,
    monitoringRisks: risks.filter(r => r.status === 'monitoring').length,
    acceptedRisks: risks.filter(r => r.status === 'accepted').length,
    transferredRisks: risks.filter(r => r.status === 'transferred').length,
    closedRisks: risks.filter(r => r.status === 'closed').length,
    overdueMitigations: 0, // Would need to join with mitigation actions
    overdueAssessments: risks.filter(r => 
      r.next_assessment_date && new Date(r.next_assessment_date) < now
    ).length,
    safetyImpactRisks: risks.filter(r => r.safety_impact).length,
    gridStabilityRisks: risks.filter(r => r.grid_stability_impact).length,
    cyberAttackRisks: risks.filter(r => r.risk_category === 'cyber-attack').length,
    insiderThreatRisks: risks.filter(r => r.risk_category === 'insider-threat').length,
    systemVulnerabilityRisks: risks.filter(r => r.risk_category === 'system-vulnerability').length,
    averageRiskScore: risks.reduce((sum, r) => sum + r.inherent_risk_score, 0) / totalRisks,
  };

  return stats;
}

/**
 * Get risks by category for a tenant
 * Requirements: 4.6, 10.4
 */
export async function getRisksByCategory(tenantId: string): Promise<Record<SecurityRiskCategory, SecurityRisk[]>> {
  const risks = await getSecurityRisksByTenant(tenantId);
  
  const risksByCategory: Record<SecurityRiskCategory, SecurityRisk[]> = {
    'cyber-attack': [],
    'insider-threat': [],
    'system-vulnerability': [],
    'configuration-error': [],
    'physical-security': [],
    'third-party': [],
    'compliance': [],
    'operational': [],
    'natural-disaster': [],
    'human-error': [],
  };

  risks.forEach(risk => {
    if (risksByCategory[risk.riskCategory]) {
      risksByCategory[risk.riskCategory].push(risk);
    }
  });

  return risksByCategory;
}

/**
 * Get high-priority risks requiring attention
 * Requirements: 4.6, 10.4
 */
export async function getHighPriorityRisks(tenantId: string): Promise<SecurityRisk[]> {
  // Map frontend tenant ID to Supabase UUID
  const supabaseTenantId = await mapTenantIdToUUID(tenantId);
  
  if (!supabaseTenantId) {
    return [];
  }

  const { data, error } = await supabase
    .from('security_risks')
    .select('*')
    .eq('tenant_id', supabaseTenantId)
    .in('inherent_risk_level', ['critical', 'high'])
    .in('status', ['identified', 'assessed', 'mitigating'])
    .order('inherent_risk_score', { ascending: false });

  if (error) {
    console.error('Error fetching high-priority risks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get overdue risks (assessments or mitigations)
 * Requirements: 4.6, 10.4
 */
export async function getOverdueRisks(tenantId: string): Promise<SecurityRisk[]> {
  // Map frontend tenant ID to Supabase UUID
  const supabaseTenantId = await mapTenantIdToUUID(tenantId);
  
  if (!supabaseTenantId) {
    return [];
  }

  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('security_risks')
    .select('*')
    .eq('tenant_id', supabaseTenantId)
    .or(`next_assessment_date.lt.${now},next_monitoring_date.lt.${now}`)
    .order('next_assessment_date', { ascending: true });

  if (error) {
    console.error('Error fetching overdue risks:', error);
    throw error;
  }

  return data || [];
}