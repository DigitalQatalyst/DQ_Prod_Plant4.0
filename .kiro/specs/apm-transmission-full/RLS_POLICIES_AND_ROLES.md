# APM Power Transmission - RLS Policies and Roles

## Overview

This document describes the Row-Level Security (RLS) policies and role-based access control (RBAC) for the APM Power Transmission system. RLS ensures tenant isolation and role-based data access at the database level.

## Security Architecture

### Defense in Depth

The APM system implements multiple security layers:

1. **Authentication**: JWT-based authentication via Supabase Auth
2. **Row-Level Security**: Database-level access control
3. **Role-Based Access**: Function-level permissions
4. **Audit Logging**: All write operations logged

### Tenant Isolation

All APM data is isolated by tenant using the existing tenant context:

- **Sector**: `power`
- **Subsector**: `transmission`
- **Tenant ID**: Derived from user's organization

## Roles and Permissions

### Role Hierarchy

```
apm_admin (highest privileges)
  ├── reliability_engineer
  │   ├── maintenance_planner
  │   │   └── operations_engineer
  │   │       └── authenticated (read-only)
  └── data_analyst (read-only)
```

### Role Definitions

#### 1. authenticated (Base Role)

**Description:** All authenticated users have read access to APM data within their tenant.

**Permissions:**
- ✅ Read assets, telemetry, health scores
- ✅ Read diagnostic events, alerts
- ✅ Read reports and dashboards
- ❌ No write permissions

**Use Case:** Viewers, executives, external stakeholders

#### 2. operations_engineer

**Description:** Operations staff who monitor assets and respond to alerts.

**Permissions:**
- ✅ All `authenticated` permissions
- ✅ Acknowledge alerts
- ✅ Acknowledge diagnostic events
- ✅ Create manual alerts
- ❌ Cannot close events or modify data

**Use Case:** Control room operators, shift engineers

#### 3. maintenance_planner

**Description:** Maintenance staff who plan and schedule work.

**Permissions:**
- ✅ All `operations_engineer` permissions
- ✅ Acknowledge maintenance recommendations
- ✅ Schedule maintenance recommendations
- ✅ Close maintenance recommendations
- ✅ Update spare parts inventory
- ❌ Cannot modify health models or CBM triggers

**Use Case:** Maintenance planners, work order coordinators

#### 4. reliability_engineer

**Description:** Reliability engineers who analyze failures and optimize maintenance.

**Permissions:**
- ✅ All `maintenance_planner` permissions
- ✅ Close diagnostic events with RCA
- ✅ Create/update RCA records
- ✅ Create/update FMEA entries
- ✅ Update health models
- ✅ Create/update CBM triggers
- ✅ Generate reports
- ❌ Cannot modify system configuration

**Use Case:** Reliability engineers, condition monitoring specialists

#### 5. data_analyst

**Description:** Data analysts who export and analyze APM data.

**Permissions:**
- ✅ All `authenticated` permissions
- ✅ Export data (CSV, JSON, Excel)
- ✅ Create custom dashboards
- ✅ Run ad-hoc queries
- ❌ No write permissions to operational data

**Use Case:** Data scientists, business analysts

#### 6. apm_admin

**Description:** System administrators with full access.

**Permissions:**
- ✅ All permissions
- ✅ Modify system configuration
- ✅ Update RLS policies
- ✅ Manage user roles
- ✅ Access audit logs

**Use Case:** System administrators, database administrators

## RLS Policy Implementation

### Policy Structure

Each table has two types of policies:

1. **Read Policies**: Control who can SELECT data
2. **Write Policies**: Control who can INSERT, UPDATE, DELETE data

### Policy Naming Convention

```
{table_name}_{operation}_{role}_policy

Examples:
- assets_select_authenticated_policy
- alerts_update_operations_engineer_policy
- health_models_update_reliability_engineer_policy
```

## Table-Specific Policies

### Assets Table

#### Read Policy

```sql
CREATE POLICY assets_select_authenticated_policy
ON assets FOR SELECT
TO authenticated
USING (
  sector = 'power_transmission'
  AND tenant_id = auth.jwt() ->> 'tenant_id'
);
```

**Logic:**
- All authenticated users can read transmission assets
- Filtered by user's tenant_id
- Only power_transmission sector visible

#### Write Policy

```sql
CREATE POLICY assets_insert_reliability_engineer_policy
ON assets FOR INSERT
TO authenticated
WITH CHECK (
  sector = 'power_transmission'
  AND tenant_id = auth.jwt() ->> 'tenant_id'
  AND auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);

CREATE POLICY assets_update_reliability_engineer_policy
ON assets FOR UPDATE
TO authenticated
USING (
  sector = 'power_transmission'
  AND tenant_id = auth.jwt() ->> 'tenant_id'
)
WITH CHECK (
  sector = 'power_transmission'
  AND tenant_id = auth.jwt() ->> 'tenant_id'
  AND auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);
```

**Logic:**
- Only reliability_engineer and apm_admin can create/update assets
- Cannot change sector or tenant_id
- Tenant isolation enforced

### Telemetry Data Table

#### Read Policy

```sql
CREATE POLICY telemetry_data_select_authenticated_policy
ON telemetry_data FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = telemetry_data.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

**Logic:**
- Users can only read telemetry for assets in their tenant
- Enforced via JOIN to assets table

#### Write Policy

```sql
CREATE POLICY telemetry_data_insert_system_policy
ON telemetry_data FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('apm_admin', 'system')
);
```

**Logic:**
- Only system processes can insert telemetry
- Prevents manual data manipulation

### Diagnostic Events Table

#### Read Policy

```sql
CREATE POLICY diagnostic_events_select_authenticated_policy
ON diagnostic_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = diagnostic_events.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

#### Write Policies

```sql
-- Acknowledge events
CREATE POLICY diagnostic_events_update_acknowledge_policy
ON diagnostic_events FOR UPDATE
TO authenticated
USING (
  state = 'open'
  AND EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = diagnostic_events.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
)
WITH CHECK (
  state = 'ack'
  AND acknowledged_by IS NOT NULL
  AND auth.jwt() ->> 'role' IN ('operations_engineer', 'maintenance_planner', 'reliability_engineer', 'apm_admin')
);

-- Close events
CREATE POLICY diagnostic_events_update_close_policy
ON diagnostic_events FOR UPDATE
TO authenticated
USING (
  state IN ('open', 'ack')
  AND EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = diagnostic_events.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
)
WITH CHECK (
  state = 'closed'
  AND closed_by IS NOT NULL
  AND resolution_notes IS NOT NULL
  AND auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);
```

**Logic:**
- operations_engineer can acknowledge events
- Only reliability_engineer can close events
- Must provide resolution_notes when closing

### Alerts Table

#### Read Policy

```sql
CREATE POLICY alerts_select_authenticated_policy
ON alerts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = alerts.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

#### Write Policies

```sql
-- Acknowledge alerts
CREATE POLICY alerts_update_acknowledge_policy
ON alerts FOR UPDATE
TO authenticated
USING (
  state = 'open'
  AND EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = alerts.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
)
WITH CHECK (
  state = 'ack'
  AND acknowledged_by IS NOT NULL
  AND auth.jwt() ->> 'role' IN ('operations_engineer', 'maintenance_planner', 'reliability_engineer', 'apm_admin')
);

-- Close alerts
CREATE POLICY alerts_update_close_policy
ON alerts FOR UPDATE
TO authenticated
USING (
  state IN ('open', 'ack')
  AND EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = alerts.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
)
WITH CHECK (
  state = 'closed'
  AND closed_by IS NOT NULL
  AND resolution_notes IS NOT NULL
  AND auth.jwt() ->> 'role' IN ('operations_engineer', 'maintenance_planner', 'reliability_engineer', 'apm_admin')
);
```

### Maintenance Recommendations Table

#### Read Policy

```sql
CREATE POLICY maintenance_recommendations_select_authenticated_policy
ON maintenance_recommendations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = maintenance_recommendations.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

#### Write Policies

```sql
-- Create recommendations
CREATE POLICY maintenance_recommendations_insert_policy
ON maintenance_recommendations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = maintenance_recommendations.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
  AND auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);

-- Update recommendations (schedule, close)
CREATE POLICY maintenance_recommendations_update_policy
ON maintenance_recommendations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM assets
    WHERE assets.id = maintenance_recommendations.asset_id
    AND assets.tenant_id = auth.jwt() ->> 'tenant_id'
  )
)
WITH CHECK (
  auth.jwt() ->> 'role' IN ('maintenance_planner', 'reliability_engineer', 'apm_admin')
);
```

### Health Models Table

#### Read Policy

```sql
CREATE POLICY health_models_select_authenticated_policy
ON health_models FOR SELECT
TO authenticated
USING (true);  -- All users can read health models
```

#### Write Policy

```sql
CREATE POLICY health_models_write_policy
ON health_models FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
)
WITH CHECK (
  auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);
```

**Logic:**
- All users can read health models
- Only reliability_engineer can modify models

### CBM Triggers Table

#### Read Policy

```sql
CREATE POLICY cbm_triggers_select_authenticated_policy
ON cbm_triggers FOR SELECT
TO authenticated
USING (true);  -- All users can read CBM triggers
```

#### Write Policy

```sql
CREATE POLICY cbm_triggers_write_policy
ON cbm_triggers FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
)
WITH CHECK (
  auth.jwt() ->> 'role' IN ('reliability_engineer', 'apm_admin')
);
```

### Dashboards Table

#### Read Policy

```sql
CREATE POLICY dashboards_select_policy
ON dashboards FOR SELECT
TO authenticated
USING (
  owner = auth.uid()
  OR EXISTS (
    SELECT 1 FROM dashboard_shares
    WHERE dashboard_shares.dashboard_id = dashboards.id
    AND dashboard_shares.shared_with_user_id = auth.uid()
  )
);
```

**Logic:**
- Users can read their own dashboards
- Users can read dashboards shared with them

#### Write Policy

```sql
CREATE POLICY dashboards_write_policy
ON dashboards FOR ALL
TO authenticated
USING (owner = auth.uid())
WITH CHECK (owner = auth.uid());
```

**Logic:**
- Users can only create/update/delete their own dashboards

### Export Jobs Table

#### Read Policy

```sql
CREATE POLICY export_jobs_select_policy
ON export_jobs FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

**Logic:**
- Users can only see their own export jobs

#### Write Policy

```sql
CREATE POLICY export_jobs_insert_policy
ON export_jobs FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND auth.jwt() ->> 'role' IN ('data_analyst', 'reliability_engineer', 'apm_admin')
);
```

**Logic:**
- Only data_analyst and above can create exports
- Users can only create exports for themselves

## Audit Logging

### Audit Log Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  record_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_role TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_operation ON audit_logs(table_name, operation);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, timestamp DESC);
```

### Audit Trigger Function

```sql
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    operation,
    record_id,
    user_id,
    user_role,
    tenant_id,
    old_data,
    new_data
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    auth.jwt() ->> 'role',
    COALESCE(
      NEW.tenant_id,
      OLD.tenant_id,
      (SELECT tenant_id FROM assets WHERE id = COALESCE(NEW.asset_id, OLD.asset_id))
    ),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Applying Audit Triggers

```sql
-- Apply to all write-sensitive tables
CREATE TRIGGER audit_assets_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_diagnostic_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON diagnostic_events
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_alerts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON alerts
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_maintenance_recommendations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_recommendations
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Add more triggers as needed
```

## Testing RLS Policies

### Test Setup

```sql
-- Create test users with different roles
INSERT INTO auth.users (id, email, role) VALUES
  ('user1-uuid', 'viewer@example.com', 'authenticated'),
  ('user2-uuid', 'operator@example.com', 'operations_engineer'),
  ('user3-uuid', 'planner@example.com', 'maintenance_planner'),
  ('user4-uuid', 'engineer@example.com', 'reliability_engineer'),
  ('user5-uuid', 'admin@example.com', 'apm_admin');
```

### Test Read Access

```sql
-- Test as authenticated user (should see only their tenant's data)
SET LOCAL jwt.claims.tenant_id = 'tenant1';
SET LOCAL jwt.claims.role = 'authenticated';

SELECT COUNT(*) FROM assets;  -- Should return only tenant1 assets
SELECT COUNT(*) FROM telemetry_data;  -- Should return only tenant1 telemetry
```

### Test Write Access

```sql
-- Test as operations_engineer (should be able to acknowledge alerts)
SET LOCAL jwt.claims.tenant_id = 'tenant1';
SET LOCAL jwt.claims.role = 'operations_engineer';
SET LOCAL jwt.claims.user_id = 'user2-uuid';

UPDATE alerts 
SET state = 'ack', acknowledged_by = 'user2-uuid', acknowledged_at = NOW()
WHERE id = 'alert-uuid' AND state = 'open';
-- Should succeed

UPDATE alerts 
SET state = 'closed', closed_by = 'user2-uuid', closed_at = NOW()
WHERE id = 'alert-uuid';
-- Should fail (operations_engineer cannot close alerts)
```

### Test Cross-Tenant Access

```sql
-- Test cross-tenant access (should fail)
SET LOCAL jwt.claims.tenant_id = 'tenant1';
SET LOCAL jwt.claims.role = 'reliability_engineer';

UPDATE assets 
SET name = 'Hacked Asset'
WHERE tenant_id = 'tenant2';
-- Should fail (cannot access tenant2 data)
```

## Applying RLS Policies

### Automated Script

```bash
# Apply all RLS policies
.\scripts\apply-rls-migrations.ps1
```

This script:
1. Enables RLS on all APM tables
2. Creates read policies for authenticated users
3. Creates write policies for authorized roles
4. Adds audit logging triggers
5. Verifies policies are active

### Manual Application

```sql
-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_data ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

-- Create policies
CREATE POLICY assets_select_authenticated_policy ...
CREATE POLICY assets_insert_reliability_engineer_policy ...
-- ... (repeat for all policies)

-- Add audit triggers
CREATE TRIGGER audit_assets_trigger ...
-- ... (repeat for all tables)
```

## Troubleshooting

### Issue: "Permission denied for table"

**Cause:** RLS is enabled but no policy allows access
**Solution:** Check user's role and tenant_id in JWT

```sql
-- Check current JWT claims
SELECT auth.jwt();

-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'assets';
```

### Issue: "Cannot read data from other tenant"

**Cause:** Working as intended - RLS is enforcing tenant isolation
**Solution:** Ensure user is assigned to correct tenant

### Issue: "Cannot update record"

**Cause:** User lacks required role for write operation
**Solution:** Check user's role and policy requirements

```sql
-- Check user's role
SELECT auth.jwt() ->> 'role';

-- Check policy requirements
SELECT * FROM pg_policies 
WHERE tablename = 'alerts' 
AND cmd = 'UPDATE';
```

## Best Practices

### 1. Always Use Parameterized Queries

```typescript
// Good
const { data } = await supabase
  .from('assets')
  .select('*')
  .eq('id', assetId);

// Bad - vulnerable to SQL injection
const { data } = await supabase
  .rpc('raw_query', { query: `SELECT * FROM assets WHERE id = '${assetId}'` });
```

### 2. Handle RLS Errors Gracefully

```typescript
try {
  const { data, error } = await supabase
    .from('assets')
    .update({ name: 'New Name' })
    .eq('id', assetId);
    
  if (error) {
    if (error.code === '42501') {  // Insufficient privilege
      toast.error('You do not have permission to perform this action');
    } else {
      toast.error('An error occurred');
    }
  }
} catch (error) {
  console.error('Update failed:', error);
}
```

### 3. Test with Different Roles

Always test functionality with different user roles to ensure RLS works correctly.

### 4. Monitor Audit Logs

Regularly review audit logs for suspicious activity:

```sql
-- Check recent write operations
SELECT * FROM audit_logs 
WHERE operation IN ('INSERT', 'UPDATE', 'DELETE')
ORDER BY timestamp DESC 
LIMIT 100;

-- Check operations by specific user
SELECT * FROM audit_logs 
WHERE user_id = 'user-uuid'
ORDER BY timestamp DESC;
```

### 5. Keep Policies Simple

Complex policies can impact performance. Keep policies simple and use indexes appropriately.

## Security Checklist

Before deploying to production:

- [ ] RLS enabled on all APM tables
- [ ] Read policies created for all tables
- [ ] Write policies created with role checks
- [ ] Audit logging enabled on sensitive tables
- [ ] Test with different user roles
- [ ] Test cross-tenant access (should fail)
- [ ] Test unauthorized write operations (should fail)
- [ ] Monitor audit logs for anomalies
- [ ] Document custom policies
- [ ] Review policies with security team

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Claims in Supabase](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)
