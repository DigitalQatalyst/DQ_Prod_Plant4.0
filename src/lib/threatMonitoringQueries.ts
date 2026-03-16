// Threat monitoring queries for power transmission cybersecurity
// Requirements: 5.1, 5.2, 5.6, 8.1

import { supabase } from './supabase';
import { toCamelCase } from './dataMapping';
import { mapTenantIdToUUID } from './tenantMapping';
import type {
  TransmissionSecurityAlert,
  IncidentCase,
  IncidentTimelineEntry,
  AnomalySignal,
  BehavioralBaseline,
  ResponsePlaybook,
  PlaybookStep,
  PlaybookExecution,
  StepExecution,
  ThreatIntelligenceFeed,
  ThreatIntelligenceIndicator,
  ThreatIntelligenceMatch,
  ThreatCampaign,
  ImpactAssessment,
  CascadeAnalysis,
  ImpactScenario,
  TransmissionSoarAction,
  SoarActionExecution,
  SecurityAlertSeverity,
  SecurityAlertStatus,
  IncidentStatus,
  IncidentSeverity,
  AnomalyStatus,
  AnomalySeverity,
  PlaybookStatus,
  ExecutionStatus,
  ThreatType,
  ThreatConfidence,
  ImpactSeverity
} from '../types/security';

// ===== SECURITY ALERTS QUERIES =====

export const getSecurityAlerts = async (
  tenantId: string,
  filters?: {
    siteId?: string;
    severity?: SecurityAlertSeverity;
    status?: SecurityAlertStatus;
    threatCategory?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('security_alerts')
    .select(`
      *,
      sites(name),
      assets(name, asset_types(name)),
      grid_nodes(name, voltage_kv),
      grid_lines(name, from_node:from_node_id(name), to_node:to_node_id(name))
    `)
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (filters?.siteId) {
    query = query.eq('site_id', filters.siteId);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.threatCategory) {
    query = query.eq('threat_category', filters.threatCategory);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<TransmissionSecurityAlert[]>(data || []);
};

export const getSecurityAlertById = async (tenantId: string, alertId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('security_alerts')
    .select(`
      *,
      sites(name),
      assets(name, asset_type),
      grid_nodes(name, voltage_level),
      grid_lines(name, from_node_name, to_node_name),
      security_users!assigned_to(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('id', alertId)
    .single();

  if (error) throw error;
  return data as TransmissionSecurityAlert;
};

export const createSecurityAlert = async (alert: Omit<TransmissionSecurityAlert, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('security_alerts')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data as TransmissionSecurityAlert;
};

export const updateSecurityAlert = async (
  tenantId: string,
  alertId: string,
  updates: Partial<TransmissionSecurityAlert>
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('security_alerts')
    .update(updates)
    .eq('tenant_id', tenantUUID)
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data as TransmissionSecurityAlert;
};

export const getAlertCorrelations = async (tenantId: string, correlationId: string) => {
  const { data, error } = await supabase
    .from('security_alert_correlations')
    .select('*')
    .eq('correlation_id', correlationId)
    .single();

  if (error) throw error;
  return data;
};

export const getAlertSummary = async (
  tenantId: string,
  timeRangeHours: number = 24
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('security_alert_summary')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .gte('alert_hour', new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString())
    .order('alert_hour', { ascending: false });

  if (error) throw error;
  return data;
};

// ===== INCIDENT CASES QUERIES =====

export const getIncidentCases = async (
  tenantId: string,
  filters?: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    assignedTo?: string;
    limit?: number;
    offset?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('incident_cases')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<IncidentCase[]>(data || []);
};

export const getIncidentCaseById = async (tenantId: string, incidentId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('incident_cases')
    .select(`
      *,
      security_users!assigned_to(full_name, email),
      security_users!created_by(full_name, email),
      security_users!incident_commander(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('id', incidentId)
    .single();

  if (error) throw error;
  return data as IncidentCase;
};

export const createIncidentCase = async (incident: Omit<IncidentCase, 'id' | 'incidentNumber' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('incident_cases')
    .insert(incident)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentCase;
};

export const updateIncidentCase = async (
  tenantId: string,
  incidentId: string,
  updates: Partial<IncidentCase>
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('incident_cases')
    .update(updates)
    .eq('tenant_id', tenantUUID)
    .eq('id', incidentId)
    .select()
    .single();

  if (error) throw error;
  return data as IncidentCase;
};

export const getIncidentTimeline = async (tenantId: string, incidentId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('incident_timeline_entries')
    .select(`
      *,
      security_users!author(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('incident_id', incidentId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return toCamelCase<IncidentTimelineEntry[]>(data || []);
};

export const addIncidentTimelineEntry = async (entry: Omit<IncidentTimelineEntry, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('incident_timeline_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<IncidentTimelineEntry>(data);
};

export const getIncidentAlertRelationships = async (tenantId: string, incidentId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('incident_alert_relationships')
    .select(`
      *,
      security_alerts(title, severity, status, created_at)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('incident_id', incidentId);

  if (error) throw error;
  return data;
};

export const linkIncidentToAlert = async (
  tenantId: string,
  incidentId: string,
  alertId: string,
  relationshipType: string = 'related',
  notes?: string
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) throw new Error('Invalid tenant ID');

  const { data, error } = await supabase
    .from('incident_alert_relationships')
    .insert({
      tenant_id: tenantUUID,
      incident_id: incidentId,
      alert_id: alertId,
      relationship_type: relationshipType,
      notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getIncidentDashboardMetrics = async (
  tenantId: string,
  timeRangeDays: number = 30
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('incident_dashboard_metrics')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .gte('incident_date', new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000).toISOString())
    .order('incident_date', { ascending: false });

  if (error) throw error;
  return data;
};

// ===== ANOMALY DETECTION QUERIES =====

export const getBehavioralBaselines = async (
  tenantId: string,
  filters?: {
    siteId?: string;
    assetId?: string;
    baselineType?: string;
    isActive?: boolean;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('behavioral_baselines')
    .select(`
      *,
      sites(name),
      assets(name, asset_type)
    `)
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (filters?.siteId) {
    query = query.eq('site_id', filters.siteId);
  }
  if (filters?.assetId) {
    query = query.eq('asset_id', filters.assetId);
  }
  if (filters?.baselineType) {
    query = query.eq('baseline_type', filters.baselineType);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<BehavioralBaseline[]>(data || []);
};

export const createBehavioralBaseline = async (baseline: Omit<BehavioralBaseline, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('behavioral_baselines')
    .insert(baseline)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<BehavioralBaseline>(data);
};

export const getAnomalySignals = async (
  tenantId: string,
  filters?: {
    siteId?: string;
    assetId?: string;
    anomalyType?: string;
    severity?: AnomalySeverity;
    status?: AnomalyStatus;
    limit?: number;
    offset?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('anomaly_signals')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('detected_at', { ascending: false });

  if (filters?.siteId) {
    query = query.eq('site_id', filters.siteId);
  }
  if (filters?.assetId) {
    query = query.eq('asset_id', filters.assetId);
  }
  if (filters?.anomalyType) {
    query = query.eq('anomaly_type', filters.anomalyType);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<AnomalySignal[]>(data || []);
};

export const createAnomalySignal = async (signal: Omit<AnomalySignal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('anomaly_signals')
    .insert(signal)
    .select()
    .single();

  if (error) throw error;
  return data as AnomalySignal;
};

export const updateAnomalySignal = async (
  tenantId: string,
  signalId: string,
  updates: Partial<AnomalySignal>
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('anomaly_signals')
    .update(updates)
    .eq('tenant_id', tenantUUID)
    .eq('id', signalId)
    .select()
    .single();

  if (error) throw error;
  return data as AnomalySignal;
};

export const getAnomalyDashboardMetrics = async (
  tenantId: string,
  timeRangeDays: number = 7
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('anomaly_dashboard_metrics')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .gte('detection_hour', new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000).toISOString())
    .order('detection_hour', { ascending: false });

  if (error) throw error;
  return data;
};

export const getBaselineHealthStatus = async (tenantId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('baseline_health_status')
    .select('*')
    .eq('tenant_id', tenantUUID);

  if (error) throw error;
  return data;
};

// ===== RESPONSE PLAYBOOKS QUERIES =====

export const getResponsePlaybooks = async (
  tenantId: string,
  filters?: {
    status?: PlaybookStatus;
    category?: string;
    triggerType?: string;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('response_playbooks')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.triggerType) {
    query = query.eq('trigger_type', filters.triggerType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ResponsePlaybook[];
};

export const getResponsePlaybookById = async (tenantId: string, playbookId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('response_playbooks')
    .select(`
      *,
      security_users!created_by(full_name, email),
      security_users!approved_by(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('id', playbookId)
    .single();

  if (error) throw error;
  return data as ResponsePlaybook;
};

export const createResponsePlaybook = async (playbook: Omit<ResponsePlaybook, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('response_playbooks')
    .insert(playbook)
    .select()
    .single();

  if (error) throw error;
  return data as ResponsePlaybook;
};

export const getPlaybookSteps = async (tenantId: string, playbookId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('playbook_steps')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('playbook_id', playbookId)
    .order('step_number', { ascending: true });

  if (error) throw error;
  return data as PlaybookStep[];
};

export const createPlaybookStep = async (step: Omit<PlaybookStep, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('playbook_steps')
    .insert(step)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookStep;
};

export const getPlaybookExecutions = async (
  tenantId: string,
  filters?: {
    playbookId?: string;
    status?: ExecutionStatus;
    executedBy?: string;
    limit?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('playbook_executions')
    .select(`
      *,
      response_playbooks(name, category),
      security_users!executed_by(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .order('started_at', { ascending: false });

  if (filters?.playbookId) {
    query = query.eq('playbook_id', filters.playbookId);
  }
  if (filters?.status) {
    query = query.eq('execution_status', filters.status);
  }
  if (filters?.executedBy) {
    query = query.eq('executed_by', filters.executedBy);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as PlaybookExecution[];
};

export const createPlaybookExecution = async (execution: Omit<PlaybookExecution, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('playbook_executions')
    .insert(execution)
    .select()
    .single();

  if (error) throw error;
  return data as PlaybookExecution;
};

export const getStepExecutions = async (tenantId: string, executionId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('step_executions')
    .select(`
      *,
      playbook_steps(name, step_type, step_number),
      security_users!assigned_to(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('execution_id', executionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as StepExecution[];
};

export const updateStepExecution = async (
  tenantId: string,
  stepExecutionId: string,
  updates: Partial<StepExecution>
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('step_executions')
    .update(updates)
    .eq('tenant_id', tenantUUID)
    .eq('id', stepExecutionId)
    .select()
    .single();

  if (error) throw error;
  return data as StepExecution;
};

export const getPlaybookExecutionSummary = async (tenantId: string, executionId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('playbook_execution_summary')
    .select('*')
    .eq('execution_id', executionId)
    .single();

  if (error) throw error;
  return data;
};

export const getPlaybookEffectivenessMetrics = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('playbook_effectiveness_metrics')
    .select('*')
    .order('total_executions', { ascending: false });

  if (error) throw error;
  return data;
};

// ===== THREAT INTELLIGENCE QUERIES =====

export const getThreatIntelligenceFeeds = async (tenantId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return toCamelCase<ThreatIntelligenceFeed[]>(data || []);
};

export const createThreatIntelligenceFeed = async (feed: Omit<ThreatIntelligenceFeed, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('threat_intelligence_feeds')
    .insert(feed)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<ThreatIntelligenceFeed>(data);
};

export const getThreatIntelligenceIndicators = async (
  tenantId: string,
  filters?: {
    feedId?: string;
    indicatorType?: ThreatType;
    confidence?: ThreatConfidence;
    isActive?: boolean;
    transmissionRelevant?: boolean;
    limit?: number;
    offset?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('threat_intelligence_indicators')
    .select(`
      *,
      threat_intelligence_feeds(name, provider)
    `)
    .eq('tenant_id', tenantUUID)
    .order('first_seen', { ascending: false });

  if (filters?.feedId) {
    query = query.eq('feed_id', filters.feedId);
  }
  if (filters?.indicatorType) {
    query = query.eq('indicator_type', filters.indicatorType);
  }
  if (filters?.confidence) {
    query = query.eq('confidence', filters.confidence);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.transmissionRelevant) {
    query = query.gte('transmission_relevance_score', 50);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<ThreatIntelligenceIndicator[]>(data || []);
};

export const createThreatIntelligenceIndicator = async (indicator: Omit<ThreatIntelligenceIndicator, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('threat_intelligence_indicators')
    .insert(indicator)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<ThreatIntelligenceIndicator>(data);
};

export const correlateThreatIntelligence = async (
  searchValue: string,
  searchType: string = 'any'
) => {
  const { data, error } = await supabase
    .rpc('correlate_threat_intelligence', {
      search_value: searchValue,
      search_type: searchType
    });

  if (error) throw error;
  return data;
};

export const getThreatIntelligenceMatches = async (
  tenantId: string,
  filters?: {
    indicatorId?: string;
    matchType?: string;
    responseStatus?: string;
    isConfirmed?: boolean;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('threat_intelligence_matches')
    .select(`
      *,
      threat_intelligence_indicators(indicator_value, indicator_type, threat_name),
      security_alerts(title, severity),
      incident_cases(title, severity),
      assets(name, asset_types(name))
    `)
    .eq('tenant_id', tenantUUID)
    .order('match_timestamp', { ascending: false });

  if (filters?.indicatorId) {
    query = query.eq('indicator_id', filters.indicatorId);
  }
  if (filters?.matchType) {
    query = query.eq('match_type', filters.matchType);
  }
  if (filters?.responseStatus) {
    query = query.eq('response_status', filters.responseStatus);
  }
  if (filters?.isConfirmed !== undefined) {
    query = query.eq('is_confirmed', filters.isConfirmed);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<ThreatIntelligenceMatch[]>(data || []);
};

export const createThreatIntelligenceMatch = async (match: Omit<ThreatIntelligenceMatch, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('threat_intelligence_matches')
    .insert(match)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<ThreatIntelligenceMatch>(data);
};

export const getThreatCampaigns = async (
  tenantId: string,
  filters?: {
    isActive?: boolean;
    transmissionTargeting?: boolean;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('threat_campaigns')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('first_observed', { ascending: false });

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.transmissionTargeting !== undefined) {
    query = query.eq('transmission_targeting', filters.transmissionTargeting);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<ThreatCampaign[]>(data || []);
};

export const getThreatIntelligenceSummary = async (tenantId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('threat_intelligence_summary')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .single();

  if (error) throw error;
  return data;
};

export const getThreatIntelligenceMatchesSummary = async (
  tenantId: string,
  timeRangeDays: number = 30
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('threat_intelligence_matches_summary')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .gte('match_date', new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000).toISOString())
    .order('match_date', { ascending: false });

  if (error) throw error;
  return data;
};

// ===== IMPACT ASSESSMENT QUERIES =====

export const getImpactAssessments = async (
  tenantId: string,
  filters?: {
    assessmentType?: string;
    overallSeverity?: ImpactSeverity;
    status?: string;
    limit?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('impact_assessments')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('assessment_date', { ascending: false });

  if (filters?.assessmentType) {
    query = query.eq('assessment_type', filters.assessmentType);
  }
  if (filters?.overallSeverity) {
    query = query.eq('overall_severity', filters.overallSeverity);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<ImpactAssessment[]>(data || []);
};

export const getImpactAssessmentById = async (tenantId: string, assessmentId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('impact_assessments')
    .select(`
      *,
      sites(name),
      assets(name, asset_type),
      grid_nodes(name, voltage_level),
      grid_lines(name, from_node_name, to_node_name),
      security_users!assessed_by(full_name, email),
      security_users!reviewed_by(full_name, email),
      security_users!approved_by(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('id', assessmentId)
    .single();

  if (error) throw error;
  return toCamelCase<ImpactAssessment>(data);
};

export const createImpactAssessment = async (assessment: Omit<ImpactAssessment, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('impact_assessments')
    .insert(assessment)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<ImpactAssessment>(data);
};

export const calculateBlastRadius = async (
  startNodeId?: string,
  startLineId?: string,
  maxHops: number = 3
) => {
  const { data, error } = await supabase
    .rpc('calculate_blast_radius', {
      start_node_id: startNodeId,
      start_line_id: startLineId,
      max_hops: maxHops
    });

  if (error) throw error;
  return data;
};

export const getCascadeAnalysis = async (tenantId: string, assessmentId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('cascade_analysis')
    .select(`
      *,
      grid_nodes!source_node_id(name, voltage_level),
      grid_nodes!target_node_id(name, voltage_level),
      grid_lines!source_line_id(name),
      grid_lines!target_line_id(name),
      assets!source_asset_id(name, asset_type),
      assets!target_asset_id(name, asset_type)
    `)
    .eq('tenant_id', tenantUUID)
    .eq('assessment_id', assessmentId)
    .order('cascade_step', { ascending: true });

  if (error) throw error;
  return toCamelCase<CascadeAnalysis[]>(data || []);
};

export const getImpactScenarios = async (
  tenantId: string,
  filters?: {
    scenarioType?: string;
    isActive?: boolean;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('impact_scenarios')
    .select(`
      *,
      response_playbooks(name, status),
      impact_assessments!baseline_assessment_id(name, overall_severity)
    `)
    .eq('tenant_id', tenantUUID)
    .order('created_at', { ascending: false });

  if (filters?.scenarioType) {
    query = query.eq('scenario_type', filters.scenarioType);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<ImpactScenario[]>(data || []);
};

export const getImpactAssessmentSummary = async (
  tenantId: string,
  timeRangeDays: number = 90
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('impact_assessment_summary')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('assessment_type', { ascending: true });

  if (error) throw error;
  return toCamelCase(data || []);
};

export const getCascadeRiskAnalysis = async (
  tenantId: string,
  timeRangeDays: number = 90
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  const { data, error } = await supabase
    .from('cascade_risk_analysis')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('total_potential_load_shed', { ascending: false });

  if (error) throw error;
  return toCamelCase(data || []);
};

// ===== SOAR ACTIONS QUERIES =====

export const getTransmissionSoarActions = async (
  tenantId: string,
  filters?: {
    type?: string;
    targetType?: string;
    requiresApproval?: boolean;
    isCritical?: boolean;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('transmission_soar_actions')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .order('name', { ascending: true });

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType);
  }
  if (filters?.requiresApproval !== undefined) {
    query = query.eq('requires_approval', filters.requiresApproval);
  }
  if (filters?.isCritical !== undefined) {
    query = query.eq('is_critical', filters.isCritical);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<TransmissionSoarAction[]>(data || []);
};

export const getTransmissionSoarActionById = async (tenantId: string, actionId: string) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('transmission_soar_actions')
    .select('*')
    .eq('tenant_id', tenantUUID)
    .eq('id', actionId)
    .single();

  if (error) throw error;
  return toCamelCase<TransmissionSoarAction>(data);
};

export const createTransmissionSoarAction = async (action: Omit<any, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('transmission_soar_actions')
    .insert(action)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<TransmissionSoarAction>(data);
};

export const updateTransmissionSoarAction = async (
  tenantId: string,
  actionId: string,
  updates: Partial<any>
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return null;

  const { data, error } = await supabase
    .from('transmission_soar_actions')
    .update(updates)
    .eq('tenant_id', tenantUUID)
    .eq('id', actionId)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<TransmissionSoarAction>(data);
};

export const getSoarActionExecutions = async (
  tenantId: string,
  filters?: {
    actionId?: string;
    executedBy?: string;
    result?: 'success' | 'failure' | 'partial';
    limit?: number;
    offset?: number;
  }
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) return [];

  let query = supabase
    .from('soar_action_executions')
    .select(`
      *,
      transmission_soar_actions(name, type, target_type),
      security_users!executed_by(full_name, email),
      security_users!approved_by(full_name, email)
    `)
    .eq('tenant_id', tenantUUID)
    .order('executed_at', { ascending: false });

  if (filters?.actionId) {
    query = query.eq('action_id', filters.actionId);
  }
  if (filters?.executedBy) {
    query = query.eq('executed_by', filters.executedBy);
  }
  if (filters?.result) {
    query = query.eq('result', filters.result);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return toCamelCase<SoarActionExecution[]>(data || []);
};

export const createSoarActionExecution = async (execution: Omit<any, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('soar_action_executions')
    .insert(execution)
    .select()
    .single();

  if (error) throw error;
  return toCamelCase<SoarActionExecution>(data);
};

export const executeSoarAction = async (
  tenantId: string,
  actionId: string,
  target: string,
  targetId?: string,
  executedBy?: string,
  approvedBy?: string
) => {
  const tenantUUID = await mapTenantIdToUUID(tenantId);
  if (!tenantUUID) throw new Error('Invalid tenant ID');

  // This would trigger the actual SOAR action execution
  // For now, we'll just create an execution record
  const execution = {
    tenant_id: tenantUUID,
    action_id: actionId,
    executed_at: new Date().toISOString(),
    executed_by: executedBy,
    target,
    target_id: targetId,
    result: 'success' as const,
    details: 'Action executed successfully',
    approved_by: approvedBy,
    approved_at: approvedBy ? new Date().toISOString() : undefined
  };

  return createSoarActionExecution(execution);
};