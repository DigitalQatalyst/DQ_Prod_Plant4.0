-- Create secrets and certificates management for transmission protocols
-- Requirements: 2.8

-- Create enum for secret types
CREATE TYPE secret_type AS ENUM (
  'certificate',
  'private_key',
  'api_key',
  'password',
  'token',
  'shared_secret'
);

-- Create enum for certificate types specific to transmission
CREATE TYPE certificate_type AS ENUM (
  'iec61850_server',
  'iec61850_client',
  'dnp3_tls',
  'scada_auth',
  'web_server',
  'code_signing',
  'ca_root',
  'ca_intermediate'
);

-- Create enum for secret status
CREATE TYPE secret_status AS ENUM (
  'active',
  'expired',
  'revoked',
  'pending_rotation',
  'archived'
);

-- Create secrets_certificates table
CREATE TABLE secrets_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic metadata
  name TEXT NOT NULL,
  description TEXT,
  secret_type secret_type NOT NULL,
  certificate_type certificate_type, -- Only for certificate types
  
  -- Secret data (encrypted at rest)
  encrypted_value TEXT, -- Base64 encoded encrypted secret
  encryption_key_id TEXT NOT NULL, -- Reference to encryption key
  
  -- Certificate-specific fields
  subject_dn TEXT, -- Distinguished Name for certificates
  issuer_dn TEXT,
  serial_number TEXT,
  fingerprint_sha256 TEXT,
  
  -- Lifecycle management
  status secret_status NOT NULL DEFAULT 'active',
  created_date TIMESTAMPTZ DEFAULT now(),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  last_rotated TIMESTAMPTZ,
  rotation_interval_days INTEGER DEFAULT 365,
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  used_by_systems TEXT[] DEFAULT '{}',
  
  -- Transmission protocol context
  protocol TEXT, -- 'IEC61850', 'DNP3', 'IEC60870-5-104', etc.
  asset_ids TEXT[] DEFAULT '{}', -- Assets this secret/cert is used for
  zone_ids TEXT[] DEFAULT '{}', -- Security zones this applies to
  
  -- Access control
  access_roles transmission_role[] DEFAULT '{}',
  requires_approval BOOLEAN DEFAULT true,
  
  -- Audit trail
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_secret_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT valid_rotation_interval CHECK (rotation_interval_days > 0),
  CONSTRAINT valid_usage_count CHECK (usage_count >= 0),
  CONSTRAINT certificate_requires_type CHECK (
    secret_type != 'certificate' OR certificate_type IS NOT NULL
  ),
  CONSTRAINT valid_certificate_dates CHECK (
    valid_from IS NULL OR valid_until IS NULL OR valid_until > valid_from
  )
);

-- Create certificate_rotation_history table
CREATE TABLE certificate_rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES secrets_certificates(id) ON DELETE CASCADE,
  
  -- Rotation details
  rotation_type TEXT NOT NULL, -- 'scheduled', 'emergency', 'manual'
  old_fingerprint TEXT,
  new_fingerprint TEXT,
  rotation_reason TEXT,
  
  -- Timing
  rotation_requested_at TIMESTAMPTZ NOT NULL,
  rotation_completed_at TIMESTAMPTZ,
  
  -- Personnel
  requested_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  error_message TEXT,
  
  -- Affected systems
  affected_systems TEXT[] DEFAULT '{}',
  rollback_plan TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create api_keys table for programmatic access
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Key metadata
  name TEXT NOT NULL,
  description TEXT,
  key_hash TEXT NOT NULL, -- Hashed API key for verification
  key_prefix TEXT NOT NULL, -- First few characters for identification
  
  -- Access control
  owner_user_id UUID REFERENCES security_users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT '{}',
  allowed_ips INET[] DEFAULT '{}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  
  -- Lifecycle
  status secret_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_used TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Transmission context
  allowed_protocols TEXT[] DEFAULT '{}', -- Protocols this key can access
  allowed_asset_types TEXT[] DEFAULT '{}',
  allowed_zones TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_api_key_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT unique_key_hash UNIQUE (key_hash),
  CONSTRAINT valid_rate_limit CHECK (rate_limit_per_hour > 0),
  CONSTRAINT valid_usage_count_api CHECK (usage_count >= 0)
);

-- Create service_principals table for system-to-system authentication
CREATE TABLE service_principals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Principal identity
  name TEXT NOT NULL,
  description TEXT,
  principal_type TEXT NOT NULL, -- 'application', 'service', 'device'
  
  -- Authentication
  client_id TEXT NOT NULL,
  client_secret_hash TEXT, -- Hashed secret
  certificate_id UUID REFERENCES secrets_certificates(id) ON DELETE SET NULL,
  
  -- Authorization
  roles transmission_role[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  scopes TEXT[] DEFAULT '{}',
  
  -- Network restrictions
  allowed_source_ips INET[] DEFAULT '{}',
  allowed_protocols TEXT[] DEFAULT '{}',
  
  -- Lifecycle
  status secret_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_authenticated TIMESTAMPTZ,
  authentication_count INTEGER DEFAULT 0,
  
  -- Transmission context
  associated_systems TEXT[] DEFAULT '{}',
  zone_access TEXT[] DEFAULT '{}',
  
  created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_service_principal_name UNIQUE (tenant_id, name),
  CONSTRAINT unique_client_id UNIQUE (client_id),
  CONSTRAINT valid_auth_count CHECK (authentication_count >= 0),
  CONSTRAINT has_authentication_method CHECK (
    client_secret_hash IS NOT NULL OR certificate_id IS NOT NULL
  )
);

-- Create indexes for performance optimization
CREATE INDEX idx_secrets_certificates_tenant ON secrets_certificates(tenant_id);
CREATE INDEX idx_secrets_certificates_type ON secrets_certificates(secret_type);
CREATE INDEX idx_secrets_certificates_status ON secrets_certificates(status);
CREATE INDEX idx_secrets_certificates_expiry ON secrets_certificates(valid_until);
CREATE INDEX idx_secrets_certificates_protocol ON secrets_certificates(protocol);
CREATE INDEX idx_secrets_certificates_fingerprint ON secrets_certificates(fingerprint_sha256);

CREATE INDEX idx_cert_rotation_history_tenant ON certificate_rotation_history(tenant_id);
CREATE INDEX idx_cert_rotation_history_cert ON certificate_rotation_history(certificate_id);
CREATE INDEX idx_cert_rotation_history_status ON certificate_rotation_history(status);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_owner ON api_keys(owner_user_id);
CREATE INDEX idx_api_keys_status ON api_keys(status);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expiry ON api_keys(expires_at);

CREATE INDEX idx_service_principals_tenant ON service_principals(tenant_id);
CREATE INDEX idx_service_principals_client_id ON service_principals(client_id);
CREATE INDEX idx_service_principals_status ON service_principals(status);
CREATE INDEX idx_service_principals_type ON service_principals(principal_type);

-- Enable Row Level Security
-- ALTER TABLE secrets_certificates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE certificate_rotation_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_principals ENABLE ROW LEVEL SECURITY;

-- RLS policies for secrets_certificates
-- CREATE POLICY "secrets_certificates_tenant_isolation" ON secrets_certificates
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "secrets_certificates_read_access" ON secrets_certificates
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor') OR
--       (current_setting('app.user_role')::transmission_role = ANY(access_roles))
--     )
--   );

-- CREATE POLICY "secrets_certificates_write_access" ON secrets_certificates
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator')
--   );

-- RLS policies for certificate_rotation_history
-- CREATE POLICY "cert_rotation_history_tenant_isolation" ON certificate_rotation_history
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "cert_rotation_history_read_access" ON certificate_rotation_history
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'auditor')
--   );

-- RLS policies for api_keys
-- CREATE POLICY "api_keys_tenant_isolation" ON api_keys
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "api_keys_read_access" ON api_keys
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor') OR
--       owner_user_id = current_setting('app.user_id')::uuid
--     )
--   );

-- CREATE POLICY "api_keys_owner_write_access" ON api_keys
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     owner_user_id = current_setting('app.user_id')::uuid
--   );

-- RLS policies for service_principals
-- CREATE POLICY "service_principals_tenant_isolation" ON service_principals
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- CREATE POLICY "service_principals_read_access" ON service_principals
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator', 'supervisor', 'engineer')
--   );

-- CREATE POLICY "service_principals_write_access" ON service_principals
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') IN ('administrator')
--   );

-- Create updated_at triggers
CREATE TRIGGER update_secrets_certificates_updated_at 
  BEFORE UPDATE ON secrets_certificates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cert_rotation_history_updated_at 
  BEFORE UPDATE ON certificate_rotation_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_principals_updated_at 
  BEFORE UPDATE ON service_principals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();