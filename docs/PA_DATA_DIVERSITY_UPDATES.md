# Process Automation Data Diversity Updates

## Summary
The Supabase seed files for Process Automation have been updated to ensure data diversity across all features. This includes mixing active/inactive statuses, adding more records to history/log tables, and ensuring various edge cases (like failed simulations or rejected approvals) are represented.

## Updates by Feature

### 1. Tag Mapping (`007_pa_tag_mappings.sql`)
- Modified 3 mappings to be inactive (`is_active = false`).
- Includes 'Circuit breaker 01 status', 'Generator 1 output power', 'Fault alarm status'.

### 2. Control Models (`008_pa_control_models.sql`)
- Modified 'Capacitor Bank Switching' to be inactive (`is_active = false`) and disconnected.
- Changed 'Circuit Breaker Control' state to 'tripped'.
- Changed 'Generator Start-Stop Control' state to 'running'.

### 3. Action Bindings (`009_pa_action_bindings.sql`)
- Modified 'Close Circuit Breaker' to be inactive (`is_active = false`).
- Modified 'Schedule Preventive Maintenance' to be inactive (`is_active = false`).

### 4. Triggers (`010_pa_triggers.sql`)
- Modified 'Frequency Deviation Alert' to be disabled (`enabled = false`).

### 5. Alarm Rules (`011_pa_alarm_rules.sql`)
- Modified 'Quality Degradation' to be disabled (`enabled = false`).

### 6. Event Patterns (`012_pa_event_patterns.sql`)
- Modified 'Load-Voltage Correlation' to be disabled (`enabled = false`).

### 7. Workflows (`013_pa_workflows.sql`)
- Added 6 new workflows with diverse execution statuses:
  - `paused`: Grid Restoration Plan
  - `running`: Preventive Maintenance
  - `failed`: System Health Check
  - `completed`: Reactive Power Compensation
  - `draft`: New Substation Commissioning

### 8. Sequences (`014_pa_sequences.sql`)
- Added 3 new sequences with diverse statuses:
  - `inactive`: Black Start Generator Ramp
  - `draft`: Experimental Load Shedding
  - `testing`: Rapid Frequency Response

### 9. Control Rules (`015_pa_control_rules.sql`)
- Modified 'Transformer Overload Cooling' to be disabled (`enabled = false`).

### 10. Versions (`016_pa_versions.sql`)
- Added 6 new version records showing a realistic history:
  - Statuses: `pending`, `rejected`, `approved`, `archived`, `draft`.
  - Types: `major`, `minor`, `patch`.

### 11. Approvals (`017_pa_approvals.sql`)
- Added ~8 new approval records for various record types (trigger, control_rule, sequence, etc.).
- Mixed statuses: `pending`, `approved`, `rejected`, `draft`.

### 12. Simulations (`018_pa_simulations.sql`)
- Added ~8 new simulation records covering different types (sequence, control_model, trigger, etc.).
- Mixed outcomes: `completed` (success), `completed` (fail behavior), `failed`, `running`, `pending`.

### 13. Audit Logs (`019_pa_audit_logs.sql`)
- Added ~15 new audit log entries covering a wide range of events:
  - `login`, `logout`
  - `create`, `update`, `delete`
  - `execute`, `approve`, `alert`
  - `sync`, `config`, `import`, `export`, `error`, `recover`

## Next Steps
To apply these changes, the database needs to be re-seeded.
Run: `supabase db reset` (if locally developing with Supabase CLI) which applies migrations and runs seeds.
