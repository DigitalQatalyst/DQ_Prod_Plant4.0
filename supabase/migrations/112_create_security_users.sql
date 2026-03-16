-- Create security users and roles for cybersecurity feature area
-- Requirements: 2.1, 8.2

-- Create enum for transmission-specific roles
CREATE TYPE transmission_role AS ENUM (
  'operator',
  'engineer', 
  'supervisor',
  'administrator',
  'auditor'
);

-- Create enum for user status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended'
);

-- Create security_users table
CREATE TABLE security_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role transmission_role NOT NULL DEFAULT 'operator',
  status user_status NOT NULL DEFAULT 'active',
  last_login TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  mfa_enabled BOOLEAN DEFAULT false,
  access_zones TEXT[] DEFAULT '{}',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_username_per_tenant UNIQUE (tenant_id, username),
  CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email),
  CONSTRAINT valid_failed_attempts CHECK (failed_login_attempts >= 0)
);

-- Create indexes for performance optimization
CREATE INDEX idx_security_users_tenant ON security_users(tenant_id);
CREATE INDEX idx_security_users_role ON security_users(role);
CREATE INDEX idx_security_users_status ON security_users(status);
CREATE INDEX idx_security_users_email ON security_users(email);
CREATE INDEX idx_security_users_username ON security_users(username);
CREATE INDEX idx_security_users_last_login ON security_users(last_login);

-- Enable Row Level Security
-- ALTER TABLE security_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
-- CREATE POLICY "security_users_tenant_isolation" ON security_users
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create RLS policy for role-based access (users can see others based on their role)
-- CREATE POLICY "security_users_role_access" ON security_users
--   FOR SELECT USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator', 'supervisor') OR
--       id = current_setting('app.user_id')::uuid
--     )
--   );

-- Create RLS policy for user updates (users can update themselves, admins can update others)
-- CREATE POLICY "security_users_update_access" ON security_users
--   FOR UPDATE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     (
--       current_setting('app.user_role') IN ('administrator') OR
--       (id = current_setting('app.user_id')::uuid AND current_setting('app.user_role') IN ('supervisor', 'engineer', 'operator'))
--     )
--   );

-- Create RLS policy for user creation (only admins can create users)
-- CREATE POLICY "security_users_insert_access" ON security_users
--   FOR INSERT WITH CHECK (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') = 'administrator'
--   );

-- Create RLS policy for user deletion (only admins can delete users)
-- CREATE POLICY "security_users_delete_access" ON security_users
--   FOR DELETE USING (
--     tenant_id = current_setting('app.current_tenant_id')::uuid AND
--     current_setting('app.user_role') = 'administrator'
--   );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_users_updated_at 
  BEFORE UPDATE ON security_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();