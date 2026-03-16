-- Migration 014: Create Discovery Tables
-- Cycle 2: Discovery & Onboarding
-- Requirements: 2.1, 2.3, 2.5, 2.9

-- Discovery Jobs Table
CREATE TABLE discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('network', 'topology', 'geographic')),
  scope JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  found_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  errors JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_discovery_jobs_tenant ON discovery_jobs(tenant_id);
CREATE INDEX idx_discovery_jobs_status ON discovery_jobs(status);

-- Discovery Agents Table
CREATE TABLE discovery_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ied_gateway', 'scada_bridge', 'rtu_collector')),
  protocols TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  assigned_scopes JSONB DEFAULT '[]',
  last_run TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_discovery_agents_tenant ON discovery_agents(tenant_id);
CREATE INDEX idx_discovery_agents_status ON discovery_agents(status);

-- Candidate Assets Table
CREATE TABLE candidate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  discovery_job_id UUID NOT NULL REFERENCES discovery_jobs(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  suggested_type_id UUID REFERENCES asset_types(id),
  suggested_hierarchy JSONB DEFAULT '{}',
  matched_existing_asset_id UUID REFERENCES assets(id),
  confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'merged', 'rejected')),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_candidate_assets_tenant ON candidate_assets(tenant_id);
CREATE INDEX idx_candidate_assets_job ON candidate_assets(discovery_job_id);
CREATE INDEX idx_candidate_assets_status ON candidate_assets(status);

-- Asset Imports Table
CREATE TABLE asset_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'mapping', 'preview', 'completed', 'failed')),
  source_type TEXT NOT NULL CHECK (source_type IN ('csv', 'excel', 'api')),
  record_count INTEGER DEFAULT 0,
  imported_count INTEGER DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_asset_imports_tenant ON asset_imports(tenant_id);
