-- Add missing columns to assets table for APM feature parity
-- These columns are required by the advanced APM seed scripts and RLS policies

BEGIN;

ALTER TABLE assets 
  ADD COLUMN IF NOT EXISTS asset_tag TEXT,
  ADD COLUMN IF NOT EXISTS sector TEXT;

-- Add unique constraint for (tenant_id, asset_tag) if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_assets_tenant_tag'
    ) THEN
        ALTER TABLE assets ADD CONSTRAINT uq_assets_tenant_tag UNIQUE (tenant_id, asset_tag);
    END IF;
END $$;

-- Create index for sector searching
CREATE INDEX IF NOT EXISTS idx_assets_sector ON assets(sector);
CREATE INDEX IF NOT EXISTS idx_assets_tag ON assets(asset_tag);

COMMIT;
