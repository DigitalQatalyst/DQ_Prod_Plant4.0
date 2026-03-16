/**
 * Supabase Client Utilities for Operational Excellence
 * Helper functions and queries for interacting with the operational excellence database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PerformancePanel,
  SimBoard,
  Issue,
  CiProject,
  OptimisationOpportunity,
  PerformanceSummary,
  ActiveIssuesSummary,
  CiProjectsSummary,
  OptimisationOpportunitiesSummary,
  PerformanceFilters,
  SimBoardFilters,
  IssueFilters,
  CiProjectFilters,
  OptimisationFilters,
  PaginatedResponse,
  CreatePerformancePanel,
  UpdatePerformancePanel,
  CreateSimBoard,
  UpdateSimBoard,
  CreateIssue,
  UpdateIssue,
  CreateCiProject,
  UpdateCiProject,
  CreateOptimisationOpportunity,
  UpdateOptimisationOpportunity,
  DatabaseConfig,
  SupabaseClientConfig
} from './supabase-types';

/**
 * Initialize Supabase client
 */
export function createSupabaseClient(
  config: DatabaseConfig,
  options?: SupabaseClientConfig
): SupabaseClient {
  return createClient(config.url, config.anon_key, options);
}

/**
 * Operational Excellence Database Service
 */
export class OperationalExcellenceService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Performance Panel Methods
  async getPerformancePanels(
    filters?: PerformanceFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<PerformancePanel>> {
    let query = this.supabase
      .from('performance_panels')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.sector) query = query.eq('sector', filters.sector);
    if (filters?.subsector) query = query.eq('subsector', filters.subsector);
    if (filters?.site_id) query = query.eq('asset.site_id', filters.site_id);
    if (filters?.asset_id) query = query.eq('asset_id', filters.asset_id);
    if (filters?.oee_min) query = query.gte('oee', filters.oee_min);
    if (filters?.oee_max) query = query.lte('oee', filters.oee_max);
    if (filters?.date_from) query = query.gte('last_updated', filters.date_from);
    if (filters?.date_to) query = query.lte('last_updated', filters.date_to);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async getPerformancePanelById(id: string): Promise<PerformancePanel | null> {
    const { data, error } = await this.supabase
      .from('performance_panels')
      .select(`
        *,
        tenant:tenants(*),
        asset:assets(*, site:sites(*)),
        losses:performance_losses(*),
        bottlenecks:performance_bottlenecks(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createPerformancePanel(panel: CreatePerformancePanel): Promise<PerformancePanel> {
    const { data, error } = await this.supabase
      .from('performance_panels')
      .insert(panel)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePerformancePanel(id: string, updates: UpdatePerformancePanel): Promise<PerformancePanel> {
    const { data, error } = await this.supabase
      .from('performance_panels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePerformancePanel(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('performance_panels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // SIM Board Methods
  async getSimBoards(
    filters?: SimBoardFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<SimBoard>> {
    let query = this.supabase
      .from('sim_boards')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.sector) query = query.eq('sector', filters.sector);
    if (filters?.subsector) query = query.eq('subsector', filters.subsector);
    if (filters?.site_id) query = query.eq('site_id', filters.site_id);
    if (filters?.shift_name) query = query.eq('shift_name', filters.shift_name);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.date_from) query = query.gte('shift_date', filters.date_from);
    if (filters?.date_to) query = query.lte('shift_date', filters.date_to);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async getSimBoardById(id: string): Promise<SimBoard | null> {
    const { data, error } = await this.supabase
      .from('sim_boards')
      .select(`
        *,
        tenant:tenants(*),
        site:sites(*),
        metrics:sim_metrics(*),
        issues:issues(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createSimBoard(board: CreateSimBoard): Promise<SimBoard> {
    const { data, error } = await this.supabase
      .from('sim_boards')
      .insert(board)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSimBoard(id: string, updates: UpdateSimBoard): Promise<SimBoard> {
    const { data, error } = await this.supabase
      .from('sim_boards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Issue Methods
  async getIssues(
    filters?: IssueFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<Issue>> {
    let query = this.supabase
      .from('issues')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.assignee) query = query.eq('assignee', filters.assignee);
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to) query = query.lte('created_at', filters.date_to);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async createIssue(issue: CreateIssue): Promise<Issue> {
    const { data, error } = await this.supabase
      .from('issues')
      .insert(issue)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateIssue(id: string, updates: UpdateIssue): Promise<Issue> {
    const { data, error } = await this.supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // CI Project Methods
  async getCiProjects(
    filters?: CiProjectFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<CiProject>> {
    let query = this.supabase
      .from('ci_projects')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.sector) query = query.eq('sector', filters.sector);
    if (filters?.subsector) query = query.eq('subsector', filters.subsector);
    if (filters?.stage) query = query.eq('stage', filters.stage);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.owner) query = query.eq('owner', filters.owner);
    if (filters?.date_from) query = query.gte('created_at', filters.date_from);
    if (filters?.date_to) query = query.lte('created_at', filters.date_to);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async getCiProjectById(id: string): Promise<CiProject | null> {
    const { data, error } = await this.supabase
      .from('ci_projects')
      .select(`
        *,
        tenant:tenants(*),
        root_causes:root_causes(*),
        countermeasures:countermeasures(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createCiProject(project: CreateCiProject): Promise<CiProject> {
    const { data, error } = await this.supabase
      .from('ci_projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCiProject(id: string, updates: UpdateCiProject): Promise<CiProject> {
    const { data, error } = await this.supabase
      .from('ci_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Optimisation Opportunity Methods
  async getOptimisationOpportunities(
    filters?: OptimisationFilters,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<OptimisationOpportunity>> {
    let query = this.supabase
      .from('optimisation_opportunities')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters?.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
    if (filters?.sector) query = query.eq('sector', filters.sector);
    if (filters?.subsector) query = query.eq('subsector', filters.subsector);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.confidence_min) query = query.gte('confidence_percentage', filters.confidence_min);
    if (filters?.rank_max) query = query.lte('rank_priority', filters.rank_max);

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  }

  async getOptimisationOpportunityById(id: string): Promise<OptimisationOpportunity | null> {
    const { data, error } = await this.supabase
      .from('optimisation_opportunities')
      .select(`
        *,
        tenant:tenants(*),
        recommendations:recommendations(*),
        scenarios:scenarios(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createOptimisationOpportunity(opportunity: CreateOptimisationOpportunity): Promise<OptimisationOpportunity> {
    const { data, error } = await this.supabase
      .from('optimisation_opportunities')
      .insert(opportunity)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOptimisationOpportunity(id: string, updates: UpdateOptimisationOpportunity): Promise<OptimisationOpportunity> {
    const { data, error } = await this.supabase
      .from('optimisation_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Summary Views
  async getPerformanceSummary(tenantId?: string): Promise<PerformanceSummary[]> {
    let query = this.supabase.from('performance_summary').select('*');
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getActiveIssuesSummary(tenantId?: string): Promise<ActiveIssuesSummary[]> {
    let query = this.supabase.from('active_issues_summary').select('*');
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCiProjectsSummary(tenantId?: string): Promise<CiProjectsSummary[]> {
    let query = this.supabase.from('ci_projects_summary').select('*');
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getOptimisationOpportunitiesSummary(tenantId?: string): Promise<OptimisationOpportunitiesSummary[]> {
    let query = this.supabase.from('optimisation_opportunities_summary').select('*');
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Dashboard Analytics
  async getDashboardMetrics(tenantId: string) {
    const [
      performancePanels,
      activeIssues,
      ciProjects,
      optimisationOpportunities
    ] = await Promise.all([
      this.getPerformancePanels({ tenant_id: tenantId }, 1, 1000),
      this.getIssues({ tenant_id: tenantId, status: 'open' }, 1, 1000),
      this.getCiProjects({ tenant_id: tenantId }, 1, 1000),
      this.getOptimisationOpportunities({ tenant_id: tenantId, status: 'new' }, 1, 1000)
    ]);

    const avgOEE = performancePanels.data.reduce((sum, panel) => sum + (panel.oee || 0), 0) / performancePanels.data.length;
    const criticalIssues = activeIssues.data.filter(issue => issue.priority === 'high').length;
    const activeProjects = ciProjects.data.filter(project => project.stage === 'implementation').length;
    const highConfidenceOpportunities = optimisationOpportunities.data.filter(opp => opp.confidence_percentage >= 80).length;

    return {
      avgOEE: Math.round(avgOEE * 100) / 100,
      totalPerformancePanels: performancePanels.count,
      criticalIssues,
      totalActiveIssues: activeIssues.count,
      activeProjects,
      totalCiProjects: ciProjects.count,
      highConfidenceOpportunities,
      totalOptimisationOpportunities: optimisationOpportunities.count
    };
  }

  // Real-time subscriptions
  subscribeToPerformancePanels(tenantId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('performance_panels_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_panels',
          filter: `tenant_id=eq.${tenantId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToIssues(tenantId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('issues_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `tenant_id=eq.${tenantId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToSimBoards(tenantId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('sim_boards_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sim_boards',
          filter: `tenant_id=eq.${tenantId}`
        },
        callback
      )
      .subscribe();
  }
}

// Utility functions
export function formatOEE(oee?: number): string {
  if (oee === undefined || oee === null) return 'N/A';
  return `${oee.toFixed(1)}%`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'good':
    case 'on-track':
    case 'completed':
    case 'resolved':
      return 'green';
    case 'warning':
    case 'at-risk':
    case 'in-progress':
      return 'yellow';
    case 'critical':
    case 'behind':
    case 'high':
    case 'open':
      return 'red';
    default:
      return 'gray';
  }
}

export function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
}

export function formatConfidence(confidence: number): string {
  return `${confidence}%`;
}

export function formatImpact(impact: string): string {
  return impact.replace(/([+-])(\d+(?:\.\d+)?)%/, '$1$2%');
}

// Export the service class and utilities
export default OperationalExcellenceService;