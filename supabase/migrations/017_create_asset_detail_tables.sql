-- Migration 017: Create Asset Detail Tables
-- Creates tables for asset documents and audit logs
-- Requirements: 5.5, 5.6

-- =============================================================================
-- Asset Documents
-- =============================================================================

CREATE TABLE asset_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('manual', 'drawing', 'certificate', 'report', 'other')),
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_asset_documents_tenant ON asset_documents(tenant_id);
CREATE INDEX idx_asset_documents_asset ON asset_documents(asset_id);
CREATE INDEX idx_asset_documents_category ON asset_documents(tenant_id, category);

-- =============================================================================
-- Asset Audit Log
-- =============================================================================

CREATE TABLE asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'status_change', 'maintenance')),
  changed_fields TEXT[], -- Array of field names that changed
  old_values JSONB, -- Snapshot of values before change
  new_values JSONB, -- Snapshot of values after change
  user_id UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now(),
  details TEXT
);

CREATE INDEX idx_asset_audit_tenant ON asset_audit_log(tenant_id);
CREATE INDEX idx_asset_audit_asset ON asset_audit_log(asset_id);
CREATE INDEX idx_asset_audit_action ON asset_audit_log(tenant_id, action);
CREATE INDEX idx_asset_audit_time ON asset_audit_log(tenant_id, performed_at DESC);
