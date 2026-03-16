import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test for the v_energy_alert_summary view
// Requirements: 8.3, 8.9
// Task: 20. Create alert summary view

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Alert Summary View', () => {
  it('should have the v_energy_alert_summary view available', async () => {
    // Test that the view exists by querying it
    const { data, error } = await supabase
      .from('v_energy_alert_summary')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should include all required fields in the view', async () => {
    // Test that all required fields are present
    const { data, error } = await supabase
      .from('v_energy_alert_summary')
      .select(`
        id,
        org_id,
        source_type,
        source_id,
        alert_state,
        severity,
        detected_at,
        meter_name,
        substation_name,
        feeder_name,
        event_type,
        magnitude,
        is_overdue,
        age_hours
      `)
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should properly join alerts with anomalies and topology', async () => {
    // Test that the view properly joins data from multiple tables
    const { data, error } = await supabase
      .from('v_energy_alert_summary')
      .select(`
        id,
        source_type,
        detected_at,
        meter_name,
        substation_name,
        feeder_name,
        event_type
      `)
      .not('detected_at', 'is', null)
      .limit(5);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      // Verify that joined data is present
      const record = data[0];
      expect(record.detected_at).toBeDefined();
      expect(['anomaly', 'pq_event']).toContain(record.source_type);
    }
  });

  it('should calculate computed fields correctly', async () => {
    // Test computed fields like is_overdue and age_hours
    const { data, error } = await supabase
      .from('v_energy_alert_summary')
      .select(`
        id,
        alert_state,
        sla_due_at,
        is_overdue,
        age_hours,
        sla_hours_remaining
      `)
      .limit(5);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 0) {
      data.forEach(record => {
        // age_hours should be a positive number
        expect(record.age_hours).toBeGreaterThanOrEqual(0);
        
        // is_overdue should be boolean
        expect(typeof record.is_overdue).toBe('boolean');
        
        // If alert is closed, should not be overdue
        if (record.alert_state === 'closed') {
          expect(record.is_overdue).toBe(false);
        }
      });
    }
  });

  it('should support filtering by alert state and severity', async () => {
    // Test that the view supports common filtering operations
    const { data: openAlerts, error: openError } = await supabase
      .from('v_energy_alert_summary')
      .select('id, alert_state')
      .eq('alert_state', 'open')
      .limit(10);
    
    expect(openError).toBeNull();
    expect(openAlerts).toBeDefined();
    
    const { data: criticalAlerts, error: criticalError } = await supabase
      .from('v_energy_alert_summary')
      .select('id, severity')
      .eq('severity', 'Critical')
      .limit(10);
    
    expect(criticalError).toBeNull();
    expect(criticalAlerts).toBeDefined();
  });

  it('should support ordering by detected_at for alert list page', async () => {
    // Test ordering functionality for alert list page
    const { data, error } = await supabase
      .from('v_energy_alert_summary')
      .select(`
        id,
        detected_at,
        alert_state,
        severity
      `)
      .not('detected_at', 'is', null)
      .order('detected_at', { ascending: false })
      .limit(10);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    
    if (data && data.length > 1) {
      // Verify ordering
      for (let i = 1; i < data.length; i++) {
        const prev = new Date(data[i-1].detected_at);
        const curr = new Date(data[i].detected_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    }
  });
});