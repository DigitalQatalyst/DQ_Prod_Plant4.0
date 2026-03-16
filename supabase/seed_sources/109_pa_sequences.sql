-- Seed: 109_pa_sequences
-- Description: Detailed step-by-step procedures with precise timing for Power Transmission
-- AC: 2.8.1-2.8.7

BEGIN;

WITH tenant AS (
  SELECT id FROM tenants WHERE name = 'DEWA - Transmission' AND sector = 'power' LIMIT 1
)
INSERT INTO pa_sequences (
  tenant_id,
  name,
  description,
  steps,
  execution_mode,
  total_duration_seconds,
  status
)
SELECT
  tenant.id,
  v.name,
  v.description,
  v.steps::jsonb,
  v.execution_mode,
  v.total_duration_seconds,
  v.status
FROM tenant
CROSS JOIN (VALUES
  (
    'Fault Clearance Sequence',
    'Precise millisecond-level sequence to isolate grid faults',
    '[
      {"step": 1, "action": "Detect Fault", "delay_ms": 10},
      {"step": 2, "action": "Trip Primary Breaker", "delay_ms": 50},
      {"step": 3, "action": "Verify Arc Extinguished", "delay_ms": 100},
      {"step": 4, "action": "Trip Secondary Breaker", "delay_ms": 20, "condition": "fault_persists"}
    ]',
    'sequential',
    1,
    'active'
  ),
  (
    'Auto-Reclose Cycle',
    'Standard triple-attempt reclose sequence for transient faults',
    '[
      {"step": 1, "attempt": 1, "wait_s": 1},
      {"step": 2, "attempt": 2, "wait_s": 5},
      {"step": 3, "attempt": 3, "wait_s": 30}
    ]',
    'conditional',
    36,
    'active'
  ),
  (
    'Transformer Cooling Fan Start',
    'Parallel start sequence for transformer cooling bank',
    '[
      {"step": 1, "fan": "Bank-A1", "action": "START"},
      {"step": 2, "fan": "Bank-A2", "action": "START"},
      {"step": 3, "fan": "Bank-B1", "action": "START"},
      {"step": 4, "fan": "Bank-B2", "action": "START"}
    ]',
    'parallel',
    5,
    'active'
  ),
  (
    'Backup Generator Sync',
    'Precise synchronization sequence for diesel generators',
    '[
      {"step": 1, "action": "Reach Rated RPM", "timeout_s": 10},
      {"step": 2, "action": "Excite Alternator", "timeout_s": 2},
      {"step": 3, "action": "Match Phase Angle", "tolerance_deg": 5},
      {"step": 4, "action": "Close Incomer", "on_sync": true}
    ]',
    'sequential',
    20,
    'active'
  ),
  (
    'Capacitor Bank Switching',
    'Staged switching of capacitor banks for reactive power control',
    '[
      {"step": 1, "bank": 1, "kv_step": 50, "delay_s": 120},
      {"step": 2, "bank": 2, "kv_step": 50, "delay_s": 120},
      {"step": 3, "bank": 3, "kv_step": 100, "delay_s": 300}
    ]',
    'sequential',
    540,
    'active'
  ),
  (
    'Black Start Generator Ramp',
    'Emergency ramp up sequence for black start generator',
    '[
      {"step": 1, "action": "Start Aux Oil Pump", "delay_ms": 0},
      {"step": 2, "action": "Crank Engine", "delay_ms": 2000},
      {"step": 3, "action": "Ramp 50%", "delay_ms": 5000},
      {"step": 4, "action": "Ramp 100%", "delay_ms": 5000}
    ]',
    'sequential',
    15,
    'inactive'
  ),
  (
    'Experimental Load Shedding',
    'New load shedding sequence under testing',
    '[
      {"step": 1, "action": "Shed Zone A", "delay_ms": 10},
      {"step": 2, "action": "Shed Zone B", "delay_ms": 20}
    ]',
    'sequential',
    1,
    'draft'
  ),
  (
    'Rapid Frequency Response',
    'Fast frequency response sequence using battery storage',
    '[
      {"step": 1, "action": "Detect F<49.8", "delay_ms": 5},
      {"step": 2, "action": "Discharge 50MW", "delay_ms": 20}
    ]',
    'conditional',
    1,
    'testing'
  )
) AS v(name, description, steps, execution_mode, total_duration_seconds, status)
ON CONFLICT (tenant_id, name) DO NOTHING;

COMMIT;
