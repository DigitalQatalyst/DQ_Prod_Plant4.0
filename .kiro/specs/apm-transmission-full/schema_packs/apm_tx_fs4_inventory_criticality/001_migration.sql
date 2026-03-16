-- FS4: Asset Inventory & Criticality - Migration Script
-- This script extends the baseline schema with transmission-specific asset inventory,
-- criticality scoring, FMEA library, lifecycle tracking, and spare parts management.
-- 
-- Requirements: 1.1-1.10, 2.1-2.7, 3.1-3.7, 4.1-4.6, 5.1-5.7
--
-- This migration is idempotent and can be safely executed multiple times.

-- =============================================================================
-- SUBTASK 2.1: Extend asset_type enum with transmission types
-- Requirements: 1.1
-- =============================================================================

-- Check if asset_type enum exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM ('placeholder');
  END IF;
END $$;

-- Add transmission asset types idempotently
DO $$
BEGIN
  -- power_transformer
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'power_transformer' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'power_transformer';
  END IF;

  -- circuit_breaker
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'circuit_breaker' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'circuit_breaker';
  END IF;

  -- disconnect_switch
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'disconnect_switch' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'disconnect_switch';
  END IF;

  -- busbar
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'busbar' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'busbar';
  END IF;

  -- transmission_line
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'transmission_line' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'transmission_line';
  END IF;

  -- line_terminal
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'line_terminal' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'line_terminal';
  END IF;

  -- substation_bay
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'substation_bay' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'substation_bay';
  END IF;

  -- protection_relay
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'protection_relay' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'protection_relay';
  END IF;

  -- ct (Current Transformer)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'ct' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'ct';
  END IF;

  -- vt (Voltage Transformer)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'vt' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'vt';
  END IF;

  -- surge_arrester
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'surge_arrester' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'surge_arrester';
  END IF;

  -- reactor
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'reactor' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'reactor';
  END IF;

  -- capacitor_bank
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'capacitor_bank' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'capacitor_bank';
  END IF;

  -- station_battery
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'station_battery' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'station_battery';
  END IF;

  -- charger
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'charger' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'charger';
  END IF;

  -- scada_rtu
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'scada_rtu' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'scada_rtu';
  END IF;

  -- plc_ied
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'plc_ied' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'plc_ied';
  END IF;

  -- meter
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'meter' 
    AND enumtypid = 'asset_type'::regtype
  ) THEN
    ALTER TYPE asset_type ADD VALUE 'meter';
  END IF;
END $$;

-- =============================================================================
-- SUBTASK 2.2: Extend assets table with transmission columns
-- Requirements: 1.2, 1.3, 1.5, 4.1
-- =============================================================================

-- Create assets table if it doesn't exist (baseline)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  location TEXT NOT NULL,
  operational_status TEXT NOT NULL DEFAULT 'offline',
  criticality TEXT NOT NULL DEFAULT 'Standard',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add transmission-specific columns idempotently
ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'power_transmission',
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS substation_id UUID,
  ADD COLUMN IF NOT EXISTS bay_code TEXT,
  ADD COLUMN IF NOT EXISTS voltage_kv NUMERIC,
  ADD COLUMN IF NOT EXISTS commissioning_date DATE,
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT,
  ADD COLUMN IF NOT EXISTS owner_org_unit TEXT,
  ADD COLUMN IF NOT EXISTS asset_tag TEXT;

-- Add check constraint for lifecycle_stage values (idempotent)
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
CREATE INDEX IF NOT EXISTS idx_assets_sector_type 
  ON assets(sector, asset_type);

CREATE INDEX IF NOT EXISTS idx_assets_sector_status 
  ON assets(sector, operational_status);

CREATE INDEX IF NOT EXISTS idx_assets_parent 
  ON assets(parent_asset_id) WHERE parent_asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assets_location 
  ON assets(location);

-- =============================================================================
-- SUBTASK 2.3: Create asset_relationships table
-- Requirements: 1.6, 1.7, 1.8
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  to_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_asset_relationship UNIQUE(from_asset_id, to_asset_id, relation_type)
);

-- Add check constraint for relation_type values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_relation_type'
  ) THEN
    ALTER TABLE asset_relationships
      ADD CONSTRAINT chk_relation_type
      CHECK (relation_type IN ('connected_to', 'feeds_to', 'protects', 'in_bay'));
  END IF;
END $$;

-- Create indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_asset_rel_from 
  ON asset_relationships(from_asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_rel_to 
  ON asset_relationships(to_asset_id);

-- =============================================================================
-- SUBTASK 2.4: Create asset_lifecycle_events table
-- Requirements: 4.3, 4.4, 4.5
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint for stage values (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_lifecycle_event_stage'
  ) THEN
    ALTER TABLE asset_lifecycle_events
      ADD CONSTRAINT chk_lifecycle_event_stage
      CHECK (stage IN (
        'design', 'procure', 'install', 'commission',
        'operate', 'maintain', 'refurbish', 'retire'
      ));
  END IF;
END $$;

-- Create index for lifecycle event queries
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_asset_time
  ON asset_lifecycle_events(asset_id, occurred_at DESC);

-- =============================================================================
-- SUBTASK 2.5: Create asset_criticality_model table
-- Requirements: 2.2, 2.3
-- =============================================================================

CREATE TABLE IF NOT EXISTS asset_criticality_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  safety_weight NUMERIC NOT NULL DEFAULT 0.25,
  production_weight NUMERIC NOT NULL DEFAULT 0.25,
  environmental_weight NUMERIC NOT NULL DEFAULT 0.25,
  detectability_weight NUMERIC NOT NULL DEFAULT 0.25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_criticality_model_sector UNIQUE(sector)
);

-- =============================================================================
-- SUBTASK 2.6: Extend fmea_entries table
-- Requirements: 3.1, 3.2, 3.3, 3.4
-- =============================================================================

-- Create fmea_entries table if it doesn't exist
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
  CONSTRAINT uq_fmea_asset_mode UNIQUE(asset_type, failure_mode)
);

-- Add check constraints for severity, occurrence, detection (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_fmea_severity'
  ) THEN
    ALTER TABLE fmea_entries
      ADD CONSTRAINT chk_fmea_severity
      CHECK (severity >= 1 AND severity <= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_fmea_occurrence'
  ) THEN
    ALTER TABLE fmea_entries
      ADD CONSTRAINT chk_fmea_occurrence
      CHECK (occurrence >= 1 AND occurrence <= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_fmea_detection'
  ) THEN
    ALTER TABLE fmea_entries
      ADD CONSTRAINT chk_fmea_detection
      CHECK (detection >= 1 AND detection <= 10);
  END IF;
END $$;

-- =============================================================================
-- SUBTASK 2.7: Ensure spare_parts and asset_spare_parts tables exist
-- Requirements: 5.1, 5.2, 5.3, 5.7
-- =============================================================================

-- Create spare_parts table if it doesn't exist
CREATE TABLE IF NOT EXISTS spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  applicable_asset_types TEXT[],
  lead_time_days INTEGER,
  on_hand_quantity INTEGER DEFAULT 0,
  reorder_point INTEGER,
  unit_cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create asset_spare_parts linkage table if it doesn't exist
CREATE TABLE IF NOT EXISTS asset_spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  spare_part_id UUID NOT NULL REFERENCES spare_parts(id) ON DELETE CASCADE,
  quantity_required INTEGER NOT NULL DEFAULT 1,
  is_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_asset_spare UNIQUE(asset_id, spare_part_id)
);

-- Add check constraint for quantity_required (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_spare_quantity_nonnegative'
  ) THEN
    ALTER TABLE asset_spare_parts
      ADD CONSTRAINT chk_spare_quantity_nonnegative
      CHECK (quantity_required >= 0);
  END IF;
END $$;

-- Create index for spare parts queries
CREATE INDEX IF NOT EXISTS idx_asset_spare_parts_asset
  ON asset_spare_parts(asset_id);

CREATE INDEX IF NOT EXISTS idx_asset_spare_parts_spare
  ON asset_spare_parts(spare_part_id);

-- =============================================================================
-- Migration Complete
-- =============================================================================
