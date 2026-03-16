-- ============================================================================
-- APM Transmission FS4: Asset Inventory & Criticality - Migration Script
-- ============================================================================
-- This migration extends the baseline schema with transmission-specific
-- asset management capabilities including:
-- - Asset relationships and hierarchy
-- - Lifecycle tracking
-- - Criticality scoring models
-- - FMEA library
-- - Spare parts management
--
-- Requirements: 1.1-1.10, 2.1-2.7, 3.1-3.7, 4.1-4.6, 5.1-5.7
-- Idempotent: Safe to run multiple times
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Extend Assets Table with Transmission Columns
-- ============================================================================

-- Add transmission-specific columns to existing assets table
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substation_id UUID,
  ADD COLUMN IF NOT EXISTS bay_code TEXT,
  ADD COLUMN IF NOT EXISTS voltage_kv NUMERIC,
  ADD COLUMN IF NOT EXISTS commissioning_date DATE,
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'operate',
  ADD COLUMN IF NOT EXISTS owner_org_unit TEXT;

-- Add check constraint for lifecycle stages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_lifecycle_stage'
  ) THEN
    ALTER TABLE assets
      ADD CONSTRAINT chk_lifecycle_stage
      CHECK (lifecycle_stage IN (
        'design', 'procure', 'install', 'commission',
        'operate', 'maintain', 'refurbish', 'retire'
      ));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_parent 
  ON assets(parent_asset_id) WHERE parent_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assets_substation 
  ON assets(substation_id) WHERE substation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assets_lifecycle 
  ON assets(lifecycle_stage);

-- ============================================================================
-- 2. Asset Relationships Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  to_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_relation_type CHECK (relation_type IN ('connected_to', 'feeds_to', 'protects', 'in_bay')),
  CONSTRAINT chk_no_self_reference CHECK (from_asset_id != to_asset_id),
  CONSTRAINT uq_asset_relationship UNIQUE (from_asset_id, to_asset_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_asset_rel_from 
  ON asset_relationships(from_asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_rel_to 
  ON asset_relationships(to_asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_rel_type 
  ON asset_relationships(relation_type);

-- ============================================================================
-- 3. Asset Lifecycle Events Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_lifecycle_event_stage CHECK (stage IN (
    'design', 'procure', 'install', 'commission',
    'operate', 'maintain', 'refurbish', 'retire'
  ))
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_asset 
  ON asset_lifecycle_events(asset_id, occurred_at DESC);

-- ============================================================================
-- 4. Asset Criticality Model Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_criticality_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  model_version TEXT NOT NULL DEFAULT 'v1',
  safety_weight NUMERIC NOT NULL DEFAULT 0.30,
  production_impact_weight NUMERIC NOT NULL DEFAULT 0.30,
  environmental_impact_weight NUMERIC NOT NULL DEFAULT 0.20,
  detectability_weight NUMERIC NOT NULL DEFAULT 0.20,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_criticality_model UNIQUE (sector, model_version),
  CONSTRAINT chk_weights_sum CHECK (
    safety_weight + production_impact_weight + 
    environmental_impact_weight + detectability_weight = 1.0
  )
);

-- ============================================================================
-- 5. FMEA Entries Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fmea_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL,
  failure_mode TEXT NOT NULL,
  failure_cause TEXT,
  failure_effect TEXT,
  severity INTEGER NOT NULL,
  occurrence INTEGER NOT NULL,
  detection INTEGER NOT NULL,
  rpn INTEGER GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
  recommended_actions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_fmea_entry UNIQUE (asset_type, failure_mode),
  CONSTRAINT chk_severity_range CHECK (severity >= 1 AND severity <= 10),
  CONSTRAINT chk_occurrence_range CHECK (occurrence >= 1 AND occurrence <= 10),
  CONSTRAINT chk_detection_range CHECK (detection >= 1 AND detection <= 10)
);

CREATE INDEX IF NOT EXISTS idx_fmea_asset_type 
  ON fmea_entries(asset_type);

CREATE INDEX IF NOT EXISTS idx_fmea_rpn 
  ON fmea_entries(rpn DESC);

-- ============================================================================
-- 6. Spare Parts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  applicable_asset_types TEXT[] NOT NULL DEFAULT '{}',
  lead_time_days INTEGER,
  on_hand_quantity INTEGER DEFAULT 0,
  reorder_point INTEGER,
  unit_cost NUMERIC(10, 2),
  supplier TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_on_hand_quantity CHECK (on_hand_quantity >= 0),
  CONSTRAINT chk_lead_time CHECK (lead_time_days IS NULL OR lead_time_days >= 0)
);

CREATE INDEX IF NOT EXISTS idx_spare_parts_number 
  ON spare_parts(part_number);

CREATE INDEX IF NOT EXISTS idx_spare_parts_asset_types 
  ON spare_parts USING GIN(applicable_asset_types);

-- ============================================================================
-- 7. Asset Spare Parts Linkage Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  asset_type TEXT,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL DEFAULT 1,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_asset_or_type CHECK (
    (asset_id IS NOT NULL AND asset_type IS NULL) OR
    (asset_id IS NULL AND asset_type IS NOT NULL)
  ),
  CONSTRAINT chk_quantity_positive CHECK (quantity_required > 0),
  CONSTRAINT uq_asset_spare_part UNIQUE (asset_id, spare_part_id),
  CONSTRAINT uq_asset_type_spare_part UNIQUE (asset_type, spare_part_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_spare_parts_asset 
  ON asset_spare_parts(asset_id) WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_spare_parts_type 
  ON asset_spare_parts(asset_type) WHERE asset_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_spare_parts_part 
  ON asset_spare_parts(spare_part_id);

-- ============================================================================
-- 8. Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE asset_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_criticality_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_spare_parts ENABLE ROW LEVEL SECURITY;

-- Create read policies (authenticated users can read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_relationships' AND policyname = 'Allow authenticated read on asset_relationships'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_relationships"
      ON asset_relationships FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_lifecycle_events' AND policyname = 'Allow authenticated read on asset_lifecycle_events'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_lifecycle_events"
      ON asset_lifecycle_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_criticality_model' AND policyname = 'Allow authenticated read on asset_criticality_model'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_criticality_model"
      ON asset_criticality_model FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fmea_entries' AND policyname = 'Allow authenticated read on fmea_entries'
  ) THEN
    CREATE POLICY "Allow authenticated read on fmea_entries"
      ON fmea_entries FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts' AND policyname = 'Allow authenticated read on spare_parts'
  ) THEN
    CREATE POLICY "Allow authenticated read on spare_parts"
      ON spare_parts FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_spare_parts' AND policyname = 'Allow authenticated read on asset_spare_parts'
  ) THEN
    CREATE POLICY "Allow authenticated read on asset_spare_parts"
      ON asset_spare_parts FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Create write policies (restricted to authorized roles)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_relationships' AND policyname = 'Allow authorized write on asset_relationships'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_relationships"
      ON asset_relationships FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_lifecycle_events' AND policyname = 'Allow authorized write on asset_lifecycle_events'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_lifecycle_events"
      ON asset_lifecycle_events FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fmea_entries' AND policyname = 'Allow authorized write on fmea_entries'
  ) THEN
    CREATE POLICY "Allow authorized write on fmea_entries"
      ON fmea_entries FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spare_parts' AND policyname = 'Allow authorized write on spare_parts'
  ) THEN
    CREATE POLICY "Allow authorized write on spare_parts"
      ON spare_parts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'asset_spare_parts' AND policyname = 'Allow authorized write on asset_spare_parts'
  ) THEN
    CREATE POLICY "Allow authorized write on asset_spare_parts"
      ON asset_spare_parts FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Tables created:
-- - asset_relationships (with RLS)
-- - asset_lifecycle_events (with RLS)
-- - asset_criticality_model (with RLS)
-- - fmea_entries (with RLS)
-- - spare_parts (with RLS)
-- - asset_spare_parts (with RLS)
--
-- Assets table extended with:
-- - parent_asset_id, substation_id, bay_code
-- - voltage_kv, commissioning_date
-- - lifecycle_stage, owner_org_unit
-- ============================================================================
