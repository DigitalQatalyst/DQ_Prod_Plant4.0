-- Migration 019: Create Compliance & Safety Tables
-- Creates tables for asset compliance records and certifications
-- Simulates realistic DEWA/Power Transmission compliance scenarios
-- Requirements: 5.6, 6.0

-- =============================================================================
-- Compliance Records Table
-- =============================================================================

CREATE TABLE compliance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  compliance_type TEXT NOT NULL, -- 'certification', 'inspection', 'calibration', 'audit'
  authority TEXT NOT NULL, -- 'Internal', 'Regulatory Body', 'Third Party'
  status TEXT NOT NULL DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'warning', 'expired', 'pending'
  
  description TEXT,
  reference_number TEXT, -- Certificate ID or Document Ref
  
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  next_inspection_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_compliance_tenant ON compliance_records(tenant_id);
CREATE INDEX idx_compliance_asset ON compliance_records(asset_id);
CREATE INDEX idx_compliance_status ON compliance_records(status);
CREATE INDEX idx_compliance_expiry ON compliance_records(expiry_date);
