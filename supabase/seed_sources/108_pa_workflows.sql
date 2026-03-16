-- Seed: 108_pa_workflows
-- Description: Multi-step automated procedures for Power Transmission
-- AC: 2.7.1-2.7.8

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
)
INSERT INTO pa_workflows (
  tenant_id,
  name,
  description,
  steps,
  trigger_type,
  requires_approval,
  execution_status
)
SELECT
  tenant.id,
  v.name,
  v.description,
  v.steps::jsonb,
  v.trigger_type,
  v.requires_approval,
  v.execution_status
FROM tenant
CROSS JOIN (VALUES
  (
    'Substation Startup Sequence',
    'Standard procedure for bringing a substation online safely',
    '[
      {"step": 1, "name": "Pre-Checks", "action": "Verify Busbar Voltage", "duration": 30},
      {"step": 2, "name": "Isolator Close", "action": "Close Main Isolator", "duration": 45},
      {"step": 3, "name": "Breaker Sync", "action": "Sync and Close Breaker", "duration": 60, "condition": "voltage_stable"},
      {"step": 4, "name": "Final Status", "action": "Verify Site Status", "duration": 15}
    ]',
    'manual',
    true,
    'idle'
  ),
  (
    'Emergency Load Shedding',
    'High-priority procedure to reduce grid load during frequency drops',
    '[
      {"step": 1, "name": "Identify Blocks", "action": "Select Shedding Blocks", "duration": 5},
      {"step": 2, "name": "Execute Shed", "action": "Trip Non-Essential Breakers", "duration": 10},
      {"step": 3, "name": "Notify Ops", "action": "Send Critical Alert", "duration": 5}
    ]',
    'automatic',
    false,
    'idle'
  ),
  (
    'Daily Maintenance Diagnostic',
    'Routine automated diagnostic for transformer health',
    '[
      {"step": 1, "name": "Data Collection", "action": "Log Oil Readings", "duration": 300},
      {"step": 2, "name": "Analysis", "action": "Run Trend Analysis", "duration": 60},
      {"step": 3, "name": "Reporting", "action": "Generate Health Report", "duration": 30}
    ]',
    'scheduled',
    false,
    'idle'
  ),
  (
    'Line Isolation for Maintenance',
    'Safety procedure to isolate a transmission line for physical work',
    '[
      {"step": 1, "name": "De-energize", "action": "Open Site Breakers", "duration": 20},
      {"step": 2, "name": "Verify Dead", "action": "Check Line Voltage", "duration": 60},
      {"step": 3, "name": "Grounding", "action": "Close Earth Switch", "duration": 45},
      {"step": 4, "name": "Lockout", "action": "Issue LOTO Permit", "duration": 30}
    ]',
    'manual',
    true,
    'idle'
  ),
  (
    'Voltage Stabilization Loop',
    'Autonomous adjustment of transformer taps to maintain voltage',
    '[
      {"step": 1, "name": "Read Voltage", "action": "Monitor Secondary Bus", "duration": 10},
      {"step": 2, "name": "Decision", "action": "Calculate Tap Change", "duration": 5},
      {"step": 3, "name": "Execution", "action": "Set Tap Position", "duration": 15}
    ]',
    'automatic',
    false,
    'idle'
  ),
  (
    'Grid Restoration Plan',
    'Comprehensive procedure to restore grid sections after blackout',
    '[
      {"step": 1, "name": "Black Start", "action": "Start Essential Generators", "duration": 300},
      {"step": 2, "name": "Bus Energization", "action": "Energize Main Bus", "duration": 60},
      {"step": 3, "name": "Load Pickups", "action": "Restore Critical Feeders", "duration": 120}
    ]',
    'manual',
    true,
    'paused'
  ),
  (
    'Preventive Maintenance - Circuit Breaker',
    'Automated isolation and testing sequence for circuit breaker maintenance',
    '[
      {"step": 1, "name": "Isolation", "action": "Open Isolators", "duration": 30},
      {"step": 2, "name": "Grounding", "action": "Close Earth Switch", "duration": 15},
      {"step": 3, "name": "Testing", "action": "Run Contact Resistance Test", "duration": 60},
      {"step": 4, "name": "Restoration", "action": "Remove Ground & Close Isolators", "duration": 45}
    ]',
    'scheduled',
    true,
    'running'
  ),
  (
    'System Health Check',
    'Periodic diagnostic of all critical control systems (Failed run)',
    '[
      {"step": 1, "name": "Ping Devices", "action": "Check Connectivity", "duration": 10},
      {"step": 2, "name": "Verify Telemetry", "action": "Check Data Freshness", "duration": 10},
      {"step": 3, "name": "Self-Test", "action": "Controller Self-Diagnostic", "duration": 30}
    ]',
    'scheduled',
    false,
    'failed'
  ),
  (
    'Reactive Power Compensation Adjustment',
    'Daily optimization of capacitor banks (Completed)',
    '[
      {"step": 1, "name": "Analyze PF", "action": "Calculate Power Factor", "duration": 5},
      {"step": 2, "name": "Switch Banks", "action": "Toggle Capacitor Banks", "duration": 15},
      {"step": 3, "name": "Verify", "action": "Confirm PF Correction", "duration": 5}
    ]',
    'automatic',
    false,
    'completed'
  ),
  (
    'New Substation Commissioning',
    'Workflow for adding a new substation to the grid',
    '[
      {"step": 1, "name": "Config Check", "action": "Verify Settings", "duration": 120},
      {"step": 2, "name": "Comm Check", "action": "Verify SCADA Link", "duration": 60},
      {"step": 3, "name": "Live Test", "action": "Energize & Load", "duration": 240}
    ]',
    'manual',
    true,
    'draft'
  )
) AS v(name, description, steps, trigger_type, requires_approval, execution_status)
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;
