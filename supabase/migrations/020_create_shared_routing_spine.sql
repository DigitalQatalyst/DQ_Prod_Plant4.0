-- Create work_items table
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT,
  assigned_to_user_id UUID,
  due_at TIMESTAMPTZ,
  source_feature_area TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  deeplink_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_work_items_tenant_assigned_status 
  ON work_items(tenant_id, assigned_to_user_id, status);
CREATE INDEX idx_work_items_tenant_due 
  ON work_items(tenant_id, due_at) WHERE status != 'completed';

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_unread 
  ON notifications(tenant_id, user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_recent 
  ON notifications(tenant_id, user_id, created_at DESC);
