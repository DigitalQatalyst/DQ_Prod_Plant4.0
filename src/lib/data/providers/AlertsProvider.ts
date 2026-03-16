/**
 * AlertsProvider
 * 
 * Implements API query functions for EMS Energy Alerts management.
 * Provides CRUD operations for energy alerts with state management,
 * activity tracking, and comprehensive filtering capabilities.
 * 
 * Requirements: 8.4, 8.5, 8.7, 8.8, 8.10, 8.11
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

// =============================================================================
// Energy Alert Types
// =============================================================================

export type EnergyAlertSourceType = 'anomaly' | 'pq_event';
export type EnergyAlertState = 'open' | 'acked' | 'closed';
export type EnergyAlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type AlertActivityType = 'created' | 'acknowledged' | 'assigned' | 'note_added' | 'closed';

export interface EnergyAlert {
  id: string;
  org_id: string;
  source_type: EnergyAlertSourceType;
  source_id: string;
  alert_state: EnergyAlertState;
  severity: EnergyAlertSeverity;
  assigned_to: string | null;
  ack_at: string | null;
  close_at: string | null;
  sla_due_at: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnergyAlertActivity {
  id: string;
  alert_id: string;
  activity_type: AlertActivityType;
  user_id: string | null;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  notes: string | null;
  created_at: string;
}

/**
 * Extended alert interface with source event details and topology context
 * From v_energy_alert_summary view
 */
export interface EnergyAlertSummary {
  // Alert details
  id: string;
  org_id: string;
  source_type: EnergyAlertSourceType;
  source_id: string;
  alert_state: EnergyAlertState;
  severity: EnergyAlertSeverity;
  assigned_to: string | null;
  ack_at: string | null;
  close_at: string | null;
  sla_due_at: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Source event details
  detected_at: string | null;
  event_type: string | null;
  event_description: string | null;
  magnitude: number | null;

  // Meter information
  meter_id: string | null;
  meter_name: string | null;
  meter_status: string | null;
  meter_role: string | null;
  energy_types: string[] | null;

  // Transmission topology context
  substation_id: string | null;
  substation_code: string | null;
  substation_name: string | null;
  substation_region: string | null;
  feeder_id: string | null;
  feeder_code: string | null;
  feeder_name: string | null;
  feeder_direction: string | null;
  feeder_voltage_kv: number | null;
  transformer_id: string | null;
  transformer_code: string | null;
  transformer_name: string | null;
  bay_id: string | null;
  bay_code: string | null;
  bay_name: string | null;
  bay_type: string | null;

  // Computed fields
  is_overdue: boolean;
  sla_hours_remaining: number | null;
  age_hours: number;
}

/**
 * Alert with full details including activity timeline
 */
export interface EnergyAlertWithActivity extends EnergyAlertSummary {
  activity: EnergyAlertActivity[];
}

// =============================================================================
// Filter Interfaces
// =============================================================================

/**
 * Filter options for listing alerts
 * Requirement: 8.9
 */
export interface ListAlertsFilters {
  org_id?: string;
  alert_state?: EnergyAlertState | EnergyAlertState[];
  severity?: EnergyAlertSeverity | EnergyAlertSeverity[];
  source_type?: EnergyAlertSourceType;
  assigned_to?: string;
  substation_id?: string;
  feeder_id?: string;
  meter_id?: string;
  is_overdue?: boolean;
  created_after?: string;
  created_before?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Sort options for alert lists
 */
export interface AlertSortOptions {
  field: 'created_at' | 'severity' | 'alert_state' | 'sla_due_at' | 'detected_at';
  direction: 'asc' | 'desc';
}

// =============================================================================
// AlertsProvider Class
// =============================================================================

export class AlertsProvider {
  /**
   * Ensure Supabase is configured before making queries
   */
  private ensureConnected(): void {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error(
        "Supabase client not initialized. " +
        "Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
  }

  /**
   * Handle RLS denial errors with user-friendly messages
   */
  private handleError(error: any, operation: string): never {
    // Check for RLS denial (insufficient permissions)
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      throw new Error('Insufficient access to this resource');
    }

    // Check for constraint violations
    if (error.code === '23505') {
      throw new Error(`Duplicate entry: ${error.message}`);
    }

    if (error.code === '23503') {
      throw new Error(`Referenced entity not found: ${error.message}`);
    }

    if (error.code === '23514') {
      throw new Error(`Validation failed: ${error.message}`);
    }

    // Generic error
    throw new Error(`${operation} failed: ${error.message}`);
  }

  // Cached tenant ID for Power Transmission demo tenant
  private cachedTransmissionTenantId: string | null = null;

  private async getDefaultTransmissionTenantId(): Promise<string> {
    if (this.cachedTransmissionTenantId) {
      return this.cachedTransmissionTenantId;
    }

    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('tenants')
        .select('id')
        .ilike('name', '%Transmission%')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Fallback static ID if not found
          return '69083830-a193-4f8b-aab2-0d17349d286c';
        }
        throw new Error(`getDefaultTransmissionTenantId failed: ${error.message}`);
      }

      this.cachedTransmissionTenantId = data!.id;
      return data!.id;
    } catch (e) {
      return '69083830-a193-4f8b-aab2-0d17349d286c';
    }
  }

  async resolveTenantId(tenantId?: string): Promise<string | undefined> {
    if (!tenantId) return undefined;
    if (tenantId === 't-dewa' || tenantId === 'dewa-transmission' || tenantId === '69083830-a193-4f8b-aab2-0d17349d286c') {
      return this.getDefaultTransmissionTenantId();
    }
    return tenantId;
  }

  // ============================================================================
  // ALERT LISTING AND RETRIEVAL
  // ============================================================================

  /**
   * List alerts with joins to context
   * Uses v_energy_alert_summary view for comprehensive alert information
   * Requirement: 8.9
   */
  async listAlerts(filters?: ListAlertsFilters, sort?: AlertSortOptions): Promise<EnergyAlertSummary[]> {
    this.ensureConnected();

    try {
      let query = supabase!.from('v_energy_alert_summary').select('*');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }

      if (filters?.alert_state) {
        if (Array.isArray(filters.alert_state)) {
          query = query.in('alert_state', filters.alert_state);
        } else {
          query = query.eq('alert_state', filters.alert_state);
        }
      }

      if (filters?.severity) {
        if (Array.isArray(filters.severity)) {
          query = query.in('severity', filters.severity);
        } else {
          query = query.eq('severity', filters.severity);
        }
      }

      if (filters?.source_type) {
        query = query.eq('source_type', filters.source_type);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }

      if (filters?.feeder_id) {
        query = query.eq('feeder_id', filters.feeder_id);
      }

      if (filters?.meter_id) {
        query = query.eq('meter_id', filters.meter_id);
      }

      if (filters?.is_overdue !== undefined) {
        query = query.eq('is_overdue', filters.is_overdue);
      }

      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort: Critical/High severity first, then by creation time (newest first)
        query = query.order('severity', { ascending: false })
          .order('created_at', { ascending: false });
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'listAlerts');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'listAlerts');
    }
  }

  /**
   * Get a single alert with full details and activity timeline
   * Requirement: 8.4, 8.5
   */
  async getAlert(id: string): Promise<EnergyAlertWithActivity | null> {
    this.ensureConnected();

    try {
      // Get alert summary
      const { data: alertData, error: alertError } = await supabase!
        .from('v_energy_alert_summary')
        .select('*')
        .eq('id', id)
        .single();

      if (alertError) {
        if (alertError.code === 'PGRST116') {
          // Not found
          return null;
        }
        this.handleError(alertError, 'getAlert');
      }

      if (!alertData) {
        return null;
      }

      // Get activity timeline
      const { data: activityData, error: activityError } = await supabase!
        .from('energy_alert_activity')
        .select('*')
        .eq('alert_id', id)
        .order('created_at', { ascending: true });

      if (activityError) {
        this.handleError(activityError, 'getAlert');
      }

      return {
        ...alertData,
        activity: activityData || []
      };
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getAlert');
    }
  }

  // ============================================================================
  // ALERT STATE MANAGEMENT
  // ============================================================================

  /**
   * Acknowledge an alert
   * Updates state to 'acked' and records timestamp and user
   * Requirement: 8.4, 8.5
   */
  async acknowledgeAlert(id: string, user_id: string): Promise<EnergyAlert> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_alerts')
        .update({
          alert_state: 'acked',
          ack_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('alert_state', 'open') // Only allow ack from open state
        .select()
        .single();

      if (error) {
        this.handleError(error, 'acknowledgeAlert');
      }

      if (!data) {
        throw new Error('Alert not found or already acknowledged');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Insufficient access') || error.message.startsWith('Alert not found'))) {
        throw error;
      }
      this.handleError(error, 'acknowledgeAlert');
    }
  }

  /**
   * Assign an alert to a user
   * Requirement: 8.7, 8.8
   */
  async assignAlert(id: string, assignee_id: string): Promise<EnergyAlert> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_alerts')
        .update({
          assigned_to: assignee_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'assignAlert');
      }

      if (!data) {
        throw new Error('Alert not found');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Insufficient access') || error.message.startsWith('Alert not found'))) {
        throw error;
      }
      this.handleError(error, 'assignAlert');
    }
  }

  /**
   * Close an alert - restricted to ops role
   * Updates state to 'closed' and records timestamp, user, and notes
   * Requirement: 8.5, 8.11
   */
  async closeAlert(id: string, user_id: string, notes?: string): Promise<EnergyAlert> {
    this.ensureConnected();

    try {
      // Note: Role-based access control should be implemented at the RLS policy level
      // or through middleware that validates user roles before calling this method

      const { data, error } = await supabase!
        .from('energy_alerts')
        .update({
          alert_state: 'closed',
          close_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .in('alert_state', ['open', 'acked']) // Allow close from open or acked state
        .select()
        .single();

      if (error) {
        this.handleError(error, 'closeAlert');
      }

      if (!data) {
        throw new Error('Alert not found or already closed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error && (error.message.startsWith('Insufficient access') || error.message.startsWith('Alert not found'))) {
        throw error;
      }
      this.handleError(error, 'closeAlert');
    }
  }

  /**
   * Add a note to an alert
   * Creates an activity record for the note
   * Requirement: 8.8
   */
  async addAlertNote(id: string, note: string, user_id: string): Promise<EnergyAlertActivity> {
    this.ensureConnected();

    try {
      // First, update the alert's notes field (append to existing notes)
      const { data: alertData, error: alertError } = await supabase!
        .from('energy_alerts')
        .select('notes')
        .eq('id', id)
        .single();

      if (alertError) {
        this.handleError(alertError, 'addAlertNote');
      }

      const existingNotes = alertData?.notes || '';
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n[${new Date().toISOString()}] ${note}`
        : `[${new Date().toISOString()}] ${note}`;

      const { error: updateError } = await supabase!
        .from('energy_alerts')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        this.handleError(updateError, 'addAlertNote');
      }

      // Create activity record
      const { data: activityData, error: activityError } = await supabase!
        .from('energy_alert_activity')
        .insert({
          alert_id: id,
          activity_type: 'note_added',
          user_id,
          notes: note,
          new_value: { notes: updatedNotes }
        })
        .select()
        .single();

      if (activityError) {
        this.handleError(activityError, 'addAlertNote');
      }

      return activityData!;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'addAlertNote');
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk assign alerts to a user
   * Requirement: 8.10
   */
  async bulkAssignAlerts(ids: string[], assignee_id: string): Promise<EnergyAlert[]> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_alerts')
        .update({
          assigned_to: assignee_id,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select();

      if (error) {
        this.handleError(error, 'bulkAssignAlerts');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'bulkAssignAlerts');
    }
  }

  /**
   * Bulk acknowledge alerts
   * Requirement: 8.10
   */
  async bulkAcknowledgeAlerts(ids: string[], user_id: string): Promise<EnergyAlert[]> {
    this.ensureConnected();

    try {
      const { data, error } = await supabase!
        .from('energy_alerts')
        .update({
          alert_state: 'acked',
          ack_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .eq('alert_state', 'open') // Only allow ack from open state
        .select();

      if (error) {
        this.handleError(error, 'bulkAcknowledgeAlerts');
      }

      return data || [];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'bulkAcknowledgeAlerts');
    }
  }

  // ============================================================================
  // STATISTICS AND SUMMARY
  // ============================================================================

  /**
   * Get alert statistics for dashboard widgets
   */
  async getAlertStatistics(filters?: { org_id?: string; substation_id?: string; feeder_id?: string }): Promise<{
    total: number;
    open: number;
    acked: number;
    closed: number;
    overdue: number;
    by_severity: Record<EnergyAlertSeverity, number>;
    by_source_type: Record<EnergyAlertSourceType, number>;
  }> {
    this.ensureConnected();

    try {
      let query = supabase!.from('v_energy_alert_summary').select('alert_state, severity, source_type, is_overdue');

      // Apply filters
      if (filters?.org_id) {
        const resolvedOrgId = await this.resolveTenantId(filters.org_id);
        if (resolvedOrgId) {
          query = query.eq('org_id', resolvedOrgId);
        }
      }
      if (filters?.substation_id) {
        query = query.eq('substation_id', filters.substation_id);
      }
      if (filters?.feeder_id) {
        query = query.eq('feeder_id', filters.feeder_id);
      }

      const { data, error } = await query;

      if (error) {
        this.handleError(error, 'getAlertStatistics');
      }

      const alerts = data || [];

      // Calculate statistics
      const stats = {
        total: alerts.length,
        open: alerts.filter(a => a.alert_state === 'open').length,
        acked: alerts.filter(a => a.alert_state === 'acked').length,
        closed: alerts.filter(a => a.alert_state === 'closed').length,
        overdue: alerts.filter(a => a.is_overdue).length,
        by_severity: {
          'Low': alerts.filter(a => a.severity === 'Low').length,
          'Medium': alerts.filter(a => a.severity === 'Medium').length,
          'High': alerts.filter(a => a.severity === 'High').length,
          'Critical': alerts.filter(a => a.severity === 'Critical').length,
        } as Record<EnergyAlertSeverity, number>,
        by_source_type: {
          'anomaly': alerts.filter(a => a.source_type === 'anomaly').length,
          'pq_event': alerts.filter(a => a.source_type === 'pq_event').length,
        } as Record<EnergyAlertSourceType, number>
      };

      return stats;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Insufficient access')) {
        throw error;
      }
      this.handleError(error, 'getAlertStatistics');
    }
  }
}

// Singleton instance
let alertsProviderInstance: AlertsProvider | null = null;

/**
 * Get the singleton AlertsProvider instance
 */
export function getAlertsProvider(): AlertsProvider {
  if (!alertsProviderInstance) {
    alertsProviderInstance = new AlertsProvider();
  }
  return alertsProviderInstance;
}