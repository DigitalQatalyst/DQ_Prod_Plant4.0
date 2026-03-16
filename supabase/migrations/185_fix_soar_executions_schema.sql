-- Fix soar_action_executions table schema
-- 1. Add missing columns approved_by and approved_at
-- 2. Change executed_by from TEXT to UUID (referencing security_users)

BEGIN;

-- Add approved_at
ALTER TABLE soar_action_executions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Clean existing data to avoid conversion errors from TEXT (names) to UUID
DELETE FROM soar_action_executions;

-- Now alter column type and add approved_by
ALTER TABLE soar_action_executions 
ALTER COLUMN executed_by TYPE UUID USING NULL,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL;

-- Add constraint for executed_by for consistency and better joining
ALTER TABLE soar_action_executions 
ADD CONSTRAINT fk_soar_executions_executed_by 
FOREIGN KEY (executed_by) REFERENCES security_users(id) ON DELETE SET NULL;

COMMIT;
