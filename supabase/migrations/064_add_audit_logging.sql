-- ============================================================================
-- Add Audit Logging for APM Transmission
-- ============================================================================
-- This migration creates an audit log table and triggers to log all write
-- operations on APM tables for compliance and security purposes.
--
-- Requirements: 25.8
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Create Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  user_id TEXT,
  user_email TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_operation 
  ON audit_logs(table_name, operation, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
  ON audit_logs(user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record 
  ON audit_logs(table_name, record_id, changed_at DESC);

-- Enable RLS on audit logs (read-only for authenticated users)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow authenticated read on audit_logs'
  ) THEN
    CREATE POLICY "Allow authenticated read on audit_logs"
      ON audit_logs FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- 2. Create Audit Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  user_id_val TEXT;
  user_email_val TEXT;
BEGIN
  -- Extract user information from JWT if available
  BEGIN
    user_id_val := current_setting('request.jwt.claims', true)::json->>'sub';
    user_email_val := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION
    WHEN OTHERS THEN
      user_id_val := NULL;
      user_email_val := NULL;
  END;

  -- Log the operation
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      user_id,
      user_email,
      old_data
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      OLD.id,
      user_id_val,
      user_email_val,
      row_to_json(OLD)::jsonb
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      user_id,
      user_email,
      old_data,
      new_data
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      user_id_val,
      user_email_val,
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      table_name,
      operation,
      record_id,
      user_id,
      user_email,
      new_data
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      user_id_val,
      user_email_val,
      row_to_json(NEW)::jsonb
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Create Audit Triggers on Key Tables
-- ============================================================================

-- Assets
DROP TRIGGER IF EXISTS audit_assets_trigger ON assets;
CREATE TRIGGER audit_assets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Asset relationships
DROP TRIGGER IF EXISTS audit_asset_relationships_trigger ON asset_relationships;
CREATE TRIGGER audit_asset_relationships_trigger
  AFTER INSERT OR UPDATE OR DELETE ON asset_relationships
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- FMEA entries
DROP TRIGGER IF EXISTS audit_fmea_entries_trigger ON fmea_entries;
CREATE TRIGGER audit_fmea_entries_trigger
  AFTER INSERT OR UPDATE OR DELETE ON fmea_entries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Spare parts
DROP TRIGGER IF EXISTS audit_spare_parts_trigger ON spare_parts;
CREATE TRIGGER audit_spare_parts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON spare_parts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Diagnostic events
DROP TRIGGER IF EXISTS audit_diagnostic_events_trigger ON diagnostic_events;
CREATE TRIGGER audit_diagnostic_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON diagnostic_events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Downtime events
DROP TRIGGER IF EXISTS audit_downtime_events_trigger ON downtime_events;
CREATE TRIGGER audit_downtime_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON downtime_events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- RCA records
DROP TRIGGER IF EXISTS audit_rca_records_trigger ON rca_records;
CREATE TRIGGER audit_rca_records_trigger
  AFTER INSERT OR UPDATE OR DELETE ON rca_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Failure predictions
DROP TRIGGER IF EXISTS audit_failure_predictions_trigger ON failure_predictions;
CREATE TRIGGER audit_failure_predictions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON failure_predictions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- CBM triggers
DROP TRIGGER IF EXISTS audit_cbm_triggers_trigger ON cbm_triggers;
CREATE TRIGGER audit_cbm_triggers_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cbm_triggers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Maintenance recommendations
DROP TRIGGER IF EXISTS audit_maintenance_recommendations_trigger ON maintenance_recommendations;
CREATE TRIGGER audit_maintenance_recommendations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_recommendations
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Performance benchmarks
DROP TRIGGER IF EXISTS audit_performance_benchmarks_trigger ON performance_benchmarks;
CREATE TRIGGER audit_performance_benchmarks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON performance_benchmarks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Risk scoring model
DROP TRIGGER IF EXISTS audit_risk_scoring_model_trigger ON risk_scoring_model;
CREATE TRIGGER audit_risk_scoring_model_trigger
  AFTER INSERT OR UPDATE OR DELETE ON risk_scoring_model
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- APM alerts
DROP TRIGGER IF EXISTS audit_apm_alerts_trigger ON apm_alerts;
CREATE TRIGGER audit_apm_alerts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON apm_alerts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Dashboards
DROP TRIGGER IF EXISTS audit_dashboards_trigger ON dashboards;
CREATE TRIGGER audit_dashboards_trigger
  AFTER INSERT OR UPDATE OR DELETE ON dashboards
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Dashboard widgets
DROP TRIGGER IF EXISTS audit_dashboard_widgets_trigger ON dashboard_widgets;
CREATE TRIGGER audit_dashboard_widgets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

COMMIT;

-- ============================================================================
-- Audit Logging Enabled
-- ============================================================================
-- All write operations on key APM tables are now logged to audit_logs table
-- Audit logs include:
-- - Table name and operation type
-- - Record ID
-- - User ID and email (from JWT)
-- - Timestamp
-- - Old and new data (JSONB)
-- ============================================================================
