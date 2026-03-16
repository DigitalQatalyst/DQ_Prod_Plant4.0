-- Create energy alert summary view
-- Requirements: 8.3, 8.9
-- Task: 20. Create alert summary view

-- Drop view if it exists to allow recreation
DROP VIEW IF EXISTS v_energy_alert_summary;

-- Create comprehensive alert summary view joining alerts with source events and topology
CREATE VIEW v_energy_alert_summary AS
SELECT 
  -- Alert details
  a.id,
  a.org_id,
  a.source_type,
  a.source_id,
  a.alert_state,
  a.severity,
  a.assigned_to,
  a.ack_at,
  a.close_at,
  a.sla_due_at,
  a.tags,
  a.notes,
  a.created_at,
  a.updated_at,
  
  -- Detected timestamp from source event
  CASE 
    WHEN a.source_type = 'anomaly' THEN an.timestamp
    WHEN a.source_type = 'pq_event' THEN pq.timestamp
  END as detected_at,
  
  -- Source event details
  CASE 
    WHEN a.source_type = 'anomaly' THEN an.anomaly_type::TEXT
    WHEN a.source_type = 'pq_event' THEN pq.event_type
  END as event_type,
  
  CASE 
    WHEN a.source_type = 'anomaly' THEN an.description
    WHEN a.source_type = 'pq_event' THEN pq.description
  END as event_description,
  
  CASE 
    WHEN a.source_type = 'anomaly' THEN an.magnitude_pct
    WHEN a.source_type = 'pq_event' THEN pq.magnitude
  END as magnitude,
  
  -- Meter information
  m.id as meter_id,
  m.name as meter_name,
  m.status as meter_status,
  m.meter_role,
  m.energy_types,
  
  -- Transmission topology context
  s.id as substation_id,
  s.code as substation_code,
  s.name as substation_name,
  s.region as substation_region,
  
  f.id as feeder_id,
  f.feeder_code,
  f.name as feeder_name,
  f.direction as feeder_direction,
  f.voltage_level_kv as feeder_voltage_kv,
  
  t.id as transformer_id,
  t.transformer_code,
  t.name as transformer_name,
  
  b.id as bay_id,
  b.bay_code,
  b.name as bay_name,
  b.bay_type,
  
  -- Additional computed fields for UI
  CASE 
    WHEN a.sla_due_at IS NOT NULL AND a.sla_due_at < now() AND a.alert_state != 'closed' 
    THEN true 
    ELSE false 
  END as is_overdue,
  
  CASE 
    WHEN a.sla_due_at IS NOT NULL AND a.alert_state != 'closed'
    THEN EXTRACT(EPOCH FROM (a.sla_due_at - now())) / 3600.0  -- hours remaining
    ELSE NULL
  END as sla_hours_remaining,
  
  -- Age of alert in hours
  EXTRACT(EPOCH FROM (now() - a.created_at)) / 3600.0 as age_hours

FROM energy_alerts a

-- Left join to anomalies (when source_type = 'anomaly')
LEFT JOIN energy_anomalies an ON (
  a.source_type = 'anomaly' AND a.source_id = an.id
)

-- Left join to power quality events (when source_type = 'pq_event')
LEFT JOIN power_quality_events pq ON (
  a.source_type = 'pq_event' AND a.source_id = pq.id
)

-- Join to meter (from either anomaly or PQ event)
LEFT JOIN energy_meters m ON (
  m.id = COALESCE(an.meter_id, pq.meter_id)
)

-- Left join to transmission topology
LEFT JOIN tx_substations s ON m.substation_id = s.id
LEFT JOIN tx_feeders f ON m.feeder_id = f.id
LEFT JOIN tx_transformers t ON m.transformer_id = t.id
LEFT JOIN tx_bays b ON m.bay_id = b.id;

-- Add comment for documentation
COMMENT ON VIEW v_energy_alert_summary IS 'Comprehensive alert summary joining alerts with source events and transmission topology context. Optimized for alert list page queries (Requirements 8.3, 8.9)';

-- Create indexes on underlying tables to optimize view performance
-- (These may already exist, but ensuring they're present for optimal query performance)

-- Index on energy_alerts for common filtering
CREATE INDEX IF NOT EXISTS idx_energy_alerts_org_state_severity 
  ON energy_alerts(org_id, alert_state, severity);

-- Index on energy_alerts for SLA queries
CREATE INDEX IF NOT EXISTS idx_energy_alerts_sla_overdue 
  ON energy_alerts(sla_due_at, alert_state) 
  WHERE sla_due_at IS NOT NULL AND alert_state != 'closed';

-- Index on energy_anomalies for alert joins
CREATE INDEX IF NOT EXISTS idx_energy_anomalies_id_meter 
  ON energy_anomalies(id, meter_id);

-- Index on power_quality_events for alert joins  
CREATE INDEX IF NOT EXISTS idx_power_quality_events_id_meter 
  ON power_quality_events(id, meter_id);

-- Index on energy_meters for topology joins
CREATE INDEX IF NOT EXISTS idx_energy_meters_topology 
  ON energy_meters(substation_id, feeder_id, transformer_id, bay_id);